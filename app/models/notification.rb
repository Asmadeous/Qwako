# One item in a person's notifications list (the bell).
class Notification < ApplicationRecord
  belongs_to :user

  scope :unread, -> { where(read_at: nil) }
end
