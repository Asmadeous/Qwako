module Api
  module V1
    module Admin
      # Guest reviews. The team replies; hiding or deleting one that breaks
      # the rules is for the owner. Reviews are only written by guests.
      class ReviewsController < ApplicationController
        before_action :require_team
        before_action :require_admin, only: :destroy

        def index
          rows, meta = page_of(Review.includes(:author, :listing).order(created_at: :desc, id: :desc), 20)
          render json: { reviews: rows.map { |r| row(r) }, **meta }
        end

        def update
          review = Review.find(params[:id])
          review.owner_reply = params[:owner_reply].to_s.presence if params.key?(:owner_reply)
          if params.key?(:hidden)
            return require_admin unless Current.user.admin?

            review.hidden = ActiveModel::Type::Boolean.new.cast(params[:hidden])
          end
          return render_validation_errors(review) unless review.save

          verb = if review.saved_change_to_hidden?
            review.hidden? ? "Hid" : "Showed again"
          else
            "Replied to"
          end
          audit("update_review", review, "#{verb} #{review.author.name}'s review of #{review.listing.title}")
          render json: { review: row(review) }
        end

        def destroy
          review = Review.find(params[:id])
          review.destroy!
          audit("delete_review", review, "Deleted #{review.author.name}'s #{review.rating}/5 review of #{review.listing.title}")
          head :no_content
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
