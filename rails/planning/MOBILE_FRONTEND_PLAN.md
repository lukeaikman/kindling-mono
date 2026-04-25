# Mobile frontend plan — Hotwire Native on Rails

## Phase status

Updated as phases merge. Order shown is **current execution order** (D removed; H bumped to last). Original A→J chronological order is preserved further down in the per-phase descriptions for historical reference.

| Phase | Status | Branch / Merge | Detail plan |
|---|---|---|---|
| A — Turbo + Stimulus into mobile bundle | ✅ Merged | `mobile-phase-a` | [PHASE_A_TURBO_STIMULUS_DETAILED_PLAN.md](PHASE_A_TURBO_STIMULUS_DETAILED_PLAN.md) |
| B — Vanilla → Stimulus + design refresh | ✅ Merged | `mobile-phase-b` | [PHASE_B_STIMULUS_DESIGN_REFRESH_DETAILED_PLAN.md](PHASE_B_STIMULUS_DESIGN_REFRESH_DETAILED_PLAN.md) |
| C — iOS shell + path config v1 | ✅ Merged | `mobile-phase-c` | [PHASE_C_IOS_SHELL_PATH_CONFIG_DETAILED_PLAN.md](PHASE_C_IOS_SHELL_PATH_CONFIG_DETAILED_PLAN.md) |
| D — Android shell | ⏭️ Skipped | — | No Android until iOS app is fully built (decision 2026-04-23) |
| E — Deep-link handoff | ✅ Merged (v1 only) | `mobile-phase-e` | [PHASE_E_DEEPLINK_DETAILED_PLAN.md](PHASE_E_DEEPLINK_DETAILED_PLAN.md) — Universal Link verification deferred to v2 (PRE_LAUNCH_TODO entry) |
| F — Native picker bridge | ✅ Merged (pivoted) | `mobile-phase-f` | [PHASE_F_DATE_PICKER_BRIDGE_DETAILED_PLAN.md](PHASE_F_DATE_PICKER_BRIDGE_DETAILED_PLAN.md) — pivoted from list picker → native date picker mid-phase |
| G — Haptics + dev origin override | ✅ Merged | `mobile-phase-g` | [PHASE_G_HAPTICS_AND_DEV_ORIGIN_DETAILED_PLAN.md](PHASE_G_HAPTICS_AND_DEV_ORIGIN_DETAILED_PLAN.md) — bundled F.5 (dev origin chooser, ngrok/LT support) with Phase G proper |
| I — Push notifications | ✅ Merged (v1 plumbing only) | `mobile-phase-i` | [PHASE_I_PUSH_NOTIFICATIONS_DETAILED_PLAN.md](PHASE_I_PUSH_NOTIFICATIONS_DETAILED_PLAN.md) — APNs sender + product triggers deferred to v2; device dedupe Path C deferred until Epic 3 auth |
| J — Camera bridge | 📋 Next | — | Asset capture for estate-asset photos |
| H — Preloading + offline polish | ⏸️ Last (deferred) | — | Bumped to final phase 2026-04-24. Preload-first framing (`data-turbo-preload`) over lazy-load; hard-offline screen still in scope |

## Decision log

| Date | Decision |
|---|---|
| 2026-04-20 | Frontend shell: Hotwire Native (supersedes Capacitor). Repo layout: monorepo siblings `ios/` + `android/`. iOS first. |
| 2026-04-23 | Phase D (Android) skipped indefinitely — no Android work until iOS app is fully built and shipped. |
| 2026-04-23 | Phase E shipped v1 only — Universal Link verification (AASA hosting, Associated Domains entitlement, physical-device verify) deferred to v2 because no external link surface exists yet to justify the prerequisites. |
| 2026-04-23 | Phase F pivoted mid-phase: list-picker bridge built, simulator verification preferred brand web overlay for lists; pivoted to native date picker (UIDatePicker wheels) which is what `<input type="date">` doesn't give us by default. |
| 2026-04-24 | Phase G bundled F.5 (dev origin override + ngrok/LT chooser via shake gesture, ATS exception for `*.loca.lt`) with Phase G proper (haptics bridge). Both required physical device for verification. |
| 2026-04-24 | Phase H moved from "after G" to "after J" (last). Polish phase, no debt from deferral. Reframed as preload-first (Turbo `data-turbo-preload` for linear onboarding) over lazy-load. |
| 2026-04-24 | Phase I shipped v1 plumbing only (permission, register, store device). APNs sender + product triggers + Path C dedupe (`(user_id, platform)` instead of `vendor_id`) all deferred until Epic 3 auth lands. |

---

## Context

Kindling is moving off the React Native app (`../native-app/`) onto a Rails-powered mobile experience. The *strategic* driver is **decomplication of the stack**: as the legal/concerns/trust/progression rules grow in complexity, maintaining two parallel implementations (Ruby models + TypeScript client) and keeping them in sync becomes the dominant cost. Rails owning both the data model *and* the view layer eliminates the sync tax entirely.

