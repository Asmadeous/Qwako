module Api
  module V1
    module Admin
      # Everyone who has an account as a guest, with what they've booked.
      # Staff can add and edit guests; closing an account is for the owner.
      class GuestsController < ApplicationController
        PER_PAGE = 50

        before_action :require_team
        before_action :require_admin, only: :destroy
        before_action -> { @guest = User.guest.kept.find(params[:id]) }, only: %i[update destroy]

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
          guest = User.guest.find(params[:id])
          bookings = guest.bookings.includes(:payments, :conversation, { review: :author }, listing: %i[photos videos amenities category])
            .order(check_in: :desc)
          render json: { guest: guest_row(guest), bookings: bookings.map { |b| booking_json(b) } }
        end

        # Someone who books by phone or in person. They can set a password
        # later with "Forgot password".
        def create
          guest = User.new(guest_params.merge(password: SecureRandom.base58(24)))
          return render_validation_errors(guest) unless guest.save

          audit("add_guest", guest, "Added the guest #{guest.name} (#{guest.email})")
          render json: { guest: guest_row(guest) }, status: :created
        end

        # A new email address has to be confirmed again by its owner.
        def update
          @guest.assign_attributes(guest_params)
          @guest.email_verified_at = nil if @guest.email_changed?
          return render_validation_errors(@guest) unless @guest.save

          audit("change_guest", @guest, "Changed the details of #{@guest.name} (#{@guest.email})")
          render json: { guest: guest_row(@guest) }
        end

        # Closes the account: details removed, bookings kept for the records.
        def destroy
          if @guest.bookings.active.where(check_out: Time.zone.today..).exists?
            return render_error(:has_stays, "#{@guest.name} has a stay coming up. Cancel it first.", status: :unprocessable_content)
          end

          summary = "Closed the account of #{@guest.name} (#{@guest.email})"
          @guest.close_account!
          audit("close_guest", @guest, summary)
          head :no_content
        end

        private
          def guest_params
            raw = params[:guest]
            raw.is_a?(ActionController::Parameters) ? raw.permit(:name, :email, :phone) : {}
          end

          def guest_row(guest)
            guest.slice(:id, :name, :email, :phone, :created_at).merge(
              email_verified: guest.email_verified?, marketing_consent: guest.marketing_consent_at.present?
            )
          end
      end
    end
  end
end
