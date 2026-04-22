# Phase C Detailed Plan — iOS shell scaffold + path configuration v1

> **Note to the AI agent executing this plan**: you need specifics, not architecture. Where this plan is explicit about commands, bundle IDs, port numbers, file paths, and gem/package versions, it's not because they're clever — it's because ambiguity is how you produce bugs in a long agent session. Follow the letter of the plan. Do NOT introduce abstractions beyond what is specified: no `protocol` declarations where a concrete type is specified, no DI containers, no factory patterns, no custom cache layers, no parallelism primitives that aren't asked for. Everything the plan prescribes is prescribed deliberately; everything it doesn't prescribe, don't add. In particular: this plan **leans on HotwireNative's built-in path-configuration loader** for caching, background refresh, and validation. Do NOT reimplement any of that in a `RemoteConfigStore`-shaped class — the library does it.

## Context

Phase A shipped Turbo + Stimulus into the mobile bundle. Phase B finished the vanilla-to-Stimulus conversion and refreshed the design system. The mobile Rails app now renders its full Epic 1 flow (splash → intro → video-intro → risk-questionnaire → onboarding → dashboard) as Hotwire-ready HTML in a browser.

Phase C drops a real iOS app — a Hotwire Native shell — around it. Same HTML, same Stimulus controllers, same Rails routes. The shell adds native chrome (`UINavigationController`, push/modal animations, safe-area handling, swipe-to-pop) and consults a **path-configuration JSON** on every Turbo navigation to decide how to present each URL.

Path-configuration is the first and only remote config Phase C needs. HotwireNative 1.2.1's `Hotwire.loadPathConfiguration(from:)` already does the caching, background fetch, and schema validation our earlier plan had us reimplementing. Phase C uses the library. Future resources (feature flags, min-supported-version warnings, A/B toggles) are NOT in Phase C's scope; if/when they arrive, revisit whether Hotwire's loader still fits or whether a custom mechanism is warranted.

**iOS first. Android is Phase D, gated on Phase C shipping to TestFlight and getting real-user time.** Not parallel.

## Scope

### In scope

- Commit canonical `rails/config/mobile/path_configuration.json` with the seed ruleset (§1.1). **DONE — landed in commit 1 on `mobile-phase-c` via earlier partial execution.**
- New Rails controller `Mobile::ConfigController#show` and route `GET /mobile/config/:resource.json`. ETag + Last-Modified via `stale?`. **DONE — landed in commit 1.**
- Request specs for the controller — five tests. **DONE — landed in commit 1.**
- New Xcode project at `ios/Kindling.xcodeproj` derived from the `Demo/` target inside `hotwired/hotwire-native-ios`. Bundle ID `app.kindling.ios`. Deployment target **iOS 16**.
- `HotwireNative` Swift Package dependency, pinned to exactly **1.2.1**.
- Two `.xcconfig` files (Dev, Release) + Info.plist placeholder + runtime read for the Rails origin.
- `AppDelegate.configureHotwire()` calls `Hotwire.loadPathConfiguration(from: [.file(bundledURL), .server(originURL)])`. That's the whole path-config integration — no custom cache, no custom validator.
- `SceneController` instantiates a `Navigator`, routes to `/mobile/open`, hands `rootViewController` to the window.
- Bundled `ios/Kindling/path-configuration.json` in the app target (byte-identical to the Rails canonical file).
- Drift + coverage tests in Minitest (Rails side, CI).

### Out of scope

- A custom `RemoteConfigStore`-type abstraction for caching/fetching path-config. **Hotwire's `PathConfigurationLoader` covers cache-read, background-download, validate-before-write, and silent-fail-on-error.** If you find yourself writing Swift that looks like a cache manager, stop.
- Android shell scaffold — Phase D.
- Universal Links / App Links — Phase E.
- Bridge components (native sheet picker, haptics, camera) — Phases F, G, J.
- Push notifications — Phase I.
- Offline / error polish — Phase H. Phase C registers a minimal error hook only.
- Any change to the mobile ERB views, Stimulus controllers, CSS tokens, or Rails routes for the existing mobile flow. The shell must render what's already on main. If something looks wrong in the simulator, file a defect; don't fix it in this branch.
- Tab-bar navigation (`HotwireTabBarController`). Our onboarding flow is linear; we use a plain `Navigator`.

