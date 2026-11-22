module Api
  module V1
    # The guest's saved homes (hearts).
    class SavedListingsController < ApplicationController
      def index
        listings = Current.user.saved_homes.published.kept.includes(:photos, :videos, :amenities, :category)
          .order("saved_listings.created_at DESC")
        render json: { listings: listings.map { |listing| listing_json(listing) } }
      end

      def create
        listing = Listing.published.kept.find(params[:listing_id])
        Current.user.saved_listings.find_or_create_by!(listing:)
        head :created
      rescue ActiveRecord::RecordNotUnique
        head :created
      end

      def destroy
        Current.user.saved_listings.where(listing_id: params[:listing_id]).delete_all
        head :no_content
      end
    end
  end
end
