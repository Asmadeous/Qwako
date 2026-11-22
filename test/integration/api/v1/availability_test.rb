require "test_helper"

class Api::V1::AvailabilityTest < ActionDispatch::IntegrationTest
  test "a home page lists booked and blocked nights so the calendar can grey them out" do
    listings(:cottage).availability_blocks.create!(starts_on: Date.current + 20, ends_on: Date.current + 22, reason: "Repairs")
    get api_v1_listing_path(listings(:cottage)), as: :json
    ranges = response.parsed_body.dig("listing", "unavailable")
    assert_includes ranges, { "from" => (Date.current + 10).iso8601, "to" => (Date.current + 13).iso8601 }
    assert_includes ranges, { "from" => (Date.current + 20).iso8601, "to" => (Date.current + 22).iso8601 }
    assert_no_match(/Repairs/, response.body)
  end

  test "blocked nights can't be booked" do
    listings(:cottage).availability_blocks.create!(starts_on: Date.current + 20, ends_on: Date.current + 22)
    sign_in_as users(:ada)
    post api_v1_bookings_path, params: { booking: { listing_id: listings(:cottage).id, check_in: Date.current + 21,
                                                    check_out: Date.current + 24, guests_count: 1 } }, as: :json
    assert_error :unprocessable_content, "validation_failed"
    assert_equal [ "Those dates are no longer available." ], response.parsed_body.dig("error", "details", "base")
  end

  test "each home sets its own minimum and maximum nights" do
    listings(:cottage).update!(min_nights: 3, max_nights: 5)
    sign_in_as users(:ada)
    post api_v1_bookings_path, params: { booking: { listing_id: listings(:cottage).id, check_in: Date.current + 20,
                                                    check_out: Date.current + 22, guests_count: 1 } }, as: :json
    assert_match(/at least 3 nights/, response.parsed_body.dig("error", "details", "check_out").first)

    post api_v1_bookings_path, params: { booking: { listing_id: listings(:cottage).id, check_in: Date.current + 20,
                                                    check_out: Date.current + 26, guests_count: 1 } }, as: :json
    assert_match(/within 5 nights/, response.parsed_body.dig("error", "details", "check_out").first)
  end

  test "search by dates leaves out homes taken on any of those nights, and by guests" do
    get api_v1_listings_path(check_in: Date.current + 11, check_out: Date.current + 12), as: :json
    titles = response.parsed_body["listings"].map { |l| l["title"] }
    assert_not_includes titles, "Naivasha Cottage"
    assert_includes titles, "Kilimani Loft"

    get api_v1_listings_path(check_in: Date.current + 13, check_out: Date.current + 15, guests: 3), as: :json
    assert_equal [ "Naivasha Cottage" ], response.parsed_body["listings"].map { |l| l["title"] }
  end

  test "homes come a page at a time when a page is asked for" do
    get api_v1_listings_path(page: 1), as: :json
    assert_equal 2, response.parsed_body["total"]
    assert_nil response.parsed_body["next_page"]
  end

  test "the owner blocks and reopens nights; nights with guests can't be blocked" do
    sign_in_as users(:owner)
    post api_v1_admin_listing_blocks_path(listings(:cottage)), params: { starts_on: Date.current + 11, ends_on: Date.current + 12 }, as: :json
    assert_error :unprocessable_content, "validation_failed"

    post api_v1_admin_listing_blocks_path(listings(:cottage)), params: { starts_on: Date.current + 30, ends_on: Date.current + 33, reason: "Own use" }, as: :json
    assert_response :created
    block_id = response.parsed_body.dig("block", "id")
    assert_equal "block_dates", AuditLog.last.action

    get api_v1_admin_calendar_path(month: (Date.current + 30).strftime("%Y-%m")), as: :json
    cottage = response.parsed_body["homes"].find { |h| h["title"] == "Naivasha Cottage" }
    assert_equal [ "Own use" ], cottage["blocks"].map { |b| b["reason"] }

    delete api_v1_admin_block_path(block_id), as: :json
    assert_response :no_content
    assert_not AvailabilityBlock.exists?(block_id)
  end

  test "guests can't block dates or see the calendar" do
    sign_in_as users(:ada)
    get api_v1_admin_calendar_path, as: :json
    assert_error :forbidden, "forbidden"
    post api_v1_admin_listing_blocks_path(listings(:cottage)), params: { starts_on: Date.current + 30, ends_on: Date.current + 31 }, as: :json
    assert_error :forbidden, "forbidden"
  end
end
