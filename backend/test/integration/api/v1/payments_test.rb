require "test_helper"

class Api::V1::PaymentsTest < ActionDispatch::IntegrationTest
  def book_loft(check_in: Date.current + 30, check_out: Date.current + 32)
    post api_v1_bookings_path, params: { booking: {
      listing_id: listings(:loft).id, check_in:, check_out:, guests_count: 2
    } }, as: :json
  end

  def paid(booking, **extra)
    { "status" => "success", "amount" => booking.total_cents, "currency" => "KES", "channel" => "mobile_money", "id" => 991 }
      .merge(extra.stringify_keys)
  end

  def webhook(body, signature: nil)
    payload = body.to_json
    signature ||= OpenSSL::HMAC.hexdigest("SHA512", ENV["PAYSTACK_SECRET_KEY"], payload)
    post api_v1_webhooks_paystack_path, params: payload,
      headers: { "Content-Type" => "application/json", "X-Paystack-Signature" => signature }
  end

  test "a Kenyan stay is held for payment and the guest is sent to Paystack" do
    sign_in_as users(:ada)
    book_loft
    assert_response :created
    body = response.parsed_body
    assert_equal "pending_payment", body.dig("booking", "status")
    assert body.dig("booking", "hold_expires_at").present?

    payment = Booking.find(body.dig("booking", "id")).payments.sole
    assert_equal "https://checkout.paystack.com/#{payment.reference}", body["checkout_url"]
    assert_equal 2 * 950000, payment.amount_cents
    assert_equal "KES", payment.currency

    request = Paystack.client.initialized.sole
    assert_equal users(:ada).email, request[:email]
    assert_equal payment.amount_cents, request[:amount]
    assert_equal "KES", request[:currency]
    assert_equal "http://localhost:5173/account/bookings/#{payment.booking_id}", request[:callback_url]
  end

  test "if Paystack is down the hold is released and the guest is told" do
    sign_in_as users(:ada)
    Paystack.client.fail_with = "timeout"
    book_loft
    assert_error :bad_gateway, "payment_unavailable"
    assert_equal "expired", Booking.order(:created_at).last.status

    Paystack.client.fail_with = nil
    book_loft
    assert_response :created
  end

  test "returning from Paystack confirms the stay once Paystack reports success" do
    sign_in_as users(:ada)
    book_loft
    booking = Booking.find(response.parsed_body.dig("booking", "id"))

    post verify_api_v1_booking_payment_path(booking), as: :json
    assert_response :ok
    assert_equal "pending_payment", response.parsed_body.dig("booking", "status")

    Paystack.client.result = paid(booking)
    post verify_api_v1_booking_payment_path(booking), as: :json
    assert_equal "confirmed", response.parsed_body.dig("booking", "status")
    payment = booking.payments.sole
    assert payment.succeeded?
    assert_equal "mobile_money", payment.channel
  end

  test "a payment for the wrong amount does not confirm the stay" do
    sign_in_as users(:ada)
    book_loft
    booking = Booking.find(response.parsed_body.dig("booking", "id"))
    Paystack.client.result = paid(booking, amount: 100)
    post verify_api_v1_booking_payment_path(booking), as: :json
    assert_equal "pending_payment", response.parsed_body.dig("booking", "status")
    assert booking.payments.sole.failed?
  end

  test "a signed webhook confirms the stay and repeats are harmless" do
    sign_in_as users(:ada)
    book_loft
    booking = Booking.find(response.parsed_body.dig("booking", "id"))
    reference = booking.payments.sole.reference

    2.times do
      webhook({ event: "charge.success", data: paid(booking, reference:) })
      assert_response :ok
    end
    assert booking.reload.confirmed?
    assert booking.payments.sole.succeeded?
  end

  test "unsigned or forged webhooks are refused" do
    sign_in_as users(:ada)
    book_loft
    booking = Booking.find(response.parsed_body.dig("booking", "id"))
    webhook({ event: "charge.success", data: paid(booking, reference: booking.payments.sole.reference) }, signature: "forged")
    assert_response :unauthorized
    assert booking.reload.pending_payment?
  end

  test "unpaid holds expire and free the dates" do
    sign_in_as users(:ada)
    book_loft
    booking = Booking.find(response.parsed_body.dig("booking", "id"))

    travel Booking::HOLD_MINUTES.minutes + 1.second do
      post api_v1_booking_payment_path(booking), as: :json
      assert_error :unprocessable_content, "hold_expired"
      assert booking.reload.expired?

      sign_in_as users(:grace)
      book_loft
      assert_response :created
    end
  end

  test "a late payment confirms if the dates are still free, otherwise it needs a refund" do
    sign_in_as users(:ada)
    book_loft
    late = Booking.find(response.parsed_body.dig("booking", "id"))
    book_loft(check_in: Date.current + 40, check_out: Date.current + 42)
    lost = Booking.find(response.parsed_body.dig("booking", "id"))

    travel Booking::HOLD_MINUTES.minutes + 1.second do
      Booking.expire_stale_holds!
      sign_in_as users(:grace)
      book_loft(check_in: Date.current + 40, check_out: Date.current + 42)
      assert_response :created

      late.payments.sole.settle!(paid(late))
      assert late.reload.confirmed?

      lost.payments.sole.settle!(paid(lost))
      assert lost.reload.expired?
      assert lost.payments.sole.needs_refund?
    end
  end

  test "guests can only pay for their own bookings" do
    sign_in_as users(:ada)
    book_loft
    booking_id = response.parsed_body.dig("booking", "id")

    sign_in_as users(:grace)
    post verify_api_v1_booking_payment_path(booking_id), as: :json
    assert_error :not_found, "not_found"
  end
end
