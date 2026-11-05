# Idempotent: safe to run again; existing records are updated, not duplicated.
#
# Admin account: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Outside production they
# default to the development-only values below; production requires both.

AMENITIES = {
  "wifi" => "Wi-Fi", "parking" => "Free parking", "tv" => "TV",
  "radio" => "Radio", "pets" => "Pets allowed", "entrance" => "Private entrance"
}.freeze

AMENITIES.each do |key, name|
  Amenity.find_or_initialize_by(key:).update!(name:)
end

admin_email = ENV["SEED_ADMIN_EMAIL"] || (Rails.env.production? ? nil : "admin@tgbnb.test")
admin_password = ENV["SEED_ADMIN_PASSWORD"] || (Rails.env.production? ? nil : "admin-dev-password")
if admin_email && admin_password
  admin = User.find_or_initialize_by(email: admin_email)
  admin.update!(name: admin.name.presence || "T&G Owner", password: admin_password, role: "admin")
else
  warn "Skipping admin account: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD."
end

# The 50 prototype listings. Prices were converted to GBP from each listing's
# local currency (see source_price) and rounded to the nearest 5 pounds.
listings = JSON.parse(File.read(Rails.root.join("db/seeds/listings.json")))
listings.each do |attrs|
  listing = Listing.find_or_initialize_by(title: attrs["title"])
  listing.update!(attrs.except("source_price"))
end

puts "Seeded #{Amenity.count} amenities, #{Listing.count} listings, #{User.admin.count} admin(s)."
