# Wave 2 Commit 3a addendum.
#
# Parentage rows for children carry a `position` integer so the family-step
# form can preserve card order across re-renders (validation failure + edit).
# v4 plan implied this column existed; the 2026-04-28 migration round
# missed it. Default 0 — order is assigned at write time by sync_children!.
class AddPositionToParentages < ActiveRecord::Migration[8.1]
  def change
    add_column :parentages, :position, :integer, null: false, default: 0
    add_index :parentages, [ :parent_person_id, :position ]
  end
end
