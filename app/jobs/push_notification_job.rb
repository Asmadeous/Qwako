# Sends a notification to the person's devices in the background.
class PushNotificationJob < ApplicationJob
  queue_as :default

  def perform(notification)
    Push.deliver(notification)
  end
end
