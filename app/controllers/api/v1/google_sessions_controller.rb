module Api
  module V1
    # "Continue with Google": the browser gets an ID token from Google and the
    # server checks it with Google before signing the person in. New people
    # become guests.
    class GoogleSessionsController < ApplicationController
      allow_unauthenticated_access
      rate_limit to: 10, within: 3.minutes, with: -> { render_rate_limited }

      def create
        profile = GoogleIdentity.verify(params[:credential].to_s)
        return render_error(:invalid_credentials, "Google sign-in didn't work. Try again.", status: :unauthorized) unless profile

        user = User.kept.find_by(google_uid: profile[:uid]) || User.kept.find_by(email: profile[:email])
        user ||= User.new(email: profile[:email], name: profile[:name].presence || profile[:email].split("@").first,
                          password: SecureRandom.base58(24))
        user.google_uid ||= profile[:uid]
        user.email_verified_at ||= Time.current
        user.save!
        start_new_session_for user
        render json: { user: user_json(user) }
      rescue GoogleIdentity::NotConfigured
        render_error(:not_configured, "Google sign-in isn't set up on this site.", status: :service_unavailable)
      end
    end
  end
end
