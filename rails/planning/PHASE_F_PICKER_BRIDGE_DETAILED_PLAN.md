# Phase F — Native picker bridge

> **For the agent**: three commits, not one. Rails side first (browser-safe, fallback works). Then Swift on disk. Then a user step in Xcode to clean up `project.pbxproj`. Do NOT try to delete `.swift` files by hand while they're still referenced in pbxproj — the build breaks and nobody can open the project. Read the commit order and stay in your lane.

## What and why

The current picker is a web overlay: tap the trigger, a bottom sheet animates up over the webview, tap an option, it animates back down. Works fine in browser. In the iOS shell it works too — but it's a webview sheet on top of a webview, and it shows: small transition stutter, backdrop tint that doesn't match iOS system, no grab-handle, no swipe-to-dismiss. It reads as a web app.

Phase F swaps the picker for a real `UISheetPresentationController` with `.medium()` / `.large()` detents, rendered from native UIKit, backed by a `UITableView`. Tap the trigger on iOS → native sheet slides up with system chrome. Tap an option → sheet dismisses, web updates the hidden `<select>`, `change` fires, any dependent logic runs. In browser → everything behaves exactly as today.

This is the single highest-impact "feels native" upgrade in the shell. It's also small: one new Swift file (~90 lines), one JS controller rewrite, three dead Swift files deleted.

While we're in there, we delete three orphaned bridge components (`MenuComponent`, `FormComponent`, `OverflowMenuComponent`) that shipped with the Hotwire demo and never got registered. They're dead code. Leaving them tells a future agent "here's how we do bridges" — except none of them are live. Rather than explain that every time, we delete them.

## What we ship

Two commits on branch `mobile-phase-f`. One agent, one user. Merge `--no-ff` to `main` after simulator verification.

**Commit 1 — agent.** Full feature on disk. Pin `@hotwired/hotwire-native-bridge` in importmap, import it in `mobile.js`, rewrite `picker_sheet_controller.js` to extend `BridgeComponent` with browser fallback intact. Write `ios/Kindling/Bridge/PickerComponent.swift`, register it in `AppDelegate.configureHotwire()`, delete the three orphan bridge files. pbxproj now references three missing files (red) and one unreferenced new file (invisible to Xcode). Rails tests green. Simulator build broken until commit 2.

**Commit 2 — user in Xcode.** Add `PickerComponent.swift` to the Kindling target. Remove the three red file references. Build. Simulator-verify all picker sites (`/mobile/onboarding/location`, `/mobile/onboarding/family`, child-fields sub-pickers). Commit the pbxproj diff.

## Pitfalls that apply

From the canonical list at `~/.claude/plans/in-this-repo-you-moonlit-lantern.md:442`:

- **Pitfall 6** — "Don't submit forms with JS that doesn't go through Turbo." The picker's `change` event must fire on the hidden `<select>` so Stimulus controllers watching it (e.g. `family_form_controller`'s conditional reveal — once fixed) still react. Don't take a shortcut that sets `.value` without dispatching `change`.
- **Pitfall 16** — "Don't bundle bridge JS separately from Turbo." The bridge module must be imported in `mobile.js` AFTER Turbo but BEFORE `controllers`. If controllers eager-load before the bridge global exists, `BridgeComponent`'s connect-time check fails silently and `this.enabled` is always false — pickers render as web overlays even in the native shell.

Phase-specific things the canonical plan doesn't name:

- **The three orphan bridge components must be deleted, not left as "reference."** If future you or another agent reads `MenuComponent.swift` and copies the pattern, they'll spend an hour wondering why their component doesn't trigger — because there's no `Hotwire.registerBridgeComponents` call anywhere. Delete the lie.
- **`this.enabled` is the only check.** No user-agent sniffing. No `window.nativeBridge` custom globals. Hotwire's native bridge exposes `enabled` on `BridgeComponent`; that's the authoritative "am I inside the shell" signal.
- **Don't prematurely add haptic feedback on selection.** Phase G ships haptics. If you add `UIImpactFeedbackGenerator` calls inside `PickerComponent`, Phase G has to untangle them. Keep the component silent.

## Before you touch anything

Verify the current state matches what this plan was written against.

