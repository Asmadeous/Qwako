module Api
  module V1
    module Admin
      # The owner writes newsletters, sends a test to themselves, then sends.
      class NewslettersController < ApplicationController
        before_action :require_admin
        before_action :set_newsletter, only: %i[show update destroy test deliver]
        before_action :refuse_if_sent, only: %i[update destroy deliver]

        def index
          newsletters = Newsletter.includes(:sent_by).order(Arel.sql("sent_at IS NULL DESC, sent_at DESC, updated_at DESC, id DESC"))
          rows, meta = page_of(newsletters, 25)
          render json: {
            newsletters: rows.map { |newsletter| row(newsletter) },
            **meta,
            audience: {
              total: Newsletter.recipient_emails.size,
              sign_ups: NewsletterSubscriber.confirmed.count,
              guests: User.kept.where.not(marketing_consent_at: nil).where.not(email_verified_at: nil).count
            }
          }
        end

        def show
          render json: { newsletter: row(@newsletter) }
        end

        def create
          newsletter = Newsletter.new(newsletter_params)
          return render_validation_errors(newsletter) unless newsletter.save

          render json: { newsletter: row(newsletter) }, status: :created
        end

        def update
          return render_validation_errors(@newsletter) unless @newsletter.update(newsletter_params)

          render json: { newsletter: row(@newsletter) }
        end

        def destroy
          @newsletter.destroy!
          head :no_content
        end

        # A copy to the signed-in team member, to check how it looks.
        def test
          NewsletterMailer.issue(@newsletter, Current.user.email).deliver_later
          render json: { email: Current.user.email }
        end

        def deliver
          if Newsletter.recipient_emails.empty?
            return render_error(:no_recipients, "Nobody has signed up for the newsletter yet.", status: :unprocessable_content)
          end

          @newsletter.update!(sent_at: Time.current, sent_by: Current.user)
          NewsletterDeliveryJob.perform_later(@newsletter)
          audit("send_newsletter", @newsletter, "Sent the newsletter \"#{@newsletter.subject}\"")
          render json: { newsletter: row(@newsletter) }
        end

        private
          def set_newsletter
            @newsletter = Newsletter.find(params[:id])
          end

          def refuse_if_sent
            return unless @newsletter.sent?

            render_error(:already_sent, "This newsletter has already been sent.", status: :unprocessable_content)
          end

          def newsletter_params
            raw = params[:newsletter]
            raw.is_a?(ActionController::Parameters) ? raw.permit(:subject, :body) : {}
          end

          def row(newsletter)
            newsletter.slice(:id, :subject, :body, :sent_at, :recipients_count, :created_at, :updated_at)
              .merge(sent_by: newsletter.sent_by&.name)
          end
      end
    end
  end
end
