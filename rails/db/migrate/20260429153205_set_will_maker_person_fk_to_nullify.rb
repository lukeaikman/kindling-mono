# Wave 2 follow-up.
#
# Without ON DELETE SET NULL on the users → people FK, destroying a User
# with a will-maker Person fails: User#dependent_destroy walks `has_many
# :people` and calls Person#destroy on each, but the FK from
# users.will_maker_person_id still references the row being deleted, so
# Postgres rejects the delete.
#
# SET NULL lets the Person row drop cleanly; the User row's pointer goes
# nil moments before the User itself is deleted by Rails. Net effect:
# Motor Admin / console / cleanup-job / cascade all work uniformly.
class SetWillMakerPersonFkToNullify < ActiveRecord::Migration[8.1]
  def up
    remove_foreign_key :users, column: :will_maker_person_id
    add_foreign_key :users, :people, column: :will_maker_person_id, on_delete: :nullify
  end

  def down
    remove_foreign_key :users, column: :will_maker_person_id
    add_foreign_key :users, :people, column: :will_maker_person_id
  end
end
