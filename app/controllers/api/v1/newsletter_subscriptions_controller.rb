module Api
  module V1
    # The newsletter sign-up in the footer (double opt-in), and the confirm and
    # unsubscribe links in its emails.
    class NewsletterSubscriptionsController < ApplicationController
      allow_unauthenticated_access
      rate_limit to: 5, within: 10.minutes, only: :create, with: -> { render_rate_limited }

      # Always the same answer, so the form doesn't reveal who is subscribed.
      def create
        subscriber = NewsletterSubscriber.find_or_initialize_by(email: params[:email].to_s.strip.downcase)
        return render_validation_errors(subscriber) unless subscriber.valid?

        if subscriber.new_record? || subscriber.confirmed_at.nil? || subscriber.unsubscribed_at
          subscriber.save!
          NewsletterMailer.confirm(subscriber.email).deliver_later
        end
        head :accepted
      end

      def confirm
        email = Newsletter.email_from_token(params[:token], :confirm)
        return render_bad_link unless email

        NewsletterSubscriber.find_or_create_by!(email:).update!(confirmed_at: Time.current, unsubscribed_at: nil)
        head :no_content
      end

      # From the link in the email, or the mail app's own unsubscribe button.
      def unsubscribe
        email = Newsletter.email_from_token(params[:token], :unsubscribe)
        return render_bad_link unless email

        Newsletter.unsubscribe!(email)
        head :no_content
      end

      private
        def render_bad_link
          render_error(:invalid_token, "That link is invalid or has expired.", status: :unprocessable_content)
        end
    end
  end
end
