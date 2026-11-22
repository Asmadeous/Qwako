module Api
  module V1
    class ListingsController < ApplicationController
      PER_PAGE = 24

      allow_unauthenticated_access

      # ?q= place or name, ?check_in=&check_out= free for those nights,
      # ?guests= sleeps at least, ?page= (24 a page; all homes when absent).
      def index
        listings = Listing.published.kept.matching(params[:q]).includes(:photos, :videos, :amenities, :category).order(:created_at)
        if (dates = stay_dates)
          listings = listings.available_between(*dates)
        end
        listings = listings.where(max_guests: params[:guests].to_i..) if params[:guests].to_i.positive?

        if params[:page].present?
          rows, next_page = paginate(listings, PER_PAGE)
          render json: { listings: rows.map { |listing| listing_json(listing) }, next_page:, total: listings.count }
        else
          render json: { listings: listings.map { |listing| listing_json(listing) } }
        end
      end

      def show
        resume_session
        scope = Current.user&.admin? ? Listing.all : Listing.published.kept
        listing = scope.includes(:photos, :videos, :amenities, :category).find(params[:id])
        reviews = listing.reviews.visible.includes(:author).order(created_at: :desc).limit(20)
        render json: {
          listing: listing_json(listing).merge(
            unavailable: listing.unavailable_ranges,
            reviews: reviews.map { |review| review_json(review) },
            saved: Current.user ? Current.user.saved_listings.exists?(listing_id: listing.id) : false
          )
        }
      end

      private
        def stay_dates
          check_in = Date.iso8601(params[:check_in].to_s)
          check_out = Date.iso8601(params[:check_out].to_s)
          [ check_in, check_out ] if check_out > check_in
        rescue Date::Error
          nil
        end
    end
  end
end
