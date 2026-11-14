require "test_helper"

class Api::V1::BookingRulesTest < ActionDispatch::IntegrationTest
  include ActionMailer::TestHelper

  test "a paid stay is confirmed, emailed with a receipt, and both sides are notified" do
    assert_enqueued_emails 2 do # guest receipt + owner
      @booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 20, check_out: Date.current + 22)
    end
    assert @booking.confirmed?
    assert_equal "booking_confirmed", users(:ada).notifications.order(:created_at).last.kind
    assert_equal "new_booking", users(:owner).notifications.order(:created_at).last.kind
  end

  test "check-in instructions and wifi are shown only once the stay is confirmed" do
    listings(:cottage).update!(check_in_instructions: "Key in the lockbox, code 4821", wifi_details: "TG-guest / pass")
    pending = Booking.create!(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 30,
                              check_out: Date.current + 31, guests_count: 1, status: "pending_payment")
    sign_in_as users(:ada)
    get api_v1_booking_path(pending), as: :json
    assert_no_match(/lockbox/, response.body)

    get api_v1_listing_path(listings(:cottage)), as: :json
    assert_no_match(/lockbox/, response.body)

    confirmed = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 40, check_out: Date.current + 41)
    get api_v1_booking_path(confirmed), as: :json
    assert_equal "Key in the lockbox, code 4821", response.parsed_body.dig("booking", "private_details", "check_in_instructions")
  end

  test "homes that take requests wait for the owner, who accepts or declines" do
    listings(:cottage).update!(booking_type: "request")
    booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 20, check_out: Date.current + 22)
    assert booking.requested?
    assert_in_delta 24.hours.from_now, booking.requested_until, 5

    sign_in_as users(:owner)
    get api_v1_admin_bookings_path(view: "requests"), as: :json
    assert_equal [ booking.id ], response.parsed_body["bookings"].map { |b| b["id"] }

    post accept_api_v1_admin_booking_path(booking), as: :json
    assert_equal "confirmed", response.parsed_body.dig("booking", "status")

    other = paid_booking(listing: listings(:cottage), guest: users(:grace), check_in: Date.current + 30, check_out: Date.current + 31)
    post decline_api_v1_admin_booking_path(other), params: { reason: "Closed for a family visit" }, as: :json
    assert_equal "declined", response.parsed_body.dig("booking", "status")
    assert_equal other.total_cents, other.payments.first.reload.refund_cents
    assert other.payments.first.refund_due?
  end

  test "an unanswered request is declined after 24 hours and refunded" do
    listings(:cottage).update!(booking_type: "request")
    booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 20, check_out: Date.current + 22)
    travel 25.hours do
      Booking.expire_stale_holds!
      assert booking.reload.declined?
      assert booking.refund_due?
    end
  end

  test "the cancellation policy decides the guest's refund, shown before cancelling" do
    listings(:cottage).update!(cancellation_policy: "moderate")
    soon = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 3, check_out: Date.current + 5)
    later = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 30, check_out: Date.current + 32)

    sign_in_as users(:ada)
    get api_v1_booking_path(soon), as: :json
    assert_equal soon.total_cents / 2, response.parsed_body.dig("booking", "cancel_refund_cents")

    post cancel_api_v1_booking_path(soon), as: :json
    assert_equal soon.total_cents / 2, soon.payments.first.reload.refund_cents
    post cancel_api_v1_booking_path(later), as: :json
    assert_equal later.total_cents, later.payments.first.reload.refund_cents
  end

  test "strict homes refund half a week out and nothing after" do
    listings(:cottage).update!(cancellation_policy: "strict")
    booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 3, check_out: Date.current + 5)
    booking.cancel_by_guest!
    assert_not booking.payments.first.reload.refund_due?
  end

  test "the owner's cancellation always refunds in full" do
    listings(:cottage).update!(cancellation_policy: "strict")
    booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 3, check_out: Date.current + 5)
    sign_in_as users(:owner)
    post cancel_api_v1_admin_booking_path(booking), params: { reason: "Burst pipe" }, as: :json
    assert_response :ok
    assert_equal booking.total_cents, booking.payments.first.reload.refund_cents
    assert_equal "Burst pipe", booking.reload.cancel_reason
    assert_equal "booking_cancelled", users(:ada).notifications.order(:created_at).last.kind
  end

  test "a guest moves their stay to free dates; shorter refunds the difference, longer is refused" do
    booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 20, check_out: Date.current + 23)
    sign_in_as users(:ada)

    post reschedule_api_v1_booking_path(booking), params: { check_in: Date.current + 11, check_out: Date.current + 14 }, as: :json
    assert_equal [ "Those dates are no longer available." ], response.parsed_body.dig("error", "details", "base")

    post reschedule_api_v1_booking_path(booking), params: { check_in: Date.current + 30, check_out: Date.current + 34 }, as: :json
    assert_match(/longer stay/, response.parsed_body.dig("error", "details", "base").first)

    post reschedule_api_v1_booking_path(booking), params: { check_in: Date.current + 30, check_out: Date.current + 32 }, as: :json
    assert_response :ok
    assert_equal (Date.current + 30).iso8601, response.parsed_body.dig("booking", "check_in")
    assert_equal 2, response.parsed_body.dig("booking", "nights")
    assert_equal listings(:cottage).nightly_price_cents, booking.payments.first.reload.refund_cents
    assert_equal "booking_moved", users(:owner).notifications.order(:created_at).last.kind
  end

  test "the owner moves a stay" do
    booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 20, check_out: Date.current + 23)
    sign_in_as users(:owner)
    post reschedule_api_v1_admin_booking_path(booking), params: { check_in: Date.current + 40, check_out: Date.current + 43 }, as: :json
    assert_response :ok
    assert_equal (Date.current + 43).iso8601, response.parsed_body.dig("booking", "check_out")
    assert_equal "booking_moved", users(:ada).notifications.order(:created_at).last.kind
  end

  test "the owner refunds through Paystack" do
    booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 20, check_out: Date.current + 23)
    booking.cancel_by_guest!
    payment = booking.payments.first

    sign_in_as users(:owner)
    post refund_api_v1_admin_booking_path(booking), params: { payment_id: payment.id }, as: :json
    assert_response :ok
    assert_equal [ { transaction: "4242", amount: booking.total_cents } ], Paystack.client.refunds
    assert payment.reload.refunded_at
    assert_equal "refund_sent", users(:ada).notifications.order(:created_at).last.kind

    post refund_api_v1_admin_booking_path(booking), params: { payment_id: payment.id }, as: :json
    assert_error :unprocessable_content, "no_refund_due"
  end

  test "a refund Paystack refuses stays due" do
    booking = paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 20, check_out: Date.current + 23)
    booking.cancel_by_guest!
    Paystack.client.fail_with = "Insufficient balance"
    sign_in_as users(:owner)
    post refund_api_v1_admin_booking_path(booking), params: { payment_id: booking.payments.first.id }, as: :json
    assert_error :bad_gateway, "refund_failed"
    assert booking.payments.first.reload.refund_due?
  end
end
