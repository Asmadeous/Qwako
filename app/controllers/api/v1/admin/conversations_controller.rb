module Api
  module V1
    module Admin
      # The owner's inbox: every guest conversation.
      class ConversationsController < ApplicationController
        before_action :require_admin

        # ?view=unread|all
        def index
          conversations = Conversation.includes(:guest, :listing, :messages).order(last_message_at: :desc)
          conversations = conversations.where("owner_read_at IS NULL OR owner_read_at < last_message_at") if params[:view] == "unread"
          rows, next_page = paginate(conversations, 50)
          render json: { conversations: rows.map { |c| conversation_json(c, Current.user) }, next_page: }
        end

        # The owner writes first to a guest about their booking.
        def create
          booking = Booking.find(params[:booking_id])
          conversation = booking.conversation || Conversation.new(
            guest: booking.guest, booking:, listing: booking.listing, last_message_at: Time.current,
            subject: "#{booking.listing.title}, #{I18n.l(booking.check_in, format: :stay)}"
          )
          message = Message.new(conversation:, sender: Current.user, body: params[:body].to_s)
          return render_validation_errors(message) unless message.valid?

          conversation.save! if conversation.new_record?
          conversation.post!(Current.user, message.body)
          render json: { conversation: conversation_json(conversation.reload, Current.user) }, status: :created
        end

        def show
          conversation = Conversation.find(params[:id])
          conversation.mark_read_by!(Current.user)
          render json: {
            conversation: conversation_json(conversation, Current.user).merge(guest_phone: conversation.guest.phone),
            messages: conversation.messages.includes(:sender).map { |m| message_json(m) }
          }
        end
      end
    end
  end
end
