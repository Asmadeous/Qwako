# Explicit allowlists for every record the API returns.
module JsonRenderers
  PUBLIC_LISTING_FIELDS = %i[
    id slug title address country currency description house_rules max_guests nightly_price_cents
    cleaning_charge_cents status featured property_type bedrooms beds bathrooms check_in_time check_out_time
    min_nights max_nights booking_type cancellation_policy licence_number review_count
  ].freeze
  # Shown to the owner, and to a guest once their stay is confirmed.
  PRIVATE_LISTING_FIELDS = %i[check_in_instructions wifi_details].freeze

  private
    def listing_json(listing)
      listing.slice(*PUBLIC_LISTING_FIELDS).merge(
        rating_average: listing.rating_average&.to_f,
        cancellation_policy_text: listing.cancellation_policy_text,
        photos: listing.current_photos.map(&:url),
        videos: listing.current_videos.map(&:url),
        amenities: listing.amenities.sort_by(&:name).map { |amenity| amenity_json(amenity) },
        category: listing.category && category_json(listing.category)
      )
    end

    def admin_listing_json(listing)
      listing_json(listing).merge(listing.slice(*PRIVATE_LISTING_FIELDS))
    end

    def amenity_json(amenity)
      amenity.slice(:id, :key, :name)
    end

    def category_json(category)
      category.slice(:id, :name, :slug)
    end

    def booking_json(booking)
      json = booking.slice(
        :id, :status, :check_in, :check_out, :nights, :guests_count, :currency, :nightly_price_cents,
        :cleaning_charge_cents, :total_cents, :created_at, :requested_until, :cancelled_at, :cancel_reason
      ).merge(
        listing: listing_json(booking.listing),
        hold_expires_at: booking.hold_expires_at,
        guest_can_cancel: booking.guest_can_cancel?,
        guest_can_reschedule: booking.can_reschedule?(by_owner: false),
        cancel_refund_cents: booking.guest_can_cancel? ? booking.guest_refund_cents : 0,
        paid_cents: booking.paid_cents,
        refund_cents: booking.refunded_or_due_cents,
        refunded_cents: booking.payments.select { |p| p.succeeded? && p.refunded_at }.sum { |p| p.refund_cents.to_i },
        reviewable: booking.reviewable? && booking.review.nil?,
        review: booking.review && review_json(booking.review),
        conversation_id: booking.conversation&.id
      )
      json[:private_details] = booking.listing.slice(*PRIVATE_LISTING_FIELDS) if booking.details_revealed?
      json
    end

    def review_json(review)
      review.slice(:id, :rating, :comment, :owner_reply, :hidden, :created_at).merge(
        author_name: review.author.name.split.first, listing_id: review.listing_id
      )
    end

    def receipt_payment_json(payment)
      payment.slice(:id, :reference, :amount_cents, :currency, :status, :channel, :paid_at, :refund_cents, :refunded_at)
        .merge(refund_due: payment.refund_due?)
    end

    def conversation_json(conversation, viewer)
      last = conversation.messages.last
      conversation.slice(:id, :subject, :last_message_at, :booking_id, :listing_id).merge(
        guest: conversation.guest.slice(:id, :name, :email),
        listing_title: conversation.listing&.title,
        unread: conversation.unread_for?(viewer),
        preview: last&.body.to_s.truncate(120)
      )
    end

    def message_json(message)
      message.slice(:id, :body, :created_at).merge(
        sender_name: message.sender.name, from_owner: message.sender.admin?, sender_id: message.sender_id
      )
    end

    def notification_json(notification)
      notification.slice(:id, :kind, :title, :body, :url, :read_at, :created_at)
    end
end