## Pitfalls to carry

Quoted verbatim from the canonical plan. Re-read each before executing the relevant part.

**Pitfall 3 — Path-configuration (and any other remote config) follows the Remote config pattern.** Always three layers — startup reads cache (frozen for session), background fetch persists for next launch, bundled fallback covers cache-empty cases. Do NOT shortcut to "just bundle it" (loses hot-fix) or "just fetch it on every visit" (mid-session behavior changes). Do NOT apply a fetched update mid-session — freeze-at-startup is a load-bearing property, not a nice-to-have.

> **Phase C's explicit deviation from Pitfall 3**: we use Hotwire's `.server(...)` source, which applies fetched updates live (fires `PathConfigurationDelegate.pathConfigurationDidUpdate()` mid-session once the fetch completes). The mid-session-apply window is ~100–300ms per cold start — the time between Hotwire's synchronous `.file(...)` load and its background `.server(...)` completion. The blast radius is cosmetic: a presentation rule flipping from `push` to `modal` mid-flow produces a weird UX moment, not a crash. Crash-inducing rule changes (missing rule for a visited route, dead rule pointing nowhere, malformed JSON) are caught by the Rails-side drift test and Hotwire's internal validation respectively. For Kindling's stable onboarding ruleset, the trade is worth it: ~200 lines of duplicated cache logic avoided. **Revisit this decision if a future remote-config resource has higher stakes** (auth gating, rollout toggles affecting business logic, anything that can crash or strand a user) — that's the moment to build the session-frozen custom layer, not now.

**Pitfall 9 — Don't forget safe-area when the native tab bar *and* home indicator both exist.** `padding-bottom: max(env(safe-area-inset-bottom), 0.75rem)` is the right pattern — never just `env(safe-area-inset-bottom)` alone if the element can sit above the home indicator.

**Pitfall 12 — Keep iOS and Android bundled remote-config fallbacks in lockstep with each other AND with the Rails source-of-truth.** Three copies exist per resource once both shells ship: `rails/config/mobile/<resource>.json`, `ios/Kindling/<resource>.json`, `android/app/src/main/assets/<resource>.json`. They must stay byte-identical aside from whitespace. Any edit to one is a multi-file edit in the same PR. The CI drift check fails the build if they diverge. Phase C enforces iOS ↔ Rails; Phase D adds Android ↔ Rails to the same test.

**Pitfall 13 — Never overwrite the remote-config cache with malformed data.** Covered in Phase C by Hotwire's `PathConfigurationLoader.loadData(_:cache:for:)` — decodes the JSON first, only writes to FileManager cache if the decode succeeds. If the server returns garbage, the cache retains the last-known-good. Agent should not add its own validation layer; Hotwire's is the source of truth.

**Pitfall 14 — Never expand remote config to hold secrets or per-user data.** The cache is plaintext on-device. Path-config rules — fine. Auth tokens, user IDs, PII — never.

**Pitfall 15 — Don't prescribe presentation in ERB via query params or data attributes.** The presentation rules live in ONE place — the path configuration JSON. Per-view overrides fragment the decision graph. If a screen needs custom presentation, add a rule for its URL.

**Pitfall 17 — Don't assume the iOS simulator is a substitute for device QA of haptics, push, and universal links.** Those three require physical devices. Phase C's simulator verification is sufficient for Phase C's done criteria; Phase E and beyond add device checks.

## Git strategy

Branch: `mobile-phase-c` (currently checked out). Commit 1 is already landed from earlier execution; the remaining work is three commits — two by the agent, one manual by the user. One branch, `git merge --no-ff` to main when done. Do not push without explicit go-ahead.

