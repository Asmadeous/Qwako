# Idempotent: safe to run again; existing records are updated, not duplicated.
#
# Admin account: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Outside production they
# default to the development-only values below; production requires both.
# Outside production a guest account (guest@tgbnb.test) is also seeded.

AMENITIES = {
  "wifi" => "Wi-Fi", "parking" => "Free parking", "tv" => "TV",
  "radio" => "Radio", "pets" => "Pets allowed", "entrance" => "Private entrance"
}.freeze

# Starter amenities only: once the owner manages their own, a re-seed leaves them alone.
AMENITIES.each { |key, name| Amenity.create!(key:, name:) } if Amenity.none?

admin_email = ENV["SEED_ADMIN_EMAIL"] || (Rails.env.production? ? nil : "admin@tgbnb.test")
admin_password = ENV["SEED_ADMIN_PASSWORD"] || (Rails.env.production? ? nil : "admin-dev-password")
if admin_email && admin_password
  admin = User.find_or_initialize_by(email: admin_email)
  admin.update!(name: admin.name.presence || "T&G Owner", password: admin_password, role: "admin")
else
  warn "Skipping admin account: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD."
end

# A guest account for trying the booking flow locally. Never created in production.
unless Rails.env.production?
  guest = User.find_or_initialize_by(email: "guest@tgbnb.test")
  guest.update!(name: guest.name.presence || "Test Guest", password: "guest-dev-password", role: "guest")
end

# The owner's real homes, priced in shillings. Addresses end with the country.
# Photos live in client/public/listings and are served by the site itself.
{ "kitchen" => "Fully fitted kitchen", "washing_machine" => "Washing machine",
  "dishwasher" => "Dishwasher", "balcony" => "Balcony" }.each do |key, name|
  Amenity.find_or_create_by!(key:) { |amenity| amenity.name = name }
end

# The old demo homes are removed wherever they were seeded.
DEMO_TITLES = [
  "Westlands Skyline Apartment", "Kilimani Garden Flat", "Karen Garden House", "Diani Beach Villa",
  "Watamu Ocean House", "Nyali Beach Apartment", "Shela Village House", "Naivasha Lakeside Cottage",
  "Nanyuki Forest Cabin", "Nakuru Hillside Home", "Kisumu Lakefront Apartment", "Kilifi Creek Retreat"
].freeze
Listing.kept.where(title: DEMO_TITLES).find_each(&:delete_or_archive!)

listings = JSON.parse(File.read(Rails.root.join("db/seeds/listings.json")))
listings.each do |attrs|
  attrs = attrs.dup
  category_name = attrs.delete("category")
  listing = Listing.find_or_initialize_by(title: attrs["title"])
  listing.category = Category.find_or_create_by!(name: category_name) if category_name
  listing.update!(attrs)
end

puts "Seeded #{Amenity.count} amenities, #{Category.count} categories, #{Listing.kept.count} listings, #{User.admin.count} admin(s)."
