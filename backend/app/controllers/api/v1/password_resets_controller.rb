module Api
  module V1
    # "Forgot password": emails a link that works for 15 minutes and only once
    # (the token changes with the password). The reply never says whether an
    # account exists for the email.
    class PasswordResetsController < ApplicationController
      allow_unauthenticated_access
      rate_limit to: 5, within: 10.minutes, only: :create, with: -> { render_rate_limited }
      rate_limit to: 10, within: 10.minutes, only: :update, with: -> { render_rate_limited }

      def create
        if (user = User.find_by(email: params[:email].to_s.strip.downcase))
          url = "#{app_url}/reset-password?#{{ token: user.password_reset_token }.to_query}"
          PasswordsMailer.reset(user, url).deliver_later
        end
        head :accepted
      end

      def update
        user = User.find_by_password_reset_token(params[:token].to_s)
        unless user
          return render_error(:invalid_token, "This reset link has expired or was already used. Ask for a new one.",
                              status: :unprocessable_content)
        end

        password = params[:password].to_s
        user.errors.add(:password, "can't be blank") if password.empty?
        return render_validation_errors(user) if password.empty? || !user.update(password:)

        # Signs out every device, then signs this one in with the new password.
        user.sessions.destroy_all
        start_new_session_for user
        render json: { user: user_json(user) }
      end
    end
  end
end