Commit order:
1. (agent) **DONE** — Rails canonical JSON + `Mobile::ConfigController` + endpoint tests. Sitting on `mobile-phase-c` as `fdf3f2f`.
2. (agent) Clone `hotwired/hotwire-native-ios`'s `Demo/` into `ios/`, add `.gitignore`. Project still named "Demo" at this point.
3. **(user, manual)** Xcode target rename Demo → Kindling, bundle ID → `app.kindling.ios`, deployment target → iOS 16. Includes creating the `KindlingTests` target if the demo doesn't ship one (it does — renamed from `DemoTests`, so usually no extra action). See §2.3.
4. (agent) HotwireNative SPM pinned 1.2.1, `.xcconfig` files, Info.plist, `AppDelegate.configureHotwire()`, `SceneController` + `Navigator`, bundled `path-configuration.json` byte-identical to Rails canonical, Rails drift tests, simulator verification notes in the commit message.

**Four commits total.** Smaller than the earlier 6-commit plan because the whole RemoteConfigStore commit is gone — Hotwire's loader does that work.

## Part 1 — Rails side [DONE]

Already executed. The artifacts landed in commit 1 (`fdf3f2f`):
- `rails/config/mobile/path_configuration.json` with the seed ruleset.
- `rails/app/controllers/mobile/config_controller.rb` — 8-line `#show` action with resource whitelist.
- Route: `get "config/:resource.json"` inside the `namespace :mobile` block, constrained to `resource: /[a-z_]+/`.
- `test/controllers/mobile/config_controller_test.rb` with five request specs.

Leave it. No changes needed for Option B.

## Part 2 — iOS shell scaffold

Part 2 spans commits 2 and 3.

### 2.1 Clone the Demo from `hotwired/hotwire-native-ios` into `ios/` (agent — part of commit 2)

**Prerequisites**:
- Xcode 16 or later.
- macOS with command-line tools installed (`xcode-select -p` returns a path).

**Why from `hotwire-native-ios/Demo/` and not a separate `hotwire-native-demo-ios` repo**: the separate demo repo doesn't exist. The canonical demo lives inside the framework repo at `Demo/`, with `Demo.xcodeproj` alongside `Demo/AppDelegate.swift`, `SceneController.swift`, etc.

**Commands** (run from `kindling-monorepo/`):

```bash
# 1. Clone the framework repo (demo lives inside it).
git clone --depth 1 https://github.com/hotwired/hotwire-native-ios.git /tmp/hn-ios

# 2. Copy the Demo target into ios/ — plain copy, not a nested git clone.
mkdir -p ios
cp -R /tmp/hn-ios/Demo ios/Kindling
cp -R /tmp/hn-ios/Demo/Demo.xcodeproj ios/Kindling.xcodeproj
rm -rf ios/Kindling/Demo.xcodeproj   # the xcodeproj was inside Demo/; we hoisted it, remove the nested copy
rm -rf /tmp/hn-ios
```

The project is still named "Demo" internally at this point. The user renames it in §2.3; don't pre-empt.

**Do not** (either party, at any step of Part 2): restructure the folder layout, flatten files, or rename files beyond the target rename in §2.3. The demo uses `AppDelegate.swift`, `SceneController.swift`, `Tabs.swift`, `Demo.swift`. **We will delete `Tabs.swift` and `Demo.swift` in Part 3 because we're not using the tab-bar pattern** — but leave them for commit 2. Their removal is Part 3's work.

### 2.2 `.gitignore` for iOS build artifacts (agent — same commit as §2.1)

**File**: `ios/.gitignore` (new).

```
# Xcode
build/
DerivedData/
*.xcodeproj/xcuserdata/
*.xcworkspace/xcuserdata/
*.xcuserstate
*.xcuserdatad/

# macOS
.DS_Store

# Swift Package Manager
.build/
.swiftpm/

# CocoaPods (not used; defensive)
Pods/
Podfile.lock
```

Do not ignore `*.xcodeproj/project.pbxproj` — that's the shared project file.

**Commit 2** (agent):

