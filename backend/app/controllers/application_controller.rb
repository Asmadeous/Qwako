class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Authentication
  include JsonRenderers

  before_action :verify_request_origin, unless: -> { request.get? || request.head? }

  rescue_from ActiveRecord::RecordNotFound do
    render_error(:not_found, "We couldn't find that.", status: :not_found)
  end

  rescue_from ActionController::ParameterMissing, ActionController::BadRequest do
    render_error(:bad_request, "The request was not understood.", status: :bad_request)
  end

  private
    # Browsers send Origin on cross-site writes. Refuse those unless the origin
    # is this site or an allowed dev origin; this blocks login CSRF through
    # plain HTML form posts, which SameSite=Lax cookies alone do not stop.
    def verify_request_origin
      origin = request.headers["Origin"]
      return if origin.blank? || origin == request.base_url || CorsOrigins.allowed.include?(origin)

      render_error(:forbidden_origin, "This request is not allowed from another site.", status: :forbidden)
    end

    def render_error(code, message, status:, details: nil)
      error = { code: code, message: message }
      error[:details] = details if details
      render json: { error: error }, status: status
    end

    def render_validation_errors(record)
      details = record.errors.group_by_attribute.transform_values { |errors| errors.map(&:full_message) }
      render_error(:validation_failed, "Check the highlighted fields.", status: :unprocessable_content, details: details)
    end

    # The site's public address, for links in Paystack returns and emails.
    # Production serves the client from Rails; in development the Vite server
    # is the first allowed origin.
    def app_url
      ENV["APP_URL"].presence || CorsOrigins.allowed.first || request.base_url
    end

    def render_rate_limited
      render_error(:rate_limited, "Too many attempts. Try again in a few minutes.", status: :too_many_requests)
    end

    def user_json(user)
      user.slice(:id, :email, :name, :role, :phone, :email_messages).merge(
        avatar_url: user.avatar_url,
        email_verified: user.email_verified?,
        marketing_consent: user.marketing_consent_at.present?,
        google_linked: user.google_uid.present?
      )
    end

    # Records what an owner-side account changed, for the admin log.
    def audit(action, target, summary)
      AuditLog.record!(admin: Current.user, action:, target:, summary:, ip_address: request.remote_ip)
    end

    def page_param
      [ params[:page].to_i, 1 ].max
    end

    # One page of a query plus whether another follows.
    def paginate(scope, per_page)
      rows = scope.offset((page_param - 1) * per_page).limit(per_page + 1).to_a
      [ rows.first(per_page), (page_param + 1 if rows.size > per_page) ]
    end

    def require_admin
      render_error(:forbidden, "You do not have access to this.", status: :forbidden) unless Current.user&.admin?
    end
end
