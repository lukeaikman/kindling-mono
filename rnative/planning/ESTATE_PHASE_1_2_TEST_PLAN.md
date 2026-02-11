# Estate Section — Phase 1 & 2 Test Plan

Comprehensive manual test plan for everything delivered in Phase 1 (static UI prototype) and Phase 2 (data model, navigation & summary screens).

**Prerequisite:** Fresh install or clear app data before testing. If resuming from existing state, expect the migration code to convert any legacy `selectedCategories` into the new `categoryStatus` format — verify the console log `✅ Migrated X selectedCategories to categoryStatus` appears.

---

## Section A: Will Dashboard → Estate Dashboard Navigation

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| A1 | Tap "Your Estate" (not started) | Complete "Your People" stage. On Will Dashboard, tap the "Your Estate" card. | Routes to `/estate-dashboard`. Estate Dashboard opens in **Mode A** ("Let's map out what you own"). |
| A2 | "Your Estate" disabled before "Your People" complete | On Will Dashboard, observe "Your Estate" card before completing "Your People". | Card is greyed out / disabled. Tapping it does nothing. |
| A3 | "Your Estate" subline — not started | On Will Dashboard, view "Your Estate" card when no categories are selected. | Subline reads "Assets, gifts, and who gets what · 8 mins". |
| A4 | "Your Estate" subline — in progress | Add 2 assets (e.g. 1 property, 1 bank account). Return to Will Dashboard. | Subline reads something like "2 assets added · £Xk net" (dynamic values). |
| A5 | "Your Estate" subline — all complete | Mark all selected categories complete. Return to Will Dashboard. | Subline reads "X categories · £Yk net estate". |
| A6 | Tap completed "Your Estate" | "Your Estate" card shows green "Complete" pill. Tap it. | Always routes to `/estate-dashboard` (not the next stage). |
| A7 | "Your Estate" pill — Up next | "Your People" is complete, "Your Estate" is not started. | "Your Estate" card shows "Up next" label with hero glow. |
| A8 | "Your Estate" pill — In progress | At least one category selected but not all complete. | "Your Estate" card shows amber "In progress" pill. |
| A9 | "Your Estate" pill — Complete | All selected categories complete. | "Your Estate" card shows green "Complete" pill. |
| A10 | Back from Estate Dashboard | On Estate Dashboard, tap the back button. | Routes to Will Dashboard. |
| A11 | `getNextRoute` update | All of "Your People" is complete, estate not complete. Call `getNextRoute()`. | Returns `/estate-dashboard` (not the old `/bequeathal/categories`). |
| A12 | `getContinueLabel` update | When next route is `/estate-dashboard`. | Returns "Continue to Your Estate". |
| A13 | People Summary CTA update | "Your People" complete, estate not started. View People Summary screen. | CTA button reads "Continue to Your Estate", routes to `/estate-dashboard`. |

---

## Section B: Estate Dashboard — Mode A (Category Selection)

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| B1 | Mode A shown when no assets | Navigate to Estate Dashboard with no assets anywhere. | Mode A view: title "Let's map out what you own", 10 category cards with checkboxes, no hero section. |
| B2 | All 10 categories shown | Scroll through Mode A. | All 10 canonical categories displayed in order: Property, Bank Accounts, Pensions, Investments, Life Insurance, Private Company Shares, Assets Held Through Business, Important Items, Cryptocurrency, Agricultural Assets. |
| B3 | Select a category | Tap the Property card. | Checkbox fills green with a check. Card border changes to selected style. |
| B4 | Deselect a category | Tap the same Property card again. | Checkbox empties. Card returns to unselected style. |
| B5 | Multiple selections | Select Property, Bank Accounts, and Pensions. | All three show green checkboxes. |
| B6 | "Let's get started" hidden | No categories selected. | Footer button is not visible. |
| B7 | "Let's get started" visible | Select at least one category. | Footer shows "Let's get started" button. |
| B8 | "Let's get started" press | Select Property, tap "Let's get started". | Routes to the first selected category's intro screen (Property Intro). |
| B9 | Category icons | Each category card has a descriptive icon. | Property = home, Bank Accounts = piggy-bank, Pensions = shield, etc. |
| B10 | Category descriptions | Each card has a description subline. | E.g. Property = "Houses, flats, land, and other real estate". |
| B11 | Header | Mode A header. | Shows back button, treasure-chest icon in circle, "Your Estate" title. |
| B12 | Morphic background | Visual check. | Subtle background blobs visible behind content. |

