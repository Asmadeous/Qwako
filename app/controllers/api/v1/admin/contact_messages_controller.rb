module Api
  module V1
    module Admin
      # Messages from the public contact form.
      class ContactMessagesController < ApplicationController
        before_action :require_admin

        def index
          rows, next_page = paginate(ContactMessage.order(created_at: :desc), 50)
          render json: { contact_messages: rows.map { |c| c.slice(:id, :name, :email, :phone, :body, :handled_at, :created_at) }, next_page: }
        end

        def handle
          contact = ContactMessage.find(params[:id])
          contact.update!(handled_at: contact.handled_at ? nil : Time.current)
          render json: { contact_message: contact.slice(:id, :name, :email, :phone, :body, :handled_at, :created_at) }
        end
      end
    end
  end
end
