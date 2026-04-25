# Mobile Rails UI Reference

## Purpose

This document is the practical reference for the Rails-native mobile UI system now used by the mobile surface.

It explains:

- the entrypoints
- the layout contract
- every shared mobile partial
- every mobile JavaScript module
- every mobile stylesheet file
- the data attributes that tie the system together
- the Rails-specific conventions required to add or refactor screens safely

This is the document to read before touching:

- `app/views/mobile/**`
- `app/views/layouts/mobile.html.erb`
- `app/javascript/mobile*`
- `app/assets/stylesheets/mobile*`

## High-level architecture

The mobile surface is Rails-owned.

That means:

- Rails controllers decide routes and progression.
- Rails views render the screens.
- Rails forms remain the source of truth for submission.
- JavaScript only enhances interaction.

The mobile UI system has three layers:

1. `layout`
   - shared shell and footer contract
2. `partials`
   - reusable screen/UI building blocks
3. `progressive enhancement`
   - JS modules that enhance radios, pickers, repeaters, and splash routing

## Entry points

### Stylesheet entrypoint

File:

- [mobile.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile.css)

Purpose:

- manifest for the dedicated mobile stylesheet bundle
- loaded only by the mobile layout

### JavaScript entrypoint

File:

- [mobile.js](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/javascript/mobile.js)

Purpose:

- mobile-only JS boot file
- adds the `js` class to the document root
- initializes all mobile progressive-enhancement modules

### Importmap configuration

File:

- [importmap.rb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/config/importmap.rb)

Current pins:

- `pin "mobile"`
- `pin_all_from "app/javascript/mobile", under: "mobile"`

### Admin/mobile split

File:

- [application.js](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/javascript/application.js)

Purpose:

- remains the admin/web entrypoint
- no longer carries mobile-only behavior
- keeps the mobile surface isolated from Bootstrap-oriented admin scripts

## Layout contract

File:

- [mobile.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/layouts/mobile.html.erb)

Purpose:

- dedicated mobile layout
- loads `mobile.css`
- loads the `mobile` JS entrypoint
- defines the app shell
- renders flash notices
- renders the shared sticky footer slot

### Key contract

The layout exposes a footer slot via:

- `content_for :mobile_footer`

This is how sticky bottom actions are rendered.

### Important Rails gotcha

When a submit button is rendered into `content_for :mobile_footer`, it sits outside the form element in the final HTML tree.

That means:

- form views must give the form an explicit `id`
- footer submit buttons must use the `form:` HTML attribute

Example:

```erb
<%= form_with ..., html: { id: "mobile-welcome-form" } do |form| %>
  <% footer_body = capture do %>
    <%= form.submit "Continue", form: "mobile-welcome-form", class: "mobile-button" %>
  <% end %>

  <% content_for :mobile_footer do %>
    <%= render "mobile/shared/sticky_actions", body: footer_body %>
  <% end %>
<% end %>
```

The captured footer body should be created inside the `form_with` block so the form builder stays in scope.

## Shared partials

All shared mobile partials live in:

- [app/views/mobile/shared](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared)

### 1. `screen_header`

File:

- [_screen_header.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_screen_header.html.erb)

Purpose:

- top bar for mobile screens
- optional back link
- optional step pill or centered label
- optional brand mark

Locals:

- `back_path`
- `back_label`
- `step_number`
- `total_steps`
- `center_label`
- `show_brand`

Used by:

- startup screens
- onboarding screens
- login
- dashboard
- secure-account

### 2. `hero_block`

File:

- [_hero_block.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_hero_block.html.erb)

Purpose:

- screen title block
- eyebrow
- title
- subtitle
- optional icon treatment

Locals:

- `eyebrow`
- `title`
- `subtitle`
- `icon`
- `center`

Used by:

- splash
- intro
- video intro
- onboarding steps
- login
- dashboard

### 3. `grouped_section`

File:

- [_grouped_section.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_grouped_section.html.erb)

Purpose:

- primary content surface
- grouped mobile section container
- replaces ad hoc “card everywhere” markup

Locals:

- `title`
- `subtle`
- `body`

Notes:

- `body` is passed as captured markup
- `subtle: true` gives a softer surface

### 4. `form_row`

File:

- [_form_row.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_form_row.html.erb)

Purpose:

- consistent field row wrapper
- label
- hint
- control slot

Locals:

- `label`
- `hint`
- `for_id`
- `body`

Used by:

- text inputs
- date inputs
- number inputs
- picker controls

### 5. `choice_group`

File:

- [_choice_group.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_choice_group.html.erb)

Purpose:

- reusable radio-card selector
- supports collapse-after-select behavior
- supports reset/change affordance via JS

Locals:

- `field_name`
- `label`
- `hint`
- `value`
- `options`
- `id_prefix`
- `collapsible`
- `data_role`

