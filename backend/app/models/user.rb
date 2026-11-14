class User < ApplicationRecord
  AVATAR_TYPES = %w[image/jpeg image/png image/webp].freeze
  AVATAR_MAX_BYTES = 5.megabytes

  has_secure_password
  has_many :sessions, dependent: :destroy
  PHONE_FORMAT = /\A\+?[0-9][0-9 ()-]{6,19}\z/

  has_many :bookings, foreign_key: :guest_id, inverse_of: :guest, dependent: :restrict_with_error
  has_many :saved_listings, dependent: :delete_all
  has_many :saved_homes, through: :saved_listings, source: :listing
  has_many :conversations, foreign_key: :guest_id, inverse_of: :guest, dependent: :restrict_with_error
  has_many :notifications, dependent: :delete_all
  has_many :reviews, foreign_key: :author_id, inverse_of: :author, dependent: :restrict_with_error
  has_one_attached :avatar

  # Links in emails: confirming the address, and a new team member choosing a password.
  generates_token_for :email_verification, expires_in: 3.days do
    email
  end

  generates_token_for :invitation, expires_in: 7.days do
    password_salt.last(10)
  end

  enum :role, { guest: "guest", admin: "admin" }, default: "guest", validate: true

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :name, with: ->(name) { name.strip }
  normalizes :phone, with: ->(phone) { phone.strip.presence }

  scope :kept, -> { where(deleted_at: nil) }

  validates :email, presence: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true },
    uniqueness: { message: "is already registered", allow_blank: true }
  validates :name, presence: true, length: { maximum: 100 }
  validates :password, length: { minimum: 8 }, allow_nil: true
  validates :phone, format: { with: PHONE_FORMAT, message: "must be a phone number like +254 712 345 678", allow_nil: true }
  validate :avatar_is_a_small_image

  def avatar_url
    Rails.application.routes.url_helpers.rails_blob_path(avatar, only_path: true) if avatar.attached?
  end

  def email_verified? = email_verified_at.present?

  def deleted? = deleted_at.present?

  # Closing an account keeps its bookings and payments for the owner's
  # records (tax and disputes) but removes the person's details and sign-in.
  def close_account!
    transaction do
      sessions.destroy_all
      saved_listings.delete_all
      notifications.delete_all
      avatar.purge_later if avatar.attached?
      update_columns(name: "Closed account", email: "closed-#{id}@closed.invalid", phone: nil, google_uid: nil,
                     password_digest: BCrypt::Password.create(SecureRandom.hex(32)), marketing_consent_at: nil,
                     email_messages: false, deleted_at: Time.current, updated_at: Time.current)
    end
  end

  private
    def avatar_is_a_small_image
      return unless avatar.attached?

      errors.add(:avatar, "must be a JPEG, PNG or WebP image") unless avatar.blob.content_type.in?(AVATAR_TYPES)
      errors.add(:avatar, "must be 5 MB or smaller") if avatar.blob.byte_size > AVATAR_MAX_BYTES
    end
end
