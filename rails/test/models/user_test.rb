require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "downcases and strips email_address" do
    user = User.new(email_address: " DOWNCASED@EXAMPLE.COM ")
    assert_equal("downcased@example.com", user.email_address)
  end

  # === Anonymous-from-day-one ===

  test "creates anonymous Users with no email or password" do
    user = User.create!

    assert user.anonymous?
    assert_not user.registered?
    assert user.token.present?, "transient plaintext token should be set"
    assert user.token_digest.present?, "DB digest should be set"
  end

  test "stores token_digest, never plaintext token" do
    user = User.create!

    raw = ActiveRecord::Base.connection.exec_query(
      "SELECT token_digest FROM users WHERE id = #{user.id}"
    ).first

    assert_not_equal user.token, raw["token_digest"], "plaintext must not land in the DB"
    assert_equal Digest::SHA256.hexdigest(user.token), raw["token_digest"]
  end

  test "creates a draft Will alongside every User" do
    user = User.create!

    assert user.draft_will.present?
    assert_equal 1, user.draft_will.version
    assert_equal "draft", user.draft_will.status
  end

  test "find_by_cookie_token resolves anonymous Users by their plaintext token" do
    anonymous = User.create!
    found = User.find_by_cookie_token(anonymous.token)
    assert_equal anonymous, found
  end

  test "find_by_cookie_token rejects registered Users" do
    registered = User.create!(email_address: "registered@example.com", password: "password1234")
    assert_nil User.find_by_cookie_token(registered.token),
      "stolen anonymous-cookie tokens must not authenticate into a registered account"
  end

  test "find_by_cookie_token returns nil for blank or unknown tokens" do
    User.create!  # noise
    assert_nil User.find_by_cookie_token(nil)
    assert_nil User.find_by_cookie_token("")
    assert_nil User.find_by_cookie_token("never-issued")
  end

  # === Auth ===

  test "authenticate_by returns nil for blank email or password" do
    assert_nil User.authenticate_by(email_address: nil, password: "x")
    assert_nil User.authenticate_by(email_address: "", password: "x")
    assert_nil User.authenticate_by(email_address: "x@y.z", password: nil)
    assert_nil User.authenticate_by(email_address: "x@y.z", password: "")
  end

  test "authenticate_by returns the user for matching email + password" do
    user = User.create!(email_address: "auth@example.com", password: "password1234")
    assert_equal user, User.authenticate_by(email_address: "auth@example.com", password: "password1234")
  end

  test "authenticate_by is case-insensitive on email" do
    User.create!(email_address: "Mixed@Example.com", password: "password1234")
    assert_not_nil User.authenticate_by(email_address: "MIXED@example.COM", password: "password1234")
  end

  test "authenticate_by ignores anonymous Users" do
    User.create!  # anonymous, no email
    assert_nil User.authenticate_by(email_address: "", password: "anything")
  end

  # === Encryption ===

  test "User.email_address is stored as ciphertext" do
    user = User.create!(email_address: "ciphertext@example.com", password: "password1234")

    raw = ActiveRecord::Base.connection.exec_query(
      "SELECT email_address FROM users WHERE id = #{user.id}"
    ).first["email_address"]

    assert_not_equal "ciphertext@example.com", raw,
      "plaintext should not be in the column"
    assert_match(/\A\{.*"p":/, raw, "expected AR encryption JSON envelope")
    assert_equal "ciphertext@example.com", user.reload.email_address
  end

  # === :register validation context ===

  test "anonymous Users save without email/password validations" do
    user = User.new
    assert user.valid?, "anonymous User should validate fine: #{user.errors.full_messages}"
  end

  test "register context requires email + password complexity" do
    user = User.new
    assert_not user.valid?(:register)
    assert_includes user.errors[:email_address], "can't be blank"

    user.email_address = "user@example.com"
    user.password = "short"
    assert_not user.valid?(:register)
    assert_includes user.errors[:password], "must be at least 12 characters and include letters and numbers"
  end

  test "register context rejects mismatched password_confirmation" do
    user = User.new(email_address: "match@example.com", password: "password1234", password_confirmation: "different1234")
    assert_not user.valid?(:register)
    assert_includes user.errors[:password_confirmation], "doesn't match Password"
  end

  # === Lifecycle ===

  test "inactive_for_more_than? compares against last_seen_at" do
    user = User.create!(last_seen_at: 4.hours.ago)
    assert user.inactive_for_more_than?(3.hours)
    assert_not user.inactive_for_more_than?(5.hours)
  end

  # === first_incomplete_path ===

  test "first_incomplete_path starts at welcome for fresh anonymous Users" do
    user = User.create!
    assert_match(%r{/mobile/onboarding/welcome\z}, user.first_incomplete_path)
  end
end
