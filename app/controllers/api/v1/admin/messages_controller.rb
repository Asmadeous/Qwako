module Api
  module V1
    module Admin
      class MessagesController < ApplicationController
        before_action :require_admin

        def create
          conversation = Conversation.find(params[:conversation_id])
          message = Message.new(conversation:, sender: Current.user, body: params[:body].to_s)
          return render_validation_errors(message) unless message.valid?

          render json: { message: message_json(conversation.post!(Current.user, message.body)) }, status: :created
        end
      end
    end
  end
end
