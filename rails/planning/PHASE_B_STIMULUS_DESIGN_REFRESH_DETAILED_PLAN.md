# Phase B Detailed Plan — Stimulus controllers + mobile design system refresh

> **Note to the AI agent executing this plan**: DHH would normally write a page of prose. You need more. Where this plan is explicit about commands, data-attribute names, exact CSS tokens, and verification steps, it's not because they're clever — it's because ambiguity is how you produce bugs in a long agent session. Follow the letter of the plan. Where it asks you to make a judgment call, make it and note what you chose in the commit message.

## Context

Phase A added Turbo Drive and started a Stimulus application. The five vanilla JS modules in `app/javascript/mobile/*.js` are still there, called from a `turbo:load` handler in `app/javascript/mobile.js`. Phase B finishes that migration: every interactive behavior becomes a Stimulus controller that auto-connects on DOM insertion and disconnects on removal. The interim `turbo:load` handler is deleted.

Phase B is **also** the moment to close the design gap documented in [HOTWIRE_MOBILE_DESIGN_AUDIT.md](HOTWIRE_MOBILE_DESIGN_AUDIT.md). Two reasons to combine these with the Stimulus work:

1. Phase B touches ERB partials anyway (to add `data-controller` attributes). Editing partials to also apply new CSS classes is the same PR, not a second one.
2. The native shells in Phase C will render whatever ERB + CSS is current. Closing the design gap before Phase C means the first simulator screenshots are representative of the final product, not a placeholder.

The React Native app (`rnative/`) is the visual reference. The goal is for a user side-by-siding the RN screens and the Rails-Hotwire screens to prefer the Rails ones, or at the very least not to prefer the RN ones.

## Scope

### In scope

- Convert five vanilla JS modules to Stimulus controllers (one controller each).
- Delete the vanilla modules (`app/javascript/mobile/*.js`) once controllers are live.
- Remove the interim `turbo:load` runInit handler from `app/javascript/mobile.js`.
- Update mobile ERB partials to use `data-controller`, `data-X-target`, `data-action` attributes.
- Self-host Montserrat (four weights) as WOFF2 under `app/assets/fonts/`.
- Rewrite `app/assets/stylesheets/mobile/tokens.css` to the target state in [HOTWIRE_MOBILE_DESIGN_AUDIT.md](HOTWIRE_MOBILE_DESIGN_AUDIT.md).
- Update `app/assets/stylesheets/mobile/base.css` and per-component stylesheets to use the new tokens and new design conventions (flatter shadows, corrected radii, proper type scale).
- Leave the existing `kindling-dark.png` logo in place as a placeholder. Real SVG logo lands in parallel; swap when available.

### Out of scope (do NOT do these in Phase B)

- Bridge components for native sheet pickers, haptics, camera — Phases F / G / J.
- Native shell scaffolds (iOS, Android) — Phase C / D.
- Path-configuration — Phase C.
- Remote config store — Phase C.
- New onboarding questions or flow changes — orthogonal to this phase.
- Fixing the 26 pre-existing test failures surfaced by Phase A — tracked separately.
- **StepCard partial** and **Heroicons vendoring** — research preserved in [HOTWIRE_MOBILE_DESIGN_AUDIT.md](HOTWIRE_MOBILE_DESIGN_AUDIT.md) under "Deferred components." Build each when the first screen actually uses it. Shipping them now = dead code.

## Pitfalls to carry

Cross-reference the master plan's Pitfalls list. Items relevant to Phase B:

**Pitfall 7 — Stimulus controllers auto-connect; vanilla listeners don't.** The whole point of Phase B is to remove the vanilla-listener pattern. Every controller you write gets a `connect()` for initial setup and a `disconnect()` for cleanup. Don't leave any delegated listeners on `document` from the old vanilla modules lingering.

**Pitfall 8 — `:hover` states on touch devices.** As you touch CSS files, audit for `:hover`-only interactions. Pair every `:hover` with `:active` and / or `:focus-visible`. Mobile browsers keep `:hover` stuck until the next tap.

