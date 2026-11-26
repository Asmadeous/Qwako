module Api
  module V1
    module Admin
      # Every guest's bookings. Staff see and run stays (accept requests, move
      # dates, change the guest count); money and deleting are for the owner.
      class BookingsController < ApplicationController
        PER_PAGE = 50
        VIEWS = %w[upcoming requests refunds past cancelled all].freeze
        ENDED_STATUSES = Booking::ENDED_STATUSES
        INCLUDES = [ :guest, :payments, :conversation, { review: :author }, { listing: %i[photos videos amenities category] } ].freeze

        PAYMENT_METHODS = { "cash" => "Cash", "mpesa" => "M-Pesa", "bank" => "Bank transfer", "card" => "Card" }.freeze
        OWNER_ACTIONS = %i[create destroy cancel decline mark_refunded refund record_payment remove_payment].freeze

        before_action :require_team
        before_action :require_admin, only: OWNER_ACTIONS
        before_action -> { Booking.expire_stale_holds! }
        before_action :set_booking, except: %i[index create]

        # ?view= upcoming (default) | requests | refunds | past | cancelled | all, ?q= guest or stay, ?page=
        def index
          view = VIEWS.include?(params[:view]) ? params[:view] : "upcoming"
          page = [ params[:page].to_i, 1 ].max
          bookings = search(scoped(view)).includes(*INCLUDES)
          rows = bookings.offset((page - 1) * PER_PAGE).limit(PER_PAGE + 1).to_a

          render json: {
            bookings: rows.first(PER_PAGE).map { |booking| admin_booking_json(booking) },
            next_page: (page + 1 if rows.size > PER_PAGE),
            refunds_due: refunds_due.count,
            requests: Booking.requested.count
          }
        end

        def show
          render json: { booking: admin_booking_json(@booking) }
        end

        # A stay booked by phone or in person. The owner picks a guest or adds
        # a new one, and can record money already received.
        def create
          listing = Listing.kept.find(params[:listing_id])
          guest = manual_guest
          return render_error(:not_a_guest, "That email belongs to a team member.", status: :unprocessable_content) unless guest

          booking = Booking.new(listing:, guest:, status: "confirmed", guests_count: params[:guests_count].to_i,
                                check_in: parse_date(params[:check_in]), check_out: parse_date(params[:check_out]))
          return render_validation_errors(guest) if guest.new_record? && !guest.valid?
          return render_validation_errors(booking) unless booking.valid?

          amount = amount_cents_param
          if amount && !valid_payment?(amount, booking.total_cents)
            return render_error(:bad_amount, "The amount received must be between 1 and the booking total.", status: :unprocessable_content)
          end

          Booking.transaction do
            guest.save! if guest.new_record?
            booking.save!
            add_manual_payment!(booking, amount) if amount
          end
          Notify.booking_confirmed(booking)
          audit("create_booking", booking, "Booked #{guest.name} into #{listing.title}, #{Notify.stay(booking).delete_prefix("#{listing.title}, ")}")
          render json: { booking: admin_booking_json(Booking.includes(*INCLUDES).find(booking.id)) }, status: :created
        rescue ActiveRecord::ExclusionViolation
          render_error(:dates_taken, "Those dates are no longer available.", status: :unprocessable_content)
        end

        # Changes how many guests are coming. Dates move with reschedule.
        def update
          count = params[:guests_count].to_i
          unless @booking.status.in?(Booking::ACTIVE_STATUSES)
            return render_error(:not_changeable, "This booking has ended and can't be changed.", status: :unprocessable_content)
          end
          unless count.between?(1, @booking.listing.max_guests)
            @booking.errors.add(:guests_count, "must be between 1 and #{@booking.listing.max_guests} for this home")
            return render_validation_errors(@booking)
          end

          before = @booking.guests_count
          @booking.update!(guests_count: count)
          audit("change_booking", @booking, "Changed #{@booking.guest.name}'s stay at #{@booking.listing.title} from #{before} to #{count} guests")
          render_booking
        end

        # Only bookings without money taken can be deleted. Paid ones stay in
        # the records (tax, disputes): cancel them instead.
        def destroy
          unless deletable?(@booking)
            return render_error(:not_deletable, delete_refusal(@booking), status: :unprocessable_content)
          end

          summary = "Deleted #{@booking.guest.name}'s booking at #{@booking.listing.title} (#{Notify.stay(@booking).delete_prefix("#{@booking.listing.title}, ")})"
          Booking.transaction do
            @booking.payments.destroy_all
            @booking.destroy!
          end
          audit("delete_booking", @booking, summary)
          head :no_content
        end

        # Money received outside Paystack: cash, M-Pesa to the owner, bank.
        def record_payment
          unless @booking.confirmed? || @booking.completed?
            return render_error(:not_payable, "Payments can only be recorded on confirmed stays.", status: :unprocessable_content)
          end

          amount = amount_cents_param
          balance = @booking.total_cents - @booking.net_paid_cents
          unless amount && valid_payment?(amount, balance)
            return render_error(:bad_amount, "The amount must be between 1 and what is still owed (#{Notify.format_money(balance, @booking.currency)}).",
                                status: :unprocessable_content)
          end

          payment = add_manual_payment!(@booking, amount)
          audit("record_payment", @booking, "Recorded #{Notify.format_money(amount, @booking.currency)} (#{PAYMENT_METHODS[payment.channel]}) from #{@booking.guest.name}")
          render_booking
        end

        # Removes a payment recorded by mistake. Paystack payments can't be removed.
        def remove_payment
          payment = @booking.payments.find(params[:payment_id])
          unless payment.provider == "manual" && !payment.needs_refund?
            return render_error(:not_removable, "Only payments you recorded yourself, with no refund on them, can be removed.",
                                status: :unprocessable_content)
          end

          payment.destroy!
          audit("remove_payment", @booking, "Removed a recorded payment of #{Notify.format_money(payment.amount_cents, payment.currency)} from #{@booking.guest.name}'s booking")
          render_booking
        end

        def cancel
          unless @booking.cancel_by_owner!(reason: params[:reason].to_s.strip.first(300))
            return render_error(:not_cancellable, "This booking can no longer be cancelled.", status: :unprocessable_content)
          end

          audit("cancel_booking", @booking, "Cancelled #{@booking.guest.name}'s stay at #{@booking.listing.title}")
          render_booking
        end

        def accept
          return render_error(:not_requested, "This booking isn't waiting for an answer.", status: :unprocessable_content) unless @booking.accept!

          audit("accept_booking", @booking, "Accepted #{@booking.guest.name}'s request for #{@booking.listing.title}")
          render_booking
        end

        def decline
          unless @booking.decline!(reason: params[:reason].to_s.strip.first(300).presence)
            return render_error(:not_requested, "This booking isn't waiting for an answer.", status: :unprocessable_content)
          end

          audit("decline_booking", @booking, "Declined #{@booking.guest.name}'s request for #{@booking.listing.title}")
          render_booking
        end

        def reschedule
          if @booking.reschedule!(parse_date(params[:check_in]), parse_date(params[:check_out]), by_owner: true)
            audit("move_booking", @booking, "Moved #{@booking.guest.name}'s stay at #{@booking.listing.title} to #{I18n.l(@booking.check_in, format: :stay)} - #{I18n.l(@booking.check_out, format: :stay)}")
            render_booking
          else
            render_validation_errors @booking
          end
        end

        # Recorded after refunding in the Paystack dashboard.
        def mark_refunded
          payment = @booking.payments.find(params[:payment_id])
          return render_error(:no_refund_due, "No refund is due on that payment.", status: :unprocessable_content) unless payment.mark_refunded!

          audit("mark_refunded", @booking, "Marked #{payment.reference} refunded")
          render_booking
        end

        # Sends the refund through Paystack, back to the guest's card or M-Pesa.
        def refund
          payment = @booking.payments.find(params[:payment_id])
          unless payment.provider == "paystack"
            return render_error(:not_paystack, "This payment wasn't made through Paystack. Give the money back yourself, then mark it refunded.",
                                status: :unprocessable_content)
          end
          return render_error(:no_refund_due, "No refund is due on that payment.", status: :unprocessable_content) unless payment.refund_through_paystack!

          audit("refund", @booking, "Refunded #{Notify.format_money(payment.refund_cents, payment.currency)} on #{payment.reference} through Paystack")
          render_booking
        rescue Paystack::Error => error
          Rails.logger.error("Paystack refund failed for #{payment.reference}: #{error.message}")
          render_error(:refund_failed, "Paystack didn't accept the refund: #{error.message}", status: :bad_gateway)
        end

        private
          def set_booking
            @booking = Booking.includes(*INCLUDES).find(params[:id])
          end

          def render_booking
            render json: { booking: admin_booking_json(Booking.includes(*INCLUDES).find(@booking.id)) }
          end

          def parse_date(value)
            Date.iso8601(value.to_s)
          rescue Date::Error
            nil
          end

          def refunds_due
            Booking.where(id: Payment.refund_due.select(:booking_id))
          end

          def scoped(view)
            today = Time.zone.today
            case view
            when "upcoming" then Booking.active.where(check_out: today..).order(:check_in, :created_at)
            when "requests" then Booking.requested.order(:requested_until)
            when "refunds" then refunds_due.order(:check_in)
            when "past" then Booking.where(check_out: ...today).where.not(status: ENDED_STATUSES).order(check_in: :desc)
            when "cancelled" then Booking.where(status: ENDED_STATUSES).order(updated_at: :desc)
            else Booking.order(check_in: :desc)
            end
          end

          def search(bookings)
            query = params[:q].to_s.strip
            return bookings if query.empty?

            like = "%#{Booking.sanitize_sql_like(query)}%"
            bookings.joins(:guest, :listing)
              .where("users.name ILIKE :like OR users.email ILIKE :like OR listings.title ILIKE :like", like:)
          end

          # Staff don't see payments or refunds.
          def admin_booking_json(booking)
            owner = Current.user.admin?
            booking_json(booking).merge(
              guest: booking.guest.slice(:id, :name, :email, :phone),
              can_cancel: owner && booking.owner_can_cancel?,
              can_reschedule: booking.can_reschedule?(by_owner: true),
              can_edit_guests: booking.status.in?(Booking::ACTIVE_STATUSES),
              can_delete: owner && deletable?(booking),
              can_record_payment: owner && (booking.confirmed? || booking.completed?) && booking.net_paid_cents < booking.total_cents,
              private_details: private_listing_details(booking.listing),
              refund_due: owner && booking.refund_due?,
              payments: owner ? booking.payments.sort_by(&:created_at).map { |payment| payment_json(payment) } : []
            )
          end

          def payment_json(payment)
            payment.slice(
              :id, :reference, :amount_cents, :currency, :status, :channel, :paid_at, :needs_refund, :refund_cents,
              :refunded_at, :created_at, :provider
            ).merge(refund_due: payment.refund_due?)
          end

          def deletable?(booking)
            delete_refusal(booking).nil?
          end

          def delete_refusal(booking)
            if booking.payments.any?(&:succeeded?)
              "This booking has payments, so it stays in your records. Cancel it instead."
            elsif booking.review
              "This booking has a review. Delete the review first."
            elsif booking.status.in?(Booking::ACTIVE_STATUSES) && booking.check_out >= Time.zone.today
              "The guest still expects this stay. Cancel it first so they are told."
            end
          end

          # An existing guest by id, or one found or added by email.
          def manual_guest
            return User.guest.kept.find(params[:guest_id]) if params[:guest_id].present?

            raw = params[:guest].is_a?(ActionController::Parameters) ? params[:guest].permit(:name, :email, :phone) : {}
            email = raw[:email].to_s.strip.downcase
            existing = User.kept.find_by(email:) if email.present?
            return (existing.guest? ? existing : nil) if existing

            User.new(name: raw[:name].to_s, email:, phone: raw[:phone], password: SecureRandom.base58(24))
          end

          # Whole shillings from the form, stored as cents.
          def amount_cents_param
            return nil if params[:payment_amount].blank?

            (BigDecimal(params[:payment_amount].to_s) * 100).to_i
          rescue ArgumentError
            0
          end

          def valid_payment?(amount, limit)
            amount.positive? && amount <= limit && PAYMENT_METHODS.key?(params[:payment_method].to_s)
          end

          def add_manual_payment!(booking, amount)
            booking.payments.create!(provider: "manual", reference: "manual_#{SecureRandom.hex(10)}", amount_cents: amount,
                                     currency: booking.currency, status: "succeeded", channel: params[:payment_method].to_s,
                                     paid_at: Time.current)
          end
      end
    end
  end
end
