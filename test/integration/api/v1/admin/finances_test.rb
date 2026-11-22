require "test_helper"

class Api::V1::Admin::FinancesTest < ActionDispatch::IntegrationTest
  setup do
    @year = Time.current.year
    loft_stay = Booking.create!(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 30,
                                check_out: Date.current + 32, guests_count: 1)
    @paid = pay(loft_stay, at: Time.current.beginning_of_year + 1.hour)
    refunded_stay = Booking.create!(listing: listings(:loft), guest: users(:grace), check_in: Date.current + 40,
                                    check_out: Date.current + 41, guests_count: 1)
    @refunded = pay(refunded_stay, at: 1.minute.ago, needs_refund: true, refunded_at: Time.current)
    owed_stay = Booking.create!(listing: listings(:loft), guest: users(:grace), check_in: Date.current + 50,
                                check_out: Date.current + 51, guests_count: 1)
    @owed = pay(owed_stay, at: 2.minutes.ago, needs_refund: true)
    pay(owed_stay, at: 1.minute.ago, status: "failed")
    pay(loft_stay, at: 1.year.ago)
  end

  test "guests are forbidden and visitors must sign in" do
    get api_v1_admin_finances_path, as: :json
    assert_error :unauthorized, "unauthenticated"

    sign_in_as users(:ada)
    get api_v1_admin_finances_path, as: :json
    assert_error :forbidden, "forbidden"
  end

  test "totals this year's money, refunds and stays booked ahead" do
    sign_in_as users(:owner)
    get api_v1_admin_finances_path, as: :json
    assert_response :ok
    body = response.parsed_body

    assert_equal @year, body["year"]
    assert_includes body["years"], @year - 1
    assert_equal %w[KES], body["currencies"].map { |c| c["currency"] }

    kes = body["currencies"].first
    received = @paid.amount_cents + @refunded.amount_cents + @owed.amount_cents
    assert_equal received, kes["received_cents"]
    assert_equal @refunded.amount_cents, kes["refunded_cents"]
    assert_equal received - @refunded.amount_cents, kes["net_cents"]
    assert_equal 3, kes["payments_count"]
    assert_equal [ @owed.amount_cents, 1 ], kes.values_at("refunds_due_cents", "refunds_due_count")
    assert_equal 12, kes["months"].size
    assert_equal received, kes["months"].sum { |m| m["received_cents"] }
    assert_equal [ listings(:loft).id, 3 ], kes["homes"].first.values_at("listing_id", "bookings")
    refunds = @refunded.amount_cents + @owed.amount_cents
    assert_equal [ received, refunds, received - refunds ], kes["homes"].first.values_at("received_cents", "refunds_cents", "net_cents")
    assert_equal Booking.confirmed.where(check_in: Date.current..).sum(:total_cents), kes["booked_ahead_cents"]
    assert_operator kes["booked_ahead_cents"], :>=, bookings(:grace_cottage).total_cents

    assert_equal 3, body["payments"].size
    owed_row = body["payments"].find { |p| p["reference"] == @owed.reference }
    assert owed_row["refund_due"]
    assert_equal "Grace", owed_row["guest_name"].split.first
  end

  test "an earlier year shows only that year's payments" do
    sign_in_as users(:owner)
    get api_v1_admin_finances_path(year: @year - 1), as: :json
    assert_response :ok
    kes = response.parsed_body["currencies"].find { |c| c["currency"] == "KES" }
    assert_equal 1, kes["payments_count"]
    assert_equal 1, response.parsed_body["payments"].size
  end

  test "an out-of-range year falls back to this year" do
    sign_in_as users(:owner)
    get api_v1_admin_finances_path(year: 1066), as: :json
    assert_equal @year, response.parsed_body["year"]
  end

  private
    def pay(booking, at:, status: "succeeded", **attrs)
      booking.payments.create!(reference: Payment.new_reference, amount_cents: booking.total_cents,
                               currency: booking.currency, status:, paid_at: at, channel: "mobile_money", **attrs)
    end
end