**Pitfall 15 — path configuration in ERB is forbidden.** Not directly Phase B's concern (Phase C introduces path-config) but while you're editing every mobile ERB partial, confirm no partial contains anything that looks like presentation-layer concerns (modal vs push) leaking into the view. That belongs in path-configuration only, Phase C.

**Pitfall 16 — bridge component ordering.** Not Phase B yet, but don't restructure `mobile.js` imports in a way that would break Phase F's bridge components. `@hotwired/turbo-rails` stays the first import. Stimulus controllers load via `import "controllers"` which is the installer-generated pattern — keep that.

## Git strategy

Branch `phase-b-stimulus-design-refresh` off main. Suggested ordering: design refresh first (visual-only, no JS change), then Stimulus conversion on a stable visual base — split into separate commits when natural, but if context makes a single commit cleaner, that's fine. Merge `--no-ff` to main when done, delete the branch. Don't push without explicit go-ahead.

## Part 1 — Design system refresh

Reference: [HOTWIRE_MOBILE_DESIGN_AUDIT.md](HOTWIRE_MOBILE_DESIGN_AUDIT.md). Every decision in Part 1 comes from that doc.

### 1.1 Self-host Montserrat

**Goal**: four WOFF2 files (Regular 400, Medium 500, SemiBold 600, Bold 700) under `app/assets/fonts/`, `@font-face` declarations in `tokens.css`, used via `--mobile-font-ui`.

**Commands**:

```bash
cd rails
mkdir -p app/assets/fonts

curl -L -o /tmp/montserrat.zip \
  "https://gwfh.mranftl.com/api/fonts/montserrat?download=zip&subsets=latin&variants=regular,500,600,700&formats=woff2"

unzip -o /tmp/montserrat.zip -d app/assets/fonts/
rm /tmp/montserrat.zip
ls app/assets/fonts/
```

Expected filenames (version suffix will vary — adapt `@font-face` paths to match what lands):

```
montserrat-v<NN>-latin-regular.woff2
montserrat-v<NN>-latin-500.woff2
montserrat-v<NN>-latin-600.woff2
montserrat-v<NN>-latin-700.woff2
```

**Sprockets manifest update**: fonts under `app/assets/fonts/` aren't auto-linked. Add to `app/assets/config/manifest.js`:

```
//= link_tree ../fonts .woff2
```

**`@font-face` declarations** go in `tokens.css` (single home for fonts + tokens — one file to edit when either changes). Added at the top of the file:

```css
@font-face {
  font-family: "Montserrat";
  src: url("/assets/montserrat-v<NN>-latin-regular.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Montserrat";
  src: url("/assets/montserrat-v<NN>-latin-500.woff2") format("woff2");
  font-weight: 500; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Montserrat";
  src: url("/assets/montserrat-v<NN>-latin-600.woff2") format("woff2");
  font-weight: 600; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Montserrat";
  src: url("/assets/montserrat-v<NN>-latin-700.woff2") format("woff2");
  font-weight: 700; font-style: normal; font-display: swap;
}
```

Replace `v<NN>` with the version suffix from the downloaded files.

**Verify**: restart `bin/dev` (new assets need a boot), then `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3010/assets/montserrat-v<NN>-latin-regular.woff2` → 200 for all four.

### 1.2 Rewrite `tokens.css`

**Goal**: replace the current `app/assets/stylesheets/mobile/tokens.css` (`~28 lines`) with the target state from the design audit.

**Target file content** (copy verbatim, adjust the `@font-face` filenames if they differ from the downloads):

