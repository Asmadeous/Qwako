require "test_helper"

class Api::V1::ProfilesTest < ActionDispatch::IntegrationTest
  test "visitors must sign in" do
    patch api_v1_profile_path, params: { name: "X" }, as: :json
    assert_error :unauthorized, "unauthenticated"
  end

  test "updates name and avatar" do
    sign_in_as users(:ada)
    patch api_v1_profile_path, params: { name: "  Ada King  ", avatar: fixture_file_upload("photo.png", "image/png") }
    assert_response :ok
    assert_equal "Ada King", response.parsed_body.dig("user", "name")
    assert_match %r{\A/rails/active_storage/blobs/}, response.parsed_body.dig("user", "avatar_url")
  end

  test "rejects a non-image avatar" do
    sign_in_as users(:ada)
    patch api_v1_profile_path, params: { avatar: fixture_file_upload("notes.txt", "text/plain") }
    assert_error :unprocessable_content, "validation_failed"
    assert response.parsed_body.dig("error", "details", "avatar").present?
  end

  test "a password change needs the current password" do
    sign_in_as users(:ada)
    patch api_v1_profile_path, params: { current_password: "wrong", password: "new-password-1" }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert response.parsed_body.dig("error", "details", "current_password").present?

    patch api_v1_profile_path, params: { current_password: "password123", password: "new-password-1" }, as: :json
    assert_response :ok
    assert users(:ada).reload.authenticate("new-password-1")
  end
end
