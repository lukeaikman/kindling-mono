# Wave 2 Commit 2.
#
# Typed parent-child relationship. `kind` distinguishes biological from
# adoptive/step/foster — material for inheritance law (e.g. step-children
# aren't automatic legal heirs in England & Wales). The same child Person
# can have multiple Parentage rows for different parents of different kinds.
class Parentage < ApplicationRecord
  KINDS = %w[biological adoptive step foster].freeze

  belongs_to :parent_person, class_name: "Person"
  belongs_to :child_person, class_name: "Person"

  validates :kind, presence: true, inclusion: { in: KINDS }
end
