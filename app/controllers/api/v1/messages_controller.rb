module Api
  module V1
    class MessagesController < ApplicationController
      include MessageParams
      rate_limit to: 30, within: 10.minutes, with: -> { render_rate_limited }

      def create
        conversation = Current.user.conversations.find(params[:conversation_id])
        message = build_message(conversation)
        return render_validation_errors(message) unless message.valid?

        render json: { message: message_json(conversation.post!(Current.user, message.body, files: message_files)) }, status: :created
      end
    end
  end
end
