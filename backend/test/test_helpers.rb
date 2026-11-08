# Stands in for the Paystack API. Tests set the transaction result to return.
class FakePaystack
  attr_reader :initialized
  attr_accessor :fail_with, :result

  def initialize
    @initialized = []
    @result = {}
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
  def sign_in_as(user, password: "password123")
    post api_v1_session_path, params: { email: user.email, password: }, as: :json
    assert_response :ok
  end

  def assert_error(status, code)
    assert_response status
    assert_equal code, response.parsed_body.dig("error", "code"), response.body
  end
end
