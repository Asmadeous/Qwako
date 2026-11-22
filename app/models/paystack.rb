require "net/http"

# Minimal Paystack API client (https://paystack.com/docs/api/). Kenyan stays
# are paid in KES by M-Pesa or card on Paystack's hosted checkout page.
# The secret key comes from PAYSTACK_SECRET_KEY. Tests swap in a fake client.
module Paystack
  class Error < StandardError; end

  class << self
    attr_writer :client

    def client
      @client ||= Client.new(secret_key)
    end

    def secret_key
      ENV["PAYSTACK_SECRET_KEY"].to_s
    end

    # Webhooks are signed with HMAC-SHA512 of the raw body using the secret key.
    def valid_signature?(payload, signature)
      return false if secret_key.empty? || signature.blank?

      expected = OpenSSL::HMAC.hexdigest("SHA512", secret_key, payload)
      ActiveSupport::SecurityUtils.secure_compare(expected, signature)
    end
  end

  class Client
    HOST = "api.paystack.co"
    NETWORK_ERRORS = [ Net::OpenTimeout, Net::ReadTimeout, SocketError, SystemCallError, OpenSSL::SSL::SSLError ].freeze

    def initialize(secret_key)
      @secret_key = secret_key
    end

    # Returns data with "authorization_url", "access_code" and "reference".
    def initialize_transaction(email:, amount:, currency:, reference:, callback_url:, metadata: {})
      body = { email:, amount:, currency:, reference:, callback_url:, metadata:, channels: %w[card mobile_money] }
      request(Net::HTTP::Post.new("/transaction/initialize").tap { |req| req.body = body.to_json })
    end

    # Returns data with "status" ("success" once paid), "amount", "currency", "channel", "id".
    def verify_transaction(reference)
      request(Net::HTTP::Get.new("/transaction/verify/#{ERB::Util.url_encode(reference)}"))
    end

    # Refunds all or part (amount, in cents) of a transaction (its reference or id).
    def refund(transaction:, amount:)
      request(Net::HTTP::Post.new("/refund").tap { |req| req.body = { transaction:, amount: }.to_json })
    end

    private
      def request(req)
        raise Error, "Paystack is not configured." if @secret_key.empty?

        req["Authorization"] = "Bearer #{@secret_key}"
        req["Content-Type"] = "application/json"
        res = Net::HTTP.start(HOST, 443, use_ssl: true, open_timeout: 5, read_timeout: 20) { |http| http.request(req) }
        json = JSON.parse(res.body.to_s)
        raise Error, json["message"].presence || "Paystack request failed." unless res.is_a?(Net::HTTPSuccess) && json["status"]

        json["data"]
      rescue JSON::ParserError, *NETWORK_ERRORS => error
        raise Error, "Paystack could not be reached (#{error.class.name})."
      end
  end
end
