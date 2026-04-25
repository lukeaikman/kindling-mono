# Rails-Native Mobile UI System Plan

> **Frontend-shell decision updated 2026-04-20**: the opening sentence below mentions Capacitor; the shell decision is now **Hotwire Native**. The design-system substance in this doc (primitives, tokens, CSS strategy, refactor phases, screen conventions) is unchanged and still canonical — it's all server-rendered ERB + custom CSS that works identically under Hotwire Native. The only shift is that a future "later adoption of Ionic" is no longer a target; Hotwire Native is the committed direction. Canonical plan: `~/.claude/plans/in-this-repo-you-moonlit-lantern.md`.

## Purpose

This plan defines the Rails-first starting point for rebuilding the mobile surface so it feels like a real app inside a Hotwire Native shell, while keeping routing, state, validation, and progression logic firmly in Rails.

This is the path I would choose if the goal is:

- keep the codebase understandable to Rails developers
- avoid locking the product into a heavy mobile UI framework
- keep the design system lean enough that the native shell (Hotwire Native) provides platform chrome while ERB provides branded content
- refactor the views we already have instead of throwing them away

## Executive summary

We should not solve this with a CSS library.

We should solve it with a small Rails-native mobile design system:

- one dedicated mobile stylesheet entrypoint
- one dedicated mobile JS entrypoint
- a small set of reusable view partials
- CSS custom properties for tokens
- progressive enhancement for interactive controls
- a screen architecture designed for full-height mobile surfaces, not centered responsive web cards

The right north star is not "mobile web that looks nicer."

It is:

- server-rendered Rails screens
- mobile-native visual rhythm
- a handful of excellent primitives
- restrained, intentional JavaScript

## Current diagnosis

The current mobile views are coherent, but the visual and structural language still reads as web-native.

### What is working

- The flow is Rails-owned.
- Route progression is server-side and understandable.
- The mobile namespace is isolated.
- Shared partials already exist.
- The inline CSS has consistent tokens and some reusable classes.
- The family form has already started to adopt product-specific behavior.

### What is not yet working

- The primary shell is a centered card, which reads as responsive web rather than app surface.
- The layout mixes tokens, component styling, layout styling, and page styling in one inline block.
- Controls are mostly browser-native form controls with custom dressing.
- `application.js` is becoming a general dump for all mobile behavior.
- There is no formal component inventory, only a set of CSS classes.
- The onboarding pages are built page-by-page rather than from a clear mobile screen grammar.

### Primary consequence

The experience lacks the feeling of:

- native headers
- grouped settings-style form sections
- sticky bottom actions
- picker-like selections
- tactile mobile spacing and hierarchy

## Design principles

### 1. Rails owns the flow

Rails remains the source of truth for:

- route decisions
- validation
- draft persistence
- step progression
- auth gates

JavaScript enhances interaction. It does not own navigation or business rules.

### 2. The mobile UI is a separate surface

The mobile product should not inherit its visual grammar from Bootstrap admin UI.

Admin can stay Bootstrap.
Mobile should have its own CSS entrypoint, partials, and JS modules.

### 3. Full-height app screens, not centered web cards

The baseline screen should feel like:

- a page in an app
- a scrollable content region
- a sticky action region
- safe-area aware layout

Cards should be used selectively inside screens, not as the screen itself.

### 4. Progressive enhancement over framework capture

All key user paths must remain valid with plain HTML form submission.

Then we progressively enhance:

- choice groups
- picker sheets
- repeaters
- sticky CTA behavior
- transitions

### 5. Build only the primitives we actually need

No speculative design system.
No giant helper pyramid.
No generic component abstraction for its own sake.

We should build the 10-15 primitives that clearly recur across startup, onboarding, login, and dashboard.

## The visual direction

The target should feel closer to a polished native app than a branded landing page.

### Recommended visual shifts

- Move from a centered translucent card to a full-screen mobile surface.
- Use system UI typography for controls and body copy.
- Reserve brand typography for occasional hero moments only, if at all.
- Use grouped inset sections with soft separators.
- Make action buttons live in a sticky bottom bar.
- Make selections feel like list rows or picker triggers, not browser form chrome.
- Reduce ornamental gradients and glassmorphism.
- Increase consistency of vertical spacing and tap target sizing.

### Typography recommendation

For the mobile app surface:

