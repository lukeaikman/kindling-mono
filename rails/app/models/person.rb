# Wave 2 Commit 2.
#
# Master record for everyone the will-maker mentions: themselves
# (`relationship_kind = "self"`), spouse/partner, children, co-parents,
# parents-in-law, etc. Per-User uniqueness on the will-maker (`self`) and
# spouse rows is enforced via partial indexes (see CreatePeople migration).
#
# All PII columns are encrypted with deterministic AR encryption — required
# so the model can still query/index on them (e.g. de-duping a co-parent
# across multiple children's records), at the cost of being weaker than
# non-deterministic. PRE_LAUNCH_TODO tracks tightening selected columns to
# non-deterministic before launch.
class Person < ApplicationRecord
  RELATIONSHIP_KINDS = %w[
    self spouse child co_parent parent parent_in_law sibling
    friend professional other
  ].freeze

  belongs_to :user

  has_one :marriage_as_will_maker, class_name: "Marriage",
    foreign_key: :will_maker_person_id, dependent: :destroy
  has_one :marriage_as_partner, class_name: "Marriage",
    foreign_key: :partner_person_id, dependent: :destroy

  has_many :outbound_parentages, class_name: "Parentage",
    foreign_key: :parent_person_id, dependent: :destroy
  has_many :inbound_parentages, class_name: "Parentage",
    foreign_key: :child_person_id, dependent: :destroy
  has_many :children_via_parentage, through: :outbound_parentages, source: :child_person
  has_many :parents_via_parentage, through: :inbound_parentages, source: :parent_person

  encrypts :first_name, :middle_names, :last_name,
           :email, :phone,
           :address_line_1, :address_line_2, :city, :postcode,
           deterministic: true
  encrypts :date_of_birth, deterministic: true

  validates :relationship_kind, presence: true, inclusion: { in: RELATIONSHIP_KINDS }
  validates :times_divorced, :times_widowed,
    numericality: { greater_than_or_equal_to: 0, only_integer: true }

  def full_name
    [ first_name, last_name ].compact_blank.join(" ").presence
  end
end
