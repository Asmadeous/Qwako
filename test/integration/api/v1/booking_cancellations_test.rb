require "test_helper"

class Api::V1::BookingCancellationsTest < ActionDispatch::IntegrationTest
  def loft_booking(guest: users(:ada), from: 40, status: "confirmed")
    Booking.create!(listing: listings(:loft), guest:, check_in: Date.current + from,
      check_out: Date.current + from + 2, guests_count: 2, status:)
  end

  def paid(booking)
    booking.payments.create!(reference: Payment.new_reference, amount_cents: booking.total_cents,
      currency: booking.currency, status: "succeeded", channel: "card", paid_at: Time.current)
  end

  test "a guest cancels a paid booking, which frees the dates and flags the refund" do
    booking = loft_booking
    payment = paid(booking)
    sign_in_as users(:ada)

    get api_v1_booking_path(booking), as: :json
    assert response.parsed_body.dig("booking", "guest_can_cancel")
    assert_equal booking.total_cents, response.parsed_body.dig("booking", "paid_cents")

    post cancel_api_v1_booking_path(booking), as: :json
    assert_response :success
    assert_equal "cancelled_by_guest", response.parsed_body.dig("booking", "status")
    assert_not response.parsed_body.dig("booking", "guest_can_cancel")
    assert payment.reload.needs_refund
    assert loft_booking(guest: users(:grace)).persisted?, "the dates are free again"
  end

  test "an unpaid hold is cancelled with nothing to refund" do
    booking = loft_booking(status: "pending_payment")
    sign_in_as users(:ada)
    post cancel_api_v1_booking_path(booking), as: :json
    assert_response :success
    assert booking.reload.cancelled_by_guest?
    assert_empty Payment.refund_due
  end

  test "a booking can't be cancelled on or after its check-in day, or twice" do
    sign_in_as users(:ada)
    started = loft_booking(from: 0)
    post cancel_api_v1_booking_path(started), as: :json
    assert_error :unprocessable_content, "not_cancellable"
    assert started.reload.confirmed?

    cancelled = loft_booking(status: "cancelled_by_owner")
    post cancel_api_v1_booking_path(cancelled), as: :json
    assert_error :unprocessable_content, "not_cancellable"
  end

  test "guests can only cancel their own bookings" do
    booking = loft_booking(guest: users(:grace))
    sign_in_as users(:ada)
    post cancel_api_v1_booking_path(booking), as: :json
    assert_response :not_found
    assert booking.reload.confirmed?
  end
end
