module Api
  module V1
    module Admin
      # One month across every home: booked, blocked and free nights.
      class CalendarController < ApplicationController
        before_action :require_admin
        before_action -> { Booking.expire_stale_holds! }

        # ?month=2026-11 (defaults to this month)
        def show
          first = month_start
          last = first.end_of_month
          to = last + 1
          listings = Listing.kept.order(:title)
          bookings = Booking.active.where("check_in < ? AND check_out > ?", to, first).includes(:guest).group_by(&:listing_id)
          blocks = AvailabilityBlock.where("starts_on < ? AND ends_on > ?", to, first).group_by(&:listing_id)

          render json: {
            month: first.strftime("%Y-%m"),
            first_day: first,
            last_day: last,
            homes: listings.map { |listing|
              {
                id: listing.id, title: listing.title, status: listing.status,
                bookings: bookings.fetch(listing.id, []).map { |b|
                  { id: b.id, status: b.status, check_in: b.check_in, check_out: b.check_out, guest_name: b.guest.name, guests_count: b.guests_count }
                },
                blocks: blocks.fetch(listing.id, []).map { |block| block.slice(:id, :starts_on, :ends_on, :reason) }
              }
            }
          }
        end

        private
          def month_start
            Date.strptime(params[:month].to_s, "%Y-%m")
          rescue Date::Error
            Time.zone.today.beginning_of_month
          end
      end
    end
  end
end
