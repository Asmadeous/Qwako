module Api
  module V1
    module Admin
      class MessagesController < ApplicationController
        include MessageParams
        before_action :require_team

        def create
          conversation = Conversation.find(params[:conversation_id])
          message = build_message(conversation)
          return render_validation_errors(message) unless message.valid?

          render json: { message: message_json(conversation.post!(Current.user, message.body, files: message_files)) }, status: :created
        end
      end
    end
  end
end
