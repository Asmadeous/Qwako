# One-off data fix: homes created from the seed file before categories existed
# get the category the seed file names. Homes that already have one, and homes
# the owner added, are left alone.
class AssignCategoriesToSeededHomes < ActiveRecord::Migration[8.1]
  class MigrationCategory < ActiveRecord::Base
    self.table_name = "categories"
  end

  class MigrationListing < ActiveRecord::Base
    self.table_name = "listings"
  end

  def up
    seeds = JSON.parse(Rails.root.join("db/seeds/listings.json").read)
    seeds.each do |seed|
      next if seed["category"].blank?

      homes = MigrationListing.where(title: seed["title"], category_id: nil)
      next unless homes.exists?

      slug = seed["category"].parameterize
      category = MigrationCategory.find_by(slug:) || MigrationCategory.create!(name: seed["category"], slug:)
      homes.update_all(category_id: category.id)
    end
  end

  def down
    # Nothing to undo: categories stay as assigned.
  end
end