```
Phase C commit 2 — clone hotwire-native-ios/Demo into ios/

Template copy only — project is still named Demo. Renamed in commit
3 by the user via Xcode's target-rename tooling.

- ios/Kindling/ source tree copied from hotwire-native-ios's Demo/.
- ios/Kindling.xcodeproj copied from hotwire-native-ios's Demo.xcodeproj/.
- ios/.gitignore scoped for Xcode/SPM/macOS build artifacts.

The demo's tab-bar setup (Tabs.swift, Demo.swift) stays in place for
this commit. It gets deleted in commit 4 once SceneController is
rewritten for our single-Navigator onboarding flow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### 2.3 Xcode rename (user manual — commit 3)

Agents cannot click through Xcode's rename UI reliably, and editing `project.pbxproj` by hand is brittle. **This is a manual step the user performs.** Four actions, one commit:

1. Open `ios/Kindling.xcodeproj` in Xcode.
2. File → Rename the target `Demo` → `Kindling` (this renames the scheme, folders, and build configs in one action). Accept Xcode's "rename files" prompts.
3. Project → Target `Kindling` → Build Settings → Product Bundle Identifier: set to `app.kindling.ios`.
4. Project → Target `Kindling` → General → Display Name: set to `Kindling`. Minimum Deployments: iOS 16.0.

**About `KindlingTests`**: the demo usually ships a `DemoTests` target which Xcode's rename will carry along as `KindlingTests`. If it doesn't, create one: File → New → Target → Unit Testing Bundle, Product Name `KindlingTests`, Target to be tested `Kindling`. Commit in the same action.

**Commit 3** (user):

```
Phase C commit 3 — Xcode target renamed Demo → Kindling

Manual rename done in Xcode so agents don't have to patch pbxproj
by hand. Bundle ID set to app.kindling.ios. Deployment target iOS 16.
KindlingTests target carried forward from the demo's DemoTests.
```

**Agent-side resume check after handback — required before any agent work on commit 4**:

```bash
grep -rln "\"Demo\"\|Demo.xcodeproj\|com\.hotwired\.Demo" ios/
```

Should return empty (no leftover "Demo" references in source file strings or the pbxproj). If any remain, the rename was incomplete — stop and report back. Do not sed-patch stragglers; ask the user to complete the rename.

Second check:

```bash
test -d ios/KindlingTests && grep -q "KindlingTests" ios/Kindling.xcodeproj/project.pbxproj
```

Both must pass, or commit 4's simulator tests won't have anywhere to run.

## Part 3 — Hotwire wiring + bundled config + drift tests (commit 4)

All of this lands in commit 4. Single agent commit.

### 3.1 `HotwireNative` Swift Package dependency

Open `ios/Kindling.xcodeproj` in Xcode. File → Add Package Dependencies…:

- URL: `https://github.com/hotwired/hotwire-native-ios`
- Dependency Rule: **Exact Version** — **1.2.1**. No ranges. No branches. No "up to next minor." No "latest stable at time of execution." If `1.2.1` doesn't resolve, stop and report back — don't pick a nearby version to keep moving.
- Add to target: `Kindling`.

**Why exact**: a surprise upstream change breaks the shell silently. Exact pinning forces a conscious bump with review.

**Verify the pin landed**:

```bash
grep '"version" : "1.2.1"' ios/Kindling.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved
```

Must return a match.

### 3.2 Origin configuration via `.xcconfig`

**Files** (new):

`ios/Kindling/Config/Dev.xcconfig`:

```
// Dev points at the Rails dev server. Port 3010 matches rails/config/environments/development.rb
// action_mailer.default_url_options. The $() escapes the // sequence so xcconfig doesn't read it
// as a comment.
KINDLING_ORIGIN = http:/$()/localhost:3010
```

`ios/Kindling/Config/Release.xcconfig`:

```
KINDLING_ORIGIN = https:/$()/kindling.app
```

**Info.plist** — add one entry under `ios/Kindling/Info.plist`:

```xml
<key>KindlingOrigin</key>
<string>$(KINDLING_ORIGIN)</string>
```

**Xcode build configuration wiring**: Project → Info → Configurations. Set:
- Debug → Based on `Dev.xcconfig`
- Release → Based on `Release.xcconfig`

One scheme, two build configurations. Running with Cmd-R picks Debug → Dev origin. Archive picks Release → production origin.

