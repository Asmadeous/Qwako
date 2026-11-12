module Api
  module V1
    class BookingsController < ApplicationController
      include PaystackCheckout

      rate_limit to: 20, within: 10.minutes, only: :create, with: -> { render_rate_limited }

      before_action -> { Booking.expire_stale_holds! }

      def index
        bookings = Current.user.bookings.includes(:payments, listing: %i[photos videos amenities category]).order(check_in: :desc)
        render json: { bookings: bookings.map { |booking| booking_json(booking) } }
      end

      def show
        render json: { booking: booking_json(Current.user.bookings.find(params[:id])) }
      end

      # Kenyan stays are held for payment and the guest is sent to Paystack;
      # other stays are confirmed straight away until their payments exist.
      def create
        booking = Current.user.bookings.new(booking_params)
        booking.listing = Listing.find_by(id: booking_params[:listing_id])
        booking.status = "pending_payment" if booking.listing&.currency.in?(Booking::ONLINE_PAYMENT_CURRENCIES)
        return render_validation_errors(booking) unless save_booking(booking)

        checkout_url = start_checkout(booking).authorization_url if booking.pending_payment?
        render json: { booking: booking_json(booking), checkout_url: }, status: :created
      rescue Paystack::Error => error
        Rails.logger.error("Paystack checkout failed for booking #{booking.id}: #{error.message}")
        booking.update_columns(status: "expired", updated_at: Time.current)
        render_payment_unavailable
      end

      def cancel
        booking = Current.user.bookings.find(params[:id])
        unless booking.cancel_by_guest!
          return render_error("not_cancellable", "This booking can no longer be cancelled. Contact the owner.",
                              status: :unprocessable_content)
        end

        render json: { booking: booking_json(booking.reload) }
      end

      private
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
