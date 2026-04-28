# Wave 2 Commit 1, migration 4/8.
#
# Convenience pointer from User to the Person row that represents *them*
# (relationship_kind = "self"). Nullable: anonymous Users created on the
# intro-continue action don't yet have a will-maker Person; that's set
# when they complete the welcome step.
class AddWillMakerPersonIdToUsers < ActiveRecord::Migration[8.1]
  def change
    add_reference :users, :will_maker_person,
      foreign_key: { to_table: :people }, null: true
  end
end