- primary UI font: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`
- optional display accent only where needed: a restrained brand serif for splash/intro headings

Do not use the serif as the default UI font for forms.

### Color recommendation

Keep the current Kindling palette, but apply it more like a mobile product:

- neutral screen background
- white or warm-white grouped surfaces
- one strong accent color
- one subdued destructive color
- less decorative gradient work

## Recommended file structure

### Stylesheets

Create a dedicated mobile stylesheet loaded only by the mobile layout.

Suggested structure:

```text
app/assets/stylesheets/mobile.css
app/assets/stylesheets/mobile/
  tokens.css
  base.css
  layout.css
  utilities.css
  components/
    app_shell.css
    screen_header.css
    step_progress.css
    form_row.css
    text_field.css
    choice_group.css
    picker_row.css
    sticky_actions.css
    callout.css
    repeater_card.css
    media_frame.css
    auth_form.css
  screens/
    startup.css
    onboarding.css
    auth.css
```

### JavaScript

Create a dedicated mobile entrypoint instead of growing `application.js`.

Suggested structure:

```text
app/javascript/mobile.js
app/javascript/mobile/
  choice_group.js
  picker_sheet.js
  repeater_list.js
  family_form.js
  extended_family_form.js
  sticky_actions.js
```

This keeps admin JS and mobile JS separate.

### Views

Use partials, not a component gem, as the first Rails-native step.

Suggested structure:

```text
app/views/mobile/shared/
  _app_shell.html.erb
  _screen_header.html.erb
  _hero_block.html.erb
  _step_progress.html.erb
  _grouped_section.html.erb
  _form_row.html.erb
  _choice_group.html.erb
  _picker_row.html.erb
  _sticky_actions.html.erb
  _callout.html.erb
  _repeater_card.html.erb
  _media_frame.html.erb
  _form_errors.html.erb
```

## The starting component list

This is the component inventory I would build first.

### 1. `AppShell`

Purpose:

- full-height mobile page shell
- safe-area padding
- scroll region
- sticky footer slot

Used by:

- all mobile screens

### 2. `ScreenHeader`

Purpose:

- top bar with back button, optional close action, centered title or brand mark
- native-feeling height and spacing

Used by:

- startup
- onboarding
- login
- dashboard

### 3. `StepProgress`

Purpose:

- “Step x of y”
- optional visual progress bar
- reusable across onboarding

Used by:

- onboarding steps

### 4. `HeroBlock`

Purpose:

- title
- subtitle
- optional icon or illustration
- intro/wrap-up storytelling moments

Used by:

- startup intro
- welcome
- wrap-up
- secure-account handoff

### 5. `GroupedSection`

Purpose:

- inset grouped container for fields or summary rows
- the core replacement for ad hoc card usage

Used by:

- all forms
- startup explainer sections
- wrap-up summary

### 6. `FormRow`

Purpose:

- label
- hint/error
- field content slot
- uniform spacing

Used by:

- every form field

### 7. `TextField`

Purpose:

- shared styling for text, email, password, number, date inputs
- correct mobile spacing, radius, focus state

Used by:

- welcome
- family
- login
- extended family

### 8. `ChoiceGroup`

Purpose:

- app-like radio card selection
- optional collapse-after-select behavior
- reset/change affordance

Used by:

- relationship status
- yes/no questions
- sibling questions
- child boolean questions

This is the Rails-native equivalent of the RN `RadioGroup` behavior.

### 9. `PickerRow`

Purpose:

- button/list-row style trigger that opens a bottom sheet of options
- server fallback can remain a native `select`

Used by:

- divorce status
- nationality
- country of residence
- responsibility
- relationship-to-you
- capacity status

This is the most important control to build if we want the UI to stop feeling web-native.

### 10. `BottomSheet`

Purpose:

- modal sheet for picker choices
- action-sheet style interaction
- soft close, accessible escape path

Used by:

- all `PickerRow` controls

### 11. `StickyActions`

Purpose:

- persistent bottom CTA area
- safe-area aware
- primary and secondary actions

Used by:

- every step screen
- login
- intro
- video intro

This is a major part of making the product feel like an app.

### 12. `Callout`

Purpose:

- validation note
- warning
- informational block

Used by:

- age support note
- intro explainer
- legal/risk messaging

### 13. `RepeaterCard`

Purpose:

- repeated object editor for child cards
- header, remove action, stacked fields

Used by:

- family child list

### 14. `MediaFrame`

Purpose:

- video or rich media container
- consistent radius, spacing, controls frame

Used by:

- video intro

### 15. `AuthForm`

Purpose:

- dedicated login/register styling
- same mobile shell, but distinct auth tone

Used by:

- mobile login
- later secure-account/register screens

## Recommended implementation style for components

### Use partials first

For this codebase, the Rails-first answer is partials plus locals.

That means:

- no React
- no ViewComponent requirement at the start
- no helper-heavy DSL
- no generic builder abstraction

Example style:

- `_choice_group.html.erb`
- `_picker_row.html.erb`
- `_sticky_actions.html.erb`

with plain locals and data attributes.

### Keep component APIs plain

Good:

```erb
<%= render "mobile/shared/choice_group",
  field_name: "onboarding_session[has_children]",
  label: "Do you have children or guardianship responsibilities?",
  value: @onboarding_session.has_children,
  options: [["Yes", "yes"], ["No", "no"]],
  collapsible: true %>
