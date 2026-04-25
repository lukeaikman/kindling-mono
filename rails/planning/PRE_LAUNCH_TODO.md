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

---

## Universal Link verification — deep-link handoff v2

**What**: wire Apple Universal Links so `kindling.app/mobile/open?...` links tapped in Mail / Messages / Safari / ad creatives open the iOS shell directly, skipping the Safari-tap-then-"Open in Kindling"-banner dance.

Four pieces. All four required together — partial wiring silently fails the first tap from a real device.

1. **Rails — AASA file.** Serve `apple-app-site-association` at `https://<prod-domain>/.well-known/apple-app-site-association`. Content-Type MUST be `application/json`. The URL MUST NOT have a file extension (no `.json` in the path). Apple's CDN fetches once at install and caches up to a week. Body:

   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         { "appID": "<TEAM_ID>.app.kindling.ios",
           "paths": ["/mobile/*"] }
       ]
     }
   }
   ```

   Add a route: `get "/.well-known/apple-app-site-association", to: "well_known#aasa"`. Controller action renders the JSON inline (from a constant or `config/well_known/aasa.json`). Public, no CSRF, no auth.

2. **Xcode — Associated Domains entitlement.** Open `ios/Kindling.xcodeproj`, target `Kindling`, Signing & Capabilities → `+ Capability` → Associated Domains. Add:
   - `applinks:kindling.app`
   - `applinks:staging.kindling.app` (if staging exists at v2 time)

   This writes a new `Kindling.entitlements` file referenced by Debug + Release build configs.

3. **AppDelegate — handler.** Add to `ios/Kindling/AppDelegate.swift`:

   ```swift
   func application(
     _ application: UIApplication,
     continue userActivity: NSUserActivity,
     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
   ) -> Bool {
     guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL else { return false }
     Navigator.shared?.route(url)
     return true
   }
   ```

   Navigator currently lives on `SceneController` as a `lazy var`. You'll need to expose it — either store it on the scene delegate and reach it from AppDelegate, or move URL handling into `SceneController`'s `scene(_:continue:)` (preferred on iOS 13+). Pick one, don't do both.

4. **Physical-device verification.** UL signatures validate against Apple's CDN-cached AASA, which means simulator cannot test this — the check passes in simulator regardless of wiring. Must be a TestFlight build or signed ad-hoc IPA on a real device, with the real domain reachable. Sequence: cold-kill Kindling → in Notes, paste `https://kindling.app/mobile/open?source=email&campaign=welcome&show_video=1` → tap → app opens directly (no Safari flash) → lands on `/mobile/video-intro`. Warm-start from the same link works identically. Repeat with attribution already stored (`first_touch=false` in the log) — destination should still respect onboarding state, not the URL params.

**Why**: deferred from Phase E v1 because no external link surface existed at that time. Gated on four prerequisites any one of which blocks real verification:
- production domain + DNS
- Apple Developer Team ID + App Store Connect record
- signed TestFlight or ad-hoc build
- physical iOS device in hand

Building UL against placeholder values produces plumbing that looks fine on inspection and fails the first real-device tap — worse than having none.

**Effort**: 1–2 days once prerequisites are met. Longer if domain/DNS/TestFlight need bootstrapping. Write as `PHASE_E2_UNIVERSAL_LINKS_DETAILED_PLAN.md` mirroring Phase C's structure when the first campaign date is set.

**Origin**: Phase E detail plan — deferred deliberately. See `rails/planning/native-to-rails/epic-0-mobile-frontend-shell/phase-e-deeplink/PHASE_E_DEEPLINK_DETAILED_PLAN.md`.
