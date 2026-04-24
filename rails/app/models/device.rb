class Device < ApplicationRecord
  PLATFORMS = %w[ios android].freeze

  belongs_to :onboarding_session, optional: true
  belongs_to :user, optional: true

  validates :apns_token, presence: true, uniqueness: true
  validates :platform, inclusion: { in: PLATFORMS }
  validates :last_registered_at, presence: true
end
