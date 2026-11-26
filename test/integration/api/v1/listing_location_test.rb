require "test_helper"

# The owner drops a pin for each home. Confirmed guests get the exact pin for
# directions; everyone else sees only the area around it.
class Api::V1::ListingLocationTest < ActionDispatch::IntegrationTest
  test "the owner sets, moves and clears a home's pin" do
    sign_in_as users(:owner)
    patch api_v1_admin_listing_path(listings(:cottage)), params: { listing: { latitude: -1.153347, longitude: 36.931234 } }, as: :json
    assert_response :ok
    assert_equal({ "latitude" => -1.153347, "longitude" => 36.931234 }, response.parsed_body.dig("listing", "location"))

    patch api_v1_admin_listing_path(listings(:cottage)), params: { listing: { latitude: nil, longitude: nil } }, as: :json
    assert_response :ok
    assert_nil response.parsed_body.dig("listing", "location")
    assert_nil response.parsed_body.dig("listing", "map_area")
  end

  test "a pin needs both halves and has to be on the map" do
    sign_in_as users(:owner)
    patch api_v1_admin_listing_path(listings(:cottage)), params: { listing: { latitude: -1.15 } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert response.parsed_body.dig("error", "details", "longitude")

    patch api_v1_admin_listing_path(listings(:cottage)), params: { listing: { latitude: 120, longitude: 36.9 } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert response.parsed_body.dig("error", "details", "latitude")
  end

  test "guests see the area until their stay is confirmed, then the exact pin" do
    listings(:cottage).update!(latitude: -1.153347, longitude: 36.931234)

    get api_v1_listing_path(listings(:cottage)), as: :json
    assert_equal({ "latitude" => -1.15, "longitude" => 36.93 }, response.parsed_body.dig("listing", "map_area"))
    assert_no_match(/931234|153347/, response.body)

    pending = Booking.create!(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 30,
                              check_out: Date.current + 31, guests_count: 1, status: "pending_payment")
    sign_in_as users(:ada)
    get api_v1_booking_path(pending), as: :json
    assert_no_match(/931234|153347/, response.body)

    confirmed = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 40, check_out: Date.current + 41)
    get api_v1_booking_path(confirmed), as: :json
    assert_equal({ "latitude" => -1.153347, "longitude" => 36.931234 },
                 response.parsed_body.dig("booking", "private_details", "location"))
  end
end
