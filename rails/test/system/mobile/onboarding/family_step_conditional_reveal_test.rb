require "application_system_test_case"

module Mobile
  class FamilyStepConditionalRevealTest < ApplicationSystemTestCase
    test "selecting Married reveals the partner-fields section, Yes-children reveals children" do
      # Start with no relationship_status / has_children so the choice-groups
      # render uncollapsed (Capybara can't click options inside an is-collapsed group).
      session = OnboardingSession.create!(
        token: SecureRandom.hex(24),
        video_intro_version: 1, video_completed_at: Time.current, intro_seen_at: Time.current,
        first_name: "Luke", last_name: "Aikman", date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england", nationality: "british",
        domiciled_in_uk: "yes", currently_resident_in_uk: "yes"
      )

      # System tests use Selenium so we set the signed cookie via the driver.
      # First visit the host once to establish the cookie domain.
      visit "/"
      jar = ActionDispatch::TestRequest.create.cookie_jar
      jar.signed[OnboardingSession::COOKIE_KEY] = session.token
      page.driver.browser.manage.add_cookie(
        name: OnboardingSession::COOKIE_KEY.to_s,
        value: jar[OnboardingSession::COOKIE_KEY],
        path: "/"
      )

      visit mobile_onboarding_family_path

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
  end
end