```css
:root {
  /* ---------- Colors — Kindling warm palette ---------- */
  --mobile-color-navy: #293241;
  --mobile-color-cream: #EAE6E5;
  --mobile-color-green: #5B9279;
  --mobile-color-green-deep: #3E6D58;
  --mobile-color-green-light: #8FCB9B;
  --mobile-color-beige: #CCB7A4;
  --mobile-color-brown: #8F8073;

  --mobile-color-bg: var(--mobile-color-cream);
  --mobile-color-surface: #ffffff;
  --mobile-color-surface-muted: #f7f4ee;

  --mobile-color-text: var(--mobile-color-navy);
  --mobile-color-text-muted: var(--mobile-color-brown);

  --mobile-color-accent: var(--mobile-color-green);
  --mobile-color-accent-deep: var(--mobile-color-green-deep);
  --mobile-color-accent-soft: rgba(91, 146, 121, 0.12);
  --mobile-color-line: rgba(41, 50, 65, 0.10);
  --mobile-color-warning: #ec8686;
  --mobile-color-warning-soft: rgba(236, 134, 134, 0.10);
  --mobile-color-danger: #c70e0e;

  /* ---------- Typography ---------- */
  --mobile-font-ui: "Montserrat", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;

  --mobile-text-xs: 0.75rem;
  --mobile-text-sm: 0.875rem;
  --mobile-text-md: 1rem;
  --mobile-text-lg: 1.125rem;
  --mobile-text-xl: 1.25rem;
  --mobile-text-2xl: 1.5rem;
  --mobile-text-3xl: 2rem;

  --mobile-lh-tight: 1.2;
  --mobile-lh-normal: 1.5;
  --mobile-lh-relaxed: 1.75;

  --mobile-weight-regular: 400;
  --mobile-weight-medium: 500;
  --mobile-weight-semibold: 600;
  --mobile-weight-bold: 700;

  /* ---------- Spacing — strict 8px grid ---------- */
  --mobile-space-xs: 0.25rem;
  --mobile-space-sm: 0.5rem;
  --mobile-space-md: 1rem;
  --mobile-space-lg: 1.5rem;
  --mobile-space-xl: 2rem;
  --mobile-space-xxl: 3rem;

  /* ---------- Radii ---------- */
  --mobile-radius-sm: 0.25rem;
  --mobile-radius-md: 0.5rem;
  --mobile-radius-lg: 0.75rem;
  --mobile-radius-xl: 1rem;
  --mobile-radius-2xl: 1.5rem;
  --mobile-radius-full: 9999px;

  /* ---------- Shadows — subtle elevation ---------- */
  --mobile-shadow-sm: 0 2px 2px rgba(41, 50, 65, 0.10);
  --mobile-shadow-md: 0 4px 4px rgba(41, 50, 65, 0.15);
  --mobile-shadow-lg: 0 8px 8px rgba(41, 50, 65, 0.20);

  /* ---------- Motion ---------- */
  --mobile-duration-fast: 120ms;
  --mobile-duration-base: 200ms;
  --mobile-duration-slow: 320ms;
  --mobile-ease: cubic-bezier(0.4, 0, 0.2, 1);
}

/* @font-face declarations per 1.1 go at the top of this file */
```

### 1.3 Token name migration — existing CSS files

Several stylesheets reference the old token names. The rename table:

| Old token | New token |
|---|---|
| `--mobile-space-1` | `--mobile-space-xs` |
| `--mobile-space-2` | `--mobile-space-sm` |
| `--mobile-space-3` | remove — use `sm` (0.5rem) or `md` (1rem) |
| `--mobile-space-4` | `--mobile-space-md` |
| `--mobile-space-5` | remove — use `md` or `lg` |
| `--mobile-space-6` | `--mobile-space-lg` |
| `--mobile-space-7` | `--mobile-space-xl` |
| `--mobile-radius-sm` (was `0.9rem`) | `--mobile-radius-xl` (1rem) — same visual weight, different name |
| `--mobile-radius-md` (was `1.15rem`) | `--mobile-radius-xl` (1rem) — slightly tighter |
| `--mobile-radius-lg` (was `1.5rem`) | `--mobile-radius-2xl` (1.5rem) |
| `--mobile-radius-xl` (was `2rem`) | use `--mobile-radius-full` for pills, or `--mobile-radius-2xl` if generic |
| `--mobile-shadow-soft` | `--mobile-shadow-md` |
| `--mobile-shadow-card` | `--mobile-shadow-lg` |
| `--mobile-color-surface-muted: #f7f4ee` | unchanged (same hex) |
| `--mobile-color-bg: #f3f0ea` | now `var(--mobile-color-cream)` which is `#EAE6E5` |
| `--mobile-color-surface: #fffdfa` | now `#ffffff` |
| `--mobile-color-text: #172531` | now `var(--mobile-color-navy)` which is `#293241` |
| `--mobile-color-text-muted: #65717c` | now `var(--mobile-color-brown)` which is `#8F8073` |
| `--mobile-color-accent: #2f755a` | now `var(--mobile-color-green)` which is `#5B9279` |
| `--mobile-color-accent-deep: #1f5a45` | now `var(--mobile-color-green-deep)` which is `#3E6D58` |
| `--mobile-color-accent-soft: rgba(47, 117, 90, 0.12)` | now `rgba(91, 146, 121, 0.12)` |
| `--mobile-color-danger: #a24637` | now `#c70e0e` (use `--mobile-color-warning` `#ec8686` for soft warnings) |
| `--mobile-font-display: "Iowan Old Style"...` | delete this token entirely — single-typeface system now |
| `--mobile-font-ui` | value changes — now `"Montserrat"`-first |

