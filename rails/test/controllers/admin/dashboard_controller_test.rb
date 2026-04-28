require "test_helper"

module Admin
  class DashboardControllerTest < ActionDispatch::IntegrationTest
    setup do
      user = User.create!(
        email_address: "admin@example.com",
        password: "password",
        first_name: "Admin",
        last_name: "User"
      )
      sign_in_as(user)
    end

    test "index renders without broken bootstrap importmap pins" do
      get admin_dashboard_path

      assert_response :success
      assert_includes @response.body, 'type="importmap"'
      assert_no_match(/"bootstrap"/, @response.body)
      assert_no_match(/"@popperjs\/core"/, @response.body)
    end
  end
end
