# The demo homes were created before homes had a type and room counts, so
# they all read "House, 1 bedroom". Fill in what their descriptions say,
# only where the owner hasn't changed the defaults.
class FillDemoHomeDetails < ActiveRecord::Migration[8.1]
  DETAILS = {
    "Westlands Skyline Apartment" => [ "apartment", 2, 2, 2 ],
    "Kilimani Garden Flat" => [ "apartment", 1, 1, 1 ],
    "Karen Garden House" => [ "house", 4, 4, 3 ],
    "Diani Beach Villa" => [ "villa", 4, 4, 4 ],
    "Watamu Ocean House" => [ "house", 3, 3, 2 ],
    "Nyali Beach Apartment" => [ "apartment", 2, 2, 2 ],
    "Shela Village House" => [ "house", 3, 3, 3 ],
    "Naivasha Lakeside Cottage" => [ "cottage", 2, 2, 1 ],
    "Nanyuki Forest Cabin" => [ "cabin", 1, 1, 1 ],
    "Nakuru Hillside Home" => [ "house", 3, 3, 2 ],
    "Kisumu Lakefront Apartment" => [ "apartment", 2, 2, 1 ],
    "Kilifi Creek Retreat" => [ "house", 2, 2, 2 ]
  }.freeze

  def up
    DETAILS.each do |title, (type, bedrooms, beds, bathrooms)|
      execute ActiveRecord::Base.sanitize_sql([
        "UPDATE listings SET property_type = ?, bedrooms = ?, beds = ?, bathrooms = ? " \
        "WHERE title = ? AND property_type = 'house' AND bedrooms = 1 AND beds = 1 AND bathrooms = 1",
        type, bedrooms, beds, bathrooms, title
      ])
    end
  end

  def down; end
end
