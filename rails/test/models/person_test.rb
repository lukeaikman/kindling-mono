require "test_helper"

class PersonTest < ActiveSupport::TestCase
  setup { @user = User.create! }

  # === Validation contexts (Wave 2 Commit 3a) ===

  test ":welcome_step requires first_name + last_name + date_of_birth" do
    person = @user.people.build(relationship_kind: "self")

    assert_not person.valid?(:welcome_step)
    assert_includes person.errors[:first_name], "can't be blank"
    assert_includes person.errors[:last_name], "can't be blank"
    assert_includes person.errors[:date_of_birth], "can't be blank"

    person.assign_attributes(
      first_name: "Luke", last_name: "Aikman", date_of_birth: Date.new(1988, 1, 1)
    )
    assert person.valid?(:welcome_step), "errors: #{person.errors.full_messages}"
  end

  test ":welcome_step rejects under-18 date_of_birth" do
    person = @user.people.build(
      relationship_kind: "self",
      first_name: "Ava", last_name: "Young",
      date_of_birth: 17.years.ago.to_date
    )
    assert_not person.valid?(:welcome_step)
    assert_includes person.errors[:date_of_birth].join, "between 18 and 90"
  end

  test ":location_step requires country / nationality / domicile / residency" do
    person = @user.people.build(relationship_kind: "self")

    assert_not person.valid?(:location_step)
    assert_includes person.errors[:country_of_residence], "can't be blank"
    assert_includes person.errors[:nationality], "can't be blank"
    assert_includes person.errors[:domiciled_in_uk], "can't be blank"
    assert_includes person.errors[:currently_resident_in_uk], "can't be blank"

    person.assign_attributes(
      country_of_residence: "england",
      nationality: "british",
      domiciled_in_uk: "yes",
      currently_resident_in_uk: "yes"
    )
    assert person.valid?(:location_step), "errors: #{person.errors.full_messages}"
  end

  test ":extended_family_step requires parents_alive + siblings_alive on the will-maker" do
    person = @user.people.build(relationship_kind: "self")

    assert_not person.valid?(:extended_family_step)
    assert_includes person.errors[:parents_alive], "can't be blank"
    assert_includes person.errors[:siblings_alive], "can't be blank"
  end

  test ":extended_family_step gates parents_in_law_alive on active marriage" do
    will_maker = @user.people.create!(relationship_kind: "self")
    @user.update!(will_maker_person: will_maker)
    spouse = @user.people.create!(relationship_kind: "spouse")
    Marriage.create!(will_maker_person: will_maker, partner_person: spouse, kind: "married", phase: "active")
    will_maker.assign_attributes(parents_alive: "both", siblings_alive: "no")

    assert_not will_maker.valid?(:extended_family_step), "parents_in_law_alive should be required when partnered"
    assert_includes will_maker.errors[:parents_in_law_alive], "can't be blank"

    will_maker.parents_in_law_alive = "one-alive"
    assert will_maker.valid?(:extended_family_step), "errors: #{will_maker.errors.full_messages}"
  end

  test ":extended_family_step gates number_of_siblings on siblings_alive == yes" do
    will_maker = @user.people.create!(
      relationship_kind: "self",
      parents_alive: "both",
      siblings_alive: "yes"
    )
    @user.update!(will_maker_person: will_maker)

    assert_not will_maker.valid?(:extended_family_step), "number_of_siblings should be required"
    assert will_maker.errors[:number_of_siblings].any?, "expected number_of_siblings error"

    will_maker.number_of_siblings = 2
    assert will_maker.valid?(:extended_family_step)
  end

  # === Encryption-at-rest ===

  test "Person.first_name is stored as ciphertext, never plaintext" do
    person = @user.people.create!(relationship_kind: "child", first_name: "Charlie", last_name: "Aikman")

    raw = ActiveRecord::Base.connection.exec_query(
      "SELECT first_name FROM people WHERE id = #{person.id}"
    ).first["first_name"]

    assert_not_equal "Charlie", raw, "plaintext should not be in the DB"
    assert_match(/\A\{.*"p":/, raw, "expected AR encryption JSON envelope")
    assert_equal "Charlie", person.reload.first_name
  end
end
