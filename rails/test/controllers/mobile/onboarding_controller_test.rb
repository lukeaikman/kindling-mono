require "test_helper"

module Mobile
  class OnboardingControllerTest < ActionDispatch::IntegrationTest
    test "intro continue stamps intro seen and redirects to onboarding welcome" do
      onboarding_session = create_onboarding_session(video_intro_version: 1, video_completed_at: Time.current)

      post mobile_intro_continue_path

      assert_redirected_to mobile_onboarding_welcome_path
      assert onboarding_session.reload.intro_seen_at.present?
    end

    test "onboarding index redirects to first incomplete step" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1)
      )

      get mobile_onboarding_path

      assert_redirected_to mobile_onboarding_location_path
    end

    test "welcome blocks under-age submissions" do
      create_onboarding_session(video_intro_version: 1, video_completed_at: Time.current, intro_seen_at: Time.current)

      patch mobile_onboarding_welcome_path, params: {
        onboarding_session: {
          first_name: "Ava",
          last_name: "Young",
          date_of_birth: 17.years.ago.to_date.iso8601
        }
      }

      assert_response :unprocessable_entity
      assert_select ".mobile-form-error"
    end

    test "location uses collapsible radio groups" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1)
      )

      get mobile_onboarding_location_path

      assert_response :success
      assert_select ".mobile-radio-group[data-choice-group-collapsible-value='true']", minimum: 2
    end

    test "family defaults a fresh child to partner co-guardianship when partnered" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
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
        divorce_status: "no",
        has_children: "yes",
        children_payload: []
      )

      get mobile_onboarding_family_path

      assert_response :success
      assert_select "select[data-role='responsibility'] option[selected='selected'][value='co-responsibility-with-spouse']", text: "Co-guardianship with Sarah"
      assert_select "select[data-role='responsibility'] option[value='sole-responsibility']", text: "Sole guardianship"
      assert_select "select[data-role='responsibility'] option[value='add-co-guardian']", text: "Add guardian"
    end

    test "family persists child capacity flags and redirects to extended family" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes"
      )

      patch mobile_onboarding_family_path, params: {
        onboarding_session: {
          relationship_status: "single",
          divorce_status: "no",
          has_children: "yes",
          children_payload: [
            {
              "first_name" => "Alex",
              "last_name" => "Aikman",
              "relationship" => "biological-child",
              "capacity_status" => "under-18",
              "disabled_answer" => "no",
              "lacks_mental_capacity_answer" => "no"
            }
          ]
        }
      }

      assert_redirected_to mobile_onboarding_extended_family_path

      child = OnboardingSession.last.children_payload.first
      assert_equal false, child["disabled"]
      assert_equal false, child["lacks_mental_capacity"]
    end

    test "extended family requires partner parents answer for cohabiting users" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "cohabiting",
        spouse_first_name: "Sam",
        spouse_last_name: "Partner",
        divorce_status: "no",
        has_children: "no"
      )

      patch mobile_onboarding_extended_family_path, params: {
        onboarding_session: {
          parents_alive: "yes",
          siblings_alive: "no"
        }
      }

      assert_response :unprocessable_entity
      assert_select ".mobile-form-error"
    end

    test "wrap up continue marks the onboarding session complete and redirects to secure account" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "single",
        divorce_status: "no",
        has_children: "no",
        parents_alive: "yes",
        siblings_alive: "no"
      )

      post mobile_onboarding_wrap_up_continue_path

      assert_redirected_to mobile_secure_account_path
      assert OnboardingSession.last.reload.completed_at.present?
    end

    private

    def create_onboarding_session(attributes = {})
      onboarding_session = OnboardingSession.create!({ token: SecureRandom.hex(24) }.merge(attributes))
      write_signed_cookie(OnboardingSession::COOKIE_KEY, onboarding_session.token)
      onboarding_session
    end
  end
end
