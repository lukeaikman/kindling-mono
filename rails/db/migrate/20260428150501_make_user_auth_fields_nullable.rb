# Wave 2 Commit 1, migration 1/8.
#
# Lets a User exist anonymously (no email, no password) before they reach the
# secure-account step. Cookie identifies them by token_digest until then.
# Partial unique index keeps "one row per registered email" but allows many
# anonymous Users with NULL email_address.
class MakeUserAuthFieldsNullable < ActiveRecord::Migration[8.1]
  def change
    change_column_null :users, :email_address, true
    change_column_null :users, :password_digest, true
    remove_index :users, :email_address
    add_index :users, :email_address,
      unique: true,
      where: "email_address IS NOT NULL",
      name: "index_users_on_email_address_when_set"
  end
end