---

## Section C: Estate Dashboard — Mode B (Balance Sheet)

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| C1 | Mode B triggered | Select Property, enter Property flow, add one property, save, return. | Estate Dashboard automatically shows Mode B with hero net wealth and category cards. |
| C2 | Hero net value | Add a property worth £500,000 with £200,000 mortgage. | Hero shows "£300,000" as Net Estate Value. |
| C3 | "What You Own" breakdown | Same as C2. | "What You Own" row shows "£500,000". |
| C4 | "In Trust" row — hidden | No trust assets. | "In Trust" row is not displayed. |
| C5 | "In Trust" row — shown | Add an asset with `heldInTrust = 'yes'`. | "In Trust" row appears with that asset's value. |
| C6 | IHT pending | Not all categories complete. | IHT row shows clock icon + "IHT: Pending asset entry". |
| C7 | IHT ready | All selected categories marked complete. | IHT row shows calculator icon + "IHT estimate available". |
| C8 | Category card — no assets | Bank Accounts selected but empty. | Card shows amber "Not started" pill. Close icon (×) visible at top-right. |
| C9 | Category card — has assets, not complete | Property has 2 assets, not marked complete. | Card shows value subline (e.g. "2 assets · £300k"). No close icon. |
| C10 | Category card — complete | Property marked "That's everything". | Card shows green "Complete" pill and green accent bar. No close icon. |
| C11 | "YOUR ASSETS" section header | Mode B layout. | Divider line with "YOUR ASSETS" label between hero and category cards. |
| C12 | Card canonical ordering | Select Pensions, Property, and Bank Accounts in that order. | Cards display as: Property, Bank Accounts, Pensions (canonical order). |
| C13 | Card tap — has assets | Tap a category card that has assets. | Routes to that category's summary screen (e.g. `/bequeathal/property/summary`). |
| C14 | Card tap — no assets | Tap a category card with zero assets. | Routes to that category's intro screen (e.g. `/bequeathal/bank-accounts/intro`). |
| C15 | Progress sentence — none complete | All selected categories have 0 complete. | "Your estate is taking shape." |
| C16 | Progress sentence — all complete | All selected categories marked complete. | "Your whole estate, mapped out." |
| C17 | Progress sentence icon | Visible next to sentence. | Flag-checkered icon. |

---

## Section D: Category Deselection

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| D1 | Deselect empty category | Bank Accounts has 0 assets. Tap the × icon on its card. | Card disappears from Mode B. Category removed from `categoryStatus`. |
| D2 | No deselect on card with assets | Property has 1+ assets. Look at its card. | No × icon visible. Cannot deselect. |
| D3 | Deselect guard | Programmatically call `deselectCategory('property')` when it has assets. | Nothing happens — guard prevents deselection. |

---

## Section E: "Add Something Else" Bottom Sheet

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| E1 | Open tray | In Mode B, tap "Add something else". | Bottom sheet slides up showing unselected categories. |
| E2 | Tray shows correct categories | Property and Bank Accounts are already selected. | Tray shows 8 remaining categories (everything except Property and Bank Accounts). |
| E3 | Select from tray | Tap Pensions in the tray. | Pensions added to `categoryStatus`. Bottom sheet closes. Pensions card appears in Mode B. |
| E4 | All categories selected | All 10 categories are already selected. Tap "Add something else". | Tray shows "All categories are already selected." message. |
| E5 | Tray swipe to dismiss | Open tray, swipe down. | Bottom sheet dismisses cleanly. |
| E6 | Tray backdrop | Open tray, tap the backdrop area. | Bottom sheet dismisses. |
| E7 | Tray layout | Open tray. | Each item shows icon circle, label, description, and green + icon on right. Title "Add a category" at top. |

---

