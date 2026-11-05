class ListingPhoto < ApplicationRecord
  # Remote images must be HTTPS; uploads are served by Active Storage.
  URL_FORMAT = %r{\A(https://\S+|/rails/active_storage/\S+)\z}

  belongs_to :listing

  validates :url, presence: true, length: { maximum: 2000 }, format: { with: URL_FORMAT, message: "must be an https link or an uploaded photo" }
end
