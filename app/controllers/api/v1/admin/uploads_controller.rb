require "image_processing/vips"

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

        PHOTO_MAX_SIDE = 2000

        before_action :require_admin

        def create
          kind = params.key?(:videos) ? :videos : :photos
          files = Array(params[kind]).select { |file| file.respond_to?(:content_type) }
          problem = upload_problem(kind, files)
          return render_error(:invalid_upload, problem, status: :unprocessable_content) if problem

          urls = files.map do |file|
            io, filename, content_type = kind == :photos ? web_sized_photo(file) : [ file, file.original_filename, file.content_type ]
            blob = ActiveStorage::Blob.create_and_upload!(io:, filename:, content_type:)
            Rails.application.routes.url_helpers.rails_blob_path(blob, only_path: true)
          end
          render json: { urls: }, status: :created
        rescue Vips::Error
          render_error(:invalid_upload, "One of the photos couldn't be read. Try saving it as a JPEG and uploading again.",
            status: :unprocessable_content)
        end

        private
          # Phone photos are often 4-8 MB. Guests only ever see them up to about
          # 2000px wide, so store a turned-upright, compressed JPEG of that size.
          def web_sized_photo(file)
            resized = ImageProcessing::Vips.source(file.tempfile.path)
              .resize_to_limit(PHOTO_MAX_SIDE, PHOTO_MAX_SIDE)
              .convert("jpg")
              .saver(quality: 82, strip: true)
              .call
            [ resized, "#{File.basename(file.original_filename.to_s, ".*").presence || "photo"}.jpg", "image/jpeg" ]
          end

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
