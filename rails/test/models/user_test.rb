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

  # === Wave 2 Commit 3a — summary_facts on User ===

  test "summary_facts is empty when will-maker Person not yet created" do
    user = User.create!
    assert_equal [], user.summary_facts
  end

  test "summary_facts builds You + Location + Single + Parents + Siblings rows for a fresh single user" do
    user = User.create!
    user.people.create!(
      relationship_kind: "self",
      first_name: "Luke",
      last_name: "Aikman",
      date_of_birth: Date.new(1988, 1, 1),
      country_of_residence: "england",
      nationality: "british",
      domiciled_in_uk: "yes",
      currently_resident_in_uk: "yes",
      parents_alive: "both",
      siblings_alive: "no"
    ).tap { |p| user.update!(will_maker_person: p) }

    facts = user.summary_facts.index_by { |f| f[:label] }
    assert_equal "Luke Aikman, born 1 January 1988", facts["You"][:value]
    assert_equal "England · British citizen · UK domiciled · UK resident", facts["Location"][:value]
    assert_equal "Single", facts["Relationship"][:value]
    assert_equal "Both alive", facts["Parents"][:value]
    assert_equal "None", facts["Siblings"][:value]
    assert_nil facts["Children"], "no children block when parentage chain empty"
    assert_nil facts["In-laws"], "no in-laws block when no active marriage"
  end

  test "summary_facts pluralises divorced count when greater than 1" do
    user = User.create!
    user.people.create!(
      relationship_kind: "self",
      first_name: "Luke",
      last_name: "Aikman",
      date_of_birth: Date.new(1988, 1, 1),
      country_of_residence: "england",
      nationality: "british",
      domiciled_in_uk: "yes",
      currently_resident_in_uk: "yes",
      times_divorced: 2,
      parents_alive: "no",
      siblings_alive: "no"
    ).tap { |p| user.update!(will_maker_person: p) }

    facts = user.summary_facts.index_by { |f| f[:label] }
    assert_equal "Divorced (2 times)", facts["Relationship"][:value]
  end

  test "summary_facts shows Married phrase + In-laws when an active marriage exists" do
    user = User.create!
    will_maker = user.people.create!(
      relationship_kind: "self",
      first_name: "Luke",
      last_name: "Aikman",
      date_of_birth: Date.new(1988, 1, 1),
      country_of_residence: "england",
      nationality: "british",
      domiciled_in_uk: "yes",
      currently_resident_in_uk: "yes",
      parents_alive: "both",
      parents_in_law_alive: "one-alive",
      siblings_alive: "no"
    )
    user.update!(will_maker_person: will_maker)
    spouse = user.people.create!(relationship_kind: "spouse", first_name: "Sarah", last_name: "Aikman")
    Marriage.create!(
      will_maker_person: will_maker,
      partner_person: spouse,
      kind: "married",
      phase: "active",
      started_at: Date.new(2015, 6, 1)
    )

    facts = user.summary_facts.index_by { |f| f[:label] }
    assert_equal "Married to Sarah Aikman", facts["Relationship"][:value]
    assert_equal "One alive", facts["In-laws"][:value]
  end

  test "summary_facts lists children names from the Parentage chain" do
    user = User.create!
    will_maker = user.people.create!(
      relationship_kind: "self",
      first_name: "Luke",
      last_name: "Aikman",
      date_of_birth: Date.new(1988, 1, 1),
      country_of_residence: "england",
      nationality: "british",
      domiciled_in_uk: "yes",
      currently_resident_in_uk: "yes",
      parents_alive: "both",
      siblings_alive: "no"
    )
    user.update!(will_maker_person: will_maker)
    %w[Charlie Alex].each_with_index do |name, idx|
      child = user.people.create!(relationship_kind: "child", first_name: name, last_name: "Aikman")
      Parentage.create!(parent_person: will_maker, child_person: child, kind: "biological", position: idx)
    end

    facts = user.summary_facts.index_by { |f| f[:label] }
    assert_equal "Charlie, Alex", facts["Children"][:value]
  end

  test "active_marriage returns nil when none, returns the active row when present" do
    user = User.create!
    assert_nil user.active_marriage

    will_maker = user.people.create!(relationship_kind: "self", first_name: "X", last_name: "Y")
    user.update!(will_maker_person: will_maker)
    spouse = user.people.create!(relationship_kind: "spouse", first_name: "S", last_name: "P")

    ended = Marriage.create!(will_maker_person: will_maker, partner_person: spouse, kind: "married", phase: "separated", ended_at: Date.new(2020, 1, 1))
    assert_nil user.active_marriage, "ended marriages don't count"

    ended.update!(phase: "active", ended_at: nil)
    assert_equal ended, user.active_marriage
  end
end
