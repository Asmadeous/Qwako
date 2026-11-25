module Api
  module V1
    class ListingsController < ApplicationController
      PER_PAGE = 24
      REVIEWS_PER_PAGE = 20

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
        scope = Current.user&.team? ? Listing.all : Listing.published.kept
        listing = scope.includes(:photos, :videos, :amenities, :category).find(params[:id])
        reviews, meta = page_of(reviews_of(listing), REVIEWS_PER_PAGE)
        render json: {
          listing: listing_json(listing).merge(
            unavailable: listing.unavailable_ranges,
            reviews: reviews.map { |review| review_json(review) },
            reviews_next_page: meta[:next_page],
            saved: Current.user ? Current.user.saved_listings.exists?(listing_id: listing.id) : false
          )
        }
      end

      # More of a home's reviews, newest first: ?page=2 onwards.
      def reviews
        resume_session
        listing = (Current.user&.team? ? Listing.all : Listing.published.kept).find(params[:id])
        rows, meta = page_of(reviews_of(listing), REVIEWS_PER_PAGE)
        render json: { reviews: rows.map { |review| review_json(review) }, **meta }
      end

      private
        def reviews_of(listing)
          listing.reviews.visible.includes(:author).order(created_at: :desc, id: :desc)
        end

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
