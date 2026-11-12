module Api
  module V1
    class ListingsController < ApplicationController
      allow_unauthenticated_access

      def index
        listings = Listing.published.kept.matching(params[:q]).includes(:photos, :videos, :amenities, :category).order(:created_at)
        render json: { listings: listings.map { |listing| listing_json(listing) } }
      end

      def show
        resume_session
        scope = Current.user&.admin? ? Listing.all : Listing.published.kept
        render json: { listing: listing_json(scope.includes(:photos, :videos, :amenities, :category).find(params[:id])) }
      end
    end
  end
end
