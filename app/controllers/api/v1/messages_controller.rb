module Api
  module V1
    class MessagesController < ApplicationController
      rate_limit to: 30, within: 10.minutes, with: -> { render_rate_limited }

      def create
        conversation = Current.user.conversations.find(params[:conversation_id])
        message = Message.new(conversation:, sender: Current.user, body: params[:body].to_s)
        return render_validation_errors(message) unless message.valid?

        render json: { message: message_json(conversation.post!(Current.user, message.body)) }, status: :created
      end
    end
  end
end
