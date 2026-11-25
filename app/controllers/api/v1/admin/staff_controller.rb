module Api
  module V1
    module Admin
      # The team: owners (everything) and staff (day-to-day running). New
      # members get an email to choose their password; nobody can sign up
      # as team. Only owners manage the team.
      class StaffController < ApplicationController
        ROLE_LABELS = { "admin" => "owner", "staff" => "staff" }.freeze

        before_action :require_admin
        before_action -> { @member = User.team.kept.find(params[:id]) }, only: %i[update destroy]

        def index
          rows, meta = page_of(User.team.kept.order(:created_at, :id), 25)
          render json: { staff: rows.map { |user| row(user) }, **meta }
        end

        def create
          email = params[:email].to_s.strip.downcase
          user = User.kept.find_by(email:)
          if user&.team?
            user.errors.add(:email, "is already on the team")
            return render_validation_errors(user)
          end

          user ||= User.new(email:, name: params[:name].to_s, password: SecureRandom.base58(24))
          user.role = role_param || "staff"
          return render_validation_errors(user) unless user.save

          url = "#{app_url}/reset-password?#{{ token: user.generate_token_for(:invitation), welcome: 1 }.to_query}"
          AccountMailer.invitation(user, url, Current.user).deliver_later
          audit("add_staff", user, "Added #{user.name} (#{user.email}) to the team as #{ROLE_LABELS[user.role]}")
          render json: { member: row(user) }, status: :created
        end

        # Changes a member's role (owner or staff) or name.
        def update
          role = role_param
          if @member == Current.user && role && role != @member.role
            return render_error(:cannot_change_self, "You can't change your own role. Ask another owner.", status: :unprocessable_content)
          end

          before = @member.role
          @member.name = params[:name].to_s if params.key?(:name)
          @member.role = role if role
          return render_validation_errors(@member) unless @member.save

          if @member.saved_change_to_role?
            audit("change_staff_role", @member, "Made #{@member.name} #{ROLE_LABELS[@member.role]} (was #{ROLE_LABELS[before]})")
          elsif @member.saved_changes.any?
            audit("change_staff", @member, "Changed the name of #{@member.email} to #{@member.name}")
          end
          render json: { member: row(@member) }
        end

        # Takes team access away; the account stays as a guest.
        def destroy
          if @member == Current.user
            return render_error(:cannot_remove_self, "You can't remove yourself. Ask another owner.", status: :unprocessable_content)
          end

          @member.update!(role: "guest")
          @member.sessions.destroy_all
          audit("remove_staff", @member, "Removed #{@member.name} (#{@member.email}) from the team")
          head :no_content
        end

        private
          def role_param
            role = params[:role].to_s
            role if User::TEAM_ROLES.include?(role)
          end

          def row(user)
            user.slice(:id, :name, :email, :role, :created_at).merge(you: user == Current.user, invited: user.sessions.none?)
          end
      end
    end
  end
end
