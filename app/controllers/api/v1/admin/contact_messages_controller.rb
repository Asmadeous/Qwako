module Api
  module V1
    module Admin
      # Messages from the public contact form.
      class ContactMessagesController < ApplicationController
        before_action :require_team
        before_action :require_admin, only: :destroy

        def index
          rows, meta = page_of(ContactMessage.order(created_at: :desc, id: :desc), 25)
          render json: { contact_messages: rows.map { |c| c.slice(:id, :name, :email, :phone, :body, :handled_at, :created_at) }, **meta }
        end

        def handle
          contact = ContactMessage.find(params[:id])
          contact.update!(handled_at: contact.handled_at ? nil : Time.current)
          render json: { contact_message: contact.slice(:id, :name, :email, :phone, :body, :handled_at, :created_at) }
        end

        def destroy
          contact = ContactMessage.find(params[:id])
          contact.destroy!
          audit("delete_contact_message", contact, "Deleted a contact form message from #{contact.name} (#{contact.email})")
          head :no_content
        end
      end
    end
  end
end
