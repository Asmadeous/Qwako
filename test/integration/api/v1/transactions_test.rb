require "test_helper"

class Api::V1::TransactionsTest < ActionDispatch::IntegrationTest
  setup do
    mine = Booking.create!(listing: listings(:loft), guest: users(:ada), check_in: Date.current + 30,
                           check_out: Date.current + 32, guests_count: 1)
    theirs = Booking.create!(listing: listings(:cottage), guest: users(:grace), check_in: Date.current + 40,
                             check_out: Date.current + 41, guests_count: 1)
    @mine = pay(mine, at: 2.days.ago)
    @refund = pay(mine, at: 1.day.ago, needs_refund: true)
    pay(theirs, at: 1.hour.ago)
  end

  test "visitors must sign in" do
    get api_v1_transactions_path, as: :json
    assert_error :unauthorized, "unauthenticated"
  end

  test "a guest sees only their own payments, filtered and paged" do
    sign_in_as users(:ada)
    get api_v1_transactions_path, as: :json
    assert_response :ok
    body = response.parsed_body
    assert_equal [ @refund, @mine ].map(&:reference), body["transactions"].map { |t| t["reference"] }
    assert_equal [ 2, 1 ], body.values_at("total", "pages")

    get api_v1_transactions_path(state: "refund_due"), as: :json
    assert_equal [ @refund.reference ], response.parsed_body["transactions"].map { |t| t["reference"] }

    get api_v1_transactions_path(listing_id: listings(:cottage).id), as: :json
    assert_equal 2, response.parsed_body["total"], "a guest can't widen the list to other guests' homes"
  end

  private
    def pay(booking, at:, **attrs)
      booking.payments.create!(reference: Payment.new_reference, amount_cents: booking.total_cents,
                               currency: booking.currency, status: "succeeded", paid_at: at, channel: "card", **attrs)
    end
end
