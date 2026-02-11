# Estate Section Rebuild — Comprehensive Implementation Plan

## Overview

Rebuild the "Your Estate" section of the will-building journey. Replace the current linear flow (category selection → intro → entry → next category) with a **hub-and-spoke model** centred on a new **Estate Dashboard**. The dashboard evolves with the user: it starts as a warm category picker ("Let's map out what you own"), then transforms into a balance-sheet-style estate overview once the first asset is added. Users navigate into individual categories to add/edit assets, then return to the dashboard.

**Guiding principles:**
- Hub-and-spoke, not a conveyor belt — always return to estate dashboard between categories
- Two-mode screen — selection mode first, balance sheet mode after first asset
- Progressive disclosure — intros only on first entry; estate dashboard controls routing, not intro screens
- Show growing wealth as reward — odometer toast on every asset save
- KISS data model — `categoryStatus` is the single source of truth for selection AND completion
- Human language — "That's everything", "Do you have any of these?", not "Mark complete"
- Generic components — one `CategorySummaryScreen`, one `AssetCard` with per-type field config
- Phase 1 is a static UI prototype with dummy data; plumbing comes later
- No "Continue" buttons in the estate flow — cards are the navigation, "All assets added" is the exit
- Any edit/delete/add invalidates completion — user must re-confirm "That's everything"

---

## Current State

### What exists today

| Component | File | Purpose |
|-----------|------|---------|
| Category Selection | `app/bequeathal/categories.tsx` | Checkbox-based category picker (to be superseded) |
| Category Navigation | `src/utils/categoryNavigation.ts` | Linear pipeline routing (first → next → next → dashboard) |
| Per-category Intro | `app/bequeathal/{category}/intro.tsx` | Educational screen shown every time (10 files) |
| Per-category Entry | `app/bequeathal/{category}/entry.tsx` | Asset data entry form (10 files) |
| Property Summary | `app/bequeathal/property/summary.tsx` | List of added properties (property only) |
| Estate Remainder | `app/bequeathal/estate-remainder-*.tsx` | Residue allocation (part of Your People) |
| Will Dashboard | `app/will-dashboard.tsx` | Main 3-stage dashboard, routes to `/bequeathal/categories` |
| Progress Utils | `src/utils/willProgress.ts` | `deriveYourEstateStatus()` is a stub returning `'Not started'` |
| Types | `src/types/index.ts` | `BequeathalData`, `BaseAsset`, `BequeathalActions`, `AssetSummary` |

### Existing `BequeathalActions` methods to replace

The current `BequeathalActions` interface has methods that need changing:
- `getSelectedCategories()` — **REPLACE** implementation to read from `categoryStatus` keys
- `setSelectedCategories()` — **DELETE** (replaced by `selectCategory` / `deselectCategory`)
- `toggleCategory()` — **DELETE** (replaced by `selectCategory` / `deselectCategory`)
- `deleteAsset?()` — **DELETE** (deprecated alias for `removeAsset`; would bypass auto-invalidation if kept)

### Existing `WillProgressState` — must extend

The current `WillProgressState` interface in `willProgress.ts` has no `bequeathalData` field:
```typescript
export interface WillProgressState {
  willMaker: Person | undefined;
  people: Person[];
  willData: WillData;
  estateRemainderState: EstateRemainderState;
}
```
This must be extended with `bequeathalData: BequeathalData` before `deriveYourEstateStatus()` can work. All call sites that construct this state object must be updated accordingly.

### Existing route strings to update

`willProgress.ts` currently hardcodes `/bequeathal/categories` in three places:
- `getNextRoute()` (line 298) — return value, must change to `/estate-dashboard`
- `getContinueLabel()` (line 324) — `.includes()` check, must change to match `estate-dashboard`
- `getPeopleSummaryCTA()` (line 370) — route value, must change to `/estate-dashboard`

### Out of scope

- `debts-credit` and `other` asset types — these exist in `AssetType` and `BequeathalData` as stubs but have no UI in the native app (no intro, entry, or summary screens). They are excluded from this plan and ignored in net estate value calculations. If needed later, they follow the same pattern as all other categories.

### Problems with current flow

1. **Linear pipeline** — after categories, user is marched through all of them in sequence. No way to dip into one category and come back.
2. **Intro shown every time** — even if assets exist in a category, the user sees the educational screen again on re-entry.
3. **No summary for most categories** — only Property has a summary screen. Re-entering a category puts you into entry mode, not a list of what you've added.
4. **No estate overview** — no single screen showing total wealth, per-category breakdown, or progress.
5. **No category completion tracking** — no way for the user to signal "I'm done with this category."
6. **No draft/auto-save** — 83-field property form loses data on accidental back navigation.
7. **No validation feedback** — user doesn't know which fields are incomplete until they try to save.
8. **Fragile `useEffect`** — property entry screen uses `useEffect` with no dependency array.

---

## Architecture: Hub-and-Spoke

```
Will Dashboard ("Your Estate" card)
  └─ Estate Dashboard (app/estate-dashboard.tsx)
       │
       │  MODE A (no assets yet):
       │  ┌───────────────────────────────────────────────┐
       │  │  "Let's map out what you own"                 │
       │  │  [Warm category selection cards]              │
       │  └───────────────────────────────────────────────┘
       │
       │  MODE B (at least one asset exists):
       │  ┌───────────────────────────────────────────────┐
       │  │  Hero: £982,000 Net Estate Value              │
       │  │  What You Own: £1,247,000                     │
       │  │  What's in Trust: £150,000                    │
       │  │  IHT: Pending asset entry                     │
       │  ├───────────────────────────────────────────────┤
       │  │  Property ✓  ·  2 items  ·  £550k           › │
       │  │  Bank Accounts  ·  Not started               › │
       │  │  Investments  ·  1 item  ·  £200k            › │
       │  ├───────────────────────────────────────────────┤
       │  │  [+ Add something else]  (opens bottom tray)  │
       │  │  "Your estate is taking shape"                │
       │  │  [All assets added]                           │
       │  └───────────────────────────────────────────────┘
       │
       ├─ Property (assets exist) — tapped from selected card
       │    └─ Category Summary ← Back: Estate Dashboard
       │         └─ Property Entry ← Back: Category Summary
       │
       ├─ Bank Accounts (no assets yet) — tapped from selected card
       │    └─ Bank Accounts Intro ← Back: Estate Dashboard
       │         └─ Bank Account Entry ← Back: Category Summary
       │
       └─ ... (same pattern for all categories)
```

