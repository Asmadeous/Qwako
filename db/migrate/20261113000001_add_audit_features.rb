# Everything the plan lists that the first build left out: home details and
# booking rules, blocked dates, request-to-book and cancellation policies,
# partial and Paystack refunds, guest phone and email verification, saved
# homes, messages, notifications, reviews, contact form and the admin log.
class AddAuditFeatures < ActiveRecord::Migration[8.1]
  def change
    change_table :listings, bulk: true do |t|
      t.string :property_type, null: false, default: "house"
      t.integer :bedrooms, null: false, default: 1
      t.integer :beds, null: false, default: 1
      t.integer :bathrooms, null: false, default: 1
      t.string :check_in_time, null: false, default: "14:00"
      t.string :check_out_time, null: false, default: "10:00"
      t.integer :min_nights, null: false, default: 1
      t.integer :max_nights, null: false, default: 30
      t.string :booking_type, null: false, default: "instant"
      t.string :cancellation_policy, null: false, default: "flexible"
      t.text :check_in_instructions, null: false, default: ""
      t.text :wifi_details, null: false, default: ""
      t.string :licence_number, null: false, default: ""
      t.decimal :rating_average, precision: 3, scale: 2
      t.integer :review_count, null: false, default: 0
    end
    change_column_default :listings, :currency, from: "GBP", to: "KES"
    change_column_default :bookings, :currency, from: "GBP", to: "KES"
    add_check_constraint :listings, "min_nights >= 1 AND max_nights >= min_nights", name: "listings_nights_range"

    change_table :bookings, bulk: true do |t|
      t.datetime :requested_until
      t.datetime :cancelled_at
      t.string :cancel_reason
    end

    change_table :payments, bulk: true do |t|
      t.integer :refund_cents
      t.string :provider_refund_id
    end
    reversible do |dir|
      dir.up { execute "UPDATE payments SET refund_cents = amount_cents WHERE needs_refund" }
    end

    change_table :users, bulk: true do |t|
      t.string :phone
      t.datetime :email_verified_at
      t.datetime :marketing_consent_at
      t.boolean :email_messages, null: false, default: true
      t.string :google_uid
      t.datetime :deleted_at
    end
    add_index :users, :google_uid, unique: true

    create_table :availability_blocks, id: :uuid do |t|
      t.references :listing, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.date :starts_on, null: false
      t.date :ends_on, null: false
      t.string :reason, null: false, default: ""
      t.timestamps
    end
    add_check_constraint :availability_blocks, "ends_on > starts_on", name: "availability_blocks_dates_ordered"

    create_table :saved_listings, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.references :listing, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.timestamps
    end
    add_index :saved_listings, %i[user_id listing_id], unique: true

    create_table :conversations, id: :uuid do |t|
      t.references :guest, type: :uuid, null: false, foreign_key: { to_table: :users }
      t.references :listing, type: :uuid, foreign_key: { on_delete: :nullify }
      t.references :booking, type: :uuid, foreign_key: { on_delete: :nullify }, index: { unique: true }
      t.string :subject, null: false
      t.datetime :last_message_at, null: false
      t.datetime :guest_read_at
      t.datetime :owner_read_at
      t.timestamps
    end

    create_table :messages, id: :uuid do |t|
      t.references :conversation, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.references :sender, type: :uuid, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false
      t.timestamps
    end

    create_table :contact_messages, id: :uuid do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :phone
      t.text :body, null: false
      t.datetime :handled_at
      t.timestamps
    end

    create_table :notifications, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.string :kind, null: false
      t.string :title, null: false
      t.string :body, null: false, default: ""
      t.string :url
      t.datetime :read_at
      t.timestamps
    end
    add_index :notifications, %i[user_id read_at]

    create_table :reviews, id: :uuid do |t|
      t.references :booking, type: :uuid, null: false, foreign_key: true, index: { unique: true }
      t.references :listing, type: :uuid, null: false, foreign_key: true
      t.references :author, type: :uuid, null: false, foreign_key: { to_table: :users }
      t.integer :rating, null: false
      t.text :comment, null: false, default: ""
      t.text :owner_reply
      t.boolean :hidden, null: false, default: false
      t.timestamps
    end
    add_check_constraint :reviews, "rating BETWEEN 1 AND 5", name: "reviews_rating_range"

    create_table :audit_logs, id: :uuid do |t|
      t.references :admin, type: :uuid, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string :action, null: false
      t.string :target_type
      t.uuid :target_id
      t.string :summary, null: false
      t.string :ip_address
      t.datetime :created_at, null: false
    end
    add_index :audit_logs, :created_at
  end
end
