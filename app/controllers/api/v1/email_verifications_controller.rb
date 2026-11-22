module Api
  module V1
    # Confirming the email address with the link sent at sign-up.
    class EmailVerificationsController < ApplicationController
      allow_unauthenticated_access only: :update
      rate_limit to: 3, within: 10.minutes, only: :create, with: -> { render_rate_limited }
      rate_limit to: 10, within: 10.minutes, only: :update, with: -> { render_rate_limited }

      # Sends the link again.
      def create
        EmailVerificationsController.send_link(Current.user, app_url) unless Current.user.email_verified?
        head :accepted
      end

      def update
        user = User.find_by_token_for(:email_verification, params[:token].to_s)
        unless user
          return render_error(:invalid_token, "This link has expired. Sign in and ask for a new one.", status: :unprocessable_content)
        end

        user.update!(email_verified_at: Time.current) unless user.email_verified?
        head :no_content
      end

      def self.send_link(user, base_url)
        url = "#{base_url}/verify-email?#{{ token: user.generate_token_for(:email_verification) }.to_query}"
        AccountMailer.verify_email(user, url).deliver_later
      end
    end
  end
end
