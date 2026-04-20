# Hotwire Mobile Design Audit — RN reference vs. current Rails mobile

> **Purpose**: the React Native app (`../rnative/`) looks good. The current Rails mobile views do not look as good yet. This doc is the concrete, token-by-token audit of the RN design system alongside the current Rails mobile tokens, so Phases B–D can close the gap deliberately rather than drift.
>
> **Status**: reference / audit doc. Not a phase. Not executed against. Referenced by Phase B (when we touch ERB partials and the CSS tokens), Phase C (when we build the iOS shell and decide on platform chrome styling), and any future styling PR.
>
> **Rule**: the native nav chrome is **platform-native** (we're using Hotwire Native specifically for this). The **content area** — everything inside each ERB page — must look and feel Kindling, matching or exceeding the RN app's visual quality. This doc is about the content area.

## The "feels Kindling" rule

Three non-negotiables from the RN app that we preserve. If a redesign decision violates any of these, it's the wrong decision:

1. **Warm palette, not cold.** Cream-bg, brown-text accents, sage-green actions. Nothing gray-on-white-on-blue. The warm palette is the primary reason the app feels human rather than corporate — critical for estate planning where users are thinking about death.
2. **Generous rounding + breathing space.** 24px card radii, 8px grid spacing, 16–24px gaps between form field groups. Never cramped.
3. **Hierarchy through weight + size, not through decoration.** One typeface, strong weight scale, clear size jumps (12 → 14 → 16 → 20 → 24 → 32). No ornamental borders, no gradient backgrounds on buttons, no drop-caps.

## Source files in the RN app (reference)

If you need ground truth during implementation, read these directly — they are authoritative:

- `rnative/src/styles/theme.ts` — color palette
- `rnative/src/styles/constants.ts` — typography, spacing, shadows, radii
- `rnative/src/components/ui/Button.tsx` — button variant system
- `rnative/src/components/ui/StepCard.tsx` — signature warm-card with decorative blobs (highest-impact component)
- `rnative/src/components/ui/SummaryCard.tsx` — left-accent-bar card pattern
- `rnative/src/components/ui/Input.tsx` — underline input style
- `rnative/app/onboarding/welcome.tsx` — full onboarding screen structure
- `rnative/app/intro.tsx` — hero intro layout
- `rnative/assets/fonts/Montserrat-SemiBold.ttf` — the single custom typeface

## Token comparison — RN reference vs. current Rails mobile

### Colors

| Role | RN app (`theme.ts`) | Current Rails (`mobile/tokens.css`) | Decision |
|---|---|---|---|
| Warm background | `#EAE6E5` (cream) | `#f3f0ea` (lighter cream-tan) | **Adopt RN** `#EAE6E5` for primary background. Current is a bit too yellow/tan. |
| Content surface | `#ffffff` (white, cards on cream bg) | `#fffdfa` (nearly-white) | **Adopt RN** `#ffffff`. Cards are white on cream — the contrast IS the effect. |
| Muted surface | `#f8f9fa` (inputs, muted rows) | `#f7f4ee` (warm muted) | **Keep Rails warm tone** `#f7f4ee`. RN's `#f8f9fa` is slightly cool; our palette is consistently warm, so stay warm. |
| Primary text (navy) | `#293241` | `#172531` | **Adopt RN** `#293241`. Slightly lighter, reads better on cream. |
| Body text secondary | `#8F8073` (brown) | `#65717c` (gray-blue) | **Adopt RN** `#8F8073`. The brown secondary text is a signature warm-palette move — swapping it for gray-blue kills the warmth. |
| Accent green (actions, success) | `#5B9279` (sage) | `#2f755a` (deep forest) | **Adopt RN** `#5B9279`. Current Rails green is too dark/corporate. Sage is friendlier. |
| Accent green deep (hover/press) | `#3E6D58` (derived) | `#1f5a45` | **Derive from RN** — use a darker sage like `#3E6D58`. |
| Light green (decorative) | `#8FCB9B` | — (not defined) | **Add** for decorative accents (lines, small flourishes) — used sparingly. |
| Warm decorative cream | `#CCB7A4` (beige) | — (not defined) | **Add** for decorative blobs in StepCard equivalents. |
| Line / border subtle | `rgba(41, 50, 65, 0.10)` (derived from navy) | `rgba(23, 37, 49, 0.10)` | **Adopt RN** form — update navy reference. |
| Destructive / error | `#ec8686` (soft red-pink, warnings) + `#c70e0e` (high-urgency, delete) | `#a24637` (terracotta only) | **Add both** — soft `#ec8686` for warnings, high-urgency `#c70e0e` for delete. Current Rails has only one red, which is overloaded. |

### Typography

| Aspect | RN app | Current Rails | Decision |
|---|---|---|---|
| Body / UI font | **Montserrat SemiBold** (single custom font) | System UI stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text"…`) | **Add Montserrat**. This is a significant change. Either load via Google Fonts (`@import`) or self-host the same `.ttf` the RN app uses. Self-host is better for perf + offline; we already have the file in `rnative/assets/fonts/`. |
| Display / heading font | (same — Montserrat with higher weight) | `"Iowan Old Style", Georgia, serif` | **Drop the serif.** The serif was a brand-adjacent experiment but the RN app doesn't use it, and it fights the modern humanist direction. Titles use Montserrat at 600–700 weight. |
| Scale | `xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32` | Not tokenized — ad-hoc in component CSS | **Adopt RN scale.** Create type-scale custom props: `--mobile-text-xs: 0.75rem` through `--mobile-text-3xl: 2rem`. |
| Weights in use | `400, 500, 600, 700` | Varies — uses system-font weights | **Adopt RN weights.** If using a single Montserrat file, load weights as `@font-face` separately or use a variable font. |
| Line heights | `tight: 1.2, normal: 1.5, relaxed: 1.75` | Not tokenized | **Add line-height tokens.** |

Loading Montserrat:

```css
/* Preferred: self-host .woff2 files converted from the RN TTF */
@font-face {
  font-family: "Montserrat";
  src: url("/fonts/Montserrat-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Montserrat";
  src: url("/fonts/Montserrat-SemiBold.woff2") format("woff2");
  font-weight: 600;
  font-display: swap;
}
/* …plus 500 and 700 */
```

Fallback stack for the `--mobile-font-ui` token:

```css
--mobile-font-ui: "Montserrat", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
```

### Spacing

| Role | RN app | Current Rails | Decision |
|---|---|---|---|
| xs | `4px` | `0.25rem` (4px) | ✓ match |
| sm | `8px` | `0.5rem` (8px) | ✓ match |
| (12px) | — | `0.75rem` (12px) | **Remove** `--mobile-space-3`. Tight 8-px grid. If 12px is needed, use `sm` (8) or `md` (16) — don't add a rung. |
| md | `16px` | `1rem` (16px) | ✓ match |
| (20px) | — | `1.25rem` (20px) | **Remove** `--mobile-space-5`. Same reasoning. |
| lg | `24px` | `1.5rem` (24px) | ✓ match |
| xl | `32px` | `2rem` (32px) | ✓ match |
| xxl | `48px` | — | **Add** `--mobile-space-xxl: 3rem` for hero-block layouts and major section breaks. |

Net change: remove two in-between rungs (12px and 20px), add one on the top (48px).

### Radii

| Role | RN app | Current Rails | Decision |
|---|---|---|---|
| sm (badges, pills) | `4px` | — | **Add** — currently the smallest Rails radius is ~14px. |
| (8px — buttons, inputs, small cards) | `8px` | — | **Add** `--mobile-radius-button: 0.5rem`. |
| (12px — standard cards) | `12px` | — | **Add** `--mobile-radius-card: 0.75rem`. |
| (16px — stage/hero cards) | `16px` | `0.9rem` (14.4px) | **Adopt RN** — move `--mobile-radius-sm` up to `1rem` and rename. |
| (24px — StepCard signature) | `24px` | `1.5rem` (24px) | ✓ match |
| (32px — large elements) | — | `2rem` (32px) | **Keep** for pill-buttons or large surfaces. |
| full (circles) | `9999px` | — | **Add** for icon circles and status pills. |

The current Rails radii all cluster between 14–32px, which is why everything looks pill-ish. The RN app has a much wider dynamic range (4 → full), which is what lets it differentiate badges from buttons from cards from hero-cards visually.

### Shadows

RN uses **subtle elevation** — a UX convention that signals "this thing is slightly raised." Current Rails uses **dramatic drop shadows** — which reads as "this thing is a marketing hero" and feels heavy on mobile.

| Role | RN app | Current Rails | Decision |
|---|---|---|---|
| small | `offset: 2px, blur: 2px, opacity: 10%` | — | **Add** — subtle card lift |
| medium | `offset: 4px, blur: 4px, opacity: 15%` | `0 16px 36px rgba(20, 31, 43, 0.08)` | **Replace current with RN medium.** Current shadow is 4x the offset and 9x the blur — it's a marketing shadow, not an elevation. |
| large | `offset: 8px, blur: 8px, opacity: 20%` | `0 22px 48px rgba(20, 31, 43, 0.10)` | **Replace current with RN large.** Same reasoning. |

### Motion

RN uses `react-native-reanimated` for a handful of specific effects. CSS equivalents are viable for most:

| RN effect | CSS / Web equivalent | Priority |
|---|---|---|
| Button `activeOpacity: 0.7` on press | `:active { opacity: 0.7; }` + `transition: opacity 120ms` | **Must have** — every pressable element. |
| StageCard "hero" glow pulse (shadow radius 4→16, opacity 0.15→0.4, 1s loop) | CSS `@keyframes` animating `box-shadow` | **Nice to have** — use sparingly, only on the user's "up next" card. |
| StageCard scale breathing (1 → 1.015 → 1, 1.2s loop) | CSS `@keyframes` animating `transform: scale()` | **Nice to have** — pair with glow. |
| Celebration confetti (1.8s, full-screen) | Web confetti library or SVG animation | **Defer to post-Epic 5** — not urgent. |
| Haptics on success (`Haptics.notificationAsync`) | Hotwire Native bridge (Phase G) | **Phase G only** — CSS can't do this. |
| Page transitions (Expo Router default slide) | Handled by Hotwire Native's `UINavigationController` | **Free from the shell** — no CSS work needed. |

## Current Rails mobile — gap summary

Reading `app/assets/stylesheets/mobile/tokens.css` today shows:

- 2 colors off-palette (green, text)
- Background hue too yellow (`#f3f0ea` vs `#EAE6E5`)
- Serif display font (`Iowan Old Style`) — to be dropped
- System UI body font — to be replaced with Montserrat
- Missing type scale tokens
- Missing spacing rungs at top (48px) + has extra rungs in the middle
- Missing small (4px, 8px, 12px) and full radius tokens
- Dramatic shadows where subtle elevation is wanted
- No line-height tokens
- No animation tokens (duration, easing)

None of these are hard to fix. They're just scattered across `tokens.css`, `base.css`, and the per-component stylesheets.

## Recommended target `tokens.css`

This is the target state — not a drop-in replacement, but the shape the file should be in by end of Phase B (or early Phase C if Phase B runs long).

```css
:root {
  /* ---------- Colors — Kindling warm palette ---------- */
  /* Primary brand */
  --mobile-color-navy: #293241;
  --mobile-color-cream: #EAE6E5;
  --mobile-color-green: #5B9279;
  --mobile-color-green-deep: #3E6D58;
  --mobile-color-green-light: #8FCB9B;
  --mobile-color-beige: #CCB7A4;
  --mobile-color-brown: #8F8073;

  /* Surfaces */
  --mobile-color-bg: var(--mobile-color-cream);
  --mobile-color-surface: #ffffff;
  --mobile-color-surface-muted: #f7f4ee;

  /* Text */
  --mobile-color-text: var(--mobile-color-navy);
  --mobile-color-text-muted: var(--mobile-color-brown);

  /* Semantic */
  --mobile-color-accent: var(--mobile-color-green);
  --mobile-color-accent-deep: var(--mobile-color-green-deep);
  --mobile-color-accent-soft: rgba(91, 146, 121, 0.12);
  --mobile-color-line: rgba(41, 50, 65, 0.10);
  --mobile-color-warning: #ec8686;
  --mobile-color-warning-soft: rgba(236, 134, 134, 0.10);
  --mobile-color-danger: #c70e0e;

  /* ---------- Typography ---------- */
  --mobile-font-ui: "Montserrat", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  /* No serif display font — single-typeface hierarchy by weight + size */

  --mobile-text-xs: 0.75rem;   /* 12px — captions, labels */
  --mobile-text-sm: 0.875rem;  /* 14px — secondary body, subtitles */
  --mobile-text-md: 1rem;      /* 16px — primary body */
  --mobile-text-lg: 1.125rem;  /* 18px — card titles */
  --mobile-text-xl: 1.25rem;   /* 20px — section titles */
  --mobile-text-2xl: 1.5rem;   /* 24px — StepCard titles */
  --mobile-text-3xl: 2rem;     /* 32px — hero display */

  --mobile-lh-tight: 1.2;
  --mobile-lh-normal: 1.5;
  --mobile-lh-relaxed: 1.75;

  --mobile-weight-regular: 400;
  --mobile-weight-medium: 500;
  --mobile-weight-semibold: 600;
  --mobile-weight-bold: 700;

  /* ---------- Spacing — strict 8-px grid ---------- */
  --mobile-space-xs: 0.25rem;   /* 4px */
  --mobile-space-sm: 0.5rem;    /* 8px */
  --mobile-space-md: 1rem;      /* 16px */
  --mobile-space-lg: 1.5rem;    /* 24px */
  --mobile-space-xl: 2rem;      /* 32px */
  --mobile-space-xxl: 3rem;     /* 48px */

  /* ---------- Radii ---------- */
  --mobile-radius-sm: 0.25rem;    /* 4px — badges, pills */
  --mobile-radius-md: 0.5rem;     /* 8px — buttons, inputs */
  --mobile-radius-lg: 0.75rem;    /* 12px — standard cards */
  --mobile-radius-xl: 1rem;       /* 16px — stage/hero cards */
  --mobile-radius-2xl: 1.5rem;    /* 24px — StepCard signature */
  --mobile-radius-full: 9999px;   /* icon circles, status pills */

  /* ---------- Shadows — subtle elevation, not drop-shadow ---------- */
  --mobile-shadow-sm: 0 2px 2px rgba(41, 50, 65, 0.10);
  --mobile-shadow-md: 0 4px 4px rgba(41, 50, 65, 0.15);
  --mobile-shadow-lg: 0 8px 8px rgba(41, 50, 65, 0.20);

  /* ---------- Motion ---------- */
  --mobile-duration-fast: 120ms;
  --mobile-duration-base: 200ms;
  --mobile-duration-slow: 320ms;
  --mobile-ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Signature components to recreate in ERB + CSS

The RN app's distinctive look comes from a handful of components. Reproducing these well = reproducing the feel. In rough priority order:

### 1. StepCard (highest impact)

Source: `rnative/src/components/ui/StepCard.tsx`

The signature "soft welcome" card. Warm-white surface (`#f9f8f6`), 24px radius, two decorative blobs (cream top-right, sage bottom-left, low opacity), bottom accent line (40px wide, 3px tall, sage at 30% opacity), centered title + subtitle with icon above.

ERB approach: partial `mobile/shared/_step_card.html.erb`, taking `title:`, `subtitle:`, `icon:`, `body:` locals. CSS uses `position: relative` on the card with two `::before` / `::after` pseudo-elements for the blobs, or two absolutely-positioned inner `<div>`s for cleaner authoring.

### 2. Onboarding screen layout rhythm

Source: `rnative/app/onboarding/welcome.tsx`

Structure:

```
[Cream bg]
  [White header strip — logo + step indicator]
  [Scrollable content area]
    [White content card — 12px radius, subtle shadow]
      [Icon circle — 64px, green-tint bg, green icon]
      [Centered 20px semibold title]
      [Centered 14px brown subtitle]
      [Form — 8px gap between fields]
  [White footer strip — CTA button, full-width, 56px min-height]
```

This is the pattern for every onboarding screen. Currently the Rails mobile views have a different rhythm (inset-grouped sections settings-style, full-bleed headers). Phase B refactor applies this layout.

### 3. Icon circle

Source: used throughout RN (see welcome.tsx line where icon is rendered)

64px diameter, `border-radius: 50%`, background is brand color at 13% opacity (e.g. `rgba(91, 146, 121, 0.13)` for green), centered icon in full brand color. Small delightful flourish, used everywhere.

### 4. Button variants

Source: `rnative/src/components/ui/Button.tsx`

- **Primary**: navy filled, cream text, 8px radius, 56px min-height
- **Secondary**: sage filled, white text
- **Outline**: 2px navy border, navy text, transparent bg
- **Destructive**: `#c70e0e` filled, white text
- All: 16px semibold, `:active` opacity 0.7 with 120ms transition

### 5. Input

Source: `rnative/src/components/ui/Input.tsx`

Flat/underline style — no box border, just a bottom line. 1px `#e9ecef` line inactive, navy line on focus. 16px navy text. Muted `#f8f9fa` background behind the underline. Labels sit above as 12px uppercase brown semibold with 0.8px letter spacing.

### 6. SummaryCard (dashboard stage cards)

Source: `rnative/src/components/ui/SummaryCard.tsx`

Left accent bar (3px wide, solid sage), 1px subtle-navy border, 16px padding. 28px icon circle at light-navy tint. 12px uppercase semibold brown label, 16px navy sentence body.

## What we're NOT replicating

- **Custom fonts beyond Montserrat.** One typeface. Resist adding a serif "for branding" — the RN app doesn't have one, and its brand is stronger for the restraint.
- **Complex gradients or textures.** The RN app has none. Keep the Rails version similarly flat — colors are the texture.
- **Every animation.** Page transitions come free from Hotwire Native's shell. Only add CSS animations for the handful of RN effects listed in the Motion table above.
- **Native-platform-specific idioms.** iOS settings-style inset-grouped sections were used in the current Rails mobile views; they're being replaced. The RN app is deliberately cross-platform in appearance — same visuals on iOS and Android. We match that.

## Implementation plan — what closes the gap, in which phase

| Work | Phase | Notes |
|---|---|---|
| Update `tokens.css` to target state above | Phase B | Early in Phase B, before partial edits. Blocks nothing else. |
| Self-host Montserrat (.woff2 files) | Phase B | Convert the RN TTF → WOFF2 (fonttools), commit under `app/assets/fonts/`. Add `@font-face` declarations. |
| Update `base.css` and component CSS to use new tokens | Phase B | Mostly find-replace: old token → new token. A couple of font-family swaps. |
| Introduce `_step_card.html.erb` partial | Phase B | New partial; used by wrap_up, intro, maybe welcome. Retrofits existing screens that currently use `_grouped_section`. |
| Rework onboarding screen layout rhythm | Phase B | Ties into the Stimulus controller conversion — when we're touching these files anyway. |
| Fix button states (`:active` opacity, focus-visible) | Phase B | Part of the button CSS pass. |
| Icon circle utility class | Phase B | Small CSS addition used wherever `MaterialCommunityIcons`-style circles are wanted. Heroicons or Tabler Icons via SVG is a good icon library choice (no JS, inline `<svg>` in ERB). |
| Subtle elevation shadows replacing dramatic drop-shadows | Phase B | Small CSS replacement. |
| Glow pulse + scale breathing on hero cards (optional) | Phase B or later | CSS `@keyframes`. Only if we have a clear "hero" card state. |
| Haptics on interactions | Phase G | Bridge work; CSS can't do this. |
| Confetti / celebration | Post-Epic 5 | Deferred — not urgent. |

## Open design questions (decide before Phase B styling pass)

1. **Icon library**: Heroicons (outline + solid variants, clean), Tabler Icons (more options, similar style), or Phosphor (friendliest, most variants)? RN uses MaterialCommunityIcons — matching that 1:1 isn't possible on web, but any of the above gets us close. Recommendation: **Heroicons** — smallest install, used widely in the Rails world, inline SVG in ERB is trivial.
2. **Font delivery**: Google Fonts CDN vs self-host WOFF2? Recommendation: **self-host**. Consistent with importmap-assets philosophy, survives offline cache better, avoids third-party CDN dependency. Small initial add (~40–80 KB for the four weights).
3. **Logo**: the RN app uses raster PNGs (`icon-blue.png`, `icon-white.png`). For the Rails mobile, should we do the same or convert to SVG? Recommendation: **SVG** if available, with PNG fallback for older `WKWebView` edge cases. Check with designer for SVG source.
4. **StepCard decorative blobs — strict copy or light reinterpretation?** The RN app's specific blob positions/sizes are distinctive. We can either copy pixel-exact, or reinterpret as a slightly simpler version (single blob, different placement). Recommendation: **copy pixel-exact for the first implementation** — deviation can come later once we see it in context.

## Change log

- 2026-04-20 — initial audit, written after reading both the RN codebase and the current Rails mobile CSS.
