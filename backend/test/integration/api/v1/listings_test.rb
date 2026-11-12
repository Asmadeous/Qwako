require "test_helper"

class Api::V1::ListingsTest < ActionDispatch::IntegrationTest
  test "index lists only published listings with photos in order and amenities" do
    get api_v1_listings_path, as: :json
    assert_response :ok
    titles = response.parsed_body["listings"].map { |listing| listing["title"] }
    assert_includes titles, "Cotswolds Cottage"
    assert_not_includes titles, "Draft Barn"

    cottage = response.parsed_body["listings"].find { |listing| listing["title"] == "Cotswolds Cottage" }
    assert_equal %w[https://images.example.com/cottage-1.jpg https://images.example.com/cottage-2.jpg], cottage["photos"]
    assert_equal [ { "key" => "parking", "name" => "Free parking" }, { "key" => "wifi", "name" => "Wi-Fi" } ], cottage["amenities"].map { |a| a.slice("key", "name") }
    assert_equal 21000, cottage["nightly_price_cents"]
    assert_equal "GBP", cottage["currency"]
  end

  test "search matches title or address and treats wildcards literally" do
    get api_v1_listings_path(q: "nairobi"), as: :json
    assert_equal [ "Kilimani Loft" ], response.parsed_body["listings"].map { |listing| listing["title"] }

    get api_v1_listings_path(q: "%"), as: :json
    assert_empty response.parsed_body["listings"]
  end

  test "show returns a published listing and 404s for drafts and unknown ids" do
    get api_v1_listing_path(listings(:cottage)), as: :json
    assert_response :ok
    assert_equal "Cotswolds Cottage", response.parsed_body.dig("listing", "title")

    get api_v1_listing_path(listings(:hidden)), as: :json
    assert_error :not_found, "not_found"

    get api_v1_listing_path("not-a-uuid"), as: :json
    assert_error :not_found, "not_found"
  end

  test "admins can see draft listings" do
    sign_in_as users(:owner)
    get api_v1_listing_path(listings(:hidden)), as: :json
    assert_response :ok
  end
end
