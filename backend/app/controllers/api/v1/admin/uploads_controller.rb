module Api
  module V1
    module Admin
      class UploadsController < ApplicationController
        IMAGE_TYPES = %w[image/jpeg image/png image/webp].freeze
        MAX_BYTES = 10.megabytes
        MAX_FILES = 20

        before_action :require_admin

        def create
          files = Array(params[:photos]).select { |file| file.respond_to?(:content_type) }
          problem = upload_problem(files)
          return render_error(:invalid_upload, problem, status: :unprocessable_content) if problem

          urls = files.map do |file|
            blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename,
              content_type: file.content_type)
            Rails.application.routes.url_helpers.rails_blob_path(blob, only_path: true)
          end
          render json: { urls: }, status: :created
        end

        private
          def upload_problem(files)
            return "Choose at least one photo." if files.empty?
            return "Upload at most #{MAX_FILES} photos at a time." if files.size > MAX_FILES
            return "Photos must be JPEG, PNG or WebP images." unless files.all? { |file| file.content_type.in?(IMAGE_TYPES) }

            "Each photo must be 10 MB or smaller." if files.any? { |file| file.size > MAX_BYTES }
          end
      end
    end
  end
end
