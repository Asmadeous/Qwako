module Api
  module V1
    module Admin
      # The team's inbox: every guest conversation. Deleting one is for the owner.
      class ConversationsController < ApplicationController
        include MessageParams
        before_action :require_team
        before_action :require_admin, only: :destroy

        # ?view=unread|all
        def index
          conversations = Conversation.includes(:guest, :listing, messages: { files_attachments: :blob }).order(last_message_at: :desc, id: :desc)
          conversations = conversations.where("owner_read_at IS NULL OR owner_read_at < last_message_at") if params[:view] == "unread"
          rows, meta = page_of(conversations, 25)
          render json: { conversations: rows.map { |c| conversation_json(c, Current.user) }, **meta }
        end

        # The team writes first to a guest: about a booking (?booking_id=), or
        # about anything (?guest_id= and a subject).
        def create
          conversation = params[:booking_id].present? ? booking_conversation : new_guest_conversation
          return render_validation_errors(conversation) unless conversation.valid?

          message = build_message(conversation)
          return render_validation_errors(message) unless message.valid?

          conversation.save! if conversation.new_record?
          conversation.post!(Current.user, message.body, files: message_files)
          render json: { conversation: conversation_json(conversation.reload, Current.user) }, status: :created
        end

        def show
          conversation = Conversation.find(params[:id])
          conversation.mark_read_by!(Current.user)
          render json: {
            conversation: conversation_json(conversation, Current.user).merge(guest_phone: conversation.guest.phone),
            messages: conversation.messages.includes(:sender, files_attachments: :blob).map { |m| message_json(m) }
          }
        end

        # Removes the conversation and its messages and files for good.
        def destroy
          conversation = Conversation.find(params[:id])
          conversation.destroy!
          audit("delete_conversation", conversation, "Deleted the conversation \"#{conversation.subject}\" with #{conversation.guest.name}")
          head :no_content
        end

        private
          def booking_conversation
            booking = Booking.find(params[:booking_id])
            booking.conversation || Conversation.new(
              guest: booking.guest, booking:, listing: booking.listing, last_message_at: Time.current,
              subject: "#{booking.listing.title}, #{I18n.l(booking.check_in, format: :stay)}"
            )
          end

          def new_guest_conversation
            guest = User.guest.kept.find(params[:guest_id])
            Conversation.new(guest:, subject: params[:subject].to_s.strip, last_message_at: Time.current)
          end
      end
    end
  end
end
