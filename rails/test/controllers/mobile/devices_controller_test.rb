require "test_helper"

module Mobile
  class DevicesControllerTest < ActionDispatch::IntegrationTest
    test "create stores a new device tied to the onboarding session" do
      onboarding_session = OnboardingSession.create!(token: SecureRandom.hex(24))
      write_signed_cookie(:mobile_onboarding_session_token, onboarding_session.token)

      assert_difference "Device.count", 1 do
        post mobile_devices_path, params: { apns_token: "apns-test-token-1", platform: "ios" }
      end

      assert_response :created
      device = Device.find_by!(apns_token: "apns-test-token-1")
      assert_equal onboarding_session.id, device.onboarding_session_id
      assert_equal "ios", device.platform
      assert_not_nil device.last_registered_at
      assert_nil device.user_id
    end

    test "create upserts when the same apns_token is re-registered" do
      existing = Device.create!(apns_token: "apns-rotate", platform: "ios", last_registered_at: 1.day.ago)
      original_registered_at = existing.last_registered_at

      assert_no_difference "Device.count" do
        post mobile_devices_path, params: { apns_token: "apns-rotate", platform: "ios" }
      end

      assert_response :created
      assert_operator existing.reload.last_registered_at, :>, original_registered_at
    end

    test "create upserts on vendor_id when provided, rotating the apns_token" do
      vendor = SecureRandom.uuid
      existing = Device.create!(apns_token: "apns-old", vendor_id: vendor, platform: "ios", last_registered_at: 1.day.ago)

      assert_no_difference "Device.count" do
        post mobile_devices_path, params: { apns_token: "apns-new", platform: "ios", vendor_id: vendor }
      end

      assert_response :created
      existing.reload
      assert_equal "apns-new", existing.apns_token
      assert_equal vendor, existing.vendor_id
    end

    test "create works without an onboarding session" do
      assert_difference "Device.count", 1 do
        post mobile_devices_path, params: { apns_token: "apns-anon-token", platform: "ios" }
      end

      assert_response :created
      device = Device.find_by!(apns_token: "apns-anon-token")
      assert_nil device.onboarding_session_id
      assert_nil device.user_id
    end

    test "create rejects unknown platforms with 422" do
      assert_no_difference "Device.count" do
        post mobile_devices_path, params: { apns_token: "apns-bad", platform: "windows" }
      end
      assert_response :unprocessable_entity
    end

    test "create returns 400 when apns_token param is missing" do
      post mobile_devices_path, params: { platform: "ios" }
      assert_response :bad_request
    end
  end
end
