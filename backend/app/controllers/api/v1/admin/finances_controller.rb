module Api
  module V1
    module Admin
      # Money in and out for one calendar year, per currency (all homes are in
      # Kenya, so in practice shillings). Refunds still owed and stays already
      # booked ahead are shown as they stand today, whatever the year.
      class FinancesController < ApplicationController
        before_action :require_admin

        def show
          year = selected_year
          range = Time.zone.local(year).all_year
          received = Payment.succeeded.where(paid_at: range).includes(booking: %i[guest listing]).order(paid_at: :desc).to_a
          refunded = Payment.succeeded.where(refunded_at: range).to_a
          currencies = (received + refunded).map(&:currency) | refunds_due.keys | booked_ahead.keys

          render json: {
            year:,
            years: years_with_payments(year),
            currencies: currencies.sort_by { |c| [ c == "KES" ? 0 : 1, c ] }.map { |currency|
              summary(currency, received.select { |p| p.currency == currency }, refunded.select { |p| p.currency == currency })
            },
            payments: received.map { |payment| payment_row(payment) }
          }
        end

        private
          def selected_year
            year = params[:year].to_i
            year.between?(2000, Time.zone.today.year + 1) ? year : Time.zone.today.year
          end

          def years_with_payments(selected)
            years = Payment.succeeded.where.not(paid_at: nil).pluck(:paid_at).map { |at| at.in_time_zone.year }
            (years | [ Time.zone.today.year, selected ]).sort.reverse
          end

          def refunds_due
            @refunds_due ||= Payment.succeeded.refund_due.group(:currency)
              .pluck(:currency, Arel.sql("SUM(COALESCE(refund_cents, amount_cents))"), Arel.sql("COUNT(*)"))
              .to_h { |currency, cents, count| [ currency, { cents:, count: } ] }
          end

          def booked_ahead
            @booked_ahead ||= Booking.confirmed.where(check_in: Time.zone.today..).group(:currency)
              .pluck(:currency, Arel.sql("SUM(total_cents)"), Arel.sql("COUNT(*)"))
              .to_h { |currency, cents, count| [ currency, { cents:, count: } ] }
          end

          def summary(currency, received, refunded)
            received_cents = received.sum(&:amount_cents)
            refunded_cents = refunded.sum { |p| refunded_amount(p) }
            {
              currency:,
              received_cents:,
              refunded_cents:,
              net_cents: received_cents - refunded_cents,
              payments_count: received.size,
              refunds_due_cents: refunds_due.dig(currency, :cents) || 0,
              refunds_due_count: refunds_due.dig(currency, :count) || 0,
              booked_ahead_cents: booked_ahead.dig(currency, :cents) || 0,
              booked_ahead_count: booked_ahead.dig(currency, :count) || 0,
              months: (1..12).map { |month| month_row(month, received, refunded) },
              homes: home_rows(received)
            }
          end

          def month_row(month, received, refunded)
            in_month = ->(at) { at&.in_time_zone&.month == month }
            received_cents = received.select { |p| in_month.(p.paid_at) }.sum(&:amount_cents)
            refunded_cents = refunded.select { |p| in_month.(p.refunded_at) }.sum { |p| refunded_amount(p) }
            { month:, received_cents:, refunded_cents:, net_cents: received_cents - refunded_cents }
          end

          # Stays and nights count only bookings that went ahead; refunds
          # include those already sent and those still owed.
          def home_rows(received)
            received.group_by { |p| p.booking.listing }.map { |listing, payments|
              stays = payments.map(&:booking).uniq.select { |booking| booking.confirmed? || booking.completed? }
              received_cents = payments.sum(&:amount_cents)
              refunds_cents = payments.sum { |p| p.needs_refund? ? refunded_amount(p) : 0 }
              { listing_id: listing.id, title: listing.title, deleted: listing.deleted?, bookings: stays.size,
                nights: stays.sum(&:nights), received_cents:, refunds_cents:, net_cents: received_cents - refunds_cents }
            }.sort_by { |row| -row[:net_cents] }
          end

          def refunded_amount(payment)
            payment.refund_cents || payment.amount_cents
          end

          def payment_row(payment)
            booking = payment.booking
            payment.slice(:id, :reference, :amount_cents, :currency, :channel, :paid_at, :refunded_at, :refund_cents).merge(
              refund_due: payment.refund_due?,
              booking_id: booking.id,
              guest_name: booking.guest.name,
              guest_email: booking.guest.email,
              listing_title: booking.listing.title,
              check_in: booking.check_in,
              check_out: booking.check_out
            )
          end
      end
    end
  end
end
