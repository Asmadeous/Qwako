require "test_helper"

class Api::V1::PushSubscriptionsTest < ActionDispatch::IntegrationTest
  ENDPOINT = "https://fcm.googleapis.com/fcm/send/device-1".freeze
  KEYS = { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" }.freeze

  test "a signed-in person turns push on and off for a device" do
    sign_in_as users(:ada)

    get api_v1_push_subscription_path
    assert_response :ok
    assert response.parsed_body["enabled"]
    assert_equal ENV["VAPID_PUBLIC_KEY"], response.parsed_body["public_key"]

    post api_v1_push_subscription_path, params: { endpoint: ENDPOINT, keys: KEYS }, as: :json
    assert_response :created
    assert_equal [ ENDPOINT ], users(:ada).push_subscriptions.pluck(:endpoint)

    # Subscribing the same device again doesn't add a second row.
    post api_v1_push_subscription_path, params: { endpoint: ENDPOINT, keys: KEYS }, as: :json
    assert_equal 1, users(:ada).push_subscriptions.count

    delete api_v1_push_subscription_path, params: { endpoint: ENDPOINT }, as: :json
    assert_response :no_content
    assert_empty users(:ada).push_subscriptions
  end

  test "a device address must be https and keys are required" do
    sign_in_as users(:ada)
    post api_v1_push_subscription_path, params: { endpoint: "http://example.com/x", keys: {} }, as: :json
    assert_response :unprocessable_content
  end

  test "visitors can't subscribe" do
    post api_v1_push_subscription_path, params: { endpoint: ENDPOINT, keys: KEYS }, as: :json
    assert_response :unauthorized
  end

  test "a new notification is pushed to each device, and gone devices are forgotten" do
    user = users(:ada)
    live = user.push_subscriptions.create!(endpoint: ENDPOINT, **KEYS)
    gone = user.push_subscriptions.create!(endpoint: "#{ENDPOINT}-old", **KEYS)
    sent = []
    fake = lambda do |message:, endpoint:, **|
      sent << [ endpoint, JSON.parse(message) ]
      raise WebPush::ExpiredSubscription.new(Struct.new(:body).new(""), "fcm.googleapis.com") if endpoint == gone.endpoint
    end

    with_push(fake) do
      notification = user.notifications.create!(kind: "message", title: "New message", body: "Hello", url: "/account/messages")
      perform_enqueued_jobs { PushNotificationJob.perform_later(notification) }
    end

    assert_equal [ live.endpoint, gone.endpoint ].sort, sent.map(&:first).sort
    assert_equal({ "title" => "New message", "body" => "Hello", "url" => "/account/messages" }, sent.first.last)
    assert_equal [ live.id ], user.push_subscriptions.reload.ids
  end

  private
    def with_push(fake)
      original = WebPush.method(:payload_send)
      WebPush.define_singleton_method(:payload_send, &fake)
      yield
    ensure
      WebPush.define_singleton_method(:payload_send, original)
    end
end
