require "test_helper"

class Api::V1::Admin::AmenitiesTest < ActionDispatch::IntegrationTest
  test "guests are forbidden and visitors must sign in" do
    post api_v1_admin_amenities_path, params: { amenity: { name: "Pool" } }, as: :json
    assert_error :unauthorized, "unauthenticated"

    sign_in_as users(:ada)
    post api_v1_admin_amenities_path, params: { amenity: { name: "Pool" } }, as: :json
    assert_error :forbidden, "forbidden"
    delete api_v1_admin_amenity_path(amenities(:wifi)), as: :json
    assert_error :forbidden, "forbidden"
    assert Amenity.exists?(amenities(:wifi).id)
  end

  test "lists amenities by name with how many homes have each" do
    sign_in_as users(:owner)
    get api_v1_admin_amenities_path, as: :json
    assert_response :ok
    rows = response.parsed_body["amenities"].map { |a| a.values_at("name", "key", "homes_count") }
    assert_equal [ [ "Free parking", "parking", 1 ], [ "Wi-Fi", "wifi", 1 ] ], rows
  end

  test "adds an amenity a home can then offer, and guests see its name" do
    sign_in_as users(:owner)
    post api_v1_admin_amenities_path, params: { amenity: { name: "  Swimming   pool " } }, as: :json
    assert_response :created
    assert_equal [ "Swimming pool", "swimming_pool", 0 ], response.parsed_body["amenity"].values_at("name", "key", "homes_count")

    patch api_v1_admin_listing_path(listings(:loft)), params: { listing: { amenity_keys: %w[swimming_pool wifi] } }, as: :json
    assert_response :ok
    assert_equal %w[Swimming\ pool Wi-Fi], response.parsed_body.dig("listing", "amenities").pluck("name")

    get api_v1_listing_path(listings(:loft)), as: :json
    assert_includes response.parsed_body.dig("listing", "amenities").pluck("key"), "swimming_pool"
  end

  test "renaming keeps the key, and blanks and near-duplicates are refused" do
    sign_in_as users(:owner)
    patch api_v1_admin_amenity_path(amenities(:wifi)), params: { amenity: { name: "Fast Wi-Fi" } }, as: :json
    assert_response :ok
    assert_equal [ "Fast Wi-Fi", "wifi" ], response.parsed_body["amenity"].values_at("name", "key")

    post api_v1_admin_amenities_path, params: { amenity: { name: "" } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    post api_v1_admin_amenities_path, params: { amenity: { name: "free PARKING" } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    post api_v1_admin_amenities_path, params: { amenity: { name: "Wifi" } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert_match "too close", response.parsed_body.dig("error", "details", "name").first
  end

  test "deleting an amenity removes it from homes but keeps the homes" do
    sign_in_as users(:owner)
    assert_no_difference "Listing.count" do
      delete api_v1_admin_amenity_path(amenities(:wifi)), as: :json
    end
    assert_response :no_content
    assert_equal %w[parking], listings(:cottage).reload.amenities.map(&:key)
  end
end
