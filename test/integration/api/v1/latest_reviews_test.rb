require "test_helper"

# The home page shows the newest reviews of homes guests can book.
class Api::V1::LatestReviewsTest < ActionDispatch::IntegrationTest
  test "anyone sees the newest visible reviews of published homes, with the home's name" do
    today = Time.zone.today
    rows = [ [ :loft, "Lovely loft", false ], [ :loft, "Hidden by owner", true ], [ :hidden, "Draft home", false ] ]
    now = Time.current
    rows.each_with_index do |(listing, comment, hidden), i|
      check_in = today - 40 - (5 * i)
      booking_id = Booking.insert_all([ {
        listing_id: listings(listing).id, guest_id: users(:ada).id, check_in:, check_out: check_in + 2, guests_count: 1,
        nights: 2, nightly_price_cents: 10_000, cleaning_charge_cents: 0, total_cents: 20_000, status: "completed",
        created_at: now, updated_at: now
      } ], returning: :id).rows.first.first
      Review.insert_all([ { booking_id:, listing_id: listings(listing).id, author_id: users(:ada).id, rating: 5, comment:,
                            hidden:, created_at: now - i.hours, updated_at: now } ])
    end

    get api_v1_reviews_path, as: :json
    assert_response :ok
    comments = response.parsed_body["reviews"].map { |r| r["comment"] }
    assert_includes comments, "Lovely loft"
    assert_not_includes comments, "Hidden by owner"
    assert_not_includes comments, "Draft home"
    loft = response.parsed_body["reviews"].find { |r| r["comment"] == "Lovely loft" }
    assert_equal listings(:loft).title, loft["listing_title"]
    assert_equal users(:ada).name.split.first, loft["author_name"]
  end
end
