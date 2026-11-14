module Api
  module V1
    class NotificationsController < ApplicationController
      def index
        notifications = Current.user.notifications.order(created_at: :desc).limit(50)
        render json: {
          notifications: notifications.map { |n| notification_json(n) },
          unread: Current.user.notifications.unread.count
        }
      end

      def read
        Current.user.notifications.find(params[:id]).update!(read_at: Time.current)
        head :no_content
      end

      def read_all
        Current.user.notifications.unread.update_all(read_at: Time.current)
        head :no_content
      end
    end
  end
end
