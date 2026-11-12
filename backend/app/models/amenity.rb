# Something a home offers (Wi-Fi, a pool...). The owner adds and renames them;
# the key is set once from the first name so guests' filter links keep working.
class Amenity < ApplicationRecord
  has_many :listing_amenities, dependent: :delete_all
  has_many :listings, through: :listing_amenities

  normalizes :name, with: ->(value) { value.squish }

  before_validation :assign_key, on: :create

  validates :name, presence: true, length: { maximum: 40 }, uniqueness: { case_sensitive: false }
  validates :key, presence: true
  validate :key_is_unique

  private
    def assign_key
      self.key = name.to_s.parameterize(separator: "_").presence || "amenity" if key.blank?
    end

    # "Sea view" and "Sea-view" would share a key, so treat them as one name.
    def key_is_unique
      return if errors.include?(:name) || key.blank?

      errors.add(:name, "is too close to an existing amenity") if Amenity.where.not(id:).exists?(key:)
    end
end
