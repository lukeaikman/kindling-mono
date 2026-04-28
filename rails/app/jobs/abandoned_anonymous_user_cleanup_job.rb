# Wave 2 Commit 2 — hourly cron.
#
# Anonymous Users (no email_address) get created the moment a visitor
# clicks "Continue" past the intro. If they bail, the row sits idle.
# `Mobile::BaseController#cleanup_stale_user!` reaps the User on the next
# request from the same browser, but a visitor who never returns leaves
# the row behind. This job sweeps those tail-end rows hourly.
#
# 3-hour idle window matches the cookie TTL set in
# `Mobile::BaseController#create_anonymous_user!` — once the cookie is
# gone the User is unreachable, so there's no value retaining the row.
#
# `dependent: :destroy` cascades on User → people / wills / sessions /
# api_sessions / devices, so this also cleans the orphaned Person + Will
# rows for the same anonymous draft.
class AbandonedAnonymousUserCleanupJob < ApplicationJob
  queue_as :default

  IDLE_THRESHOLD = 3.hours

  def perform
    cutoff = IDLE_THRESHOLD.ago

    User.where(email_address: nil)
        .where("last_seen_at < ? OR (last_seen_at IS NULL AND created_at < ?)", cutoff, cutoff)
        .find_each(batch_size: 100, &:destroy)
  end
end
