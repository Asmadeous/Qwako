require "test_helper"

class Api::V1::PasswordResetsTest < ActionDispatch::IntegrationTest
  include ActionMailer::TestHelper

  test "asking for a reset emails a link, and the reply is the same for unknown emails" do
    assert_enqueued_email_with PasswordsMailer, :reset, args: ->(args) {
      args.first == users(:ada) && URI(args.last).query.then { |q| User.find_by_password_reset_token(Rack::Utils.parse_query(q)["token"]) == users(:ada) }
    } do
      post api_v1_password_reset_path, params: { email: " ADA@example.com " }, as: :json
    end
    assert_response :accepted

    assert_no_enqueued_emails do
      post api_v1_password_reset_path, params: { email: "nobody@example.com" }, as: :json
    end
    assert_response :accepted
  end

  test "the emailed link sets a new password, signs in, and only works once" do
    user = users(:ada)
    sign_in_as user
    other_device = user.sessions.count

    token = user.password_reset_token
    patch api_v1_password_reset_path, params: { token: token, password: "brand-new-pass" }, as: :json
    assert_response :success
    assert_equal user.email, response.parsed_body.dig("user", "email")
    assert user.reload.authenticate("brand-new-pass")
    assert_equal 1, user.sessions.count, "other devices are signed out (had #{other_device})"

    patch api_v1_password_reset_path, params: { token: token, password: "another-pass-1" }, as: :json
    assert_error :unprocessable_content, "invalid_token"
  end

  test "a short or empty new password is refused" do
    token = users(:ada).password_reset_token
    patch api_v1_password_reset_path, params: { token: token, password: "short" }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    patch api_v1_password_reset_path, params: { token: token, password: "" }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert users(:ada).reload.authenticate("password123")
  end

  test "a made-up token is refused" do
    patch api_v1_password_reset_path, params: { token: "not-a-token", password: "brand-new-pass" }, as: :json
    assert_error :unprocessable_content, "invalid_token"
  end

  test "the email holds the reset link" do
    email = PasswordsMailer.reset(users(:ada), "https://site.test/reset-password/abc")
    assert_equal [ "ada@example.com" ], email.to
    assert_includes email.text_part.body.to_s, "https://site.test/reset-password/abc"
  end
end
