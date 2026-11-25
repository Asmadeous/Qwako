class Payment < ApplicationRecord
  belongs_to :booking

  enum :status, %w[pending succeeded failed].index_by(&:itself), default: "pending", validate: true

  validates :reference, presence: true, uniqueness: true
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }

  scope :refund_due, -> { where(needs_refund: true, refunded_at: nil) }

  STATES = %w[paid refund_due refunded].freeze

  # Money that went through, narrowed by the transactions page's filters:
  # q (reference, guest, home), listing_id, state, channel, from and to (paid dates).
  def self.search(filters)
    scope = succeeded.joins(booking: %i[guest listing])
    if (query = filters[:q].to_s.strip).present?
      pattern = "%#{sanitize_sql_like(query)}%"
      scope = scope.where("payments.reference ILIKE :pattern OR users.name ILIKE :pattern OR users.email ILIKE :pattern " \
                          "OR listings.title ILIKE :pattern", pattern:)
    end
    scope = scope.where(bookings: { listing_id: filters[:listing_id] }) if filters[:listing_id].present?
    scope = scope.where(channel: filters[:channel]) if filters[:channel].present?
    scope = case filters[:state]
    when "paid" then scope.where(needs_refund: false)
    when "refund_due" then scope.refund_due
    when "refunded" then scope.where.not(refunded_at: nil)
    else scope
    end
    if (from = parse_date(filters[:from]))
      scope = scope.where(paid_at: from.beginning_of_day..)
    end
    if (to = parse_date(filters[:to]))
      scope = scope.where(paid_at: ...(to + 1).beginning_of_day)
    end
    scope
  end

  def self.parse_date(value)
    Date.iso8601(value.to_s) if value.present?
  rescue Date::Error
    nil
  end
  private_class_method :parse_date

  # The refund on this payment, sent or still owed.
  def refund_amount_cents
    refund_cents || amount_cents
  end

  def refund_due?
    needs_refund? && refunded_at.nil?
  end

  def refund_due_cents
    refund_due? ? refund_cents.to_i : 0
  end

  # Marks money to go back to the guest: the full payment or part of it.
  def flag_refund!(cents)
    update!(needs_refund: true, refund_cents: cents.clamp(0, amount_cents))
  end

  # For refunds made outside the site (in the Paystack dashboard).
  def mark_refunded!
    with_lock do
      return false unless refund_due?

      update!(refunded_at: Time.current)
    end
    Notify.refund_sent(self)
    true
  end

  # Asks Paystack to send the refund back to the guest's card or M-Pesa.
  def refund_through_paystack!
    with_lock do
      return false unless refund_due?

      data = Paystack.client.refund(transaction: provider_transaction_id.presence || reference, amount: refund_cents)
      update!(refunded_at: Time.current, provider_refund_id: data["id"].to_s)
    end
    Notify.refund_sent(self)
    true
  end

  def self.new_reference
    "tg_#{SecureRandom.hex(12)}"
  end

  # Records a Paystack transaction, from the guest's return or the webhook.
  # Safe to call more than once: only the first success confirms the booking.
  def settle!(transaction)
    with_lock do
      return self if succeeded? || transaction["status"] != "success"

      unless transaction["amount"].to_i == amount_cents && transaction["currency"] == currency
        Rails.logger.warn("Payment #{reference}: Paystack reported #{transaction["amount"]} #{transaction["currency"]}")
        update!(status: "failed", needs_refund: true, refund_cents: amount_cents)
        return self
      end

      update!(status: "succeeded", channel: transaction["channel"], paid_at: Time.current,
        provider_transaction_id: transaction["id"].to_s)
      booking.confirm_after_payment!(self)
    end
    self
  end
end
