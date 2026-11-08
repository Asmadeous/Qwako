module Api
  module V1
    module Admin
      class ListingsController < ApplicationController
        before_action :require_admin

        def index
          listings = Listing.includes(:photos, :videos, :amenities).order(:created_at)
          render json: { listings: listings.map { |listing| listing_json(listing) } }
        end

        def create
          listing = Listing.new
          save(listing, status: :created)
        end

        def update
          save(Listing.find(params[:id]), status: :ok)
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
