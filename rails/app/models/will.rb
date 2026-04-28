# Wave 2 Commit 2.
#
# Will-from-day-one: every User gets an empty draft Will the moment their
# row is created (anonymous or registered). Subsequent revisions increment
# `version`; `supersedes_id` links to the prior version. Partial unique
# index on `status = 'active'` enforces "one active Will per User".
class Will < ApplicationRecord
  STATUSES = %w[draft active superseded].freeze

  belongs_to :user
  belongs_to :supersedes, class_name: "Will", optional: true
  has_one :superseded_by, class_name: "Will", foreign_key: :supersedes_id

  validates :version, presence: true,
    numericality: { greater_than: 0, only_integer: true }
  validates :status, presence: true, inclusion: { in: STATUSES }
end
