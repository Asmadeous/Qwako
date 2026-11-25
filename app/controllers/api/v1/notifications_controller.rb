module Api
  module V1
    class NotificationsController < ApplicationController
      def index
        rows, meta = page_of(Current.user.notifications.order(created_at: :desc, id: :desc), 25)
        render json: {
          notifications: rows.map { |n| notification_json(n) },
          unread: Current.user.notifications.unread.count,
          **meta
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