**Strategy**:

```bash
grep -rn --include="*.css" "mobile-space-1\|mobile-space-2\|mobile-space-3\|mobile-space-4\|mobile-space-5\|mobile-space-6\|mobile-space-7\|mobile-shadow-soft\|mobile-shadow-card\|mobile-font-display" app/assets/stylesheets/mobile/
```

This shows you every file and line that needs updating. Work through them one stylesheet at a time. For token renames, search-and-replace is safe (these are unique strings). For spacing rungs that are being removed (`space-3` = 12px, `space-5` = 20px), judgment: in most cases `space-3` becomes `space-sm` (0.5rem/8px) or `space-md` (1rem/16px). When in doubt, use the nearest grid value; don't invent a new rung.

### 1.4 Stylesheet audit — hex color references

Some stylesheets hardcode hex values that bypass the token system. Find them:

```bash
grep -rnE '#[0-9a-fA-F]{3,6}' app/assets/stylesheets/mobile/ | grep -v tokens.css | grep -v fonts.css
```

For each match:
- If the hex matches an existing token value → replace with `var(--mobile-color-...)`.
- If the hex is unique (one-off decoration) → leave it, but document in a comment why it's not a token.

### 1.5 Audit for `:hover`-only states (Pitfall 8)

```bash
grep -rn ":hover" app/assets/stylesheets/mobile/
```

For each `:hover` declaration, ensure there's either:
- A matching `:active` declaration, or
- A matching `:focus-visible` declaration (preferably both for accessibility)

If a declaration is `:hover`-only, add `:active` with the same styling. This prevents ghost-highlighted buttons on touch devices.

### 1.6 Shadow flattening

The current `base.css` may use the old dramatic shadows (`0 16px 36px rgba(...)`). After the token rename (`--mobile-shadow-soft` → `--mobile-shadow-md`), the visual weight drops significantly. This is intended. Don't try to "restore" the old look — the point is subtle elevation.

### 1.7 Part 1 verification

After steps 1.1–1.6:

- `bin/dev` starts cleanly with no warnings.
- All four Montserrat WOFF2 files return 200 via curl.
- Navigate `/mobile/open` and `/mobile/intro` in a browser. Visual inspection:
  - Typography is Montserrat — not system font, not serif.
  - Background is `#EAE6E5` cream — not the previous `#f3f0ea` tan.
  - Text is `#293241` navy — not `#172531`.
  - Accent color on buttons is `#5B9279` sage — not the previous `#2f755a` deep forest.
  - Shadows feel like subtle elevation, not dramatic drop shadows.
- Visit `/mobile/onboarding/welcome` and similar — screens render without regressions, layout still works.

**Commit Part 1** with a message like:

