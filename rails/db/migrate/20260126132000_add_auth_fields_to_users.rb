class AddAuthFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :phone, :string
    add_column :users, :status, :string, null: false, default: "active"
    add_column :users, :failed_login_count, :integer, null: false, default: 0
    add_column :users, :locked_until, :datetime
  end
end
class AddAuthFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :phone, :string
    add_column :users, :status, :string, null: false, default: "active"
    add_column :users, :failed_login_count, :integer, null: false, default: 0
    add_column :users, :locked_until, :datetime
  end
end
