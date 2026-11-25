require "test_helper"

# Owner (admin) can do everything; staff run the day to day and are refused
# money, homes, marketing, the team, the activity log and deletes.
class Api::V1::Admin::RolesAndCrudTest < ActionDispatch::IntegrationTest
  include ActionMailer::TestHelper

  test "staff reach day-to-day pages and are refused owner-only ones" do
    sign_in_as users(:staff)
    [ api_v1_admin_overview_path, api_v1_admin_calendar_path, api_v1_admin_bookings_path, api_v1_admin_guests_path,
      api_v1_admin_conversations_path, api_v1_admin_contact_messages_path, api_v1_admin_reviews_path ].each do |path|
      get path, as: :json
      assert_response :ok, path
    end
    [ api_v1_admin_finances_path, api_v1_admin_listings_path, api_v1_admin_staff_index_path, api_v1_admin_audit_logs_path,
      api_v1_admin_newsletters_path, api_v1_admin_newsletter_subscribers_path, api_v1_admin_posts_path,
      api_v1_admin_categories_path, api_v1_admin_amenities_path ].each do |path|
      get path, as: :json
      assert_error :forbidden, "forbidden"
    end
  end

  test "staff see a booking without its payments and can't cancel, refund or delete" do
    booking = paid_booking(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 5, check_out: Date.current + 7)
    sign_in_as users(:staff)
    get api_v1_admin_booking_path(booking), as: :json
    body = response.parsed_body["booking"]
    assert_equal [], body["payments"]
    assert_equal [ false, false, true ], body.values_at("can_cancel", "can_delete", "can_reschedule")

    post cancel_api_v1_admin_booking_path(booking), as: :json
    assert_error :forbidden, "forbidden"
    delete api_v1_admin_booking_path(booking), as: :json
    assert_error :forbidden, "forbidden"
    post api_v1_admin_bookings_path, params: { listing_id: listings(:loft).id }, as: :json
    assert_error :forbidden, "forbidden"

    patch api_v1_admin_booking_path(booking), params: { guests_count: 2 }, as: :json
    assert_response :ok
    assert_equal 2, booking.reload.guests_count
    patch api_v1_admin_booking_path(booking), params: { guests_count: 3 }, as: :json
    assert_error :unprocessable_content, "validation_failed"
  end

  test "staff hear about guest messages and reply as the team" do
    conversation = Conversation.create!(guest: users(:ada), subject: "Parking", last_message_at: Time.current)
    conversation.post!(users(:ada), "Is there parking?")
    assert users(:staff).notifications.exists?(kind: "message")

    sign_in_as users(:staff)
    post api_v1_admin_conversation_messages_path(conversation), params: { body: "Yes, two cars." }, as: :json
    assert_response :created
    assert conversation.messages.last.payload[:from_owner]
  end

  test "the owner takes a phone booking for a new guest with cash received, then records the rest" do
    sign_in_as users(:owner)
    assert_difference -> { User.guest.count } => 1, -> { Payment.count } => 1 do
      post api_v1_admin_bookings_path, params: {
        listing_id: listings(:cottage).id, check_in: Date.current + 20, check_out: Date.current + 22, guests_count: 2,
        guest: { name: "Otieno Phone", email: "otieno@example.com", phone: "+254 700 111 222" },
        payment_amount: 200, payment_method: "cash"
      }, as: :json
    end
    assert_response :created
    body = response.parsed_body["booking"]
    assert_equal "confirmed", body["status"]
    assert_equal [ 20000, "manual", "cash" ], body["payments"].sole.values_at("amount_cents", "provider", "channel")
    assert body["can_record_payment"]
    booking = Booking.find(body["id"])
    assert_equal "create_booking", AuditLog.order(:created_at).last.action

    post record_payment_api_v1_admin_booking_path(booking), params: { payment_amount: 1_000_000, payment_method: "mpesa" }, as: :json
    assert_error :unprocessable_content, "bad_amount"
    rest = (booking.total_cents - 20000) / 100
    post record_payment_api_v1_admin_booking_path(booking), params: { payment_amount: rest, payment_method: "mpesa" }, as: :json
    assert_response :ok
    assert_equal booking.total_cents, booking.reload.net_paid_cents
    assert_not response.parsed_body.dig("booking", "can_record_payment")

    manual = booking.payments.order(:created_at).last
    post remove_payment_api_v1_admin_booking_path(booking), params: { payment_id: manual.id }, as: :json
    assert_response :ok
    assert_equal 20000, booking.reload.net_paid_cents
  end

  test "a phone booking needs free dates and a guest who isn't on the team" do
    sign_in_as users(:owner)
    base = { listing_id: listings(:cottage).id, guests_count: 1 }
    post api_v1_admin_bookings_path, params: base.merge(guest_id: users(:ada).id, check_in: bookings(:grace_cottage).check_in,
                                                         check_out: bookings(:grace_cottage).check_out), as: :json
    assert_error :unprocessable_content, "validation_failed"
    post api_v1_admin_bookings_path, params: base.merge(guest: { name: "X", email: "staff@example.com" },
                                                         check_in: Date.current + 30, check_out: Date.current + 32), as: :json
    assert_error :unprocessable_content, "not_a_guest"
  end

  test "manual payments can't be refunded through Paystack" do
    sign_in_as users(:owner)
    post api_v1_admin_bookings_path, params: { listing_id: listings(:cottage).id, guest_id: users(:ada).id, guests_count: 1,
                                               check_in: Date.current + 40, check_out: Date.current + 42,
                                               payment_amount: 100, payment_method: "cash" }, as: :json
    booking = Booking.find(response.parsed_body.dig("booking", "id"))
    post cancel_api_v1_admin_booking_path(booking), as: :json
    payment = booking.payments.sole
    assert payment.reload.refund_due?
    post refund_api_v1_admin_booking_path(booking), params: { payment_id: payment.id }, as: :json
    assert_error :unprocessable_content, "not_paystack"
    assert_empty Paystack.client.refunds
    post mark_refunded_api_v1_admin_booking_path(booking), params: { payment_id: payment.id }, as: :json
    assert_response :ok
  end

  test "only unpaid bookings the guest no longer expects can be deleted" do
    paid = paid_booking(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 5, check_out: Date.current + 7)
    sign_in_as users(:owner)
    delete api_v1_admin_booking_path(paid), as: :json
    assert_error :unprocessable_content, "not_deletable"
    delete api_v1_admin_booking_path(bookings(:grace_cottage)), as: :json
    assert_error :unprocessable_content, "not_deletable"

    expired = Booking.create!(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 50, check_out: Date.current + 52,
                              guests_count: 1, status: "pending_payment")
    expired.payments.create!(reference: Payment.new_reference, amount_cents: expired.total_cents, currency: expired.currency)
    expired.update!(status: "expired")
    delete api_v1_admin_booking_path(expired), as: :json
    assert_response :no_content
    assert_not Booking.exists?(expired.id)
    assert_equal "delete_booking", AuditLog.order(:created_at).last.action
  end

  test "staff add and edit guests; only the owner closes an account" do
    sign_in_as users(:staff)
    post api_v1_admin_guests_path, params: { guest: { name: "Njeri", email: "njeri@example.com", phone: "+254 711 000 111" } }, as: :json
    assert_response :created
    njeri = User.find_by!(email: "njeri@example.com")
    assert njeri.guest?

    patch api_v1_admin_guest_path(users(:ada)), params: { guest: { phone: "+254 722 000 000", email: "ada.new@example.com" } }, as: :json
    assert_response :ok
    assert_equal "+254 722 000 000", users(:ada).reload.phone
    assert_not users(:ada).email_verified?, "a changed address must be confirmed again"

    patch api_v1_admin_guest_path(users(:owner)), params: { guest: { name: "Hacked" } }, as: :json
    assert_error :not_found, "not_found"
    delete api_v1_admin_guest_path(njeri), as: :json
    assert_error :forbidden, "forbidden"

    sign_in_as users(:owner)
    delete api_v1_admin_guest_path(users(:grace)), as: :json
    assert_error :unprocessable_content, "has_stays"
    delete api_v1_admin_guest_path(njeri), as: :json
    assert_response :no_content
    assert njeri.reload.deleted?
  end

  test "the team starts a conversation with any guest; the owner deletes conversations and contact messages" do
    sign_in_as users(:staff)
    post api_v1_admin_conversations_path, params: { guest_id: users(:ada).id, subject: "Your feedback", body: "How was it?" }, as: :json
    assert_response :created
    conversation = Conversation.find(response.parsed_body.dig("conversation", "id"))
    delete api_v1_admin_conversation_path(conversation), as: :json
    assert_error :forbidden, "forbidden"

    contact = ContactMessage.create!(name: "Kamau", email: "kamau@example.com", body: "Do you take groups?")
    sign_in_as users(:owner)
    delete api_v1_admin_conversation_path(conversation), as: :json
    assert_response :no_content
    assert_not Conversation.exists?(conversation.id)
    assert_equal 0, Message.where(conversation_id: conversation.id).count
    delete api_v1_admin_contact_message_path(contact), as: :json
    assert_response :no_content
  end

  test "staff reply to reviews; the owner hides and deletes them" do
    booking = bookings(:grace_cottage)
    booking.update_columns(check_in: Date.current - 5, check_out: Date.current - 2)
    review = Review.create!(booking:, listing: booking.listing, author: users(:grace), rating: 2, comment: "Cold shower")

    sign_in_as users(:staff)
    patch api_v1_admin_review_path(review), params: { owner_reply: "Fixed now, sorry." }, as: :json
    assert_response :ok
    patch api_v1_admin_review_path(review), params: { hidden: true }, as: :json
    assert_error :forbidden, "forbidden"
    assert_not review.reload.hidden?

    sign_in_as users(:owner)
    delete api_v1_admin_review_path(review), as: :json
    assert_response :no_content
    assert_equal 0, booking.listing.reload.review_count
  end

  test "staff edit blocked nights but not over a booking" do
    sign_in_as users(:staff)
    post api_v1_admin_listing_blocks_path(listings(:cottage)), params: { starts_on: Date.current + 30, ends_on: Date.current + 32, reason: "Painting" }, as: :json
    assert_response :created
    block = AvailabilityBlock.find(response.parsed_body.dig("block", "id"))

    patch api_v1_admin_block_path(block), params: { ends_on: Date.current + 34, reason: "Painting and roof" }, as: :json
    assert_response :ok
    assert_equal [ Date.current + 34, "Painting and roof" ], block.reload.values_at(:ends_on, :reason)
    patch api_v1_admin_block_path(block), params: { starts_on: Date.current + 11 }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert_equal "change_block", AuditLog.order(:created_at).last.action
  end

  test "the owner invites an owner, changes roles, and can't change their own" do
    sign_in_as users(:owner)
    post api_v1_admin_staff_index_path, params: { name: "Co Owner", email: "co@example.com", role: "admin" }, as: :json
    assert_response :created
    assert User.find_by!(email: "co@example.com").admin?

    patch api_v1_admin_staff_path(users(:staff)), params: { role: "admin" }, as: :json
    assert_response :ok
    assert users(:staff).reload.admin?
    assert_equal "change_staff_role", AuditLog.order(:created_at).last.action
    patch api_v1_admin_staff_path(users(:owner)), params: { role: "staff" }, as: :json
    assert_error :unprocessable_content, "cannot_change_self"
    patch api_v1_admin_staff_path(users(:ada)), params: { role: "admin" }, as: :json
    assert_error :not_found, "not_found"
  end

  test "the owner lists, adds and removes newsletter readers" do
    users(:ada).update!(marketing_consent_at: Time.current)
    NewsletterSubscriber.create!(email: "reader@example.com", confirmed_at: Time.current)
    sign_in_as users(:owner)
    get api_v1_admin_newsletter_subscribers_path, as: :json
    assert_equal %w[ada@example.com reader@example.com], response.parsed_body["subscribers"].map { |s| s["email"] }.sort

    assert_enqueued_emails 1 do
      post api_v1_admin_newsletter_subscribers_path, params: { email: "new@example.com" }, as: :json
    end
    assert_response :created
    assert_equal "waiting for confirmation", response.parsed_body.dig("subscriber", "status")
    post api_v1_admin_newsletter_subscribers_path, params: { email: "reader@example.com" }, as: :json
    assert_error :unprocessable_content, "validation_failed"

    delete api_v1_admin_newsletter_subscriber_path("ada@example.com"), as: :json
    assert_response :no_content
    assert_nil users(:ada).reload.marketing_consent_at
    delete api_v1_admin_newsletter_subscriber_path("reader@example.com"), as: :json
    assert_response :no_content
    assert_not NewsletterSubscriber.exists?(email: "reader@example.com")
    assert_equal [ "ada@example.com", "reader@example.com" ].size, AuditLog.where(action: "remove_subscriber").count
  end
end
