# Wave 2 Commit 2 — anonymous-from-day-one User.
#
# Every visitor that engages with the app gets a User row, anonymous at first
# (no email, no password, identified only by a signed cookie carrying a
# plaintext token; the DB stores `token_digest` for cookie-leak resistance).
# When the user reaches the secure-account step they upgrade in place: the
# same User gets `email_address` + `password_digest` set and `current_step`
# completes. No data migration between rows.
#
# A draft Will is created alongside every User via `after_create`, so
# downstream features (Bequest, BequestAllocation, etc.) always have a
# parent record to attach to.
#
# Backward-compat note: legacy callers (api/v1/auth_controller, admin
# views, password reset flow) still reference `User.first_name` /
# `User.last_name` on the legacy columns. Those columns persist for now —
# Commit 3 swaps the onboarding writes to populate the will-maker `Person`
# instead, and a follow-up commit (or PRE_LAUNCH cleanup) will drop the
# legacy columns once nothing reads them.
class User < ApplicationRecord
  has_secure_password validations: false

  has_many :sessions, dependent: :destroy
  has_many :api_sessions, dependent: :destroy
  has_many :devices, dependent: :destroy

  # New unified-shape associations.
  has_many :people, dependent: :destroy
  belongs_to :will_maker_person, class_name: "Person", optional: true
  has_one :spouse_person, -> { where(relationship_kind: "spouse") },
    class_name: "Person", inverse_of: :user

  has_many :wills, dependent: :destroy
  has_one :active_will, -> { where(status: "active") }, class_name: "Will"
  has_one :draft_will, -> { where(status: "draft") }, class_name: "Will"

  # Q1: cookie carries plaintext token, DB stores SHA256 digest. The
  # plaintext is exposed via attr_accessor only between create and the
  # request that returns the cookie — never persisted as plaintext.
  attr_accessor :token

  encrypts :email_address, deterministic: true
  normalizes :email_address, with: ->(e) { e.to_s.strip.downcase.presence }

  # Email + password validations only fire in the :register context, i.e.
  # when the User upgrades from anonymous to registered. Anonymous Users
  # save fine without these.
  validates :email_address,
    presence: true,
    uniqueness: { case_sensitive: false },
    format: { with: /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/ },
    on: :register
  validate :password_complexity, on: :register, if: -> { password.present? }

  # `has_secure_password validations: false` dropped the built-in
  # password_confirmation matcher. Re-add it for password-reset and
  # account-creation flows that pass `password_confirmation`.
  validates :password, confirmation: true, if: -> { password.present? && !password_confirmation.nil? }

  before_create :assign_token
  after_create :create_initial_will

  enum :status, { active: "active", locked: "locked", suspended: "suspended" }, default: "active"

  # === State predicates ===

  def anonymous?
    email_address.blank?
  end

  def registered?
    email_address.present?
  end

  # === Auth ===

  def self.authenticate_by(email_address:, password:)
    return nil if email_address.blank? || password.blank?

    normalised = email_address.to_s.strip.downcase
    user = where.not(email_address: nil).find_by(email_address: normalised)
    return nil if user.nil? || user.password_digest.blank?

    user.authenticate(password) ? user : nil
  end

  # Find an *anonymous* User by their cookie token. Registered Users sign in
  # via the standard session flow, not the cookie token. The email_address: nil
  # filter prevents a stolen cookie from authenticating into a registered
  # account.
  def self.find_by_cookie_token(plaintext)
    return nil if plaintext.blank?

    digest = Digest::SHA256.hexdigest(plaintext)
    find_by(token_digest: digest, email_address: nil)
  end

  # === Onboarding step predicates (Q7 inlined) ===
  #
  # Each predicate reads the will-maker Person — Commit 3 will populate it
  # via the controller refactor. Until then, anonymous Users have
  # `will_maker_person` nil, so the predicates return false and
  # `first_incomplete_path` correctly returns the welcome step.

  def first_incomplete_path
    helpers = Rails.application.routes.url_helpers
    return helpers.mobile_onboarding_welcome_path        unless welcome_complete?
    return helpers.mobile_onboarding_location_path       unless location_complete?
    return helpers.mobile_onboarding_family_path         unless family_complete?
    return helpers.mobile_onboarding_extended_family_path unless extended_family_complete?

    helpers.mobile_onboarding_wrap_up_path
  end

  def welcome_complete?
    will_maker_person.present? &&
      will_maker_person.first_name.present? &&
      will_maker_person.last_name.present? &&
      will_maker_person.date_of_birth.present?
  end

  def location_complete?
    will_maker_person.present? &&
      will_maker_person.country_of_residence.present? &&
      will_maker_person.nationality.present? &&
      will_maker_person.domiciled_in_uk.present? &&
      will_maker_person.currently_resident_in_uk.present?
  end

  # Family + extended-family completeness aren't simple field-presence checks
  # — the rules involve partner shape, child rows, etc. Until Commit 3 wires
  # those in, we lean on `current_step` as the source of truth. Once the
  # OnboardingController refactor lands these can be rewritten field-first.
  def family_complete?
    current_step.in?(%w[extended_family wrap_up]) || completed_at.present?
  end

  def extended_family_complete?
    current_step == "wrap_up" || completed_at.present?
  end

  # === Lifecycle ===

  def inactive_for_more_than?(duration)
    last_seen_at.present? && last_seen_at < duration.ago
  end

  def touch_last_seen!
    update_column(:last_seen_at, Time.current)
  end

  # === Display ===
  #
  # Prefer the will-maker Person's name once it exists; fall back to the
  # legacy User columns. Lets old callers (admin dashboard, api/v1/auth)
  # keep rendering during the transition.
  def full_name
    will_maker_person&.full_name.presence ||
      [ first_name, last_name ].compact_blank.join(" ").presence ||
      ""
  end

  private

  def assign_token
    self.token = SecureRandom.hex(32)
    self.token_digest = Digest::SHA256.hexdigest(token)
  end

  def create_initial_will
    wills.create!(version: 1, status: "draft")
  end

  def password_complexity
    return if password.length >= 12 && password.match?(/[A-Za-z]/) && password.match?(/\d/)
    errors.add(:password, "must be at least 12 characters and include letters and numbers")
  end
end
