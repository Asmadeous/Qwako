module Api
  module V1
    class SessionsController < ApplicationController
      allow_unauthenticated_access
      rate_limit to: 10, within: 3.minutes, only: :create, with: -> { render_rate_limited }

      def show
        render json: { user: authenticated? ? user_json(Current.user) : nil }
      end

      def create
        if (user = User.authenticate_by(email: params[:email].to_s, password: params[:password].to_s))
          start_new_session_for user
          render json: { user: user_json(user) }
        else
          render_error(:invalid_credentials, "Email or password is incorrect.", status: :unauthorized)
        end
      end

      def destroy
        resume_session
        terminate_session
        head :no_content
      end
    end
  end
end
