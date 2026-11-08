# Kenya launches first: prices are now in the minor unit of each listing's
# currency (KES for Kenya, GBP for the UK), and listings can carry videos.
class AddCurrencyAndVideos < ActiveRecord::Migration[8.1]
  def change
    rename_column :listings, :nightly_price_pence, :nightly_price_cents
    rename_column :listings, :cleaning_charge_pence, :cleaning_charge_cents
    rename_column :bookings, :nightly_price_pence, :nightly_price_cents
    rename_column :bookings, :cleaning_charge_pence, :cleaning_charge_cents
    rename_column :bookings, :total_pence, :total_cents

    add_column :listings, :currency, :string, null: false, default: "GBP"
    add_column :bookings, :currency, :string, null: false, default: "GBP"
    add_check_constraint :listings, "currency IN ('KES', 'GBP')", name: "listings_currency_valid"
    add_check_constraint :bookings, "currency IN ('KES', 'GBP')", name: "bookings_currency_valid"

    reversible do |dir|
      dir.up do
        execute "UPDATE listings SET currency = 'KES' WHERE country = 'Kenya'"
        execute "UPDATE bookings SET currency = listings.currency FROM listings WHERE bookings.listing_id = listings.id"
      end
    end

    create_table :listing_videos, id: :uuid do |t|
      t.references :listing, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.string :url, null: false
      t.integer :position, null: false

      t.timestamps
    end
    add_index :listing_videos, %i[listing_id position], unique: true
  end
end
