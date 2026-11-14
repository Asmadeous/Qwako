# Stands in for the Paystack API. Tests set the transaction result to return.
class FakePaystack
  attr_reader :initialized, :refunds
  attr_accessor :fail_with, :result

  def initialize
    @initialized = []
    @refunds = []
    @result = {}
  end

  def refund(transaction:, amount:)
    raise Paystack::Error, fail_with if fail_with

    @refunds << { transaction:, amount: }
    { "id" => 9001, "status" => "pending" }
  end

  def initialize_transaction(**args)
    raise Paystack::Error, fail_with if fail_with

    @initialized << args
    { "authorization_url" => "https://checkout.paystack.com/#{args[:reference]}", "reference" => args[:reference] }
  end

  def verify_transaction(reference)
    raise Paystack::Error, fail_with if fail_with

    { "reference" => reference, "status" => "abandoned" }.merge(result)
  end
end

module ApiTestHelpers
  # A booking the guest has paid for, through the same path Paystack takes.
  def paid_booking(listing:, guest:, check_in:, check_out:, guests_count: 1)
    booking = Booking.create!(listing:, guest:, check_in:, check_out:, guests_count:, status: "pending_payment")
    payment = booking.payments.create!(reference: Payment.new_reference, amount_cents: booking.total_cents, currency: booking.currency)
    payment.settle!("status" => "success", "amount" => payment.amount_cents, "currency" => payment.currency,
                    "channel" => "mobile_money", "id" => 4242)
    booking.reload
  end

  def sign_in_as(user, password: "password123")
    post api_v1_session_path, params: { email: user.email, password: }, as: :json
    assert_response :ok
  end

  def assert_error(status, code)
    assert_response status
    assert_equal code, response.parsed_body.dig("error", "code"), response.body
  end
end