We have compared **Hotwire Native** (37signals' thin native shell + Rails-rendered HTML over Turbo) against **Capacitor + Ionic** (single webview hosting Ionic web components). The decision: **Hotwire Native**. Reasons:

- It is the Rails-native answer. Minimum additional stack surface: Turbo + Stimulus + a thin Swift shell + a thin Kotlin shell. No second frontend framework parked next to Rails.
- Native chrome is real native (`UINavigationController`, `UITabBar`, `UISheetPresentationController` on iOS; fragment back-stack, `BottomNavigationView`, `BottomSheetDialogFragment` on Android) — content stays 100% our ERB, preserving the Kindling brand identity.
- Work already shipped in [Epic 1](kindling-monorepo/rails/planning/EPIC_1_SPLASH_INTRO_DEEPLINK_DETAILED_PLAN.md) translates almost entirely. `Mobile::StartupRouting`, the onboarding controllers, the shared partials in `app/views/mobile/shared/`, and the `mobile.css` tokens are kept. The vanilla JS modules become Stimulus controllers.
- The team is willing to write small amounts of Swift and Kotlin for bridges (haptics, native sheet, camera, push).

The target quality bar is **Premium + mobile-first**: native navigation chrome (nav stack, tab bar, sheets, haptics, keyboard handling) wrapping branded content (serif display titles, warm palette, grouped-section style) inside each screen.

---

## Current state — verified reads

Not assumed. Read just now from the repo:

- **Rails 8.1** with `importmap-rails`. [rails/Gemfile](kindling-monorepo/rails/Gemfile:4)
- **No `turbo-rails` gem** in the Gemfile. Not yet installed.
- **No `stimulus-rails` gem** in the Gemfile. Not yet installed.
- Mobile importmap bundle exists at [config/importmap.rb](kindling-monorepo/rails/config/importmap.rb) pinning `mobile` + `mobile/*`.
- Mobile JS entry at [app/javascript/mobile.js](kindling-monorepo/rails/app/javascript/mobile.js) is vanilla event listeners — no Turbo, no Stimulus.
- Mobile layout at [app/views/layouts/mobile.html.erb](kindling-monorepo/rails/app/views/layouts/mobile.html.erb) has `viewport-fit=cover`, CSRF meta tags, `stylesheet_link_tag "mobile"`, `javascript_importmap_tags "mobile"`, `.mobile-app` > `main.mobile-app__content` + optional footer slot.
- Mobile routes at [config/routes.rb:18-43](kindling-monorepo/rails/config/routes.rb:18): `/mobile/open`, `/mobile/intro`, `/mobile/video-intro`, `/mobile/risk-questionnaire`, `/mobile/login`, `/mobile/dashboard`, `/mobile/auth/secure-account`, `/mobile/onboarding/{welcome,location,family,extended-family,wrap-up}`.
- Pure Ruby routing module exists: `Mobile::StartupRouting` at `app/models/mobile/startup_routing.rb`.
- Vanilla picker overlay at [app/javascript/mobile/picker_sheet.js](kindling-monorepo/rails/app/javascript/mobile/picker_sheet.js) uses `data-mobile-picker*` attributes on a `<select>` + option list. This will be bridged to a native sheet later; its data-attribute API is the contract.
- No Capacitor artifacts present (no `ios/`, `android/`, `capacitor.config.json`). No native shell exists yet.

---

## Supersedes

This plan flips the mobile-frontend decision from Capacitor (+ ERB) to Hotwire Native (+ ERB + Turbo). The following existing planning documents carry Capacitor assumptions and must be updated or annotated with a "superseded by this plan" note before Phase A starts. Do NOT delete them — they hold behavior-parity detail we still need. Just annotate the frontend-shell paragraphs.

- [rails/planning/NATIVE_TO_RAILS_EPICS.md](kindling-monorepo/rails/planning/NATIVE_TO_RAILS_EPICS.md) — Epic 1 + Epic 3 mention "Ionic/Capacitor shell" and "Capacitor deep-link bridge." Flip to "Hotwire Native shell" and "Universal Link / App Link handoff."
- [rails/planning/EPIC_1_SPLASH_INTRO_DEEPLINK_DETAILED_PLAN.md](kindling-monorepo/rails/planning/EPIC_1_SPLASH_INTRO_DEEPLINK_DETAILED_PLAN.md) — multiple Capacitor references in storage adapter design and view strategy. The storage adapter is still needed (web fallback remains for `bin/dev` browser iteration) but the Capacitor-specific secure-storage plugin references drop out.
- [rails/planning/EPIC_2_ONBOARDING_DETAILED_PLAN.md](kindling-monorepo/rails/planning/EPIC_2_ONBOARDING_DETAILED_PLAN.md) — opening paragraph and verification checklist reference Capacitor.
- [rails/planning/MOBILE_RAILS_UI_SYSTEM_PLAN.md](kindling-monorepo/rails/planning/MOBILE_RAILS_UI_SYSTEM_PLAN.md) — opening sentence says "feels like a real app inside Capacitor." The design-system substance (primitives, tokens, refactor strategy) is unchanged and still canonical.

Annotation pass is Phase A step 0, before any code.

## Out of scope for this plan

Explicitly **not** covered here, owned by other plans:

- Domain model design (Person, Will, Assets, Trusts, Concerns). Lives in Epic 2–6 per [NATIVE_TO_RAILS_EPICS.md](kindling-monorepo/rails/planning/NATIVE_TO_RAILS_EPICS.md).
- Legal-check / "concerns" UI. Currently in native-app only; Rails migration post Epic 2.
- API-token-based auth at `/api/v1/auth/*`. Those routes exist in [routes.rb:46-56](kindling-monorepo/rails/config/routes.rb:46) but are unused. Hotwire Native uses session cookies via `WKWebView` / `WebView` cookie jar — no API token flow needed for the mobile shell.
- Asset storage / upload pipeline. Touched by the camera bridge in Phase J but storage design is a separate plan.

---

## Repository layout — decided

Native shells live as **monorepo siblings** of `rails/`:

```
kindling-monorepo/
  AGENTS.md
  rails/        # existing Rails app
  rnative/      # existing RN app (stops being deployed once Hotwire Native reaches parity)
  ios/          # Hotwire Native iOS shell (new, Phase C)
  android/      # Hotwire Native Android shell (new, Phase D)
```

Rationale: the repo is already a monorepo by design, atomic commits can span Rails routes + path-config JSON + native presentation rules in one PR (important for the path-config-as-contract pattern), and this layout mirrors the [hotwire-native-demo](https://github.com/hotwired/hotwire-native-demo-ios) repos 37signals publish, so their docs and examples map 1:1. Each shell gets its own `.gitignore` scope so Xcode/Android Studio build artifacts don't pollute the Rails repo.

---

## Remote config pattern

Applies to any configuration the native shells need to consume — path-configuration today, future candidates (feature flags, rollout toggles, minimum-supported-version warnings, remote A/B bucketing once we have users to bucket). The pattern is **generalized now**, used for one resource in v1 (path-configuration), extended resource-by-resource as new needs land.

### The rule

1. **Bundled fallback**: every resource ships with a default copy compiled into each app binary (iOS `ios/Kindling/Config/*.json`, Android `android/app/src/main/assets/config/*.json`).
2. **Startup read (immutable for the session)**: on app launch the native shell reads the resource from its persistent cache (`UserDefaults` on iOS, `SharedPreferences` on Android). If the cache is empty or the cached payload fails schema validation, fall back to the bundled copy. Whatever is resolved at this moment is frozen for the session — no rule changes mid-flow, ever.
3. **Background fetch (non-blocking, post-startup)**: fetch latest from `GET /mobile/config/:resource.json` with `If-None-Match` / `If-Modified-Since` so the call is free when nothing changed. Validate the response against the resource's schema. If valid, write to cache. If malformed or schema-invalid, **leave the previous cache entry alone** — never overwrite with bad data.
4. **Next launch**: step 2 reads the freshly-cached version. Change takes effect.

Per-session determinism (step 2 freezes the value) is the key property — it eliminates the "what if the rule changed mid-onboarding" failure mode that a naive remote-read-on-every-visit pattern would have.

### Rails side

One controller handles all remote-config resources:

```
GET /mobile/config/:resource.json
```

Mapped to `Mobile::ConfigController#show`, which looks up the resource by name, renders the JSON, and sets `ETag` + `Last-Modified` headers for conditional-GET behavior. Unknown resource names return 404.

The Ruby source-of-truth for each resource lives in `config/mobile/*.json` (same content that's bundled into the shells — see CI drift check below). On deploy, the endpoint immediately serves the new version to anyone who fetches after the deploy. On next app open they see the change.

### Resources using this pattern

| Resource | Bundled fallback paths | Rails endpoint | First used in |
|---|---|---|---|
| `path_configuration` | `ios/Kindling/Config/path-configuration.json`, `android/app/src/main/assets/config/path-configuration.json` | `GET /mobile/config/path_configuration.json` | Phase C (iOS), Phase D (Android) |

Add rows as new resources ship. For every new resource:

- Commit the bundled fallback file in both native shells.
- Add an entry to `Mobile::ConfigController`'s resource registry.
- Add a JSON schema (or at least a shape test) so step 3 can reject malformed responses.
- Add a CI test that diffs the committed bundled file against what the Rails endpoint serves and fails if they differ (prevents bundled fallback going stale).

### What this pattern does NOT handle

- **Per-user config.** A/B test bucketing, experiment flags that depend on who's logged in — those need a user identifier, cache-per-user semantics, and different invalidation. Don't pre-build; add when the first real use case lands.
- **Secrets or credentials.** Cache is plaintext. Never put anything sensitive in it.
- **Real-time updates.** Fetch-on-launch is right for daily/weekly/hotfix cadence. For push-style changes (server says "update now"), use a different mechanism.
- **Very large config payloads.** Kilobytes are fine; megabytes are not — caching a big JSON in `UserDefaults` is an anti-pattern.

---

## Phases

Each phase lists: goal, files touched, verification, done criteria. **Shell exists from Phase C onward and every subsequent phase smoke-tests in it.** Do not leave shell integration to the end — that is the nightmare path.

**Detail-planning rule**: each phase is a roadmap entry, not an executable plan yet. Before starting any phase, write a detailed sub-plan for it. As part of that sub-plan you **must** cross-reference the Pitfalls list below and explicitly call out which pitfalls apply, plus any new ones surfaced during detailed planning. Bolded reminders inside each phase mark this requirement.

**On explicit team rules**: several phases include rules phrased as "team rule, enforced by PR review" (e.g. one path-config line per new route). These are kept deliberately verbose and over-stated because AI agents routinely work in this codebase, and implicit conventions don't survive a fresh context. Don't trim them to brevity.

### Phase A — Turbo + Stimulus into the mobile bundle

**Goal**: Give every mobile page Turbo Drive navigation (instant feel on form submits + back/forward) and a Stimulus runtime, without changing any ERB yet.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Items 1, 6, 7, 16 are the obvious ones for Phase A. Add any others the detailed plan surfaces.

**Work**:

1. Add gems:
   ```
   bundle add turbo-rails --version "~> 2.0"
   bundle add stimulus-rails --version "~> 1.3"
   ```
2. Run installer for importmap wiring:
   ```
   bin/rails turbo:install:importmap
   bin/rails stimulus:install:importmap
   ```
   This pins `@hotwired/turbo-rails` and `@hotwired/stimulus` in [config/importmap.rb](kindling-monorepo/rails/config/importmap.rb) and generates `app/javascript/controllers/application.js` + `app/javascript/controllers/index.js`.
3. Edit [app/javascript/mobile.js](kindling-monorepo/rails/app/javascript/mobile.js) to import Turbo and start Stimulus:
   ```js
   import "@hotwired/turbo-rails"
   import { Application } from "@hotwired/stimulus"
   // controllers imported in Phase B
   ```
4. Keep the existing `DOMContentLoaded` init calls — they survive Turbo with one caveat: they need to re-run on `turbo:load`. Cheapest fix: change the listener to both events. Proper fix in Phase B.
5. Verify [app/views/layouts/mobile.html.erb](kindling-monorepo/rails/app/views/layouts/mobile.html.erb) still imports `javascript_importmap_tags "mobile"` — no change needed, importmap entry already wires it.

**Verification**:
- `bin/dev` still starts.
- Navigate mobile routes in a browser. Form submits should feel instant (no full page reload).
- DevTools Network tab: after initial load, subsequent navigations should be `XHR` fetches to Rails, not full document loads.
- Existing picker + choice group + family form flows still work (no regressions).

**Done criteria**: all `/mobile/*` routes load under Turbo Drive with no visible regressions. Existing system tests pass.

---

### Phase B — Convert vanilla JS modules to Stimulus controllers

**Goal**: Rewrite the five existing modules as Stimulus controllers so they (1) survive Turbo navigation correctly, (2) map 1:1 to a bridge component per controller in Phase F+, (3) replace `DOMContentLoaded`-based init.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Items 7, 8 are the obvious ones for Phase B. Add any others the detailed plan surfaces.

**Conversions**:

| Current module | New Stimulus controller | Notes |
|---|---|---|
| [app/javascript/mobile/choice_group.js](kindling-monorepo/rails/app/javascript/mobile/choice_group.js) | `app/javascript/controllers/choice_group_controller.js` | Attach via `data-controller="choice-group"` on `.mobile-choice-group`. Use `static targets = ["option", "reset"]`. |
| [app/javascript/mobile/picker_sheet.js](kindling-monorepo/rails/app/javascript/mobile/picker_sheet.js) | `app/javascript/controllers/picker_sheet_controller.js` | Keep the `data-mobile-picker*` attribute contract so ERB partials don't change. In Phase F this controller becomes bridge-aware: send to native when `HotwireBridge` is available, else render the current web overlay. |
| [app/javascript/mobile/family_form.js](kindling-monorepo/rails/app/javascript/mobile/family_form.js) | `app/javascript/controllers/family_form_controller.js` | |
| [app/javascript/mobile/extended_family_form.js](kindling-monorepo/rails/app/javascript/mobile/extended_family_form.js) | `app/javascript/controllers/extended_family_form_controller.js` | |
| [app/javascript/mobile/splash_redirect.js](kindling-monorepo/rails/app/javascript/mobile/splash_redirect.js) | `app/javascript/controllers/splash_redirect_controller.js` | Uses `data-splash-redirect-url-value` to get the destination from `Mobile::StartupRouting`. |

Update ERB partials under [app/views/mobile/shared/](kindling-monorepo/rails/app/views/mobile/shared/) to add `data-controller` attributes. This is a small sweep — `_choice_group.html.erb`, `_picker_field.html.erb`.

Delete `app/javascript/mobile/*.js` modules once controllers are live. Delete the `DOMContentLoaded` wiring in `mobile.js`.

**Verification**:
- E2E: Capybara system tests for the onboarding flow still pass. Tests cover the Stimulus-controlled interactions (choice-group selection, picker open/close, family-form add/remove rows, splash redirect). No separate per-controller jsdom tests — Stimulus controllers are thin; if any controller grows logic that warrants isolated testing, extract the logic into plain Ruby or plain JS and test that instead.
- Turbo navigation stress: navigate welcome → location → back → welcome. Confirm choice-group state and picker-sheet open/close still work after Turbo restore.

**Done criteria**: no `app/javascript/mobile/*.js` vanilla modules remain. All interactivity goes through Stimulus controllers in `app/javascript/controllers/`.

---

### Phase C — iOS shell scaffold + path configuration v1

**Goal**: Bare Hotwire Native iOS app that loads `http://localhost:3000/mobile` in a `Hotwire.Navigator`, with a path-configuration JSON that decides push vs modal vs replace_root per route. **iOS ships first. Android is Phase D, gated on Phase C being validated with real users.**

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Items 3, 9, 12, 13, 14, 15, 17 all apply to Phase C — the remote-config pitfalls (12, 13, 14) are especially relevant because Phase C is where we build the remote-config layer.

**Path configuration uses the Remote config pattern** (see top-level section above). This phase builds the first resource (`path_configuration`) end-to-end, which means it also builds the generalized cache/fetch/fallback layer that future resources will reuse. Do NOT hard-code a one-off path-config loader — structure the Swift code so the second resource (e.g. feature flags, whenever that lands) is a five-line registration, not a re-implementation.

**Work**:

1. Create `kindling-monorepo/ios/Kindling.xcodeproj` from the [hotwire-native-ios demo](https://github.com/hotwired/hotwire-native-demo-ios) as a starting template. Rename. Bundle identifier: `app.kindling.ios`. Deployment target: **iOS 16** (released Sept 2022; covers 95%+ of active iPhones in 2026).
2. Add `HotwireNative` as a Swift Package dependency from `https://github.com/hotwired/hotwire-native-ios`. Pin to a specific version, not a branch.
3. Wire `SceneDelegate` or SwiftUI `App` root to instantiate a `Navigator` pointing at the Rails origin. For dev, read origin from an `.xcconfig` so staging/prod builds change without code edits.
4. Build the generalized **`RemoteConfigStore`** layer (Swift). API surface:
   - `RemoteConfigStore.register(resource: "path_configuration", schema: PathConfigSchema.self, bundledURL: Bundle.main.url(forResource: "path-configuration", withExtension: "json"))`
   - `RemoteConfigStore.resolve(resource:) -> Data` — reads cache (`UserDefaults`), validates schema, falls back to bundled file if cache is empty or invalid. Called exactly once per resource at startup; return value frozen for the session.
   - `RemoteConfigStore.refreshAll()` — background task after startup. For each registered resource, issue a conditional `GET /mobile/config/:resource.json` (using stored `ETag` / `Last-Modified`), validate response, write to `UserDefaults` under key `remote_config.<resource>`. Silent failure is fine — we keep the last-known-good cache.
5. Bundle `ios/Kindling/Config/path-configuration.json` in the app target with the seed content:
   ```json
   {
     "settings": { "screenshots_enabled": true },
     "rules": [
       { "patterns": ["/mobile/open$", "/mobile/intro$"],
         "properties": { "context": "default", "presentation": "replace_root", "pull_to_refresh_enabled": false } },
       { "patterns": ["/mobile/video-intro$", "/mobile/risk-questionnaire$"],
         "properties": { "context": "default", "presentation": "push" } },
       { "patterns": ["/mobile/onboarding/.*"],
         "properties": { "context": "default", "presentation": "push" } },
       { "patterns": ["/mobile/auth/secure-account$"],
         "properties": { "context": "modal", "presentation": "default" } },
       { "patterns": ["/mobile/dashboard$"],
         "properties": { "context": "default", "presentation": "replace_root", "pull_to_refresh_enabled": true } },
       { "patterns": ["/mobile/login$"],
         "properties": { "context": "modal", "presentation": "default" } }
     ]
   }
   ```
   Every new mobile route added to `rails/config/routes.rb` requires a matching rule in this JSON **and** in the Rails-side `config/mobile/path_configuration.json` in the **same PR**. That is a **team rule**, enforced by PR review. The CI drift test (see Verification strategy) fails the build if the three copies diverge, and the route-coverage test fails if a route has no matching rule — those are the safety nets.
6. Wire Navigator: `let pathConfig = PathConfiguration(sources: [.data(RemoteConfigStore.resolve(resource: "path_configuration"))])`. The Navigator never touches the network for this JSON; it only ever sees whatever `RemoteConfigStore` froze at startup.
7. Kick off `RemoteConfigStore.refreshAll()` in a detached task after the first screen has rendered. Not during startup — startup blocks on nothing network-related.
8. Add the **Rails controller**: new route `get "mobile/config/:resource", to: "mobile/config#show", constraints: { resource: /[a-z_]+/ }, format: :json, as: :mobile_config_resource`. `Mobile::ConfigController#show` looks up the resource in a hash mapping names to file paths under `config/mobile/*.json`, renders the file with `ETag` + `Last-Modified` headers (use `stale?` so conditional GET works automatically). Unknown resource → 404.
9. Commit `rails/config/mobile/path_configuration.json` with the same seed content as step 5. This is the canonical source; bundled copies are snapshots of it.
10. Register an `ErrorPresenter` on the `Navigator` that shows a native offline/error screen when `WKError` fires. Phase H fleshes this out; for now a placeholder label is fine.
11. iOS simulator launch: `bin/dev` in rails/, `xcrun simctl openurl booted http://localhost:3000/mobile/open`. Confirm:
   - Splash loads inside a native `UINavigationController`.
   - `splash_redirect_controller` fires and Turbo visits `/mobile/intro`.
   - Safe-area inset padding is correct (verify notch and home indicator).

**Verification**:
- Fresh simulator install, cold launch → splash screen renders → auto-redirects to `/mobile/intro`. On this very first launch the bundled fallback is used (cache is empty).
- Tap "Continue" on intro → Turbo POST to `/mobile/intro/continue` → redirect → new screen pushes onto nav stack with native animation.
- Swipe-from-left-edge on any non-root screen → pops back with native animation.
- Navigate to `/mobile/auth/secure-account` from a link → presents modally (native sheet), not pushed.
- **Remote config refresh cycle**: after first launch, inspect `UserDefaults` → cache is now populated. Deploy a Rails change that edits `config/mobile/path_configuration.json` (e.g. flip a rule's `presentation`). Cold-start the app → session still uses cached config from before the change (old behavior). Force-quit and relaunch → new behavior in effect. This proves the next-launch-apply property.
- **Malformed response guardrail**: stub the endpoint to return invalid JSON or a shape-failing payload. Relaunch → cache retains the last-known-good version. No crash, no blank screen.

**Done criteria**: Full Epic 1 flow (splash → intro → video-intro → risk-questionnaire) is walkable inside iOS simulator with native nav semantics matching the path configuration, AND the remote config refresh + malformed-response scenarios both behave as specified.

---

### Phase D — Android shell scaffold

**Goal**: Android equivalent of Phase C. Same path configuration JSON drives behavior.

**Gated on Phase C shipping to TestFlight and being validated with real users.** Do not start Phase D in parallel with C. Cycle-time and debug-time both halve when we only have one shell in production at a time; we learn what matters on iOS, then apply those learnings on Android.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Items 3, 9, 12, 13, 14, 15, 17 apply as in Phase C, plus anything discovered during Phase C shipment.

**Work**:

1. Create `kindling-monorepo/android/` as an Android Studio project from the [hotwire-native-android demo](https://github.com/hotwired/hotwire-native-demo-android). Package name: `app.kindling.android`. Min SDK: **26** (Android 8.0 Oreo, released Aug 2017; covers ~98% of active Android devices).
2. Add `dev.hotwire:core` Gradle dependency, pinned version.
3. Wire `MainActivity` to host a `HotwireActivity` pointing at the Rails origin (from a `buildConfig` field).
4. Build the Kotlin equivalent of `RemoteConfigStore` — same API shape, backed by `SharedPreferences` instead of `UserDefaults`. Same three operations: `register(resource, schema, bundledAssetPath)`, `resolve(resource): ByteArray` (session-frozen), `refreshAll()` (conditional-GET with stored ETag, persist on success, leave-alone on failure). Reuses the same Rails endpoint (`GET /mobile/config/path_configuration.json`) that Phase C wired up.
5. Bundle `android/app/src/main/assets/config/path-configuration.json` in the APK — **byte-identical** to `ios/Kindling/Config/path-configuration.json`. The CI drift check (see Verification strategy) enforces this.
6. Wire Hotwire's `PathConfiguration` from `RemoteConfigStore.resolve("path_configuration")` at Navigator setup. Kick off `RemoteConfigStore.refreshAll()` after first screen render.
7. Register an equivalent error handler (Phase H).
8. Android emulator launch: `adb shell am start -W -a android.intent.action.VIEW -d http://10.0.2.2:3000/mobile/open app.kindling.android` (note `10.0.2.2` is the emulator's localhost alias).

**Verification**:
- Same matrix as Phase C, in Android emulator — including the remote-config refresh cycle and malformed-response guardrail tests.
- Hardware back button pops navigation stack correctly.
- `BottomSheetDialogFragment` presentation for `/mobile/auth/secure-account`.
- Cross-platform config consistency: with identical bundled fallbacks, iOS and Android behave identically on first launch. This is a contract, enforced by the CI drift check.

**Done criteria**: Full Epic 1 flow walkable on Android emulator with native fragment back-stack. Remote config cycle and malformed-response behavior match Phase C.

---

### Phase E — Deep-link / universal link handoff to `Mobile::StartupRouting`

**Goal**: Production-quality deep-link behavior matching the native app. URL from email, SMS, or attribution link opens the native shell directly to the right screen with first-touch attribution captured.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Items 1, 3, 17 apply here.

**Detail-planning decision point — evaluate whether we need full universal link verification for v1.** Universal Links / App Links require signing-cert fingerprint hosting, `apple-app-site-association` + `assetlinks.json` at `/.well-known/`, Associated Domains entitlement, and physical-device or TestFlight validation. That's several days of yak-shaving. Alternative: launch v1 with the native URL handler only (custom scheme or in-app link taps), defer universal link verification to v2 once we know users open the app from email/SMS often enough to care. When detail-planning Phase E, make this call explicitly — don't drift into verification work because "it's the next thing in the plan."

**Work**:

1. **iOS Universal Links**:
   - Host `apple-app-site-association` JSON at `https://<domain>/.well-known/apple-app-site-association` served by Rails with `Content-Type: application/json` (no file extension). Content: associated domains for `app.kindling.ios` with path prefix `/mobile/`.
   - Add `Associated Domains` entitlement to the Xcode target: `applinks:kindling.app` (production), `applinks:staging.kindling.app` (staging).
   - Implement `UIApplicationDelegate.application(_:continue:restorationHandler:)` to pass the URL to `Navigator.route(url:)`.
2. **Android App Links**:
   - Host `assetlinks.json` at `https://<domain>/.well-known/assetlinks.json` with the signing cert SHA256 fingerprint.
   - `intent-filter` in `AndroidManifest.xml` with `android:autoVerify="true"` and the kindling host.
   - Forward matched intents to `HotwireActivity`.
3. **Rails side**: `/mobile/open` controller already exists and calls `Mobile::StartupRouting.next_destination`. Verify it handles all attribution param combinations from the native app's tests. Add request specs for: `show_video=1`, `show_risk_questionnaire=1`, both, neither, first-touch-wins, invalid params fall-through to `/mobile/intro`.
4. Make sure the Turbo-Drive redirect from `/mobile/open` to `/mobile/intro` (or `/mobile/video-intro`) replaces the root rather than pushing — already covered by the path config rule `"presentation": "replace_root"` for the intro routes.

**Verification**:
- iOS: from Notes app, tap a `kindling.app/mobile/open?source=email&campaign=welcome&show_video=1` link → app opens → lands on `/mobile/video-intro` directly. Attribution recorded (inspect `/mobile/debug` or logs).
- Android: same via `adb shell am start -W -a android.intent.action.VIEW -d "..."`.
- Cold start and warm start both work.
- Invalid params (e.g. `show_video=banana`) fall through to `/mobile/intro` and log a warning (coerce + validate lives in `Mobile::StartupRouting`).

**Done criteria**: deeplink QA matrix from [EPIC_1_SPLASH_INTRO_DEEPLINK_DETAILED_PLAN.md](kindling-monorepo/rails/planning/EPIC_1_SPLASH_INTRO_DEEPLINK_DETAILED_PLAN.md) passes in both simulators AND on a physical device (universal link verification requires real domain association, which requires a physical device or TestFlight build).

---

### Phase F — Native bridge: bottom-sheet picker

**Goal**: Replace the web-overlay picker with a real `UISheetPresentationController` (iOS) / `BottomSheetDialogFragment` (Android) for choosing from a list. Most-visible "feels native" upgrade in the app.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Items 6, 16 apply here.

**Work**:

1. Convert the existing `picker_sheet_controller.js` into a **bridge component**:
   - Extends `HotwireBridgeComponent` (provided by `@hotwired/hotwire-native-bridge`, pinned in importmap).
   - On connect: checks `this.enabled` (which is true only when running inside the native shell). When enabled, sends `{ title, options: [{value, label, selected}] }` to the native side via `this.send("connect", data)`.
   - Handles `selectOption` reply from native: updates the hidden `<select>`, dispatches `change`, submits the form if the `data-picker-sheet-submit-on-change` attribute is set.
   - When `this.enabled` is false (browser only): falls back to the existing web overlay behavior. **Keep browser fallback working — it's the dev loop.**
2. Native side:
   - iOS: `PickerBridgeComponent: BridgeComponent` presents a `UISheetPresentationController` with a `UITableView` bound to `options`. Respects `[.medium(), .large()]` detents.
   - Android: `PickerBridgeComponent: BridgeComponent` presents a `BottomSheetDialogFragment` with a `RecyclerView`.
3. Both sides reply `{ selectedValue }`; the Stimulus controller applies it.
4. Update [app/views/mobile/shared/_picker_field.html.erb](kindling-monorepo/rails/app/views/mobile/shared/_picker_field.html.erb) to include `data-controller="bridge--picker-sheet"` (Hotwire's convention for bridge components).

**Verification**:
- Browser: picker still opens as the web overlay.
- iOS simulator: tapping the picker trigger presents a native bottom sheet. Selection returns to the web, triggers change event, form submits if configured.
- Android: same with `BottomSheetDialogFragment`.
- No visual flash during the handoff (the web overlay must not briefly show before the native sheet appears — use `data-controller` to prevent the web init if native is enabled).

**Done criteria**: every `picker_field` partial in the app renders as a native sheet in the shell, and as the current web overlay in a plain browser.

---

### Phase G — Native bridge: haptics

**Goal**: Tiny bridge, big perceived-quality upgrade. `UIImpactFeedbackGenerator` on iOS and `HapticFeedback` on Android, triggered from specific web interactions.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Item 17 applies (device-only QA).

**Work**:

1. Stimulus `haptic_controller.js` — extends `HotwireBridgeComponent`. Listens for `click` / `change` events on the element and sends `{ style: "light" | "medium" | "heavy" | "success" }` to native.
2. iOS + Android bridge components implement `handle(message:)` → play feedback.
3. Apply to: choice-group option selection (light), form submit success (success), step progress advance (light), sticky action CTA tap (medium).

**Verification**: manual — selecting an onboarding answer should feel tactile on device. Use a physical device, not simulator (simulator haptics are muted).

**Done criteria**: haptic feedback triggers correctly in at least the four intended interactions. Browser is silent (no errors from missing bridge).

---

### Phase H — Offline / error presentation

**Goal**: When the webview can't reach Rails, show a native offline screen with a retry button. Match the 37signals pattern.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Item 5 applies here (localStorage best-effort-only — relevant if we ever reconsider form-draft persistence).

**Note**: earlier drafts of this plan included a `localStorage` form-draft-persistence feature. That's been cut for v1 — based on DHH/Elon critique, it was solving a problem we haven't verified exists. If users report losing form input to connectivity drops, we'll add it then with the specific scope their complaints indicate. Not pre-empted.

**Work**:

1. **iOS ErrorPresenter**:
   - On `WKError` with `NSURLErrorNotConnectedToInternet` / `NSURLErrorTimedOut` / `NSURLErrorCannotConnectToHost`: push a native `OfflineViewController` with "You're offline. Retry." button. Retry reloads the target URL.
   - On other errors (500, 404): push a generic error VC with "Something went wrong. Retry or go home."
2. **Android ErrorHandler**: equivalent.
3. **Rails `Cache-Control` headers**: audit mobile screens. Most should be `private, no-cache` (session-driven), but static-ish screens (intro video poster, splash, path configuration) can be `max-age=60, stale-while-revalidate=600` so they survive flaky connections via `WKWebView` HTTP cache.
4. **Turbo snapshot cache**: no code change. Turbo keeps recent HTML snapshots by default. Back navigation to a previously-visited page will render instantly from snapshot while revalidating — this gives "feels offline-capable" for recent pages for free.

**Verification**:
- Airplane-mode test: iOS and Android. Attempt to navigate → offline screen shows. Toggle connectivity back → retry succeeds.
- Turbo snapshot test: visit A → B → C → back → back. Each back should be instant (no network spinner visible).

**Done criteria**: offline matrix checklist passes on both platforms.

---

### Phase I — Push notifications

**Goal**: Deliverable push notifications for Epic 5+ features (invitation sent, will change detected, etc.). Not a frontend concern per se, but the shell must be configured to receive and route.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Item 17 applies (device-only QA).

**Work**:

1. APNs + FCM setup (Apple Developer + Firebase). Signing keys, entitlements, Firebase project.
2. Device token registration: native shells POST the token to `POST /api/v1/push/register` after auth. New Rails controller, new `PushDevice` model.
3. `@capacitor/push-notifications`-equivalent native code — but we're not using Capacitor, so this is straight UIKit/AndroidX. ~100 lines per platform.
4. Tap-to-open routing: notification payload includes a `url` → shell routes through `Navigator.route(url:)` → Turbo loads the screen.

**Verification**: send a test push from Rails console to a registered device. Tap it → app opens to the specified URL.

**Done criteria**: a single notification can be sent and routed on both iOS and Android.

---

### Phase J — Camera bridge (for asset capture)

**Goal**: Epic 5 asset entry wants to attach photos. Bridge native camera + library picker.

**Before detail-planning this phase: cross-reference the Pitfalls list below.** Items 6, 17 apply here.

**Work**:

1. Stimulus `camera_controller.js` bridges `{ source: "camera" | "library" }` to native.
2. Native picks image, uploads to Rails via existing Active Storage endpoint, returns the attachment URL/ID.
3. Web fallback: standard `<input type="file" accept="image/*" capture="environment">`.

**Verification**: take a photo inside the shell, confirm it attaches to the in-progress asset record.

**Done criteria**: asset entry flow (Epic 5 phase) can attach photos from camera and library in both shells.

---

*(Phase K "decommission React Native app" was removed from the roadmap. The RN app gets stopped being deployed once the Hotwire Native build reaches parity — no dedicated phase needed for that.)*

---

## Verification strategy (applies across all phases)

1. **Unit tests** (Ruby): existing RSpec suite for `Mobile::StartupRouting`. Add request specs for every new mobile route, and for `Mobile::ConfigController` (200 with correct `ETag` on first request, 304 on conditional GET, 404 on unknown resource name).
2. **System tests** (Capybara + headless Chrome): end-to-end flows for Epic 1 startup and Epic 2 onboarding. These run in CI without the native shell and exercise Stimulus-controlled interactions (choice-group, picker, family-form). No separate per-controller jsdom tests — if a controller grows logic that needs isolation, extract the logic and test that.
3. **Simulator smoke test** (manual, per-phase gate): at the end of each phase, before that phase is called "done," run the simulator smoke-test checklist against the current state of the app. iOS simulator only until Phase D ships; iOS simulator + Android emulator from Phase D onwards. Write the checklist in `rails/planning/HOTWIRE_SMOKE_CHECKLIST.md`. Example items: "splash → intro transition plays as replace_root, not push," "onboarding push chain supports swipe-back," "picker sheet presents as native, not web overlay," "force-quit after a config change → relaunch applies change; airplane-mode launch → previous cache still works." **Tradeoff accepted**: per-phase (not per-PR) means a regression introduced mid-phase surfaces at phase-end rather than at merge time. Individual PRs are validated by browser smoke-tests + the automated test suite — simulator is the phase completion gate.
4. **Physical device QA**: universal link verification (if Phase E ships with it), haptics, push notifications. Required pre-release; not per-PR.
5. **Remote-config drift + coverage tests** (Ruby-level, CI): for each registered resource, confirm:
   - (a) `rails/config/mobile/<resource>.json`, `ios/Kindling/Config/<resource>.json`, and `android/app/src/main/assets/config/<resource>.json` are byte-identical aside from whitespace (prevents bundled fallbacks from going stale).
   - (b) Resource-specific schema checks — for `path_configuration`, every `/mobile/*` route declared in `config/routes.rb` has a matching rule. Forgotten rule ships a route with no presentation, which will fall through to Hotwire's default (probably wrong).
   - (c) `Mobile::ConfigController` serves byte-identical content to the committed `rails/config/mobile/<resource>.json`.
6. **Native-shell `RemoteConfigStore` unit tests** (Swift + Kotlin, Phase C and D): cover the three failure modes — empty cache (falls back to bundled), malformed cached payload (falls back to bundled, does NOT crash), background fetch returns malformed data (leaves previous cache intact). These are cheap tests but non-negotiable because the pattern's safety properties depend on them.

---

## Pitfalls — specific things NOT to do

Hard-won gotchas that bite Hotwire Native apps. Keep this list in the repo.

1. **Don't use `window.location.href = ...` for navigation.** It bypasses Turbo, which means the native shell gets no visit notification, which means the nav stack doesn't update. Use Turbo links, form submits, or `Turbo.visit(url)` explicitly.
2. **Don't use `100vh` for full-height elements.** Mobile browsers report the wrong value when the URL bar is visible. Use `100dvh` or `height: 100%` with a flex container starting at `html, body { height: 100%; margin: 0; }`.
3. **Path-configuration (and any other remote config) follows the Remote config pattern.** Always three layers — startup reads cache (frozen for session), background fetch persists for next launch, bundled fallback covers cache-empty cases. Do NOT shortcut to "just bundle it" (loses hot-fix) or "just fetch it on every visit" (mid-session behavior changes). Do NOT apply a fetched update mid-session — freeze-at-startup is a load-bearing property, not a nice-to-have.
4. **Don't add `user-scalable=no` to the viewport meta tag.** Accessibility regression. The existing layout already does NOT do this — don't regress.
5. **Don't assume `localStorage` is persistent across reinstalls.** `WKWebView` data is tied to the app's sandbox. Treat it as best-effort cache, not durable storage. Server is source of truth.
6. **Don't submit forms with JS that doesn't go through Turbo.** Pure `fetch()` bypasses the Turbo lifecycle and the native shell won't know a new screen is being presented. Use `form.requestSubmit()` or the default submit button path.
7. **Don't load Stimulus controllers lazily via dynamic import without re-eager-loading on `turbo:load`.** Turbo navigation is in-place, so `DOMContentLoaded` fires once for the whole session. Controllers that attach via `data-controller` auto-reconnect; ad-hoc init code does not.
8. **Don't rely on `:hover` as the only visual state.** On touch devices `:hover` sticks until the next tap, causing ghost-highlighted buttons. Use `:active` + `:focus-visible` for mobile.
9. **Don't forget safe-area when the native tab bar *and* home indicator both exist.** `padding-bottom: max(env(safe-area-inset-bottom), 0.75rem)` is the right pattern — never just `env(safe-area-inset-bottom)` alone if the element can sit above the home indicator.
10. **Don't mix session-cookie auth and API-token auth in the same shell.** Current code has API auth scaffolded at [routes.rb:46](kindling-monorepo/rails/config/routes.rb:46). Leave it unused; Hotwire Native uses the `WKWebView`/`WebView` cookie jar and Rails session cookies. Introducing token auth later would force a big re-architecture.
11. **Don't let ERB templates device-branch.** If a screen needs mobile-specific markup, keep it in the `mobile/` views namespace or use a partial swap — don't scatter `if @mobile` conditionals into shared views. Re-read [MOBILE_RAILS_UI_SYSTEM_PLAN.md](kindling-monorepo/rails/planning/MOBILE_RAILS_UI_SYSTEM_PLAN.md) — this rule is already canonical.
12. **Keep iOS and Android bundled remote-config fallbacks in lockstep with each other AND with the Rails source-of-truth.** Three copies exist per resource: `rails/config/mobile/<resource>.json`, `ios/Kindling/Config/<resource>.json`, `android/app/src/main/assets/config/<resource>.json`. They must stay byte-identical aside from whitespace. Any edit to one is a three-file edit in the same PR. The CI drift check fails the build if they diverge.
13. **Never overwrite the remote-config cache with malformed data.** The background fetch MUST validate schema before writing to `UserDefaults` / `SharedPreferences`. If the server returns garbage (broken deploy, proxy interception, truncated response), leave the last-known-good cache alone. Overwriting with bad data poisons the next session and can brick the app for that user until a reinstall. Fail silently, keep the old cache, try again next launch.
14. **Never expand remote config to hold secrets or per-user data.** The cache is plaintext on-device. Path-config rules, feature flags, rollout toggles — fine. Auth tokens, user IDs, PII — never. Per-user experiments need a different mechanism with user-scoped keys and cache-per-user semantics; don't retrofit the session-frozen global pattern to handle them.
15. **Don't prescribe presentation in ERB via query params or data attributes.** The presentation rules live in ONE place — the path configuration JSON. Per-view overrides fragment the decision graph. If a screen needs custom presentation, add a rule for its URL.
16. **Don't bundle bridge JS separately from Turbo.** The bridge component script must be imported in `mobile.js` BEFORE Turbo dispatches `turbo:load` for the first page. Otherwise the handshake with native fails silently and pickers/haptics don't trigger. Specifically: `import "@hotwired/turbo-rails"` comes *before* any bridge-component imports that depend on the bridge global.
17. **Don't assume the iOS simulator is a substitute for device QA of haptics, push, and universal links.** All three require physical devices. Budget time for device QA per release.

---

## Offline strategy — match 37signals

Documented here so it's not misremembered later:

- **Online-first, explicitly.** No offline writes, no background sync, no SQLite mirror, no conflict resolution. The web app is the source of truth; the native shell is a thin presenter. This is deliberate and matches HEY + Basecamp.
- **Three layers of "feels responsive under bad network":**
  1. **Turbo snapshot cache** — in-memory HTML for the last ~10 visited pages. Back/forward navigation serves from snapshot instantly while revalidating. Free.
  2. **`WKWebView` / `WebView` HTTP cache** — respects `Cache-Control` headers on assets and pages. Sensible headers on Rails responses give "recently visited page opens instantly even if network is flaky."
  3. **Native shell chrome** — nav bar, tab bar, transitions, splash remain responsive even when the webview content can't load. The app never feels frozen.
- **Hard offline UX** — native `OfflineViewController` / equivalent Android fragment via Hotwire's `ErrorPresenter`. "You're offline. Retry." button. No web-rendered offline page.
- **No client-side form-draft persistence in v1.** If users report losing input to connectivity drops during onboarding, we'll scope a fix based on the actual complaints. Not pre-empted.

---

## Decisions — resolved

All starting-gate questions have been answered (2026-04-20):

1. **Frontend shell**: Hotwire Native. Supersedes Capacitor (four planning docs annotated).
2. **Repository layout**: monorepo siblings — `kindling-monorepo/ios/`, `kindling-monorepo/android/`.
3. **Minimum platform versions**: iOS 16 (Sept 2022), Android SDK 26 / Android 8.0 Oreo (Aug 2017).
4. **Developer accounts**: both Apple Developer and Google Play Console are already provisioned.
5. **Bundle identifiers**: `app.kindling.ios`, `app.kindling.android` (new IDs — no reuse of RN IDs).
6. **Path-config / remote config strategy**: generalized Remote config pattern (cache-at-startup, background fetch for next launch, bundled fallback). Applied to `path_configuration` in v1; reused for future resources.
7. **iOS first, Android second**: Phase D is gated on Phase C shipping to TestFlight and being validated with real users. No parallel development.
8. **Dev rhythm**: browser-first for day-to-day work; simulator smoke-test as the end-of-phase completion gate (not per-PR). Tradeoff: mid-phase regressions surface at phase-end — individual PRs rely on browser smoke-tests + the automated test suite.
9. **Form draft persistence**: not in v1 — cut per DHH/Elon critique. Revisit only if users report connectivity-loss pain.
10. **Phase K (RN decommission)**: not a phase — RN simply stops being deployed once Hotwire Native reaches parity.
