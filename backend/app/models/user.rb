class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :name, with: ->(name) { name.strip }

  validates :email, presence: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true },
    uniqueness: { message: "is already registered", allow_blank: true }
  validates :name, presence: true, length: { maximum: 100 }
  validates :password, length: { minimum: 8 }, allow_nil: true
end
