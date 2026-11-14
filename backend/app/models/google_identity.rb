require "net/http"

# Checks a Google Sign-In ID token with Google's tokeninfo endpoint. Needs
# GOOGLE_CLIENT_ID (the same one the website uses). Tests swap in a fake.
module GoogleIdentity
  class NotConfigured < StandardError; end

  ISSUERS = %w[accounts.google.com https://accounts.google.com].freeze

  class << self
    attr_writer :fetcher

    def client_id = ENV["GOOGLE_CLIENT_ID"].to_s

    # Returns { uid:, email:, name: } for a valid token, otherwise nil.
    def verify(id_token)
      raise NotConfigured if client_id.empty?
      return nil if id_token.blank?

      info = fetcher.call(id_token)
      return nil unless info && info["aud"] == client_id && info["iss"].in?(ISSUERS) && info["email_verified"].to_s == "true"
      return nil if info["exp"].to_i < Time.now.to_i

      { uid: info["sub"].to_s, email: info["email"].to_s.downcase, name: info["name"].to_s }
    end

    def fetcher
      @fetcher ||= lambda do |token|
        uri = URI("https://oauth2.googleapis.com/tokeninfo?#{{ id_token: token }.to_query}")
        res = Net::HTTP.get_response(uri)
        res.is_a?(Net::HTTPSuccess) ? JSON.parse(res.body) : nil
      rescue JSON::ParserError, SocketError, SystemCallError, Net::OpenTimeout, Net::ReadTimeout
        nil
      end
    end
  end
end
