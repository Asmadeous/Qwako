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
    assert_equal %w[wifi], listing["amenities"]
    assert_equal "Kenya", listing["country"]
    assert_equal "KES", listing["currency"]
    assert_equal "harbour-flat", listing["slug"]
  end

  test "a UK nation prices in pounds and other countries are refused" do
    sign_in_as users(:owner)
    post api_v1_admin_listings_path, params: { listing: VALID.merge(address: "St Ives, Cornwall, England") }, as: :json
    assert_response :created
    assert_equal "GBP", response.parsed_body.dig("listing", "currency")

    post api_v1_admin_listings_path, params: { listing: VALID.merge(title: "Paris Loft", address: "Paris, France") }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert response.parsed_body.dig("error", "details", "country").present?
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

  test "admin index includes drafts" do
    sign_in_as users(:owner)
    get api_v1_admin_listings_path, as: :json
    assert_includes response.parsed_body["listings"].map { |listing| listing["title"] }, "Draft Barn"
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
    assert_equal "Cotswolds Cottage", cottage.title
    assert_equal 2, cottage.photos.count
    assert_equal 2, cottage.amenities.count
  end

  test "the owner deletes a home nobody has booked, with its photos" do
    sign_in_as users(:owner)
    listing = listings(:loft)
    listing.bookings.delete_all
    get api_v1_admin_listing_path(listing), as: :json
    assert_equal false, response.parsed_body.dig("listing", "has_bookings")
    assert_difference({ "Listing.count" => -1, "ListingPhoto.count" => -listing.photos.count }) do
      delete api_v1_admin_listing_path(listing), as: :json
    end
    assert_response :no_content
  end

  test "a home with bookings can't be deleted, and guests can't delete" do
    listing = listings(:loft)
    Booking.create!(listing:, guest: users(:ada), check_in: Date.current + 50, check_out: Date.current + 52,
      guests_count: 1, status: "cancelled_by_guest")

    sign_in_as users(:ada)
    delete api_v1_admin_listing_path(listing), as: :json
    assert_response :forbidden

    sign_in_as users(:owner)
    get api_v1_admin_listing_path(listing), as: :json
    assert response.parsed_body.dig("listing", "has_bookings")
    assert_no_difference "Listing.count" do
      delete api_v1_admin_listing_path(listing), as: :json
    end
    assert_error :unprocessable_content, "has_bookings"
  end
end
