module Api
  module V1
    module Admin
      # Stores photo or video files and returns paths the listing form saves.
      class UploadsController < ApplicationController
        KINDS = {
          photos: { types: %w[image/jpeg image/png image/webp], max_bytes: 10.megabytes, max_files: 20,
                    type_message: "Photos must be JPEG, PNG or WebP images." },
          videos: { types: %w[video/mp4 video/webm video/quicktime], max_bytes: 200.megabytes, max_files: 5,
                    type_message: "Videos must be MP4, WebM or MOV files." }
        }.freeze

        before_action :require_admin

        def create
          kind = params.key?(:videos) ? :videos : :photos
          files = Array(params[kind]).select { |file| file.respond_to?(:content_type) }
          problem = upload_problem(kind, files)
          return render_error(:invalid_upload, problem, status: :unprocessable_content) if problem

          urls = files.map do |file|
            blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename,
              content_type: file.content_type)
            Rails.application.routes.url_helpers.rails_blob_path(blob, only_path: true)
          end
          render json: { urls: }, status: :created
        end

        private
          def upload_problem(kind, files)
            rules = KINDS[kind]
            noun = kind.to_s.singularize
            return "Choose at least one #{noun}." if files.empty?
            return "Upload at most #{rules[:max_files]} #{kind} at a time." if files.size > rules[:max_files]
            return rules[:type_message] unless files.all? { |file| file.content_type.in?(rules[:types]) }

            limit = rules[:max_bytes] / 1.megabyte
            "Each #{noun} must be #{limit} MB or smaller." if files.any? { |file| file.size > rules[:max_bytes] }
          end
      end
    end
  end
end