**Key routing rules:**
- Tapping a selected category card with `assetCount > 0` → category summary screen
- Tapping a selected category card with `assetCount === 0` → category intro screen
- "Add something else" button → opens bottom sheet tray with remaining unselected categories
- Checking a category in the tray → adds it to selected zone, closes tray
- Back from any category summary → Estate Dashboard
- Back from any asset entry form → that category's summary screen
- Back from any category intro → Estate Dashboard
- "All assets added" button → Will Dashboard (with specific popup if needed)
- Back button on Estate Dashboard → Will Dashboard

**Intro screens do NOT auto-redirect.** The estate dashboard is the single routing brain — it decides intro vs summary based on asset count. Intro screens just render their educational content and offer a "Get started" button to the entry form. No `router.replace()` logic in intros.

---

## Data Model Changes

### 1. `categoryStatus` as single source of truth

**Remove `selectedCategories: Set<string>` from `BequeathalData`.** Instead, `categoryStatus` serves as both the selection state and completion tracking. A category is "selected" if it has an entry in `categoryStatus`. This eliminates sync bugs between two parallel data structures.

```typescript
// src/types/index.ts — BequeathalData
export interface BequeathalData {
  // ... existing asset arrays ...
  
  // REPLACES selectedCategories: Set<string>
  // A category is "selected" if it has an entry here.
  // completedAt: null = selected but not complete. ISO string = complete.
  categoryStatus: Record<string, {
    completedAt: string | null;
  }>;
  
  totalEstimatedValue: number;
  totalNetValue: number;
  lastUpdated: Date;
}
```

**Deriving selected categories:**
```typescript
const selectedCategories = Object.keys(bequeathalData.categoryStatus);
```

**Selecting a category:** Create entry `{ completedAt: null }`.
**Deselecting a category (no assets):** Delete entry from `categoryStatus`.
**Marking complete:** Set `completedAt` to current ISO date string.

**Why `completedAt` date, not a boolean:**
- Enables future "re-affirmation" prompts: "You marked Property complete 14 months ago — still accurate?"
- `null` = not complete, ISO string = complete

### 2. Auto-invalidation rules

Any mutation to a category's assets **automatically resets `completedAt` to `null`** for that category:
- `addAsset()` on a complete category → `completedAt = null`
- `updateAsset()` on an asset in a complete category → `completedAt = null`
- `removeAsset()` on an asset in a complete category → `completedAt = null`

The user must re-confirm "That's everything" after any change. The timestamp updates each time, building re-affirmation history.

**Special case:** If the last asset in a category is deleted, the category stays selected (entry remains in `categoryStatus`) but with `completedAt = null`. The summary screen shows an empty state with "You have no assets in this category" and the Add/Complete/Back affordances.

### 3. Extend `WillProgressState`

```typescript
// src/utils/willProgress.ts
export interface WillProgressState {
  willMaker: Person | undefined;
  people: Person[];
  willData: WillData;
  estateRemainderState: EstateRemainderState;
  bequeathalData: BequeathalData;  // NEW — required for estate status derivation
}
```

All call sites constructing `WillProgressState` must be updated to include `bequeathalData`.

### 4. Update `BequeathalActions`

```typescript
// src/types/index.ts — BequeathalActions
export interface BequeathalActions {
  // KEEP — unchanged
  addAsset: (type: AssetType, assetData: ...) => string;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  getAssets: () => Asset[];
  getAssetById: (id: string) => Asset | undefined;
  getAssetsByType: (type: AssetType) => Asset[];
  getAllAssets: () => Asset[];
  
  // DELETE — deprecated alias that bypasses auto-invalidation
  // deleteAsset?: (id: string) => void;  ← REMOVED (was wrapper around removeAsset)
  
  // REPLACE — same signature, new implementation (reads from categoryStatus keys)
  getSelectedCategories: () => string[];
  
  // DELETE — replaced by selectCategory / deselectCategory
  // setSelectedCategories: (categories: string[]) => void;  ← REMOVED
  // toggleCategory: (category: string) => void;             ← REMOVED
  
  // NEW — category lifecycle
  selectCategory: (categoryId: string) => void;
  deselectCategory: (categoryId: string) => void;
  markCategoryComplete: (categoryId: string) => void;
  markCategoryIncomplete: (categoryId: string) => void;
  markAllCategoriesComplete: () => void;
  
  // NEW — queries
  isCategorySelected: (categoryId: string) => boolean;
  isCategoryComplete: (categoryId: string) => boolean;
  areAllCategoriesComplete: () => boolean;
  getAssetCountByType: (type: string) => number;
  getTotalAssetCount: () => number;
}
```

**Note:** `getEstateNetValue`, `getEstateGrossValue`, and trust value calculations are implemented as pure functions in `willProgress.ts` (not as action methods) because they need to work with `WillProgressState` for consistency with the other derivation functions.

### 5. No changes to `BaseAsset`

The existing `createdAt` and `updatedAt` fields are sufficient. No per-asset completion flag needed.

---

## Net Estate Value Calculation

The hero number on the Estate Dashboard. Implemented as pure functions in `willProgress.ts`.

### What You Own (gross)
```
Sum of estimatedValue across all selected categories
WHERE heldInTrust !== 'yes'
EXCLUDING out-of-scope categories (debts-credit, other)
```

### What's in Trust
```
Sum of estimatedValue across all selected categories
WHERE heldInTrust === 'yes'
```
Shown separately — typically outside the estate for IHT purposes. Computed inline in the Estate Dashboard component (simple `filter().reduce()`).

