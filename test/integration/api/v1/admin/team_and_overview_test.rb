require "test_helper"

class Api::V1::Admin::TeamAndOverviewTest < ActionDispatch::IntegrationTest
  include ActionMailer::TestHelper

  test "the owner adds a team member who chooses a password from the email link" do
    sign_in_as users(:owner)
    assert_enqueued_emails 1 do
      post api_v1_admin_staff_index_path, params: { name: "Juma", email: "juma@example.com" }, as: :json
    end
    assert_response :created
    juma = User.find_by!(email: "juma@example.com")
    assert juma.admin?
    assert_equal "add_staff", AuditLog.last.action

    token = juma.generate_token_for(:invitation)
    patch api_v1_password_reset_path, params: { token:, password: "juma-password" }, as: :json
    assert_response :ok
    assert juma.reload.authenticate("juma-password")

    sign_in_as users(:owner)
    delete api_v1_admin_staff_path(juma), as: :json
    assert_response :no_content
    assert juma.reload.guest?
    delete api_v1_admin_staff_path(users(:owner)), as: :json
    assert_error :unprocessable_content, "cannot_remove_self"
  end

  test "overview shows arrivals, requests, occupancy and unread messages" do
    paid_booking(listing: listings(:loft), guest: users(:ada), check_in: Date.current, check_out: Date.current + 2)
    listings(:cottage).update!(booking_type: "request")
    paid_booking(listing: listings(:cottage), guest: users(:ada), check_in: Date.current + 40, check_out: Date.current + 41)

    sign_in_as users(:owner)
    get api_v1_admin_overview_path, as: :json
    assert_response :ok
    body = response.parsed_body
    assert_equal [ "Kilimani Loft" ], body["arrivals_today"].map { |a| a["listing_title"] }
    assert_equal 1, body["requests"].size
    assert_operator body["occupancy_next_30_days"], :>, 0
  end

  test "guests list with stays and spend, and one guest's bookings" do
    sign_in_as users(:owner)
    get api_v1_admin_guests_path(q: "grace"), as: :json
    row = response.parsed_body["guests"].sole
    assert_equal [ "Grace Hopper", 1, 66000 ], row.values_at("name", "stays", "spent_cents")

    get api_v1_admin_guest_path(users(:grace)), as: :json
    assert_equal [ "Naivasha Cottage" ], response.parsed_body["bookings"].map { |b| b.dig("listing", "title") }
  end

  test "changes by the team are logged" do
    sign_in_as users(:owner)
    patch api_v1_admin_listing_path(listings(:loft)), params: { listing: { bedrooms: 2, property_type: "apartment", check_in_time: "15:00" } }, as: :json
    assert_response :ok
    assert_equal [ 2, "apartment", "15:00" ], response.parsed_body["listing"].values_at("bedrooms", "property_type", "check_in_time")

    get api_v1_admin_audit_logs_path, as: :json
    assert_equal "Edited Kilimani Loft", response.parsed_body["entries"].first["summary"]
    assert_equal "Owner", response.parsed_body["entries"].first["admin_name"]
  end

  test "the owner messages a guest about their booking" do
    sign_in_as users(:owner)
    post api_v1_admin_conversations_path, params: { booking_id: bookings(:grace_cottage).id, body: "Gate code is 1234" }, as: :json
    assert_response :created
    assert_equal bookings(:grace_cottage).id, response.parsed_body.dig("conversation", "booking_id")
    assert_equal "message", users(:grace).notifications.order(:created_at).last.kind
  end

  test "home details are checked" do
    sign_in_as users(:owner)
    patch api_v1_admin_listing_path(listings(:loft)), params: { listing: { property_type: "castle", check_in_time: "2pm", min_nights: 5, max_nights: 2 } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert_equal %w[check_in_time max_nights property_type], response.parsed_body.dig("error", "details").keys.sort
  end

  test "guests can't reach team pages" do
    sign_in_as users(:ada)
    [ api_v1_admin_overview_path, api_v1_admin_guests_path, api_v1_admin_staff_index_path, api_v1_admin_audit_logs_path,
      api_v1_admin_reviews_path, api_v1_admin_conversations_path, api_v1_admin_contact_messages_path ].each do |path|
      get path, as: :json
      assert_error :forbidden, "forbidden"
    end
  end
end
