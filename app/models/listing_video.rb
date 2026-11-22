class ListingVideo < ApplicationRecord
  # Uploaded videos are served by Active Storage; remote files must be HTTPS.
  belongs_to :listing

  validates :url, presence: true, length: { maximum: 2000 },
    format: { with: ListingPhoto::URL_FORMAT, message: "must be an https link or an uploaded video" }
end
