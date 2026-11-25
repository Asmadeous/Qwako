module Api
  module V1
    module Admin
      # Who gets the newsletter: footer sign-ups and guests who opted in.
      # Adding someone sends them the confirmation email (they must agree
      # themselves); removing someone stops their newsletters.
      class NewsletterSubscribersController < ApplicationController
        before_action :require_admin

        def index
          guests = User.kept.where.not(marketing_consent_at: nil).where.not(email_verified_at: nil)
            .pluck(:email, :name, :marketing_consent_at)
          signups = NewsletterSubscriber.order(created_at: :desc).map { |subscriber| signup_row(subscriber) }
          guest_rows = guests.map { |email, name, since| { id: nil, email:, name:, status: "subscribed", source: "guest account", since: } }
          rows = signups + guest_rows.reject { |row| signups.any? { |signup| signup[:email] == row[:email] } }
          page, meta = page_of(rows.sort_by { |row| row[:since] || Time.at(0) }.reverse, 25)
          render json: { subscribers: page, **meta }
        end

        def create
          subscriber = NewsletterSubscriber.find_or_initialize_by(email: params[:email].to_s.strip.downcase)
          return render_validation_errors(subscriber) unless subscriber.valid?

          if subscriber.confirmed_at && subscriber.unsubscribed_at.nil?
            subscriber.errors.add(:email, "is already subscribed")
            return render_validation_errors(subscriber)
          end

          subscriber.save!
          NewsletterMailer.confirm(subscriber.email).deliver_later
          audit("invite_subscriber", subscriber, "Sent a newsletter confirmation email to #{subscriber.email}")
          render json: { subscriber: signup_row(subscriber) }, status: :created
        end

        # :id is the email address, so guests who opted in can be removed too.
        def destroy
          email = params[:id].to_s.strip.downcase
          found = NewsletterSubscriber.where(email:).exists? || User.where(email:).where.not(marketing_consent_at: nil).exists?
          raise ActiveRecord::RecordNotFound unless found

          Newsletter.unsubscribe!(email)
          NewsletterSubscriber.where(email:).delete_all
          audit("remove_subscriber", nil, "Removed #{email} from the newsletter")
          head :no_content
        end

        private
          def signup_row(subscriber)
            status = if subscriber.unsubscribed_at then "unsubscribed"
            elsif subscriber.confirmed_at then "subscribed"
            else "waiting for confirmation"
            end
            { id: subscriber.id, email: subscriber.email, name: nil, status:, source: "website sign-up",
              since: subscriber.confirmed_at || subscriber.created_at }
          end
      end
    end
  end
end
