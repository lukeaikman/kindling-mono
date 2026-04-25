# Phase G — Haptics bridge + dev origin override

> **For the agent**: two things ship on this branch. (1) A runtime override for the Rails origin URL, so a physical device running the Dev build can tunnel to the developer's `bin/dev` via ngrok / LocalTunnel. (2) The haptics bridge the canonical plan calls Phase G. The override comes first because without it the haptics work can't be verified on hardware, and simulator haptics are muted. Do both; commit once; merge once.
>
> Keep each file exactly as scoped. No extending the dev chooser into a full settings screen. No haptic library. No dispatcher singleton. Trust the framework; the work is small.

## Why both, together

Phase F shipped the first bridge component and proved the plumbing. Phase G ships the second — haptics — but haptics only work on physical devices (simulators mute them by spec). Today the iOS app's origin URL is pinned at compile time to `http://localhost:3010` for Dev builds. A physical iPhone can't reach that laptop-local URL. So without a runtime override, we'd ship haptics code we can't verify.

The fix is small: read an optional override from `UserDefaults` in the Dev build only, fall back to the compile-time default if absent. A trivial VC lets the developer paste in a tunnel URL. Combined with `ngrok http 3010` on the dev machine, the phone connects to local Rails in seconds. This infrastructure pays back across Phase G (haptics), Phase I (push), and Phase J (camera) — every phase that needs physical-device verification.

## What we ship (final state after merge)

### Dev origin override (Phase F.5)
- `Origin.rails` resolves at runtime in Dev builds: override URL from `UserDefaults.standard.string(forKey: "kindling.dev.overrideURL")` takes precedence over the compile-time default. Release builds ignore the override entirely — compile-time URL is the only option.
- New `DevOriginController.swift` — a minimal modal VC (text field + Save + Clear + Cancel). HTTPS-only input validation with a clear error message on http:// or invalid URLs.
- Shake gesture (iOS dev convention) opens the chooser from any screen in Dev builds.
- Save behavior: writes to `UserDefaults`, shows "Relaunch to apply" alert. User force-quits the app (swipe up) and relaunches. Fresh launch reads the new URL. No hot-swap needed — dev-only flow, simplicity beats cleverness.

