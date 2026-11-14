class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender, class_name: "User"

  normalizes :body, with: ->(body) { body.strip }
  validates :body, presence: true, length: { maximum: 4000 }
end
