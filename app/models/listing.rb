class Listing < ApplicationRecord
  MAX_PHOTOS = 30
  MAX_VIDEOS = 10
  MAX_GUESTS = 16
  # Every home is in Kenya and priced in shillings.
  COUNTRY = "Kenya"
  CURRENCY = "KES"
  PROPERTY_TYPES = %w[house apartment cottage villa cabin bungalow studio room].freeze
  # What a guest gets back when they cancel; owner cancellations always refund in full.
  CANCELLATION_POLICIES = {
    "flexible" => "Full refund if you cancel before the day of check-in.",
    "moderate" => "Full refund if you cancel at least 5 days before check-in, half after that.",
    "strict" => "Half refund if you cancel at least 7 days before check-in, nothing after that."
  }.freeze
  TIME_FORMAT = /\A([01]\d|2[0-3]):[0-5]\d\z/

  has_many :photos, -> { order(:position) }, class_name: "ListingPhoto", dependent: :delete_all,
    inverse_of: :listing, autosave: true, validate: false # has_photos validates each photo
  has_many :videos, -> { order(:position) }, class_name: "ListingVideo", dependent: :delete_all,
    inverse_of: :listing, autosave: true, validate: false # has_valid_videos validates each video
  has_many :listing_amenities, dependent: :delete_all
  has_many :amenities, through: :listing_amenities
  has_many :bookings, dependent: :restrict_with_error
  has_many :availability_blocks, dependent: :delete_all
  has_many :reviews, dependent: :restrict_with_error
  has_many :saved_listings, dependent: :delete_all
  belongs_to :category, optional: true

  enum :status, { draft: "draft", published: "published", unlisted: "unlisted" }, default: "published", validate: true
  enum :booking_type, { instant: "instant", request: "request" }, default: "instant", validate: true, prefix: :books
  enum :cancellation_policy, CANCELLATION_POLICIES.keys.index_by(&:itself), default: "flexible", validate: true,
    suffix: :policy

  normalizes :title, :address, with: ->(value) { value.strip }

  before_validation :derive_country_and_currency, :assign_slug

  validates :title, presence: true, length: { maximum: 120 }
  validates :address, presence: true, length: { maximum: 200 }
  validates :description, :house_rules, length: { maximum: 5000 }
  validates :max_guests, numericality: { only_integer: true, in: 1..MAX_GUESTS }
  # Minor units (cents) of the listing's currency.
  validates :nightly_price_cents, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 10_000_000 }
  validates :cleaning_charge_cents, numericality: { only_integer: true, in: 0..1_000_000 }
  validates :category, presence: { message: "must be one of your categories" }, if: :category_id?
  validates :property_type, inclusion: { in: PROPERTY_TYPES, message: "must be one of the listed types" }
  validates :bedrooms, numericality: { only_integer: true, in: 0..50 }
  validates :beds, :bathrooms, numericality: { only_integer: true, in: 1..50 }
  validates :check_in_time, :check_out_time, format: { with: TIME_FORMAT, message: "must be a time like 14:00" }
  validates :min_nights, numericality: { only_integer: true, in: 1..365 }
  validates :max_nights, numericality: { only_integer: true, in: 1..365 }
  validates :max_nights, numericality: { greater_than_or_equal_to: :min_nights, message: "must be at least the minimum nights" },
    if: -> { min_nights.is_a?(Integer) && max_nights.is_a?(Integer) }
  validates :check_in_instructions, :wifi_details, length: { maximum: 5000 }
  validates :licence_number, length: { maximum: 60 }
  validate :has_photos, :has_valid_videos

  scope :kept, -> { where(deleted_at: nil) }

  scope :matching, ->(query) {
    next all if query.blank?

    pattern = "%#{sanitize_sql_like(query.strip)}%"
    where("listings.title ILIKE :pattern OR listings.address ILIKE :pattern", pattern:)
  }

  # Homes free for the whole stay: no active booking and no blocked night in it.
  scope :available_between, ->(check_in, check_out) {
    where.not(id: Booking.active.where("daterange(check_in, check_out) && daterange(?, ?)", check_in, check_out).select(:listing_id))
      .where.not(id: AvailabilityBlock.overlapping(check_in, check_out).select(:listing_id))
  }

  def deleted? = deleted_at.present?

  def cancellation_policy_text = CANCELLATION_POLICIES.fetch(cancellation_policy)

  # Nights guests can't book over the next year: [from, to) ranges, to exclusive.
  def unavailable_ranges(from: Time.zone.today, to: Time.zone.today + 1.year)
    booked = bookings.active.where("check_out > ? AND check_in < ?", from, to).pluck(:check_in, :check_out)
    blocked = availability_blocks.where("ends_on > ? AND starts_on < ?", from, to).pluck(:starts_on, :ends_on)
    (booked + blocked).sort.map { |start, finish| { from: start, to: finish } }
  end

  def nights_free?(check_in, check_out, except: nil)
    taken = bookings.active.where("daterange(check_in, check_out) && daterange(?, ?)", check_in, check_out)
    taken = taken.where.not(id: except.id) if except
    !taken.exists? && !availability_blocks.overlapping(check_in, check_out).exists?
  end

  # Guests with a stay still to come keep their home; it can't be deleted yet.
  def upcoming_stays
    bookings.active.where(check_out: Time.zone.today..)
  end

  # A home nobody has booked is removed for good. A booked one is hidden from
  # guests and from the owner's list, and stays in the records of its bookings.
  # Returns false while guests still have stays to come.
  def delete_or_archive!
    with_lock do
      return false if upcoming_stays.exists?
      return destroy! unless bookings.exists?

      update_columns(deleted_at: Time.current, status: "unlisted", featured: false, updated_at: Time.current)
    end
    true
  end

  # Stages a new photo list in the given order (first is the cover). Old rows
  # are destroyed and new ones inserted when the listing saves, in one go.
  def photo_urls=(urls)
    photos.each(&:mark_for_destruction)
    Array(urls).first(MAX_PHOTOS + 1).each_with_index do |url, index|
      photos.build(url: url.to_s.strip, position: index)
    end
  end

  def current_photos
    photos.reject(&:marked_for_destruction?)
  end

  def video_urls=(urls)
    videos.each(&:mark_for_destruction)
    Array(urls).first(MAX_VIDEOS + 1).each_with_index do |url, index|
      videos.build(url: url.to_s.strip, position: index)
    end
  end

  def current_videos
    videos.reject(&:marked_for_destruction?)
  end

  def amenity_keys=(keys)
    self.amenities = Amenity.where(key: Array(keys).map(&:to_s))
  end

  # Price for a stay; the server never trusts a client total.
  def quote(check_in, check_out)
    nights = (check_out - check_in).to_i
    { nights:, currency:, nightly_price_cents:, cleaning_charge_cents:,
      total_cents: nights * nightly_price_cents + cleaning_charge_cents }
  end

  private
    # The owner types the town and county; "Kenya" is added when it's missing,
    # so every address reads "Town, County, Kenya".
    def derive_country_and_currency
      self.country = COUNTRY
      self.currency = CURRENCY
      return if address.blank?

      parts = address.split(",").map(&:strip).reject(&:blank?)
      parts.pop if parts.last.to_s.casecmp?(COUNTRY)
      self.address = [ *parts, COUNTRY ].join(", ")
    end

    def assign_slug
      return if slug.present? || title.blank?

      base = title.parameterize.presence || "stay"
      self.slug = self.class.exists?(slug: base) ? "#{base}-#{SecureRandom.hex(3)}" : base
    end

    def has_photos
      kept = current_photos
      errors.add(:photos, "must include at least one") if kept.empty?
      errors.add(:photos, "can be at most #{MAX_PHOTOS}") if kept.size > MAX_PHOTOS
      kept.each do |photo|
        next if photo.valid?

        errors.add(:photos, "#{photo.url.truncate(60)} #{photo.errors[:url].first}")
      end
    end

    def has_valid_videos
      kept = current_videos
      errors.add(:videos, "can be at most #{MAX_VIDEOS}") if kept.size > MAX_VIDEOS
      kept.each do |video|
        next if video.valid?

        errors.add(:videos, "#{video.url.truncate(60)} #{video.errors[:url].first}")
      end
    end
end
