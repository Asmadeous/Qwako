class Booking < ApplicationRecord
  ACTIVE_STATUSES = %w[pending_payment requested confirmed].freeze
  MAX_NIGHTS = 30
  PHONE_FORMAT = /\A\+?[0-9 ()-]{7,20}\z/

  belongs_to :listing
  belongs_to :guest, class_name: "User"

  enum :status, %w[pending_payment requested confirmed declined expired cancelled_by_guest
                   cancelled_by_owner completed].index_by(&:itself), default: "confirmed", validate: true

  normalizes :contact_name, :contact_phone, with: ->(value) { value.strip }

  before_validation :price_from_listing, on: :create

  validates :check_in, :check_out, presence: true
  validates :guests_count, numericality: { only_integer: true, greater_than: 0 }
  validates :contact_name, presence: true, length: { maximum: 100 }
  validates :contact_phone, presence: true, format: { with: PHONE_FORMAT, allow_blank: true, message: "is not a valid phone number" }
  validate :dates_are_bookable, :guests_fit, :listing_is_bookable, :nights_are_free, on: :create

  scope :active, -> { where(status: ACTIVE_STATUSES) }

  private
    def price_from_listing
      return unless listing && check_in && check_out && check_out > check_in

      assign_attributes(listing.quote(check_in, check_out))
    end

    def dates_are_bookable
      return unless check_in && check_out

      errors.add(:check_out, "must be after check-in") if check_out <= check_in
      errors.add(:check_in, "cannot be in the past") if check_in < Time.zone.today
      errors.add(:check_out, "must be within #{MAX_NIGHTS} nights of check-in") if check_out - check_in > MAX_NIGHTS
    end

    def guests_fit
      return unless listing && guests_count.to_i > listing.max_guests

      errors.add(:guests_count, "must be #{listing.max_guests} or fewer for this stay")
    end

    def listing_is_bookable
      errors.add(:listing, "is not available to book") if listing && !listing.published?
    end

    # Friendly early check; the bookings_no_overlap constraint is the guarantee.
    def nights_are_free
      return unless listing && check_in && check_out && check_out > check_in

      taken = listing.bookings.active.where("daterange(check_in, check_out) && daterange(?, ?)", check_in, check_out)
      errors.add(:base, "Those dates are no longer available.") if taken.exists?
    end
end
