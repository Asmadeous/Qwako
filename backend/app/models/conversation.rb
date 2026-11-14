# Messages between one guest and the owner's team, about a booking or a home.
class Conversation < ApplicationRecord
  belongs_to :guest, class_name: "User"
  belongs_to :listing, optional: true
  belongs_to :booking, optional: true
  has_many :messages, -> { order(:created_at) }, dependent: :delete_all, inverse_of: :conversation

  validates :subject, presence: true, length: { maximum: 160 }

  def unread_for?(user)
    read_at = user.admin? ? owner_read_at : guest_read_at
    read_at.nil? || read_at < last_message_at
  end

  def mark_read_by!(user)
    update_columns(user.admin? ? { owner_read_at: Time.current } : { guest_read_at: Time.current })
  end

  # Adds a message and tells the other side.
  def post!(sender, body)
    message = transaction do
      msg = messages.create!(sender:, body:)
      update!(last_message_at: msg.created_at, **(sender.admin? ? { owner_read_at: msg.created_at } : { guest_read_at: msg.created_at }))
      msg
    end
    Notify.new_message(message)
    message
  end
end