### 3.3 `Origin.swift` — runtime origin lookup

**File**: `ios/Kindling/Origin.swift` (new).

```swift
import Foundation

enum Origin {
  static var rails: URL {
    guard
      let raw = Bundle.main.object(forInfoDictionaryKey: "KindlingOrigin") as? String,
      let url = URL(string: raw)
    else { fatalError("KindlingOrigin Info.plist key missing or malformed") }
    return url
  }
}
```

`fatalError` is the right response: a missing origin is a build-misconfiguration bug, caught on first launch.

### 3.4 `AppDelegate.swift` — configureHotwire

**File**: `ios/Kindling/AppDelegate.swift` — **replace** the demo's contents (which configure bridge components and debug logging we don't need yet) with:

```swift
import HotwireNative
import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    configureHotwire()
    return true
  }

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
  }

  private func configureHotwire() {
    let bundledConfig = Bundle.main.url(forResource: "path-configuration", withExtension: "json")!
    let serverConfig = Origin.rails.appendingPathComponent("mobile/config/path_configuration.json")

    Hotwire.loadPathConfiguration(from: [
      .file(bundledConfig),
      .server(serverConfig)
    ])

    #if DEBUG
    Hotwire.config.debugLoggingEnabled = true
    #endif
  }
}
```

**Notes**:
- Sources are loaded in order. `.file(...)` is synchronous — the bundled rules are live before `didFinishLaunchingWithOptions` returns. `.server(...)` runs in the background; when it completes, Hotwire's loader validates, writes the FileManager cache, and swaps `rules` live (Pitfall 3 deviation — see the Pitfalls section).
- Do NOT add bridge-component registration, custom web-view factories, or user-agent prefixes here. Phases F, G, J add those.
- Do NOT register a `PathConfigurationDelegate` in Phase C. If we later want to ignore mid-session updates (revive Pitfall 3), we'd add one here that refuses to propagate the update. Not now.

### 3.5 `SceneController.swift` — Navigator wiring

**File**: `ios/Kindling/SceneController.swift` — **replace** the demo's tab-bar-based contents with:

```swift
import HotwireNative
import UIKit

final class SceneController: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  private lazy var navigator = Navigator(
    configuration: Navigator.Configuration(
      name: "main",
      startLocation: Origin.rails.appendingPathComponent("mobile/open")
    )
  )

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    window = UIWindow(windowScene: windowScene)
    window?.rootViewController = navigator.rootViewController
    window?.makeKeyAndVisible()

    navigator.start()
  }
}
```

**Delete** `ios/Kindling/Tabs.swift` and `ios/Kindling/Demo.swift` — they're demo-specific tab-bar helpers we don't use. Remove their Target Membership from the Xcode project when deleting the files.

If the demo's original `SceneController` had `NavigatorDelegate` / `visitableDidFailRequest` handling, **remove it**. Phase H adds the real offline/error screen; Phase C relies on Hotwire's default error behavior (which is fine for the simulator walkthrough).

### 3.6 Bundled `path-configuration.json`

Copy `rails/config/mobile/path_configuration.json` to `ios/Kindling/path-configuration.json` — **byte-identical**. Use `cp`, not manual copy-paste.

```bash
cp rails/config/mobile/path_configuration.json ios/Kindling/path-configuration.json
```

Add the file to the `Kindling` target's Copy Bundle Resources build phase in Xcode. Verify it's bundled:

```bash
# After a build, the file should be inside the .app bundle.
find ~/Library/Developer/Xcode/DerivedData -name "path-configuration.json" -path "*/Kindling.app/*"
```

### 3.7 Rails drift + coverage tests

**File**: `rails/test/mobile/path_configuration_drift_test.rb` (new — create `test/mobile/` directory).

Two tests. Missing-rule catches the common bug (forgot to add a rule for a new route); byte-identity catches the other common bug (edited Rails-side, forgot to re-copy into iOS).

