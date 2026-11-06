# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_06_000004) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "btree_gist"
  enable_extension "citext"
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "active_storage_attachments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.uuid "record_id", null: false
    t.uuid "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "amenities", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "key", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_amenities_on_key", unique: true
  end

  create_table "bookings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "listing_id", null: false
    t.uuid "guest_id", null: false
    t.date "check_in", null: false
    t.date "check_out", null: false
    t.integer "guests_count", null: false
    t.integer "nights", null: false
    t.integer "nightly_price_pence", null: false
    t.integer "cleaning_charge_pence", null: false
    t.integer "total_pence", null: false
    t.string "status", default: "confirmed", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["guest_id"], name: "index_bookings_on_guest_id"
    t.index ["listing_id"], name: "index_bookings_on_listing_id"
    t.check_constraint "check_out > check_in", name: "bookings_dates_ordered"
    t.check_constraint "guests_count > 0", name: "bookings_guests_positive"
    t.check_constraint "nights = (check_out - check_in)", name: "bookings_nights_match"
    t.check_constraint "status::text = ANY (ARRAY['pending_payment'::character varying, 'requested'::character varying, 'confirmed'::character varying, 'declined'::character varying, 'expired'::character varying, 'cancelled_by_guest'::character varying, 'cancelled_by_owner'::character varying, 'completed'::character varying]::text[])", name: "bookings_status_valid"
    t.check_constraint "total_pence = (nights * nightly_price_pence + cleaning_charge_pence)", name: "bookings_total_matches"
    t.exclusion_constraint "listing_id WITH =, daterange(check_in, check_out) WITH &&", where: "(status)::text = ANY ((ARRAY['pending_payment'::character varying, 'requested'::character varying, 'confirmed'::character varying])::text[])", using: :gist, name: "bookings_no_overlap"
  end

  create_table "listing_amenities", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "listing_id", null: false
    t.uuid "amenity_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["amenity_id"], name: "index_listing_amenities_on_amenity_id"
    t.index ["listing_id", "amenity_id"], name: "index_listing_amenities_on_listing_id_and_amenity_id", unique: true
  end

  create_table "listing_photos", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "listing_id", null: false
    t.string "url", null: false
    t.integer "position", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["listing_id", "position"], name: "index_listing_photos_on_listing_id_and_position", unique: true
    t.index ["listing_id"], name: "index_listing_photos_on_listing_id"
  end

  create_table "listings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "title", null: false
    t.string "slug", null: false
    t.text "description", default: "", null: false
    t.string "address", null: false
    t.string "country", null: false
    t.integer "max_guests", null: false
    t.integer "nightly_price_pence", null: false
    t.integer "cleaning_charge_pence", default: 0, null: false
    t.text "house_rules", default: "", null: false
    t.string "status", default: "published", null: false
    t.boolean "featured", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_listings_on_slug", unique: true
    t.index ["status"], name: "index_listings_on_status"
    t.check_constraint "cleaning_charge_pence >= 0", name: "listings_cleaning_non_negative"
    t.check_constraint "max_guests > 0", name: "listings_max_guests_positive"
    t.check_constraint "nightly_price_pence > 0", name: "listings_price_positive"
    t.check_constraint "status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'unlisted'::character varying]::text[])", name: "listings_status_valid"
  end

  create_table "sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.citext "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "role", default: "guest", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.check_constraint "role::text = ANY (ARRAY['guest'::character varying, 'admin'::character varying]::text[])", name: "users_role_valid"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "bookings", "listings"
  add_foreign_key "bookings", "users", column: "guest_id"
  add_foreign_key "listing_amenities", "amenities", on_delete: :cascade
  add_foreign_key "listing_amenities", "listings", on_delete: :cascade
  add_foreign_key "listing_photos", "listings", on_delete: :cascade
  add_foreign_key "sessions", "users", on_delete: :cascade
end
