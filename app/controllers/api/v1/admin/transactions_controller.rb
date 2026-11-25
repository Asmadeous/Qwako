module Api
  module V1
    module Admin
      # Every payment guests have made, filtered and a page at a time.
      class TransactionsController < ApplicationController
        include TransactionListing

        before_action :require_admin

        def index
          render_transactions(Payment.search(transaction_filters))
        end

        def export
          send_transactions_csv(Payment.search(transaction_filters), "tg-homes-transactions-#{Date.current}.csv")
        end
      end
    end
  end
end
