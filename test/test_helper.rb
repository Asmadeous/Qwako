ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require_relative "test_helpers"

# Webhook signatures are checked against this key; no request leaves the test.
ENV["PAYSTACK_SECRET_KEY"] = "sk_test_tgbnb"

# Push notifications are signed with this pair; no push leaves the test.
require "web-push"
vapid = WebPush.generate_key
ENV["VAPID_PUBLIC_KEY"] = vapid.public_key
ENV["VAPID_PRIVATE_KEY"] = vapid.private_key

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end

module ActionDispatch
  class IntegrationTest
    include ApiTestHelpers

    # Rate-limit counters live in Rails.cache; start each test from zero.
    setup do
      Rails.cache.clear
      Paystack.client = FakePaystack.new
    end
    teardown { Paystack.client = nil }
  end
end