## Section F: "All Assets Added" Button

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| F1 | All complete | All selected categories marked complete. Tap "All assets added". | Routes directly to Will Dashboard. |
| F2 | Zero-asset categories exist | Bank Accounts and Pensions selected but have 0 assets and are not complete. Tap "All assets added". | Alert popup: "Bank Accounts and Pensions have no assets yet. Mark them complete anyway, or go back and add some?" with "Go back" and "Mark complete anyway" buttons. |
| F3 | Mark complete anyway | On popup from F2, tap "Mark complete anyway". | All categories marked complete. Routes to Will Dashboard. |
| F4 | Go back from popup | On popup from F2, tap "Go back". | Popup dismisses. User stays on Estate Dashboard. |
| F5 | Has assets but not marked | Categories have assets but none marked complete. Tap "All assets added". | Alert: "Shall we mark all asset categories as complete?" with "Not yet" and "Yes, that's everything" buttons. |
| F6 | Mixed: some zero-asset, some not marked | One empty category, one with assets but not marked. Tap "All assets added". | Popup prioritises the zero-asset warning (F2 behaviour). |

---

## Section G: Category Summary Screen (Generic)

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| G1 | Summary shows assets | Add 2 properties. Navigate to Property Summary. | Both properties displayed as `AssetCard` components with title, details, and value. |
| G2 | Asset card — title | Property with address "10 Downing Street". | Card title shows "10 Downing Street". |
| G3 | Asset card — detail fields | Property with type "Residential", ownership "Sole owner", mortgage £200k. | Detail rows show: Type: Residential, Ownership: Sole owner, Mortgage: £200,000. |
| G4 | Asset card — value | Property worth £500,000. | Bottom row shows "Value: £500,000". |
| G5 | Asset card — net value | Property worth £500,000 with £200,000 mortgage (netValue = £300,000). | Shows "Net: £300,000" below the main value. |
| G6 | Total section | 2 properties worth £500k and £300k. | Total section shows "Total: £800,000". |
| G7 | Net total shown when different | Properties have mortgages making net different from gross. | Net total line also visible. |
| G8 | Edit asset | Tap pencil icon on an asset card. | Navigates to entry form with that asset's ID as query param (e.g. `/bequeathal/property/entry?id=abc`). |
| G9 | Delete asset — confirm | Tap trash icon on an asset card. | Confirmation alert: "Are you sure you want to remove this asset?" with Cancel and Delete buttons. |
| G10 | Delete asset — execute | Confirm deletion. | Asset removed from list. Total recalculates. If category was complete, `completedAt` resets to null. |
| G11 | Delete last asset — empty state | Delete the only asset in a category. | Shows empty state: large icon, "No assets yet", description text, "Add [Category]" button. |
| G12 | Add another | Tap "Add another" button on summary. | Routes to entry form for that category (no ID param = new asset). |
| G13 | "That's everything" | Tap "That's everything" button. | Category marked complete. Button replaced by green checkmark + "That's everything" text + "Actually, there's more" link. |
| G14 | "Actually, there's more" | After marking complete, tap "Actually, there's more". | Category marked incomplete (`completedAt` reset to null). Completion toggle reverts to button state. |
| G15 | Back from summary | Tap back button on summary. | Routes to `/estate-dashboard`. |
| G16 | Header | Summary screen header. | Back button, icon circle, category label (e.g. "Property"). |
| G17 | Empty state — "That's everything" | On empty summary, tap "That's everything". | Category marked complete (valid — user confirms they own nothing in this category). |

---

## Section H: Category Summary — All 10 Categories

Each thin route file renders `CategorySummaryScreen` with the correct `categoryId`.

| # | Category | Route File | categoryId |
|---|----------|-----------|------------|
| H1 | Property | `app/bequeathal/property/summary.tsx` | `property` |
| H2 | Bank Accounts | `app/bequeathal/bank-accounts/summary.tsx` | `bank-accounts` |
| H3 | Investments | `app/bequeathal/investment/summary.tsx` | `investment` |
| H4 | Pensions | `app/bequeathal/pensions/summary.tsx` | `pensions` |
| H5 | Life Insurance | `app/bequeathal/life-insurance/summary.tsx` | `life-insurance` |
| H6 | Private Company Shares | `app/bequeathal/private-company-shares/summary.tsx` | `private-company-shares` |
| H7 | Assets Held Through Business | `app/bequeathal/assets-held-through-business/summary.tsx` | `assets-held-through-business` |
| H8 | Important Items | `app/bequeathal/important-items/summary.tsx` | `important-items` |
| H9 | Cryptocurrency | `app/bequeathal/crypto-currency/summary.tsx` | `crypto-currency` |
| H10 | Agricultural Assets | `app/bequeathal/agricultural-assets/summary.tsx` | `agricultural-assets` |

