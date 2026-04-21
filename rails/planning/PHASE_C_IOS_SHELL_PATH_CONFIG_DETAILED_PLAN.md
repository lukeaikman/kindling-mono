# Phase C Detailed Plan — iOS shell scaffold + path configuration v1

> **Note to the AI agent executing this plan**: you need specifics, not architecture. Where this plan is explicit about commands, data-attribute names, exact Swift code, bundle IDs, port numbers, and file paths, it's not because they're clever — it's because ambiguity is how you produce bugs in a long agent session. Follow the letter of the plan. Do NOT introduce abstractions beyond what is specified: no `protocol` declarations where a concrete type is specified, no DI containers, no factory patterns, no error-handling `enum`s beyond what this plan asks for. Where the plan asks you to make a judgment call (marked **Judgment:**), make it and note what you chose in the commit message. Everything else is prescribed.

## Context

Phase A shipped Turbo + Stimulus into the mobile bundle. Phase B finished the vanilla-to-Stimulus conversion and refreshed the design system. The mobile Rails app now renders its full Epic 1 flow (splash → intro → video-intro → risk-questionnaire → onboarding → dashboard) as Hotwire-ready HTML in a browser.

Phase C drops a real iOS app — a Hotwire Native shell — around it. Same HTML, same Stimulus controllers, same Rails routes. The shell adds native chrome (`UINavigationController`, push/modal animations, safe-area handling, swipe-to-pop) and consults a **path-configuration JSON** on every Turbo navigation to decide how to present each URL.

Path-configuration is the first of a general class of **remote config resources**: JSON documents the shell fetches from Rails, caches on device, and reads session-frozen. The canonical plan (`~/.claude/plans/in-this-repo-you-moonlit-lantern.md` lines 74–119) specifies the pattern. Phase C builds the generalized `RemoteConfigStore` and uses it for its one v1 consumer (`path_configuration`). Future resources (feature flags, min-supported-version warnings, A/B toggles) register with one line and reuse the whole pipeline.

**iOS first. Android is Phase D, gated on Phase C shipping to TestFlight and getting real-user time.** Not parallel.

## Scope

### In scope

- Commit canonical `rails/config/mobile/path_configuration.json` with the seed ruleset (§1.1).
- New Rails controller `Mobile::ConfigController#show` and route `GET /mobile/config/:resource`. ETag + Last-Modified via `stale?`.
- Request specs for the controller.
- Drift + coverage tests in Minitest (Rails side, CI).
- New Xcode project at `ios/Kindling.xcodeproj` derived from the `hotwire-native-demo-ios` template. Bundle ID `app.kindling.ios`. Deployment target **iOS 16**.
- `HotwireNative` Swift Package dependency, pinned.
- Two `.xcconfig` files (Dev, Release) + Info.plist placeholder + runtime read for the Rails origin.
- `RemoteConfigStore.swift` — one concrete class, ~80 lines, no protocol, no DI container.
- Swift Testing suite for `RemoteConfigStore` — three failure-mode tests + happy path.
- Bundle `ios/Kindling/Config/path-configuration.json` in the app target (byte-identical to the Rails canonical file).
- Wire `Navigator` with `PathConfiguration(sources: [.data(RemoteConfigStore.resolve(...))])`.
- Kick off `RemoteConfigStore.refreshAll()` after first screen render.
- Register a placeholder `ErrorPresenter` (Phase H fleshes it out).

### Out of scope

- Android shell scaffold — Phase D.
- Universal Links / App Links — Phase E.
- Bridge components (native sheet picker, haptics, camera) — Phases F, G, J.
- Push notifications — Phase I.
- Offline / error polish — Phase H.
- Any change to the mobile ERB views, Stimulus controllers, CSS tokens, or Rails routes for the existing mobile flow. The shell must render what's already on main. If something looks wrong in the simulator, file a defect; don't fix it in this branch.
- Second remote-config resource beyond `path_configuration`. The `RemoteConfigStore` API is resource-oriented on day one — proving the second resource is future work.

## Pitfalls to carry

Quoted verbatim from the canonical plan. Re-read each before executing the relevant part.

**Pitfall 3 — Path-configuration (and any other remote config) follows the Remote config pattern.** Always three layers — startup reads cache (frozen for session), background fetch persists for next launch, bundled fallback covers cache-empty cases. Do NOT shortcut to "just bundle it" (loses hot-fix) or "just fetch it on every visit" (mid-session behavior changes). Do NOT apply a fetched update mid-session — freeze-at-startup is a load-bearing property, not a nice-to-have.

**Pitfall 9 — Don't forget safe-area when the native tab bar *and* home indicator both exist.** `padding-bottom: max(env(safe-area-inset-bottom), 0.75rem)` is the right pattern — never just `env(safe-area-inset-bottom)` alone if the element can sit above the home indicator.

