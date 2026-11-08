class Listing < ApplicationRecord
  MAX_PHOTOS = 30
  MAX_VIDEOS = 10
  MAX_GUESTS = 16
  # The last part of the address names the country, which sets the currency.
  CURRENCIES = {
    "Kenya" => "KES",
    "England" => "GBP", "Scotland" => "GBP", "Wales" => "GBP", "Northern Ireland" => "GBP"
  }.freeze

  has_many :photos, -> { order(:position) }, class_name: "ListingPhoto", dependent: :delete_all,
    inverse_of: :listing, autosave: true, validate: false # has_photos validates each photo
  has_many :videos, -> { order(:position) }, class_name: "ListingVideo", dependent: :delete_all,
    inverse_of: :listing, autosave: true, validate: false # has_valid_videos validates each video
  has_many :listing_amenities, dependent: :delete_all
  has_many :amenities, through: :listing_amenities
  has_many :bookings, dependent: :restrict_with_error

  enum :status, { draft: "draft", published: "published", unlisted: "unlisted" }, default: "published", validate: true

  normalizes :title, :address, with: ->(value) { value.strip }

  before_validation :derive_country_and_currency, :assign_slug

  validates :title, presence: true, length: { maximum: 120 }
  validates :address, presence: true, length: { maximum: 200 }
  validates :description, :house_rules, length: { maximum: 5000 }
  validates :max_guests, numericality: { only_integer: true, in: 1..MAX_GUESTS }
  # Minor units (cents) of the listing's currency.
  validates :nightly_price_cents, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 10_000_000 }
  validates :cleaning_charge_cents, numericality: { only_integer: true, in: 0..1_000_000 }
  validates :country, inclusion: { in: CURRENCIES.keys, message: "must be Kenya, England, Scotland, Wales or Northern Ireland" }
  validate :has_photos, :has_valid_videos

  scope :matching, ->(query) {
    next all if query.blank?

    pattern = "%#{sanitize_sql_like(query.strip)}%"
    where("listings.title ILIKE :pattern OR listings.address ILIKE :pattern", pattern:)
  }

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
    def derive_country_and_currency
      self.country = address.to_s.split(",").last.to_s.strip.presence || "Unknown"
      self.currency = CURRENCIES[country] if CURRENCIES.key?(country)
    end

    def assign_slug
      return if slug.present? || title.blank?

      base = title.parameterize.presence || "stay"
      self.slug = self.class.exists?(slug: base) ? "#{base}-#{SecureRandom.hex(3)}" : base
    end

    def has_photos
      kept = current_photos
      errors.add(:photos, "need at least one photo") if kept.empty?
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