### Net Estate Value (hero number)
```
What You Own - mortgage.outstandingAmount for properties with mortgages
```
Only `PropertyAsset` has a `mortgage` field. For all other categories, net = gross. One `if (type === 'property')` check handles the deduction.

### Display in hero section
```
£982,000          ← Net Estate Value (large, hero)
What You Own: £1,247,000
What's in Trust: £150,000
IHT: Pending asset entry   ← until all categories complete
```

---

## New Screens & Components

### 1. Estate Dashboard (`app/estate-dashboard.tsx`)

**The unified hub screen.** Route: `/estate-dashboard`. Mirrors the `app/will-dashboard.tsx` pattern.

#### Two visual modes

**Mode A — Selection mode** (no assets exist across any selected category):
- Title: **"Let's map out what you own"**
- Shows warm category selection cards (styled like the current `categories.tsx`)
- No hero number, no balance sheet, no "All assets added" button
- Checking a category adds it to `categoryStatus`
- Unchecking removes it
- Once the user enters a category and adds an asset, the screen transitions to Mode B on return

**Mode B — Balance sheet mode** (at least one asset exists in any selected category):
- Hero net wealth section (see calculation above)
- Selected categories as value cards with chevrons and status pills
- **"Add something else"** button → opens a bottom sheet tray listing unselected categories with checkboxes. Selecting one adds it to the dashboard and closes the tray. This keeps the balance sheet clean.
- Warm progress sentence
- "All assets added" footer button

The transition from A to B happens naturally: user leaves in selection mode, returns to balance sheet mode after adding their first asset. The screen evolves with them.

#### Mode B Layout

```
┌─────────────────────────────────────┐
│  ← Back          🔥 Logo            │
│  [Header: "Your Estate"]            │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │    £982,000                 │    │
│  │    Net Estate Value         │    │
│  │    What You Own: £1,247,000 │    │
│  │    In Trust: £150,000       │    │
│  │                             │    │
│  │    IHT: Pending asset entry │    │
│  └─────────────────────────────┘    │
│                                     │
│  ── Your Assets ──────────────────  │
│                                     │
│  ┌────────────────────────────┐──┐  │
│  │ 🏠 Property                │ ›│  │
│  │ 2 properties · £550k net   │  │  │
│  │         [✓ That's all]    │  │  │
│  └────────────────────────────┘──┘  │
│                                     │
│  ┌────────────────────────────┐──┐  │
│  │ 🏦 Bank Accounts           │ ›│  │
│  │ Not started                │  │  │
│  └────────────────────────────┘──┘  │
│                                     │
│  ┌────────────────────────────┐──┐  │
│  │ 📈 Investments              │ ›│  │
│  │ 1 account · £200k net      │  │  │
│  └────────────────────────────┘──┘  │
│                                     │
│  [+ Add something else]            │
│                                     │
│  "Your estate is taking shape"     │
│                                     │
├─────────────────────────────────────┤
│  [Button] All assets added          │
└─────────────────────────────────────┘
```

#### Selected Cards

Cards ordered by canonical ordering. Three visual states:

| State | Visual | Left | Right | Tap action |
|-------|--------|------|-------|------------|
| No assets | Amber "Not started" pill | Icon + title | Chevron | → Intro screen |
| Has assets, not complete | Card with value summary | Icon + title + "X items · £Yk net" | Chevron | → Summary screen |
| Complete | Green pill, green left accent | Icon + title + "X items · £Yk net" | Chevron | → Summary screen |

**Deselection rules:**
- Categories with no assets show a checkbox allowing deselection (both modes)
- Categories with `assetCount > 0` hide the checkbox — cannot accidentally deselect a category with assets

#### "Add something else" button (Mode B only)

Opens a `@gorhom/bottom-sheet` tray listing unselected categories as checkbox rows. Checking one:
1. Creates entry in `categoryStatus` (selects it)
2. Card appears in the selected zone on the dashboard
3. Tray closes

#### Progress Sentences (Mode B)

Warm, simple copy:

| State | Sentence |
|-------|----------|
| 0 selected categories | *(Mode A — not shown)* |
| Some categories with assets | "Your estate is taking shape" |
| All complete | "Your whole estate, mapped out" |

#### "All assets added" Button (Mode B footer)

- If all selected categories have `completedAt` set → routes directly to Will Dashboard
- If some categories are NOT marked complete → shows a **specific** popup listing which categories need attention:
  - **If any categories have zero assets:** *"Bank Accounts and Pensions have no assets yet. Mark them complete anyway, or go back and add some?"* → **"Mark complete anyway"** / **"Go back"**
  - **If all have assets but aren't marked complete:** *"Shall we mark all asset categories as complete?"* → **"Yes, that's everything"** / **"Not yet"**
  - **"Mark complete anyway"** / **"Yes, that's everything"** → marks all complete, routes to Will Dashboard
  - **"Go back"** / **"Not yet"** → dismisses popup, stays on Estate Dashboard

#### Back Button

Back button on Estate Dashboard header → Will Dashboard

### 2. Generic Category Summary Screen

**One reusable component** instead of 9+ duplicated screens.

#### Architecture

```
CategorySummaryScreen (generic shell)
  ├─ Header: Back (→ Estate Dashboard) | icon | category title
  ├─ Asset list: renders AssetCard for each asset
  ├─ Total value summary
  ├─ "Add [Asset Type]" button
  ├─ "That's everything" / "Actually, there's more" toggle
  └─ Empty state: "You have no assets in this category"

AssetCard (single generic component)
  ├─ Title line (asset name / address / provider)
  ├─ Detail fields: driven by getAssetDisplayFields(asset)
  ├─ Value line
  └─ Edit (pencil) / Delete (trash) actions
```

**One `AssetCard` component**, not 10. Each asset type has different display-relevant fields, but the card layout is the same: title, a few detail lines, value, and action buttons. A `getAssetDisplayFields(asset: Asset)` utility function returns the right `Array<{label: string, value: string}>` for each `AssetType`. If a specific category genuinely needs a bespoke card layout later, it can be extracted at that point — but start generic.

