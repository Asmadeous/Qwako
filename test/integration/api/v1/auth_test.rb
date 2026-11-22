require "test_helper"

class Api::V1::AuthTest < ActionDispatch::IntegrationTest
  USER_KEYS = %w[id email name role phone email_messages avatar_url email_verified marketing_consent google_linked].freeze

  def sign_up(name: "Sam Taylor", email: "sam@example.com", password: "password123")
    post api_v1_registrations_path, params: { user: { name:, email:, password: } }, as: :json
  end

  def sign_in(email: "ada@example.com", password: "password123")
    post api_v1_session_path, params: { email:, password: }, as: :json
  end

  def current_user_json
    get api_v1_session_path, as: :json
    response.parsed_body["user"]
  end

  test "sign-up creates a guest, signs them in and returns only public fields" do
    assert_difference [ "User.count", "Session.count" ], 1 do
      sign_up(email: " Sam@Example.com ")
    end

    assert_response :created
    assert_equal USER_KEYS, response.parsed_body["user"].keys
    assert_equal "sam@example.com", response.parsed_body.dig("user", "email")
    assert_no_match(/password/, response.body)
    assert_equal "sam@example.com", current_user_json["email"]
  end

  test "sign-up sets an httponly SameSite=Lax session cookie" do
    sign_up
    set_cookie = Array(response.headers["Set-Cookie"]).join("\n")
    assert_match(/session_id=/, set_cookie)
    assert_match(/httponly/i, set_cookie)
    assert_match(/samesite=lax/i, set_cookie)
  end

  test "sign-up with a taken email returns field details" do
    assert_no_difference "User.count" do
      sign_up(email: "ADA@example.com")
    end
    assert_error :unprocessable_content, "validation_failed"
    assert_equal [ "Email is already registered" ], response.parsed_body.dig("error", "details", "email")
  end

  test "sign-up with missing fields reports each field" do
    post api_v1_registrations_path, params: { user: { name: "", email: "", password: "" } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert_equal %w[email name password].sort, response.parsed_body.dig("error", "details").keys.sort
  end

  test "sign-up without a user object is a validation failure, not a crash" do
    post api_v1_registrations_path, params: {}, as: :json
    assert_error :unprocessable_content, "validation_failed"
  end

  test "sign-up with a short password is rejected" do
    sign_up(password: "short12")
    assert_error :unprocessable_content, "validation_failed"
    assert response.parsed_body.dig("error", "details", "password").present?
  end

  test "sign-in with correct credentials starts a session" do
    assert_difference "Session.count", 1 do
      sign_in(email: " ADA@example.com ")
    end
    assert_response :ok
    assert_equal USER_KEYS, response.parsed_body["user"].keys
    assert_no_match(/password/, response.body)
    assert_equal users(:ada).id, current_user_json["id"]
  end

  test "wrong password and unknown email give the same 401" do
    sign_in(password: "wrong-password")
    assert_error :unauthorized, "invalid_credentials"
    wrong_password = response.parsed_body

    sign_in(email: "nobody@example.com")
    assert_error :unauthorized, "invalid_credentials"
    assert_equal wrong_password, response.parsed_body
    assert_nil current_user_json
  end

  test "sign-in with missing fields is a 401" do
    post api_v1_session_path, params: {}, as: :json
    assert_error :unauthorized, "invalid_credentials"
  end

  test "current user is null when signed out" do
    assert_nil current_user_json
    assert_response :ok
  end

  test "current user is null for a tampered cookie" do
    cookies["session_id"] = "forged"
    assert_nil current_user_json
  end

  test "sign-out deletes the session and the old cookie no longer works" do
    sign_in
    old_cookie = cookies["session_id"]

    assert_difference "Session.count", -1 do
      delete api_v1_session_path, as: :json
    end
    assert_response :no_content
    assert_nil current_user_json

    cookies["session_id"] = old_cookie
    assert_nil current_user_json
  end

  test "sign-out when signed out is still 204" do
    delete api_v1_session_path, as: :json
    assert_response :no_content
  end

  test "sign-in is rate limited after 10 attempts" do
    10.times { sign_in(password: "wrong-password") }
    assert_response :unauthorized
    sign_in
    assert_error :too_many_requests, "rate_limited"
  end

  test "sign-up is rate limited after 10 attempts" do
    10.times { |i| sign_up(email: "user#{i}@example.com") }
    assert_response :created
    sign_up(email: "user10@example.com")
    assert_error :too_many_requests, "rate_limited"
  end

  test "sign-up with a non-object user param is a validation failure, not a 500" do
    post api_v1_registrations_path, params: { user: "x" }, as: :json
    assert_error :unprocessable_content, "validation_failed"
  end

  test "a sign-up that loses the unique-index race still gets the 422" do
    original_new = User.method(:new)
    User.define_singleton_method(:new) do |*args, **kwargs, &block|
      original_new.call(*args, **kwargs, &block).tap do |user|
        user.define_singleton_method(:save) { |*| raise ActiveRecord::RecordNotUnique, "duplicate" }
      end
    end

    assert_no_difference [ "User.count", "Session.count" ] do
      sign_up
    end
    assert_error :unprocessable_content, "validation_failed"
    assert_equal [ "Email is already registered" ], response.parsed_body.dig("error", "details", "email")
  ensure
    User.singleton_class.remove_method(:new)
  end

  test "signing in again in the same browser replaces the old session" do
    sign_in
    old_cookie = cookies["session_id"]

    assert_no_difference "Session.count" do
      sign_in
    end
    cookies["session_id"] = old_cookie
    assert_nil current_user_json
  end

  test "cross-site form posts cannot sign in or sign up" do
    post api_v1_session_path, params: { email: "ada@example.com", password: "password123" },
      headers: { "Origin" => "https://evil.example" }
    assert_error :forbidden, "forbidden_origin"
    assert_nil response.headers["Set-Cookie"]

    post api_v1_registrations_path, params: { user: { name: "X", email: "x@example.com", password: "password123" } },
      headers: { "Origin" => "https://evil.example" }
    assert_error :forbidden, "forbidden_origin"
  end

  test "the dev client origin and same-origin requests are allowed" do
    post api_v1_session_path, params: { email: "ada@example.com", password: "password123" },
      headers: { "Origin" => "http://localhost:5173" }, as: :json
    assert_response :ok

    post api_v1_session_path, params: { email: "ada@example.com", password: "password123" },
      headers: { "Origin" => "http://www.example.com" }, as: :json
    assert_response :ok
  end
end
