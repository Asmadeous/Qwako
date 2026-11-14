module Api
  module V1
    class BookingsController < ApplicationController
      include PaystackCheckout

      rate_limit to: 20, within: 10.minutes, only: :create, with: -> { render_rate_limited }

      INCLUDES = [ :payments, :conversation, { review: :author }, { listing: %i[photos videos amenities category] } ].freeze

      before_action -> { Booking.expire_stale_holds! }

      def index
        bookings = Current.user.bookings.includes(*INCLUDES).order(check_in: :desc)
        render json: { bookings: bookings.map { |booking| booking_json(booking) } }
      end

      def show
        booking = Current.user.bookings.includes(*INCLUDES).find(params[:id])
        render json: { booking: booking_json(booking).merge(payments: booking.payments.sort_by(&:created_at).map { |p| receipt_payment_json(p) }) }
      end

      # The dates are held while the guest pays through Paystack.
      def create
        booking = Current.user.bookings.new(booking_params.merge(status: "pending_payment"))
        booking.listing = Listing.find_by(id: booking_params[:listing_id])
        return render_validation_errors(booking) unless save_booking(booking)

        checkout_url = start_checkout(booking).authorization_url
        render json: { booking: booking_json(booking), checkout_url: }, status: :created
      rescue Paystack::Error => error
        Rails.logger.error("Paystack checkout failed for booking #{booking.id}: #{error.message}")
        booking.update_columns(status: "expired", updated_at: Time.current)
        render_payment_unavailable
      end

      def cancel
        booking = Current.user.bookings.find(params[:id])
        unless booking.cancel_by_guest!(reason: params[:reason].to_s.strip.first(300))
          return render_error("not_cancellable", "This booking can no longer be cancelled. Contact the owner.",
                              status: :unprocessable_content)
        end

        render json: { booking: booking_json(booking.reload) }
      end

      # Moves the stay to other free dates: same number of nights or fewer.
      def reschedule
        booking = Current.user.bookings.find(params[:id])
        if booking.reschedule!(parse_date(params[:check_in]), parse_date(params[:check_out]), by_owner: false)
          render json: { booking: booking_json(booking.reload) }
        else
          render_validation_errors booking
        end
      end

      private
        def parse_date(value)
          Date.iso8601(value.to_s)
        rescue Date::Error
          nil
        end

        def booking_params
          raw = params[:booking]
          return {} unless raw.is_a?(ActionController::Parameters)

          raw.permit(:listing_id, :check_in, :check_out, :guests_count)
        end

        # The exclusion constraint wins any race the overlap validation misses.
        def save_booking(booking)
          booking.save
        rescue ActiveRecord::ExclusionViolation
          booking.errors.add(:base, "Those dates are no longer available.")
          false
        end
    end
  end
end
