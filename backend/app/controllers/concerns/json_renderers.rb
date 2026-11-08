# Explicit allowlists for every record the API returns.
module JsonRenderers
  private
    def listing_json(listing)
      listing.slice(
        :id, :slug, :title, :address, :country, :currency, :description, :house_rules, :max_guests,
        :nightly_price_cents, :cleaning_charge_cents, :status, :featured
      ).merge(
        photos: listing.current_photos.map(&:url),
        videos: listing.current_videos.map(&:url),
        amenities: listing.amenities.map(&:key)
      )
    end

    def booking_json(booking)
      booking.slice(
        :id, :status, :check_in, :check_out, :nights, :guests_count, :currency,
        :nightly_price_cents, :cleaning_charge_cents, :total_cents, :created_at
      ).merge(listing: listing_json(booking.listing))
    end
end
