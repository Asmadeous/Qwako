module Api
  module V1
    module Admin
      # Guest reviews: reply, or hide one that breaks the rules.
      class ReviewsController < ApplicationController
        before_action :require_admin

        def index
          rows, next_page = paginate(Review.includes(:author, :listing).order(created_at: :desc), 50)
          render json: { reviews: rows.map { |r| row(r) }, next_page: }
        end

        def update
          review = Review.find(params[:id])
          review.owner_reply = params[:owner_reply].to_s.presence if params.key?(:owner_reply)
          review.hidden = ActiveModel::Type::Boolean.new.cast(params[:hidden]) if params.key?(:hidden)
          return render_validation_errors(review) unless review.save

          verb = if review.saved_change_to_hidden?
            review.hidden? ? "Hid" : "Showed again"
          else
            "Replied to"
          end
          audit("update_review", review, "#{verb} #{review.author.name}'s review of #{review.listing.title}")
          render json: { review: row(review) }
        end

        private
          def row(review)
            review_json(review).merge(author_name: review.author.name, listing_title: review.listing.title,
                                      booking_id: review.booking_id)
          end
      end
    end
  end
end