### Haptics bridge (Phase G proper)
- `HapticsComponent.swift` — `BridgeComponent` named `"haptics"`. Handles `{ style: String }` messages, routes to `UIImpactFeedbackGenerator` (light/medium/heavy), `UINotificationFeedbackGenerator` (success/warning/error), or `UISelectionFeedbackGenerator` (selection). No reply. Synthesizers are created per-message (no caching — they're lightweight and this avoids stale-state bugs).
- `haptic_controller.js` — `BridgeComponent`. Attaches a click listener on connect. Sends `{ style }` on click when `this.enabled`. Silent in browser.
- Apply to the most impactful interactions first:
  - Choice-group option selection (light) — wired into `_choice_group.html.erb`.
  - Primary `.mobile-button` click (medium) — wired via a helper that adds the `data-controller` attribute, OR by adding attributes to the existing call sites (choose one; see §2.4).
  - Sticky-action CTA tap (medium) — if different from `.mobile-button`, handled there.
- Haptic on form-submit success/error is out of scope for this phase — the trigger is `turbo:submit-end` event driven and needs a different attachment. Queue as Phase G.1 if there's demand.

### Out of scope
- A full settings/debug menu. The dev chooser is one text field. No other toggles.
- Persisting multiple recent tunnel URLs. Type once, relaunch, done.
- Android (all of it).
- Haptic libraries or abstractions over `UIFeedbackGenerator`. One switch statement, done.
- Haptic on any non-click event (change, submit, turbo:load). One event type in v1.
- Custom haptic "patterns" (sequences of impacts). Single events only.

## Pitfalls that apply

From the canonical list at `~/.claude/plans/in-this-repo-you-moonlit-lantern.md:442`:

- **Pitfall 16** — the haptic JS controller depends on the bridge. Import order in `mobile.js` (Turbo → bridge → controllers) was already fixed in Phase F; don't reorder.
- **Pitfall 17** — "Don't assume the iOS simulator is a substitute for device QA of haptics." This phase's entire motivation. Simulator smoke check catches no-crash; real verification is on a real phone.

Phase-specific pitfalls surfaced during planning:

- **Don't gate on release-build safety with runtime checks.** The override-reading code is guarded at compile time with `#if KINDLING_ORIGIN_DEV`. A Release build literally cannot see the override key; the UserDefaults read doesn't exist in the compiled binary. Runtime-only gates are weaker and easier to accidentally strip.
- **Don't rebuild the Navigator mid-session after saving an override.** The Navigator has in-flight web views, cookies, snapshot caches — re-pointing at a new origin will produce confusing state. Force-quit-and-relaunch is the honest way.
- **Don't attach haptics via a global document-level listener.** Stimulus controllers are the pattern. One controller per trigger. Explicit wiring beats magical attribute-hunting.

## Before you touch anything

```bash
# iOS — confirm current origin resolution.
grep -n "KINDLING_ORIGIN_DEV\|localhost" ios/Kindling/Origin.swift        # expect line 4 + 5

# iOS — confirm bridge dir is clean (just DatePickerComponent).
ls ios/Kindling/Bridge/                                                    # DatePickerComponent.swift

# Rails — confirm the choice-group partial is unchanged from Phase B.
grep -c "choice-group" rails/app/views/mobile/shared/_choice_group.html.erb   # 2
```

If these don't match, stop and report.

## Commit strategy

Branch: `mobile-phase-g`.

**Commit 1 — agent (this plan).** All Swift source + all Rails/JS changes + plan doc. After this commit, Rails tests green, iOS source on disk but pbxproj doesn't reference the two new Swift files (`DevOriginController.swift`, `HapticsComponent.swift`). Build broken until commit 2.

**Commit 2 — user in Xcode.** Add both new Swift files to the Kindling target. Build for simulator. Smoke-test: simulator shake → chooser opens; tapping a choice-group radio sends a bridge message (check Xcode console `[Bridge] display → haptics.play {...}`). Then device verification via ngrok — see §5.

## §1 — Dev origin override (Phase F.5)

### 1.1 Extend `Origin.swift`

**File**: `ios/Kindling/Origin.swift` (replace entirely).

```swift
import Foundation

enum Origin {
    static let overrideDefaultsKey = "kindling.dev.overrideURL"

    static let rails: URL = {
        #if KINDLING_ORIGIN_DEV
        if let override = devOverride() {
            return override
        }
        return URL(string: "http://localhost:3010")!
        #elseif KINDLING_ORIGIN_PROD
        return URL(string: "https://kindling.app")!
        #else
        #error("No origin flag set. Check Dev.xcconfig / Release.xcconfig contains -D KINDLING_ORIGIN_DEV or -D KINDLING_ORIGIN_PROD.")
        #endif
    }()

    #if KINDLING_ORIGIN_DEV
    private static func devOverride() -> URL? {
        guard let raw = UserDefaults.standard.string(forKey: overrideDefaultsKey),
              !raw.isEmpty,
              let url = URL(string: raw),
              url.scheme == "https" else { return nil }
        return url
    }
    #endif
}
```

`rails` stays `static let` — the value resolves once at launch, which is exactly what we want. The save flow is force-quit-and-relaunch, so a fresh `static let` evaluation picks up the new override. No need for per-access re-reading.

HTTPS-only filter is belt-and-braces. The chooser UI rejects non-https input, but the read-path double-checks so a bad value written out-of-band (Xcode debugger, another dev tool) can't break the app.

### 1.2 Create `DevOriginController.swift`

**File**: `ios/Kindling/DevOriginController.swift` (new).

```swift
#if KINDLING_ORIGIN_DEV

import UIKit

final class DevOriginController: UIViewController {
    var onDismiss: (() -> Void)?

    private let textField = UITextField()
    private let errorLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        title = "Dev origin override"

        navigationItem.leftBarButtonItem = UIBarButtonItem(
            systemItem: .cancel,
            primaryAction: UIAction { [weak self] _ in self?.dismissAndNotify() }
        )
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            systemItem: .save,
            primaryAction: UIAction { [weak self] _ in self?.save() }
        )

        let stack = UIStackView(arrangedSubviews: [
            makeLabel("Paste an HTTPS tunnel URL (e.g. https://xyz.ngrok.io). Leave blank + Clear to revert to the compile-time default."),
            textField,
            errorLabel,
            makeClearButton()
        ])
        stack.axis = .vertical
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)

        textField.placeholder = "https://…"
        textField.borderStyle = .roundedRect
        textField.autocapitalizationType = .none
        textField.autocorrectionType = .no
        textField.keyboardType = .URL
        textField.text = UserDefaults.standard.string(forKey: Origin.overrideDefaultsKey)

        errorLabel.textColor = .systemRed
        errorLabel.font = .preferredFont(forTextStyle: .footnote)
        errorLabel.numberOfLines = 0
        errorLabel.text = nil

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
    }

    private func makeLabel(_ text: String) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = .preferredFont(forTextStyle: .footnote)
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        return label
    }

    private func makeClearButton() -> UIButton {
        var config = UIButton.Configuration.plain()
        config.title = "Clear override"
        let button = UIButton(configuration: config, primaryAction: UIAction { [weak self] _ in
            UserDefaults.standard.removeObject(forKey: Origin.overrideDefaultsKey)
            self?.showRelaunchAlert(message: "Override cleared. Force-quit and relaunch to use the compile-time default.")
        })
        return button
    }

    private func save() {
        let raw = textField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if raw.isEmpty {
            errorLabel.text = "Enter a URL or use Clear."
            return
        }
        guard let url = URL(string: raw), url.scheme == "https", url.host != nil else {
            errorLabel.text = "URL must start with https:// and be valid."
            return
        }

        UserDefaults.standard.set(url.absoluteString, forKey: Origin.overrideDefaultsKey)
        showRelaunchAlert(message: "Saved. Force-quit and relaunch to connect to \(url.host ?? url.absoluteString).")
    }

    private func showRelaunchAlert(message: String) {
        let alert = UIAlertController(title: "Relaunch required", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.dismissAndNotify()
        })
        present(alert, animated: true)
    }

    private func dismissAndNotify() {
        dismiss(animated: true) { [onDismiss] in
            onDismiss?()
        }
    }
}

#endif
```

Everything inside `#if KINDLING_ORIGIN_DEV` — Release builds never compile the type. No runtime gate, no accidental exposure.

### 1.3 Shake-to-open in `SceneController`

**File**: `ios/Kindling/SceneController.swift` (replace entirely).

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

        let window = ShakeObservingWindow(windowScene: windowScene)
        window.rootViewController = navigator.rootViewController
        window.makeKeyAndVisible()
        self.window = window

        navigator.start()
    }
}