**For each:** Verify the screen renders with the correct title, icon, and category-specific assets. Verify back button goes to Estate Dashboard.

---

## Section I: AssetCard Display Fields — Per-Type Verification

Each asset type should show the correct detail fields via `getAssetDisplayFields()`.

| # | Asset Type | Expected Fields |
|---|-----------|----------------|
| I1 | Property | Type (Residential/Commercial/etc.), Ownership (Sole/Joint/etc.), Mortgage (if present), Location (city) |
| I2 | Bank Accounts | Account type, Ownership (Personal/Joint) |
| I3 | Investments | Type (Stocks/Bonds/etc.), Provider |
| I4 | Pensions | Type, Employer (if linked) |
| I5 | Life Insurance | Policy type, Policy number, Sum insured |
| I6 | Private Company Shares | Ownership %, Share class |
| I7 | Assets Held Through Business | Asset type, Ownership % |
| I8 | Agricultural Assets | Type (farmland/woodland/etc.), Size, Ownership structure |
| I9 | Cryptocurrency | Platform, Quantity |
| I10 | Important Items | Category, Details |

---

## Section J: Entry Form Save → Summary Navigation

After saving an asset, the entry form should route to that category's summary screen.

| # | Entry Form | Expected Navigation |
|---|-----------|---------------------|
| J1 | Property entry | → `/bequeathal/property/summary` |
| J2 | Bank Accounts entry | → `/bequeathal/bank-accounts/summary` |
| J3 | Investment entry | → `/bequeathal/investment/summary` |
| J4 | Pensions entry | → `/bequeathal/pensions/summary` |
| J5 | Life Insurance entry | → `/bequeathal/life-insurance/summary` |
| J6 | Private Company Shares entry | → `/bequeathal/private-company-shares/summary` |
| J7 | Assets Held Through Business entry | → `/bequeathal/assets-held-through-business/summary` |
| J8 | Important Items entry | → `/bequeathal/important-items/summary` |
| J9 | Cryptocurrency entry | → `/bequeathal/crypto-currency/summary` |
| J10 | Agricultural Assets entry | → `/bequeathal/agricultural-assets/summary` |

---

## Section K: Intro Screen Skip → Estate Dashboard

When a user skips an intro screen, they should return to Estate Dashboard (not proceed to the next category in a pipeline).

| # | Intro Screen | Expected Navigation |
|---|-------------|---------------------|
| K1 | Property intro — skip | → `/estate-dashboard` |
| K2 | Bank Accounts intro — skip | → `/estate-dashboard` |
| K3 | Investment intro — skip | → `/estate-dashboard` |
| K4 | Pensions intro — skip | → `/estate-dashboard` |
| K5 | Life Insurance intro — skip | → `/estate-dashboard` |
| K6 | Private Company Shares intro — skip | → `/estate-dashboard` |
| K7 | Assets Held Through Business intro — skip | → `/estate-dashboard` |
| K8 | Important Items intro — skip | → `/estate-dashboard` |
| K9 | Cryptocurrency intro — skip | → `/estate-dashboard` |
| K10 | Agricultural Assets intro — skip | → `/estate-dashboard` |

---

## Section L: Back Button Hierarchy

The complete back-button chain for the estate section.

| # | Current Screen | Back Button Target |
|---|---------------|-------------------|
| L1 | Estate Dashboard | Will Dashboard |
| L2 | Category Intro (any) | Estate Dashboard |
| L3 | Category Entry (from intro) | Intro screen (via `router.back()`) |
| L4 | Category Entry (from summary "Add another") | Summary screen (via `router.back()`) |
| L5 | Category Entry (from summary "Edit") | Summary screen (via `router.back()`) |
| L6 | Category Summary | Estate Dashboard |

---

## Section M: Auto-Invalidation

