# A blog post the owner writes. Plain text: paragraphs separated by a blank
# line, and lines starting with "## " as headings. Drafts have no published_at.
class Post < ApplicationRecord
  SLUG_FORMAT = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/

  belongs_to :author, class_name: "User", optional: true

  normalizes :title, with: ->(title) { title.strip }
  normalizes :excerpt, with: ->(excerpt) { excerpt.strip }
  normalizes :slug, with: ->(slug) { slug.strip.downcase }
  normalizes :cover_url, with: ->(url) { url.strip.presence }

  before_validation -> { self.slug = title.to_s.parameterize.first(100).delete_suffix("-") if slug.blank? }

  validates :title, presence: true, length: { maximum: 150 }
  validates :slug, presence: true, length: { maximum: 100 }, uniqueness: true,
    format: { with: SLUG_FORMAT, message: "can only use lowercase letters, numbers and dashes", allow_blank: true }
  validates :excerpt, length: { maximum: 300 }
  validates :body, presence: true, length: { maximum: 50_000 }
  validates :cover_url, length: { maximum: 2000 },
    format: { with: ListingPhoto::URL_FORMAT, message: "must be an https link or an uploaded photo", allow_nil: true }

  scope :published, -> { where(published_at: ..Time.current) }

  def published? = published_at.present? && published_at <= Time.current

  def publish=(value)
    self.published_at = ActiveModel::Type::Boolean.new.cast(value) ? (published_at || Time.current) : nil
  end
end
