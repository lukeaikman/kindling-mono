# Wave 2 Commit 1, migration 7/8.
#
# Will-from-day-one: every User gets an empty draft Will the moment their
# row is created (anonymous or registered). `version` increments per
# subsequent revision; `supersedes_id` points at the prior version.
# Partial unique index on `status = 'active'` enforces "one active Will
# per User" without preventing draft + active to coexist during edits.
class CreateWills < ActiveRecord::Migration[8.1]
  def change
    create_table :wills do |t|
      t.references :user, foreign_key: true, null: false
      t.integer :version, null: false, default: 1
      t.string :status, null: false, default: "draft"
      t.references :supersedes, foreign_key: { to_table: :wills }, null: true
      t.datetime :finalized_at
      t.timestamps
    end

    add_index :wills, [ :user_id, :version ], unique: true
    add_index :wills, :user_id,
      unique: true,
      where: "status = 'active'",
      name: "index_wills_on_active"
  end
end