**Pitfall 12 — Keep iOS and Android bundled remote-config fallbacks in lockstep with each other AND with the Rails source-of-truth.** Three copies exist per resource: `rails/config/mobile/<resource>.json`, `ios/Kindling/Config/<resource>.json`, `android/app/src/main/assets/config/<resource>.json`. They must stay byte-identical aside from whitespace. Any edit to one is a three-file edit in the same PR. The CI drift check fails the build if they diverge. (Android copy can be absent until Phase D ships; the drift test is shaped to soft-skip when the Android file isn't present yet — see §4.3.)

**Pitfall 13 — Never overwrite the remote-config cache with malformed data.** The background fetch MUST validate schema before writing to `UserDefaults` / `SharedPreferences`. If the server returns garbage (broken deploy, proxy interception, truncated response), leave the last-known-good cache alone. Overwriting with bad data poisons the next session and can brick the app for that user until a reinstall. Fail silently, keep the old cache, try again next launch.

**Pitfall 14 — Never expand remote config to hold secrets or per-user data.** The cache is plaintext on-device. Path-config rules, feature flags, rollout toggles — fine. Auth tokens, user IDs, PII — never.

**Pitfall 15 — Don't prescribe presentation in ERB via query params or data attributes.** The presentation rules live in ONE place — the path configuration JSON. Per-view overrides fragment the decision graph. If a screen needs custom presentation, add a rule for its URL.

**Pitfall 17 — Don't assume the iOS simulator is a substitute for device QA of haptics, push, and universal links.** Those three require physical devices. Phase C's simulator verification is sufficient for Phase C's done criteria; Phase E and beyond add device checks.

## Git strategy

Branch: `phase-c-ios-shell` off main. Four commits, one branch, `git merge --no-ff` to main when done. Do not push without explicit go-ahead.

Commit order:
1. Rails canonical JSON + `Mobile::ConfigController` + endpoint tests.
2. iOS Xcode project scaffold + `HotwireNative` Swift Package dependency.
3. `RemoteConfigStore.swift` + its Swift Testing suite.
4. Wiring (`SceneDelegate`, bundled JSON, `PathConfiguration` init, `refreshAll` kickoff, `ErrorPresenter` placeholder) + Rails drift tests + simulator verification notes in the commit message.

Why four commits and not one: reviewability. Each commit on its own compiles, passes tests, and makes the feature incrementally more real. The first commit doesn't need an iOS toolchain to review. The third is reviewable in isolation against its unit tests.

## Part 1 — Rails side

### 1.1 Canonical `path_configuration.json`

**File**: `rails/config/mobile/path_configuration.json` (new directory).

**Content** (copy verbatim — every character, including trailing newline):

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

**Rule ordering**: Hotwire matches first-rule-wins, so the specific patterns go first and `/mobile/onboarding/.*` goes near the middle so it doesn't swallow future specific onboarding routes.

**Team rule**: every new route added to `rails/config/routes.rb` under the `/mobile/*` namespace requires a matching rule in this JSON file and in `ios/Kindling/Config/path-configuration.json` **in the same PR**. CI drift test (§4.3) fails the build otherwise.

### 1.2 `Mobile::ConfigController` + route

**File**: `rails/app/controllers/mobile/config_controller.rb` (new).

```ruby
module Mobile
  class ConfigController < ApplicationController
    allow_unauthenticated_access

    RESOURCE_PATHS = {
      "path_configuration" => Rails.root.join("config/mobile/path_configuration.json")
    }.freeze

    def show
      path = RESOURCE_PATHS[params[:resource]]
      return head :not_found if path.nil? || !path.exist?

      fresh_when etag: path, last_modified: path.mtime, public: false
      render json: path.read
    end
  end
end
```

**Route** — add to `rails/config/routes.rb`, grouped with the existing mobile routes:

```ruby
get "mobile/config/:resource", to: "mobile/config#show",
  constraints: { resource: /[a-z_]+/ }, format: :json, as: :mobile_config_resource
```

**Why `fresh_when` and not manual ETag headers**: Rails handles `If-None-Match` / `If-Modified-Since` for us. Returns 304 automatically when the client's cached version matches. One line, correct behavior.

**Why `allow_unauthenticated_access`**: this endpoint must be reachable on cold start before the user has a session. There's no PII in the response — the content is the same for every user.

**Why `RESOURCE_PATHS` as a frozen hash and not dynamic file lookup**: prevents directory traversal via crafted `:resource` params. Unknown resource → 404. The `constraints: { resource: /[a-z_]+/ }` in the route provides a second belt.

### 1.3 Tests — `Mobile::ConfigControllerTest`

**File**: `rails/test/controllers/mobile/config_controller_test.rb` (new).

Four tests. Write them as Minitest cases, match the style of existing mobile controller tests.

```ruby
require "test_helper"

module Mobile
  class ConfigControllerTest < ActionDispatch::IntegrationTest
    test "GET /mobile/config/path_configuration returns 200 with JSON and ETag" do
      get mobile_config_resource_path("path_configuration")

      assert_response :ok
      assert_equal "application/json", response.media_type
      assert response.headers["ETag"].present?
      assert response.headers["Last-Modified"].present?

      body = JSON.parse(response.body)
      assert body["rules"].is_a?(Array)
      assert body["rules"].any?
    end

    test "conditional GET with matching ETag returns 304" do
      get mobile_config_resource_path("path_configuration")
      etag = response.headers["ETag"]

      get mobile_config_resource_path("path_configuration"),
        headers: { "If-None-Match" => etag }

      assert_response :not_modified
      assert response.body.blank?
    end

    test "unknown resource returns 404" do
      get mobile_config_resource_path("feature_flags")
      assert_response :not_found
    end

    test "disallowed characters in resource name are rejected by the route constraint" do
      # The constraint /[a-z_]+/ excludes uppercase, digits, dashes, dots, slashes.
      # No match = no route = 404.
      get "/mobile/config/CAPITALS.json"
      assert_response :not_found
    end
  end
end
```

**Run**: `bin/rails test test/controllers/mobile/config_controller_test.rb` — expect 4 runs, 0 failures.

### 1.4 Commit 1

```
Phase C part 1 — Mobile::ConfigController + canonical path_configuration.json

- Add rails/config/mobile/path_configuration.json with the seed
  ruleset: replace_root for splash/intro/dashboard, push for
  video-intro/risk-questionnaire/onboarding, modal for
  secure-account/login.
- New Mobile::ConfigController#show served at
  GET /mobile/config/:resource.json, backed by a frozen
  RESOURCE_PATHS hash so path traversal is structurally impossible.
  Uses fresh_when for automatic ETag + Last-Modified + conditional
  GET handling. Unknown resource -> 404.
- Four request specs: 200 happy path, 304 on matching If-None-Match,
  404 on unknown resource, route-constraint rejection of path
  traversal attempts.

No consumer yet. The iOS shell lands in later commits on this branch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Part 2 — iOS shell scaffold

### 2.1 Xcode project from the demo template

**Prerequisites**:
- Xcode 16 or later (Swift Testing is Xcode 16+).
- macOS with command-line tools installed (`xcode-select -p` returns a path).

**Commands** (run from `kindling-monorepo/`):

```bash
# 1. Clone the demo as a starting point.
git clone --depth 1 https://github.com/hotwired/hotwire-native-demo-ios.git /tmp/hn-demo-ios

# 2. Copy its project structure into ios/ — not a git clone, a plain copy.
mkdir -p ios
cp -R /tmp/hn-demo-ios/HotwireDemo ios/Kindling
cp /tmp/hn-demo-ios/HotwireDemo.xcodeproj ios/Kindling.xcodeproj -R
rm -rf /tmp/hn-demo-ios
```

**Manual renames** (Xcode → File → Rename, or via search-and-replace in the project file and target names):

- Target `HotwireDemo` → `Kindling`
- Scheme `HotwireDemo` → `Kindling`
- Bundle identifier `com.hotwired.HotwireDemo` → `app.kindling.ios`
- Display name → `Kindling`

**Deployment target**: set to iOS 16.0 in Project → General → Minimum Deployments.

**Do not**: restructure the folder layout, flatten the `Coordinator`/`Scene` files, or rename files beyond the target-rename pass. Match the demo's file organization so Hotwire docs and examples map directly.

### 2.2 `HotwireNative` Swift Package dependency

Open `ios/Kindling.xcodeproj` in Xcode. File → Add Package Dependencies…:

- URL: `https://github.com/hotwired/hotwire-native-ios`
- Dependency Rule: **Exact Version** — **1.2.1** (check the package's latest stable tag at time of execution; update this number in the commit message if a newer stable exists).
- Add to target: `Kindling`.

**Why exact version, not range**: a surprise upstream change breaks the shell silently at build time; exact pinning forces a conscious bump.

**Verify**: build the (still-empty) target. Should succeed. If the demo's `import HotwireNative` statements compile cleanly, the dependency is wired.

### 2.3 `.gitignore` for iOS build artifacts

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

### 2.4 Origin configuration via `.xcconfig`

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

**Info.plist** — add one entry:

```
<key>KindlingOrigin</key>
<string>$(KINDLING_ORIGIN)</string>
```

**Xcode build configuration wiring**: Project → Info → Configurations. Set:
- Debug → Based on `Dev.xcconfig`
- Release → Based on `Release.xcconfig`

One scheme, two build configurations. Running the scheme with Cmd-R picks Debug → Dev origin. Archive picks Release → production origin.

**Swift read** (used in §2.5):

```swift
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

`fatalError` is the right response: a missing origin is a build-misconfiguration bug, caught on first launch. Logging a warning and continuing would mask it.

### 2.5 `SceneDelegate` — Navigator wiring (first pass)

**File**: `ios/Kindling/Sources/SceneDelegate.swift` (existing from demo; replace its contents).

```swift
import UIKit
import HotwireNative

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  private var navigator: Navigator?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    let window = UIWindow(windowScene: windowScene)
    let navigator = Navigator()
    window.rootViewController = navigator.rootViewController
    window.makeKeyAndVisible()

    // Path configuration wiring lands in Part 4. For now, route at the splash.
    navigator.route(Origin.rails.appendingPathComponent("mobile/open"))

    self.window = window
    self.navigator = navigator
  }
}
```

**Delete** the demo's `AppDelegate.swift` content that configures push notifications / universal links — those land in Phases I and E. Keep the file with just the minimum:

```swift
import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
  }
}
```

**Verify**: Cmd-R against a running `bin/dev` (Rails on :3010). The simulator should open, load the splash, and auto-redirect into the intro via the existing `splash_redirect_controller`. Back button behavior will be wrong at this point (no path-config means everything pushes) — that's addressed in Part 4.

### 2.6 Commit 2

```
Phase C part 2 — iOS shell scaffold from hotwire-native-demo-ios

