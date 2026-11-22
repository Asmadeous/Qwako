class Category < ApplicationRecord
  has_many :listings, dependent: :nullify

  normalizes :name, with: ->(value) { value.squish }

  before_validation :assign_slug

  validates :name, presence: true, length: { maximum: 40 }, uniqueness: { case_sensitive: false }
  validate :slug_is_unique

  private
    def assign_slug
      self.slug = name.to_s.parameterize.presence || "category"
    end

    # Names that differ only in punctuation ("Beach & Coast" / "Beach Coast")
    # would share a filter link, so treat them as the same name.
    def slug_is_unique
      return if errors.include?(:name)

      errors.add(:name, "is too close to an existing category") if Category.where.not(id:).exists?(slug:)
    end
end