**10 thin route files** — each is a minimal wrapper:
```typescript
// app/bequeathal/bank-accounts/summary.tsx
export default function BankAccountsSummary() {
  return <CategorySummaryScreen categoryId="bank-accounts" />;
}
```

The existing `app/bequeathal/property/summary.tsx` becomes a thin wrapper too. Its current custom logic is absorbed into `CategorySummaryScreen` + `getAssetDisplayFields`.

#### Summary Screen Features

- **Asset list:** Each asset rendered as an `AssetCard` with edit (pencil icon) and delete (trash icon) actions
- **Total value:** "Total: £X net" at bottom of list
- **"Add [Asset Type]" button:** Routes to the entry form for this category
- **Completion toggle:**
  - Not complete: shows **"That's everything"** button. Tapping sets `completedAt` to now, shows green checkmark.
  - Complete: shows **"Actually, there's more"** link. Tapping resets `completedAt` to null.
- **Empty state:** If all assets deleted, show: "You have no assets in this category" with the Add button, the "That's everything" toggle, and the Back button all still available. Do NOT redirect to the intro screen.
- **No "Continue" button.** Only way out is Back → Estate Dashboard.

### 3. NetWealthToast Component (`src/components/ui/NetWealthToast.tsx`)

**Drop-down toast notification triggered when an asset is saved.**

Behaviour:
1. Appears when any asset is saved (new or updated) and net estate value increases
2. **Silent** when assets are deleted (value decreases) — no toast on deletion
3. Drops down from top of screen (iOS notification banner style)
4. Shows: "Net Estate Value" label + odometer-style number animation (old → new value)
5. Stays for ~2.5 seconds
6. Fades up and out

Implementation notes:
- Uses `react-native-reanimated` for smooth drop-down and fade-out
- Digit-by-digit rolling animation for the number (odometer effect)
- Triggered from asset entry save handlers via a context or event emitter
- Must work regardless of which screen the user is on when saving

### 4. Intro Screen Changes

**Intro screens are simple. The estate dashboard handles all routing logic.**

The estate dashboard decides whether to navigate to intro or summary when a category card is tapped (based on asset count). Intro screens themselves:
- Render their educational content
- Offer a "Get started" button → routes to the entry form
- Back button → `/estate-dashboard`
- **No `router.replace()` or auto-redirect logic.** They don't need to check asset counts or hydration state.

---

## Navigation & Routing Changes

### New routes

| Route | Screen | Purpose |
|-------|--------|---------|
| `/estate-dashboard` | Estate Dashboard | Hub for category selection + estate overview |
| `/bequeathal/{category}/summary` | Category Summary (generic) | List of assets in a category (9 new, 1 refactored) |

### Modified routes

| Route | Change |
|-------|--------|
| `/bequeathal/{category}/intro` | Back → `/estate-dashboard`. No other changes. |
| `/bequeathal/{category}/entry` | Back → `/bequeathal/{category}/summary` |
| `/bequeathal/property/summary` | Replaced by thin wrapper around `CategorySummaryScreen`. Back → `/estate-dashboard`. |

### Will Dashboard changes

In `app/will-dashboard.tsx`:
- "Your Estate" card routes to `/estate-dashboard` (was `/bequeathal/categories`)
- Tapping the card when the estate is **complete** also goes to `/estate-dashboard` (shows balance sheet view)
- `deriveYourEstateStatus()` implemented with real logic (see below)
- Dynamic subline via `getEstateSubline()` helper

### willProgress.ts route string updates

Three existing hardcoded `/bequeathal/categories` references must change to `/estate-dashboard`:
1. `getNextRoute()` (line 298) — estate not complete return value
2. `getContinueLabel()` (line 324) — `.includes('bequeathal/categories')` check → `.includes('estate-dashboard')`
3. `getPeopleSummaryCTA()` (line 370) — "Continue to Your Estate" route value

### Category Navigation utility changes

`src/utils/categoryNavigation.ts` — significant refactor:

1. **Add canonical ordering constant:**

```typescript
export const CANONICAL_CATEGORY_ORDER = [
  'property',
  'bank-accounts',
  'pensions',
  'investment',
  'life-insurance',
  'private-company-shares',
  'assets-held-through-business',
  'important-items',
  'crypto-currency',
  'agricultural-assets',
];
```

2. **Add `sortByCanonicalOrder()` function** to sort selected categories.

3. **Add route helper:**

```typescript
export const getCategoryRoute = (categoryId: string, assetCount: number): string => {
  return assetCount > 0
    ? `/bequeathal/${categoryId}/summary`
    : `/bequeathal/${categoryId}/intro`;
};
```

4. **Remove linear pipeline functions** (`getNextCategoryRoute`, `getFirstCategoryRoute`) — no longer needed in hub-and-spoke.

---

## Status Derivation

### `deriveYourEstateStatus()` — real implementation

```typescript
export function deriveYourEstateStatus(state: WillProgressState): StageStatus {
  const selectedCategories = Object.keys(state.bequeathalData.categoryStatus || {});
  
  // No categories selected = not started
  if (selectedCategories.length === 0) {
    return 'Not started';
  }
  
  // Check if all selected categories are marked complete
  const allComplete = selectedCategories.every(cat => {
    const status = state.bequeathalData.categoryStatus[cat];
    return status?.completedAt !== null && status?.completedAt !== undefined;
  });
  
  if (allComplete) {
    return 'Complete';
  }
  
  // Categories selected but not all complete = in progress
  // (This is correct even if no assets exist yet — selecting categories is starting)
  return 'In progress';
}
```

### Pure helper functions for `willProgress.ts`

```typescript
/** Sum of estimatedValue for non-trust assets minus property mortgages */
export function getEstateNetValue(state: WillProgressState): number {
  // Iterate all selected category arrays in bequeathalData
  // Filter out heldInTrust === 'yes' and out-of-scope types
  // For property: subtract mortgage.outstandingAmount
  // For everything else: estimatedValue as-is
}

/** Total asset count across all selected categories */
export function getTotalAssetCount(state: WillProgressState): number {
  // Sum lengths of all selected category arrays
}
```

