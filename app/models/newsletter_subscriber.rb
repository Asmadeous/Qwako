# Someone who signed up for the newsletter from the website footer. They are
# only sent anything after clicking the link in the confirmation email.
class NewsletterSubscriber < ApplicationRecord
  normalizes :email, with: ->(email) { email.strip.downcase }
  validates :email, presence: true, length: { maximum: 254 }, format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true },
    uniqueness: true

  scope :confirmed, -> { where.not(confirmed_at: nil).where(unsubscribed_at: nil) }
end
