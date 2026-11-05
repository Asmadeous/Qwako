require "test_helper"

class Api::V1::Admin::UploadsTest < ActionDispatch::IntegrationTest
  test "admin uploads images and gets servable URLs" do
    sign_in_as users(:owner)
    post api_v1_admin_uploads_path, params: { photos: [ fixture_file_upload("photo.png", "image/png") ] }
    assert_response :created
    url = response.parsed_body["urls"].first
    assert_match %r{\A/rails/active_storage/blobs/}, url

    get url
    assert_response :redirect
  end

  test "non-images and empty uploads are rejected" do
    sign_in_as users(:owner)
    post api_v1_admin_uploads_path, params: { photos: [ fixture_file_upload("notes.txt", "text/plain") ] }
    assert_error :unprocessable_content, "invalid_upload"

    post api_v1_admin_uploads_path, params: {}
    assert_error :unprocessable_content, "invalid_upload"
  end

  test "guests cannot upload" do
    sign_in_as users(:ada)
    post api_v1_admin_uploads_path, params: { photos: [ fixture_file_upload("photo.png", "image/png") ] }
    assert_error :forbidden, "forbidden"
  end
end
