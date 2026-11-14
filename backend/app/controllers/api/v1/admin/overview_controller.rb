module Api
  module V1
    module Admin
      # Today at a glance: arrivals, departures, requests waiting, occupancy,
      # unread messages and recent reviews.
      class OverviewController < ApplicationController
        before_action :require_admin
        before_action -> { Booking.expire_stale_holds! }

        def show
          today = Time.zone.today
          homes = Listing.kept.published.count
          stay = %i[guest listing]
          render json: {
            arrivals_today: Booking.confirmed.where(check_in: today).includes(*stay).map { |b| row(b) },
            departures_today: Booking.confirmed.where(check_out: today).includes(*stay).map { |b| row(b) },
            in_house: Booking.confirmed.where("check_in <= ? AND check_out > ?", today, today).count,
            requests: Booking.requested.order(:requested_until).includes(*stay).map { |b| row(b).merge(requested_until: b.requested_until) },
            occupancy_this_month: occupancy(today.beginning_of_month, today.end_of_month + 1, homes),
            occupancy_next_30_days: occupancy(today, today + 30, homes),
            unread_messages: Conversation.where("owner_read_at IS NULL OR owner_read_at < last_message_at").count,
            new_contact_messages: ContactMessage.where(handled_at: nil).count,
            recent_reviews: Review.includes(:author, :listing).order(created_at: :desc).limit(3).map { |r|
              review_json(r).merge(listing_title: r.listing.title)
            }
          }
        end

        private
          def row(booking)
            { id: booking.id, guest_name: booking.guest.name, listing_title: booking.listing.title,
              check_in: booking.check_in, check_out: booking.check_out, guests_count: booking.guests_count }
          end

          # Booked nights over nights on sale (listed homes x days), as a whole percent.
          def occupancy(from, to, homes)
            days = (to - from).to_i
            return 0 if homes.zero? || days <= 0

            booked = Booking.confirmed.joins(:listing).merge(Listing.kept.published)
              .where("check_in < ? AND check_out > ?", to, from).pluck(:check_in, :check_out)
              .sum { |check_in, check_out| ([ check_out, to ].min - [ check_in, from ].max).to_i }
            ((booked * 100.0) / (homes * days)).round
          end
      end
    end
  end
end
