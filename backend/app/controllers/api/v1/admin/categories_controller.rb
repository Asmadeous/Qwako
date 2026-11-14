module Api
  module V1
    module Admin
      # The owner's home categories. Deleting one leaves its homes uncategorised.
      class CategoriesController < ApplicationController
        before_action :require_admin

        def index
          categories = Category.joins("LEFT JOIN listings ON listings.category_id = categories.id AND listings.deleted_at IS NULL").group(:id).order(:name).select("categories.*, COUNT(listings.id) AS homes_count")
          render json: { categories: categories.map { |category| category_json(category).merge(homes_count: category.homes_count) } }
        end

        def create
          save(Category.new(category_params), status: :created)
        end

        def update
          category = Category.find(params[:id])
          category.assign_attributes(category_params)
          save(category, status: :ok)
        end

        def destroy
          record = Category.find(params[:id])
          record.destroy!
          audit("delete_category", nil, "Deleted category #{record.name}")
          head :no_content
        end

        private
          def save(category, status:)
            if category.save
              audit("save_category", category, "Saved category #{category.name}")
              render json: { category: category_json(category).merge(homes_count: category.listings.kept.count) }, status:
            else
              render_validation_errors category
            end
          end

          def category_params
            raw = params[:category]
            raw.is_a?(ActionController::Parameters) ? raw.permit(:name) : {}
          end
      end
    end
  end
end
