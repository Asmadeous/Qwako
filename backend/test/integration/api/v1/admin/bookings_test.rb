require "test_helper"

class Api::V1::Admin::BookingsTest < ActionDispatch::IntegrationTest
  def loft_booking(guest: users(:ada), from: 40, nights: 2, status: "confirmed")
    Booking.create!(listing: listings(:loft), guest:, check_in: Date.current + from,
      check_out: Date.current + from + nights, guests_count: 2, status:)
  end

  def paid(booking)
    booking.payments.create!(reference: Payment.new_reference, amount_cents: booking.total_cents,
      currency: booking.currency, status: "succeeded", channel: "mobile_money", paid_at: Time.current)
  end

  def titles_and_guests
    response.parsed_body["bookings"].map { |booking| [ booking.dig("listing", "title"), booking.dig("guest", "email") ] }
  end

  test "guests are forbidden and visitors must sign in" do
    get api_v1_admin_bookings_path, as: :json
    assert_error :unauthorized, "unauthenticated"

    sign_in_as users(:ada)
    get api_v1_admin_bookings_path, as: :json
    assert_error :forbidden, "forbidden"
    post cancel_api_v1_admin_booking_path(bookings(:grace_cottage)), as: :json
    assert_error :forbidden, "forbidden"
    assert bookings(:grace_cottage).reload.confirmed?
  end

  test "upcoming lists active stays soonest first with guest and payments" do
    later = loft_booking(from: 60)
    paid(later)
    loft_booking(from: 70, status: "cancelled_by_guest")
    past = loft_booking(from: 80)
    past.update_columns(check_in: Date.current - 5, check_out: Date.current - 3)

    sign_in_as users(:owner)
    get api_v1_admin_bookings_path, as: :json
    assert_response :ok
    assert_equal [ [ "Cotswolds Cottage", "grace@example.com" ], [ "Kilimani Loft", "ada@example.com" ] ], titles_and_guests

    row = response.parsed_body["bookings"].last
    assert_equal "Ada Lovelace", row.dig("guest", "name")
    assert row["can_cancel"]
    assert_equal [ [ "succeeded", "mobile_money", false ] ], row["payments"].map { |p| p.values_at("status", "channel", "refund_due") }
    assert_nil response.parsed_body["next_page"]
    assert_equal 0, response.parsed_body["refunds_due"]

    get api_v1_admin_bookings_path(view: "past"), as: :json
    assert_equal [ past.id ], response.parsed_body["bookings"].map { |booking| booking["id"] }
    assert_not response.parsed_body["bookings"].first["can_cancel"]

    get api_v1_admin_bookings_path(view: "cancelled"), as: :json
    assert_equal [ "cancelled_by_guest" ], response.parsed_body["bookings"].map { |booking| booking["status"] }
  end

  test "search matches guest name, email or stay and treats wildcards literally" do
    loft_booking
    sign_in_as users(:owner)

    get api_v1_admin_bookings_path(q: "lovelace"), as: :json
    assert_equal [ [ "Kilimani Loft", "ada@example.com" ] ], titles_and_guests
    get api_v1_admin_bookings_path(q: "grace@"), as: :json
    assert_equal [ [ "Cotswolds Cottage", "grace@example.com" ] ], titles_and_guests
    get api_v1_admin_bookings_path(q: "cotswolds"), as: :json
    assert_equal 1, titles_and_guests.size
    get api_v1_admin_bookings_path(q: "%"), as: :json
    assert_empty response.parsed_body["bookings"]
  end

  test "cancelling a paid stay frees the dates and flags the refund" do
    booking = loft_booking
    payment = paid(booking)
    sign_in_as users(:owner)

    post cancel_api_v1_admin_booking_path(booking), as: :json
    assert_response :ok
    body = response.parsed_body["booking"]
    assert_equal "cancelled_by_owner", body["status"]
    assert body["refund_due"]
    assert_not body["can_cancel"]
    assert payment.reload.refund_due?

    get api_v1_admin_bookings_path(view: "refunds"), as: :json
    assert_equal [ booking.id ], response.parsed_body["bookings"].map { |row| row["id"] }
    assert_equal 1, response.parsed_body["refunds_due"]

    # The nights can be booked again.
    assert loft_booking(guest: users(:grace)).persisted?

    post cancel_api_v1_admin_booking_path(booking), as: :json
    assert_error :unprocessable_content, "not_cancellable"
  end

  test "stays that have ended cannot be cancelled" do
    booking = loft_booking
    booking.update_columns(check_in: Date.current - 3, check_out: Date.current - 1)
    sign_in_as users(:owner)
    post cancel_api_v1_admin_booking_path(booking), as: :json
    assert_error :unprocessable_content, "not_cancellable"
    assert booking.reload.confirmed?
  end

  test "a payment that arrives after the owner cancelled the hold is flagged for refund" do
    sign_in_as users(:ada)
    post api_v1_bookings_path, params: { booking: {
      listing_id: listings(:loft).id, check_in: Date.current + 30, check_out: Date.current + 32, guests_count: 2
    } }, as: :json
    booking = Booking.find(response.parsed_body.dig("booking", "id"))

    sign_in_as users(:owner)
    post cancel_api_v1_admin_booking_path(booking), as: :json
    assert_response :ok

    payment = booking.payments.sole
    payment.settle!("status" => "success", "amount" => payment.amount_cents, "currency" => "KES", "channel" => "card", "id" => 7)
    assert booking.reload.cancelled_by_owner?
    assert payment.reload.refund_due?
  end

  test "the owner records a refund once" do
    booking = loft_booking
    payment = paid(booking)
    booking.cancel_by_owner!
    other = paid(loft_booking(from: 50))
    sign_in_as users(:owner)

    post mark_refunded_api_v1_admin_booking_path(booking, payment_id: other.id), as: :json
    assert_error :not_found, "not_found"

    post mark_refunded_api_v1_admin_booking_path(booking, payment_id: payment.id), as: :json
    assert_response :ok
    assert_not response.parsed_body.dig("booking", "refund_due")
    assert response.parsed_body.dig("booking", "payments", 0, "refunded_at").present?

    post mark_refunded_api_v1_admin_booking_path(booking, payment_id: payment.id), as: :json
    assert_error :unprocessable_content, "no_refund_due"
  end

  test "show returns one booking and 404s for unknown ids" do
    sign_in_as users(:owner)
    get api_v1_admin_booking_path(bookings(:grace_cottage)), as: :json
    assert_response :ok
    assert_equal "Grace Hopper", response.parsed_body.dig("booking", "guest", "name")

    get api_v1_admin_booking_path("not-a-uuid"), as: :json
    assert_error :not_found, "not_found"
  end

  test "lists come in pages of 50" do
    51.times { |i| loft_booking(from: 100 + i, nights: 1) }
    sign_in_as users(:owner)

    get api_v1_admin_bookings_path(view: "all"), as: :json
    assert_equal 50, response.parsed_body["bookings"].size
    assert_equal 2, response.parsed_body["next_page"]

    get api_v1_admin_bookings_path(view: "all", page: 2), as: :json
    assert_equal 2, response.parsed_body["bookings"].size
    assert_nil response.parsed_body["next_page"]
  end
end
