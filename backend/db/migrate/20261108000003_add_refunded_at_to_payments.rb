# The owner refunds in the Paystack dashboard, then records it here.
class AddRefundedAtToPayments < ActiveRecord::Migration[8.1]
  def change
    add_column :payments, :refunded_at, :datetime
  end
end
