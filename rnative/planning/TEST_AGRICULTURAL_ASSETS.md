# Agricultural Assets — Test Plan

**Entry form:** `app/bequeathal/agricultural-assets/entry.tsx`
**Intro screen:** `app/bequeathal/agricultural-assets/intro.tsx`
**Summary screen:** `app/bequeathal/agricultural-assets/summary.tsx` (generic `CategorySummaryScreen`)

---

## Precursor: Purge data before testing

1. Open developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Confirm estate dashboard shows no assets

---

# Part 1: Manual Tests

## A. Intro Screen

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| A-1 | Intro screen renders | Navigate to Agricultural Assets from estate dashboard. | Header shows "Agricultural Assets" with sprout icon. InformationCard and video present. |  |
| A-2 | Let's Go navigates | Tap "Let's Go". | Navigates to entry form. |  |
| A-3 | Skip navigates | Tap "Skip this section". | Returns to previous screen. |  |
| A-4 | Back button works | Tap back arrow in header. | Returns to previous screen. |  |
| A-5 | Information content correct | Scroll through InformationCard. | Mentions APR (100% IHT relief), BPR, ownership duration, specialist valuations. |  |

---

## B. Ownership Routing

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| B-1 | Ownership required | Leave ownership blank. Attempt save. | Save blocked. |  |
| B-2 | Personal ownership | Select "I own it personally". | Rest of form appears. `aprOwnershipStructure: 'personal'` saved. |  |
| B-3 | Partnership ownership | Select "Owned through a partnership". | Rest of form appears. `aprOwnershipStructure: 'partnership'` saved. |  |
| B-4 | Trust ownership | Select "Held in trust". | Rest of form appears. Trust Type field appears in APR section. |  |
| B-5 | Company ownership - blocked | Select "Owned by a limited company". | Warning card appears. Rest of form hidden. Cannot save. |  |
| B-6 | Not sure ownership | Select "Not sure". | Rest of form appears. `aprOwnershipStructure: 'not-sure'` saved. |  |

---

## C. Add Flow - Basic Asset Types

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| C-1 | Agricultural land | Ownership = Personal. Type = "Agricultural Land". Description = "North field". Value = 500000. Debts = No. Save. | Asset saved. `assetType: 'agricultural-land'`. APR section shown. |  |
| C-2 | Farm buildings | Type = "Farm Buildings". Description = "Cow barn". Save. | Asset saved. `assetType: 'farm-buildings'`. APR section shown. |  |
| C-3 | Farmhouse | Type = "Farmhouse". Description = "Main farmhouse". Save. | Asset saved. `assetType: 'farmhouse'`. APR section shown. |  |
| C-4 | Agricultural equipment | Type = "Agricultural Equipment". Description = "Tractor". Save. | Asset saved. `assetType: 'agricultural-equipment'`. BPR section shown (not APR). |  |
| C-5 | Standing crops | Type = "Standing Crops". Description = "Winter wheat". Save. | Asset saved. `assetType: 'standing-crops'`. No APR or BPR section. |  |
| C-6 | Fish farming | Type = "Fish Farming Facilities". Description = "Trout farm". Save. | Asset saved. `assetType: 'fish-farming'`. APR section shown. |  |
| C-7 | Header/button text in add mode | Open entry with no `?id` param. | Header is "Add Agricultural Asset". Button is "Add this asset". |  |

---

