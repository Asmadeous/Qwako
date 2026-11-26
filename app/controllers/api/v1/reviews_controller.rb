module Api
  module V1
    # The newest guest reviews of the published homes, for the home page; and a
    # guest reviews their own stay once it has ended.
    class ReviewsController < ApplicationController
      LATEST = 6

      allow_unauthenticated_access only: :index
      rate_limit to: 10, within: 10.minutes, only: :create, with: -> { render_rate_limited }

      def index
        reviews = Review.visible.joins(:listing).merge(Listing.published.kept)
          .includes(:author, :listing).order(created_at: :desc, id: :desc).limit(LATEST)
        render json: { reviews: reviews.map { |review| review_json(review).merge(listing_title: review.listing.title) } }
      end

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
