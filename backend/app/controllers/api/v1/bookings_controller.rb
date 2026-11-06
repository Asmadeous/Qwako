module Api
  module V1
    class BookingsController < ApplicationController
      rate_limit to: 20, within: 10.minutes, only: :create, with: -> { render_rate_limited }

      def index
        bookings = Current.user.bookings.includes(listing: %i[photos amenities]).order(check_in: :desc)
        render json: { bookings: bookings.map { |booking| booking_json(booking) } }
      end

      def show
        render json: { booking: booking_json(Current.user.bookings.find(params[:id])) }
      end

      def create
        booking = Current.user.bookings.new(booking_params)
        booking.listing = Listing.find_by(id: booking_params[:listing_id])

        if save_booking(booking)
          render json: { booking: booking_json(booking) }, status: :created
        else
          render_validation_errors booking
        end
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
