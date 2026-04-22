# Pre-launch TODO

Items deferred during phase work that MUST be addressed before the app ships to TestFlight / production. Each entry: what, why, rough effort, origin phase.

## Cache-Control header on `Mobile::ConfigController#show`

**What**: add `expires_in` or explicit `Cache-Control` header to the `path_configuration.json` response so CDNs and proxies can cache-and-revalidate.

```ruby
def show
  return head :not_found unless params[:resource] == "path_configuration"

  path = Rails.root.join("config/mobile/path_configuration.json")
  expires_in 5.minutes, public: true, must_revalidate: true
  if stale?(etag: path, last_modified: path.mtime)
    render json: path.read
  end
end
```

**Why**: Phase C's `stale?` sets `ETag` and `Last-Modified` but no `Cache-Control`. A Rails-direct client (URLSession) respects ETag/Last-Modified anyway. A Cloudflare / Fastly / nginx layer in front of production would not know how to cache the response without `Cache-Control: public, max-age=...`. Adding it reduces origin load once real traffic hits.

**Effort**: 1 line. Add a request spec that asserts `Cache-Control` is present.

**Origin**: Phase C detail plan (§1.2 ConfigController). Deferred because no CDN fronts the dev environment and Phase C's scope doesn't include production infrastructure tuning.

---

<!-- Add new entries below as they land. Keep each self-contained: what, why, effort, origin. -->

---

## Family form — conditional reveal broken

**What**: on `/mobile/onboarding/family`, selecting "Married" (or any partner relationship) does NOT reveal the partner-details section. Selecting "Yes" under "Do you have children or guardianship responsibilities?" does NOT reveal the children section. User hits Continue with empty fields and gets validation errors, but can't fill them in because the sections never appeared.

**Why**: pre-existing bug, reproduces in the browser (not iOS-shell-specific). Most likely `family_form_controller`'s delegated `formChange` handler isn't firing — either the event isn't bubbling from the radio input to the form, the `data-action` wiring is off, or `this.partnerFields` / `this.childrenSection` are null at `connect()` time. Needs console-log debugging or a system test to pin down.

**Effort**: 30 min debugging + write a system/integration test to prevent regression. Suggested test: Capybara flow that picks Married, asserts `[data-role='partner-fields']:not([hidden])` is present.

**Origin**: surfaced during Phase C simulator walkthrough 2026-04-22. Not Phase C-caused — the controller logic lives on `main` and the Hotwire Native shell is just rendering what Rails serves. Landed in `rails/app/javascript/controllers/family_form_controller.js` during Phase B.

**Blocks**: Phase C §3.8 simulator verification scenarios 3 and 4 (walk welcome → wrap-up end-to-end, reach secure-account modal). Those two scenarios stay unverified until this is fixed; other §3.8 scenarios (splash redirect, intro push, login modal, server fetch, malformed-response guardrail, JS console clean) work independently.