```ruby
require "test_helper"

class PathConfigurationDriftTest < ActiveSupport::TestCase
  CANONICAL = Rails.root.join("config/mobile/path_configuration.json")
  IOS_BUNDLED = Rails.root.join("../ios/Kindling/path-configuration.json")

  test "iOS bundled path_configuration is byte-identical to Rails canonical" do
    assert_equal CANONICAL.read, IOS_BUNDLED.read,
      "Rails canonical and iOS bundled path_configuration.json have diverged. Re-copy the Rails file into the iOS target."
  end

  test "every /mobile/* route has at least one matching path_configuration rule" do
    patterns = JSON.parse(CANONICAL.read).fetch("rules").flat_map { |r| r.fetch("patterns") }
    regexes = patterns.map { |p| Regexp.new(p) }

    mobile_routes = Rails.application.routes.routes.map do |route|
      route.path.spec.to_s.sub("(.:format)", "")
    end.select { |path| path.start_with?("/mobile/") }

    # Exclude the config endpoint itself and its :resource placeholder —
    # it's shell → server, not shell → user-facing page.
    mobile_routes -= ["/mobile/config/:resource.json", "/mobile/config/:resource"]

    unmatched = mobile_routes.reject { |path| regexes.any? { |re| path.match?(re) } }
    assert unmatched.empty?, "These mobile routes have no matching path-config rule: #{unmatched.join(', ')}. Add a rule to rails/config/mobile/path_configuration.json (and ios/Kindling/path-configuration.json) in the same PR that added the route."
  end
end
```

**Known limitation — dynamic route segments**: the route-coverage test matches regex patterns against route specs as literal strings (e.g. `/mobile/person/:id`). Patterns like `/mobile/person/\d+$` won't match `/mobile/person/:id` literally. When a future epic adds a dynamic route, add its literal spec to the `mobile_routes -= [...]` subtraction list in the same PR.

**Not in this phase**: the Android byte-identity test and the dead-rule inverse-coverage test. Android test lands with Phase D; dead-rule test lands when a dead rule bites.

**Run**: `bin/rails test test/mobile/path_configuration_drift_test.rb` — expect 2 runs, 0 failures.

### 3.8 Simulator verification

**Before any step below**: ensure Rails is running in another terminal. From `rails/`, run `bin/dev` and leave it up. The simulator cannot reach `http://localhost:3010` otherwise. If the simulator shows an error alert on cold-start, check the terminal running `bin/dev` before debugging anywhere else.

Record the following in the commit message, not in a separate doc:

1. Cold-start with fresh simulator (Device → Erase All Content and Settings first). App launches, splash shows, `splash_redirect_controller` fires, navigates to `/mobile/intro`. Back button on `/mobile/intro` does NOT return to splash (confirms `replace_root`).
2. Tap "Create your will and estate plan" on intro → POST to `/mobile/intro/continue` → redirect to `/mobile/onboarding/welcome`. Screen PUSHES onto nav stack with native animation (swipe-from-left-edge to pop works).
3. Walk welcome → location → family → extended-family → wrap-up. Each screen pushes. Swipe-back works at every step.
4. Navigate to `/mobile/auth/secure-account` from the wrap-up Continue button → presents MODALLY (sheet from bottom, grab handle, swipe-to-dismiss). Not a push.
5. Navigate to `/mobile/login` → presents MODALLY.
6. Open the simulator's Safari and visit the running Rails origin directly. Visual parity check: browser vs WKWebView should look identical.
7. **Server path-config fetch fires**: with `bin/dev` running, open DevTools on the running Rails server (or `tail -f rails/log/development.log`) and watch for a `GET /mobile/config/path_configuration.json` hit shortly after app cold-start. That's Hotwire's `.server(...)` firing. Subsequent launches should see a 304 (ETag match) rather than a 200 — confirms the conditional GET caching works.
8. **Malformed response guardrail**: edit the controller to return garbage, verify Hotwire ignores it, then `git checkout` to revert.
   ```bash
   # 1. Edit rails/app/controllers/mobile/config_controller.rb: change
   #    `render json: path.read` to `render json: '{ "not": "path-config" }'`
   # 2. Rails auto-reloads. Cold-start the iOS app.
   # 3. Watch Xcode's debug console — Hotwire logs:
   #    [path-configuration] *** error decoding path configuration: <error>
   #    The existing cached/bundled config stays active; no crash.
   # 4. Revert:
   git checkout -- rails/app/controllers/mobile/config_controller.rb
   # 5. MUST be clean before proceeding:
   git status
   ```
   Do NOT commit step 8 work.
