require "test_helper"

class BookingTest < ActiveSupport::TestCase
  test "the database refuses an overlapping active booking even without validations" do
    overlap = bookings(:grace_cottage).dup
    overlap.guest = users(:ada)
    assert_raises(ActiveRecord::ExclusionViolation) { overlap.save!(validate: false) }
  end

  test "cancelled bookings free their nights" do
    bookings(:grace_cottage).update!(status: "cancelled_by_guest")
    overlap = bookings(:grace_cottage).dup
    overlap.status = "confirmed"
    assert overlap.save(validate: false)
  end

  test "the database refuses a total that does not match the price" do
    booking = bookings(:grace_cottage)
    assert_raises(ActiveRecord::StatementInvalid) { booking.update_column(:total_pence, 1) }
  end
end