/// Catches shake gestures anywhere in the app and opens the dev origin
/// chooser. Dev builds only — Release builds skip the handler entirely.
final class ShakeObservingWindow: UIWindow {
    #if KINDLING_ORIGIN_DEV
    private var chooserIsPresented = false
    #endif

    override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        super.motionEnded(motion, with: event)

        #if KINDLING_ORIGIN_DEV
        guard motion == .motionShake else { return }
        presentDevOriginChooser()
        #endif
    }

    #if KINDLING_ORIGIN_DEV
    private func presentDevOriginChooser() {
        guard !chooserIsPresented, let top = topViewController else { return }
        chooserIsPresented = true

        let chooser = DevOriginController()
        chooser.onDismiss = { [weak self] in self?.chooserIsPresented = false }

        let nav = UINavigationController(rootViewController: chooser)
        nav.modalPresentationStyle = .formSheet
        top.present(nav, animated: true)
    }

    private var topViewController: UIViewController? {
        var top = rootViewController
        while let presented = top?.presentedViewController {
            top = presented
        }
        return top
    }
    #endif
}
```

`UIWindow.motionEnded(_:with:)` fires on the active window when the device shakes. iOS 16+ delivers this reliably to the key window. No notification subscription needed.

## §2 — Haptics bridge (Phase G proper)

### 2.1 `HapticsComponent.swift`

**File**: `ios/Kindling/Bridge/HapticsComponent.swift` (new).

```swift
import Foundation
import HotwireNative
import UIKit