- New ios/Kindling.xcodeproj derived from the hotwire-native-demo-ios
  template. Bundle identifier app.kindling.ios. Deployment target iOS 16.
- HotwireNative Swift Package pinned to <VERSION>.
- .gitignore scoped to ios/ for Xcode/SPM/macOS build artifacts.
- Dev.xcconfig and Release.xcconfig expose KINDLING_ORIGIN
  (http://localhost:3010 and https://kindling.app respectively),
  interpolated into Info.plist as KindlingOrigin and read at runtime
  by Origin.rails with a fatalError on misconfiguration.
- SceneDelegate instantiates a Navigator rooted at Origin.rails
  + /mobile/open. Path configuration arrives in the next commit on
  this branch; for now every navigation pushes onto the nav stack.

Simulator launch against bin/dev verifies the Rails mobile flow
renders inside a WKWebView with native chrome wrapping it.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Part 3 — `RemoteConfigStore`

### 3.1 Interface

**File**: `ios/Kindling/Sources/RemoteConfigStore.swift` (new).

**Rules for this type**:
- Single concrete `final class`. No protocol declaration. No subclasses.
- Session-frozen via an in-memory `[String: Data]` dictionary populated on first `resolve(_:)` per name.
- `URLSession` and `UserDefaults` injected via `init` with defaults (`.shared` / `.standard`) so tests can pass stubs. That is the **only** DI in this type.
- Schema validation via `JSONDecoder().decode(schemaType, ...)`. Decode throws → skip the cache write. No custom validators, no closures, no `Result` returns.
- `refreshAll(origin:)` is `async`, iterates registered resources, issues one conditional GET per resource with stored `ETag` as `If-None-Match`. Silent on all failures.

**Full implementation** — copy verbatim:

```swift
import Foundation

final class RemoteConfigStore {
  static let shared = RemoteConfigStore()

  private struct Registration {
    let name: String
    let bundledURL: URL
    let validate: (Data) throws -> Void
  }

  private let session: URLSession
  private let defaults: UserDefaults

  private var registrations: [String: Registration] = [:]
  private var sessionCache: [String: Data] = [:]

  init(session: URLSession = .shared, defaults: UserDefaults = .standard) {
    self.session = session
    self.defaults = defaults
  }

  /// Register a resource. Call once per resource at app launch before `resolve(_:)`.
  /// The schema type is used to validate the server response before it overwrites the cache.
  func register<Schema: Decodable>(
    name: String,
    bundledURL: URL,
    schema: Schema.Type
  ) {
    registrations[name] = Registration(
      name: name,
      bundledURL: bundledURL,
      validate: { data in _ = try JSONDecoder().decode(Schema.self, from: data) }
    )
  }

  /// Session-frozen read. First call per name reads the cache (or bundled fallback).
  /// Subsequent calls return the same bytes until the app is relaunched.
  func resolve(_ name: String) -> Data {
    if let cached = sessionCache[name] { return cached }
    let data = readCache(name: name) ?? readBundled(name: name)
    sessionCache[name] = data
    return data
  }

  /// Background refresh for every registered resource. Safe to call fire-and-forget.
  /// Silent failure: malformed data, HTTP errors, and transport errors all leave the cache alone.
  func refreshAll(origin: URL) async {
    await withTaskGroup(of: Void.self) { group in
      for registration in registrations.values {
        group.addTask { [weak self] in
          await self?.refresh(registration: registration, origin: origin)
        }
      }
    }
  }

  // MARK: - Private

  private func refresh(registration: Registration, origin: URL) async {
    let url = origin
      .appendingPathComponent("mobile")
      .appendingPathComponent("config")
      .appendingPathComponent("\(registration.name).json")

    var request = URLRequest(url: url)
    if let etag = defaults.string(forKey: etagKey(registration.name)) {
      request.setValue(etag, forHTTPHeaderField: "If-None-Match")
    }

    guard
      let (data, response) = try? await session.data(for: request),
      let http = response as? HTTPURLResponse
    else { return }

    if http.statusCode == 304 { return }
    guard (200..<300).contains(http.statusCode) else { return }

    do {
      try registration.validate(data)
    } catch {
      return // Pitfall 13: do not overwrite the cache with malformed data.
    }

    defaults.set(data, forKey: cacheKey(registration.name))
    if let newEtag = http.value(forHTTPHeaderField: "ETag") {
      defaults.set(newEtag, forKey: etagKey(registration.name))
    }
  }

  private func readCache(name: String) -> Data? {
    guard let data = defaults.data(forKey: cacheKey(name)) else { return nil }
    guard let registration = registrations[name] else { return nil }
    do {
      try registration.validate(data)
      return data
    } catch {
      return nil // Malformed cache (e.g. from a previous bad write) → fall through to bundled.
    }
  }

  private func readBundled(name: String) -> Data {
    guard let registration = registrations[name] else {
      fatalError("RemoteConfigStore.resolve called for unregistered resource: \(name)")
    }
    guard let data = try? Data(contentsOf: registration.bundledURL) else {
      fatalError("Bundled fallback missing for resource: \(name) at \(registration.bundledURL.path)")
    }
    return data
  }

  private func cacheKey(_ name: String) -> String { "remote_config.\(name)" }
  private func etagKey(_ name: String) -> String { "remote_config.\(name).etag" }
}
```

**Notes to the agent**:
- `fatalError` on unregistered-resource or missing-bundled-fallback is intentional. These are build/scaffolding bugs that must be fixed before ship — not runtime conditions to recover from.
- The `Schema` generic at `register(...)` is erased into a closure at storage time. Keeps the registrations dict homogeneous.
- No logging. If we want logging later, add a single delegate callback; don't sprinkle `print` / `os_log` through the type.

### 3.2 `PathConfigurationSchema.swift`

**File**: `ios/Kindling/Sources/PathConfigurationSchema.swift` (new). One-line struct used only for decoder-based validation:

```swift
import Foundation

struct PathConfigurationSchema: Decodable {
  struct Rule: Decodable {
    let patterns: [String]
    let properties: [String: JSONPrimitive]
  }

  let rules: [Rule]
  let settings: [String: JSONPrimitive]?
}

/// Narrow helper type for decoding heterogeneous JSON property bags without `Any`.
enum JSONPrimitive: Decodable {
  case string(String)
  case int(Int)
  case bool(Bool)

  init(from decoder: Decoder) throws {
    let c = try decoder.singleValueContainer()
    if let s = try? c.decode(String.self) { self = .string(s); return }
    if let i = try? c.decode(Int.self) { self = .int(i); return }
    if let b = try? c.decode(Bool.self) { self = .bool(b); return }
    throw DecodingError.dataCorruptedError(in: c, debugDescription: "Unsupported JSON primitive")
  }
}
```

**Why this and not more**: we don't model the rules semantically in Swift — Hotwire's own `PathConfiguration` does that. We only need "does this JSON parse into the expected top-level shape?" to satisfy Pitfall 13. `PathConfigurationSchema` provides that and no more.

### 3.3 Swift Testing suite

**File**: `ios/KindlingTests/RemoteConfigStoreTests.swift` (new — create a `KindlingTests` target if the demo doesn't have one; if it does, add the file to it).

```swift
import Testing
import Foundation
@testable import Kindling

@Suite("RemoteConfigStore")
struct RemoteConfigStoreTests {
  @Test("empty cache falls back to bundled fallback")
  func emptyCacheFallsBackToBundled() throws {
    let bundled = try bundledJSON(#"{"rules":[{"patterns":["/a$"],"properties":{}}]}"#)
    let defaults = UserDefaults(suiteName: "test.empty-cache")!
    defaults.removePersistentDomain(forName: "test.empty-cache")

    let store = RemoteConfigStore(session: .shared, defaults: defaults)
    store.register(name: "path_configuration", bundledURL: bundled, schema: PathConfigurationSchema.self)

    let data = store.resolve("path_configuration")
    let decoded = try JSONDecoder().decode(PathConfigurationSchema.self, from: data)
    #expect(decoded.rules.count == 1)
  }

  @Test("malformed cache falls back to bundled fallback")
  func malformedCacheFallsBackToBundled() throws {
    let bundled = try bundledJSON(#"{"rules":[]}"#)
    let defaults = UserDefaults(suiteName: "test.malformed-cache")!
    defaults.removePersistentDomain(forName: "test.malformed-cache")
    defaults.set(Data("garbage".utf8), forKey: "remote_config.path_configuration")

    let store = RemoteConfigStore(session: .shared, defaults: defaults)
    store.register(name: "path_configuration", bundledURL: bundled, schema: PathConfigurationSchema.self)

    let data = store.resolve("path_configuration")
    #expect(try JSONDecoder().decode(PathConfigurationSchema.self, from: data).rules.isEmpty)
  }

  @Test("malformed fetched payload leaves existing cache intact")
  func malformedFetchLeavesCacheIntact() async throws {
    let bundled = try bundledJSON(#"{"rules":[]}"#)
    let defaults = UserDefaults(suiteName: "test.malformed-fetch")!
    defaults.removePersistentDomain(forName: "test.malformed-fetch")
    let goodCache = Data(#"{"rules":[{"patterns":["/x$"],"properties":{}}]}"#.utf8)
    defaults.set(goodCache, forKey: "remote_config.path_configuration")

    let session = URLSession.stubbed(status: 200, body: Data(#"{"not":"path-config"}"#.utf8))
    let store = RemoteConfigStore(session: session, defaults: defaults)
    store.register(name: "path_configuration", bundledURL: bundled, schema: PathConfigurationSchema.self)

    await store.refreshAll(origin: URL(string: "https://example.test")!)

    let surviving = defaults.data(forKey: "remote_config.path_configuration")
    #expect(surviving == goodCache)
  }

  @Test("valid fetched payload overwrites cache and stores ETag")
  func validFetchOverwritesCache() async throws {
    let bundled = try bundledJSON(#"{"rules":[]}"#)
    let defaults = UserDefaults(suiteName: "test.valid-fetch")!
    defaults.removePersistentDomain(forName: "test.valid-fetch")

    let newBody = Data(#"{"rules":[{"patterns":["/new$"],"properties":{}}]}"#.utf8)
    let session = URLSession.stubbed(status: 200, body: newBody, etag: "\"abc123\"")
    let store = RemoteConfigStore(session: session, defaults: defaults)
    store.register(name: "path_configuration", bundledURL: bundled, schema: PathConfigurationSchema.self)

    await store.refreshAll(origin: URL(string: "https://example.test")!)

    #expect(defaults.data(forKey: "remote_config.path_configuration") == newBody)
    #expect(defaults.string(forKey: "remote_config.path_configuration.etag") == "\"abc123\"")
  }

  // MARK: - Helpers

  private func bundledJSON(_ body: String) throws -> URL {
    let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".json")
    try Data(body.utf8).write(to: url)
    return url
  }
}
```

**`URLSession.stubbed(...)` helper** — create `ios/KindlingTests/URLSession+Stubbed.swift`:

```swift
import Foundation

extension URLSession {
  static func stubbed(status: Int, body: Data, etag: String? = nil) -> URLSession {
    StubProtocol.stub = (status, body, etag)
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [StubProtocol.self]
    return URLSession(configuration: config)
  }
}

final class StubProtocol: URLProtocol {
  static var stub: (status: Int, body: Data, etag: String?) = (200, Data(), nil)

  override class func canInit(with request: URLRequest) -> Bool { true }
  override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

  override func startLoading() {
    var headers: [String: String] = ["Content-Type": "application/json"]
    if let etag = Self.stub.etag { headers["ETag"] = etag }

    let response = HTTPURLResponse(
      url: request.url!,
      statusCode: Self.stub.status,
      httpVersion: "HTTP/1.1",
      headerFields: headers
    )!

    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
    client?.urlProtocol(self, didLoad: Self.stub.body)
    client?.urlProtocolDidFinishLoading(self)
  }

  override func stopLoading() {}
}
```

**Run**: Cmd-U in Xcode. Four tests pass. If Xcode older than 16 is in use, Swift Testing isn't available — that's a blocker, upgrade Xcode before continuing.

### 3.4 Commit 3

```
Phase C part 3 — RemoteConfigStore + Swift Testing suite

- Single final class RemoteConfigStore, ~110 lines. No protocol, no
  DI container. URLSession and UserDefaults injected via init for
  test stubbing; everything else concrete.
- register<Schema: Decodable>(name:bundledURL:schema:) registers a
  resource and its validation schema. resolve(_:) is session-frozen.
  refreshAll(origin:) iterates registered resources, conditional GETs
  with stored ETag, validates via JSONDecoder().decode(Schema.self,...)
  before overwriting cache. Silent failure on transport, HTTP, and
  validation errors (Pitfall 13).
- PathConfigurationSchema.swift models the minimum shape needed for
  decoder-based validation — no semantic modelling of rules.
- Swift Testing suite covers the four canonical scenarios: empty
  cache falls back to bundled, malformed cache falls back to bundled,
  malformed fetched payload leaves cache intact, valid fetched payload
  overwrites cache and stores ETag. URLProtocol-based stub for
  URLSession isolation.
- KindlingTests target created alongside Kindling app target.

Not yet wired into SceneDelegate — that lands in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Part 4 — Wiring + drift tests

### 4.1 Bundle `path-configuration.json` into the iOS target

Copy `rails/config/mobile/path_configuration.json` to `ios/Kindling/Config/path-configuration.json`. **Byte-identical** — use `cp`, not manual copy-paste.

In Xcode: drag the file into the `Kindling` target, "Copy items if needed" = **off** (we want the file at its source location, added to the target's Copy Bundle Resources phase), "Create folder references" = **yes** (blue folder icon).

**Verify**: build, then inside the `.app` bundle, `find Kindling.app -name path-configuration.json` returns a hit. `diff <rails-path> <ios-path>` shows identical.

### 4.2 Wire `RemoteConfigStore` into `SceneDelegate`

Replace the body of `scene(_:willConnectTo:options:)` with:

```swift
func scene(
  _ scene: UIScene,
  willConnectTo session: UISceneSession,
  options connectionOptions: UIScene.ConnectionOptions
) {
  guard let windowScene = scene as? UIWindowScene else { return }

  // 1. Register remote-config resources before anything reads them.
  let bundledPathConfig = Bundle.main.url(forResource: "path-configuration", withExtension: "json")!
  RemoteConfigStore.shared.register(
    name: "path_configuration",
    bundledURL: bundledPathConfig,
    schema: PathConfigurationSchema.self
  )

  // 2. Frozen for this session. Hotwire parses the bytes once.
  let pathConfig = PathConfiguration(
    sources: [.data(RemoteConfigStore.shared.resolve("path_configuration"))]
  )

  // 3. Navigator with the parsed path configuration.
  let navigator = Navigator(pathConfiguration: pathConfig)

  let window = UIWindow(windowScene: windowScene)
  window.rootViewController = navigator.rootViewController
  window.makeKeyAndVisible()

  // 4. Route at the splash. Turbo takes over from here.
  navigator.route(Origin.rails.appendingPathComponent("mobile/open"))

  self.window = window
  self.navigator = navigator

  // 5. Background refresh after the first screen renders. Fire-and-forget.
  Task.detached(priority: .background) {
    await RemoteConfigStore.shared.refreshAll(origin: Origin.rails)
  }
}
```

**Step 5 is after `makeKeyAndVisible` deliberately** — startup blocks on nothing network-related. The background task is scheduled, not awaited.

### 4.3 Error presenter placeholder

Phase H fleshes this out. For now, register the minimum so `WKError` doesn't crash the app.

**File**: `ios/Kindling/Sources/KindlingErrorPresenter.swift` (new).

```swift
import UIKit
import HotwireNative

final class KindlingErrorPresenter: ErrorPresenter {
  func presentError(_ error: Error, in navigator: Navigator) {
    let alert = UIAlertController(
      title: "Something went wrong",
      message: "We couldn't load this screen. Phase H will make this better.",
      preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    navigator.rootViewController.present(alert, animated: true)
  }
}
```

Wire it in `SceneDelegate` after `Navigator(...)` is constructed:

```swift
navigator.errorPresenter = KindlingErrorPresenter()
```

(Exact API name — `errorPresenter` vs `setErrorPresenter(_:)` vs `delegate` — depends on the pinned HotwireNative version. Check the package's `Navigator.swift`. If the property name differs, match it; otherwise this is the right shape.)

### 4.4 Drift + coverage tests — Rails side

**File**: `rails/test/mobile/path_configuration_drift_test.rb` (new — create `test/mobile/` directory).

```ruby
require "test_helper"

class PathConfigurationDriftTest < ActiveSupport::TestCase
  CANONICAL = Rails.root.join("config/mobile/path_configuration.json")
  IOS_BUNDLED = Rails.root.join("../ios/Kindling/Config/path-configuration.json")
  ANDROID_BUNDLED = Rails.root.join("../android/app/src/main/assets/config/path-configuration.json")

  test "iOS bundled path_configuration is byte-identical to Rails canonical" do
    skip "iOS bundled file not yet committed (Phase C in progress)" unless IOS_BUNDLED.exist?

    assert_equal CANONICAL.read, IOS_BUNDLED.read,
      "Rails canonical and iOS bundled path_configuration.json have diverged. Re-copy the Rails file into the iOS target."
  end

  test "Android bundled path_configuration is byte-identical to Rails canonical" do
    skip "Android bundled file not yet committed (Phase D)" unless ANDROID_BUNDLED.exist?

    assert_equal CANONICAL.read, ANDROID_BUNDLED.read,
      "Rails canonical and Android bundled path_configuration.json have diverged."
  end

  test "every /mobile/* route has at least one matching path_configuration rule" do
    patterns = JSON.parse(CANONICAL.read).fetch("rules").flat_map { |r| r.fetch("patterns") }
    regexes = patterns.map { |p| Regexp.new(p) }

    mobile_routes = Rails.application.routes.routes.map do |route|
      route.path.spec.to_s.sub("(.:format)", "")
    end.select { |path| path.start_with?("/mobile/") }

    # Exclude the config endpoint itself — it's shell → server, not shell → user-facing page.
    mobile_routes -= ["/mobile/config/:resource"]

    unmatched = mobile_routes.reject { |path| regexes.any? { |re| path.match?(re) } }
    assert unmatched.empty?, "These mobile routes have no matching path-config rule: #{unmatched.join(', ')}. Add a rule to rails/config/mobile/path_configuration.json (and the bundled copies) in the same PR that added the route."
  end

  test "every path_configuration pattern matches at least one real route" do
    patterns = JSON.parse(CANONICAL.read).fetch("rules").flat_map { |r| r.fetch("patterns") }

    mobile_routes = Rails.application.routes.routes.map do |route|
      route.path.spec.to_s.sub("(.:format)", "")
    end.select { |path| path.start_with?("/mobile/") }

    dead = patterns.reject do |pattern|
      regex = Regexp.new(pattern)
      mobile_routes.any? { |path| path.match?(regex) }
    end
    assert dead.empty?, "These path-config patterns match no actual route (dead rules): #{dead.join(', ')}. Remove from path_configuration.json or fix the pattern."
  end
end
```

**Run**: `bin/rails test test/mobile/path_configuration_drift_test.rb` — expect 4 runs, 0 failures (Android test skips until Phase D).

**Why two directions of coverage**: missing rule ships a route with Hotwire's default presentation (probably wrong). Dead rule is less urgent but compounds into bit-rot over months — it's free to catch now.

### 4.5 Simulator verification

Record the following in the commit message, not in a doc:

1. Cold-start with fresh simulator (erase all content and settings first). App launches, splash shows, `splash_redirect_controller` fires, navigates to `/mobile/intro`. Back button on `/mobile/intro` does NOT return to splash (confirms `replace_root`).
2. Tap "Create your will and estate plan" on intro → POST to `/mobile/intro/continue` → redirect to `/mobile/onboarding/welcome`. Screen PUSHES onto nav stack with native animation (swipe-from-left-edge to pop works).
3. Walk welcome → location → family → extended-family → wrap-up. Each screen pushes. Swipe-back works at every step.
4. Navigate to `/mobile/auth/secure-account` from the wrap-up Continue button → presents MODALLY (sheet from bottom, grab handle, swipe-to-dismiss). Not a push.
5. Navigate to `/mobile/login` → presents MODALLY.
6. Open the simulator's Safari and visit the running Rails origin directly to confirm visual parity (browser vs WKWebView should look identical).
7. **Remote-config refresh cycle**: with the app running, edit `rails/config/mobile/path_configuration.json` (e.g. change `/mobile/dashboard` presentation from `replace_root` to `push`). Without rebuilding the iOS app, cold-start the app → session still uses the old behavior (cache from previous launch). Force-quit and relaunch → new behavior in effect. This proves the next-launch-apply property.
8. **Malformed response guardrail**: temporarily change `Mobile::ConfigController#show` to render `{ "not": "path-config" }` instead of the file. Relaunch the app → `RemoteConfigStore` rejects the response in `validate`, cache retains the last-known-good version, no crash. Revert the controller change.
9. Open DevTools on the simulator's web inspector (`Safari → Develop → Simulator → [WKWebView]`). Console: zero JS errors. Tap through a choice-group and a picker; confirm both still work inside the webview exactly as in-browser.

### 4.6 Commit 4

```
Phase C part 4 — Wire Navigator to PathConfiguration + drift tests

- ios/Kindling/Config/path-configuration.json bundled into the app
  target, byte-identical to rails/config/mobile/path_configuration.json.
- SceneDelegate now registers the path_configuration resource with
  RemoteConfigStore.shared, resolves the cached-or-bundled bytes,
  constructs Hotwire's PathConfiguration from them, and hands it to
  Navigator. refreshAll kicks off as a detached background task
  after makeKeyAndVisible so startup is never blocked on network.
- KindlingErrorPresenter placeholder registered on the Navigator so
  WKError no longer crashes the app; Phase H replaces the alert with
  a real offline screen.
- test/mobile/path_configuration_drift_test.rb enforces: Rails
  canonical == iOS bundled (hard), Rails canonical == Android bundled
  (soft-skip until Phase D), every /mobile/* route has a matching
  rule, every rule pattern matches at least one real route.
- Simulator verification walked end-to-end per the plan. Splash
  replace_root, push on video-intro/onboarding, modal on
  secure-account/login — all behave as the path config dictates.
  Remote-config refresh cycle and malformed-response guardrail both
  pass.

Phase C done criteria 1-8 satisfied. Ready for --no-ff merge to main.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Verification checklist

### Automated (CI)

- [ ] `bin/rails test` — 0 failures. New tests: 4 in `Mobile::ConfigControllerTest`, 4 in `PathConfigurationDriftTest` (one skipped). Expected total: 187 assertions pass, up from 179.
- [ ] Swift Testing suite (Cmd-U in Xcode) — 4 tests pass in `RemoteConfigStoreTests`.

### Simulator (end-of-phase gate)

Per §4.5 — nine scenarios walked and recorded in commit 4's message.

### Objective spot-checks

- `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3010/mobile/config/path_configuration.json` → 200 on cold request, 304 on conditional GET with the returned ETag.
- `diff rails/config/mobile/path_configuration.json ios/Kindling/Config/path-configuration.json` → empty output.
- `grep -rn 'data-presentation\|data-modal\|data-push' rails/app/views/mobile/` → empty (Pitfall 15 — no ERB-level presentation overrides).
- `grep -rn 'window.location.href\|window.location.assign\|window.location.replace' rails/app/javascript/` → empty (Pitfall A1 carries forward — Turbo-bypassing navigation is still forbidden).

## Done criteria

Phase C is complete when all of the following hold:

1. Branch `phase-c-ios-shell` has four commits as specified (Rails / scaffold / store / wiring).
2. `bin/rails test` passes with the new 8 assertions included.
3. Swift Testing suite passes.
4. All nine simulator scenarios from §4.5 verified and captured in commit 4's message.
5. `ios/Kindling.xcodeproj` builds for both Debug (Dev origin) and Release (production origin) without warnings.
6. `ios/` contains a valid `.gitignore`; `xcuserdata/` is absent from the tree.
7. Drift test enforces Rails ↔ iOS byte-identity and flags any route missing a rule.
8. Branch merged to main with `git merge --no-ff`. Branch deleted.

## Handoff to Phase D and Phase E

**Phase D — Android shell scaffold**:

- Reuses the exact Rails endpoint (`GET /mobile/config/path_configuration.json`). No Rails changes needed.
- Builds the Kotlin equivalent of `RemoteConfigStore` — same three-method interface, `SharedPreferences` in place of `UserDefaults`, `OkHttp` or Ktor in place of `URLSession`. The Swift source in this phase is the reference.
- `android/app/src/main/assets/config/path-configuration.json` is a byte-identical copy of `rails/config/mobile/path_configuration.json`. The drift test in §4.4 un-skips automatically once the Android file is committed.
- Phase D's detail plan should open with the same canonical-path note and the same Pitfalls list. Items 3, 9, 12, 13, 14, 15, 17 all carry; pitfalls specific to Android surface during detail planning.

**Phase E — Universal Links + App Links**:

- Needs a staging origin. Add `ios/Kindling/Config/Staging.xcconfig` and a third build configuration at that point.
- Rails side: host `apple-app-site-association` JSON at `/.well-known/apple-app-site-association`. `app.kindling.ios` associated domains `applinks:kindling.app` and `applinks:staging.kindling.app`.
- iOS side: wire `UIApplicationDelegate.application(_:continue:restorationHandler:)` to pass the URL to `navigator.route(url:)`. The path-config's `replace_root` rule for `/mobile/open` already handles the "deep-link lands on splash" case correctly — no new rules needed.
- Phase E's detail plan inherits this `.xcconfig` pattern and the existing path-config entries. No retrofit required.

**New resource in `RemoteConfigStore` (any future phase)**:

Five-line recipe, not a re-implementation:

```swift
RemoteConfigStore.shared.register(
  name: "feature_flags",
  bundledURL: Bundle.main.url(forResource: "feature-flags", withExtension: "json")!,
  schema: FeatureFlagsSchema.self
)
```

Plus: commit `rails/config/mobile/feature_flags.json`, bundle `ios/Kindling/Config/feature-flags.json` byte-identical, extend the drift test with two lines for the new resource, add a row to the Remote-config resources table in the canonical plan. That's the whole pattern — anything more is premature.