9. DevTools console (Safari → Develop → Simulator → [WKWebView]) — zero JS errors. Tap through a choice-group and a picker; both still work inside the webview exactly as in-browser.

### 3.9 Commit 4 message

```
Phase C commit 4 — HotwireNative wiring + bundled path-config + drift tests

- HotwireNative Swift Package pinned to exact 1.2.1
  (Package.resolved verified).
- Dev.xcconfig and Release.xcconfig expose KINDLING_ORIGIN
  (http://localhost:3010 and https://kindling.app respectively),
  interpolated into Info.plist as KindlingOrigin and read at runtime
  by Origin.rails with a fatalError on misconfiguration.
- AppDelegate.configureHotwire() calls
  Hotwire.loadPathConfiguration(from: [.file(bundled), .server(origin)]).
  That's the whole path-config integration — no RemoteConfigStore, no
  custom cache, no custom validator. Hotwire's own
  PathConfigurationLoader handles cache-read, background-fetch,
  validate-before-cache, and silent-fail-on-error.
- Explicit Pitfall 3 deviation: mid-session rule updates via
  .server(...) are accepted. Blast radius is cosmetic; crash-inducing
  cases are caught by Rails drift tests and Hotwire's validation.
  Documented in the Pitfalls section of the plan.
- SceneController replaces demo's tab-bar pattern with a plain
  Navigator pointed at /mobile/open.
- Tabs.swift and Demo.swift deleted — tab-bar helpers we don't use.
- ios/Kindling/path-configuration.json bundled into the app target,
  byte-identical to rails/config/mobile/path_configuration.json.
- test/mobile/path_configuration_drift_test.rb enforces two things:
  Rails canonical == iOS bundled (hard), and every /mobile/* route
  has a matching rule. Android byte-identity lands with Phase D;
  dead-rule inverse coverage lands when a dead rule bites.
- Simulator verification walked end-to-end per the plan. Splash
  replace_root, push on video-intro/onboarding, modal on
  secure-account/login — all behave as the path config dictates.
  Server fetch + 304 cycle verified; malformed-response guardrail
  verified (Hotwire's validation discards bad JSON).

Phase C done criteria 1-7 satisfied. Ready for --no-ff merge to main.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Verification checklist

### Automated (CI)

- [ ] `bin/rails test` — 0 failures. Seven new test methods total (5 in `Mobile::ConfigControllerTest` from commit 1, 2 in `PathConfigurationDriftTest` from commit 4). Run count rises from **64 → 71**. Assertion count rises correspondingly — confirm it went up, don't pin a specific number.
- [ ] Xcode build succeeds for the Debug configuration (Cmd-B with Debug scheme).

### Simulator (end-of-phase gate)

Per §3.8 — nine scenarios walked and recorded in commit 4's message.

### Objective spot-checks

- `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3010/mobile/config/path_configuration.json` → 200 on cold request, 304 on conditional GET with the returned ETag.
- `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3010/mobile/config/path_configuration` → 404 (missing .json extension rejected by route constraint).
- `diff rails/config/mobile/path_configuration.json ios/Kindling/path-configuration.json` → empty output.
- `grep -rn 'data-presentation\|data-modal\|data-push' rails/app/views/mobile/` → empty (Pitfall 15 — no ERB-level presentation overrides).
- `grep -rn 'window.location.href\|window.location.assign\|window.location.replace' rails/app/javascript/` → empty (Pitfall A1 carries forward — Turbo-bypassing navigation is still forbidden).
- `grep -rln "Demo.xcodeproj\|com\.hotwired\.Demo" ios/` → empty (rename completed correctly).
- `grep '"version" : "1.2.1"' ios/Kindling.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` → one match (HotwireNative pinned correctly).

## Done criteria

Phase C is complete when all of the following hold:

1. Branch `mobile-phase-c` has four commits as specified (Rails / clone+gitignore / user-rename / Hotwire-wiring+drift).
2. `bin/rails test` passes with the new tests running. Run count is 71.
3. All nine simulator scenarios from §3.8 verified and captured in commit 4's message.
4. `ios/Kindling.xcodeproj` builds for the Debug configuration (Dev origin) without errors. Warnings are acceptable in Phase C and triaged in Phase H. Release configuration compiles; signing is NOT configured in this phase (deferred to the pre-release pass before TestFlight submission).
5. `ios/` contains a valid `.gitignore`; `xcuserdata/` is absent from the tree.
6. Drift test enforces Rails ↔ iOS byte-identity and flags any route missing a rule.
7. Branch merged to main with `git merge --no-ff`. Branch deleted.

## Rollback model

Simpler than the earlier plan because Hotwire's `.server(...)` applies on the SAME session's next fetch, not the launch-after-next:

- **Bug in Rails-served JSON (`config/mobile/path_configuration.json`)**: Rails hotfix → users get the corrected JSON on their NEXT cold-start (background fetch replaces cache) → behavior updates live within ~300ms of that launch. One faulty release reaches users' devices for **one cold-start per user**, not two. Acceptable for presentation tweaks.
- **Bug in bundled fallback JSON (`ios/Kindling/path-configuration.json`)**: ships inside the app binary. Fix requires an App Store build + review cycle. Days. Only matters for users who have never successfully fetched the server version (fresh install + no network) — a tiny slice.
- **Bug in Swift code (`AppDelegate`, `SceneController`, `Origin`)**: App Store build cycle.

**The load-bearing assumption**: before shipping Phase C to TestFlight, the bundled JSON must be **known-good** and byte-identical to a Rails-served version that CI has validated. The drift test is the gate. Don't cut it.

## Handoff to Phase D and Phase E

**Phase D — Android shell scaffold**:

- Reuses the exact Rails endpoint (`GET /mobile/config/path_configuration.json`). No Rails changes needed.
- Uses HotwireNative-Android's equivalent `Hotwire.loadPathConfiguration` API. Same `.file + .server` source pattern as iOS.
- `android/app/src/main/assets/path-configuration.json` is a byte-identical copy of `rails/config/mobile/path_configuration.json`.
- Phase D adds an `Android bundled path_configuration is byte-identical to Rails canonical` test to `path_configuration_drift_test.rb` (alongside the iOS one Phase C lands). The test is NOT pre-committed and skipped — it lands with its subject.
- Phase D's detail plan should open with the same canonical-path note and the same Pitfalls list. Items 3 (with the Phase-C deviation carried), 9, 12, 13, 14, 15, 17 all carry.

**Phase E — Universal Links + App Links**:

- Needs a staging origin. Add `ios/Kindling/Config/Staging.xcconfig` and a third build configuration at that point.
- Rails side: host `apple-app-site-association` JSON at `/.well-known/apple-app-site-association`. `app.kindling.ios` associated domains `applinks:kindling.app` and `applinks:staging.kindling.app`.
- iOS side: wire `UIApplicationDelegate.application(_:continue:restorationHandler:)` to pass the URL to `navigator.route(url:)`. The path-config's `replace_root` rule for `/mobile/open` already handles the "deep-link lands on splash" case correctly — no new rules needed.
- Phase E's detail plan inherits this `.xcconfig` pattern and the existing path-config entries. No retrofit required.

**Adding a new remote-config resource (any future phase)**:

Not a five-line recipe anymore. Hotwire's `loadPathConfiguration` is specific to path-configuration. For a second resource (feature flags, version warnings, etc.), decide on pattern: either (a) use a similar Hotwire-internal loader if one exists, (b) build a small custom fetch for that specific resource, or (c) revive a session-frozen custom layer if the resource's stakes demand Pitfall 3 strictly. Whichever path, add a row to the Remote-config resources table in the canonical plan and extend the drift test with a byte-identity check for the new resource.
