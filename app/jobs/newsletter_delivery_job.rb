# Sends a newsletter to each recipient, one email per person so nobody sees
# anyone else's address. A failure for one address doesn't stop the rest.
class NewsletterDeliveryJob < ApplicationJob
  queue_as :default

  def perform(newsletter)
    sent = 0
    Newsletter.recipient_emails.each do |email|
      NewsletterMailer.issue(newsletter, email).deliver_now
      sent += 1
    rescue StandardError => error
      Rails.logger.error("Newsletter #{newsletter.id} to one recipient failed: #{error.class}: #{error.message}")
    end
    newsletter.update_columns(recipients_count: sent, updated_at: Time.current)
  end
end