```
Phase B part 1 — mobile design system refresh

- Self-host Montserrat (400/500/600/700) as WOFF2 under
  app/assets/fonts/, linked via sprockets manifest, @font-face
  declared in tokens.css
- Rewrite app/assets/stylesheets/mobile/tokens.css to the target
  state in HOTWIRE_MOBILE_DESIGN_AUDIT.md: Kindling warm palette,
  8px spacing grid, six-rung radii scale, subtle elevation shadows,
  Montserrat as --mobile-font-ui, drop the serif display font
- Token migration: sweep base.css and per-component stylesheets to
  use new token names. Remove references to --mobile-space-3/5,
  --mobile-shadow-soft/card, --mobile-font-display
- Flatten dramatic drop shadows to subtle elevation
- Fix :hover-only states (Pitfall 8) — pair with :active on touch

StepCard partial and Heroicons vendoring are deferred — research is
preserved in HOTWIRE_MOBILE_DESIGN_AUDIT.md "Deferred components"
appendix; build when a screen actually needs them.

Visual changes only. No JS changes. No interactivity changes.
Existing screens look different but behave identically.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Part 2 — Stimulus controller conversion

Reference: the existing vanilla modules under `app/javascript/mobile/`.

One controller per module. Standard Stimulus conventions — use targets, values, and actions. No custom base classes, no shared helpers. If a pattern repeats across controllers, leave it — three similar `connect()` methods are fine; extracting them into a mixin is premature.

**Controller code snippets below are target state — match this structure. Minor refactoring is fine; document any deviation in the commit message so the plan-vs-ship delta is traceable.**

### 2.1 Controller: `choice_group_controller.js`

**File**: `app/javascript/controllers/choice_group_controller.js`

**Behavior** (equivalent to the current vanilla module):

- Attached to elements with `data-controller="choice-group"`.
- When a radio input inside changes, sync the group's visual state (collapse non-selected options if `data-choice-group-collapsible-value="true"`).
- When the reset button (injected when a selection exists, collapsible mode) is clicked, clear all radios and re-sync.

**Target state**:

```js
import { Controller } from "@hotwired/stimulus"

// Data attributes on the root element:
//   data-controller="choice-group"
//   data-choice-group-collapsible-value="true"    (optional, default false)
//
// Targets (not required — the controller can query its own element):
//   data-choice-group-target="option"    — on each .mobile-radio-option
export default class extends Controller {
  static values = { collapsible: { type: Boolean, default: false } }

  connect() {
    this.sync()
  }

  // Fired by radio change (bound via data-action in the ERB).
  select() {
    this.sync()
  }

  // Fired by clicking the injected reset button (bound via data-action).
  reset(event) {
    event.preventDefault()
    this.element.querySelectorAll("input[type='radio']").forEach((input) => {
      input.checked = false
    })
    this.sync()
  }

  sync() {
    const checked = this.element.querySelector("input[type='radio']:checked")
    this.element.classList.toggle("is-collapsed", this.collapsibleValue && Boolean(checked))

    this.element.querySelectorAll(".mobile-radio-option").forEach((option) => {
      const input = option.querySelector("input[type='radio']")
      const isSelected = input === checked

      option.classList.toggle("is-selected", isSelected)

      let resetButton = option.querySelector("[data-choice-group-reset]")

      if (!resetButton && isSelected && this.collapsibleValue) {
        resetButton = document.createElement("button")
        resetButton.type = "button"
        resetButton.className = "mobile-radio-reset"
        resetButton.dataset.choiceGroupReset = "true"
        resetButton.dataset.action = "click->choice-group#reset"
        resetButton.setAttribute("aria-label", "Change selection")
        resetButton.innerHTML = "&#8635;"
        option.appendChild(resetButton)
      }

      if (resetButton) {
        resetButton.hidden = !(isSelected && this.collapsibleValue)
      }
    })
  }
}
```

**ERB partial updates** — `app/views/mobile/shared/_choice_group.html.erb`: add `data-controller="choice-group"` + `data-choice-group-collapsible-value="true"` on the root element (the latter only if the partial currently sets `data-mobile-choice-group="true"`; map the boolean). On the radio inputs, add `data-action="change->choice-group#select"`.

**Note**: the dynamically-injected reset button uses `data-action="click->choice-group#reset"` in its own dataset. Stimulus picks up newly-inserted `data-action` attributes automatically — no extra wiring needed.

### 2.2 Controller: `picker_sheet_controller.js`

**File**: `app/javascript/controllers/picker_sheet_controller.js`

```js
import { Controller } from "@hotwired/stimulus"

