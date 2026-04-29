require "test_helper"

module Mobile
  class AuthControllerTest < ActionDispatch::IntegrationTest
    # === GET secure_account ===

    test "secure_account redirects unauthenticated visitors with no User to intro" do
      get mobile_secure_account_path
      assert_redirected_to mobile_intro_path
    end

    test "secure_account redirects mid-onboarding User back to their first incomplete step" do
      anonymous = User.create!(current_step: "location")
      write_signed_cookie(:user_token, anonymous.token)

      get mobile_secure_account_path

      assert_redirected_to anonymous.first_incomplete_path
    end

    test "secure_account renders register form for completed-onboarding anonymous User" do
      anonymous = build_completed_anonymous
      write_signed_cookie(:user_token, anonymous.token)

      get mobile_secure_account_path

      assert_response :success
      assert_select "form[action='#{mobile_register_path}']"
      assert_select "input[name='user[email_address]']"
      assert_select "input[name='user[password]']"
      assert_select "input[name='user[password_confirmation]']"
    end

    test "secure_account redirects already-registered Users to dashboard" do
      registered = User.create!(email_address: "registered@example.com", password: "password1234")
      session = registered.sessions.create!(user_agent: "test", ip_address: "127.0.0.1")
      write_signed_cookie(:session_id, session.id)

      get mobile_secure_account_path

      assert_redirected_to mobile_dashboard_path
    end

    # === POST register ===

    test "register upgrades anonymous User in place + cookie cutover + redirects to dashboard" do
      anonymous = build_completed_anonymous
      write_signed_cookie(:user_token, anonymous.token)
      anonymous_id = anonymous.id

      post mobile_register_path, params: {
        user: { email_address: "Newish@Example.com", password: "secret-password-12", password_confirmation: "secret-password-12" }
      }

      assert_redirected_to mobile_dashboard_path

      # Same User row, just upgraded in place — no data migration.
      anonymous.reload
      assert_equal anonymous_id, anonymous.id
      assert anonymous.registered?
      assert_equal "newish@example.com", anonymous.email_address  # normalised
      assert anonymous.authenticate("secret-password-12")

      # Cookie cutover.
      assert cookies[:user_token].blank?, "user_token cookie should be cleared"
      assert cookies[:session_id].present?, "session_id cookie should be set"

      # Family-shape rows survive the upgrade.
      assert anonymous.will_maker_person.present?, "will-maker Person should still be there"
    end

    test "register with mismatched password_confirmation re-renders 422" do
      anonymous = build_completed_anonymous
      write_signed_cookie(:user_token, anonymous.token)

      post mobile_register_path, params: {
        user: { email_address: "valid@example.com", password: "secret-password-12", password_confirmation: "different-pass-12" }
      }

      assert_response :unprocessable_entity
      assert_match(/Password confirmation/i, response.body)
      assert anonymous.reload.anonymous?, "should still be anonymous on failure"
    end

    test "register with short password re-renders 422" do
      anonymous = build_completed_anonymous
      write_signed_cookie(:user_token, anonymous.token)

      post mobile_register_path, params: {
        user: { email_address: "valid@example.com", password: "short", password_confirmation: "short" }
      }

      assert_response :unprocessable_entity
      assert_match(/at least 12 characters/i, response.body)
      assert anonymous.reload.anonymous?
    end

    test "register with already-taken email rejects" do
      User.create!(email_address: "taken@example.com", password: "secret-password-12")
      anonymous = build_completed_anonymous
      write_signed_cookie(:user_token, anonymous.token)

      post mobile_register_path, params: {
        user: { email_address: "taken@example.com", password: "secret-password-12", password_confirmation: "secret-password-12" }
      }

      assert_response :unprocessable_entity
      assert_match(/already been taken/i, response.body)
    end

    test "register redirects already-registered Users to dashboard" do
      registered = User.create!(email_address: "already@example.com", password: "password1234")
      session = registered.sessions.create!(user_agent: "test", ip_address: "127.0.0.1")
      write_signed_cookie(:session_id, session.id)

      post mobile_register_path, params: {
        user: { email_address: "another@example.com", password: "password1234", password_confirmation: "password1234" }
      }

      assert_redirected_to mobile_dashboard_path
      assert_equal "already@example.com", registered.reload.email_address, "email should not change"
    end

    private

    def build_completed_anonymous
      user = User.create!(current_step: "completed", completed_at: Time.current)
      user.people.create!(
        relationship_kind: "self",
        first_name: "Luke", last_name: "Aikman", date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england", nationality: "british",
        domiciled_in_uk: "yes", currently_resident_in_uk: "yes",
        parents_alive: "both", siblings_alive: "no"
      ).tap { |p| user.update!(will_maker_person: p) }
      user
    end
  end
end
