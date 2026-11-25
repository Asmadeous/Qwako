# One browser or phone that receives push notifications for a person.
class PushSubscription < ApplicationRecord
  belongs_to :user

  validates :endpoint, presence: true, format: { with: %r{\Ahttps://\S+\z}, message: "must be an https address" },
    length: { maximum: 2000 }
  validates :p256dh, :auth, presence: true, length: { maximum: 200 }
end
