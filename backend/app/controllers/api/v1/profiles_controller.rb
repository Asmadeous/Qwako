module Api
  module V1
    # The signed-in person's own details, settings, data export and account closing.
    class ProfilesController < ApplicationController
      rate_limit to: 5, within: 10.minutes, only: :destroy, with: -> { render_rate_limited }

      def update
        user = Current.user
        return render_wrong_password(user) if changing_password? && !user.authenticate(params[:current_password].to_s)

        user.assign_attributes(profile_params)
        if params.key?(:marketing_consent)
          user.marketing_consent_at = ActiveModel::Type::Boolean.new.cast(params[:marketing_consent]) ? Time.current : nil
        end
        if user.save
          render json: { user: user_json(user) }
        else
          render_validation_errors user
        end
      end

      # Everything the site holds about the person, as a JSON file (Data Protection Act 2019).
      def export
        user = Current.user
        bookings = user.bookings.includes(:payments, :listing, :review).order(:check_in)
        data = {
          exported_at: Time.current,
          profile: user.slice(:name, :email, :phone, :role, :created_at, :email_verified_at, :marketing_consent_at),
          bookings: bookings.map { |booking|
            booking.slice(:check_in, :check_out, :nights, :guests_count, :status, :currency, :total_cents, :created_at)
              .merge(home: booking.listing.title, payments: booking.payments.map { |p| receipt_payment_json(p) },
                     review: booking.review&.slice(:rating, :comment, :created_at))
          },
          saved_homes: user.saved_homes.pluck(:title),
          messages: user.conversations.includes(messages: :sender).flat_map { |c|
            c.messages.map { |m| { conversation: c.subject, from: m.sender.name, body: m.body, sent_at: m.created_at } }
          }
        }
        send_data JSON.pretty_generate(data), filename: "tg-bnb-my-data.json", type: :json, disposition: :attachment
      end

      # Closes the account. Refused while a stay is still to come, and for the last admin.
      def destroy
        user = Current.user
        return render_wrong_password(user) unless user.authenticate(params[:password].to_s)

        if user.bookings.active.where(check_out: Time.zone.today..).exists?
          return render_error(:has_upcoming_stays, "You have a stay still to come. Cancel it first, then close your account.",
                              status: :unprocessable_content)
        end
        if user.admin? && User.admin.kept.where.not(id: user.id).none?
          return render_error(:last_admin, "You're the only owner account. Add another team member first.",
                              status: :unprocessable_content)
        end

        user.close_account!
        cookies.delete(:session_id)
        head :no_content
      end

      private
        def changing_password?
          params[:password].present? && action_name == "update"
        end

        def profile_params
          attrs = params.permit(:name, :avatar, :phone, :email_messages).to_h.symbolize_keys
          attrs[:password] = params[:password] if changing_password?
          attrs
        end

        def render_wrong_password(user)
          field = action_name == "destroy" ? :password : :current_password
          user.errors.add(field, "is incorrect")
          render_validation_errors user
        end
    end
  end
end
