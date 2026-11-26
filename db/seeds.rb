# Idempotent: safe to run again; existing records are updated, not duplicated.
#
# Admin account: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Outside production they
# default to the development-only values below; production requires both.
# Outside production a guest account (guest@tgbnb.test) and a staff account
# (staff@tgbnb.test) are also seeded.

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
  admin.password = admin_password if admin.new_record? # never reset a password the owner changed
  admin.update!(name: admin.name.presence || "TG Homes owner", role: "admin", email_verified_at: admin.email_verified_at || Time.current)
else
  warn "Skipping admin account: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD."
end

# A guest account for trying the booking flow locally. Never created in production.
unless Rails.env.production?
  guest = User.find_or_initialize_by(email: "guest@tgbnb.test")
  guest.update!(name: guest.name.presence || "Test Guest", password: "guest-dev-password", role: "guest",
    phone: guest.phone || "+254 700 000 000", email_verified_at: guest.email_verified_at || Time.current)

  # A staff account, for trying what staff can and can't do.
  staff = User.find_or_initialize_by(email: "staff@tgbnb.test")
  staff.update!(name: staff.name.presence || "Test Staff", password: "staff-dev-password", role: "staff",
    phone: staff.phone || "+254 700 000 001", email_verified_at: staff.email_verified_at || Time.current)
end

# The owner's real homes, priced in shillings. Addresses end with the country.
# Photos live in client/public/listings and are served by the site itself.
{ "kitchen" => "Fully fitted kitchen", "washing_machine" => "Washing machine",
  "dishwasher" => "Dishwasher", "balcony" => "Balcony",
  "hot_showers" => "Hot showers", "fireplace" => "Fireplace or wood stove",
  "workspace" => "Dedicated workspace", "backup_power" => "Backup power", "garden" => "Garden",
  "fire_pit" => "Fire pit", "bbq_grill" => "BBQ grill", "caretaker" => "On-site caretaker",
  "housekeeping" => "Daily housekeeping" }.each do |key, name|
  Amenity.find_or_create_by!(key:) { |amenity| amenity.name = name }
end

# The old demo homes are removed wherever they were seeded.
DEMO_TITLES = [
  "Westlands Skyline Apartment", "Kilimani Garden Flat", "Karen Garden House", "Diani Beach Villa",
  "Watamu Ocean House", "Nyali Beach Apartment", "Shela Village House", "Naivasha Lakeside Cottage",
  "Nanyuki Forest Cabin", "Nakuru Hillside Home", "Kisumu Lakefront Apartment", "Kilifi Creek Retreat"
].freeze
Listing.kept.where(title: DEMO_TITLES).find_each(&:delete_or_archive!)

# Each home is created once, keyed by its slug (which survives a rename); after that
# the owner manages it in the dashboard and a re-seed leaves it alone.
listings = JSON.parse(File.read(Rails.root.join("db/seeds/listings.json")))
listings.each do |attrs|
  attrs = attrs.dup
  next if Listing.exists?(slug: attrs["title"].parameterize)

  category_name = attrs.delete("category")
  listing = Listing.new(attrs)
  listing.category = Category.find_or_create_by!(name: category_name) if category_name
  listing.save!
end

# Sample reviews of the two homes, so the review sections can be seen locally.
# Never seeded in production: there, only guests who stayed write reviews.
unless Rails.env.production?
  SAMPLE_REVIEWS = {
    "grace-apartments-d8-09-tatu-city" => [
      [ "Wanjiru Kamau", 5, "Spotless two-bedroom with everything we needed. The kitchen is properly equipped and the balcony over the park was our favourite spot in the evenings." ],
      [ "Brian Otieno", 5, "Quiet, secure and very clean. Having two bathrooms made it easy for the four of us." ],
      [ "Achieng Odhiambo", 4, "Comfortable beds and reliable internet, which mattered as I was working. The check-in instructions were clear." ]
    ],
    "githii-farm-house" => [
      [ "David Mwangi", 5, "Perfect for a family get-together. Fresh eggs and milk for breakfast, and the fireplace made the cold evenings cosy." ],
      [ "Fatuma Hassan", 5, "Four bedrooms, each with its own bathroom and hot shower. Peaceful, green and a real break from the city." ],
      [ "James Kiprop", 4, "Lovely, quiet place. Pack warm clothes because the nights get cold, but the electric blankets help." ]
    ]
  }.freeze

  today = Time.zone.today
  SAMPLE_REVIEWS.each do |slug, reviews|
    listing = Listing.find_by(slug:)
    next unless listing

    reviews.each_with_index do |(name, rating, comment), i|
      reviewer = User.find_or_initialize_by(email: "#{name.parameterize}@tgbnb.test")
      reviewer.password = SecureRandom.hex(16) if reviewer.new_record?
      reviewer.update!(name:, role: "guest", email_verified_at: reviewer.email_verified_at || Time.current)
      next if Review.exists?(listing:, author: reviewer)

      # A finished stay in the past, which normal booking rules would refuse.
      nights = 2 + (i % 2)
      check_in = today - (20 + (25 * i))
      now = Time.current
      booking_id = Booking.insert_all([ {
        listing_id: listing.id, guest_id: reviewer.id, check_in:, check_out: check_in + nights,
        guests_count: [ 2, listing.max_guests ].min, nights:, currency: listing.currency,
        nightly_price_cents: listing.nightly_price_cents, cleaning_charge_cents: listing.cleaning_charge_cents,
        total_cents: (listing.nightly_price_cents * nights) + listing.cleaning_charge_cents.to_i,
        status: "completed", created_at: now, updated_at: now
      } ], returning: :id).rows.first.first

      written = (check_in + nights + 1).in_time_zone
      Review.new(booking_id:, listing:, author: reviewer, rating:, comment:, created_at: written, updated_at: written)
        .save!(validate: false)
    end
  end
end

puts "Seeded #{Amenity.count} amenities, #{Category.count} categories, #{Listing.kept.count} listings, #{User.admin.count} admin(s)."
