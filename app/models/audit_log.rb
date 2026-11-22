# What owner-side accounts changed, and when. Written by admin controllers.
class AuditLog < ApplicationRecord
  belongs_to :admin, class_name: "User", optional: true

  def self.record!(admin:, action:, summary:, target: nil, ip_address: nil)
    create!(admin:, action:, summary: summary.to_s.truncate(250), target_type: target&.class&.name,
            target_id: target&.id, ip_address:)
  end
end
