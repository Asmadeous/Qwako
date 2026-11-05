class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Authentication

  private
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
      user.slice(:id, :email, :name)
    end
end
