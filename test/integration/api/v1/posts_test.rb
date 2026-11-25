require "test_helper"

class Api::V1::PostsTest < ActionDispatch::IntegrationTest
  test "the owner writes a draft, publishes it, and visitors read it" do
    sign_in_as users(:owner)
    post api_v1_admin_posts_path, params: { post: { title: "Mornings at Githii Farm", body: "Para one.\n\nPara two." } }, as: :json
    assert_response :created
    id = response.parsed_body.dig("post", "id")
    assert_equal "mornings-at-githii-farm", response.parsed_body.dig("post", "slug")

    delete api_v1_session_path
    get api_v1_posts_path, as: :json
    assert_empty response.parsed_body["posts"]
    get api_v1_post_path("mornings-at-githii-farm"), as: :json
    assert_response :not_found

    sign_in_as users(:owner)
    patch api_v1_admin_post_path(id), params: { post: { publish: true, excerpt: "Sunrise over the tea." } }, as: :json
    assert_response :ok
    assert AuditLog.exists?(action: "publish_post")

    delete api_v1_session_path
    get api_v1_posts_path, as: :json
    assert_equal [ "Mornings at Githii Farm" ], response.parsed_body["posts"].map { |p| p["title"] }
    get api_v1_post_path("mornings-at-githii-farm"), as: :json
    assert_equal "Para one.\n\nPara two.", response.parsed_body.dig("post", "body")
    assert_equal users(:owner).name, response.parsed_body.dig("post", "author")
  end

  test "slugs are unique and clean, and covers must be https or uploaded" do
    sign_in_as users(:owner)
    Post.create!(title: "Taken", slug: "taken", body: "x")
    post api_v1_admin_posts_path, params: { post: { title: "Other", slug: "taken", body: "x", cover_url: "http://insecure.example/a.jpg" } }, as: :json
    assert_response :unprocessable_content
    assert_equal %w[cover_url slug], response.parsed_body.dig("error", "details").keys.sort
  end

  test "guests can't write posts" do
    sign_in_as users(:ada)
    post api_v1_admin_posts_path, params: { post: { title: "Hi", body: "x" } }, as: :json
    assert_response :forbidden
  end
end
