require "test_helper"

class Api::V1::Admin::ListingsTest < ActionDispatch::IntegrationTest
  VALID = {
    title: "Harbour Flat", address: "Diani Beach, Kwale, Kenya", description: "Sea views.",
    house_rules: "No smoking.", max_guests: 3, nightly_price_cents: 2_500_000, cleaning_charge_cents: 300_000,
    photo_urls: %w[https://images.example.com/a.jpg https://images.example.com/b.jpg], amenity_keys: %w[wifi]
  }.freeze

  test "guests are forbidden and visitors must sign in" do
    post api_v1_admin_listings_path, params: { listing: VALID }, as: :json
    assert_error :unauthorized, "unauthenticated"

    sign_in_as users(:ada)
    post api_v1_admin_listings_path, params: { listing: VALID }, as: :json
    assert_error :forbidden, "forbidden"
    get api_v1_admin_listings_path, as: :json
    assert_error :forbidden, "forbidden"
  end

  test "admin creates a listing with ordered photos, amenities and derived country" do
    sign_in_as users(:owner)
    assert_difference "Listing.count", 1 do
      post api_v1_admin_listings_path, params: { listing: VALID }, as: :json
    end
    assert_response :created
    listing = response.parsed_body["listing"]
    assert_equal VALID[:photo_urls], listing["photos"]
    assert_equal %w[wifi], listing["amenities"].pluck("key")
    assert_equal "Kenya", listing["country"]
    assert_equal "KES", listing["currency"]
    assert_equal "harbour-flat", listing["slug"]
  end

  test "homes are in Kenya, priced in shillings, and Kenya is added to the address when missing" do
    sign_in_as users(:owner)
    post api_v1_admin_listings_path, params: { listing: VALID.merge(address: "Malindi, Kilifi") }, as: :json
    assert_response :created
    assert_equal [ "Malindi, Kilifi, Kenya", "Kenya", "KES" ], response.parsed_body["listing"].values_at("address", "country", "currency")

    post api_v1_admin_listings_path, params: { listing: VALID.merge(title: "Lamu House", address: " Shela ,Lamu,  kenya ") }, as: :json
    assert_response :created
    assert_equal "Shela, Lamu, Kenya", response.parsed_body.dig("listing", "address")

    patch api_v1_admin_listing_path(listings(:loft)), params: { listing: { address: "Lavington, Nairobi" } }, as: :json
    assert_response :ok
    assert_equal "Lavington, Nairobi, Kenya", response.parsed_body.dig("listing", "address")
  end

  test "videos are saved in order and checked like photos" do
    sign_in_as users(:owner)
    videos = %w[/rails/active_storage/blobs/redirect/abc/tour.mp4 https://videos.example.com/walk.mp4]
    post api_v1_admin_listings_path, params: { listing: VALID.merge(video_urls: videos) }, as: :json
    assert_response :created
    assert_equal videos, response.parsed_body.dig("listing", "videos")

    post api_v1_admin_listings_path,
      params: { listing: VALID.merge(title: "Bad Video", video_urls: [ "http://insecure.example.com/a.mp4" ]) }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert response.parsed_body.dig("error", "details", "videos").present?
  end

  test "admin index includes drafts and says how many bookings each home has" do
    sign_in_as users(:owner)
    get api_v1_admin_listings_path, as: :json
    rows = response.parsed_body["listings"].to_h { |listing| [ listing["title"], listing["bookings_count"] ] }
    assert_includes rows.keys, "Draft Barn"
    assert_equal 0, rows["Draft Barn"]
    assert_equal Booking.where(listing: listings(:cottage)).count, rows[listings(:cottage).title]
    assert_operator rows[listings(:cottage).title], :>, 0
  end

  test "invalid listings report field errors" do
    sign_in_as users(:owner)
    post api_v1_admin_listings_path,
      params: { listing: VALID.merge(title: "", max_guests: 0, photo_urls: [ "javascript:alert(1)" ]) }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert_equal %w[max_guests photos title], response.parsed_body.dig("error", "details").keys.sort
  end

  test "field errors use the form's labels and a blank area gets one error" do
    sign_in_as users(:owner)
    post api_v1_admin_listings_path, params: { listing: VALID.merge(title: "", address: "", photo_urls: []) }, as: :json
    details = response.parsed_body.dig("error", "details")
    assert_equal [ "Name can't be blank" ], details["title"]
    assert_equal [ "Area can't be blank" ], details["address"]
    assert_equal [ "Photos must include at least one" ], details["photos"]
    assert_nil details["country"]
  end

  test "update replaces photos and amenities in order" do
    sign_in_as users(:owner)
    cottage = listings(:cottage)
    patch api_v1_admin_listing_path(cottage),
      params: { listing: { photo_urls: %w[https://images.example.com/new.jpg https://images.example.com/cottage-1.jpg], amenity_keys: [] } },
      as: :json
    assert_response :ok
    assert_equal %w[https://images.example.com/new.jpg https://images.example.com/cottage-1.jpg],
      cottage.reload.photos.map(&:url)
    assert_empty cottage.amenities
  end

  test "a failed update changes nothing" do
    sign_in_as users(:owner)
    cottage = listings(:cottage)
    patch api_v1_admin_listing_path(cottage),
      params: { listing: { title: "", photo_urls: %w[https://images.example.com/new.jpg], amenity_keys: [] } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    cottage.reload
    assert_equal "Naivasha Cottage", cottage.title
    assert_equal 2, cottage.photos.count
    assert_equal 2, cottage.amenities.count
  end

  test "the owner deletes a home nobody has booked, with its photos" do
    sign_in_as users(:owner)
    listing = listings(:loft)
    listing.bookings.delete_all
    get api_v1_admin_listing_path(listing), as: :json
    assert_equal 0, response.parsed_body.dig("listing", "bookings_count")
    assert_difference({ "Listing.count" => -1, "ListingPhoto.count" => -listing.photos.count }) do
      delete api_v1_admin_listing_path(listing), as: :json
    end
    assert_response :no_content
  end

  test "guests can't delete a home" do
    sign_in_as users(:ada)
    delete api_v1_admin_listing_path(listings(:loft)), as: :json
    assert_response :forbidden
    assert Listing.exists?(listings(:loft).id)
  end

  test "deleting a booked home hides it everywhere but keeps its bookings and payments" do
    listing = listings(:loft)
    booking = Booking.create!(listing:, guest: users(:ada), check_in: Date.current + 50, check_out: Date.current + 52,
      guests_count: 1)
    booking.update_columns(status: "cancelled_by_guest")

    sign_in_as users(:owner)
    get api_v1_admin_listing_path(listing), as: :json
    assert_equal [ 1, 0 ], response.parsed_body["listing"].values_at("bookings_count", "upcoming_count")

    assert_no_difference [ "Listing.count", "Booking.count" ] do
      delete api_v1_admin_listing_path(listing), as: :json
    end
    assert_response :no_content
    assert listing.reload.deleted?
    assert_equal "unlisted", listing.status

    get api_v1_admin_listings_path, as: :json
    assert_not_includes response.parsed_body["listings"].map { |l| l["id"] }, listing.id
    get api_v1_admin_listing_path(listing), as: :json
    assert_response :not_found
    get api_v1_admin_booking_path(booking), as: :json
    assert_equal listing.title, response.parsed_body.dig("booking", "listing", "title")
    get api_v1_admin_categories_path, as: :json
    assert_equal 0, response.parsed_body["categories"].find { |c| c["slug"] == "city-homes" }["homes_count"]

    delete api_v1_session_path, as: :json
    get api_v1_listings_path, as: :json
    assert_not_includes response.parsed_body["listings"].map { |l| l["id"] }, listing.id
  end

  test "a home with stays still to come can't be deleted" do
    listing = listings(:cottage)
    assert listing.upcoming_stays.exists?

    sign_in_as users(:owner)
    assert_no_changes -> { listing.reload.deleted_at } do
      delete api_v1_admin_listing_path(listing), as: :json
    end
    assert_error :unprocessable_content, "has_upcoming_stays"
  end
end
