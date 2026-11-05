class User < ApplicationRecord
  AVATAR_TYPES = %w[image/jpeg image/png image/webp].freeze
  AVATAR_MAX_BYTES = 5.megabytes

  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :bookings, foreign_key: :guest_id, inverse_of: :guest, dependent: :restrict_with_error
  has_one_attached :avatar

  enum :role, { guest: "guest", admin: "admin" }, default: "guest", validate: true

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :name, with: ->(name) { name.strip }

  validates :email, presence: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true },
    uniqueness: { message: "is already registered", allow_blank: true }
  validates :name, presence: true, length: { maximum: 100 }
  validates :password, length: { minimum: 8 }, allow_nil: true
  validate :avatar_is_a_small_image

  def avatar_url
    Rails.application.routes.url_helpers.rails_blob_path(avatar, only_path: true) if avatar.attached?
  end

  private
    def avatar_is_a_small_image
      return unless avatar.attached?

      errors.add(:avatar, "must be a JPEG, PNG or WebP image") unless avatar.blob.content_type.in?(AVATAR_TYPES)
      errors.add(:avatar, "must be 5 MB or smaller") if avatar.blob.byte_size > AVATAR_MAX_BYTES
    end
end
