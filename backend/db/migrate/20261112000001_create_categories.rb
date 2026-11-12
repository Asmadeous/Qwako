# Owner-defined home categories (Beach & Coast, Apartments...). Each home has at
# most one; deleting a category leaves its homes uncategorised.
class CreateCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :categories, id: :uuid do |t|
      t.citext :name, null: false
      t.string :slug, null: false
      t.timestamps
    end
    add_index :categories, :name, unique: true
    add_index :categories, :slug, unique: true

    add_reference :listings, :category, type: :uuid, foreign_key: { on_delete: :nullify }
  end
end
