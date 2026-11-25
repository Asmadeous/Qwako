require "web-push"

# Web Push: notifications that reach a person's browser or phone even when the
# site isn't open. Signed with a VAPID key pair from VAPID_PUBLIC_KEY and
# VAPID_PRIVATE_KEY; outside production a pair is made once in tmp/.
module Push
  NETWORK_ERRORS = [ Net::OpenTimeout, Net::ReadTimeout, SocketError, SystemCallError, OpenSSL::SSL::SSLError ].freeze

  module_function

  def public_key = keys[:public_key]

  def enabled? = keys.present?

  def keys
    @keys ||= if ENV["VAPID_PUBLIC_KEY"].present? && ENV["VAPID_PRIVATE_KEY"].present?
      { public_key: ENV["VAPID_PUBLIC_KEY"], private_key: ENV["VAPID_PRIVATE_KEY"] }
    elsif !Rails.env.production?
      development_keys
    end
  end

  def development_keys
    path = Rails.root.join("tmp/vapid_keys.json")
    return JSON.parse(path.read, symbolize_names: true) if path.exist?

    key = WebPush.generate_key
    { public_key: key.public_key, private_key: key.private_key }.tap { |pair| path.write(pair.to_json) }
  end

  # Sends one notification to every device the person turned push on for.
  # Devices the push service says are gone are forgotten.
  def deliver(notification)
    return unless enabled?

    message = { title: notification.title, body: notification.body, url: notification.url.presence || "/account" }.to_json
    notification.user.push_subscriptions.find_each do |subscription|
      WebPush.payload_send(
        message:, endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth, ttl: 1.day.to_i,
        urgency: "normal", vapid: { subject: vapid_subject, **keys }
      )
    rescue WebPush::ExpiredSubscription, WebPush::InvalidSubscription, WebPush::Unauthorized
      subscription.destroy
    rescue WebPush::Error, *NETWORK_ERRORS => error
      Rails.logger.warn("Push to #{subscription.id} failed: #{error.class}")
    end
  end

  def vapid_subject
    from = ENV["MAIL_FROM"].to_s[/[^<\s]+@[^>\s]+/]
    from ? "mailto:#{from}" : (ENV["APP_URL"].presence || "mailto:owner@example.com")
  end
end