```bash
# Rails side.
cat rails/config/importmap.rb  # Must NOT list @hotwired/hotwire-native-bridge yet.
cat rails/app/javascript/mobile.js  # 5 lines, no bridge import yet.
wc -l rails/app/javascript/controllers/picker_sheet_controller.js  # 74

# iOS side — four bridge files exist on disk, none registered.
ls ios/Kindling/Bridge/  # MenuComponent.swift FormComponent.swift OverflowMenuComponent.swift
grep -c "registerBridgeComponents" ios/Kindling/AppDelegate.swift  # 0
```

If any of these differ, stop and report — the plan is state-specific.

Pick the `@hotwired/hotwire-native-bridge` version. Do **not** make one up. Check npm for the current stable:

```bash
npm view @hotwired/hotwire-native-bridge version
```

Record the resolved version in commit 1's message. For the plan, `<BRIDGE_VERSION>` below is a placeholder.

## Commit 1 — Rails + iOS source

### 1.1 Pin the bridge in importmap

From `rails/`:

```bash
bin/importmap pin @hotwired/hotwire-native-bridge
```

This adds a line to `config/importmap.rb`. Expected shape (version will vary — that's fine, just record it):

```ruby
pin "@hotwired/hotwire-native-bridge", to: "@hotwired--hotwire-native-bridge.js"
```

If `bin/importmap pin` errors out (network, JSPM down, etc.), stop and report back. Do not hand-write the pin — the downloaded file is what matters, not the line.

### 1.2 Import it in `mobile.js`

**Current** `rails/app/javascript/mobile.js`:

```js
// Turbo loads before any bridge-component imports (Phase F onward depend on this).
import "@hotwired/turbo-rails"
import "controllers"

document.documentElement.classList.add("js")
```

**Change**: import the bridge between Turbo and controllers:

```js
// Turbo loads before any bridge-component imports (Phase F onward depend on this).
import "@hotwired/turbo-rails"
import "@hotwired/hotwire-native-bridge"
import "controllers"

document.documentElement.classList.add("js")
```

The order is load-bearing (Pitfall 16). Turbo first, bridge second, controllers third. Don't reorder.

### 1.3 Rewrite `picker_sheet_controller.js`

The controller keeps all its current web-overlay behavior. We add a native path: on `open`, if `this.enabled`, send a `display` event to the `picker-sheet` native component with `{title, items, selectedIndex}`. On reply, apply the selected item to the hidden `<select>`, dispatch `change`. If `!this.enabled`, fall back to the existing overlay flow.

Full replacement of `rails/app/javascript/controllers/picker_sheet_controller.js`:

```js
import { BridgeComponent } from "@hotwired/hotwire-native-bridge"

// data-controller="picker-sheet"
// Targets:
//   sheet  — the overlay element (web fallback only)
//   select — the underlying <select> (hidden)
//   label  — the visible label showing current selection
//   option — each option row (web fallback only)
export default class extends BridgeComponent {
  static component = "picker-sheet"
  static targets = ["sheet", "select", "label", "option"]

  connect() {
    super.connect()
    this.sync()
  }

  open(event) {
    event.preventDefault()

    if (this.enabled) {
      this.#openNative()
    } else {
      this.#openWeb()
    }
  }

  close(event) {
    event?.preventDefault()
    this.#closeWeb()
  }

  choose(event) {
    event.preventDefault()
    const value = event.currentTarget.dataset.pickerValue || ""
    this.#applyValue(value)
    this.#closeWeb()
  }

  // Bound to the hidden <select>'s change event.
  selectChanged() {
    this.sync()
  }

  sync() {
    const selectedOption = this.selectTarget.selectedOptions[0]
    const selectedValue = this.selectTarget.value
    const placeholder = this.element.dataset.placeholder || ""

    this.labelTarget.textContent = selectedValue
      ? selectedOption?.textContent?.trim() || placeholder
      : placeholder
    this.labelTarget.classList.toggle("is-placeholder", !selectedValue)

    this.optionTargets.forEach((option) => {
      option.classList.toggle("is-selected", option.dataset.pickerValue === selectedValue)
    })
  }

  #openNative() {
    const title = this.element.querySelector(".mobile-picker__panel-title")?.textContent?.trim() ?? ""
    const options = Array.from(this.selectTarget.options).filter((o) => o.value !== "")
    const items = options.map((option, index) => ({ title: option.textContent.trim(), index }))
    const selectedIndex = options.findIndex((option) => option.value === this.selectTarget.value)

    this.send("display", { title, items, selectedIndex: selectedIndex >= 0 ? selectedIndex : null }, (message) => {
      const option = options[message?.data?.selectedIndex]
      if (option) this.#applyValue(option.value)
    })
  }

  #applyValue(value) {
    this.selectTarget.value = value
    this.selectTarget.dispatchEvent(new Event("change", { bubbles: true }))
  }

  #openWeb() {
    this.sheetTarget.hidden = false
    // Force a reflow so the initial transform:translateY(100%) paints
    // before we add .is-open — otherwise the browser coalesces and skips
    // the transition.
    this.sheetTarget.offsetHeight // eslint-disable-line no-unused-expressions
    this.sheetTarget.classList.add("is-open")
    document.body.classList.add("mobile-sheet-open")
  }

  #closeWeb() {
    if (!this.sheetTarget.classList.contains("is-open")) return

    this.sheetTarget.classList.remove("is-open")
    document.body.classList.remove("mobile-sheet-open")

    const panel = this.sheetTarget.querySelector(".mobile-picker__panel")
    const onEnd = (event) => {
      if (event.target !== panel || event.propertyName !== "transform") return
      panel.removeEventListener("transitionend", onEnd)
      this.sheetTarget.hidden = true
    }
    panel.addEventListener("transitionend", onEnd)
  }
}
```

Notes on the rewrite:

- `extends BridgeComponent` replaces `extends Controller`. `BridgeComponent` is a `Controller` subclass exposing `this.enabled` and `this.send(event, data, replyCallback)`.
- `static component = "picker-sheet"` registers this component's name. Native-side registration uses the same string.
- `#openNative` reads options from the existing hidden `<select>` rather than receiving them via data attributes — the `<select>` is already populated by the partial, so there's no reason to duplicate that data somewhere else.
- The send callback receives the full reply message; `message.data` is what the native side encoded. Out-of-range `selectedIndex` yields `undefined` from the array lookup and we do nothing — user can tap again.
- The web-fallback helpers are unchanged from the original controller, just prefixed `#openWeb` / `#closeWeb` for clarity.
- No partial (`_picker_field.html.erb`) change needed. `data-controller="picker-sheet"` already matches.

### 1.4 Write `PickerComponent.swift`

**File**: `ios/Kindling/Bridge/PickerComponent.swift` (new).

```swift
import Foundation
import HotwireNative
import UIKit

/// Bridge component that presents a native bottom-sheet picker
/// (UISheetPresentationController with medium + large detents) when
/// the web sends a "display" event. Replies { selectedIndex } when the
/// user taps a row, or no reply if the sheet is dismissed.
final class PickerComponent: BridgeComponent {
    override class var name: String { "picker-sheet" }

    override func onReceive(message: Message) {
        guard let event = Event(rawValue: message.event) else { return }

        switch event {
        case .display:
            handleDisplay(message: message)
        }
    }

    // MARK: Private

    private var hostViewController: UIViewController? {
        delegate?.destination as? UIViewController
    }

    private func handleDisplay(message: Message) {
        guard let data: DisplayData = message.data() else { return }
        guard let host = hostViewController else { return }

        let picker = PickerSheetViewController(
            title: data.title,
            items: data.items,
            selectedIndex: data.selectedIndex
        ) { [weak self] selectedIndex in
            self?.reply(
                to: Event.display.rawValue,
                with: SelectionData(selectedIndex: selectedIndex)
            )
        }

        if let sheet = picker.sheetPresentationController {
            sheet.detents = [.medium(), .large()]
            sheet.prefersGrabberVisible = true
            sheet.preferredCornerRadius = 16
        }

        host.present(picker, animated: true)
    }
}

// MARK: Events

private extension PickerComponent {
    enum Event: String {
        case display
    }
}

// MARK: Message data

private extension PickerComponent {
    struct DisplayData: Decodable {
        let title: String
        let items: [Item]
        let selectedIndex: Int?
    }

    struct Item: Decodable {
        let title: String
        let index: Int
    }

    struct SelectionData: Encodable {
        let selectedIndex: Int
    }
}

// MARK: - Picker view controller

private final class PickerSheetViewController: UIViewController {
    private let sheetTitle: String
    private let items: [PickerComponent.Item]
    private let initialSelectedIndex: Int?
    private let onSelect: (Int) -> Void

    private let tableView = UITableView(frame: .zero, style: .plain)

    init(title: String, items: [PickerComponent.Item], selectedIndex: Int?, onSelect: @escaping (Int) -> Void) {
        self.sheetTitle = title
        self.items = items
        self.initialSelectedIndex = selectedIndex
        self.onSelect = onSelect
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let titleLabel = UILabel()
        titleLabel.text = sheetTitle
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        titleLabel.textAlignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(titleLabel)

        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
        view.addSubview(tableView)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),

            tableView.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 12),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
}

extension PickerSheetViewController: UITableViewDataSource, UITableViewDelegate {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { items.count }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
        cell.textLabel?.text = items[indexPath.row].title
        cell.accessoryType = (indexPath.row == initialSelectedIndex) ? .checkmark : .none
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: false)
        let index = items[indexPath.row].index
        dismiss(animated: true) { [onSelect] in
            onSelect(index)
        }
    }
}
```

Style notes:

- Follows the private-extension `Event` and `MessageData` pattern from `MenuComponent.swift` (about to be deleted, but it was the house style).
- `PickerSheetViewController` is private to this file (declared as `private final class`). No reason to expose it.
- `UISheetPresentationController` config is three lines. We don't abstract it.
- `UITableViewController` would be marginally shorter but doesn't compose as cleanly with the title label. `UIViewController + UITableView` is the pattern Apple ships.
- Cell reuse identifier is a string literal — one site of use, no constant needed.
- No custom cell class. `UITableViewCell.default` renders `textLabel` + `accessoryType` which is exactly what we want. System styling adapts to dark mode automatically.

### 1.5 Register the component

**File**: `ios/Kindling/AppDelegate.swift`.

**Current** `configureHotwire()`:

```swift
private func configureHotwire() {
    let bundledConfig = Bundle.main.url(forResource: "path-configuration", withExtension: "json")!
    let serverConfig = Origin.rails.appendingPathComponent("mobile/config/path_configuration.json")

    Hotwire.loadPathConfiguration(from: [
        .file(bundledConfig),
        .server(serverConfig)
    ])

    // Every visitable is a KindlingWebViewController so the Kindling logo
    // renders in the nav bar titleView. No NavigatorDelegate needed.
    Hotwire.config.defaultViewController = { url in
        KindlingWebViewController(url: url)
    }

    #if DEBUG
    Hotwire.config.debugLoggingEnabled = true
    #endif
}
```

**Change**: one line — register `PickerComponent` before `loadPathConfiguration`. Order doesn't strictly matter (path-config is async fetch), but keeping bridge registration at the top reads better.

```swift
private func configureHotwire() {
    Hotwire.registerBridgeComponents([PickerComponent.self])

    let bundledConfig = Bundle.main.url(forResource: "path-configuration", withExtension: "json")!
    let serverConfig = Origin.rails.appendingPathComponent("mobile/config/path_configuration.json")

    Hotwire.loadPathConfiguration(from: [
        .file(bundledConfig),
        .server(serverConfig)
    ])

    Hotwire.config.defaultViewController = { url in
        KindlingWebViewController(url: url)
    }

    #if DEBUG
    Hotwire.config.debugLoggingEnabled = true
    #endif
}
```

`Hotwire.registerBridgeComponents([PickerComponent.self])` is the HotwireNative 1.2.2 API. If it doesn't compile in commit 2, Xcode's error message will name the right symbol — fix it then, don't pre-document alternates.

### 1.6 Delete the three orphan bridge files from disk

```bash
rm ios/Kindling/Bridge/MenuComponent.swift
rm ios/Kindling/Bridge/FormComponent.swift
rm ios/Kindling/Bridge/OverflowMenuComponent.swift
```

Confirm:

```bash
ls ios/Kindling/Bridge/
# Expected: PickerComponent.swift
```

The pbxproj still references the three deleted files — we leave that mess for the user in commit 2 because pbxproj edits are brittle by hand.

**Commit 1 message**:

```
Phase F commit 1 — native picker bridge (Rails + iOS source)

Rails side:
- Pin @hotwired/hotwire-native-bridge@<BRIDGE_VERSION> via importmap.
- Import the bridge in mobile.js between Turbo and controllers.
- Rewrite picker_sheet_controller to extend BridgeComponent.
  Browser path unchanged (this.enabled is false → web overlay).
  Native path sends 'display' to the picker-sheet component and
  applies the replied selectedIndex.

iOS side:
- ios/Kindling/Bridge/PickerComponent.swift: new. Presents a
  UISheetPresentationController with .medium() + .large() detents
  and a UITableView of items. Replies { selectedIndex } on row tap,
  no reply on dismiss.
- ios/Kindling/AppDelegate.swift: Hotwire.registerBridgeComponents
  in configureHotwire().
- ios/Kindling/Bridge/{Menu,Form,OverflowMenu}Component.swift:
  deleted from disk. These shipped with the Hotwire demo, were
  never registered in Kindling, and never will be.

Rails test suite green (79/0). Xcode build broken until commit 2
cleans up project.pbxproj (three red file refs + one unreferenced
new file). The user handles that in Xcode.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### 1.7 Verify commit 1

```bash
cd rails && bin/rails test
```

79 runs, 0 failures — same as after Phase E. Nothing in the test suite exercises the picker; this is a smoke check that nothing collateral broke.

Optional browser check before committing: `bin/dev`, visit `/mobile/onboarding/location`, tap the "Which part of the UK do you live in?" picker. Web overlay opens. Pick a value. Overlay closes. Label updates to "England" etc. Confirms `BridgeComponent` with `this.enabled === false` still routes through the web path.

## Commit 2 — user, Xcode cleanup + simulator verify

Five actions, one commit. Do in this order.

1. **Open** `ios/Kindling.xcodeproj`.

2. **Add `PickerComponent.swift` to the target.** In the Project Navigator, right-click the `Bridge` group → Add Files to "Kindling"… → select `PickerComponent.swift` → Add. Ensure the `Kindling` target checkbox is ticked.

3. **Remove the three red file references.** In the Project Navigator, the three deleted files appear in red under `Bridge`. Right-click each → Delete → "Remove Reference" (NOT "Move to Trash" — the files are already gone on disk). Do `MenuComponent.swift`, `FormComponent.swift`, `OverflowMenuComponent.swift`.

4. **Build** with ⌘B. If Xcode flags `Hotwire.registerBridgeComponents` as undefined, read its error — it'll name the right symbol. Fix inline, rebuild. Otherwise the build should be clean. A warning like "unused `OverflowMenuComponent` symbol" would indicate the pbxproj cleanup missed one; redo step 3.

5. **Simulator verify.** Run the `Dev` scheme on an iPhone simulator (iOS 17+). Navigate past the splash / intro / video-intro / risk-questionnaire gauntlet — or skip to `/mobile/onboarding/location` via the dev helpers if you have them wired up. The page renders two pickers: "Which part of the UK do you live in?" and "What's your nationality?". For each:
   - Tap the trigger button. A bottom sheet slides up from the bottom with a grab handle, the picker title at the top, and a `UITableView` of options.
   - Drag the sheet up — it snaps to the `.large()` detent.
   - Drag the sheet down — it snaps back to `.medium()` or dismisses.
   - Tap an option. Sheet dismisses. The label in the web view updates to the tapped option's text.
   - Open again. The previously selected option has a checkmark.
   - Tap outside the sheet / drag down past dismissal threshold. Sheet closes, no value change.

   Do the same on `/mobile/onboarding/family` (pickers for relationship status + children — once the family-form conditional-reveal bug is fixed per `PRE_LAUNCH_TODO.md`, otherwise verify what you can reach).

6. **Browser check.** `bin/dev`, same pages. Pickers still render as web overlays (`this.enabled === false`). This confirms the fallback path survived the switch to `BridgeComponent`.

**Commit 2 message**:

```
Phase F commit 2 — Xcode pbxproj cleanup + simulator verification

Added PickerComponent.swift to the Kindling target. Removed
references to MenuComponent.swift, FormComponent.swift, and
OverflowMenuComponent.swift (deleted from disk in commit 1).

Simulator verification (iPhone 15 Pro, iOS 17.4, Dev scheme):
- /mobile/onboarding/location: both pickers present native sheet,
  medium + large detents snap, grabber visible, selection applies
  to hidden select and label updates.
- /mobile/onboarding/family: relationship picker works identically.
- Browser (bin/dev): pickers fall back to web overlay unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Verify step-by-step, both modes

One canonical scenario to run end-to-end per picker site. If any of these fail, the bug is in the component, not in the plan.

**Browser** (`bin/dev`, Chrome or Safari):

1. Visit `/mobile/onboarding/location`.
2. Tap "Which part of the UK do you live in?". Web overlay slides up.
3. Tap "England". Overlay slides down. Label reads "England".
4. Submit the form (after filling the rest). Onboarding session persists `country_of_residence = "england"`.

**Simulator** (Dev scheme, iOS 17+):

1. Navigate to `/mobile/onboarding/location`.
2. Tap "Which part of the UK do you live in?". Native bottom sheet slides up with grabber.
3. Drag up → snaps to large detent. Drag down → snaps to medium.
4. Tap "England". Sheet dismisses. Web label reads "England". Next open shows ✓ next to "England".
5. Tap the picker trigger again; drag the sheet down past threshold. Sheet dismisses. Label unchanged.
6. Submit the form. Onboarding session persists `country_of_residence = "england"`.

If simulator behavior differs from browser (e.g. web overlay briefly flashes before native sheet appears), the bridge hook fired too late — confirm `mobile.js` imports in the order Turbo → bridge → controllers (Pitfall 16).

## Things not to do

**Don't re-add the deleted bridge components "just in case."** If a future phase needs a form-submit toolbar button or an overflow menu, write fresh components scoped to that phase's needs. Reviving dead code to fit a new purpose usually ends in a worse version of both.

**Don't branch on user-agent.** `this.enabled` is the only correct signal. User-agent sniffing catches the wrong set of environments — Safari on iOS outside the shell would be misclassified, and webviews inside iPads-on-Mac would be misclassified the other way.

**Don't add haptics to `PickerComponent`.** Phase G. Adding `UIImpactFeedbackGenerator` calls here means Phase G has to unpick them.

**Don't pass option data through `data-*` attributes on the trigger button.** The hidden `<select>` is already the source of truth for option list + selected value. Reading from it in `#openNative` keeps one source of truth. Duplicating into `data-picker-items` is a synchronization bug waiting to happen.

**Don't change `_picker_field.html.erb`.** It already emits `data-controller="picker-sheet"`, hidden `<select>`, all the targets. No partial change is required. If you find yourself touching the partial, stop — the JS controller handles the native/web split internally.

**Don't make the web overlay "match" the native sheet visually.** The web overlay's job is to work. The native sheet's job is to feel native. Two different surfaces with different constraints; pretending they're the same visual component creates pressure to fix one when the other changes.

## Checklist

- [ ] `npm view @hotwired/hotwire-native-bridge version` resolves; record the version.
- [ ] `bin/importmap pin @hotwired/hotwire-native-bridge` succeeds; `config/importmap.rb` updated.
- [ ] `mobile.js` imports Turbo, then bridge, then controllers.
- [ ] `picker_sheet_controller.js` replaced verbatim per §1.3.
- [ ] `bin/rails test` → 79/0.
- [ ] Browser smoke: pickers open as web overlay and round-trip a selection. Commit 1.
- [ ] `ios/Kindling/Bridge/PickerComponent.swift` written.
- [ ] `ios/Kindling/AppDelegate.swift` registers `PickerComponent`.
- [ ] Three dead bridge files deleted from disk.
- [ ] `ls ios/Kindling/Bridge/` shows only `PickerComponent.swift`. Commit 1.
- [ ] USER: Xcode opens, add `PickerComponent.swift` to target, remove 3 red references, build clean.
- [ ] USER: simulator verifies the scenarios in "Verify step-by-step" above.
- [ ] USER: commits pbxproj diff. Commit 2.
- [ ] Merge `--no-ff` to `main` after commit 2. Hand back before pushing.
