module Api
  module V1
    module Admin
      # Team accounts that can manage the site. New members get an email to
      # choose their password; nobody can sign up as staff.
      class StaffController < ApplicationController
        before_action :require_admin

        def index
          render json: { staff: User.admin.kept.order(:created_at).map { |user| row(user) } }
        end

        def create
          email = params[:email].to_s.strip.downcase
          user = User.kept.find_by(email:)
          if user&.admin?
            user.errors.add(:email, "is already on the team")
            return render_validation_errors(user)
          end

          user ||= User.new(email:, name: params[:name].to_s, password: SecureRandom.base58(24))
          user.role = "admin"
          return render_validation_errors(user) unless user.save

          url = "#{app_url}/reset-password?#{{ token: user.generate_token_for(:invitation), welcome: 1 }.to_query}"
          AccountMailer.invitation(user, url, Current.user).deliver_later
          audit("add_staff", user, "Added #{user.name} (#{user.email}) to the team")
          render json: { member: row(user) }, status: :created
        end

        # Takes owner access away; the account stays as a guest.
        def destroy
          user = User.admin.kept.find(params[:id])
          if user == Current.user
            return render_error(:cannot_remove_self, "You can't remove yourself. Ask another team member.", status: :unprocessable_content)
          end

          user.update!(role: "guest")
          user.sessions.destroy_all
          audit("remove_staff", user, "Removed #{user.name} (#{user.email}) from the team")
          head :no_content
        end

        private
          def row(user)
            user.slice(:id, :name, :email, :created_at).merge(you: user == Current.user, invited: user.sessions.none?)
          end
      end
    end
  end
end
