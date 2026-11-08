module Api
  module V1
    module Admin
      # Every guest's bookings, for the owner.
      class BookingsController < ApplicationController
        PER_PAGE = 50
        VIEWS = %w[upcoming refunds past cancelled all].freeze
        ENDED_STATUSES = %w[declined expired cancelled_by_guest cancelled_by_owner].freeze

        before_action :require_admin
        before_action -> { Booking.expire_stale_holds! }
        before_action :set_booking, only: %i[show cancel mark_refunded]

        # ?view= upcoming (default) | refunds | past | cancelled | all, ?q= guest or stay, ?page=
        def index
          view = VIEWS.include?(params[:view]) ? params[:view] : "upcoming"
          page = [ params[:page].to_i, 1 ].max
          bookings = search(scoped(view)).includes(:guest, :payments, listing: %i[photos videos amenities])
          rows = bookings.offset((page - 1) * PER_PAGE).limit(PER_PAGE + 1).to_a

          render json: {
            bookings: rows.first(PER_PAGE).map { |booking| admin_booking_json(booking) },
            next_page: (page + 1 if rows.size > PER_PAGE),
            refunds_due: refunds_due.count
          }
        end

        def show
          render json: { booking: admin_booking_json(@booking) }
        end

        def cancel
          return render_error(:not_cancellable, "This booking can no longer be cancelled.", status: :unprocessable_content) unless @booking.cancel_by_owner!

          render json: { booking: admin_booking_json(@booking.reload) }
        end

        def mark_refunded
          payment = @booking.payments.find(params[:payment_id])
          return render_error(:no_refund_due, "No refund is due on that payment.", status: :unprocessable_content) unless payment.mark_refunded!

          render json: { booking: admin_booking_json(@booking.reload) }
        end

        private
          def set_booking
            @booking = Booking.includes(:guest, :payments, listing: %i[photos videos amenities]).find(params[:id])
          end

          def refunds_due
            Booking.where(id: Payment.refund_due.select(:booking_id))
          end

          def scoped(view)
            today = Time.zone.today
            case view
            when "upcoming" then Booking.active.where(check_out: today..).order(:check_in, :created_at)
            when "refunds" then refunds_due.order(:check_in)
            when "past" then Booking.where(check_out: ...today).where.not(status: ENDED_STATUSES).order(check_in: :desc)
            when "cancelled" then Booking.where(status: ENDED_STATUSES).order(updated_at: :desc)
            else Booking.order(check_in: :desc)
            end
          end

          def search(bookings)
            query = params[:q].to_s.strip
            return bookings if query.empty?

            like = "%#{Booking.sanitize_sql_like(query)}%"
            bookings.joins(:guest, :listing)
              .where("users.name ILIKE :like OR users.email ILIKE :like OR listings.title ILIKE :like", like:)
          end

          def admin_booking_json(booking)
            booking_json(booking).merge(
              guest: booking.guest.slice(:id, :name, :email),
              can_cancel: booking.owner_can_cancel?,
              refund_due: booking.refund_due?,
              payments: booking.payments.sort_by(&:created_at).map { |payment| payment_json(payment) }
            )
          end

          def payment_json(payment)
            payment.slice(
              :id, :reference, :amount_cents, :currency, :status, :channel, :paid_at, :needs_refund, :refunded_at, :created_at
            ).merge(refund_due: payment.refund_due?)
          end
      end
    end
  end
end
