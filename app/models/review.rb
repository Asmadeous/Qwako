# A guest's review of a stay, written after check-out. One per booking.
class Review < ApplicationRecord
  belongs_to :booking
  belongs_to :listing
  belongs_to :author, class_name: "User"

  normalizes :comment, :owner_reply, with: ->(text) { text.strip }

  validates :rating, numericality: { only_integer: true, in: 1..5 }
  validates :comment, length: { maximum: 2000 }
  validates :owner_reply, length: { maximum: 2000 }
  validates :booking_id, uniqueness: { message: "already has a review" }
  validate :stay_is_over, on: :create

  scope :visible, -> { where(hidden: false) }

  after_save :refresh_listing_rating
  after_destroy :refresh_listing_rating

  private
    def stay_is_over
      return unless booking

      errors.add(:base, "You can review a stay after you check out.") unless booking.reviewable?
    end

    def refresh_listing_rating
      shown = listing.reviews.visible
      listing.update_columns(review_count: shown.count, rating_average: shown.average(:rating)&.round(2))
    end
end
