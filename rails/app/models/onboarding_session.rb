class OnboardingSession < ApplicationRecord
  COOKIE_KEY = "mobile_onboarding_session_token".freeze
  FIRST_SHOW_DEFAULT = "video".freeze
  STEP_PATHS = {
    welcome: "/mobile/onboarding/welcome",
    location: "/mobile/onboarding/location",
    family: "/mobile/onboarding/family",
    extended_family: "/mobile/onboarding/extended-family",
    wrap_up: "/mobile/onboarding/wrap-up"
  }.freeze
  PARTNER_STATUSES = %w[married civil-partnership cohabiting].freeze

  serialize :children_payload, coder: JSON

  before_validation :ensure_token, on: :create
  before_validation :ensure_last_seen_at, on: :create
  before_validation :ensure_first_show, on: :create
  before_validation :ensure_divorce_default

  validates :token, presence: true, uniqueness: true

  with_options on: :welcome_step do
    validates :first_name, :last_name, :date_of_birth, presence: true
    validate :date_of_birth_within_supported_range
  end

  with_options on: :location_step do
    validates :country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk, presence: true
  end

  with_options on: :family_step do
    validates :relationship_status, :divorce_status, :has_children, presence: true
    validate :partner_details_if_required
    validate :children_payload_for_family_step
  end

  with_options on: :extended_family_step do
    validates :parents_alive, :siblings_alive, presence: true
    validate :parents_in_law_if_required
    validate :siblings_count_if_required
  end

  def children_payload
    super.presence || []
  end

  def children_payload=(value)
    super(normalize_children_payload(value))
  end

  def startup_configured?
    video_intro_version.present? || risk_questionnaire_version.present? || first_show.present?
  end

  def ensure_startup_defaults!
    return if startup_configured?

    apply_startup_hash(Mobile::StartupRouting.build_organic_attribution)
    save!
  end

  def apply_startup_attribution!(params_hash, raw_url:)
    return false if startup_configured?

    apply_startup_hash(
      Mobile::StartupRouting.build_attribution(params_hash.merge(raw_url: raw_url))
    )

    save!
    true
  end

  def startup_destination
    Mobile::StartupRouting.next_destination(
      attribution: startup_attribution,
      onboarding_state: startup_state
    )
  end

  def startup_attribution
    {
      "source" => attribution_source,
      "campaign" => campaign,
      "location_id" => location_id,
      "show_video" => video_intro_version,
      "show_risk_questionnaire" => risk_questionnaire_version,
      "first_show" => first_show,
      "raw_url" => raw_url
    }.compact
  end

  def startup_state
    {
      "video_completed" => video_completed_at.present?,
      "questionnaire_completed" => questionnaire_completed_at.present?
    }
  end

  def mark_video_completed!
    update!(video_completed_at: Time.current, last_seen_at: Time.current)
  end

  def mark_questionnaire_completed!
    update!(questionnaire_completed_at: Time.current, last_seen_at: Time.current)
  end

  def mark_intro_seen!
    update!(intro_seen_at: Time.current, last_seen_at: Time.current)
  end

  def intro_seen?
    intro_seen_at.present?
  end

  def completed?
    completed_at.present?
  end

  def inactive_for_more_than?(duration)
    reference_time = last_seen_at || created_at || Time.current
    reference_time < duration.ago
  end

  def touch_last_seen!
    update_column(:last_seen_at, Time.current)
  end

  def first_incomplete_path
    return STEP_PATHS[:welcome] unless welcome_complete?
    return STEP_PATHS[:location] unless location_complete?
    return STEP_PATHS[:family] unless family_complete?
    return STEP_PATHS[:extended_family] unless extended_family_complete?

    STEP_PATHS[:wrap_up]
  end

  def welcome_complete?
    first_name.present? && last_name.present? && date_of_birth.present? && age_allowed?
  end

  def location_complete?
    country_of_residence.present? &&
      nationality.present? &&
      domiciled_in_uk.present? &&
      currently_resident_in_uk.present?
  end

  def family_complete?
    relationship_status.present? &&
      divorce_status.present? &&
      has_children.present? &&
      partner_details_complete? &&
      children_section_complete?
  end

  def extended_family_complete?
    parents_alive.present? &&
      siblings_alive.present? &&
      (!has_partner? || parents_in_law_alive.present?) &&
      (siblings_alive == "no" || number_of_siblings.present?)
  end

  def has_partner?
    PARTNER_STATUSES.include?(relationship_status)
  end

  def default_child_responsibility
    has_partner? ? "co-responsibility-with-spouse" : "sole-responsibility"
  end

  def child_responsibility_options
    options = []
    options << ["Co-guardianship with #{partner_guardianship_name}", "co-responsibility-with-spouse"] if has_partner?
    options << ["Sole guardianship", "sole-responsibility"]
    options << ["Add guardian", "add-co-guardian"]
    options
  end

  def age_allowed?
    return false if date_of_birth.blank?

    age = ((Time.zone.today - date_of_birth).to_i / 365.25).floor
    age.between?(18, 90)
  end

  private

  def ensure_token
    self.token ||= SecureRandom.hex(24)
  end

  def ensure_last_seen_at
    self.last_seen_at ||= Time.current
  end

  def ensure_first_show
    self.first_show ||= FIRST_SHOW_DEFAULT
  end

  def ensure_divorce_default
    self.divorce_status = "no" if divorce_status.blank?
  end

  def partner_guardianship_name
    spouse_first_name.presence || partner_guardianship_fallback
  end

  def apply_startup_hash(attribution)
    self.attribution_source = attribution["source"]
    self.campaign = attribution["campaign"]
    self.location_id = attribution["location_id"]
    self.raw_url = attribution["raw_url"]
    self.video_intro_version = attribution["show_video"]
    self.risk_questionnaire_version = attribution["show_risk_questionnaire"]
    self.first_show = attribution["first_show"]
    self.last_seen_at = Time.current
  end

  def partner_details_complete?
    !has_partner? || (spouse_first_name.present? && spouse_last_name.present?)
  end

  def children_section_complete?
    return true if has_children == "no"

    children = children_payload
    children.any? && children.all? do |child|
      child["first_name"].present? &&
        child["last_name"].present? &&
        child["relationship"].present? &&
        %w[yes no].include?(child["disabled_answer"]) &&
        %w[yes no].include?(child["lacks_mental_capacity_answer"])
    end
  end

  def date_of_birth_within_supported_range
    return if date_of_birth.blank? || age_allowed?

    errors.add(:date_of_birth, "must reflect an age between 18 and 90")
  end

  def partner_details_if_required
    return if partner_details_complete?

    errors.add(:spouse_first_name, "is required") if spouse_first_name.blank?
    errors.add(:spouse_last_name, "is required") if spouse_last_name.blank?
  end

  def children_payload_for_family_step
    return if children_section_complete?

    errors.add(:children_payload, "must include disability and mental capacity answers for each child")
  end

  def parents_in_law_if_required
    return unless has_partner?
    return if parents_in_law_alive.present?

    errors.add(:parents_in_law_alive, "is required")
  end

  def siblings_count_if_required
    return unless siblings_alive == "yes"
    return if number_of_siblings.present?

    errors.add(:number_of_siblings, "is required")
  end

  def normalize_children_payload(value)
    records =
      case value
      when ActionController::Parameters
        value.to_unsafe_h.values
      when Hash
        value.values
      else
        Array(value)
      end

    records.filter_map do |child|
      next if child.blank?

      raw = child.respond_to?(:to_unsafe_h) ? child.to_unsafe_h : child.to_h
      next if raw.blank?

      normalized = {
        "id" => raw["id"].presence || SecureRandom.hex(6),
        "first_name" => raw["first_name"].to_s.strip,
        "last_name" => raw["last_name"].to_s.strip,
        "date_of_birth" => raw["date_of_birth"].presence,
        "relationship" => raw["relationship"].presence || "biological-child",
        "responsibility" => raw["responsibility"].presence || "sole-responsibility",
        "capacity_status" => raw["capacity_status"].presence || "under-18",
        "disabled_answer" => raw["disabled_answer"].presence,
        "disabled" => raw["disabled_answer"] == "yes",
        "lacks_mental_capacity_answer" => raw["lacks_mental_capacity_answer"].presence,
        "lacks_mental_capacity" => raw["lacks_mental_capacity_answer"] == "yes",
        "co_guardian_first_name" => raw["co_guardian_first_name"].to_s.strip.presence,
        "co_guardian_last_name" => raw["co_guardian_last_name"].to_s.strip.presence,
        "co_guardian_relationship" => raw["co_guardian_relationship"].to_s.strip.presence
      }.compact

      next if normalized.except("id", "relationship", "responsibility", "capacity_status", "disabled", "lacks_mental_capacity").empty?

      normalized
    end
  end

  def partner_guardianship_fallback
    case relationship_status
    when "married"
      "your spouse"
    when "civil-partnership"
      "your civil partner"
    when "cohabiting"
      "your partner"
    end
  end
end
