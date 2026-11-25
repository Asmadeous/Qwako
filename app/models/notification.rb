# One item in a person's notifications list (the bell).
class Notification < ApplicationRecord
  belongs_to :user

  scope :unread, -> { where(read_at: nil) }

  after_create_commit -> { NotificationsChannel.broadcast_to(user, { notification: id }) }
  after_create_commit -> { PushNotificationJob.perform_later(self) if user.push_subscriptions.exists? }
end
