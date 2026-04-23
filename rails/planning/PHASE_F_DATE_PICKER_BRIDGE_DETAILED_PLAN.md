# Phase F — Native date picker bridge

> **For the agent**: this plan pivots mid-phase. The original Phase F bridged the list picker (country/nationality/divorce dropdowns). Simulator verification showed the brand web overlay looks better than the iOS sheet for lists, but the real opportunity is the **date field** — `<input type="date">` currently pops up iOS's default calendar, not the classic wheel. The wheel is faster for DOB and reads unambiguously as native. So the list bridge gets reverted and the date bridge gets built. One branch, one pivot commit, one user Xcode commit.

## The pivot, in one paragraph

Commit 1 shipped a working `PickerComponent` bridge for list pickers. Simulator verification found: list pickers feel fine but the brand web overlay was preferred for brand consistency; meanwhile the DOB date field still uses WKWebView's HTML5 calendar. The better call is: revert the list bridge (keep brand overlay), build a wheel-style `UIDatePicker` bridge for dates. The bridge plumbing (importmap pin, `mobile.js` import, registration pattern) is reusable. Only the Swift component and the JS controller change.

## What we ship (final state after this branch merges)

- Brand web overlay for all list pickers. Unchanged from before Phase F.
- Native `UIDatePicker` wheel (3 drums — day/month/year) presented in a medium-detent bottom sheet for every date field in the mobile flow.
- Web fallback for dates: the browser's native `<input type="date">` picker (via `input.showPicker()`). Same `YYYY-MM-DD` submit value, same validations.
- One new partial — `mobile/shared/date_field` — used for every date input going forward.

## What we ship in this commit (commit 2 on `mobile-phase-f`)

### Reverts (undo commit 1's list bridge)

- `rails/app/javascript/controllers/picker_sheet_controller.js` → back to plain `extends Controller`. Exactly what was on `main` before Phase F.
- `ios/Kindling/Bridge/PickerComponent.swift` → deleted.
- `ios/Kindling/AppDelegate.swift` → `registerBridgeComponents` line swaps `PickerComponent.self` → `DatePickerComponent.self`.

### New — Rails side

- `rails/app/views/mobile/shared/_date_field.html.erb` — new partial. Hidden `<input type="date">` for form submit; visible trigger button; Stimulus controller `date-field`.
- `rails/app/javascript/controllers/date_field_controller.js` — new. Extends `BridgeComponent`, component name `"date-picker"`. On trigger tap: sends `{title, value, minDate, maxDate}` to native when enabled; otherwise calls `input.showPicker()`.
- `rails/app/views/mobile/onboarding/welcome.html.erb` — DOB field switches from `form.date_field` to the new partial.
- `rails/app/views/mobile/onboarding/_child_fields.html.erb` — child DOB switches from `date_field_tag` to the new partial.

### New — iOS side

- `ios/Kindling/Bridge/DatePickerComponent.swift` — new. `BridgeComponent`, name `"date-picker"`. On `display` event: presents a `UIDatePicker` (`.wheels`, `.date` mode) inside a `UISheetPresentationController` with `.medium()` detent and a "Done" button. Reply `{value: "YYYY-MM-DD"}` on Done, no reply on dismiss.

### Kept from commit 1

- Importmap pin of `@hotwired/hotwire-native-bridge@1.2.2`.
- `mobile.js` import order (Turbo → bridge → controllers).
- Deletion of the three orphan demo bridge files.

## Display + range defaults

- **Format**: `23 Apr 2026` — `Intl.DateTimeFormat("en-GB", {day: "numeric", month: "short", year: "numeric"})`.
- **DOB range**: `min = today − 120 years`, `max = today − 16 years`. Server-side validation (the `OnboardingSession#date_of_birth_within_supported_range` check) is the source of truth for 18+ enforcement.
- **Child DOB range**: `min = today − 100 years`, `max = today`.

## Commit strategy

Two commits from this point on `mobile-phase-f`:

- **Commit 2 — agent (this plan).** All Rails + Swift-on-disk changes above. Plus the pbxproj diff the user already produced in Xcode (adding `PickerComponent` ref, removing orphan refs) — carried forward so the Xcode work isn't lost. Build is broken after commit 2 because pbxproj references `PickerComponent.swift` (now deleted) and doesn't reference `DatePickerComponent.swift` (now new).

- **Commit 3 — user in Xcode.** Remove the `PickerComponent.swift` red reference. Add `DatePickerComponent.swift` to the Kindling target. Build. Simulator-verify (scenarios below). Commit the pbxproj diff.

Then `git merge --no-ff mobile-phase-f` to `main` with a message summarizing the phase.

## Simulator verification — step by step

Run the Dev scheme on an iPhone simulator.

### Scenario 1 — DOB on `/mobile/onboarding/welcome`

1. Navigate past splash → intro → video → risk-questionnaire to the welcome step.
2. Page title: "Let's start with you." Fields: First name / Middle names / Family name / **Date of birth**.
3. Tap the Date of birth field. A bottom sheet slides up.
4. Sheet contains a 3-wheel `UIDatePicker` (day | month | year drums) and a "Done" button at the bottom.
5. Year drum ranges from (today − 120) to (today − 16). Today − 18 is the initial position.
6. Pick a valid date (e.g. 23 Apr 1992). Tap "Done."
7. Sheet dismisses. Field label updates to "23 Apr 1992."
8. Tap the field again. Wheel reopens with 23 Apr 1992 as initial position.
9. Tap outside sheet (or swipe down). Sheet dismisses. Field label unchanged.

### Scenario 2 — list pickers on `/mobile/onboarding/location` (revert verification)

1. Proceed to the location step.
2. Tap "Which part of the UK do you live in?"
3. A **web overlay** slides up — branded Kindling styling, Cancel button at the bottom. NOT a native sheet.
4. Tap "England." Overlay slides down. Label reads "England."
5. Same behavior for "What's your nationality?"

The list pickers must NOT present native sheets anymore.

### Scenario 3 — child DOB on `/mobile/onboarding/family`

1. Proceed to the family step.
2. Add a child. The form expands to show child fields including "Date of birth (optional)."
3. Tap the child DOB field. Native wheel sheet appears.
4. Year range: today − 100 to today.
5. Pick a date, tap Done. Sheet dismisses. Label reflects the chosen date.

### Scenario 4 — browser fallback

1. `bin/dev`, visit `/mobile/onboarding/welcome` in Chrome or Safari.
2. Tap the DOB field. Browser's native date picker appears (NOT the wheel — we don't emulate the wheel in browser).
3. Select a date. Field label updates to "23 Apr 1992" format.

If browser behavior differs (e.g. nothing happens on tap in Firefox), that's a `showPicker()` compatibility note for follow-up, not a blocker. Chrome and Safari support it.

## Things not to do

**Don't match the native wheel visually in browser.** The browser path uses `input.showPicker()` and whatever the browser provides. Faking a wheel with JS is a 400-line detour.

**Don't add "today" / "yesterday" shortcut buttons.** Wheels suffice. Shortcuts later, if product asks.

**Don't split the date partial into variants ("short date", "long date", "date-time").** One partial, one format, one behavior. Split when a fourth use case appears.

**Don't reuse `.mobile-picker__trigger` class for the date trigger.** The chevron reads weird on a date field — it implies "a list to reveal." Use `.mobile-input` on the trigger button — same visual weight as a plain input.

**Don't restore `MenuComponent` / `FormComponent` / `OverflowMenuComponent`.** They stay deleted. Git history holds them.

## Pitfalls that apply

From `~/.claude/plans/in-this-repo-you-moonlit-lantern.md:442`:

- **Pitfall 6** — the hidden `<input type="date">` must dispatch `change` when the bridge replies. Stimulus controllers watching the input rely on this.
- **Pitfall 16** — bridge import order in `mobile.js` stays Turbo → bridge → controllers. Unchanged from commit 1.
