class OnboardingSession < ApplicationRecord
  COOKIE_KEY = "mobile_onboarding_session_token".freeze
  STEP_PATHS = {
    welcome: "/mobile/onboarding/welcome",
    location: "/mobile/onboarding/location",
    family: "/mobile/onboarding/family",
    extended_family: "/mobile/onboarding/extended-family",
    wrap_up: "/mobile/onboarding/wrap-up"
  }.freeze
  PARTNER_STATUSES = %w[married civil-partnership cohabiting].freeze
  COUNTRY_LABELS = {
    "england" => "England",
    "wales" => "Wales",
    "scotland" => "Scotland",
    "northern_ireland" => "Northern Ireland"
  }.freeze
  NATIONALITY_LABELS = {
    "british" => "British",
    "american" => "American",
    "canadian" => "Canadian",
    "australian" => "Australian",
    "other" => "Other"
  }.freeze

  serialize :children_payload, coder: JSON

  before_validation :ensure_token, on: :create
  before_validation :ensure_last_seen_at, on: :create
  before_validation :reset_widowed_count_when_not_widowed

  validates :token, presence: true, uniqueness: true
  validates :times_divorced, :times_widowed,
    numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  with_options on: :welcome_step do
    validates :first_name, :last_name, :date_of_birth, presence: true
    validate :date_of_birth_within_supported_range
  end

  with_options on: :location_step do
    validates :country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk, presence: true
  end

  with_options on: :family_step do
    validates :relationship_status, :has_children, presence: true
    validate :partner_details_if_required
    validate :partner_started_at_required_when_cohabiting
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
      has_children.present? &&
      partner_details_complete? &&
      partner_started_at_complete? &&
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

  # Display name for partner — used by the per-child co-parent radio's smart
  # labelling ("Yes, with Sarah" / fallback). Stimulus also live-updates on
  # partner-name edits, but server-side render needs a string too.
  def partner_display_name
    spouse_first_name.presence || partner_kind_fallback
  end

  # Possessive form for piping into labels — e.g. the parents-in-law question
  # "Are either of [Sarah's / your spouse's / your civil partner's / your
  # partner's] parents still alive?". Uses curly apostrophe to match existing
  # typography. Returns nil when not partnered.
  def partner_possessive_label
    return nil unless has_partner?
    "#{partner_display_name}’s"
  end

  # Structured facts piped into the wrap-up screen. Returns an array of
  # `{label:, value:}` hashes — view renders as a definition list. Built once
  # the session is far enough through onboarding that all the gates have
  # been answered (wrap-up is only reached when extended_family_complete?).
  def summary_facts
    facts = [ you_fact, location_fact, relationship_fact ]
    facts << children_fact if has_children == "yes"
    facts << parents_fact
    facts << parents_in_law_fact if has_partner?
    facts << siblings_fact
    facts.compact
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

  def reset_widowed_count_when_not_widowed
    self.times_widowed = 0 if relationship_status.present? && relationship_status != "widowed"
  end

  def apply_startup_hash(attribution)
    self.attribution_source = attribution["source"]
    self.campaign = attribution["campaign"]
    self.location_id = attribution["location_id"]
    self.raw_url = attribution["raw_url"]
    self.video_intro_version = positive_version(attribution["show_video"])
    self.risk_questionnaire_version = positive_version(attribution["show_risk_questionnaire"])
    self.first_show = attribution["first_show"]
    self.last_seen_at = Time.current
  end

  def positive_version(value)
    value.to_i.positive? ? value.to_i : nil
  end

  def partner_details_complete?
    !has_partner? || (spouse_first_name.present? && spouse_last_name.present?)
  end

  def partner_started_at_complete?
    return true unless relationship_status == "cohabiting"
    partner_started_at.present?
  end

  def children_section_complete?
    return true if has_children == "no"

    children = children_payload
    children.any? && children.all? do |child|
      child["first_name"].present? &&
        child["last_name"].present? &&
        child["relationship"].present? &&
        %w[yes no].include?(child["disabled_answer"]) &&
        %w[yes no].include?(child["lacks_mental_capacity_answer"]) &&
        co_parent_complete?(child)
    end
  end

  # Per-child co-parent answers must be coherent. The radio answer comes in as
  # `co_parent_type`; sub-fields (relationship-to-child, someone-else's name)
  # depend on the type.
  def co_parent_complete?(child)
    type = child["co_parent_type"]
    return true if type.blank?  # not yet answered → bubbles up via children_section_complete

    case type
    when "yes_with_partner"
      has_partner? && child["co_parent_partner_relationship_to_child"].present?
    when "yes_with_other"
      child["co_parent_other_first_name"].present? &&
        child["co_parent_other_last_name"].present? &&
        child["co_parent_other_relationship_to_child"].present?
    when "no_deceased", "no_sole"
      true
    else
      false
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

  def partner_started_at_required_when_cohabiting
    return if partner_started_at_complete?

    errors.add(:partner_started_at, "is required when cohabiting")
  end

  def children_payload_for_family_step
    return if children_section_complete?

    errors.add(:children_payload, "must include disability, mental capacity, and shared-responsibility answers for each child")
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
        "capacity_status" => raw["capacity_status"].presence || "under-18",
        "disabled_answer" => raw["disabled_answer"].presence,
        "disabled" => raw["disabled_answer"] == "yes",
        "lacks_mental_capacity_answer" => raw["lacks_mental_capacity_answer"].presence,
        "lacks_mental_capacity" => raw["lacks_mental_capacity_answer"] == "yes",
        # New co-parent capture (replaces the prior responsibility / co_guardian
        # fields). `co_parent_type` is one of:
        #   yes_with_partner | yes_with_other | no_deceased | no_sole
        # Sub-fields populated based on the type chosen.
        "co_parent_type" => raw["co_parent_type"].presence,
        "co_parent_partner_relationship_to_child" => raw["co_parent_partner_relationship_to_child"].presence,
        "co_parent_other_first_name" => raw["co_parent_other_first_name"].to_s.strip.presence,
        "co_parent_other_last_name" => raw["co_parent_other_last_name"].to_s.strip.presence,
        "co_parent_other_relationship_to_child" => raw["co_parent_other_relationship_to_child"].presence
      }.compact

      next if normalized.except("id", "relationship", "capacity_status", "disabled", "lacks_mental_capacity").empty?

      normalized
    end
  end

  def partner_kind_fallback
    case relationship_status
    when "married"
      "your spouse"
    when "civil-partnership"
      "your civil partner"
    when "cohabiting"
      "your partner"
    end
  end

  # ---- Wrap-up summary helpers (private — feed `summary_facts`) ----

  def you_fact
    name = "#{first_name} #{last_name}".strip
    parts = [ name.presence, formatted_birth_date ].compact
    { label: "You", value: parts.join(", born ") }
  end

  def location_fact
    parts = [ country_label, "#{nationality_label} citizen" ].compact_blank
    parts << "UK domiciled" if domiciled_in_uk == "yes"
    parts << "UK resident" if currently_resident_in_uk == "yes"
    { label: "Location", value: parts.join(" · ") }
  end

  def relationship_fact
    value =
      case relationship_status
      when "married"           then partner_phrase("Married to")
      when "civil-partnership" then partner_phrase("Civil partnership with")
      when "cohabiting"        then partner_phrase("Cohabiting with")
      when "single"            then "Single"
      when "divorced"          then divorced_phrase
      when "widowed"           then widowed_phrase
      else relationship_status.to_s.humanize.presence || "—"
      end
    { label: "Relationship", value: value }
  end

  def children_fact
    children = children_payload
    names = children.map { |c| c["first_name"].to_s.strip.presence }.compact
    count = children.size
    value =
      if names.any?
        names.join(", ")
      else
        "#{count} #{'child'.pluralize(count)}"
      end
    { label: "Children", value: value }
  end

  def parents_fact
    { label: "Parents", value: alive_label(parents_alive) }
  end

  def parents_in_law_fact
    { label: "In-laws", value: alive_label(parents_in_law_alive) }
  end

  def siblings_fact
    value =
      if siblings_alive == "yes"
        n = number_of_siblings.to_i
        "#{n} #{'sibling'.pluralize(n)}"
      else
        "None"
      end
    { label: "Siblings", value: value }
  end

  def partner_phrase(prefix)
    full = "#{spouse_first_name} #{spouse_last_name}".strip
    full.present? ? "#{prefix} #{full}" : prefix.sub(/\s+(to|with)$/, "").strip
  end

  def divorced_phrase
    n = times_divorced.to_i
    n > 1 ? "Divorced (#{n} times)" : "Divorced"
  end

  def widowed_phrase
    n = times_widowed.to_i
    n > 1 ? "Widowed (#{n} times)" : "Widowed"
  end

  def alive_label(value)
    case value
    when "both"      then "Both alive"
    when "one-alive" then "One alive"
    when "no"        then "Neither alive"
    else value.to_s.humanize.presence || "—"
    end
  end

  def country_label
    return nil if country_of_residence.blank?
    COUNTRY_LABELS.fetch(country_of_residence, country_of_residence.humanize)
  end

  def nationality_label
    return nil if nationality.blank?
    NATIONALITY_LABELS.fetch(nationality, nationality.humanize)
  end

  def formatted_birth_date
    return nil if date_of_birth.blank?
    date_of_birth.strftime("%-d %B %Y")
  end
end
