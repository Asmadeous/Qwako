module Api
  module V1
    class ProfilesController < ApplicationController
      def update
        user = Current.user
        return render_wrong_password(user) if changing_password? && !user.authenticate(params[:current_password].to_s)

        user.assign_attributes(profile_params)
        if user.save
          render json: { user: user_json(user) }
        else
          render_validation_errors user
        end
      end

      private
        def changing_password?
          params[:password].present?
        end

        def profile_params
          attrs = params.permit(:name, :avatar).to_h.symbolize_keys
          attrs[:password] = params[:password] if changing_password?
          attrs
        end

        def render_wrong_password(user)
          user.errors.add(:current_password, "is incorrect")
          render_validation_errors user
        end
    end
  end
end
