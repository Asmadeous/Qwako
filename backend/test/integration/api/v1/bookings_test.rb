require "test_helper"

class Api::V1::BookingsTest < ActionDispatch::IntegrationTest
  def book(listing: listings(:cottage), check_in: Date.current + 20, check_out: Date.current + 23, **extra)
    post api_v1_bookings_path, params: { booking: {
      listing_id: listing.id, check_in:, check_out:, guests_count: 2
    }.merge(extra) }, as: :json
  end

  test "visitors must sign in to book" do
    book
    assert_error :unauthorized, "unauthenticated"
  end

  test "the server prices the stay and ignores any client total" do
    sign_in_as users(:ada)
    assert_difference "Booking.count", 1 do
      book(total_cents: 1, nightly_price_cents: 1)
    end
    assert_response :created
    booking = response.parsed_body["booking"]
    assert_equal 3, booking["nights"]
    assert_equal 21000, booking["nightly_price_cents"]
    assert_equal 3000, booking["cleaning_charge_cents"]
    assert_equal 66000, booking["total_cents"]
    assert_equal "confirmed", booking["status"]
    assert_equal "Cotswolds Cottage", booking.dig("listing", "title")
  end

  test "a Kenyan stay is booked in shillings" do
    sign_in_as users(:ada)
    book(listing: listings(:loft), guests_count: 2)
    assert_response :created
    booking = response.parsed_body["booking"]
    assert_equal "KES", booking["currency"]
    assert_equal 3 * 950000, booking["total_cents"]
    assert_equal "pending_payment", booking["status"]
  end

  test "overlapping dates are refused, back-to-back stays are fine" do
    sign_in_as users(:ada)
    book(check_in: Date.current + 12, check_out: Date.current + 14)
    assert_error :unprocessable_content, "validation_failed"
    assert_equal [ "Those dates are no longer available." ], response.parsed_body.dig("error", "details", "base")

    book(check_in: Date.current + 13, check_out: Date.current + 15)
    assert_response :created
  end

  test "rule violations report field errors" do
    sign_in_as users(:ada)
    book(guests_count: 9, check_in: Date.current - 1, check_out: Date.current + 1)
    assert_error :unprocessable_content, "validation_failed"
    assert_equal %w[check_in guests_count], response.parsed_body.dig("error", "details").keys.sort

    book(check_in: Date.current + 5, check_out: Date.current + 5)
    assert response.parsed_body.dig("error", "details", "check_out").present?

    book(check_in: Date.current + 5, check_out: Date.current + 40)
    assert response.parsed_body.dig("error", "details", "check_out").present?
  end

  test "draft and unknown listings cannot be booked" do
    sign_in_as users(:ada)
    book(listing: listings(:hidden))
    assert response.parsed_body.dig("error", "details", "listing").present?

    post api_v1_bookings_path, params: { booking: { listing_id: SecureRandom.uuid } }, as: :json
    assert response.parsed_body.dig("error", "details", "listing").present?
  end

  test "guests see only their own bookings" do
    sign_in_as users(:grace)
    get api_v1_bookings_path, as: :json
    assert_equal [ bookings(:grace_cottage).id ], response.parsed_body["bookings"].map { |booking| booking["id"] }
    get api_v1_booking_path(bookings(:grace_cottage)), as: :json
    assert_response :ok

    sign_in_as users(:ada)
    get api_v1_bookings_path, as: :json
    assert_empty response.parsed_body["bookings"]
    get api_v1_booking_path(bookings(:grace_cottage)), as: :json
    assert_error :not_found, "not_found"
  end
end
