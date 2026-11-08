module Api
  module V1
    # The guest's side of paying for a held booking.
    class PaymentsController < ApplicationController
      include PaystackCheckout

      rate_limit to: 30, within: 10.minutes, with: -> { render_rate_limited }

      before_action :set_booking

      # Returns the Paystack checkout link, reusing the open attempt if there is one.
      def create
        return render_hold_expired unless @booking.hold_active?

        payment = @booking.payments.pending.where.not(authorization_url: nil).order(:created_at).last ||
          start_checkout(@booking)
        render json: { checkout_url: payment.authorization_url }
      rescue Paystack::Error => error
        Rails.logger.error("Paystack checkout failed for booking #{@booking.id}: #{error.message}")
        render_payment_unavailable
      end

      # Called when the guest returns from Paystack. Asks Paystack for the
      # result of each open attempt rather than trusting the browser.
      def verify
        @booking.payments.pending.order(:created_at).each do |payment|
          payment.settle!(Paystack.client.verify_transaction(payment.reference))
        end
        render json: { booking: booking_json(@booking.reload) }
      rescue Paystack::Error => error
        Rails.logger.error("Paystack verify failed for booking #{@booking.id}: #{error.message}")
        render_error(:payment_unavailable, "We couldn't check your payment yet. Refresh in a moment.",
          status: :bad_gateway)
      end

      private
        def set_booking
          Booking.expire_stale_holds!
          @booking = Current.user.bookings.find(params[:booking_id])
        end

        def render_hold_expired
          render_error(:hold_expired, "These dates are no longer held for you. Book again to pay.",
            status: :unprocessable_content)
        end
    end
  end
end
