module Api
  module V1
    module Admin
      class ListingsController < ApplicationController
        before_action :require_admin

        def index
          listings = Listing.kept.includes(:photos, :videos, :amenities, :category).order(:created_at)
          bookings = Booking.group(:listing_id).count
          upcoming = Booking.active.where(check_out: Time.zone.today..).group(:listing_id).count
          render json: {
            listings: listings.map { |listing|
              admin_listing_json(listing).merge(bookings_count: bookings.fetch(listing.id, 0), upcoming_count: upcoming.fetch(listing.id, 0))
            }
          }
        end

        # For the edit form: says what deleting the home would do.
        def show
          listing = Listing.kept.includes(:photos, :videos, :amenities, :category).find(params[:id])
          render json: {
            listing: admin_listing_json(listing).merge(bookings_count: listing.bookings.count, upcoming_count: listing.upcoming_stays.count)
          }
        end

        def create
          listing = Listing.new
          save(listing, status: :created)
          audit("create_home", listing, "Added #{listing.title}") if listing.persisted?
        end

        def update
          listing = Listing.kept.find(params[:id])
          save(listing, status: :ok)
          audit("update_home", listing, "Edited #{listing.title}") if listing.errors.empty?
        end

        # Removes a home nobody has booked; hides a booked one for good while
        # keeping its bookings and payments. Refused while stays are still to come.
        def destroy
          listing = Listing.kept.find(params[:id])
          if listing.delete_or_archive!
            audit("delete_home", nil, "Deleted #{listing.title}")
            return head :no_content
          end

          render_error(:has_upcoming_stays,
            "Guests are still due to stay in this home. Cancel those bookings first, or hide the home instead.",
            status: :unprocessable_content)
        end

        private
          def save(listing, status:)
            Listing.transaction do
              listing.assign_attributes(listing_params)
              listing.save!
            end
            render json: { listing: admin_listing_json(listing.reload) }, status:
          rescue ActiveRecord::RecordInvalid
            render_validation_errors listing
          end

          def listing_params
            raw = params[:listing]
            return {} unless raw.is_a?(ActionController::Parameters)

            raw.permit(
              :title, :address, :description, :house_rules, :max_guests, :nightly_price_cents,
              :cleaning_charge_cents, :status, :featured, :category_id, :property_type, :bedrooms, :beds, :bathrooms,
              :check_in_time, :check_out_time, :min_nights, :max_nights, :booking_type, :cancellation_policy,
              :check_in_instructions, :wifi_details, :licence_number, photo_urls: [], video_urls: [], amenity_keys: []
            )
          end
      end
    end
  end
end
