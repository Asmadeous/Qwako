module Api
  module V1
    module Admin
      # What team accounts changed, newest first.
      class AuditLogsController < ApplicationController
        before_action :require_admin

        def index
          rows, next_page = paginate(AuditLog.includes(:admin).order(created_at: :desc), 50)
          render json: {
            entries: rows.map { |entry|
              entry.slice(:id, :action, :summary, :target_type, :target_id, :ip_address, :created_at)
                .merge(admin_name: entry.admin&.name || "Removed account")
            },
            next_page:
          }
        end
      end
    end
  end
end