Important output:

- preserves `.mobile-radio-group`
- renders `data-mobile-choice-group`
- renders `data-mobile-collapsible`
- optionally renders `data-role`

Used by:

- yes/no questions
- relationship status
- child boolean flags
- extended-family questions

### 6. `picker_field`

File:

- [_picker_field.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_picker_field.html.erb)

Purpose:

- Rails-native progressive enhancement for select-like fields
- keeps a real underlying `select` as the source of truth
- upgrades that `select` into a sheet-style picker when JS is enabled

Locals:

- `field_name`
- `label`
- `hint`
- `value`
- `options`
- `placeholder`
- `id_prefix`
- `data_role`
- `select_data`

Important design decision:

- this component does **not** replace Rails form semantics
- the underlying `select` remains in the DOM
- JS hides it when enhancement is available
- JS updates the underlying `select`, not a separate hidden input

Why this matters:

- forms remain boring
- tests can still inspect the select
- JS-enhanced behavior can coexist with existing Rails form logic
- dynamic modules such as the family form can still operate on the real select element

Used by:

- location fields
- divorce field
- child relationship
- child responsibility
- child capacity

### 7. `sticky_actions`

File:

- [_sticky_actions.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_sticky_actions.html.erb)

Purpose:

- sticky bottom action container
- consistent CTA spacing and presentation

Locals:

- `body`

Used by:

- intro
- video intro
- questionnaire
- onboarding steps
- login
- dashboard logout

### 8. `callout`

File:

- [_callout.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_callout.html.erb)

Purpose:

- small informational or warning block

Locals:

- `kind`
- `title`
- `body`

Used by:

- secure-account placeholder
- dashboard explanation

### 9. `media_frame`

File:

- [_media_frame.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_media_frame.html.erb)

Purpose:

- standard wrapper for video or media content

Locals:

- `body`

Used by:

- video intro

### 10. `form_errors`

File:

- [_form_errors.html.erb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/views/mobile/shared/_form_errors.html.erb)

Purpose:

- shared top-of-form error summary

Locals:

- `record`

Used by:

- onboarding forms

## JavaScript modules

All mobile JS modules live in:

- [app/javascript/mobile](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/javascript/mobile)

### 1. `choice_group.js`

File:

- [choice_group.js](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/javascript/mobile/choice_group.js)

Purpose:

- manages collapsible radio-card groups
- inserts the reset/change button
- syncs selected and collapsed classes

Selectors:

- `[data-mobile-choice-group]`
- `[data-mobile-choice-reset]`
- `.mobile-radio-option`

### 2. `picker_sheet.js`

File:

- [picker_sheet.js](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/javascript/mobile/picker_sheet.js)

Purpose:

- upgrades `picker_field` controls
- opens and closes picker sheets
- syncs trigger label from the underlying select
- writes selection back to the real select element

Selectors:

- `[data-mobile-picker]`
- `[data-mobile-picker-trigger]`
- `[data-mobile-picker-select]`
- `[data-mobile-picker-sheet]`
- `[data-mobile-picker-option]`
- `[data-mobile-picker-close]`

Important behavior:

- `change` events on the hidden select resync the trigger label
- other JS modules can safely mutate the select and dispatch `change`

### 3. `family_form.js`

File:

- [family_form.js](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/javascript/mobile/family_form.js)

Purpose:

- powers the Family step dynamic behavior
- toggles partner fields
- toggles children section
- auto-adds first child
- adds/removes child cards
- prepopulates surnames
- dynamically rewrites partner-based responsibility options
- reveals guardian detail fields when needed

Selectors and data contracts:

- `[data-mobile-family-form]`
- `[data-role='relationship-status']`
- `[data-role='has-children']`
- `[data-role='partner-fields']`
- `[data-role='children-section']`
- `[data-children-list]`
- `[data-child-template]`
- `[data-add-child]`
- `[data-role='responsibility']`
- `[data-role='co-guardian-fields']`
- `[data-role='child-last-name']`
- `[data-role='spouse-last-name']`

Important design detail:

- responsibility pickers still operate on a real `select`
- this allows dynamic option replacement without inventing a separate client-side data model

### 4. `extended_family_form.js`

File:

- [extended_family_form.js](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/javascript/mobile/extended_family_form.js)

Purpose:

- toggles the sibling count field based on the sibling choice group

Selectors:

- `[data-role='siblings-alive'] input`
- `[data-role='siblings-count']`

### 5. `splash_redirect.js`

File:

- [splash_redirect.js](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/javascript/mobile/splash_redirect.js)

Purpose:

- handles the splash handoff redirect

Selector:

- `#mobile-splash-root`

## Stylesheet files

All dedicated mobile styles live in:

- [app/assets/stylesheets/mobile](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile)

### Manifest

