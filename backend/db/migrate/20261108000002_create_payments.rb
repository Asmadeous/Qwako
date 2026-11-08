# Online payments for bookings. Kenyan stays are paid through Paystack
# (M-Pesa or card) in KES; a booking can have several attempts.
class CreatePayments < ActiveRecord::Migration[8.1]
  def change
    create_table :payments, id: :uuid do |t|
      t.references :booking, null: false, type: :uuid, foreign_key: true
      t.string :provider, null: false, default: "paystack"
      t.string :reference, null: false
      t.integer :amount_cents, null: false
      t.string :currency, null: false
      t.string :status, null: false, default: "pending"
      t.string :authorization_url
      t.string :channel
      t.string :provider_transaction_id
      t.datetime :paid_at
      # Paid after the dates were lost: the owner must refund it.
      t.boolean :needs_refund, null: false, default: false

      t.timestamps
    end
    add_index :payments, :reference, unique: true
    add_check_constraint :payments, "amount_cents > 0", name: "payments_amount_positive"
    add_check_constraint :payments, "currency IN ('KES', 'GBP')", name: "payments_currency_valid"
    add_check_constraint :payments, "status IN ('pending', 'succeeded', 'failed')", name: "payments_status_valid"
  end
end