When any asset CRUD operation occurs in a category that was marked complete, the completion resets.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| M1 | Add asset invalidates | Mark Property complete. Add a new property. | Property's `completedAt` reset to `null`. Green pill disappears on Estate Dashboard. |
| M2 | Update asset invalidates | Mark Bank Accounts complete. Edit a bank account. | Bank Accounts' `completedAt` reset to `null`. |
| M3 | Remove asset invalidates | Mark Investment complete. Delete an investment. | Investment's `completedAt` reset to `null`. |
| M4 | No invalidation on unaffected category | Mark Property complete. Add a bank account. | Property's `completedAt` is unchanged. Only Bank Accounts is invalidated (if it was complete). |
| M5 | Add to category not in `categoryStatus` | Add an asset to a category that was never selected. | The `categoryStatus` for that category does NOT gain an entry (no auto-select). The asset is stored in the data array but the category isn't in `categoryStatus`. |

---

## Section N: Data Model — `categoryStatus`

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| N1 | Initial state | Fresh app, no categories selected. | `bequeathalData.categoryStatus` is `{}`. |
| N2 | Select category | Call `selectCategory('property')`. | `categoryStatus` becomes `{ property: { completedAt: null } }`. |
| N3 | Deselect category (no assets) | Category has 0 assets. Call `deselectCategory('property')`. | `categoryStatus` no longer has `property` key. |
| N4 | Deselect guard (has assets) | Category has 1+ assets. Call `deselectCategory('property')`. | Nothing happens. `property` key remains. |
| N5 | Mark complete | Call `markCategoryComplete('property')`. | `categoryStatus.property.completedAt` is an ISO date string. |
| N6 | Mark incomplete | Call `markCategoryIncomplete('property')`. | `categoryStatus.property.completedAt` is `null`. |
| N7 | Mark all complete | 3 categories selected. Call `markAllCategoriesComplete()`. | All 3 have `completedAt` set to the same ISO date string. |
| N8 | `getSelectedCategories` | 3 categories in `categoryStatus`. | Returns array of 3 category ID strings. |
| N9 | `isCategorySelected` | Property is in `categoryStatus`. | `isCategorySelected('property')` returns `true`. |
| N10 | `isCategoryComplete` | Property has `completedAt` set. | `isCategoryComplete('property')` returns `true`. |
| N11 | `areAllCategoriesComplete` — true | All categories have `completedAt` set. | Returns `true`. |
| N12 | `areAllCategoriesComplete` — false | One category has `completedAt: null`. | Returns `false`. |
| N13 | `areAllCategoriesComplete` — empty | No categories selected. | Returns `false`. |
| N14 | `getAssetCountByType` | 2 properties in data. | `getAssetCountByType('property')` returns `2`. |
| N15 | `getTotalAssetCount` | 3 categories with 2, 1, 0 assets. | Returns `3`. |
| N16 | `getBequeathalData` | Call it. | Returns the full `BequeathalData` object including `categoryStatus`. |
| N17 | Migration — legacy data | App has old `selectedCategories: Set(['property', 'pensions'])`. | On load, migrates to `categoryStatus: { property: { completedAt: null }, pensions: { completedAt: null } }`. Console logs migration message. |

---

## Section O: `willProgress.ts` — Estate Status Derivation

| # | Test | Input State | Expected Result |
|---|------|-------------|-----------------|
| O1 | No categories | `categoryStatus: {}` | `deriveYourEstateStatus()` → `'Not started'` |
| O2 | Categories, none complete | `categoryStatus: { property: { completedAt: null } }` | → `'In progress'` |
| O3 | Some complete | `{ property: { completedAt: '2025-01-01' }, banks: { completedAt: null } }` | → `'In progress'` |
| O4 | All complete | `{ property: { completedAt: '2025-01-01' }, banks: { completedAt: '2025-01-01' } }` | → `'Complete'` |
| O5 | Net value — basic | Property £500k, no mortgage, no trust. | `getEstateNetValue()` → `500000` |
| O6 | Net value — mortgage deduction | Property £500k, mortgage £200k. | → `300000` |
| O7 | Net value — excludes trust | Property £500k (not trust), Investment £100k (heldInTrust='yes'). | → `500000` (trust excluded) |
| O8 | Net value — out-of-scope categories | Debts-credit asset exists but is not in `categoryStatus`. | Not included in any calculation. |
| O9 | Gross value | Property £500k, Investment £100k (not trust). | `getEstateGrossValue()` → `600000` |
| O10 | Trust value | Investment £100k (heldInTrust='yes'). | `getEstateTrustValue()` → `100000` |
| O11 | `formatShortCurrency` | 550000 | `"550k"` |
| O12 | `formatShortCurrency` | 1200000 | `"1.2m"` |
| O13 | `formatShortCurrency` | 500 | `"500"` |
| O14 | `getEstateSubline` — not started | No categories selected. | `"Assets, gifts, and who gets what · 8 mins"` |
| O15 | `getEstateSubline` — selected, no assets | Categories selected, 0 assets. | `"Categories selected · no assets yet"` |
| O16 | `getEstateSubline` — in progress with assets | 3 assets, £200k net. | `"3 assets added · £200k net"` |
| O17 | `getEstateSubline` — complete | 2 categories, £500k net. | `"2 categories · £500k net estate"` |
| O18 | `isIHTReady` — false | Not all categories complete. | `false` |
| O19 | `isIHTReady` — true | All categories complete. | `true` |

