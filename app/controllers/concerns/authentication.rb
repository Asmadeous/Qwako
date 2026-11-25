module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private
    def authenticated?
      resume_session.present?
    end

    def require_authentication
      resume_session || render_error(:unauthenticated, "Sign in to continue.", status: :unauthorized)
    end

    def resume_session
      Current.session ||= find_session_by_cookie
    end

    # An account whose email is not confirmed yet cannot use a session.
    def find_session_by_cookie
      session = Session.includes(:user).find_by(id: cookies.signed[:session_id]) if cookies.signed[:session_id]
      session if session&.user&.email_verified?
    end

    def start_new_session_for(user)
      # Signing in again in the same browser replaces, not stacks, its session.
      resume_session&.destroy
      user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
        Current.session = session
        cookies.signed.permanent[:session_id] = {
          value: session.id, httponly: true, same_site: :lax, secure: Rails.env.production?
        }
      end
    end

    def terminate_session
      Current.session&.destroy
      Current.session = nil
      cookies.delete(:session_id)
    end
end
