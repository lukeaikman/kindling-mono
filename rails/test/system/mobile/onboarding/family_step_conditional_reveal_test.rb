require "application_system_test_case"

module Mobile
  class FamilyStepConditionalRevealTest < ApplicationSystemTestCase
    test "selecting Married reveals the partner-fields section, Yes-children reveals children" do
      # Start without an active marriage / children so the choice-groups render
      # uncollapsed (Capybara can't click options inside an is-collapsed group).
      seed_user_minimum

      visit_family_path

      # Initially: partner fields hidden, children section hidden
      assert_selector "[data-role='partner-fields']", visible: :hidden
      assert_selector "[data-role='children-section']", visible: :hidden

      # Pick Married — partner fields should appear
      choose "Married", allow_label_click: true, visible: :all
      assert_selector "[data-role='partner-fields']", visible: :visible

      # Pick Yes for has-children — children section should appear with at least one child card
      within "[data-role='has-children']" do
        choose "Yes", allow_label_click: true, visible: :all
      end
      assert_selector "[data-role='children-section']", visible: :visible
      assert_selector "[data-child-card]", minimum: 1
    end

    test "co-parent radio shows partner-name option only when partnered, with sub-field reveals" do
      user = seed_user_minimum
      will_maker = user.will_maker_person

      # Active marriage with Sarah
      spouse = user.people.create!(relationship_kind: "spouse", first_name: "Sarah", last_name: "Aikman")
      Marriage.create!(
        will_maker_person: will_maker,
        partner_person: spouse,
        kind: "married",
        phase: "active"
      )

      # One existing child Charlie (no co-parent picked yet)
      charlie = user.people.create!(relationship_kind: "child", first_name: "Charlie", last_name: "Aikman")
      Parentage.create!(parent_person: will_maker, child_person: charlie, kind: "biological", position: 0)

      visit_family_path

      # When partnered, the "Yes, with Sarah" option is present (smart partner label)
      assert_selector "input[value='yes_with_partner']", visible: :all
      assert_match "Yes, with Sarah", page.html

      # Sub-pickers start hidden
      assert_selector "[data-role='co-parent-partner-rel']", visible: :hidden
      assert_selector "[data-role='co-parent-other-fields']", visible: :hidden

      # Pick "Yes, with Sarah" — partner-rel sub-picker reveals
      within "[data-role='co-parent-type']" do
        choose "Yes, with Sarah", allow_label_click: true, visible: :all
      end
      assert_selector "[data-role='co-parent-partner-rel']", visible: :visible
      assert_selector "[data-role='co-parent-other-fields']", visible: :hidden
    end

    test "Add another button hidden until Child 1 first_name has content" do
      user = seed_user_minimum
      will_maker = user.will_maker_person

      # One unnamed child (so the empty form row renders, but no first_name yet)
      empty_child = user.people.create!(relationship_kind: "child")
      Parentage.create!(parent_person: will_maker, child_person: empty_child, kind: "biological", position: 0)

      visit_family_path

      # Add-another button is hidden initially — single empty child, "another" is misleading.
      assert_no_selector "[data-add-child]"

      first_card = find("[data-child-card]", match: :first)
      first_card.find("[data-role='child-first-name']").set("Charlie")

      assert_selector "[data-add-child]"
    end

    private

    # Build the minimum scaffolding the family step needs:
    # - OnboardingSession (still gating intro_seen + EntryRouting in the controller)
    # - User with the matching cookie + a will-maker Person filled out for welcome+location.
    def seed_user_minimum
      onboarding_session = OnboardingSession.create!(
        token: SecureRandom.hex(24),
        video_intro_version: 1, video_completed_at: Time.current, intro_seen_at: Time.current,
        first_name: "Luke", last_name: "Aikman", date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england", nationality: "british",
        domiciled_in_uk: "yes", currently_resident_in_uk: "yes"
      )

      user = User.create!(intro_seen_at: Time.current)
      person = user.people.create!(
        relationship_kind: "self",
        first_name: "Luke", last_name: "Aikman", date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england", nationality: "british",
        domiciled_in_uk: "yes", currently_resident_in_uk: "yes"
      )
      user.update!(will_maker_person: person)

      visit "/"
      add_signed_browser_cookie(OnboardingSession::COOKIE_KEY, onboarding_session.token)
      add_signed_browser_cookie(:user_token, user.token)

      user
    end

    def visit_family_path
      visit mobile_onboarding_family_path
    end

    def add_signed_browser_cookie(name, value)
      jar = ActionDispatch::TestRequest.create.cookie_jar
      jar.signed[name] = value
      page.driver.browser.manage.add_cookie(
        name: name.to_s,
        value: jar[name],
        path: "/"
      )
    end
  end
end
