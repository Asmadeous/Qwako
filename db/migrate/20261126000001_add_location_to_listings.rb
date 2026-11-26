# The home's map pin. Confirmed guests get it with directions; everyone else
# sees only the area around it.
class AddLocationToListings < ActiveRecord::Migration[8.1]
  def change
    add_column :listings, :latitude, :decimal, precision: 9, scale: 6
    add_column :listings, :longitude, :decimal, precision: 9, scale: 6
    add_check_constraint :listings, "(latitude IS NULL) = (longitude IS NULL)", name: "listings_location_pair"
    add_check_constraint :listings, "latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180",
      name: "listings_location_range"
  end
end