### `getEstateSubline()` — dynamic subline for Will Dashboard

```typescript
export function getEstateSubline(state: WillProgressState): string {
  const status = deriveYourEstateStatus(state);
  
  if (status === 'Not started') {
    return 'Assets, gifts, and who gets what · 8 mins';
  }
  
  if (status === 'Complete') {
    const netValue = getEstateNetValue(state);
    const catCount = Object.keys(state.bequeathalData.categoryStatus).length;
    return `${catCount} categories · £${formatShortCurrency(netValue)} net estate`;
  }
  
  // In progress
  const totalAssets = getTotalAssetCount(state);
  const netValue = getEstateNetValue(state);
  return `${totalAssets} assets added · £${formatShortCurrency(netValue)} net`;
}

/** Format a number as a short GBP string: £550k, £1.2m, etc. */
export function formatShortCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}
```

### IHT unlock condition

```typescript
export function isIHTReady(state: WillProgressState): boolean {
  return deriveYourEstateStatus(state) === 'Complete';
}
```

---

## Form Improvements

### 1. Auto-save Drafts (AsyncStorage)

**Applies to:** Property entry (83 fields) and any other long entry forms.

Implementation:
- `useRef`-backed debounced auto-save (2-second debounce) using `async/await` throughout — no fire-and-forget promises
- On form data change → start debounce timer → `await AsyncStorage.setItem()` under key `draft:{category}:{assetId|new}`
- On mount → `await AsyncStorage.getItem()` → if found, offer restore: "You have an unsaved [X] — continue where you left off?"
- On successful save → `await AsyncStorage.removeItem()` to delete draft
- "Discard Draft" button in form footer (secondary/ghost style):
  - **For new assets:** clears draft, resets form to blank
  - **For existing assets (edit mode):** clears draft, reverts form to the **last-saved state** (not blank)

### 2. Validation Feedback

**"X fields need attention" pattern:**

- Save button at bottom of entry forms
- When required fields are incomplete, show a **secondary-styled button below Save**: e.g. "3 fields need attention"
- Tapping it:
  1. Scrolls to the first incomplete required field
  2. Applies red border + "Required" helper text to all incomplete required fields
- Button label updates in real-time as fields are filled: "2 fields need attention" → "1 field needs attention" → disappears
- Validation only shows after user requests it (not on initial render)

### 3. Fix `useEffect` Dependency Array

In `app/bequeathal/property/entry.tsx`:

**Before:**
```typescript
useEffect(() => {
  // ... load property data using ref guard ...
}); // No dependency array — runs on every render
```

**After:**
```typescript
useEffect(() => {
  // ... load property data using ref guard ...
}, [editingPropertyId, bequeathalActions]); // Proper dependency array
```

The ref guard stays as a safety net, but the dependency array prevents unnecessary execution on every render.

---

## Dynamic Sublines on Will Dashboard

When the "Your Estate" stage has data, the will dashboard's subline should update:

| State | Subline |
|-------|---------|
| Not started | "Assets, gifts, and who gets what · 8 mins" |
| In progress | "3 assets added · £550k net" |
| Complete | "5 categories · £982k net estate" |

This follows the same pattern as "Your People" dynamic sublines. Implemented via `getEstateSubline()`.

---

## Canonical Category Ordering

Categories are always displayed in this order throughout the app:

| Order | Category | Rationale |
|-------|----------|-----------|
| 1 | Property | Biggest financial/emotional asset for most people |
| 2 | Bank Accounts | Universal — everyone has these, quick to enter |
| 3 | Pensions | Often 2nd largest asset after property |
| 4 | Investments | ISAs, shares, funds — common for estate planning audience |
| 5 | Life Insurance | Common but often forgotten |
| 6 | Private Company Shares | Less common but high value |
| 7 | Assets Held Through Business | Less common |
| 8 | Important Items | Jewellery, art, heirlooms — emotional significance |
| 9 | Cryptocurrency | Growing but niche |
| 10 | Agricultural Assets | Specialist, rare |

---

## Phased Build Plan

Phases ordered for fastest end-to-end testability: prototype first, then data + navigation + summaries together for a functional skeleton, then animation polish, then toast, then form improvements, then cleanup.

### Phase 1: Static UI Prototype

**Goal:** Build the Estate Dashboard screen with hardcoded dummy data. No state wiring, no navigation plumbing. Iterate the visual design before committing to implementation.

**Deliverables:**
1. `app/estate-dashboard.tsx` — static Estate Dashboard with dummy data:
   - **Mode A** view: "Let's map out what you own" with warm category selection cards
   - **Mode B** view: Hero net wealth section (hardcoded £982,000), "What You Own" / "In Trust" breakdown, selected category cards, "Add something else" button, progress sentence, "All assets added" button
   - Toggle between modes via a dev flag for design review
2. `src/components/ui/EstateCategoryCard.tsx` — reusable category card component:
   - Props: icon, title, assetCount, netValue, isComplete, hasAssets, onPress, onDeselect
   - Three visual states: no assets / has assets / complete
   - Chevron on right for selected categories
   - Checkbox for deselection (only when no assets)
3. Morphic background, design tokens, consistent header pattern
4. Dummy data defined as constants in the file (easy to swap later)

**Acceptance criteria:**
- Both modes render with all visual elements
- Cards show correct states (complete pill, in-progress value, not-started pill)
- Layout matches wireframe
- Scrollable on small devices, fits on iPhone 14/15
- Looks and feels like the rest of the app (People Summary, Will Dashboard)

### Phase 2: Data Model, Navigation & Summary Screens (functional skeleton)

**Goal:** Wire up the entire flow end-to-end: data model, navigation, and summary screens. Prioritise a working skeleton over polish.

**Deliverables:**

