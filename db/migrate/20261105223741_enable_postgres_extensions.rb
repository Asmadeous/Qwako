class EnablePostgresExtensions < ActiveRecord::Migration[8.1]
  def change
    enable_extension "pgcrypto"   # gen_random_uuid() for UUID primary keys
    enable_extension "citext"     # case-insensitive email column
    enable_extension "btree_gist" # booking date-range exclusion constraint
  end
end
