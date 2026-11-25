require "test_helper"

class Api::V1::MessageFilesTest < ActionDispatch::IntegrationTest
  setup do
    @conversation = Conversation.create!(guest: users(:ada), listing: listings(:loft), subject: "Question", last_message_at: Time.current)
  end

  test "a guest sends files with or without text, and the owner downloads them" do
    sign_in_as users(:ada)
    post api_v1_conversation_messages_path(@conversation), params: {
      body: "", files: [ fixture_file_upload("notes.txt", "text/plain"), fixture_file_upload("photo.png", "image/png") ]
    }
    assert_response :created
    files = response.parsed_body.dig("message", "files")
    assert_equal %w[notes.txt photo.png], files.map { |f| f["name"] }
    assert_nil files.first["preview_url"]
    assert files.last["preview_url"]
    assert_equal "Sent 2 files", users(:owner).notifications.order(:created_at).last.body

    get files.first["url"]
    assert_response :redirect
    follow_redirect!
    assert_match(/\Aattachment/, response.headers["Content-Disposition"])

    delete api_v1_session_path
    sign_in_as users(:owner)
    get files.first["url"]
    assert_response :redirect
    follow_redirect!
    assert_equal File.read(file_fixture("notes.txt")), response.body
  end

  test "another guest can't open the files" do
    sign_in_as users(:ada)
    post api_v1_conversation_messages_path(@conversation), params: { files: [ fixture_file_upload("notes.txt", "text/plain") ] }
    url = response.parsed_body.dig("message", "files", 0, "url")

    delete api_v1_session_path
    sign_in_as users(:grace)
    get url
    assert_response :not_found
  end

  test "a message needs text or a file, and at most ten files" do
    sign_in_as users(:ada)
    post api_v1_conversation_messages_path(@conversation), params: { body: " " }
    assert_response :unprocessable_content

    post api_v1_conversation_messages_path(@conversation), params: { files: Array.new(11) { fixture_file_upload("notes.txt", "text/plain") } }
    assert_response :unprocessable_content
  end
end
