# Signing in now needs a confirmed email. Owner and team accounts that already
# exist were created by the seed or by an invitation, so they count as confirmed
# and keep working.
class ConfirmExistingAdminEmails < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      UPDATE users SET email_verified_at = CURRENT_TIMESTAMP
      WHERE role = 'admin' AND email_verified_at IS NULL AND deleted_at IS NULL
    SQL
  end

  def down
    # Nothing to undo: confirmed addresses stay confirmed.
  end
end
