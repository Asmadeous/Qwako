require "test_helper"

class Api::V1::GuestFeaturesTest < ActionDispatch::IntegrationTest
  include ActionMailer::TestHelper

  test "guests save homes and see them in their list" do
    sign_in_as users(:ada)
    post api_v1_saved_listings_path, params: { listing_id: listings(:loft).id }, as: :json
    post api_v1_saved_listings_path, params: { listing_id: listings(:loft).id }, as: :json
    assert_response :created
    get api_v1_saved_listings_path, as: :json
    assert_equal [ "Kilimani Loft" ], response.parsed_body["listings"].map { |l| l["title"] }
    get api_v1_listing_path(listings(:loft)), as: :json
    assert response.parsed_body.dig("listing", "saved")

    delete api_v1_saved_listing_path(listings(:loft).id), as: :json
    get api_v1_saved_listings_path, as: :json
    assert_empty response.parsed_body["listings"]
  end

  test "a guest asks about a home, the owner replies, and each side is told" do
    sign_in_as users(:ada)
    post api_v1_conversations_path, params: { listing_id: listings(:loft).id, body: "Is there parking?" }, as: :json
    assert_response :created
    conversation_id = response.parsed_body.dig("conversation", "id")
    assert_equal "message", users(:owner).notifications.order(:created_at).last.kind

    sign_in_as users(:owner)
    get api_v1_admin_conversations_path(view: "unread"), as: :json
    assert_equal [ conversation_id ], response.parsed_body["conversations"].map { |c| c["id"] }
    post api_v1_admin_conversation_messages_path(conversation_id), params: { body: "Yes, one covered space." }, as: :json
    assert_response :created
    assert_equal "/account/messages/#{conversation_id}", users(:ada).notifications.order(:created_at).last.url

    sign_in_as users(:ada)
    get api_v1_conversation_path(conversation_id), as: :json
    assert_equal [ "Is there parking?", "Yes, one covered space." ], response.parsed_body["messages"].map { |m| m["body"] }

    sign_in_as users(:grace)
    get api_v1_conversation_path(conversation_id), as: :json
    assert_error :not_found, "not_found"
  end

  test "empty messages are refused" do
    sign_in_as users(:ada)
    post api_v1_conversations_path, params: { listing_id: listings(:loft).id, body: "   " }, as: :json
    assert_error :unprocessable_content, "validation_failed"
  end

  test "notifications list, unread count and mark as read" do
    users(:ada).notifications.create!(kind: "x", title: "One", url: "/a")
    users(:ada).notifications.create!(kind: "x", title: "Two", url: "/b")
    sign_in_as users(:ada)
    get api_v1_notifications_path, as: :json
    assert_equal 2, response.parsed_body["unread"]
    post read_api_v1_notification_path(response.parsed_body["notifications"].first["id"]), as: :json
    get api_v1_notifications_path, as: :json
    assert_equal 1, response.parsed_body["unread"]
    post read_all_api_v1_notifications_path, as: :json
    get api_v1_notifications_path, as: :json
    assert_equal 0, response.parsed_body["unread"]
  end

  test "a guest reviews a stay after check-out; the owner replies or hides it" do
    booking = paid_booking(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 1, check_out: Date.current + 3)
    sign_in_as users(:ada)
    post api_v1_booking_review_path(booking), params: { rating: 5, comment: "Lovely" }, as: :json
    assert_equal [ "You can review a stay after you check out." ], response.parsed_body.dig("error", "details", "base")

    travel 4.days do
      sign_in_as users(:ada)
      post api_v1_booking_review_path(booking), params: { rating: 4, comment: "Lovely, bit noisy" }, as: :json
      assert_response :created
      assert_equal 4.0, listings(:loft).reload.rating_average.to_f
      assert_equal 1, listings(:loft).review_count

      get api_v1_listing_path(listings(:loft)), as: :json
      assert_equal [ "Lovely, bit noisy" ], response.parsed_body.dig("listing", "reviews").map { |r| r["comment"] }

      sign_in_as users(:owner)
      review_id = Review.last.id
      patch api_v1_admin_review_path(review_id), params: { owner_reply: "Thank you!", hidden: true }, as: :json
      assert_response :ok
      assert_equal 0, listings(:loft).reload.review_count
      get api_v1_listing_path(listings(:loft)), as: :json
      assert_empty response.parsed_body.dig("listing", "reviews")
    end
  end

  test "anyone can use the contact form; it lands in the owner's inbox" do
    post api_v1_contact_messages_path, params: { contact_message: { name: "Wanjiru", email: "w@example.com", body: "Group of 12 in December?" } }, as: :json
    assert_response :created
    assert_equal "contact", users(:owner).notifications.order(:created_at).last.kind

    post api_v1_contact_messages_path, params: { contact_message: { name: "", email: "nope", body: "" } }, as: :json
    assert_equal %w[body email name], response.parsed_body.dig("error", "details").keys.sort

    sign_in_as users(:owner)
    get api_v1_admin_contact_messages_path, as: :json
    assert_equal [ "Wanjiru" ], response.parsed_body["contact_messages"].map { |c| c["name"] }
  end

  test "phone, message emails and marketing consent are saved on the profile" do
    sign_in_as users(:ada)
    patch api_v1_profile_path, params: { phone: "+254 712 345 678", email_messages: false, marketing_consent: true }, as: :json
    assert_response :ok
    user = response.parsed_body["user"]
    assert_equal [ "+254 712 345 678", false, true ], user.values_at("phone", "email_messages", "marketing_consent")

    patch api_v1_profile_path, params: { phone: "call me" }, as: :json
    assert_error :unprocessable_content, "validation_failed"
  end

  test "a guest downloads their data" do
    paid_booking(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 1, check_out: Date.current + 3)
    sign_in_as users(:ada)
    get export_api_v1_profile_path
    assert_response :ok
    data = JSON.parse(response.body)
    assert_equal "ada@example.com", data.dig("profile", "email")
    assert_equal [ "Kilimani Loft" ], data["bookings"].map { |b| b["home"] }
  end

  test "closing an account needs the password, waits for upcoming stays, and keeps bookings anonymous" do
    sign_in_as users(:grace)
    delete api_v1_profile_path, params: { password: "wrong" }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    delete api_v1_profile_path, params: { password: "password123" }, as: :json
    assert_error :unprocessable_content, "has_upcoming_stays"

    bookings(:grace_cottage).cancel_by_guest!
    delete api_v1_profile_path, params: { password: "password123" }, as: :json
    assert_response :no_content
    grace = users(:grace).reload
    assert grace.deleted?
    assert_equal "Closed account", grace.name
    assert_equal grace, bookings(:grace_cottage).reload.guest
    get api_v1_session_path, as: :json
    assert_nil response.parsed_body["user"]
  end

  test "sign-up sends an email confirmation link that confirms the address" do
    assert_enqueued_emails 1 do
      post api_v1_registrations_path, params: { user: { name: "Sam", email: "sam@example.com", password: "password123" } }, as: :json
    end
    user = User.find_by!(email: "sam@example.com")
    assert_not user.email_verified?

    patch api_v1_email_verification_path, params: { token: "nonsense" }, as: :json
    assert_error :unprocessable_content, "invalid_token"
    patch api_v1_email_verification_path, params: { token: user.generate_token_for(:email_verification) }, as: :json
    assert_response :no_content
    assert user.reload.email_verified?
  end

  test "Google sign-in creates a guest or signs in the matching account" do
    ENV["GOOGLE_CLIENT_ID"] = "client-123"
    GoogleIdentity.fetcher = ->(token) {
      { "good" => { "aud" => "client-123", "iss" => "accounts.google.com", "email_verified" => "true", "sub" => "g-1",
                    "email" => "ADA@example.com", "name" => "Ada", "exp" => 1.hour.from_now.to_i } }[token]
    }
    post api_v1_google_session_path, params: { credential: "bad" }, as: :json
    assert_error :unauthorized, "invalid_credentials"

    assert_no_difference "User.count" do
      post api_v1_google_session_path, params: { credential: "good" }, as: :json
    end
    assert_equal users(:ada).id, response.parsed_body.dig("user", "id")
    assert_equal "g-1", users(:ada).reload.google_uid
  ensure
    ENV.delete("GOOGLE_CLIENT_ID")
    GoogleIdentity.fetcher = nil
  end
end
