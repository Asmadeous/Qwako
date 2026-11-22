module Api
  module V1
    # A guest reviews their own stay once it has ended.
    class ReviewsController < ApplicationController
      rate_limit to: 10, within: 10.minutes, with: -> { render_rate_limited }

      def create
        booking = Current.user.bookings.find(params[:booking_id])
        review = booking.build_review(listing: booking.listing, author: Current.user,
                                      rating: params[:rating], comment: params[:comment].to_s)
        if review.save
          Notify.new_review(review)
          render json: { review: review_json(review) }, status: :created
        else
          render_validation_errors review
        end
      end
    end
  end
end
