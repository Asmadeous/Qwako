class CreateBookings < ActiveRecord::Migration[8.1]
  def change
    create_table :bookings, id: :uuid do |t|
      t.references :listing, null: false, type: :uuid, foreign_key: true
      t.references :guest, null: false, type: :uuid, foreign_key: { to_table: :users }
      t.date :check_in, null: false
      t.date :check_out, null: false
      t.integer :guests_count, null: false
      t.string :contact_name, null: false
      t.string :contact_phone, null: false
      t.integer :nights, null: false
      t.integer :nightly_price_pence, null: false
      t.integer :cleaning_charge_pence, null: false
      t.integer :total_pence, null: false
      t.string :status, null: false, default: "confirmed"

      t.timestamps
    end
    add_check_constraint :bookings, "check_out > check_in", name: "bookings_dates_ordered"
    add_check_constraint :bookings, "guests_count > 0", name: "bookings_guests_positive"
    add_check_constraint :bookings, "nights = check_out - check_in", name: "bookings_nights_match"
    add_check_constraint :bookings,
      "total_pence = nights * nightly_price_pence + cleaning_charge_pence", name: "bookings_total_matches"
    add_check_constraint :bookings,
      "status IN ('pending_payment', 'requested', 'confirmed', 'declined', 'expired', " \
      "'cancelled_by_guest', 'cancelled_by_owner', 'completed')",
      name: "bookings_status_valid"

    # No two active bookings of one listing may share a night.
    add_exclusion_constraint :bookings, "listing_id WITH =, daterange(check_in, check_out) WITH &&",
      using: :gist, where: "status IN ('pending_payment', 'requested', 'confirmed')",
      name: "bookings_no_overlap"
  end
end
