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

    def render_rate_limited
      render_error(:rate_limited, "Too many attempts. Try again in a few minutes.", status: :too_many_requests)
    end

    def user_json(user)
      user.slice(:id, :email, :name, :role).merge(avatar_url: user.avatar_url)
    end

    def require_admin
      render_error(:forbidden, "You do not have access to this.", status: :forbidden) unless Current.user&.admin?
    end
end
