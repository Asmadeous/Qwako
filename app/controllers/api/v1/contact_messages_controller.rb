module Api
  module V1
    # The public contact form. Lands in the owner's inbox.
    class ContactMessagesController < ApplicationController
      allow_unauthenticated_access
      rate_limit to: 5, within: 10.minutes, with: -> { render_rate_limited }

      def create
        raw = params[:contact_message]
        attrs = raw.is_a?(ActionController::Parameters) ? raw.permit(:name, :email, :phone, :body) : {}
        contact = ContactMessage.new(attrs)
        if contact.save
          Notify.contact_message(contact)
          head :created
        else
          render_validation_errors contact
        end
      end
    end
  end
end
