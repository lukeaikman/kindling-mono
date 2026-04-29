# Wave 2 Commit 2 (extended in Commit 3a).
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
#
# Per-step validation contexts (`:welcome_step`, `:location_step`,
# `:extended_family_step`, `:family_step`) gate which fields must be set
# at which onboarding stage. The OnboardingController calls
# `person.save!(context: :welcome_step)` etc. The `with_options` blocks
# below mirror the OnboardingSession-era pattern.
class Person < ApplicationRecord
  RELATIONSHIP_KINDS = %w[
    self spouse child co_parent parent parent_in_law sibling
    friend professional other
  ].freeze

  belongs_to :user

  # B1 fix: Person has_many marriages, not has_one. The partial unique
  # index on `phase = 'active'` enforces "one active" — historic marriages
  # accumulate as additional rows.
  has_many :marriages_as_will_maker, class_name: "Marriage",
    foreign_key: :will_maker_person_id, dependent: :destroy
  has_many :marriages_as_partner, class_name: "Marriage",
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
  # NB: date_of_birth deliberately NOT encrypted in this commit. AR's
  # `encrypts` serialises the column value as a JSON envelope which won't
  # round-trip through Postgres' `date` type. Encrypting it requires
  # changing the column type to `string` (or `text`) and parsing dates in
  # the model. Tracked as a PRE_LAUNCH item — a date_of_birth in plaintext
  # at rest is still PII we shouldn't ship publicly.

  validates :relationship_kind, presence: true, inclusion: { in: RELATIONSHIP_KINDS }
  validates :times_divorced, :times_widowed,
    numericality: { greater_than_or_equal_to: 0, only_integer: true }

  with_options on: :welcome_step do
    validates :first_name, :last_name, :date_of_birth, presence: true
    validate :date_of_birth_within_supported_range
  end

  with_options on: :location_step do
    validates :country_of_residence, :nationality,
      :domiciled_in_uk, :currently_resident_in_uk, presence: true
  end

  with_options on: :extended_family_step do
    validates :parents_alive, :siblings_alive, presence: true
    validates :parents_in_law_alive, presence: true, if: :will_maker_with_active_marriage?
    validates :number_of_siblings,
      numericality: { greater_than: 0, only_integer: true },
      if: :will_maker_with_siblings?
  end

  # Spouse + child + co_parent Persons need first/last name when their
  # row is being committed during the family step. (Self Person already
  # has these from welcome.) Co-parent's date_of_birth is optional.
  with_options on: :family_step do
    validates :first_name, :last_name, presence: true,
      if: -> { relationship_kind.in?(%w[spouse child co_parent]) }
  end

  def full_name
    [ first_name, last_name ].compact_blank.join(" ").presence
  end

  def will_maker?
    relationship_kind == "self"
  end

  # Used by validation context guards. The will-maker's parents_in_law_alive
  # is only required when they have an active partner (so an in-law set
  # exists to ask about); siblings_count is only required when they answered
  # yes to siblings_alive.
  def will_maker_with_active_marriage?
    will_maker? && user&.active_marriage.present?
  end

  def will_maker_with_siblings?
    will_maker? && siblings_alive == "yes"
  end

  private

  def date_of_birth_within_supported_range
    return if date_of_birth.blank?

    age = ((Time.zone.today - date_of_birth).to_i / 365.25).floor
    return if age.between?(18, 90)

    errors.add(:date_of_birth, "must reflect an age between 18 and 90")
  end
end