**Data model:**
1. In `BequeathalData`: replace `selectedCategories: Set<string>` with `categoryStatus: Record<string, { completedAt: string | null }>`
2. In `BequeathalActions`: replace `setSelectedCategories` and `toggleCategory` with new methods (select, deselect, mark complete, mark incomplete, mark all complete, queries). Re-implement `getSelectedCategories` to read from `categoryStatus` keys.
3. In `useAppState.ts`: implement all new/replaced actions. Add auto-invalidation to existing `addAsset`, `updateAsset`, `removeAsset` — they reset `completedAt` to `null` for the affected category.
4. Extend `WillProgressState` with `bequeathalData: BequeathalData`. Update all call sites.
5. Implement `deriveYourEstateStatus()`, `getEstateNetValue()`, `getTotalAssetCount()`, `getEstateSubline()` in `willProgress.ts`
6. Update hardcoded `/bequeathal/categories` route strings in `getNextRoute()` and `getPeopleSummaryCTA()` to `/estate-dashboard`

**Navigation:**
7. Will Dashboard "Your Estate" card routes to `/estate-dashboard` (always, even when complete)
8. Estate Dashboard wired to real state (Mode A/B derived from total asset count)
9. Selected cards route to summary (assets > 0) or intro (assets === 0) via `getCategoryRoute()`
10. All intro screen Back buttons → `/estate-dashboard`
11. All entry form Back buttons → that category's summary screen
12. All summary screen Back buttons → `/estate-dashboard`
13. Estate Dashboard Back → Will Dashboard
14. Refactor `categoryNavigation.ts`: remove `getNextCategoryRoute`, `getFirstCategoryRoute`, `setSelectedCategories` pipeline. Add canonical ordering and `getCategoryRoute` helper.
15. "All assets added" wired with specific completion popup
16. "Add something else" opens bottom sheet tray

**Summary screens:**
17. Create `src/components/screens/CategorySummaryScreen.tsx` — generic summary shell
18. Create `src/components/ui/AssetCard.tsx` — single generic asset card component
19. Create `src/utils/assetDisplayFields.ts` — `getAssetDisplayFields(asset: Asset)` returns display config per type
20. Create 9 thin route files (one per new category) + refactor existing Property summary into thin wrapper
21. Implement "That's everything" / "Actually, there's more" toggle
22. Implement empty state: "You have no assets in this category" with Add/Complete/Back
23. Dynamic sublines on Will Dashboard via `getEstateSubline()`

**Acceptance criteria:**
- Full flow works end-to-end: Will Dashboard → Estate Dashboard → select category → Intro → Entry → save → Summary → back → Estate Dashboard with updated values
- Mode A → Mode B transition works after first asset
- Completion toggle works on summary screens
- Auto-invalidation works (edit asset → completion resets)
- "All assets added" popup is specific about which categories need attention
- Back buttons all go to correct destinations
- No orphan screens or dead ends

### Phase 3: Category Selection Animation

**Goal:** Polish the float-to-top animation for category selection and the "Add something else" tray.

**Deliverables:**
1. Mode A: checking a category → card transforms and animates (metamorphosis from checkbox row to full selected card)
2. Mode B: "Add something else" tray opens as a bottom sheet, selecting a category animates it into the selected zone above
3. Deselecting a category (with no assets) → card animates back down / disappears from selected zone
4. Canonical ordering maintained within the zone during animation

**Acceptance criteria:**
- Selection animation is smooth and feels like the card is "growing" into its full form
- Deselection animates card away cleanly
- Bottom sheet tray for "Add something else" works smoothly
- 60fps animations

### Phase 4: NetWealthToast

**Goal:** Build the drop-down odometer toast that animates on asset save.

**Deliverables:**
1. `src/components/ui/NetWealthToast.tsx` — the animated toast component
2. `src/context/NetWealthToastContext.tsx` — context provider for triggering the toast from anywhere
3. Odometer digit-rolling animation using `react-native-reanimated`
4. Drop-down from top, hold 2.5s, fade out
5. Integration into asset entry save handlers (property first, then all others)
6. Only triggers on net value increase; silent on decrease/deletion

**Acceptance criteria:**
- Saving a new property triggers the toast
- Number rolls from old value to new value
- Toast appears regardless of which screen you're on
- Deleting an asset does not trigger the toast
- Animation is smooth (60fps)

### Phase 5: Form Improvements

**Goal:** Auto-save drafts, validation feedback, and useEffect fix.

**Deliverables:**
1. **Auto-save drafts:**
   - `src/hooks/useDraftAutoSave.ts` — reusable hook
   - Debounced AsyncStorage persistence (2s debounce) using async/await
   - Draft restore prompt on mount
   - "Discard Draft" button: resets to blank for new assets, reverts to last-saved for edits
   - Apply to property entry first, then other long entry forms
2. **Validation feedback:**
   - "X fields need attention" secondary button below Save
   - Tapping scrolls to first incomplete field
   - Red borders + "Required" text on all incomplete required fields
   - Real-time count updates
3. **useEffect fix:**
   - Add `[editingPropertyId, bequeathalActions]` dependency array to property entry

**Acceptance criteria:**
- Navigating away from a half-filled property form and returning restores the draft
- "Discard Draft" reverts correctly for both new and edit scenarios
- Validation feedback shows correct count and scrolls to correct field
- No unnecessary re-renders from the useEffect fix

### Phase 6: Cleanup

**Goal:** Remove legacy code that has been superseded by the new Estate Dashboard.

**Deliverables:**
1. Evaluate whether `app/bequeathal/categories.tsx` can be deleted — its functionality is now handled by the Estate Dashboard
2. If all tests pass and no other screens reference `/bequeathal/categories`, delete the file
3. Remove any dead code in `categoryNavigation.ts` (linear pipeline functions removed in Phase 2)
4. Audit for any remaining references to the old `/bequeathal/categories` route

**Acceptance criteria:**
- No dead routes or orphaned screens
- All references to old category selection route are removed or redirected
- All tests still pass after cleanup

---

## Test Plan

### Unit Tests

