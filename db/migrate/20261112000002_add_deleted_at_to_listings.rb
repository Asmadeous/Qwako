# A deleted home that guests have booked is kept, out of sight, so its
# bookings and payments still have their home.
class AddDeletedAtToListings < ActiveRecord::Migration[8.1]
  def change
    add_column :listings, :deleted_at, :datetime
    add_index :listings, :deleted_at
  end
end
