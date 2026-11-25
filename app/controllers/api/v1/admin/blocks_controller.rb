module Api
  module V1
    module Admin
      # Taking nights off sale for a home, changing those dates, and putting them back.
      class BlocksController < ApplicationController
        before_action :require_team

        def create
          listing = Listing.kept.find(params[:listing_id])
          block = listing.availability_blocks.new(params.permit(:starts_on, :ends_on, :reason))
          listing.with_lock do
            next unless block.save

            audit("block_dates", listing, "Blocked #{listing.title}, nights of #{block.nights_label}")
          end
          return render_validation_errors(block) unless block.persisted?

          render json: { block: block.slice(:id, :starts_on, :ends_on, :reason) }, status: :created
        end

        def update
          block = AvailabilityBlock.find(params[:id])
          before = block.nights_label
          block.listing.with_lock do
            next unless block.update(params.permit(:starts_on, :ends_on, :reason))

            audit("change_block", block.listing, "Changed blocked nights at #{block.listing.title}: was #{before}, now #{block.nights_label}")
          end
          return render_validation_errors(block) unless block.errors.empty?

          render json: { block: block.slice(:id, :starts_on, :ends_on, :reason) }
        end

        def destroy
          block = AvailabilityBlock.find(params[:id])
          block.destroy!
          audit("unblock_dates", block.listing, "Reopened #{block.listing.title}, nights of #{block.nights_label}")
          head :no_content
        end
      end
    end
  end
end