// data-controller="picker-sheet"
// targets:
//   sheet       — the overlay element (.mobile-picker__sheet)
//   select      — the underlying <select> (.mobile-picker__select)
//   label       — the visible label (.mobile-picker__label)
//   option      — each option row (.mobile-picker__option)
export default class extends Controller {
  static targets = ["sheet", "select", "label", "option"]

  connect() {
    this.sync()
  }

  open(event) {
    event.preventDefault()
    this.sheetTarget.hidden = false
    document.body.classList.add("mobile-sheet-open")
  }

  close(event) {
    event.preventDefault()
    this.sheetTarget.hidden = true
    document.body.classList.remove("mobile-sheet-open")
  }

  choose(event) {
    event.preventDefault()
    const value = event.currentTarget.dataset.pickerValue || ""
    this.selectTarget.value = value
    this.selectTarget.dispatchEvent(new Event("change", { bubbles: true }))
    this.sheetTarget.hidden = true
    document.body.classList.remove("mobile-sheet-open")
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

  // Bound to change events on the hidden <select>.
  selectChanged() {
    this.sync()
  }
}
```

**ERB partial updates** — `app/views/mobile/shared/_picker_field.html.erb`:

- Root `.mobile-picker`: add `data-controller="picker-sheet"`.
- Trigger button: `data-action="click->picker-sheet#open"`.
- Sheet overlay: `data-picker-sheet-target="sheet"`.
- Close button: `data-action="click->picker-sheet#close"`.
- Option rows: `data-picker-sheet-target="option"` + `data-action="click->picker-sheet#choose"` + `data-picker-value="..."` (replaces the current `data-mobile-picker-option` + `data-value`).
- Label span: `data-picker-sheet-target="label"`.
- Hidden `<select>`: `data-picker-sheet-target="select"` + `data-action="change->picker-sheet#selectChanged"`.

Keep the existing CSS class names (`mobile-picker`, `mobile-picker__sheet`, etc.) — only data attributes change.

### 2.3 Controller: `family_form_controller.js`

**File**: `app/javascript/controllers/family_form_controller.js`

The vanilla `family_form.js` is 240+ lines. The Stimulus conversion preserves all its logic — only the binding-to-events changes. Use targets for DOM references (`partnerFields`, `relationshipInputs`, etc.), actions for events, and a `connect()` that does the initial sync work currently done at the bottom of the vanilla init.

**Sketch** (not complete — follow the vanilla module for the actual business rules):

```js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "partnerFields",
    "spouseFirstName",
    "spouseLastName",
    "childrenSection",
    "childrenList",
    "childTemplate",
    "addChildButton",
  ]

  static values = { userLastName: String }

  connect() {
    this.updatePartnerFields()
    this.updateChildrenSection()
    this.refreshChildCardChrome()
    this.refreshResponsibilityOptions()
  }

  relationshipChanged() {
    this.updatePartnerFields()
    this.refreshResponsibilityOptions()
  }

  hasChildrenChanged() {
    this.updateChildrenSection()
  }

  addChild(event) {
    event.preventDefault()
    this.addChildCard()
  }

  // ... all the private helpers from the vanilla module as instance methods
}
```

**ERB partial updates** — `app/views/mobile/onboarding/_family_form.html.erb` (or wherever the family form lives):

- Root form: `data-controller="family-form"` + `data-family-form-user-last-name-value="<%= @user_last_name %>"`.
- Relationship radios: `data-action="change->family-form#relationshipChanged"`.
- Has-children radios: `data-action="change->family-form#hasChildrenChanged"`.
- Add-child button: `data-action="click->family-form#addChild"` + `data-family-form-target="addChildButton"`.
- Children list: `data-family-form-target="childrenList"` + `data-action="click->family-form#childListClicked change->family-form#childListChanged focusin->family-form#childListFocused input->family-form#childListInput"`.
- Other targets as listed in `static targets`.

The `childListClicked` / `childListChanged` / etc. methods dispatch to the specific handlers based on event target, same as the vanilla delegated pattern.

### 2.4 Controller: `extended_family_form_controller.js`

Small — 20 lines in the vanilla version.

```js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["siblingsInput", "countField", "numberInput"]

  connect() {
    this.sync()
  }

  sync() {
    const selected = this.siblingsInputTargets.find((input) => input.checked)?.value
    const shouldShow = selected === "yes"
    this.countFieldTarget.hidden = !shouldShow
    if (!shouldShow) {
      this.numberInputTarget.value = ""
    }
  }
}
```

**ERB updates** — `data-controller="extended-family-form"`, siblings inputs `data-action="change->extended-family-form#sync"` + `data-extended-family-form-target="siblingsInput"`, count field `data-extended-family-form-target="countField"`, number input `data-extended-family-form-target="numberInput"`.

### 2.5 Controller: `splash_redirect_controller.js`

```js
import { Controller } from "@hotwired/stimulus"
import { Turbo } from "@hotwired/turbo-rails"

