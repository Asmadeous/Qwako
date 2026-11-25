# Team members who help run the homes but don't control money, homes or the team.
class AddStaffRole < ActiveRecord::Migration[8.1]
  def up
    remove_check_constraint :users, name: "users_role_valid"
    add_check_constraint :users, "role IN ('guest', 'staff', 'admin')", name: "users_role_valid"
  end

  def down
    execute "UPDATE users SET role = 'guest' WHERE role = 'staff'"
    remove_check_constraint :users, name: "users_role_valid"
    add_check_constraint :users, "role IN ('guest', 'admin')", name: "users_role_valid"
  end
end