## D. Conditional Asset-Type Fields

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| D-1 | Farm worker cottage - occupied | Type = "Farm Worker Cottage". Occupied = "Yes". | APR section appears. `farmWorkerOccupied: 'yes'` saved. |  |
| D-2 | Farm worker cottage - not occupied | Occupied = "No". | APR section hidden (doesn't qualify). `farmWorkerOccupied: 'no'` saved. |  |
| D-3 | Woodland - agricultural purpose | Type = "Woodland". Purpose = "Agricultural use". | APR section appears. `woodlandPurpose: 'shelter'` saved. |  |
| D-4 | Woodland - commercial | Purpose = "Commercial timber business". | APR section hidden. `woodlandPurpose: 'commercial'` saved. |  |
| D-5 | Stud farm - breeding | Type = "Stud Farm". Activity = "Breeding horses/ponies". | APR section appears. `studFarmActivity: 'breeding'` saved. |  |
| D-6 | Stud farm - livery | Activity = "Livery, riding school, or training". | BPR section appears instead of APR. `studFarmActivity: 'livery'` saved. |  |
| D-7 | Other type - detail required | Type = "Other". | "Describe asset type" input appears. Required for save. |  |
| D-8 | Conditional fields required | Select farm worker cottage. Don't answer occupied question. Attempt save. | Save blocked. |  |

---

## E. Debts Section

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| E-1 | No debts | Select "No debts or encumbrances". | No debt fields shown. `hasDebtsEncumbrances: 'no'` saved. |  |
| E-2 | Has debts | Select "Yes - Has debts/encumbrances". | Debt amount + description fields appear. |  |
| E-3 | Debt reduces net value | Enter value = 500000. Debt = 100000. Save. | `netValue` = 400000 (value minus debt). |  |
| E-4 | Debts required | Leave debt selection blank. Attempt save. | Save blocked. |  |

---

## F. APR Section (Agricultural Property Relief)

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| F-1 | APR shown for qualifying types | Select agricultural land (personal ownership). | APR section appears with ownership duration dropdown. |  |
| F-2 | Ownership duration options | Open duration dropdown. | Shows 1 year through Over 7 years + Not sure. |  |
| F-3 | Duration required | Leave duration blank when APR visible. Attempt save. | Save blocked. |  |
| F-4 | Trust type field | Select "Held in trust" ownership. | Trust Type input appears in APR section. |  |
| F-5 | APR hidden for non-qualifying | Select "Standing Crops" or "Agricultural Equipment". | APR section not shown. |  |

---

## G. BPR Section (Business Property Relief)

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| G-1 | BPR shown for equipment | Select "Agricultural Equipment". | BPR section appears with trading + duration questions. |  |
| G-2 | BPR shown for stud farm livery | Select "Stud Farm" + "Livery". | BPR section appears. |  |
| G-3 | Active trading required | Leave trading question blank when BPR visible. Attempt save. | Save blocked. |  |
| G-4 | Ownership duration required | Leave duration blank when BPR visible. Attempt save. | Save blocked. |  |
| G-5 | BPR hidden for land/buildings | Select "Agricultural Land". | BPR section not shown (APR shown instead). |  |

---

## H. Unsure of Value

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| H-1 | Checkbox disables value | Tick "Not sure". | Currency input disabled/dimmed. |  |
| H-2 | Untick re-enables | Tick then untick. Type 250000. | Value accepted and saved. |  |
| H-3 | Blank value handling | Leave value blank (don't type). Save. | Check whether stored as 0 or `estimatedValueUnknown: true`. |  |

---

## I. Edit Flow

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| I-1 | Edit loads existing data | From summary, open existing asset for edit. | All fields pre-filled including ownership, type, debts, APR/BPR fields. Header is "Edit Agricultural Asset". |  |
| I-2 | Edit saves changes | Change description and value. Save. | Updated values in summary. |  |
| I-3 | Edit round-trip with debts | Save with debts. Reopen for edit. | Debt = Yes pre-selected. Amount and description pre-filled. |  |
| I-4 | Edit round-trip with APR fields | Save with APR duration. Reopen for edit. | Duration pre-selected. |  |
| I-5 | Edit round-trip with BPR fields | Save with BPR fields. Reopen for edit. | Trading and duration pre-selected. |  |
| I-6 | Net wealth toast on edit | Edit value and save. | Toast reflects delta. |  |

---

## J. Delete Flow

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| J-1 | Delete from summary | From summary, tap delete. | Confirmation appears. |  |
| J-2 | Delete confirmed | Confirm deletion. | Asset removed. Total recalculates. |  |
| J-3 | Delete cancelled | Cancel delete dialog. | Asset unchanged. |  |

---

## K. Validation

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| K-1 | Ownership required | Leave ownership blank. | Save blocked. |  |
| K-2 | Asset type required | Leave type blank. | Save blocked. |  |
| K-3 | Description required | Leave description blank. | Save blocked. |  |
| K-4 | Debts required | Leave debt question blank. | Save blocked. |  |
| K-5 | Validation attention trigger | Tap disabled save button when form invalid. | Attention label shows count of invalid fields. |  |

---

## L. Summary Screen

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| L-1 | Summary shows all assets | Add 3 agricultural assets, open summary. | All show with descriptions, types, values. |  |
| L-2 | Total value correct | Add known values. | Total equals expected sum. |  |
| L-3 | Empty state | Remove all, open summary. | Empty state with add button. |  |
| L-4 | Edit from summary | Tap existing card. | Opens edit form with pre-filled data. |  |
| L-5 | Net value reflects debts | Add asset with debts. Check summary. | Card shows net value (after debt deduction). |  |

---

## M. Data Integrity

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| M-1 | Stored type | Save, inspect data. | `type === 'agricultural-assets'`. |  |
| M-2 | Title generation | Save and check stored title. | Title is the asset description (or formatted type label fallback). |  |
| M-3 | Display subline | View in summary card. | Subline shows formatted asset type (e.g. "Agricultural land"). |  |
| M-4 | Net value calculation | Save with value 500000 and debt 100000. | `estimatedValue: 500000`, `netValue: 400000`. |  |

---

## Summary

| Section | Tests | Notes |
|---------|-------|-------|
| A - Intro screen | 5 | Navigation + APR/BPR educational content |
| B - Ownership routing | 6 | 5 options, company blocks form |
| C - Add flow | 7 | All basic asset types |
| D - Conditional fields | 8 | Farm worker, woodland, stud farm, other |
| E - Debts | 4 | Debt amount reduces net value |
| F - APR section | 5 | Duration, trust type, qualification |
| G - BPR section | 5 | Trading, duration, qualification |
| H - Unsure of value | 3 | Disabled field + storage |
| I - Edit flow | 6 | Round-trips for all sections |
| J - Delete flow | 3 | Confirmation + recalculation |
| K - Validation | 5 | Required fields + attention |
| L - Summary | 5 | Display + net value with debts |
| M - Data integrity | 4 | Storage + net value calculation |
| **Total** | **66** | |

---

# Known Gaps

### 1. No error props wired to form fields

`useFormValidation` tracks 4 fields (ownership, type, description, debts) but `error` props are not passed to form components. Red border highlighting will not appear.

### 2. No beneficiaries

This asset type does not support beneficiary assignment.

### 3. Blank value handling

May save blank value as 0 rather than `estimatedValueUnknown: true`. Test H-3 will verify.

### 4. Display title uses `location` field

`getAssetTitle` returns `asset.location` first, but the form doesn't have a location field — it saves `assetDescription` as `title`. The subline uses `assetType`. Verify the display chain works correctly (tests M-2, M-3).