export default class extends Controller {
  static values = {
    url: String,                     // required; no default — splash without a destination is a bug, fail loudly
    delay: { type: Number, default: 450 },
  }

  connect() {
    if (!this.urlValue) throw new Error("splash-redirect: data-splash-redirect-url-value is required")

    this.timeoutId = window.setTimeout(() => {
      Turbo.visit(this.urlValue, { action: "replace" })
    }, this.delayValue)
  }

  disconnect() {
    if (this.timeoutId) window.clearTimeout(this.timeoutId)
  }
}
```

**ERB updates** — the splash view at `app/views/mobile/startup/index.html.erb` (or similar): the `#mobile-splash-root` element becomes `data-controller="splash-redirect" data-splash-redirect-url-value="<%= @destination %>"`. Drop the `id="mobile-splash-root"` unless other code references it (grep to check).

Note: the vanilla module had a `data-splashRedirected` idempotency guard. Stimulus controllers don't need it — `connect()` runs once per element instance, and Turbo navigation removes the element (triggering `disconnect()`, which clears the timeout).

### 2.6 Delete the vanilla modules

```bash
rm -rf app/javascript/mobile
```

### 2.7 Update `mobile.js`

Target state:

```js
// Turbo loads before any bridge-component imports (Phase F onward depend on this).
import "@hotwired/turbo-rails"
import "controllers"

document.documentElement.classList.add("js")
```

That's it. No `runInit`, no event listeners. Stimulus handles everything via `data-controller`.

### 2.8 Update `config/importmap.rb`

The `pin_all_from "app/javascript/mobile", under: "mobile"` line becomes dead — the `mobile/*` files are deleted. Remove that pin:

```ruby
pin "application"
pin "mobile"
# pin_all_from "app/javascript/mobile", under: "mobile"   # DELETE THIS LINE
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
```

### 2.9 Part 2 verification

After all 2.x steps:

- `bin/dev` starts cleanly, no errors.
- DevTools console on any mobile page → no JS errors. `Stimulus` is defined globally (installer-generated from Phase A).
- Inspect the page — `data-controller` attributes are present on the expected elements.
- Interactive walk-through in browser (this is the gate that Phase A skipped):
  - Splash redirects after ~450ms, replaces root (back button doesn't return to splash).
  - Intro → Continue submits, navigates to next screen.
  - Onboarding welcome → location → family → extended-family → wrap-up.
  - Choice-group: tap radio → selection shows, non-selected collapse if collapsible. Reset button clears.
  - Picker: tap trigger → sheet opens. Tap option → selection persists, sheet closes.
  - Family form: change relationship status → partner fields show / hide. Toggle has-children → children section shows. Add child button works. Remove child button shows only when > 1 child.
  - Extended family: toggle siblings → count field shows / hides.
- Navigate: welcome → location → back → welcome. Interactions still work after Turbo restore. No listeners accumulated (DevTools → Event Listeners on `document` should show the same count on first and fifth visit).
- Existing Rails tests pass (same count as post-Phase-A — the pre-existing 26 failures are not Phase B's scope).

**Commit Part 2**:

```
Phase B part 2 — Stimulus controller conversion

- Five new controllers under app/javascript/controllers/:
  choice_group, picker_sheet, family_form, extended_family_form,
  splash_redirect. Each replaces the equivalent vanilla module
- ERB partials updated with data-controller, data-X-target,
  data-action attributes. Class names unchanged
- Delete app/javascript/mobile/*.js — all five vanilla modules
- mobile.js reduced to three lines: Turbo import, controllers
  import, .js class hook. No runInit, no event listeners — Stimulus
  handles everything
- Remove pin_all_from mobile/ in importmap.rb (dead pin)

Behavior is identical to post-Phase-A. Under the hood: controllers
auto-connect on DOM insertion and disconnect on removal, so the
listener accumulation bug from the interim pattern is structurally
impossible now.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Full verification checklist (end of Phase B)

### Automated

- [ ] `bin/rails test` — zero *new* failures compared to post-Phase-A. If a new failure appears, investigate before merge.
- [ ] `bin/dev` starts cleanly.

### Browser smoke (this is the gate Phase A skipped)

- [ ] Cold-load `/mobile/open?show_video=1` → redirects via Turbo.visit replace. Back button does NOT return to splash.
- [ ] Walk onboarding welcome → wrap-up end-to-end. All five interactive behaviors work: choice-group select + collapse + reset, picker open/select/close, family-form partner + children conditionals + add/remove, extended-family siblings toggle, splash auto-redirect.
- [ ] Navigate 5 screens then check DevTools → Event Listeners on `document`. Count stable, no accumulation (Stimulus disconnects cleanly).
- [ ] DevTools console: no JS errors.

### Visual QA (subjective — owned by user)

The design refresh aims to match or beat the RN reference, which is inherently a judgment call. Rather than pretending it's objective:

- [ ] User screenshots RN and Rails side by side for: intro, onboarding welcome, onboarding family.
- [ ] User iterates on Rails CSS until satisfied with the comparison.
- [ ] Timebox — this is not a blocker for Phase C. Merge when good enough; post-merge polish iterations are fine.

Objective sub-checks that are worth confirming along the way (because they're testable):
- Typography renders Montserrat (DevTools → Computed → `font-family` starts with "Montserrat", not `-apple-system`).
- Background token resolves to `#EAE6E5` (Computed → `background-color` on `.mobile-body`).
- No `--mobile-font-display` or old token names survive (`grep -rn "mobile-font-display\|mobile-space-[3573]\|mobile-shadow-soft\|mobile-shadow-card" app/assets/stylesheets/` returns empty).

## Done criteria

Phase B is complete when:

1. All automated + browser-smoke verification items pass.
2. User's visual QA is satisfied (subjective — user's call).
3. Phase B commits are on `phase-b-stimulus-design-refresh` branch and merged to `main` with `git merge --no-ff`.
4. The branch is deleted.
5. `app/javascript/mobile/` no longer exists.
6. `app/assets/fonts/` contains the four Montserrat WOFF2 files.
7. No references to `--mobile-font-display` or old token names (`mobile-space-3/5/7`, `mobile-shadow-soft/card`) remain in the CSS.

## Handoff to Phase C

After Phase B merges, Phase C begins — iOS shell scaffold + path-configuration + `RemoteConfigStore` Swift layer. The JS side is then "done" for the shell: Stimulus controllers connect inside `WKWebView` exactly as they do in a browser.

Phase B's handoff to Phase C:

1. **Stimulus bridge components** (Phase F) extend the existing Stimulus controllers — the cleaner the controllers, the smoother the bridge. The ones landed here are minimal, which will help.
2. **Deferred components** (StepCard, Heroicons curated set) are specified in `HOTWIRE_MOBILE_DESIGN_AUDIT.md`. When Phase C or later needs the first icon or the first StepCard, copy the spec into that PR.

Phase C's detail plan should be written after Phase B merges — let what we learn in Phase B (especially the visual-vs-RN comparison) inform what Phase C assumes.