| Test | File | Description |
|------|------|-------------|
| `deriveYourEstateStatus` — no categories | `willProgress.test.ts` | Returns 'Not started' when categoryStatus is empty |
| `deriveYourEstateStatus` — categories, no assets | `willProgress.test.ts` | Returns 'In progress' when categories selected but empty |
| `deriveYourEstateStatus` — some complete | `willProgress.test.ts` | Returns 'In progress' when some categories complete |
| `deriveYourEstateStatus` — all complete | `willProgress.test.ts` | Returns 'Complete' when all selected categories marked complete |
| `getEstateSubline` — all states | `willProgress.test.ts` | Returns correct subline for each status |
| `getEstateNetValue` — excludes trust assets | `willProgress.test.ts` | Assets with heldInTrust='yes' excluded from net calc |
| `getEstateNetValue` — subtracts mortgages | `willProgress.test.ts` | Property mortgage.outstandingAmount deducted |
| `getTotalAssetCount` | `willProgress.test.ts` | Sums asset counts across all selected categories |
| `sortByCanonicalOrder` | `categoryNavigation.test.ts` | Categories sorted correctly regardless of input order |
| `getCategoryRoute` — assets exist | `categoryNavigation.test.ts` | Returns summary route |
| `getCategoryRoute` — no assets | `categoryNavigation.test.ts` | Returns intro route |
| `selectCategory` / `deselectCategory` | `useAppState.test.ts` | Creates/removes entry in categoryStatus |
| `markCategoryComplete` / `markCategoryIncomplete` | `useAppState.test.ts` | Sets/clears `completedAt` correctly |
| `markAllCategoriesComplete` | `useAppState.test.ts` | Sets `completedAt` on all selected categories |
| `areAllCategoriesComplete` | `useAppState.test.ts` | Returns true only when every selected category is complete |
| Auto-invalidation on addAsset | `useAppState.test.ts` | Adding asset to complete category resets completedAt |
| Auto-invalidation on updateAsset | `useAppState.test.ts` | Editing asset in complete category resets completedAt |
| Auto-invalidation on removeAsset | `useAppState.test.ts` | Deleting asset in complete category resets completedAt |
| Auto-save draft persistence | `draftAutoSave.test.ts` | Draft saved to AsyncStorage after debounce |
| Auto-save draft restore | `draftAutoSave.test.ts` | Draft loaded and applied on mount |
| Auto-save draft discard (new) | `draftAutoSave.test.ts` | Draft cleared, form reset to blank |
| Auto-save draft discard (edit) | `draftAutoSave.test.ts` | Draft cleared, form reverted to last-saved state |

### Integration / Manual Tests

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1 | First-time estate entry | From Will Dashboard, tap "Your Estate" | Goes to Estate Dashboard in Mode A: "Let's map out what you own" |
| 2 | Select first category | Check Property in Mode A | Property card appears as selected |
| 3 | First entry into category | Tap Property card (no assets) | Goes to Property Intro screen |
| 4 | Add first asset | Complete property entry, save | Redirected to Property Summary showing 1 property |
| 5 | Mode transition | Tap back on Property Summary | Estate Dashboard shows Mode B with hero number and Property card with value |
| 6 | Re-enter category with assets | Tap Property card again | Goes directly to Property Summary (not intro) |
| 7 | Mark category complete | On Property Summary, tap "That's everything" | Green pill on estate dashboard |
| 8 | Edit invalidates completion | Edit a property in a Complete category | Completion resets, card no longer shows green pill |
| 9 | Delete invalidates completion | Delete a property in a Complete category | Completion resets |
| 10 | Delete last asset — empty state | Delete all properties on Property Summary | Summary shows "You have no assets" with Add/Complete/Back |
| 11 | Deselect empty category | Category with no assets → uncheck on dashboard | Card disappears from selected zone |
| 12 | Cannot deselect category with assets | Property card has no checkbox | No way to accidentally deselect |
| 13 | "Add something else" | Tap button, check Pensions in tray | Pensions card appears on dashboard, tray closes |
| 14 | Net wealth toast | Add a property worth £300k | Toast drops down showing odometer from £0 → £300k |
| 15 | No toast on delete | Delete a property | No toast appears |
| 16 | IHT pending | Some categories incomplete | IHT line shows "Pending asset entry" |
| 17 | "All assets added" — all complete | All categories marked complete, tap button | Routes to Will Dashboard |
| 18 | "All assets added" — zero-asset categories | Bank Accounts selected but empty, tap button | Popup names specific empty categories |
| 19 | "All assets added" — has assets, not marked | Categories have assets but not marked, tap button | Popup: "Shall we mark all as complete?" |
| 20 | Draft auto-save | Fill half of property form, navigate away, return | "Continue where you left off?" prompt appears |
| 21 | Discard draft (new asset) | Tap "Discard Draft" on new asset | Form resets to blank |
| 22 | Discard draft (editing) | Tap "Discard Draft" while editing existing | Form reverts to last-saved state |
| 23 | Validation feedback | Tap save with missing required fields | "X fields need attention" button appears, scrolls to first field |
| 24 | Dynamic subline | Add 3 assets across categories | Will Dashboard "Your Estate" subline shows "3 assets added · £Xk net" |
| 25 | Category ordering | Select categories in random order | All lists show canonical order |
| 26 | Back from entry | While editing a property, tap back | Goes to Property Summary, not Estate Dashboard |
| 27 | Back from intro | On Bank Accounts Intro, tap back | Goes to Estate Dashboard |
| 28 | Tap completed "Your Estate" on Will Dashboard | "Your Estate" card is complete, tap it | Goes to Estate Dashboard (not next stage) |
| 29 | Trust value separation | Add asset with heldInTrust='yes' | "In Trust" line shows that asset's value separately |
| 30 | Cleanup — no dead routes | Search codebase for `/bequeathal/categories` | No remaining references after Phase 6 |

---

## File Inventory

### New files to create