/// Bridge component that plays a single native haptic when the web
/// sends a "play" event. No reply.
final class HapticsComponent: BridgeComponent {
    override class var name: String { "haptics" }

    override func onReceive(message: Message) {
        guard let event = Event(rawValue: message.event) else { return }

        switch event {
        case .play:
            handlePlay(message: message)
        }
    }

    private func handlePlay(message: Message) {
        guard let data: PlayData = message.data() else { return }
        Self.play(style: data.style)
    }

    private static func play(style: String) {
        switch style {
        case "light":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "medium":
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case "heavy":
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case "soft":
            UIImpactFeedbackGenerator(style: .soft).impactOccurred()
        case "rigid":
            UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        case "success":
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        case "warning":
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case "error":
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        case "selection":
            UISelectionFeedbackGenerator().selectionChanged()
        default:
            break
        }
    }
}

private extension HapticsComponent {
    enum Event: String {
        case play
    }

    struct PlayData: Decodable {
        let style: String
    }
}
```

Synthesizers are allocated per call. Apple's docs note this is fine — the generator is lightweight and `impactOccurred()` is synchronous. Caching them would require worrying about `prepare()` state and lifecycle; not worth it.

### 2.2 Register in `AppDelegate`

**File**: `ios/Kindling/AppDelegate.swift`.

Change the single `registerBridgeComponents` line:

```swift
Hotwire.registerBridgeComponents([
    DatePickerComponent.self,
    HapticsComponent.self
])
```

That's it.

### 2.3 `haptic_controller.js`

**File**: `rails/app/javascript/controllers/haptic_controller.js` (new).

```js
import { BridgeComponent } from "@hotwired/hotwire-native-bridge"

// data-controller="haptic" data-haptic-style-value="medium"
// Attaches to any element; fires a haptic on click. Browser silent.
export default class extends BridgeComponent {
  static component = "haptics"
  static values = { style: { type: String, default: "medium" } }

  connect() {
    super.connect()
    this.handler = this.#play.bind(this)
    this.element.addEventListener("click", this.handler)
  }

  disconnect() {
    if (this.handler) {
      this.element.removeEventListener("click", this.handler)
    }
    super.disconnect()
  }

  #play() {
    if (!this.enabled) return
    this.send("play", { style: this.styleValue })
  }
}
```

### 2.4 Wire the four hook points

Attach `data-controller="haptic"` + `data-haptic-style-value="…"` to:

**Choice-group options.** Edit `rails/app/views/mobile/shared/_choice_group.html.erb`. Find the `<div class="mobile-choice-option mobile-radio-option">` wrapping each option and add the haptic controller:

```erb
<div class="mobile-choice-option mobile-radio-option"
  data-controller="haptic"
  data-haptic-style-value="light">
  <%= radio_button_tag field_name, option_value, current_value == option_value.to_s, id: option_id, data: { action: "change->choice-group#select" } %>
  <%= label_tag option_id, option_label %>
