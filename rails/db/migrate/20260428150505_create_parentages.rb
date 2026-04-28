# Wave 2 Commit 1, migration 5/8.
#
# Typed parent-child relationships. `kind` distinguishes biological from
# adoptive/step/foster, which matters for inheritance law (e.g. step
# children aren't automatic legal heirs in England & Wales). The same
# child Person can have multiple Parentage rows for different parents
# of different kinds.
class CreateParentages < ActiveRecord::Migration[8.1]
  def change
    create_table :parentages do |t|
      t.references :parent_person, foreign_key: { to_table: :people }, null: false
      t.references :child_person, foreign_key: { to_table: :people }, null: false
      t.string :kind, null: false  # biological | adoptive | step | foster
      t.timestamps
    end

    add_index :parentages, [ :parent_person_id, :child_person_id ], unique: true
    add_check_constraint :parentages,
      "parent_person_id != child_person_id",
      name: "parentages_distinct_persons"
  end
end
