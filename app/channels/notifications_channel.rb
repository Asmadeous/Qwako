# Tells a signed-in person that their notifications changed.
class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end
end