- [mobile.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile.css)

### Tokens

- [tokens.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/tokens.css)

Contains:

- colors
- typography stacks
- spacing scale
- radius scale
- shadow values

### Base

- [base.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/base.css)

Contains:

- body styling
- base button styles
- flash styles
- helper text and list styling

### Layout

- [layout.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/layout.css)

Contains:

- app shell
- content region
- sticky footer region
- shared screen and spacing layout

### Component styles

- [screen_header.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/screen_header.css)
- [hero_block.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/hero_block.css)
- [grouped_section.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/grouped_section.css)
- [form_row.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/form_row.css)
- [choice_group.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/choice_group.css)
- [picker_field.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/picker_field.css)
- [sticky_actions.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/sticky_actions.css)
- [callout.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/callout.css)
- [repeater_card.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/repeater_card.css)
- [media_frame.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/components/media_frame.css)

### Screen-specific styles

- [startup.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/screens/startup.css)
- [onboarding.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/screens/onboarding.css)
- [auth.css](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/assets/stylesheets/mobile/screens/auth.css)

## View data-attribute reference

This is the contract between HTML and JS.

### Choice groups

- `data-mobile-choice-group`
- `data-mobile-collapsible`
- `data-mobile-choice-reset`

### Picker fields

- `data-mobile-picker`
- `data-mobile-picker-trigger`
- `data-mobile-picker-select`
- `data-mobile-picker-sheet`
- `data-mobile-picker-option`
- `data-mobile-picker-close`

### Family form

- `data-mobile-family-form`
- `data-user-last-name`
- `data-role="relationship-status"`
- `data-role="has-children"`
- `data-role="partner-fields"`
- `data-role="children-section"`
- `data-role="responsibility"`
- `data-role="co-guardian-fields"`
- `data-role="child-last-name"`
- `data-role="spouse-last-name"`
- `data-children-list`
- `data-child-template`
- `data-add-child`
- `data-remove-child`
- `data-child-number`

### Extended family

- `data-role="siblings-alive"`
- `data-role="siblings-count"`

### Splash

- `id="mobile-splash-root"`
- `data-destination`

## UI-related model methods

The UI layer relies on a few model-level helpers for labels and defaults.

File:

- [onboarding_session.rb](/Users/lukeaikman/Documents/Sites/kindling-parent/kindling-monorepo/rails/app/models/onboarding_session.rb)

Relevant methods:

- `has_partner?`
- `default_child_responsibility`
- `child_responsibility_options`

Purpose:

- keep relationship-dependent responsibility labels and defaults in Ruby
- avoid duplicating that domain logic across views

## Conventions for new screens

When adding a new mobile screen:

1. Use the `mobile` layout.
2. Wrap the page in `.mobile-screen`.
3. Use `screen_header` at the top.
4. Use `hero_block` for the title/subtitle region.
5. Use `grouped_section` for the main surfaces.
6. Use `form_row`, `choice_group`, and `picker_field` for fields.
7. Use `content_for :mobile_footer` plus `sticky_actions` for the CTA.
8. If the screen uses a form, give the form a stable `id` and bind footer submit buttons with `form:`.

## Conventions for modifying forms

### Prefer progressive enhancement

If a control can remain a real Rails form element underneath, do that.

The best example is `picker_field`:

- it still renders a real `select`
- it just gains a mobile interaction layer

### Keep server truth intact

Do not move:

- progression
- validation
- route decisions
- persistence

into JavaScript.

### Prefer data hooks over implicit DOM assumptions

If a JS module needs to find something, add a stable `data-*` contract for it.

## Current limitations

These are known, intentional boundaries of the current system:

- Picker sheets are lightweight custom overlays, not a full accessibility framework.
- The layout is Rails-first, not platform-native in every tiny behavior.
- We do not yet have a dedicated helper module for mobile view composition.
- We are intentionally not using a frontend framework for the mobile surface.

## Notable removals and replacements

### Old approach replaced

- inline CSS in the mobile layout
- shared mobile logic inside `application.js`
- centered “mobile-card” as the primary screen container
- ad hoc page-specific form markup everywhere

### New approach

- dedicated mobile asset bundles
- shared mobile partials
- full-height shell
- sticky footer contract
- picker enhancement over real selects

## Current screen coverage

These screens now use the shared mobile system:

- splash
- intro
- video intro
- risk questionnaire
- welcome
- location
- family
- extended family
- wrap up
- mobile login
- secure account
- dashboard

## No dedicated helper module yet

At the moment there is no standalone `Mobile::UiHelper` or similar helper module.

That is intentional.

The shared UI behavior currently lives in:

- partial locals
- CSS classes
- JavaScript modules
- a small number of model methods for UI-relevant domain defaults

If helper extraction becomes clearly useful later, it should come from repeated pain, not from anticipation.
