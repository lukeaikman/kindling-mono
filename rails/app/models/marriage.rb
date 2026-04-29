# Wave 2 Commit 2.
#
# Typed partnership row between will-maker and partner. `phase` distinguishes
# active partnerships from historic ones (separated/divorced/widowed).
# Partial unique index on `phase = 'active'` enforces "one current
# partnership per will-maker"; previous marriages keep an `ended` row each.
class Marriage < ApplicationRecord
  KINDS = %w[married civil_partnership cohabiting].freeze
  PHASES = %w[active separated divorced widowed].freeze

  belongs_to :will_maker_person, class_name: "Person"
  belongs_to :partner_person, class_name: "Person"

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :phase, presence: true, inclusion: { in: PHASES }
  validate :started_at_required_when_cohabiting

  private

  # Cohabiting partnerships need a start date (UK inheritance law uses it
  # to establish the cohabitation period). Married / civil-partnership
  # rows can record the wedding/registration date but it isn't required.
  def started_at_required_when_cohabiting
    return unless kind == "cohabiting" && phase == "active"
    return if started_at.present?
    errors.add(:started_at, "is required when cohabiting")
  end
end
