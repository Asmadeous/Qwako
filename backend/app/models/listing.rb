class Listing < ApplicationRecord
  MAX_PHOTOS = 30
  MAX_GUESTS = 16

  has_many :photos, -> { order(:position) }, class_name: "ListingPhoto", dependent: :delete_all,
    inverse_of: :listing, autosave: true, validate: false # has_photos validates each photo
  has_many :listing_amenities, dependent: :delete_all
  has_many :amenities, through: :listing_amenities
  has_many :bookings, dependent: :restrict_with_error

  enum :status, { draft: "draft", published: "published", unlisted: "unlisted" }, default: "published", validate: true

  normalizes :title, :address, with: ->(value) { value.strip }

  before_validation :derive_country, :assign_slug

  validates :title, presence: true, length: { maximum: 120 }
  validates :address, presence: true, length: { maximum: 200 }
  validates :description, :house_rules, length: { maximum: 5000 }
  validates :max_guests, numericality: { only_integer: true, in: 1..MAX_GUESTS }
  validates :nightly_price_pence, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 1_000_000 }
  validates :cleaning_charge_pence, numericality: { only_integer: true, in: 0..100_000 }
  validate :has_photos

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

  def amenity_keys=(keys)
    self.amenities = Amenity.where(key: Array(keys).map(&:to_s))
  end

  # Price for a stay; the server never trusts a client total.
  def quote(check_in, check_out)
    nights = (check_out - check_in).to_i
    { nights:, nightly_price_pence:, cleaning_charge_pence:, total_pence: nights * nightly_price_pence + cleaning_charge_pence }
  end

  private
    def derive_country
      self.country = address.to_s.split(",").last.to_s.strip.presence || "Unknown"
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
end
