module Api
  module V1
    class RegistrationsController < ApplicationController
      allow_unauthenticated_access
      rate_limit to: 10, within: 3.minutes, only: :create, with: -> { render_rate_limited }

      def create
        user = User.new(registration_params)

        if save_user(user)
          EmailVerificationsController.send_link(user, app_url, welcome: true)
          render json: { email: user.email }, status: :created
        else
          render_validation_errors user
        end
      end

      private
        def registration_params
          raw = params[:user]
          raw.is_a?(ActionController::Parameters) ? raw.permit(:name, :email, :password, :phone) : {}
        end

        # The uniqueness validation can lose a race with a concurrent sign-up;
        # the unique index is the final word.
        def save_user(user)
          user.save(context: %i[create registration])
        rescue ActiveRecord::RecordNotUnique
          user.errors.add(:email, "is already registered")
          false
        end
    end
  end
end
