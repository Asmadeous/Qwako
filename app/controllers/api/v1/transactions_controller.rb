module Api
  module V1
    # A guest's own payments and refunds across all their bookings.
    class TransactionsController < ApplicationController
      include TransactionListing

      def index
        render_transactions(Payment.search(transaction_filters.except(:listing_id)).where(bookings: { guest_id: Current.user.id }))
      end
    end
  end
end
