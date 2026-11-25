# One page of payments for the transactions pages (the owner's and a guest's),
# with totals for everything the filters match and a CSV of all of it.
module TransactionListing
  extend ActiveSupport::Concern

  PER_PAGE = 25

  private
    def transaction_filters
      params.permit(:q, :listing_id, :state, :channel, :from, :to)
    end

    def render_transactions(scope)
      rows, meta = page_of(scope.includes(booking: %i[guest listing]).order(paid_at: :desc, id: :desc), PER_PAGE)

      render json: {
        transactions: rows.map { |payment| transaction_json(payment) },
        **meta,
        totals: {
          currency: Listing::CURRENCY,
          received_cents: scope.sum(:amount_cents),
          refunded_cents: scope.where.not(refunded_at: nil).sum(Arel.sql("COALESCE(refund_cents, amount_cents)")),
          refund_due_cents: scope.refund_due.sum(Arel.sql("COALESCE(refund_cents, amount_cents)"))
        },
        channels: scope.unscope(where: :channel).distinct.where.not(channel: nil).pluck(:channel).sort
      }
    end

    def transaction_json(payment)
      booking = payment.booking
      payment.slice(:id, :reference, :amount_cents, :currency, :channel, :paid_at, :refunded_at).merge(
        refund_cents: payment.needs_refund? ? payment.refund_amount_cents : nil,
        state: payment.refunded_at ? "refunded" : payment.refund_due? ? "refund_due" : "paid",
        booking_id: booking.id,
        listing_id: booking.listing_id,
        listing_title: booking.listing.title,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guest_name: booking.guest.name,
        guest_email: booking.guest.email
      )
    end

    CSV_HEADER = [ "Paid on", "Reference", "Guest", "Guest email", "Home", "Check in", "Check out", "Paid with",
                   "Currency", "Amount", "Refund", "Refunded on" ].freeze

    def send_transactions_csv(scope, filename)
      rows = scope.includes(booking: %i[guest listing]).order(paid_at: :desc, id: :desc).map { |payment|
        row = transaction_json(payment)
        [ payment.paid_at&.to_date, row[:reference], row[:guest_name], row[:guest_email], row[:listing_title],
          row[:check_in], row[:check_out], payment.channel, payment.currency, format("%.2f", payment.amount_cents / 100.0),
          row[:refund_cents] && format("%.2f", row[:refund_cents] / 100.0),
          payment.refunded_at&.to_date || (payment.refund_due? ? "Due" : nil) ]
      }
      csv = ([ CSV_HEADER ] + rows).map { |row| row.map { |cell| csv_cell(cell) }.join(",") }.join("\n")
      send_data csv, filename:, type: "text/csv"
    end

    # Quotes a cell when needed, and stops spreadsheets running it as a formula.
    def csv_cell(value)
      text = value.to_s
      text = "'#{text}" if text.start_with?("=", "+", "-", "@")
      text.match?(/[",\n]/) ? "\"#{text.gsub('"', '""')}\"" : text
    end
end
