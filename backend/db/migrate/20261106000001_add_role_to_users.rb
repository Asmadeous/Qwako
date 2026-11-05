class AddRoleToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :role, :string, null: false, default: "guest"
    add_check_constraint :users, "role IN ('guest', 'admin')", name: "users_role_valid"
  end
end
