# Explicit allowlists for every record the API returns.
module JsonRenderers
  private
    def listing_json(listing)
      listing.slice(
        :id, :slug, :title, :address, :country, :description, :house_rules, :max_guests,
        :nightly_price_pence, :cleaning_charge_pence, :status, :featured
      ).merge(
        photos: listing.current_photos.map(&:url),
        amenities: listing.amenities.map(&:key)
      )
    end

    def booking_json(booking)
      booking.slice(
        :id, :status, :check_in, :check_out, :nights, :guests_count, :contact_name, :contact_phone,
        :nightly_price_pence, :cleaning_charge_pence, :total_pence, :created_at
      ).merge(listing: listing_json(booking.listing))
    end
end
