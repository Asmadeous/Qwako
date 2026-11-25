class NewsletterMailer < ApplicationMailer
  def issue(newsletter, email)
    @newsletter = newsletter
    token = Newsletter.token_for(email, :unsubscribe)
    @unsubscribe_url = "#{Notify.app_url}/newsletter/unsubscribe?#{{ token: }.to_query}"
    # One-click unsubscribe from the mail app (RFC 8058).
    headers["List-Unsubscribe"] = "<#{Notify.app_url}/api/v1/newsletter_subscription/unsubscribe?#{{ token: }.to_query}>"
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
    mail to: email, subject: newsletter.subject
  end

  def confirm(email)
    @confirm_url = "#{Notify.app_url}/newsletter/confirm?#{{ token: Newsletter.token_for(email, :confirm) }.to_query}"
    mail to: email, subject: "Confirm your newsletter sign-up | TG Homes"
  end
end
