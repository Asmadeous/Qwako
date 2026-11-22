module Api
  module V1
    module Admin
      # Everyone who has an account as a guest, with what they've booked.
      class GuestsController < ApplicationController
        PER_PAGE = 50

        before_action :require_admin

        # ?q= name, email or phone, ?page=
        def index
          guests = User.guest.kept.order(created_at: :desc)
          if (query = params[:q].to_s.strip).present?
            like = "%#{User.sanitize_sql_like(query)}%"
            guests = guests.where("users.name ILIKE :like OR users.email ILIKE :like OR users.phone ILIKE :like", like:)
          end
          rows, next_page = paginate(guests, PER_PAGE)
          stats = Booking.where(guest_id: rows.map(&:id)).group(:guest_id)
            .pluck(:guest_id, Arel.sql("COUNT(*) FILTER (WHERE status IN ('confirmed','completed'))"),
                   Arel.sql("COALESCE(SUM(total_cents) FILTER (WHERE status IN ('confirmed','completed')), 0)"),
                   Arel.sql("MAX(check_in) FILTER (WHERE status IN ('confirmed','completed'))"))
            .to_h { |id, count, spent, last| [ id, { stays: count, spent_cents: spent, last_check_in: last } ] }

          render json: {
            guests: rows.map { |guest| guest_row(guest).merge(stats.fetch(guest.id, { stays: 0, spent_cents: 0, last_check_in: nil })) },
            next_page:
          }
        end

        def show
          guest = User.find(params[:id])
          bookings = guest.bookings.includes(:payments, :conversation, { review: :author }, listing: %i[photos videos amenities category])
            .order(check_in: :desc)
          render json: { guest: guest_row(guest), bookings: bookings.map { |b| booking_json(b) } }
        end

        private
          def guest_row(guest)
            guest.slice(:id, :name, :email, :phone, :created_at).merge(
              email_verified: guest.email_verified?, marketing_consent: guest.marketing_consent_at.present?
            )
          end
      end
    end
  end
end
