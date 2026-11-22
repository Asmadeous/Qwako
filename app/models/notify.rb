# Tells people what happened: an item in their notifications list and, for
# bookings and messages, an email. Emails go out in the background.
module Notify
  module_function

  def app_url
    ENV["APP_URL"].presence || CorsOrigins.allowed.first || "http://localhost:5173"
  end

  def guest_booking_url(booking) = "/account/bookings/#{booking.id}"
  def owner_booking_url(booking) = "/account/reservations/#{booking.id}"

  def admins
    User.admin.kept
  end

  def stay(booking)
    "#{booking.listing.title}, #{I18n.l(booking.check_in, format: :stay)} to #{I18n.l(booking.check_out, format: :stay)}"
  end

  # In-app item plus email for one person.
  def tell(user, kind:, title:, body:, url:, email: true)
    return if user.nil? || user.deleted?

    user.notifications.create!(kind:, title:, body:, url:)
    NoticeMailer.notice(user, subject: title, body:, url: "#{app_url}#{url}").deliver_later if email
  end

  def tell_owners(kind:, title:, body:, url:, email: true)
    admins.each { |admin| tell(admin, kind:, title:, body:, url:, email:) }
  end

  def booking_confirmed(booking)
    booking.guest.notifications.create!(kind: "booking_confirmed", title: "Your stay is confirmed",
                                        body: stay(booking), url: guest_booking_url(booking))
    BookingMailer.receipt(booking).deliver_later
    tell_owners(kind: "new_booking", title: "New booking from #{booking.guest.name}", body: stay(booking),
                url: owner_booking_url(booking))
  end

  def booking_requested(booking)
    tell(booking.guest, kind: "booking_requested", title: "Request sent to the owner",
         body: "#{stay(booking)}. You'll hear back within #{Booking::REQUEST_HOURS} hours; if the owner declines, you get a full refund.",
         url: guest_booking_url(booking))
    tell_owners(kind: "booking_request", title: "#{booking.guest.name} asks to book",
                body: "#{stay(booking)}. Accept or decline within #{Booking::REQUEST_HOURS} hours.",
                url: owner_booking_url(booking))
  end

  def booking_declined(booking)
    tell(booking.guest, kind: "booking_declined", title: "Your request wasn't accepted",
         body: "#{stay(booking)}. You'll get your money back in full.", url: guest_booking_url(booking))
  end

  def booking_cancelled(booking, by:)
    refund = booking.refunded_or_due_cents
    money = refund.positive? ? "#{format_money(refund, booking.currency)} will be refunded." : "No refund is due."
    if by == :guest
      tell(booking.guest, kind: "booking_cancelled", title: "Booking cancelled", body: "#{stay(booking)}. #{money}",
           url: guest_booking_url(booking))
      tell_owners(kind: "booking_cancelled", title: "#{booking.guest.name} cancelled", body: "#{stay(booking)}. #{money}",
                  url: owner_booking_url(booking))
    else
      tell(booking.guest, kind: "booking_cancelled", title: "The owner cancelled your booking",
           body: "#{stay(booking)}. #{money}", url: guest_booking_url(booking))
    end
  end

  def booking_rescheduled(booking, by:)
    if by == :guest
      tell_owners(kind: "booking_moved", title: "#{booking.guest.name} changed their dates", body: stay(booking),
                  url: owner_booking_url(booking))
    else
      tell(booking.guest, kind: "booking_moved", title: "Your stay has new dates", body: stay(booking),
           url: guest_booking_url(booking))
    end
  end

  def refund_sent(payment)
    booking = payment.booking
    tell(booking.guest, kind: "refund_sent", title: "Refund sent",
         body: "#{format_money(payment.refund_cents.to_i, payment.currency)} for #{booking.listing.title} is on its way back to you.",
         url: guest_booking_url(booking))
  end

  def new_message(message)
    conversation = message.conversation
    preview = message.body.truncate(140)
    if message.sender.admin?
      guest = conversation.guest
      tell(guest, kind: "message", title: "New message from T&G BnB", body: preview,
           url: "/account/messages/#{conversation.id}", email: guest.email_messages?)
    else
      admins.each do |admin|
        tell(admin, kind: "message", title: "Message from #{message.sender.name}", body: preview,
             url: "/account/inbox/#{conversation.id}", email: admin.email_messages?)
      end
    end
  end

  def new_review(review)
    tell_owners(kind: "review", title: "#{review.author.name} rated #{review.listing.title} #{review.rating}/5",
                body: review.comment.truncate(140), url: "/account/reviews", email: false)
  end

  def contact_message(contact)
    tell_owners(kind: "contact", title: "Contact form: #{contact.name}", body: contact.body.truncate(140),
                url: "/account/inbox?view=contact")
  end

  def format_money(cents, currency)
    "#{currency == "KES" ? "Ksh" : currency} #{ActiveSupport::NumberHelper.number_to_delimited(cents / 100)}"
  end
end
