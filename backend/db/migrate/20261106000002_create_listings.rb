class CreateListings < ActiveRecord::Migration[8.1]
  def change
    create_table :listings, id: :uuid do |t|
      t.string :title, null: false
      t.string :slug, null: false
      t.text :description, null: false, default: ""
      t.string :address, null: false
      t.string :country, null: false
      t.integer :max_guests, null: false
      t.integer :nightly_price_pence, null: false
      t.integer :cleaning_charge_pence, null: false, default: 0
      t.text :house_rules, null: false, default: ""
      t.string :status, null: false, default: "published"
      t.boolean :featured, null: false, default: false

      t.timestamps
    end
    add_index :listings, :slug, unique: true
    add_index :listings, :status
    add_check_constraint :listings, "max_guests > 0", name: "listings_max_guests_positive"
    add_check_constraint :listings, "nightly_price_pence > 0", name: "listings_price_positive"
    add_check_constraint :listings, "cleaning_charge_pence >= 0", name: "listings_cleaning_non_negative"
    add_check_constraint :listings, "status IN ('draft', 'published', 'unlisted')", name: "listings_status_valid"

    create_table :listing_photos, id: :uuid do |t|
      t.references :listing, null: false, type: :uuid, foreign_key: { on_delete: :cascade }
      t.string :url, null: false
      t.integer :position, null: false

      t.timestamps
    end
    add_index :listing_photos, %i[listing_id position], unique: true

    create_table :amenities, id: :uuid do |t|
      t.string :key, null: false
      t.string :name, null: false

      t.timestamps
    end
    add_index :amenities, :key, unique: true

    create_table :listing_amenities, id: :uuid do |t|
      t.references :listing, null: false, type: :uuid, foreign_key: { on_delete: :cascade }, index: false
      t.references :amenity, null: false, type: :uuid, foreign_key: { on_delete: :cascade }

      t.timestamps
    end
    add_index :listing_amenities, %i[listing_id amenity_id], unique: true
  end
end
