require "test_helper"

module Mobile
  class ConfigControllerTest < ActionDispatch::IntegrationTest
    test "GET /mobile/config/path_configuration returns 200 with JSON and ETag" do
      get mobile_config_resource_path("path_configuration")

      assert_response :ok
      assert_equal "application/json", response.media_type
      assert response.headers["ETag"].present?
      assert response.headers["Last-Modified"].present?

      body = JSON.parse(response.body)
      assert body["rules"].is_a?(Array)
      assert body["rules"].any?
    end

    test "conditional GET with matching ETag returns 304" do
      get mobile_config_resource_path("path_configuration")
      etag = response.headers["ETag"]

      get mobile_config_resource_path("path_configuration"),
        headers: { "If-None-Match" => etag }

      assert_response :not_modified
      assert response.body.blank?
    end

    test "unknown resource returns 404" do
      get mobile_config_resource_path("feature_flags")
      assert_response :not_found
    end

    test "disallowed characters in resource name are rejected by the route constraint" do
      # The constraint /[a-z_]+/ excludes uppercase, digits, dashes, dots, slashes.
      # No match = no route = 404.
      get "/mobile/config/CAPITALS.json"
      assert_response :not_found
    end

    test "missing .json extension is rejected by the route constraint" do
      # The constraint format: :json requires the .json extension.
      get "/mobile/config/path_configuration"
      assert_response :not_found
    end
  end
end
