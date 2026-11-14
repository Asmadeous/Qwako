class Booking < ApplicationRecord
  ACTIVE_STATUSES = %w[pending_payment requested confirmed].freeze
  ENDED_STATUSES = %w[declined expired cancelled_by_guest cancelled_by_owner].freeze
  # Every stay is paid online before it is confirmed; dates are held meanwhile.
  HOLD_MINUTES = 15
  # Homes that take requests: the owner has this long to accept a paid request.
  REQUEST_HOURS = 24

  belongs_to :listing
  belongs_to :guest, class_name: "User"
  has_many :payments, dependent: :restrict_with_error
  has_one :review, dependent: :restrict_with_error
  has_one :conversation, dependent: :nullify

  enum :status, %w[pending_payment requested confirmed declined expired cancelled_by_guest
                   cancelled_by_owner completed].index_by(&:itself), default: "confirmed", validate: true

  before_validation :price_from_listing, on: :create

  validates :check_in, :check_out, presence: true
  validates :guests_count, numericality: { only_integer: true, greater_than: 0 }
  validate :dates_are_bookable, :guests_fit, :listing_is_bookable, :nights_are_free, on: :create

  scope :active, -> { where(status: ACTIVE_STATUSES) }
  scope :stale_holds, -> { pending_payment.where(created_at: ...HOLD_MINUTES.minutes.ago) }
  scope :stale_requests, -> { requested.where(requested_until: ...Time.current) }

  # Frees dates held for payments that never arrived, and declines paid
  # requests the owner didn't answer in time (the guest is refunded).
  def self.expire_stale_holds!
    stale_holds.update_all(status: "expired", updated_at: Time.current)
    stale_requests.find_each { |booking| booking.decline!(reason: "The owner didn't reply within #{REQUEST_HOURS} hours.") }
  end

  def hold_expires_at
    created_at + HOLD_MINUTES.minutes if pending_payment?
  end

  def hold_active?
    pending_payment? && hold_expires_at.future?
  end

  def paid_cents
    payments.select { |payment| payment.succeeded? }.sum(&:amount_cents)
  end

  def refunded_or_due_cents
    payments.select(&:succeeded?).sum { |payment| payment.needs_refund? ? payment.refund_cents.to_i : 0 }
  end

  # Money the guest has paid and keeps paid: after refunds made or owed.
  def net_paid_cents
    paid_cents - refunded_or_due_cents
  end

  # Called once a payment succeeds. A payment that lands after the hold
  # expired still goes through if the dates are free; otherwise the owner has
  # to refund it. Homes that take requests wait for the owner to accept.
  def confirm_after_payment!(payment)
    return if confirmed? || requested?

    if pending_payment? || expired?
      transaction(requires_new: true) do
        if listing.books_request?
          update!(status: "requested", requested_until: REQUEST_HOURS.hours.from_now)
        else
          update!(status: "confirmed")
        end
      end
      requested? ? Notify.booking_requested(self) : Notify.booking_confirmed(self)
    else
      payment.flag_refund!(payment.amount_cents)
    end
  rescue ActiveRecord::ExclusionViolation
    reload
    payment.flag_refund!(payment.amount_cents)
  end

  def accept!
    with_lock do
      return false unless requested?

      update!(status: "confirmed", requested_until: nil)
    end
    Notify.booking_confirmed(self)
    true
  end

  def decline!(reason: nil)
    with_lock do
      return false unless requested?

      update!(status: "declined", cancelled_at: Time.current, cancel_reason: reason)
      flag_refunds!(net_paid_cents)
    end
    Notify.booking_declined(self)
    true
  end

  # The owner can cancel a stay that hasn't ended, with a full refund.
  def owner_can_cancel?
    status.in?(ACTIVE_STATUSES) && check_out >= Time.zone.today
  end

  def cancel_by_owner!(reason: nil)
    with_lock do
      return false unless owner_can_cancel?

      update!(status: "cancelled_by_owner", cancelled_at: Time.current, cancel_reason: reason.presence)
      flag_refunds!(net_paid_cents)
    end
    Notify.booking_cancelled(self, by: :owner)
    true
  end

  # A guest can cancel until their check-in day. The home's cancellation
  # policy decides how much comes back.
  def guest_can_cancel?
    status.in?(ACTIVE_STATUSES) && check_in > Time.zone.today
  end

  # What a guest would get back by cancelling today. A request the owner
  # hasn't accepted yet is always refunded in full.
  def guest_refund_cents(on: Time.zone.today)
    paid = net_paid_cents
    return paid if requested? || pending_payment?

    days_before = (check_in - on).to_i
    case listing.cancellation_policy
    when "moderate" then days_before >= 5 ? paid : paid / 2
    when "strict" then days_before >= 7 ? paid / 2 : 0
    else days_before >= 1 ? paid : 0
    end
  end

  def cancel_by_guest!(reason: nil)
    with_lock do
      return false unless guest_can_cancel?

      refund = guest_refund_cents
      update!(status: "cancelled_by_guest", cancelled_at: Time.current, cancel_reason: reason.presence)
      flag_refunds!(refund)
    end
    Notify.booking_cancelled(self, by: :guest)
    true
  end

  # Moving a stay keeps its nightly price. A shorter stay refunds the
  # difference; a longer one is refused (book the extra nights separately).
  def can_reschedule?(by_owner:)
    return false unless confirmed? || requested?

    by_owner ? check_out >= Time.zone.today : check_in > Time.zone.today
  end

  def reschedule!(new_check_in, new_check_out, by_owner:)
    with_lock do
      unless can_reschedule?(by_owner:)
        errors.add(:base, "This booking can no longer be moved.")
        return false
      end
      return false unless valid_new_dates?(new_check_in, new_check_out)

      new_nights = (new_check_out - new_check_in).to_i
      difference = (nights - new_nights) * nightly_price_cents
      update!(check_in: new_check_in, check_out: new_check_out, nights: new_nights,
              total_cents: new_nights * nightly_price_cents + cleaning_charge_cents)
      flag_refunds!(difference) if difference.positive?
    end
    Notify.booking_rescheduled(self, by: by_owner ? :owner : :guest)
    true
  rescue ActiveRecord::ExclusionViolation
    errors.add(:base, "Those dates are no longer available.")
    false
  end

  def reviewable?
    confirmed? && check_out <= Time.zone.today
  end

  def refund_due?
    payments.any?(&:refund_due?)
  end

  # Address details, check-in instructions and wifi are for confirmed guests only.
  def details_revealed?
    confirmed?
  end

  private
    # Spreads a refund over the booking's paid, not yet refunded payments.
    def flag_refunds!(cents)
      remaining = cents
      payments.succeeded.where(refunded_at: nil).order(:paid_at).each do |payment|
        break unless remaining.positive?

        share = [ remaining, payment.amount_cents - (payment.needs_refund? ? payment.refund_cents.to_i : 0) ].min
        next unless share.positive?

        payment.flag_refund!(payment.refund_cents.to_i + share)
        remaining -= share
      end
    end

    def valid_new_dates?(new_check_in, new_check_out)
      if new_check_in.nil? || new_check_out.nil? || new_check_out <= new_check_in
        errors.add(:check_out, "must be after check-in")
      elsif new_check_in < Time.zone.today
        errors.add(:check_in, "cannot be in the past")
      elsif (new_check_out - new_check_in).to_i > nights
        errors.add(:base, "A longer stay costs more. Keep the same number of nights or fewer, or book the extra nights separately.")
      elsif (new_check_out - new_check_in).to_i < listing.min_nights
        errors.add(:base, "This home needs at least #{listing.min_nights} nights.")
      elsif !listing.nights_free?(new_check_in, new_check_out, except: self)
        errors.add(:base, "Those dates are no longer available.")
      end
      errors.empty?
    end

    def price_from_listing
      return unless listing && check_in && check_out && check_out > check_in

      assign_attributes(listing.quote(check_in, check_out))
    end

    def dates_are_bookable
      return unless check_in && check_out

      errors.add(:check_out, "must be after check-in") if check_out <= check_in
      errors.add(:check_in, "cannot be in the past") if check_in < Time.zone.today
      return unless listing && check_out > check_in

      nights_count = (check_out - check_in).to_i
      errors.add(:check_out, "must be at least #{listing.min_nights} nights after check-in") if nights_count < listing.min_nights
      errors.add(:check_out, "must be within #{listing.max_nights} nights of check-in") if nights_count > listing.max_nights
    end

    def guests_fit
      return unless listing && guests_count.to_i > listing.max_guests

      errors.add(:guests_count, "must be #{listing.max_guests} or fewer for this home")
    end

    def listing_is_bookable
      errors.add(:listing, "is not available to book") if listing && (!listing.published? || listing.deleted?)
    end

    # Friendly early check; the bookings_no_overlap constraint is the guarantee
    # for bookings. Blocked nights are checked here.
    def nights_are_free
      return unless listing && check_in && check_out && check_out > check_in

      errors.add(:base, "Those dates are no longer available.") unless listing.nights_free?(check_in, check_out)
    end
end
