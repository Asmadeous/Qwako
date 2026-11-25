# One newsletter the owner writes and sends to everyone who agreed to get it:
# confirmed footer sign-ups and guests who turned on "offers and news".
class Newsletter < ApplicationRecord
  belongs_to :sent_by, class_name: "User", optional: true

  normalizes :subject, with: ->(subject) { subject.strip }
  validates :subject, presence: true, length: { maximum: 150 }
  validates :body, presence: true, length: { maximum: 20_000 }

  scope :drafts, -> { where(sent_at: nil) }

  def sent? = sent_at.present?

  # Every address to send to, once each.
  def self.recipient_emails
    guests = User.kept.where.not(marketing_consent_at: nil).where.not(email_verified_at: nil).pluck(:email)
    (NewsletterSubscriber.confirmed.pluck(:email) + guests).uniq
  end

  # Links in emails carry a signed token of the address, so nobody can confirm
  # or unsubscribe someone else.
  def self.token_for(email, purpose)
    expires_in = purpose == :confirm ? 3.days : nil
    verifier.generate(email, purpose:, expires_in:)
  end

  def self.email_from_token(token, purpose)
    verifier.verified(token.to_s, purpose:)
  end

  def self.verifier = Rails.application.message_verifier("newsletter")

  def self.unsubscribe!(email)
    NewsletterSubscriber.where(email:).update_all(unsubscribed_at: Time.current, updated_at: Time.current)
    User.where(email:).update_all(marketing_consent_at: nil, updated_at: Time.current)
  end

  # Paragraphs separated by a blank line, for the email.
  def paragraphs = body.split(/\n\s*\n/).map(&:strip).reject(&:blank?)
end
