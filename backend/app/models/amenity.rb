class Amenity < ApplicationRecord
  has_many :listing_amenities, dependent: :delete_all

  validates :key, presence: true, uniqueness: true
  validates :name, presence: true
end
