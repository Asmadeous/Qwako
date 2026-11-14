# The guest's confirmation and receipt for a paid stay.
class BookingMailer < ApplicationMailer
  helper_method :money

  def receipt(booking)
    @booking = booking
    @listing = booking.listing
    @payments = booking.payments.select(&:succeeded?)
    @url = "#{Notify.app_url}/account/bookings/#{booking.id}"
    mail to: booking.guest.email, subject: "Booking confirmed: #{@listing.title} | T&G BnB"
  end

  private
    def money(cents, currency = @booking.currency)
      Notify.format_money(cents, currency)
    end
end
