require "test_helper"

# Long lists come back one numbered page at a time: page, pages, total, per_page.
class Api::V1::PagingTest < ActionDispatch::IntegrationTest
  test "notifications come 25 to a page, newest first, with the unread count for all" do
    now = Time.current
    Notification.insert_all(30.times.map { |i|
      { user_id: users(:ada).id, kind: "test", title: "Note #{i}", created_at: now - i.minutes, updated_at: now }
    })
    sign_in_as users(:ada)

    get api_v1_notifications_path, as: :json
    body = response.parsed_body
    assert_equal [ 1, 2, 30, 25 ], body.values_at("page", "pages", "total", "per_page")
    assert_equal 30, body["unread"]
    assert_equal "Note 0", body["notifications"].first["title"]

    get api_v1_notifications_path(page: 2), as: :json
    assert_equal (25..29).map { |i| "Note #{i}" }, response.parsed_body["notifications"].map { |n| n["title"] }
  end

  test "the inbox pages conversations and contact form messages" do
    now = Time.current
    Conversation.insert_all(30.times.map { |i|
      { guest_id: users(:ada).id, subject: "Question #{i}", last_message_at: now - i.minutes, created_at: now, updated_at: now }
    })
    ContactMessage.insert_all(27.times.map { |i|
      { name: "Sender #{i}", email: "s#{i}@example.com", body: "Hello", created_at: now - i.minutes, updated_at: now }
    })
    sign_in_as users(:staff)

    get api_v1_admin_conversations_path(page: 2), as: :json
    body = response.parsed_body
    assert_equal [ 2, 2, 30 ], body.values_at("page", "pages", "total")
    assert_equal "Question 25", body["conversations"].first["subject"]

    get api_v1_admin_contact_messages_path(page: 9), as: :json
    body = response.parsed_body
    assert_equal [ 2, 27 ], body.values_at("page", "total")
    assert_equal [ "Sender 25", "Sender 26" ], body["contact_messages"].map { |c| c["name"] }
  end

  test "a guest's messages page only when asked, so the overview still gets them all" do
    now = Time.current
    Conversation.insert_all(30.times.map { |i|
      { guest_id: users(:ada).id, subject: "Question #{i}", last_message_at: now - i.minutes, created_at: now, updated_at: now }
    })
    sign_in_as users(:ada)

    get api_v1_conversations_path, as: :json
    assert_equal 30, response.parsed_body["conversations"].size
    assert_nil response.parsed_body["pages"]

    get api_v1_conversations_path(page: 1), as: :json
    assert_equal [ 25, 2 ], [ response.parsed_body["conversations"].size, response.parsed_body["pages"] ]
  end

  test "a guest's bookings page by view with a count for each view" do
    today = Time.zone.today
    rows = 12.times.map { |i| booking_row(today + 20 + (3 * i), "confirmed") } +
           3.times.map { |i| booking_row(today - 30 - i, "completed") } +
           [ booking_row(today + 60, "cancelled_by_guest") ]
    Booking.insert_all(rows)
    sign_in_as users(:ada)

    get api_v1_bookings_path, as: :json
    assert_equal 16, response.parsed_body["bookings"].size

    get api_v1_bookings_path(page: 1), as: :json
    body = response.parsed_body
    assert_equal [ "upcoming", 1, 2, 12 ], body.values_at("view", "page", "pages", "total")
    assert_equal({ "upcoming" => 12, "past" => 3, "cancelled" => 1 }, body["counts"])
    assert_equal (today + 20).iso8601, body["bookings"].first["check_in"], "soonest stay first"

    get api_v1_bookings_path(page: 2, view: "upcoming"), as: :json
    assert_equal 2, response.parsed_body["bookings"].size

    get api_v1_bookings_path(page: 1, view: "past"), as: :json
    assert_equal (today - 30).iso8601, response.parsed_body["bookings"].first["check_in"], "latest stay first"

    get api_v1_bookings_path(page: 1, view: "cancelled"), as: :json
    assert_equal [ "cancelled_by_guest" ], response.parsed_body["bookings"].map { |b| b["status"] }
  end

  test "a home's page shows its newest 20 reviews and the rest come a page at a time" do
    today = Time.zone.today
    ids = Booking.insert_all(23.times.map { |i| booking_row(today - 40 - i, "completed") }, returning: :id).rows.flatten
    now = Time.current
    Review.insert_all(ids.each_with_index.map { |booking_id, i|
      { booking_id:, listing_id: listings(:loft).id, author_id: users(:ada).id, rating: 5, comment: "Stay #{i}",
        created_at: now - i.hours, updated_at: now }
    })

    get api_v1_listing_path(listings(:loft)), as: :json
    listing = response.parsed_body["listing"]
    assert_equal 20, listing["reviews"].size
    assert_equal 2, listing["reviews_next_page"]

    get reviews_api_v1_listing_path(listings(:loft), page: 2), as: :json
    body = response.parsed_body
    assert_equal [ "Stay 20", "Stay 21", "Stay 22" ], body["reviews"].map { |r| r["comment"] }
    assert_nil body["next_page"]

    get reviews_api_v1_listing_path(listings(:hidden)), as: :json
    assert_response :not_found
  end

  test "the blog pages 12 posts at a time" do
    now = Time.current
    Post.insert_all(14.times.map { |i|
      { title: "Post #{i}", slug: "post-#{i}", published_at: now - i.days, created_at: now, updated_at: now }
    })

    get api_v1_posts_path(page: 2), as: :json
    body = response.parsed_body
    assert_equal [ 2, 2, 14, 12 ], body.values_at("page", "pages", "total", "per_page")
    assert_equal [ "Post 12", "Post 13" ], body["posts"].map { |p| p["title"] }
  end

  test "the owner's lists page: reviews, posts, newsletters, readers, team and homes" do
    sign_in_as users(:owner)
    [ api_v1_admin_reviews_path, api_v1_admin_posts_path, api_v1_admin_newsletters_path,
      api_v1_admin_newsletter_subscribers_path, api_v1_admin_staff_index_path ].each do |path|
      get path, as: :json
      assert_response :ok
      assert_equal 1, response.parsed_body["page"], path
      assert response.parsed_body.key?("total"), path
    end

    NewsletterSubscriber.insert_all(26.times.map { |i|
      { email: "reader#{i}@example.com", confirmed_at: Time.current, created_at: Time.current - i.minutes, updated_at: Time.current }
    })
    get api_v1_admin_newsletter_subscribers_path(page: 2), as: :json
    assert_equal 1, response.parsed_body["subscribers"].size

    get api_v1_admin_listings_path, as: :json
    assert_nil response.parsed_body["pages"], "pickers still get every home"
    get api_v1_admin_listings_path(page: 1), as: :json
    assert_equal Listing.kept.count, response.parsed_body["total"]
  end

  private
    def booking_row(check_in, status)
      { listing_id: listings(:loft).id, guest_id: users(:ada).id, check_in:, check_out: check_in + 2, guests_count: 1,
        nights: 2, nightly_price_cents: 10_000, cleaning_charge_cents: 0, total_cents: 20_000, status:,
        created_at: Time.current, updated_at: Time.current }
    end
end
