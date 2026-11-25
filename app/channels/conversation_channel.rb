# New messages in one conversation, for its guest and the owner's team.
class ConversationChannel < ApplicationCable::Channel
  def subscribed
    conversation = Conversation.find_by(id: params[:id])
    return reject unless conversation && (current_user.team? || conversation.guest_id == current_user.id)

    stream_for conversation
  end
end
