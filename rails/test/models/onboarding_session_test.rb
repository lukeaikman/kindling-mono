require "test_helper"

class OnboardingSessionTest < ActiveSupport::TestCase
  test "startup destination reuses startup routing rules from draft fields" do
    onboarding_session = OnboardingSession.new(video_intro_version: 1, risk_questionnaire_version: 1, first_show: "risk_questionnaire")

    assert_equal "/mobile/risk-questionnaire", onboarding_session.startup_destination

    onboarding_session.video_completed_at = Time.current
    assert_equal "/mobile/risk-questionnaire", onboarding_session.startup_destination

    onboarding_session.questionnaire_completed_at = Time.current
    assert_equal "/mobile/intro", onboarding_session.startup_destination
  end

  test "first incomplete path advances through the onboarding steps" do
    onboarding_session = OnboardingSession.new
    assert_equal "/mobile/onboarding/welcome", onboarding_session.first_incomplete_path

    onboarding_session.assign_attributes(first_name: "Luke", last_name: "Aikman", date_of_birth: Date.new(1988, 1, 1))
    assert_equal "/mobile/onboarding/location", onboarding_session.first_incomplete_path

    onboarding_session.assign_attributes(country_of_residence: "england", nationality: "british", domiciled_in_uk: "yes", currently_resident_in_uk: "yes")
    assert_equal "/mobile/onboarding/family", onboarding_session.first_incomplete_path

    onboarding_session.assign_attributes(relationship_status: "single", divorce_status: "no", has_children: "no")
    assert_equal "/mobile/onboarding/extended-family", onboarding_session.first_incomplete_path
  end

  test "family step requires child disability, mental capacity, and shared-responsibility answers" do
    onboarding_session = OnboardingSession.new(
      relationship_status: "single",
      has_children: "yes",
      children_payload: [
        {
          "first_name" => "Alex",
          "last_name" => "Aikman",
          "relationship" => "biological-child",
          "capacity_status" => "under-18"
        }
      ]
    )

    assert_not onboarding_session.valid?(:family_step)
    assert_includes onboarding_session.errors[:children_payload],
      "must include disability, mental capacity, and shared-responsibility answers for each child"
  end

  test "partner_display_name uses partner first name when present" do
    onboarding_session = OnboardingSession.new(
      relationship_status: "civil-partnership",
      spouse_first_name: "Alex"
    )

    assert_equal "Alex", onboarding_session.partner_display_name
  end

  test "partner_display_name falls back to relationship-kind phrase when name blank" do
    onboarding_session = OnboardingSession.new(relationship_status: "married")
    assert_equal "your spouse", onboarding_session.partner_display_name

    onboarding_session.relationship_status = "civil-partnership"
    assert_equal "your civil partner", onboarding_session.partner_display_name

    onboarding_session.relationship_status = "cohabiting"
    assert_equal "your partner", onboarding_session.partner_display_name
  end

  test "co_parent yes_with_partner without partner_relationship_to_child is incomplete" do
    onboarding_session = OnboardingSession.new(
      relationship_status: "married",
      spouse_first_name: "Sarah",
      spouse_last_name: "Smith",
      has_children: "yes",
      children_payload: [
        {
          "first_name" => "Charlie",
          "last_name" => "Smith",
          "relationship" => "biological-child",
          "capacity_status" => "under-18",
          "disabled_answer" => "no",
          "lacks_mental_capacity_answer" => "no",
          "co_parent_type" => "yes_with_partner"
          # NB: no co_parent_partner_relationship_to_child
        }
      ]
    )

    assert_not onboarding_session.valid?(:family_step)
  end

  test "co_parent yes_with_other requires name + relationship-to-child" do
    onboarding_session = OnboardingSession.new(
      relationship_status: "single",
      has_children: "yes",
      children_payload: [
        {
          "first_name" => "Charlie",
          "last_name" => "Smith",
          "relationship" => "biological-child",
          "capacity_status" => "under-18",
          "disabled_answer" => "no",
          "lacks_mental_capacity_answer" => "no",
          "co_parent_type" => "yes_with_other",
          "co_parent_other_first_name" => "Bob",
          "co_parent_other_last_name" => "Jones"
          # NB: no co_parent_other_relationship_to_child
        }
      ]
    )

    assert_not onboarding_session.valid?(:family_step)
  end

  test "co_parent no_sole / no_deceased / yes_with_other-with-all-fields are valid" do
    base = {
      token: SecureRandom.hex(24),
      relationship_status: "single",
      has_children: "yes"
    }
    base_child = {
      "first_name" => "Charlie",
      "last_name" => "Smith",
      "relationship" => "biological-child",
      "capacity_status" => "under-18",
      "disabled_answer" => "no",
      "lacks_mental_capacity_answer" => "no"
    }

    %w[no_sole no_deceased].each do |answer|
      session = OnboardingSession.new(base.merge(token: SecureRandom.hex(24), children_payload: [base_child.merge("co_parent_type" => answer)]))
      assert session.valid?(:family_step), "expected #{answer} to be valid (errors: #{session.errors.full_messages})"
    end

    fully_specified = base_child.merge(
      "co_parent_type" => "yes_with_other",
      "co_parent_other_first_name" => "Bob",
      "co_parent_other_last_name" => "Jones",
      "co_parent_other_relationship_to_child" => "biological"
    )
    session = OnboardingSession.new(base.merge(token: SecureRandom.hex(24), children_payload: [fully_specified]))
    assert session.valid?(:family_step), "expected yes_with_other (full) to be valid (errors: #{session.errors.full_messages})"
  end

  test "cohabiting requires partner_started_at on family step" do
    onboarding_session = OnboardingSession.new(
      token: SecureRandom.hex(24),
      relationship_status: "cohabiting",
      spouse_first_name: "Sam",
      spouse_last_name: "Partner",
      has_children: "no"
      # NB: no partner_started_at
    )

    assert_not onboarding_session.valid?(:family_step)
    assert_includes onboarding_session.errors[:partner_started_at], "is required when cohabiting"
  end

  test "married does not require partner_started_at" do
    onboarding_session = OnboardingSession.new(
      token: SecureRandom.hex(24),
      relationship_status: "married",
      spouse_first_name: "Sarah",
      spouse_last_name: "Smith",
      has_children: "no"
    )

    assert onboarding_session.valid?(:family_step), "errors: #{onboarding_session.errors.full_messages}"
  end

  test "times_widowed resets to 0 when relationship_status is not widowed" do
    onboarding_session = OnboardingSession.new(
      relationship_status: "married",
      times_widowed: 3
    )
    onboarding_session.valid?  # triggers before_validation
    assert_equal 0, onboarding_session.times_widowed
  end

  test "partner_possessive_label uses spouse name with curly apostrophe" do
    onboarding_session = OnboardingSession.new(
      relationship_status: "married",
      spouse_first_name: "Sarah"
    )
    assert_equal "Sarah’s", onboarding_session.partner_possessive_label
  end

  test "partner_possessive_label falls back to relationship-kind phrase" do
    onboarding_session = OnboardingSession.new(relationship_status: "civil-partnership")
    assert_equal "your civil partner’s", onboarding_session.partner_possessive_label

    onboarding_session.relationship_status = "cohabiting"
    assert_equal "your partner’s", onboarding_session.partner_possessive_label

    onboarding_session.relationship_status = "married"
    assert_equal "your spouse’s", onboarding_session.partner_possessive_label
  end

  test "partner_possessive_label is nil when not partnered" do
    onboarding_session = OnboardingSession.new(relationship_status: "single")
    assert_nil onboarding_session.partner_possessive_label

    onboarding_session.relationship_status = "divorced"
    assert_nil onboarding_session.partner_possessive_label
  end

  test "summary_facts includes married partner phrase and child names" do
    onboarding_session = OnboardingSession.new(
      first_name: "Luke",
      last_name: "Aikman",
      date_of_birth: Date.new(1988, 1, 1),
      country_of_residence: "england",
      nationality: "british",
      domiciled_in_uk: "yes",
      currently_resident_in_uk: "yes",
      relationship_status: "married",
      spouse_first_name: "Sarah",
      spouse_last_name: "Aikman",
      has_children: "yes",
      children_payload: [
        { "first_name" => "Charlie", "last_name" => "Aikman", "relationship" => "biological-child", "capacity_status" => "under-18" },
        { "first_name" => "Alex",    "last_name" => "Aikman", "relationship" => "biological-child", "capacity_status" => "under-18" }
      ],
      parents_alive: "both",
      parents_in_law_alive: "one-alive",
      siblings_alive: "yes",
      number_of_siblings: 2
    )

    facts = onboarding_session.summary_facts.index_by { |fact| fact[:label] }

    assert_equal "Luke Aikman, born 1 January 1988", facts["You"][:value]
    assert_equal "England · British citizen · UK domiciled · UK resident", facts["Location"][:value]
    assert_equal "Married to Sarah Aikman", facts["Relationship"][:value]
    assert_equal "Charlie, Alex", facts["Children"][:value]
    assert_equal "Both alive", facts["Parents"][:value]
    assert_equal "One alive", facts["In-laws"][:value]
    assert_equal "2 siblings", facts["Siblings"][:value]
  end

  test "summary_facts hides children block when none, hides in-laws when not partnered" do
    onboarding_session = OnboardingSession.new(
      first_name: "Luke",
      last_name: "Aikman",
      date_of_birth: Date.new(1988, 1, 1),
      country_of_residence: "wales",
      nationality: "british",
      domiciled_in_uk: "yes",
      currently_resident_in_uk: "yes",
      relationship_status: "single",
      has_children: "no",
      parents_alive: "no",
      siblings_alive: "no"
    )

    labels = onboarding_session.summary_facts.map { |fact| fact[:label] }
    assert_equal %w[You Location Relationship Parents Siblings], labels

    facts = onboarding_session.summary_facts.index_by { |fact| fact[:label] }
    assert_equal "Single", facts["Relationship"][:value]
    assert_equal "Neither alive", facts["Parents"][:value]
    assert_equal "None", facts["Siblings"][:value]
  end

  test "summary_facts pluralises divorced/widowed counts above one" do
    onboarding_session = OnboardingSession.new(
      first_name: "Luke",
      last_name: "Aikman",
      date_of_birth: Date.new(1988, 1, 1),
      country_of_residence: "england",
      nationality: "british",
      domiciled_in_uk: "yes",
      currently_resident_in_uk: "yes",
      relationship_status: "divorced",
      times_divorced: 2,
      has_children: "no",
      parents_alive: "both",
      siblings_alive: "no"
    )

    facts = onboarding_session.summary_facts.index_by { |fact| fact[:label] }
    assert_equal "Divorced (2 times)", facts["Relationship"][:value]
  end

  test "inactive_for_more_than returns true for stale drafts" do
    onboarding_session = OnboardingSession.new(last_seen_at: 4.hours.ago)

    assert onboarding_session.inactive_for_more_than?(3.hours)
    assert_not onboarding_session.inactive_for_more_than?(5.hours)
  end
end
