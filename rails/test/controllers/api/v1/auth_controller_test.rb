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

  test "login returns tokens for valid credentials" do
    User.create!(
      email_address: "login@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )

    post "/api/v1/auth/login", params: {
      email: "login@example.com",
      password: "SunsetDrive2026",
      device_id: "device-1"
    }, as: :json

    assert_response :success
    body = response.parsed_body
    assert body["access_token"].present?
    assert body["refresh_token"].present?
  end

  test "login returns 401 for invalid credentials" do
    User.create!(
      email_address: "login@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )

    post "/api/v1/auth/login", params: {
      email: "login@example.com",
      password: "wrong",
      device_id: "device-1"
    }, as: :json

    assert_response :unauthorized
    body = response.parsed_body
    assert_equal "invalid_credentials", body["code"]
  end

  test "login returns 403 locked_temporarily after 3 failures" do
    user = User.create!(
      email_address: "locked@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )

    2.times do
      post "/api/v1/auth/login", params: {
        email: "locked@example.com",
        password: "wrong",
        device_id: "device-1"
      }, as: :json
    end

    post "/api/v1/auth/login", params: {
      email: "locked@example.com",
      password: "wrong",
      device_id: "device-1"
    }, as: :json

    assert_response :forbidden
    body = response.parsed_body
    assert_equal "locked_temporarily", body["code"]
    assert user.reload.locked_until.present?
  end

  test "login returns 403 locked_support_required after 6 failures" do
    user = User.create!(
      email_address: "locked6@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )

    3.times do
      post "/api/v1/auth/login", params: {
        email: "locked6@example.com",
        password: "wrong",
        device_id: "device-1"
      }, as: :json
    end

    user.update_columns(locked_until: 1.hour.ago)

    3.times do
      post "/api/v1/auth/login", params: {
        email: "locked6@example.com",
        password: "wrong",
        device_id: "device-1"
      }, as: :json
    end

    assert_response :forbidden
    body = response.parsed_body
    assert_equal "locked_support_required", body["code"]
    assert_equal "locked", user.reload.status
  end

  test "logout revokes session and returns success" do
    User.create!(
      email_address: "logout@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )

    post "/api/v1/auth/login", params: {
      email: "logout@example.com",
      password: "SunsetDrive2026",
      device_id: "device-1"
    }, as: :json

    access_token = response.parsed_body["access_token"]
    assert access_token.present?

    post "/api/v1/auth/logout", headers: { "Authorization" => "Bearer #{access_token}" }

    assert_response :success
    body = response.parsed_body
    assert_equal true, body["success"]
  end

  test "logout returns 401 for invalid token" do
    post "/api/v1/auth/logout", headers: { "Authorization" => "Bearer invalid" }

    assert_response :unauthorized
    body = response.parsed_body
    assert_equal "invalid_token", body["code"]
  end

  test "session_validate returns profile for valid access token" do
    user = User.create!(
      email_address: "session@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )
    session, access_token, = ApiSession.issue_for(user: user, device_id: "device-1")

    get "/api/v1/auth/session/validate", headers: { "Authorization" => "Bearer #{access_token}" }

    assert_response :success
    body = response.parsed_body
    assert_equal true, body["valid"]
    assert_equal user.id, body["user_id"]
    assert_equal session.access_expires_at.as_json, body["access_expires_at"]
  end

  test "session_validate returns 401 for invalid access token" do
    get "/api/v1/auth/session/validate", headers: { "Authorization" => "Bearer invalid" }

    assert_response :unauthorized
    body = response.parsed_body
    assert_equal "invalid_token", body["code"]
  end

  test "session_refresh rotates tokens" do
    user = User.create!(
      email_address: "refresh@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )
    session, _, refresh_token = ApiSession.issue_for(user: user, device_id: "device-1")

    post "/api/v1/auth/session/refresh", headers: { "Authorization" => "Bearer #{refresh_token}" }

    assert_response :success
    body = response.parsed_body
    assert body["access_token"].present?
    assert body["refresh_token"].present?
    assert session.reload.revoked?
  end

  test "session_refresh returns 401 for expired refresh token" do
    user = User.create!(
      email_address: "refresh-expired@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )
    session, _, refresh_token = ApiSession.issue_for(user: user, device_id: "device-1")
    session.update_columns(refresh_expires_at: 1.minute.ago)

    post "/api/v1/auth/session/refresh", headers: { "Authorization" => "Bearer #{refresh_token}" }

    assert_response :unauthorized
    body = response.parsed_body
    assert_equal "invalid_token", body["code"]
  end

  test "profile returns user data for valid access token" do
    user = User.create!(
      email_address: "profile@example.com",
      password: "SunsetDrive2026",
      first_name: "Alex",
      last_name: "Hall"
    )
    _, access_token, = ApiSession.issue_for(user: user, device_id: "device-1")

    get "/api/v1/auth/user/profile", headers: { "Authorization" => "Bearer #{access_token}" }

    assert_response :success
    body = response.parsed_body
    assert_equal "Alex", body["first_name"]
    assert_equal "Hall", body["last_name"]
    assert_equal "profile@example.com", body["email"]
  end

  test "profile returns 401 for invalid access token" do
    get "/api/v1/auth/user/profile", headers: { "Authorization" => "Bearer invalid" }

    assert_response :unauthorized
    body = response.parsed_body
    assert_equal "invalid_token", body["code"]
  end
end
