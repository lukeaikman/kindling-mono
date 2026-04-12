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

  test "family step requires child disability and mental capacity answers" do
    onboarding_session = OnboardingSession.new(
      relationship_status: "single",
      divorce_status: "no",
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
    assert_includes onboarding_session.errors[:children_payload], "must include disability and mental capacity answers for each child"
  end

  test "partnered users default child responsibility to co-guardianship with partner first name" do
    onboarding_session = OnboardingSession.new(
      relationship_status: "civil-partnership",
      spouse_first_name: "Alex"
    )

    assert_equal "co-responsibility-with-spouse", onboarding_session.default_child_responsibility
    assert_equal [
      ["Co-guardianship with Alex", "co-responsibility-with-spouse"],
      ["Sole guardianship", "sole-responsibility"],
      ["Add guardian", "add-co-guardian"]
    ], onboarding_session.child_responsibility_options
  end

  test "inactive_for_more_than returns true for stale drafts" do
    onboarding_session = OnboardingSession.new(last_seen_at: 4.hours.ago)

    assert onboarding_session.inactive_for_more_than?(3.hours)
    assert_not onboarding_session.inactive_for_more_than?(5.hours)
  end
end
