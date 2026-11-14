module Api
  module V1
    module Admin
      # The owner's list of amenities. Deleting one removes it from every home.
      class AmenitiesController < ApplicationController
        before_action :require_admin

        def index
          counts = ListingAmenity.joins(:listing).merge(Listing.kept).group(:amenity_id).count
          amenities = Amenity.order(:name)
          render json: { amenities: amenities.map { |amenity| amenity_json(amenity).merge(homes_count: counts.fetch(amenity.id, 0)) } }
        end

        def create
          save(Amenity.new(amenity_params), status: :created)
        end

        def update
          amenity = Amenity.find(params[:id])
          amenity.assign_attributes(amenity_params)
          save(amenity, status: :ok)
        end

        def destroy
          record = Amenity.find(params[:id])
          record.destroy!
          audit("delete_amenity", nil, "Deleted amenity #{record.name}")
          head :no_content
        end

        private
          def save(amenity, status:)
            if amenity.save
              audit("save_amenity", amenity, "Saved amenity #{amenity.name}")
              render json: { amenity: amenity_json(amenity).merge(homes_count: amenity.listings.kept.count) }, status:
            else
              render_validation_errors amenity
            end
          end

          def amenity_params
            raw = params[:amenity]
            raw.is_a?(ActionController::Parameters) ? raw.permit(:name) : {}
          end
      end
    end
  end
end
