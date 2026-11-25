require "test_helper"

class ApplicationCable::ConnectionTest < ActionCable::Connection::TestCase
  test "connects with a signed-in, confirmed account" do
    session = users(:ada).sessions.create!
    cookies.signed[:session_id] = session.id
    connect
    assert_equal users(:ada), connection.current_user
  end

  test "rejects visitors and unconfirmed accounts" do
    assert_reject_connection { connect }

    users(:ada).update!(email_verified_at: nil)
    cookies.signed[:session_id] = users(:ada).sessions.create!.id
    assert_reject_connection { connect }
  end
end
