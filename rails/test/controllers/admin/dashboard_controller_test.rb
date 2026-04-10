require "test_helper"

module Admin
  class DashboardControllerTest < ActionDispatch::IntegrationTest
    setup { sign_in_as(User.take) }

    test "index renders without broken bootstrap importmap pins" do
      get admin_dashboard_path

      assert_response :success
      assert_includes @response.body, 'type="importmap"'
      assert_no_match(/"bootstrap"/, @response.body)
      assert_no_match(/"@popperjs\/core"/, @response.body)
    end
  end
end
