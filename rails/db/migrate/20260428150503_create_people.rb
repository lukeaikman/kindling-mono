# Wave 2 Commit 1, migration 3/8.
#
# `people` is the master table for everyone the will-maker mentions:
# themselves (relationship_kind = "self"), their spouse/partner, children,
# co-parents, etc. Per-User uniqueness on the will-maker and spouse rows
# is enforced via partial indexes.
#
# PII columns (first_name, addresses, etc.) are encrypted in the model layer
# via `encrypts ..., deterministic: true` (added in Commit 2). Deterministic
# encryption is required so we can still query/index/uniq those columns.
class CreatePeople < ActiveRecord::Migration[8.1]
  def change
    create_table :people do |t|
      t.references :user, foreign_key: true, null: false
      t.string :relationship_kind, null: false, default: "other"
      t.integer :position, null: false, default: 0
      t.string :first_name
      t.string :middle_names
      t.string :last_name
      t.date :date_of_birth
      t.string :email
      t.string :phone
      t.string :address_line_1
      t.string :address_line_2
      t.string :city
      t.string :postcode
      t.string :country_of_residence
      t.string :nationality
      t.string :domiciled_in_uk
      t.string :currently_resident_in_uk
      t.boolean :disabled, null: false, default: false
      t.boolean :lacks_mental_capacity, null: false, default: false
      t.integer :times_divorced, null: false, default: 0
      t.integer :times_widowed, null: false, default: 0
      t.string :parents_alive
      t.string :parents_in_law_alive
      t.string :siblings_alive
      t.integer :number_of_siblings
      t.timestamps
    end

    # One will-maker Person per User; one spouse Person per User.
    add_index :people, :user_id,
      unique: true,
      where: "relationship_kind = 'self'",
      name: "index_people_on_user_will_maker"

    add_index :people, :user_id,
      unique: true,
      where: "relationship_kind = 'spouse'",
      name: "index_people_on_user_spouse"
  end
end
