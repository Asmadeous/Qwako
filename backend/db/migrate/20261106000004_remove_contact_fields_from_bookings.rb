# Guests book from their signed-in account, which already holds their name
# and email, so bookings no longer collect a separate name and phone.
class RemoveContactFieldsFromBookings < ActiveRecord::Migration[8.1]
  def change
    remove_column :bookings, :contact_name, :string, null: false
    remove_column :bookings, :contact_phone, :string, null: false
  end
end
