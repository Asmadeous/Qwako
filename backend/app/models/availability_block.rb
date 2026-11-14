# Nights the owner has taken off sale for a home (repairs, own use). Like a
# booking, it covers starts_on up to, not including, ends_on.
class AvailabilityBlock < ApplicationRecord
  belongs_to :listing

  validates :starts_on, :ends_on, presence: true
  validates :reason, length: { maximum: 120 }
  validate :dates_ordered, :no_stays_in_the_way, on: :create

  scope :overlapping, ->(from, to) { where("daterange(starts_on, ends_on) && daterange(?, ?)", from, to) }

  # "20 Nov 2026 to 22 Nov 2026": first and last blocked night.
  def nights_label
    "#{I18n.l(starts_on, format: :stay)} to #{I18n.l(ends_on - 1, format: :stay)}"
  end

  private
    def dates_ordered
      return unless starts_on && ends_on

      errors.add(:ends_on, "must be after the first blocked night") if ends_on <= starts_on
      errors.add(:ends_on, "must be within a year of the first blocked night") if ends_on - starts_on > 366
    end

    def no_stays_in_the_way
      return unless listing && starts_on && ends_on && ends_on > starts_on

      taken = listing.bookings.active.where("daterange(check_in, check_out) && daterange(?, ?)", starts_on, ends_on)
      errors.add(:base, "Guests have booked some of those nights. Cancel or move those bookings first.") if taken.exists?
    end
end