</div>
```

Light impact — selecting an answer should feel like a tactile affirmation, not a thump.

**Primary buttons** — `.mobile-button` class. There are ~8 call sites (see grep output from planning). For this phase, don't wire every button individually. Instead, wire the ones along the onboarding hot path first:

- `rails/app/views/mobile/startup/intro.html.erb` — "Create your will and estate plan" button
- `rails/app/views/mobile/startup/video_intro.html.erb` — Continue
- `rails/app/views/mobile/startup/risk_questionnaire.html.erb` — Continue
- `rails/app/views/mobile/onboarding/welcome.html.erb` — Continue
- `rails/app/views/mobile/onboarding/location.html.erb` — Continue
- `rails/app/views/mobile/onboarding/family.html.erb` — Continue
- `rails/app/views/mobile/onboarding/extended_family.html.erb` — Continue
- `rails/app/views/mobile/onboarding/wrap_up.html.erb` — Continue (if present)
- `rails/app/views/mobile/sessions/new.html.erb` — Log in

Pattern: add `data: { controller: "haptic", haptic_style_value: "medium" }` to the existing `form.submit` / `button_to` / `link_to` call. Example for `form.submit`:

```erb
<%= form.submit "Continue", class: "mobile-button", data: { controller: "haptic", haptic_style_value: "medium" } %>
```

For `button_to`:

```erb
<%= button_to "Continue", mobile_complete_video_path, method: :post, class: "mobile-button", data: { controller: "haptic", haptic_style_value: "medium" } %>
```

For `link_to` (merge any existing `data:` hash with the haptic keys — Ruby takes the last duplicate key, so two separate `data:` hashes silently drop one):

```erb
<%= link_to "Create your will and estate plan", mobile_intro_continue_path, class: "mobile-button", data: { turbo_method: :post, controller: "haptic", haptic_style_value: "medium" } %>
```

**Add/Remove child buttons** in `_child_fields.html.erb` + `family.html.erb` can skip haptics for v1 — they're secondary actions, lower priority.

**Date field trigger** (from Phase F) — the native wheel already provides its own haptic feedback when the drums snap. Don't double-up.

## Commit messages

**Commit 1** (agent):

```
Phase G commit 1 — haptics bridge + dev origin override

Dev origin override (Phase F.5):
- Origin.swift: rails URL is now a var; Dev builds consult
  UserDefaults["kindling.dev.overrideURL"] first, fall back to
  compile-time localhost:3010 if absent or invalid. Release
  builds compile without the override code path.
- DevOriginController.swift: modal VC with text field + Save +
  Clear + Cancel. HTTPS-only validation. "Relaunch to apply"
  alert on save; dev manually force-quits.
- SceneController.swift: ShakeObservingWindow catches device
  shakes in Dev builds and presents the chooser.

Haptics (Phase G):
- HapticsComponent.swift: BridgeComponent "haptics". Plays a
  single UIImpactFeedbackGenerator / UINotificationFeedback /
  UISelectionFeedback event per {style} string. No reply.
- haptic_controller.js: BridgeComponent. Click listener on its
  element; sends {style} when this.enabled. Silent in browser.
- AppDelegate: registers HapticsComponent alongside
  DatePickerComponent.
- _choice_group.html.erb: light haptic on each option.
- Primary .mobile-button call sites along the onboarding hot
  path: medium haptic on click (intro, video-intro, risk-q,
  welcome, location, family, extended-family, wrap-up, login).

Rails test suite green (79/0). Simulator build broken until
commit 2 adds DevOriginController + HapticsComponent to the
Kindling target pbxproj.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Commit 2** (user in Xcode):

```
Phase G commit 2 — Xcode target additions + device verification

Added to Kindling target:
- ios/Kindling/DevOriginController.swift
- ios/Kindling/Bridge/HapticsComponent.swift

Simulator smoke: shake gesture opens dev chooser; HTTPS validation
rejects http://. Haptics silent in simulator (expected — iOS mutes
simulator haptics).

Device verification (iPhone [model], iOS [x.y], via ngrok tunnel):
- Shake → chooser → pasted https://<id>.ngrok.io → saved →
  force-quit → relaunch → shell loaded from tunnel.
- Choice-group radio tap: light impact felt.
- Continue button tap: medium impact felt.
- Log in button: medium impact felt.
- Browser silent (bin/dev in Chrome, no console errors).
```

## §3 — Verification step by step

### Local simulator (first pass, after commit 2)

1. Run the Dev scheme on an iPhone simulator.
2. Shake the device (Hardware → Shake Gesture, or ⌃⌘Z). The chooser modal should present.
3. Tap Cancel. Modal dismisses. Normal flow continues against `localhost:3010`.
4. Complete a few onboarding taps. No haptics expected (simulator mutes them), but Xcode console should show bridge messages fire: `[Bridge] send: haptics.play {"style":"light"...}` etc.
5. Rails test suite green.

