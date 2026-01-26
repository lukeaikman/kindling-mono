require "test_helper"

class Api::V1::AuthControllerTest < ActionDispatch::IntegrationTest
  def valid_payload(overrides = {})
    {
      email: "alex.hall@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall",
      phone: "+447911123456",
      device_id: "device-123",
      device_name: "iPhone 15 Pro"
    }.merge(overrides)
  end

  test "register creates user and api session" do
    assert_difference ["User.count", "ApiSession.count"], 1 do
      post "/api/v1/auth/register", params: valid_payload, as: :json
    end

    assert_response :created
    body = response.parsed_body

    assert body["access_token"].present?
    assert body["refresh_token"].present?
    assert_equal "alex.hall@example.com", body["email"]
  end

  test "register returns 409 when email is taken" do
    User.create!(
      email_address: "alex.hall@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )

    post "/api/v1/auth/register", params: valid_payload, as: :json

    assert_response :conflict
    body = response.parsed_body
    assert_equal "email_taken", body["code"]
  end

  test "register returns 422 for invalid email" do
    post "/api/v1/auth/register", params: valid_payload(email: "invalid"), as: :json

    assert_response :unprocessable_entity
    body = response.parsed_body
    assert body["details"]["email"].present?
  end

  test "register returns 422 for weak password" do
    post "/api/v1/auth/register", params: valid_payload(password: "short1"), as: :json

    assert_response :unprocessable_entity
    body = response.parsed_body
    assert body["details"]["password"].present?
  end

  test "validate_email returns available true for new email" do
    post "/api/v1/auth/register/validate-email", params: { email: "new@example.com" }, as: :json

    assert_response :success
    body = response.parsed_body
    assert_equal true, body["available"]
  end

  test "validate_email returns available false for taken email" do
    User.create!(
      email_address: "taken@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )

    post "/api/v1/auth/register/validate-email", params: { email: "taken@example.com" }, as: :json

    assert_response :success
    body = response.parsed_body
    assert_equal false, body["available"]
  end

  test "validate_email returns 422 for invalid email" do
    post "/api/v1/auth/register/validate-email", params: { email: "bad" }, as: :json

    assert_response :unprocessable_entity
    body = response.parsed_body
    assert_equal "invalid_email", body["code"]
  end
end
require "test_helper"

class Api::V1::AuthControllerTest < ActionDispatch::IntegrationTest
  test "register creates user and api session" do
    payload = {
      email: "alex.hall@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall",
      phone: "+447911123456",
      device_id: "device-123",
      device_name: "iPhone 15 Pro"
    }

    assert_difference ["User.count", "ApiSession.count"], 1 do
      post "/api/v1/auth/register", params: payload
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "Alex", body["first_name"]
    assert body["access_token"].present?
    assert body["refresh_token"].present?
  end

  test "register rejects duplicate email" do
    User.create!(
      email_address: "alex.hall@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )

    post "/api/v1/auth/register", params: {
      email: "alex.hall@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall",
      device_id: "device-123"
    }

    assert_response :conflict
    body = JSON.parse(response.body)
    assert_equal "email_taken", body["code"]
  end

  test "register rejects weak password" do
    post "/api/v1/auth/register", params: {
      email: "weak@example.com",
      password: "short1",
      first_name: "Alex",
      last_name: "Hall",
      device_id: "device-123"
    }

    assert_response :unprocessable_entity
  end

  test "validate_email reports availability" do
    post "/api/v1/auth/register/validate-email", params: { email: "new@example.com" }
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal true, body["available"]
  end

  test "validate_email rejects invalid format" do
    post "/api/v1/auth/register/validate-email", params: { email: "invalid" }
    assert_response :unprocessable_entity
  end
end
