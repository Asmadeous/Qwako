module Api
  module V1
    module Admin
      # Every guest's bookings, for the owner.
      class BookingsController < ApplicationController
        PER_PAGE = 50
        VIEWS = %w[upcoming requests refunds past cancelled all].freeze
        ENDED_STATUSES = Booking::ENDED_STATUSES
        INCLUDES = [ :guest, :payments, :conversation, { review: :author }, { listing: %i[photos videos amenities category] } ].freeze

        before_action :require_admin
        before_action -> { Booking.expire_stale_holds! }
        before_action :set_booking, except: :index

        # ?view= upcoming (default) | requests | refunds | past | cancelled | all, ?q= guest or stay, ?page=
        def index
          view = VIEWS.include?(params[:view]) ? params[:view] : "upcoming"
          page = [ params[:page].to_i, 1 ].max
          bookings = search(scoped(view)).includes(*INCLUDES)
          rows = bookings.offset((page - 1) * PER_PAGE).limit(PER_PAGE + 1).to_a

          render json: {
            bookings: rows.first(PER_PAGE).map { |booking| admin_booking_json(booking) },
            next_page: (page + 1 if rows.size > PER_PAGE),
            refunds_due: refunds_due.count,
            requests: Booking.requested.count
          }
        end

        def show
          render json: { booking: admin_booking_json(@booking) }
        end

        def cancel
          unless @booking.cancel_by_owner!(reason: params[:reason].to_s.strip.first(300))
            return render_error(:not_cancellable, "This booking can no longer be cancelled.", status: :unprocessable_content)
          end

          audit("cancel_booking", @booking, "Cancelled #{@booking.guest.name}'s stay at #{@booking.listing.title}")
          render_booking
        end

        def accept
          return render_error(:not_requested, "This booking isn't waiting for an answer.", status: :unprocessable_content) unless @booking.accept!

          audit("accept_booking", @booking, "Accepted #{@booking.guest.name}'s request for #{@booking.listing.title}")
          render_booking
        end

        def decline
          unless @booking.decline!(reason: params[:reason].to_s.strip.first(300).presence)
            return render_error(:not_requested, "This booking isn't waiting for an answer.", status: :unprocessable_content)
          end

          audit("decline_booking", @booking, "Declined #{@booking.guest.name}'s request for #{@booking.listing.title}")
          render_booking
        end

        def reschedule
          if @booking.reschedule!(parse_date(params[:check_in]), parse_date(params[:check_out]), by_owner: true)
            audit("move_booking", @booking, "Moved #{@booking.guest.name}'s stay at #{@booking.listing.title} to #{I18n.l(@booking.check_in, format: :stay)} - #{I18n.l(@booking.check_out, format: :stay)}")
            render_booking
          else
            render_validation_errors @booking
          end
        end

        # Recorded after refunding in the Paystack dashboard.
        def mark_refunded
          payment = @booking.payments.find(params[:payment_id])
          return render_error(:no_refund_due, "No refund is due on that payment.", status: :unprocessable_content) unless payment.mark_refunded!

          audit("mark_refunded", @booking, "Marked #{payment.reference} refunded")
          render_booking
        end

        # Sends the refund through Paystack, back to the guest's card or M-Pesa.
        def refund
          payment = @booking.payments.find(params[:payment_id])
          return render_error(:no_refund_due, "No refund is due on that payment.", status: :unprocessable_content) unless payment.refund_through_paystack!

          audit("refund", @booking, "Refunded #{Notify.format_money(payment.refund_cents, payment.currency)} on #{payment.reference} through Paystack")
          render_booking
        rescue Paystack::Error => error
          Rails.logger.error("Paystack refund failed for #{payment.reference}: #{error.message}")
          render_error(:refund_failed, "Paystack didn't accept the refund: #{error.message}", status: :bad_gateway)
        end

        private
          def set_booking
            @booking = Booking.includes(*INCLUDES).find(params[:id])
          end

          def render_booking
            render json: { booking: admin_booking_json(Booking.includes(*INCLUDES).find(@booking.id)) }
          end

          def parse_date(value)
            Date.iso8601(value.to_s)
          rescue Date::Error
            nil
          end

          def refunds_due
            Booking.where(id: Payment.refund_due.select(:booking_id))
          end

          def scoped(view)
            today = Time.zone.today
            case view
            when "upcoming" then Booking.active.where(check_out: today..).order(:check_in, :created_at)
            when "requests" then Booking.requested.order(:requested_until)
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
              guest: booking.guest.slice(:id, :name, :email, :phone),
              can_cancel: booking.owner_can_cancel?,
              can_reschedule: booking.can_reschedule?(by_owner: true),
              private_details: booking.listing.slice(*JsonRenderers::PRIVATE_LISTING_FIELDS),
              refund_due: booking.refund_due?,
              payments: booking.payments.sort_by(&:created_at).map { |payment| payment_json(payment) }
            )
          end

          def payment_json(payment)
            payment.slice(
              :id, :reference, :amount_cents, :currency, :status, :channel, :paid_at, :needs_refund, :refund_cents,
              :refunded_at, :created_at
            ).merge(refund_due: payment.refund_due?)
          end
      end
    end
  end
end
