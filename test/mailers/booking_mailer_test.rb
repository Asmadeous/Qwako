require "test_helper"

class BookingMailerTest < ActionMailer::TestCase
  test "the booking confirmation thanks the guest" do
    booking = Booking.create!(listing: listings(:loft), guest: users(:ada), check_in: 30.days.from_now.to_date,
                              check_out: 32.days.from_now.to_date, guests_count: 1, status: "confirmed")
    mail = BookingMailer.receipt(booking)
    assert_match "Thank you for booking", mail.subject
    assert_includes mail.html_part.body.to_s, "Thank you for booking with TG Homes"
    assert_includes mail.text_part.body.to_s, "Thank you again for choosing to stay with us."
  end
end
