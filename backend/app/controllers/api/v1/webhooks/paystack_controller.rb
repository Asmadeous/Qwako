module Api
  module V1
    module Webhooks
      # Paystack calls this after a charge, even if the guest never returns to
      # the site. Only signed requests are processed.
      class PaystackController < ApplicationController
        allow_unauthenticated_access

        def create
          return head(:unauthorized) unless Paystack.valid_signature?(request.raw_post, request.headers["X-Paystack-Signature"])

          event = JSON.parse(request.raw_post)
          if event["event"] == "charge.success"
            Payment.find_by(reference: event.dig("data", "reference"))&.settle!(event["data"])
          end
          head :ok
        rescue JSON::ParserError
          head :bad_request
        end
      end
    end
  end
end
