module Api
  module V1
    # Turning push notifications on and off for this browser or phone.
    class PushSubscriptionsController < ApplicationController
      rate_limit to: 20, within: 10.minutes, only: :create, with: -> { render_rate_limited }

      # The public key the browser needs to subscribe.
      def show
        render json: { enabled: Push.enabled?, public_key: Push.public_key }
      end

      def create
        return render_error(:push_unavailable, "Push notifications aren't set up yet.", status: :service_unavailable) unless Push.enabled?

        keys = params[:keys].is_a?(ActionController::Parameters) ? params[:keys] : {}
        subscription = PushSubscription.find_or_initialize_by(endpoint: params[:endpoint].to_s)
        subscription.assign_attributes(user: Current.user, p256dh: keys[:p256dh].to_s, auth: keys[:auth].to_s,
          user_agent: request.user_agent.to_s.first(255))
        return render_validation_errors(subscription) unless subscription.save

        head :created
      end

      def destroy
        Current.user.push_subscriptions.where(endpoint: params[:endpoint].to_s).delete_all
        head :no_content
      end
    end
  end
end
