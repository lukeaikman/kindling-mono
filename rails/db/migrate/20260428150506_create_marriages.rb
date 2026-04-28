# Wave 2 Commit 1, migration 6/8.
#
# Typed partnership row between will-maker and partner Person. `phase`
# tracks active vs ended; partial unique index on `phase = 'active'`
# enforces "one current partnership per will-maker".
#
# A user with previous marriages keeps an `ended` row per prior
# relationship — important for divorce-status / widowed history that
# affects estate planning.
class CreateMarriages < ActiveRecord::Migration[8.1]
  def change
    create_table :marriages do |t|
      t.references :will_maker_person, foreign_key: { to_table: :people }, null: false
      t.references :partner_person, foreign_key: { to_table: :people }, null: false
      t.string :kind, null: false   # married | civil_partnership | cohabiting
      t.string :phase, null: false, default: "active"
      t.date :started_at
      t.date :ended_at
      t.timestamps
    end

    add_check_constraint :marriages,
      "will_maker_person_id != partner_person_id",
      name: "marriages_distinct_persons"

    add_index :marriages,
      [ :will_maker_person_id, :partner_person_id ],
      unique: true,
      name: "index_marriages_on_pair"

    add_index :marriages,
      :will_maker_person_id,
      unique: true,
      where: "phase = 'active'",
      name: "index_marriages_on_active"
  end
end
