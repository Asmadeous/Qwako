class Booking < ApplicationRecord
  ACTIVE_STATUSES = %w[pending_payment requested confirmed].freeze
  MAX_NIGHTS = 30
  # Kenyan stays are paid online before they are confirmed; dates are held meanwhile.
  ONLINE_PAYMENT_CURRENCIES = %w[KES].freeze
  HOLD_MINUTES = 15

  belongs_to :listing
  belongs_to :guest, class_name: "User"
  has_many :payments, dependent: :restrict_with_error

  enum :status, %w[pending_payment requested confirmed declined expired cancelled_by_guest
                   cancelled_by_owner completed].index_by(&:itself), default: "confirmed", validate: true

  before_validation :price_from_listing, on: :create

  validates :check_in, :check_out, presence: true
  validates :guests_count, numericality: { only_integer: true, greater_than: 0 }
  validate :dates_are_bookable, :guests_fit, :listing_is_bookable, :nights_are_free, on: :create

  scope :active, -> { where(status: ACTIVE_STATUSES) }
  scope :stale_holds, -> { pending_payment.where(created_at: ...HOLD_MINUTES.minutes.ago) }

  # Frees dates held for payments that never arrived.
  def self.expire_stale_holds!
    stale_holds.update_all(status: "expired", updated_at: Time.current)
  end

  def pay_online?
    currency.in?(ONLINE_PAYMENT_CURRENCIES)
  end

  def hold_expires_at
    created_at + HOLD_MINUTES.minutes if pending_payment?
  end

  def hold_active?
    pending_payment? && hold_expires_at.future?
  end

  # Called once a payment succeeds. A payment that lands after the hold
  # expired still confirms the stay if the dates are free; otherwise the
  # owner has to refund it.
  def confirm_after_payment!(payment)
    return if confirmed?

    if pending_payment? || expired?
      transaction(requires_new: true) { update!(status: "confirmed") }
    else
      payment.update!(needs_refund: true)
    end
  rescue ActiveRecord::ExclusionViolation
    reload
    payment.update!(needs_refund: true)
  end

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
