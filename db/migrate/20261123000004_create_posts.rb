class CreatePosts < ActiveRecord::Migration[8.1]
  def change
    create_table :posts, id: :uuid do |t|
      t.string :title, null: false
      t.string :slug, null: false
      t.string :excerpt, null: false, default: ""
      t.text :body, null: false, default: ""
      t.string :cover_url
      t.datetime :published_at
      t.references :author, type: :uuid, foreign_key: { to_table: :users }
      t.timestamps
      t.index :slug, unique: true
      t.index :published_at
    end
  end
end
