module Api
  module V1
    # A guest's messages with the owner: about a booking, or an enquiry about a home.
    class ConversationsController < ApplicationController
      include MessageParams
      rate_limit to: 20, within: 10.minutes, only: :create, with: -> { render_rate_limited }

      def index
        conversations = Current.user.conversations.includes(:guest, :listing, messages: { files_attachments: :blob })
          .order(last_message_at: :desc, id: :desc)
        # ?page= for the Messages page; without it all of them (for the overview).
        rows, meta = params[:page].present? ? page_of(conversations, 25) : [ conversations, {} ]
        render json: { conversations: rows.map { |c| conversation_json(c, Current.user) }, **meta }
      end

      def show
        conversation = Current.user.conversations.find(params[:id])
        conversation.mark_read_by!(Current.user)
        render json: {
          conversation: conversation_json(conversation, Current.user),
          messages: conversation.messages.includes(:sender, files_attachments: :blob).map { |m| message_json(m) }
        }
      end

      # Starts (or continues) the conversation about a booking or a home.
      def create
        conversation = find_or_build_conversation
        return if performed?

        message = build_message(conversation)
        return render_validation_errors(message) unless message.valid?

        conversation.save! if conversation.new_record?
        conversation.post!(Current.user, message.body, files: message_files)
        render json: { conversation: conversation_json(conversation.reload, Current.user) }, status: :created
      end

      private
        def find_or_build_conversation
          if params[:booking_id].present?
            booking = Current.user.bookings.find(params[:booking_id])
            booking.conversation || Conversation.new(guest: Current.user, booking:, listing: booking.listing,
              subject: "#{booking.listing.title}, #{I18n.l(booking.check_in, format: :stay)}", last_message_at: Time.current)
          elsif params[:listing_id].present?
            listing = Listing.published.kept.find(params[:listing_id])
            Current.user.conversations.where(booking_id: nil, listing:).first ||
              Conversation.new(guest: Current.user, listing:, subject: "Question about #{listing.title}", last_message_at: Time.current)
          else
            Current.user.conversations.where(booking_id: nil, listing_id: nil).first ||
              Conversation.new(guest: Current.user, subject: "Question for TG-Homes", last_message_at: Time.current)
          end
        end
    end
  end
end