---

## Section P: `categoryNavigation.ts` — Routing Helpers

| # | Test | Input | Expected Result |
|---|------|-------|-----------------|
| P1 | Canonical order | `sortByCanonicalOrder(['pensions', 'property', 'crypto-currency'])` | `['property', 'pensions', 'crypto-currency']` |
| P2 | Unknown category sorts to end | `sortByCanonicalOrder(['unknown', 'property'])` | `['property', 'unknown']` |
| P3 | `getCategoryRoute` — has assets | `getCategoryRoute('property', 2)` | `'/bequeathal/property/summary'` |
| P4 | `getCategoryRoute` — no assets | `getCategoryRoute('property', 0)` | `'/bequeathal/property/intro'` |
| P5 | `getCategoryIntroRoute` | `getCategoryIntroRoute('bank-accounts')` | `'/bequeathal/bank-accounts/intro'` |
| P6 | `getCategorySummaryRoute` | `getCategorySummaryRoute('bank-accounts')` | `'/bequeathal/bank-accounts/summary'` |
| P7 | `getCategoryEntryRoute` | `getCategoryEntryRoute('bank-accounts')` | `'/bequeathal/bank-accounts/entry'` |
| P8 | Unknown category fallback | `getCategoryRoute('nonexistent', 0)` | `'/estate-dashboard'` |
| P9 | `CATEGORY_META` count | Check `CATEGORY_META.length`. | `10` |
| P10 | `getCategoryLabel` | `getCategoryLabel('bank-accounts')` | `'Bank Accounts'` |
| P11 | `getCategoryIcon` | `getCategoryIcon('property')` | `'home'` |

---

## Section Q: End-to-End Flows

Complete user journeys covering the full lifecycle.

| # | Flow | Steps | Expected Result |
|---|------|-------|-----------------|
| Q1 | **Happy path — single category** | Will Dashboard → Your Estate → Mode A → select Property → "Let's get started" → Property Intro → add property → save → Property Summary → "That's everything" → back → Estate Dashboard (Mode B, Property green) → "All assets added" → Will Dashboard | Full flow works, "Your Estate" shows as complete on Will Dashboard. |
| Q2 | **Multiple categories** | Select Property + Bank Accounts + Pensions → "Let's get started" → Property Intro → add property → save → Property Summary → back → Estate Dashboard → tap Bank Accounts → Intro → add account → save → Bank Account Summary → back → Estate Dashboard → tap Pensions (no assets) → Intro → skip → Estate Dashboard | All three categories visible. Property and Bank Accounts have assets. Pensions shows "Not started". Values reflect correctly. |
| Q3 | **Edit breaks completion** | Complete Property → mark complete → return to Estate Dashboard (green pill) → tap Property → edit property → save → Property Summary (completion reset) → back → Estate Dashboard | Property no longer shows green pill. Must re-mark "That's everything". |
| Q4 | **Delete all assets** | Add 2 properties → delete both from summary → | Empty state shown: "No assets yet" + "Add Property" + "That's everything". Category still selected on Estate Dashboard but shows "Not started" pill. |
| Q5 | **Add something else mid-flow** | In Mode B with Property selected → tap "Add something else" → select Pensions from tray → tray closes → Pensions card appears → tap Pensions → Intro → add pension → save → Pensions Summary → back → Estate Dashboard | Pensions card now shows 1 asset with value. Hero net value updated. |
| Q6 | **Mark empty category complete** | Select Bank Accounts but add no assets → navigate to summary → tap "That's everything" → back → Estate Dashboard | Bank Accounts shows green "Complete" pill. This is valid — user confirms they have no bank accounts to declare. |
| Q7 | **Re-entry after closing app** | Select categories, add assets, close app, reopen. | All data persisted. Estate Dashboard shows correct Mode B with real values. |

