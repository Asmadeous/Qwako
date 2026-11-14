# A message sent from the public contact form.
class ContactMessage < ApplicationRecord
  normalizes :name, :email, :phone, :body, with: ->(value) { value.strip }

  validates :name, presence: true, length: { maximum: 100 }
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true }
  validates :phone, length: { maximum: 30 }
  validates :body, presence: true, length: { maximum: 4000 }
end
