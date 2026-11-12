require "test_helper"
require "image_processing/vips"

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

  test "large photos are stored as upright JPEGs no wider than 2000px" do
    big = Tempfile.new([ "wide", ".png" ])
    Vips::Image.black(3000, 1500).write_to_file(big.path)
    sign_in_as users(:owner)
    post api_v1_admin_uploads_path, params: { photos: [ Rack::Test::UploadedFile.new(big.path, "image/png", original_filename: "Beach view.png") ] }
    assert_response :created

    blob = ActiveStorage::Blob.order(:created_at).last
    assert_equal [ "Beach view.jpg", "image/jpeg" ], [ blob.filename.to_s, blob.content_type ]
    image = Vips::Image.new_from_buffer(blob.download, "")
    assert_equal [ 2000, 1000 ], [ image.width, image.height ]
  ensure
    big&.close!
  end

  test "a file that claims to be a photo but isn't one is refused" do
    sign_in_as users(:owner)
    post api_v1_admin_uploads_path, params: { photos: [ fixture_file_upload("notes.txt", "image/jpeg") ] }
    assert_error :unprocessable_content, "invalid_upload"
  end

  test "non-images and empty uploads are rejected" do
    sign_in_as users(:owner)
    post api_v1_admin_uploads_path, params: { photos: [ fixture_file_upload("notes.txt", "text/plain") ] }
    assert_error :unprocessable_content, "invalid_upload"

    post api_v1_admin_uploads_path, params: {}
    assert_error :unprocessable_content, "invalid_upload"
  end

  test "admin uploads videos and video rules apply" do
    sign_in_as users(:owner)
    post api_v1_admin_uploads_path, params: { videos: [ fixture_file_upload("photo.png", "video/mp4") ] }
    assert_response :created
    assert_match %r{\A/rails/active_storage/blobs/}, response.parsed_body["urls"].first

    post api_v1_admin_uploads_path, params: { videos: [ fixture_file_upload("photo.png", "image/png") ] }
    assert_error :unprocessable_content, "invalid_upload"
    assert_equal "Videos must be MP4, WebM or MOV files.", response.parsed_body.dig("error", "message")
  end

  test "guests cannot upload" do
    sign_in_as users(:ada)
    post api_v1_admin_uploads_path, params: { photos: [ fixture_file_upload("photo.png", "image/png") ] }
    assert_error :forbidden, "forbidden"
  end
end
