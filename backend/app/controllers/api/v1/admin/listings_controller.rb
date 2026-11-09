module Api
  module V1
    module Admin
      class ListingsController < ApplicationController
        before_action :require_admin

        def index
          listings = Listing.includes(:photos, :videos, :amenities).order(:created_at)
          render json: { listings: listings.map { |listing| listing_json(listing) } }
        end

        # For the edit form: says whether the home can still be deleted.
        def show
          listing = Listing.includes(:photos, :videos, :amenities).find(params[:id])
          render json: { listing: listing_json(listing).merge(has_bookings: listing.bookings.exists?) }
        end

        def create
          listing = Listing.new
          save(listing, status: :created)
        end

        def update
          save(Listing.find(params[:id]), status: :ok)
        end

        # Only a home nobody has booked can be deleted, so booking history and
        # payments always keep their home. Others can be unlisted instead.
        def destroy
          listing = Listing.find(params[:id])
          return head :no_content if listing.destroy

          render_error(:has_bookings, "This home has bookings, so it can't be deleted. Unlist it to hide it from guests.",
            status: :unprocessable_content)
        end

        private
          def save(listing, status:)
            Listing.transaction do
              listing.assign_attributes(listing_params)
              listing.save!
            end
            render json: { listing: listing_json(listing.reload) }, status:
          rescue ActiveRecord::RecordInvalid
            render_validation_errors listing
          end

          def listing_params
            raw = params[:listing]
            return {} unless raw.is_a?(ActionController::Parameters)

            raw.permit(
              :title, :address, :description, :house_rules, :max_guests, :nightly_price_cents,
              :cleaning_charge_cents, :status, :featured, photo_urls: [], video_urls: [], amenity_keys: []
            )
          end
      end
    end
  end
end