---

## Section R: WillProgressState Call Sites

`WillProgressState` now includes `bequeathalData`. All call sites must pass it.

| # | File | Verified |
|---|------|----------|
| R1 | `app/will-dashboard.tsx` | Must include `bequeathalData: bequeathalActions.getBequeathalData()` |
| R2 | `app/estate-dashboard.tsx` | Must include `bequeathalData` |
| R3 | `app/people/summary.tsx` | Must include `bequeathalData: bequeathalActions.getBequeathalData()` |
| R4 | `app/bequeathal/estate-remainder-split.tsx` | Must include `bequeathalData: bequeathalActions.getBequeathalData()` |
| R5 | `app/guardianship/wishes.tsx` | Must include `bequeathalData: bequeathalActions.getBequeathalData()` |

---

## Section S: Legacy Code Compatibility

| # | Test | Expected Result |
|---|------|-----------------|
| S1 | Legacy `categories.tsx` accessible | Navigate to `/bequeathal/categories` via dev dashboard. | Screen renders without crash. Selections sync via `selectCategory()` calls. |
| S2 | Legacy `categories.tsx` continue | Select categories on legacy screen, tap Continue. | Routes to `/estate-dashboard` (not old pipeline). |
| S3 | `bequeathal/intro.tsx` next button | On generic bequeathal intro, tap Next. | Routes to `/estate-dashboard`. |
| S4 | No remaining `setSelectedCategories` calls | Search codebase outside `categories.tsx`. | No references found. |
| S5 | No remaining `toggleCategory` calls | Search codebase outside `categories.tsx`. | No references found. |
| S6 | No remaining `deleteAsset` calls | Search codebase. | No references in app code (only in comment in types). |

---

## Section T: Visual & UX Checks (Phase 1 Carried Forward)

| # | Test | Expected Result |
|---|------|-----------------|
| T1 | iPhone 14/15 — single screen | Mode A fits on screen without scrolling (or minimal scroll). Mode B scrollable if many categories. |
| T2 | Smaller devices | Content scrolls properly, no clipping. |
| T3 | Header consistency | Estate Dashboard, Category Summary screens use the same header pattern as People Summary and Will Dashboard. |
| T4 | Design tokens | All colours, spacing, typography, border radius use design tokens (not hardcoded values). |
| T5 | Morphic blobs | Background blobs visible on Estate Dashboard. |
| T6 | Green handle on bottom sheet | "Add something else" tray has green handle indicator. |
| T7 | Category card shadow | Cards have subtle shadow matching app style. |
| T8 | Complete pill — green | Green pill with white text on complete categories. |
| T9 | Not started pill — amber | Amber pill on categories with no assets. |
| T10 | Hero card styling | Cream background, large bold net value, breakdown rows, IHT line at bottom. |

---

## Test Coverage Summary

| Section | Count | Focus |
|---------|-------|-------|
| A: Will Dashboard → Estate | 13 | Routing, sublines, pills |
| B: Mode A | 12 | Category selection UI |
| C: Mode B | 17 | Balance sheet, hero values, cards |
| D: Deselection | 3 | Close icon, guards |
| E: Bottom sheet | 7 | "Add something else" tray |
| F: "All assets added" | 6 | Completion popup logic |
| G: Category summary | 17 | Generic summary screen |
| H: All 10 summaries | 10 | Route file verification |
| I: Asset display fields | 10 | Per-type field rendering |
| J: Entry → summary | 10 | Save navigation |
| K: Intro → skip | 10 | Skip navigation |
| L: Back buttons | 6 | Full back hierarchy |
| M: Auto-invalidation | 5 | CRUD resets completion |
| N: Data model | 17 | categoryStatus API |
| O: willProgress.ts | 19 | Status derivation, helpers |
| P: categoryNavigation.ts | 11 | Routing, ordering |
| Q: End-to-end flows | 7 | Full user journeys |
| R: WillProgressState sites | 5 | Call site verification |
| S: Legacy compatibility | 6 | Old code doesn't crash |
| T: Visual/UX | 10 | Design consistency |
| **Total** | **201** | |
