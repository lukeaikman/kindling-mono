require "test_helper"

class AbandonedAnonymousUserCleanupJobTest < ActiveJob::TestCase
  test "destroys anonymous Users idle past the threshold" do
    stale = User.create!
    stale.update_column(:last_seen_at, 4.hours.ago)

    fresh = User.create!
    fresh.touch_last_seen!

    AbandonedAnonymousUserCleanupJob.perform_now

    assert_not User.exists?(stale.id), "stale anonymous user should be destroyed"
    assert User.exists?(fresh.id),      "fresh anonymous user should be untouched"
  end

  test "destroys anonymous Users with NULL last_seen_at if created long ago" do
    truly_old = User.create!
    User.where(id: truly_old.id).update_all(last_seen_at: nil, created_at: 4.hours.ago)

    AbandonedAnonymousUserCleanupJob.perform_now

    assert_not User.exists?(truly_old.id)
  end

  test "leaves registered Users alone" do
    registered = User.create!(email_address: "kept@example.com", password: "password1234")
    registered.update_column(:last_seen_at, 1.year.ago)

    AbandonedAnonymousUserCleanupJob.perform_now

    assert User.exists?(registered.id), "registered Users must never be auto-reaped"
  end

  test "cascades to associated rows (will, person)" do
    anonymous = User.create!
    anonymous.update_column(:last_seen_at, 4.hours.ago)
    will_id = anonymous.draft_will.id

    AbandonedAnonymousUserCleanupJob.perform_now

    assert_not Will.exists?(will_id), "draft Will should be destroyed with parent User"
  end
end