### Physical device (second pass, the real test)

**Prerequisites on your Mac:**

```bash
# From rails/, start the Rails server:
bin/dev   # Serves on localhost:3010

# In another terminal, expose it via ngrok (or LocalTunnel):
ngrok http 3010
# Copy the https://<id>.ngrok.io URL it prints.

# If you prefer LocalTunnel:
lt --port 3010
# Copy the https://<name>.loca.lt URL.
```

**On the iPhone:**

1. Connect the phone to the Mac, select it as the run destination in Xcode, ⌘R.
2. App launches. The phone tries to reach `localhost:3010` — fails (localhost = phone). Expect a blank / error state.
3. Shake the phone. The dev chooser opens.
4. Paste the tunnel URL (must start `https://`). Tap Save. Alert appears — "Relaunch to apply." Tap OK.
5. Force-quit the app (swipe up from the bottom, swipe the app tile away).
6. Tap the Kindling icon on the home screen. App launches, connects to the tunnel, Rails serves the shell. Splash → intro.
7. On the intro screen, tap "Create your will and estate plan." Feel for a **medium impact**.
8. On video-intro, tap Continue. Medium impact.
9. Through onboarding — tap any radio option (relationship status, currently resident, etc.). Feel for a **light impact**.
10. Tap any Continue button. Medium impact.
11. Repeat on a few screens. Haptics should be consistent: radio = light, primary button = medium.
12. Shake again → chooser reopens with the current tunnel URL prefilled. Tap Clear → alert. Force-quit + relaunch → app falls back to compile-time default (which won't work on device, so this just confirms the Clear path works).

## §4 — Things not to do

**Don't add a haptic for every interaction.** The hook points are choice-group selection + Continue-style primary buttons + login. Everything else is noise. Haptic fatigue is real — if every tap buzzes, users turn them off.

**Don't cache `UIImpactFeedbackGenerator` instances.** They have `prepare()` / `impactOccurred()` lifecycle that's trivially broken by app backgrounding. Create per-call. Cost is negligible.

**Don't extend the dev chooser.** One text field, Save, Clear, Cancel. No preferences screen, no recent-URLs list, no other UserDefaults keys, no QR scanner. The key we persist is `kindling.dev.overrideURL` and nothing else.

**Don't rebuild the Navigator on save.** The "relaunch to apply" instruction is deliberate. Hot-reloading the origin with in-flight web views is a maze of edge cases we don't need to explore for a dev-only flow.

**Don't wire haptics on `turbo:submit-end`.** Submit feedback (success vs error) is a different interaction model. Queue as Phase G.1 if demand appears.

**Don't skip the HTTPS check because "it's dev-only."** iOS ATS will refuse `http://` connections anyway, and silent refusal is the worst debugging experience. Catch at input time with a clear message.

## §5 — Checklist

- [ ] Pre-flight greps pass.
- [ ] `Origin.swift` replaced per §1.1.
- [ ] `DevOriginController.swift` written per §1.2.
- [ ] `SceneController.swift` replaced per §1.3 (includes `ShakeObservingWindow`).
- [ ] `HapticsComponent.swift` written per §2.1.
- [ ] `AppDelegate` registration list includes `HapticsComponent.self`.
- [ ] `haptic_controller.js` written per §2.3.
- [ ] `_choice_group.html.erb` has haptic wiring on `.mobile-choice-option`.
- [ ] ~9 primary button call sites carry `data: { controller: "haptic", haptic_style_value: "medium" }`.
- [ ] `bin/rails test` → 79/0.
- [ ] Agent commit 1 created on `mobile-phase-g`.
- [ ] USER: Xcode adds `DevOriginController.swift` + `HapticsComponent.swift` to Kindling target. Build clean.
- [ ] USER: simulator smoke — shake opens chooser, HTTPS validation works.
- [ ] USER: ngrok/LT tunnel up, device connects, haptics felt on all four intended interactions.
- [ ] USER: commit 2 with pbxproj diff + verification notes.
- [ ] Merge `--no-ff` to main. Hand back before pushing.
