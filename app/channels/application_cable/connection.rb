module ApplicationCable
  # The websocket signs in with the same session cookie as the API. Only
  # confirmed, open accounts can connect.
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user || reject_unauthorized_connection
    end

    private
      def find_verified_user
        id = cookies.signed[:session_id]
        user = Session.includes(:user).find_by(id:)&.user if id
        user if user&.email_verified? && !user.deleted?
      end
  end
end
