require "test_helper"

class Api::V1::Admin::ListingsTest < ActionDispatch::IntegrationTest
  VALID = {
    title: "Harbour Flat", address: "St Ives, Cornwall, UK", description: "Sea views.",
    house_rules: "No smoking.", max_guests: 3, nightly_price_pence: 15000, cleaning_charge_pence: 2500,
    photo_urls: %w[https://images.example.com/a.jpg https://images.example.com/b.jpg], amenity_keys: %w[wifi]
  }.freeze

  test "guests are forbidden and visitors must sign in" do
    post api_v1_admin_listings_path, params: { listing: VALID }, as: :json
    assert_error :unauthorized, "unauthenticated"

    sign_in_as users(:ada)
    post api_v1_admin_listings_path, params: { listing: VALID }, as: :json
    assert_error :forbidden, "forbidden"
    get api_v1_admin_listings_path, as: :json
    assert_error :forbidden, "forbidden"
  end

  test "admin creates a listing with ordered photos, amenities and derived country" do
    sign_in_as users(:owner)
    assert_difference "Listing.count", 1 do
      post api_v1_admin_listings_path, params: { listing: VALID }, as: :json
    end
    assert_response :created
    listing = response.parsed_body["listing"]
    assert_equal VALID[:photo_urls], listing["photos"]
    assert_equal %w[wifi], listing["amenities"]
    assert_equal "UK", listing["country"]
    assert_equal "harbour-flat", listing["slug"]
  end

  test "admin index includes drafts" do
    sign_in_as users(:owner)
    get api_v1_admin_listings_path, as: :json
    assert_includes response.parsed_body["listings"].map { |listing| listing["title"] }, "Draft Barn"
  end

  test "invalid listings report field errors" do
    sign_in_as users(:owner)
    post api_v1_admin_listings_path,
      params: { listing: VALID.merge(title: "", max_guests: 0, photo_urls: [ "javascript:alert(1)" ]) }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert_equal %w[max_guests photos title], response.parsed_body.dig("error", "details").keys.sort
  end

  test "update replaces photos and amenities in order" do
    sign_in_as users(:owner)
    cottage = listings(:cottage)
    patch api_v1_admin_listing_path(cottage),
      params: { listing: { photo_urls: %w[https://images.example.com/new.jpg https://images.example.com/cottage-1.jpg], amenity_keys: [] } },
      as: :json
    assert_response :ok
    assert_equal %w[https://images.example.com/new.jpg https://images.example.com/cottage-1.jpg],
      cottage.reload.photos.map(&:url)
    assert_empty cottage.amenities
  end

  test "a failed update changes nothing" do
    sign_in_as users(:owner)
    cottage = listings(:cottage)
    patch api_v1_admin_listing_path(cottage),
      params: { listing: { title: "", photo_urls: %w[https://images.example.com/new.jpg], amenity_keys: [] } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    cottage.reload
    assert_equal "Cotswolds Cottage", cottage.title
    assert_equal 2, cottage.photos.count
    assert_equal 2, cottage.amenities.count
  end
end