| File | Phase | Description |
|------|-------|-------------|
| `app/estate-dashboard.tsx` | 1 | Estate Dashboard screen (hub) |
| `src/components/ui/EstateCategoryCard.tsx` | 1 | Reusable category card component |
| `src/components/screens/CategorySummaryScreen.tsx` | 2 | Generic category summary shell |
| `src/components/ui/AssetCard.tsx` | 2 | Single generic asset card (all types) |
| `src/utils/assetDisplayFields.ts` | 2 | `getAssetDisplayFields()` — per-type field config |
| `app/bequeathal/bank-accounts/summary.tsx` | 2 | Thin route file |
| `app/bequeathal/investment/summary.tsx` | 2 | Thin route file |
| `app/bequeathal/pensions/summary.tsx` | 2 | Thin route file |
| `app/bequeathal/life-insurance/summary.tsx` | 2 | Thin route file |
| `app/bequeathal/private-company-shares/summary.tsx` | 2 | Thin route file |
| `app/bequeathal/assets-held-through-business/summary.tsx` | 2 | Thin route file |
| `app/bequeathal/important-items/summary.tsx` | 2 | Thin route file |
| `app/bequeathal/crypto-currency/summary.tsx` | 2 | Thin route file |
| `app/bequeathal/agricultural-assets/summary.tsx` | 2 | Thin route file |
| `src/components/ui/NetWealthToast.tsx` | 4 | Odometer toast component |
| `src/context/NetWealthToastContext.tsx` | 4 | Toast trigger context |
| `src/hooks/useDraftAutoSave.ts` | 5 | Auto-save hook |

### Existing files to modify

| File | Phase | Changes |
|------|-------|---------|
| `src/types/index.ts` | 2 | Replace `selectedCategories` with `categoryStatus`. Remove `setSelectedCategories`, `toggleCategory`, and `deleteAsset` from `BequeathalActions`. Add new methods. |
| `src/hooks/useAppState.ts` | 2 | Implement new/replaced actions. Auto-invalidation on `addAsset`/`updateAsset`/`removeAsset`. Remove `setSelectedCategories`, `toggleCategory`, and `deleteAsset` implementations. |
| `src/utils/willProgress.ts` | 2 | Extend `WillProgressState` with `bequeathalData`. Implement `deriveYourEstateStatus()`, `getEstateSubline()`, `getEstateNetValue()`, `getTotalAssetCount()`, `formatShortCurrency()`. Update `/bequeathal/categories` → `/estate-dashboard` in `getNextRoute()`, `getContinueLabel()`, and `getPeopleSummaryCTA()` (3 places). |
| `src/utils/categoryNavigation.ts` | 2 | Add canonical ordering, `getCategoryRoute()` helper. Remove `getNextCategoryRoute`, `getFirstCategoryRoute`. |
| `app/will-dashboard.tsx` | 2 | Route "Your Estate" to `/estate-dashboard` (always). Dynamic subline. Pass `bequeathalData` into `WillProgressState`. |
| `app/bequeathal/property/summary.tsx` | 2 | Replace with thin wrapper around `CategorySummaryScreen`. |
| `app/bequeathal/property/entry.tsx` | 5 | Auto-save, validation, useEffect fix |
| `app/bequeathal/*/intro.tsx` (all 10) | 2 | Back → `/estate-dashboard`. No other logic changes. |
| `app/bequeathal/*/entry.tsx` (all 10) | 2, 4 | Back → category summary. NetWealthToast integration (Phase 4). |

### Files to potentially delete (Phase 6)

| File | Condition |
|------|-----------|
| `app/bequeathal/categories.tsx` | Delete if all tests pass and no references remain |

---

## Key Decisions

Non-obvious decisions that would confuse a developer encountering this plan fresh:

| Decision | Rationale |
|----------|-----------|
| `categoryStatus` replaces `selectedCategories` | Single source of truth. "Selected" = has entry. "Complete" = `completedAt` is set. Eliminates sync bugs. |
| One `AssetCard` component, not per-type cards | Card layout is identical; only the displayed fields differ. `getAssetDisplayFields()` returns the right fields per type. Extract bespoke cards later only if genuinely needed. |
| `WillProgressState` must include `bequeathalData` | The current interface doesn't have it. All call sites need updating. This is a prerequisite for `deriveYourEstateStatus()`. |
| Intro screens don't auto-redirect | Estate dashboard is the routing brain. It navigates to intro (no assets) or summary (has assets). Intros just render content. |
| Net value calc: only Property has liabilities | Only `PropertyAsset` has a `mortgage` field. One `if (type === 'property')` check. No general-purpose debt framework needed. |
| Trust values computed inline | Simple `filter().reduce()` in Estate Dashboard component. Not a separate function. |
| "All assets added" popup is specific | Names which categories have zero assets. Not a generic "are you sure?" |
| `completedAt` is a date, not a boolean | Enables future re-affirmation: "You marked this complete 14 months ago — still accurate?" |
| Any asset mutation invalidates completion | Add, edit, or delete on a complete category resets `completedAt` to null. User must re-confirm. |
| Empty category stays on summary, not intro | Deleting all assets shows summary empty state. User still has Add/Complete/Back. Category stays selected in `categoryStatus`. |

---

## Dependencies

- `react-native-reanimated` — already installed, used for NetWealthToast odometer and category selection animations
- `@react-native-async-storage/async-storage` — already installed, used for draft persistence
- `@gorhom/bottom-sheet` — already installed, used for "Add something else" tray
- No new dependencies required

---

## Estimated Effort

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Static UI Prototype (both modes) | Small — 1 screen + 1 component with dummy data |
| 2 | Data Model + Navigation + Summary Screens (functional skeleton) | Large — types, state, routing, generic summary, asset card, 9 route files, field config |
| 3 | Category Selection Animation | Medium — float/metamorphosis animation, bottom sheet tray |
| 4 | NetWealthToast | Medium — animation component + context |
| 5 | Form Improvements | Medium — auto-save hook, validation UX, useEffect fix |
| 6 | Cleanup | Small — audit and delete legacy code |

**Total:** ~17 new files, ~20 modified files, across 6 phases.
