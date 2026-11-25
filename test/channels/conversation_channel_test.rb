require "test_helper"

class ConversationChannelTest < ActionCable::Channel::TestCase
  setup do
    @conversation = Conversation.create!(guest: users(:ada), subject: "Question", last_message_at: Time.current)
  end

  test "the guest and the owner's team can follow a conversation" do
    stub_connection current_user: users(:ada)
    subscribe id: @conversation.id
    assert subscription.confirmed?
    assert_has_stream_for @conversation

    stub_connection current_user: users(:owner)
    subscribe id: @conversation.id
    assert subscription.confirmed?
  end

  test "another guest cannot follow it" do
    stub_connection current_user: users(:grace)
    subscribe id: @conversation.id
    assert subscription.rejected?
  end

  test "a new message is broadcast to the conversation, and a notification to the other side" do
    assert_broadcasts(ConversationChannel.broadcasting_for(@conversation), 1) do
      assert_broadcasts(NotificationsChannel.broadcasting_for(users(:owner)), 1) do
        @conversation.post!(users(:ada), "Is parking free?")
      end
    end
  end
end
