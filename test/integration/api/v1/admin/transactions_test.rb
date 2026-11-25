require "test_helper"

class Api::V1::Admin::TransactionsTest < ActionDispatch::IntegrationTest
  setup do
    loft = Booking.create!(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 30,
                           check_out: Date.current + 32, guests_count: 1)
    cottage = Booking.create!(listing: listings(:cottage), guest: users(:grace), check_in: Date.current + 40,
                              check_out: Date.current + 41, guests_count: 1)
    @paid = pay(loft, at: Time.zone.local(2026, 3, 10, 12), channel: "card")
    @refunded = pay(cottage, at: Time.zone.local(2026, 4, 2, 12), needs_refund: true, refund_cents: 5_000,
                    refunded_at: Time.zone.local(2026, 4, 3, 12))
    @owed = pay(cottage, at: Time.zone.local(2026, 5, 1, 12), needs_refund: true)
    pay(cottage, at: Time.zone.local(2026, 5, 2, 12), status: "failed")
  end

  test "only the owner can list or export transactions" do
    get api_v1_admin_transactions_path, as: :json
    assert_error :unauthorized, "unauthenticated"

    [ users(:ada), users(:staff) ].each do |user|
      sign_in_as user
      get api_v1_admin_transactions_path, as: :json
      assert_error :forbidden, "forbidden"
      get export_api_v1_admin_transactions_path
      assert_error :forbidden, "forbidden"
      delete api_v1_session_path, as: :json
    end
  end

  test "lists successful payments newest first with totals for the whole match" do
    sign_in_as users(:owner)
    get api_v1_admin_transactions_path, as: :json
    assert_response :ok
    body = response.parsed_body

    assert_equal [ @owed, @refunded, @paid ].map(&:reference), body["transactions"].map { |t| t["reference"] }
    assert_equal %w[refund_due refunded paid], body["transactions"].map { |t| t["state"] }
    assert_equal [ 3, 1, 1 ], body.values_at("total", "page", "pages")
    assert_equal [ @paid, @refunded, @owed ].sum(&:amount_cents), body["totals"]["received_cents"]
    assert_equal 5_000, body["totals"]["refunded_cents"]
    assert_equal @owed.amount_cents, body["totals"]["refund_due_cents"]
    assert_equal %w[card mobile_money], body["channels"]
    assert_equal "Grace Hopper", body["transactions"].first["guest_name"]
  end

  test "filters by search, home, state, channel and paid dates" do
    sign_in_as users(:owner)
    { { q: "ada" } => [ @paid ], { q: @refunded.reference } => [ @refunded ], { q: "Naivasha" } => [ @owed, @refunded ],
      { listing_id: listings(:loft).id } => [ @paid ], { state: "paid" } => [ @paid ],
      { state: "refund_due" } => [ @owed ], { state: "refunded" } => [ @refunded ], { channel: "card" } => [ @paid ],
      { from: "2026-04-01", to: "2026-04-30" } => [ @refunded ], { from: "2026-05-01" } => [ @owed ],
      { to: "2026-03-10" } => [ @paid ], { from: "not-a-date" } => [ @owed, @refunded, @paid ] }.each do |filters, expected|
      get api_v1_admin_transactions_path(filters), as: :json
      assert_equal expected.map(&:reference), response.parsed_body["transactions"].map { |t| t["reference"] }, filters.inspect
    end
  end

  test "pages through a long list and clamps a page past the end" do
    booking = Booking.create!(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 90,
                              check_out: Date.current + 91, guests_count: 1)
    30.times { |i| pay(booking, at: Time.zone.local(2025, 1, 1) + i.hours) }
    sign_in_as users(:owner)

    get api_v1_admin_transactions_path(page: 2), as: :json
    body = response.parsed_body
    assert_equal [ 33, 2, 2, 25 ], body.values_at("total", "page", "pages", "per_page")
    assert_equal 8, body["transactions"].size

    get api_v1_admin_transactions_path(page: 99), as: :json
    assert_equal 2, response.parsed_body["page"]
  end

  test "exports every matching transaction as CSV" do
    sign_in_as users(:owner)
    get export_api_v1_admin_transactions_path(state: "refunded")
    assert_response :ok
    assert_equal "text/csv", response.media_type
    lines = response.body.lines
    assert_equal 2, lines.size
    assert_includes lines.last, @refunded.reference
    assert_includes lines.last, "50.00"
  end

  private
    def pay(booking, at:, status: "succeeded", channel: "mobile_money", **attrs)
      booking.payments.create!(reference: Payment.new_reference, amount_cents: booking.total_cents,
                               currency: booking.currency, status:, paid_at: at, channel:, **attrs)
    end
end