```

Avoid:

- giant helper builders
- nested slots everywhere
- options hashes so abstract no one knows what they do

## Refactor strategy for the current views

This plan must let us refactor what exists now, not restart.

### Current views to refactor

- `app/views/mobile/startup/index.html.erb`
- `app/views/mobile/startup/intro.html.erb`
- `app/views/mobile/startup/video_intro.html.erb`
- `app/views/mobile/startup/risk_questionnaire.html.erb`
- `app/views/mobile/onboarding/welcome.html.erb`
- `app/views/mobile/onboarding/location.html.erb`
- `app/views/mobile/onboarding/family.html.erb`
- `app/views/mobile/onboarding/_child_fields.html.erb`
- `app/views/mobile/onboarding/extended_family.html.erb`
- `app/views/mobile/onboarding/wrap_up.html.erb`
- `app/views/mobile/sessions/new.html.erb`
- `app/views/mobile/auth/secure_account.html.erb`
- `app/views/mobile/dashboard/show.html.erb`

### Refactor approach

#### Phase 1: Foundation extraction

- Move inline mobile CSS out of `layouts/mobile.html.erb` into a dedicated mobile stylesheet.
- Create a dedicated `mobile.js` entrypoint.
- Keep the existing markup working during extraction.
- Do not redesign every screen yet.

#### Phase 2: Establish the screen grammar

Build these first:

- `AppShell`
- `ScreenHeader`
- `StepProgress`
- `StickyActions`
- `GroupedSection`
- `FormRow`
- `ChoiceGroup`

Once these exist, most screens can be reshaped without major churn.

#### Phase 3: Replace screen-level card thinking

Refactor each screen from:

- one floating `mobile-card`

to:

- one full-screen shell
- content sections within it
- sticky CTA footer

#### Phase 4: Replace browser-shaped controls

Build:

- `PickerRow`
- `BottomSheet`

Then refactor current `select` fields one category at a time.

Start with:

- location selects
- divorce select
- child responsibility select
- capacity select

#### Phase 5: Refactor repeaters

Refactor the child editor around:

- `RepeaterCard`
- `FormRow`
- `PickerRow`
- `ChoiceGroup`

This will cleanly absorb the current `_child_fields` partial instead of fighting it.

## View-to-component mapping

### Startup intro

Current needs:

- hero copy
- “what happens next” information
- primary and secondary actions

Use:

- `AppShell`
- `ScreenHeader`
- `HeroBlock`
- `GroupedSection`
- `Callout`
- `StickyActions`

### Video intro

Current needs:

- top header
- title/subtitle
- media frame
- continue CTA

Use:

- `AppShell`
- `ScreenHeader`
- `HeroBlock`
- `MediaFrame`
- `StickyActions`

### Welcome

Current needs:

- step framing
- stacked text/date fields
- error handling
- login escape hatch

Use:

- `AppShell`
- `ScreenHeader`
- `StepProgress`
- `HeroBlock`
- `GroupedSection`
- `FormRow`
- `TextField`
- `StickyActions`

### Location

Current needs:

- two pickers
- two yes/no choice groups

Use:

- `AppShell`
- `ScreenHeader`
- `StepProgress`
- `GroupedSection`
- `PickerRow`
- `ChoiceGroup`
- `StickyActions`

### Family

Current needs:

- relationship choice group
- conditional partner fields
- picker rows
- child repeaters
- dynamic guardian responsibility behavior

Use:

- `AppShell`
- `ScreenHeader`
- `StepProgress`
- `GroupedSection`
- `ChoiceGroup`
- `PickerRow`
- `RepeaterCard`
- `StickyActions`

### Extended family

Current needs:

- several yes/no choice groups
- conditional number input

Use:

- `AppShell`
- `ScreenHeader`
- `StepProgress`
- `GroupedSection`
- `ChoiceGroup`
- `FormRow`
- `StickyActions`

### Wrap-up

Current needs:

- completion summary
- calm handoff to account creation

Use:

- `AppShell`
- `ScreenHeader`
- `HeroBlock`
- `GroupedSection`
- `Callout`
- `StickyActions`

### Mobile login

Current needs:

- welcome-back framing
- email/password fields
- back path

Use:

- `AppShell`
- `ScreenHeader`
- `AuthForm`
- `FormRow`
- `StickyActions`

## Interaction patterns to standardize

These patterns matter more than ornamental styling.

### 1. Sticky primary action

Every step should end with a bottom action bar, not a button buried in scroll content.

### 2. Collapsible choice groups

For binary and small-set decisions:

- tap option
- collapse to selected state
- offer “change” affordance

This behavior already exists conceptually and should become a formal primitive.

### 3. Picker sheets instead of browser selects

The browser `select` is one of the biggest reasons the flow still feels web-native.

The Rails-native answer is:

- server-rendered button/list row
- JS-enhanced bottom sheet
- hidden input carries value
- server remains authoritative

### 4. Repeater cards with stable controls

The child editor should feel like a list of mobile sub-forms, not ad hoc nested markup.

### 5. Inset grouped sections

Most screens should feel like grouped mobile settings panels rather than marketing cards.

## Suggested CSS/token system

### Token categories

Define tokens for:

- color
- typography
- spacing
- radius
- shadow
- border
- z-index
- safe area
- transition

### Example naming direction

```css
:root {
  --mobile-color-bg: #f5f4f1;
  --mobile-color-surface: #ffffff;
  --mobile-color-surface-muted: #f8f7f4;
  --mobile-color-text: #17212b;
  --mobile-color-text-muted: #66707a;
  --mobile-color-accent: #2f755a;
  --mobile-color-danger: #a24637;

  --mobile-font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  --mobile-font-display: "Iowan Old Style", Georgia, serif;

  --mobile-space-1: 0.25rem;
  --mobile-space-2: 0.5rem;
  --mobile-space-3: 0.75rem;
  --mobile-space-4: 1rem;
  --mobile-space-5: 1.25rem;
  --mobile-space-6: 1.5rem;
}
```

## JavaScript philosophy

### Keep JS small and local

JS should only do things HTML/CSS cannot do gracefully:

- collapse choice groups
- open/close picker sheets
- manage child repeater insertion/removal
- handle conditional reveal behavior

### Avoid a single monolith

Do not keep growing one large `application.js`.

Move to:

- one mobile entrypoint
- one module per interaction cluster

### Avoid SPA behavior

No client-owned router.
No client-owned form state machine.
No framework runtime required to understand the screen.

## Recommended rollout phases

### Phase A: Foundation

- add `mobile.css`
- add `mobile.js`
- strip inline CSS from the layout
- make the mobile layout full-height and sticky-footer capable

### Phase B: Primitive kit

Build:

- `ScreenHeader`
- `StepProgress`
- `GroupedSection`
- `FormRow`
- `StickyActions`
- `ChoiceGroup`

### Phase C: Onboarding refactor

Refactor:

- welcome
- location
- family
- extended family
- wrap-up

### Phase D: Startup/auth refactor

Refactor:

- intro
- video intro
- risk questionnaire
- login
- secure-account

### Phase E: Picker upgrade

Replace `select`-based fields with `PickerRow` + `BottomSheet`.

### Phase F: Polish and QA

- safe-area checks
- keyboard behavior
- scroll behavior
- motion consistency
- touch target audit
- iPhone and Android WebView QA

## Acceptance criteria

We can consider the first Rails-native mobile UI pass successful when:

- the mobile surface no longer visually resembles Bootstrap/admin UI
- onboarding screens are full-height mobile pages, not centered web cards
- every step has a sticky action area
- small-set decisions use a consistent `ChoiceGroup`
- select-heavy decisions use a consistent picker pattern
- the child editor feels like one coherent repeater component
- CSS is in dedicated mobile assets rather than inline layout styles
- mobile JS is isolated from admin JS
- views are built from shared partials rather than bespoke page markup alone

## Non-goals

This first pass should not try to:

- build a grand universal design system for the whole app
- replace all server-rendered forms with client-side widgets
- introduce React/Vue/etc
- adopt Ionic wholesale
- chase pixel-perfect parity with RN Paper before the primitives exist

## Why this leaves the Ionic door open later

This plan keeps the hard parts in the right place:

- Rails owns routes
- Rails owns validation
- Rails owns progression
- Rails owns data
- HTML structure stays explicit
- interactions are already broken into clean primitives

If we later decide to adopt Ionic Core or another mobile UI library, we can swap presentation primitives more easily because:

- the view boundaries are already well defined
- the control semantics are already separated
- the JS interactions are already modular
- the product flow is not framework-owned

That is exactly why this is the right starting point.

## Final recommendation

Build a small Rails-native mobile design system with:

- dedicated mobile assets
- partial-based primitives
- picker sheets
- sticky actions
- grouped mobile sections
- restrained JS enhancement

That will let us refactor the current screens cleanly, improve the product dramatically, and preserve optionality for later.
