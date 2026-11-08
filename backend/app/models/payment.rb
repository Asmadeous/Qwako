class Payment < ApplicationRecord
  belongs_to :booking

  enum :status, %w[pending succeeded failed].index_by(&:itself), default: "pending", validate: true

  validates :reference, presence: true, uniqueness: true
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }

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
        update!(status: "failed", needs_refund: true)
        return self
      end

      update!(status: "succeeded", channel: transaction["channel"], paid_at: Time.current,
        provider_transaction_id: transaction["id"].to_s)
      booking.confirm_after_payment!(self)
    end
    self
  end
end
