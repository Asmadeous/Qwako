require "test_helper"

class Api::V1::Admin::CategoriesTest < ActionDispatch::IntegrationTest
  test "guests are forbidden and visitors must sign in" do
    post api_v1_admin_categories_path, params: { category: { name: "Lakes" } }, as: :json
    assert_error :unauthorized, "unauthenticated"

    sign_in_as users(:ada)
    post api_v1_admin_categories_path, params: { category: { name: "Lakes" } }, as: :json
    assert_error :forbidden, "forbidden"
    delete api_v1_admin_category_path(categories(:coast)), as: :json
    assert_error :forbidden, "forbidden"
    assert Category.exists?(categories(:coast).id)
  end

  test "lists categories by name with how many homes use each" do
    sign_in_as users(:owner)
    get api_v1_admin_categories_path, as: :json
    assert_response :ok
    rows = response.parsed_body["categories"].map { |c| c.values_at("name", "slug", "homes_count") }
    assert_equal [ [ "Beach & Coast", "beach-coast", 0 ], [ "City homes", "city-homes", 1 ] ], rows
  end

  test "creates and renames a category, refusing blanks and near-duplicates" do
    sign_in_as users(:owner)
    post api_v1_admin_categories_path, params: { category: { name: "  Lake   homes " } }, as: :json
    assert_response :created
    category = response.parsed_body["category"]
    assert_equal [ "Lake homes", "lake-homes", 0 ], category.values_at("name", "slug", "homes_count")

    patch api_v1_admin_category_path(category["id"]), params: { category: { name: "Lakes" } }, as: :json
    assert_response :ok
    assert_equal "lakes", response.parsed_body.dig("category", "slug")

    post api_v1_admin_categories_path, params: { category: { name: "" } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    post api_v1_admin_categories_path, params: { category: { name: "city HOMES" } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    post api_v1_admin_categories_path, params: { category: { name: "Beach, Coast" } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert_match "too close", response.parsed_body.dig("error", "details", "name").first
  end

  test "deleting a category keeps its homes, uncategorised" do
    sign_in_as users(:owner)
    assert_no_difference "Listing.count" do
      delete api_v1_admin_category_path(categories(:city)), as: :json
    end
    assert_response :no_content
    assert_nil listings(:loft).reload.category_id
  end

  test "homes carry their category and the owner can set or clear it" do
    get api_v1_listings_path, as: :json
    loft = response.parsed_body["listings"].find { |l| l["slug"] == "kilimani-loft" }
    assert_equal({ "id" => categories(:city).id, "name" => "City homes", "slug" => "city-homes" }, loft["category"])

    sign_in_as users(:owner)
    patch api_v1_admin_listing_path(listings(:loft)), params: { listing: { category_id: categories(:coast).id } }, as: :json
    assert_response :ok
    assert_equal "beach-coast", response.parsed_body.dig("listing", "category", "slug")

    patch api_v1_admin_listing_path(listings(:loft)), params: { listing: { category_id: "" } }, as: :json
    assert_response :ok
    assert_nil response.parsed_body.dig("listing", "category")

    patch api_v1_admin_listing_path(listings(:loft)), params: { listing: { category_id: SecureRandom.uuid } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert response.parsed_body.dig("error", "details", "category").present?
  end
end
