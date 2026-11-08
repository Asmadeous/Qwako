# Starts a Paystack checkout for a booking held for payment.
module PaystackCheckout
  private
    def start_checkout(booking)
      payment = booking.payments.create!(reference: Payment.new_reference, amount_cents: booking.total_cents,
        currency: booking.currency)
      data = Paystack.client.initialize_transaction(
        email: booking.guest.email, amount: payment.amount_cents, currency: payment.currency,
        reference: payment.reference, callback_url: "#{app_url}/account/bookings/#{booking.id}",
        metadata: { booking_id: booking.id }
      )
      payment.update!(authorization_url: data["authorization_url"])
      payment
    end

    # Where Paystack sends the guest back to. Production serves the client from
    # Rails; in development the Vite server is the first allowed origin.
    def app_url
      ENV["APP_URL"].presence || CorsOrigins.allowed.first || request.base_url
    end

    def render_payment_unavailable
      render_error(:payment_unavailable, "We couldn't start the payment. Please try again in a moment.",
        status: :bad_gateway)
    end
end
