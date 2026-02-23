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


| #   | Test                        | Steps                                                  | Pass criteria                                                                           | Pass? |
| ----- | ----------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------- |
| A-1 | Intro screen renders        | Navigate to Agricultural Assets from estate dashboard. | Header shows "Agricultural Assets" with sprout icon. InformationCard and video present. | Pass  |
| A-2 | Let's Go navigates          | Tap "Let's Go".                                        | Navigates to entry form.                                                                | Pass  |
| A-3 | Skip navigates              | Tap "Skip this section".                               | Returns to previous screen.                                                             | Pass  |
| A-4 | Back button works           | Tap back arrow in header.                              | Returns to previous screen.                                                             | Pass  |
| A-5 | Information content correct | Scroll through InformationCard.                        | Mentions APR (100% IHT relief), BPR, ownership duration, specialist valuations.         | Pass  |

---

## B. Ownership Routing


| #   | Test                        | Steps                                 | Pass criteria                                                      | Pass?                                                                                         |
| ----- | ----------------------------- | --------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| B-1 | Ownership required          | Leave ownership blank. Attempt save.  | Save blocked.                                                      | Pass                                                                                          |
| B-2 | Personal ownership          | Select "I own it personally".         | Rest of form appears.`aprOwnershipStructure: 'personal'` saved.    | Pass                                                                                          |
| B-3 | Partnership ownership       | Select "Owned through a partnership". | Rest of form appears.`aprOwnershipStructure: 'partnership'` saved. | Pass                                                                                          |
| B-4 | Trust ownership             | Select "Held in trust".               | Rest of form appears. Trust Type field appears in APR section.     | PASS - BUT should this not be a drop down of trust type, tehn role? BUSINESS LOGIC QUESTION   |
| B-5 | Company ownership - blocked | Select "Owned by a limited company".  | Warning card appears. Rest of form hidden. Cannot save.            | Pass                                                                                          |
| B-6 | Not sure ownership          | N/A — option removed.                 | "Not sure" no longer appears in ownership options.                  | Resolved |

---

## C. Add Flow - Basic Asset Types


| #   | Test                           | Steps                                                                                                            | Pass criteria                                                                   | Pass? |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------- |
| C-1 | Agricultural land              | Ownership = Personal. Type = "Agricultural Land". Description = "North field". Value = 500000. Debts = No. Save. | Asset saved.`assetType: 'agricultural-land'`. APR section shown.                | Pass  |
| C-2 | Farm buildings                 | Type = "Farm Buildings". Description = "Cow barn". Save.                                                         | Asset saved.`assetType: 'farm-buildings'`. APR section shown.                   | Pass  |
| C-3 | Farmhouse                      | Type = "Farmhouse". Description = "Main farmhouse". Save.                                                        | Asset saved.`assetType: 'farmhouse'`. APR section shown.                        | Pass  |
| C-4 | Agricultural equipment         | Type = "Agricultural Equipment". Description = "Tractor". Save.                                                  | Asset saved.`assetType: 'agricultural-equipment'`. BPR section shown (not APR). | Pass  |
| C-5 | Standing crops                 | Type = "Standing Crops". Description = "Winter wheat". Save.                                                     | Asset saved.`assetType: 'standing-crops'`. No APR or BPR section.               | Pass  |
| C-6 | Fish farming                   | Type = "Fish Farming Facilities". Description = "Trout farm". Save.                                              | Asset saved.`assetType: 'fish-farming'`. APR section shown.                     | Pass  |
| C-7 | Other type                     | Type = "Other". Describe = "Grain dryer". Save.                                                                  | Asset saved.`assetType: 'other'`. BPR section shown (not APR).                  | Pass  |
| C-8 | Header/button text in add mode | Open entry with no`?id` param.                                                                                   | Header is "Add Agricultural Asset". Button is "Add this asset".                 | Pass  |

---

## D. Conditional Asset-Type Fields


| #   | Test                               | Steps                                                                     | Pass criteria                                                                                | Pass? |
| ----- | ------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------- |
| D-1 | Farm worker cottage - occupied     | Type = "Farm Worker Cottage". Occupied = "Yes".                           | APR section appears.`farmWorkerOccupied: 'yes'` saved.                                       | Pass  |
| D-2 | Farm worker cottage - not occupied | Occupied = "No".                                                          | APR section hidden (doesn't qualify).`farmWorkerOccupied: 'no'` saved.                       | Pass  |
| D-3 | Woodland - agricultural purpose    | Type = "Woodland". Purpose = "Agricultural use".                          | APR section appears.`woodlandPurpose: 'shelter'` saved.                                      | Pass  |
| D-4 | Woodland - commercial              | Purpose = "Commercial timber business".                                   | APR section hidden.`woodlandPurpose: 'commercial'` saved.                                    | Pass  |
| D-5 | Stud farm - breeding               | Type = "Stud Farm". Activity = "Breeding horses/ponies".                  | APR section appears.`studFarmActivity: 'breeding'` saved.                                    | Pass  |
| D-6 | Stud farm - livery                 | Activity = "Livery, riding school, or training".                          | BPR section appears instead of APR.`studFarmActivity: 'livery'` saved.                       | Pass  |
| D-7 | Other type - detail required       | Type = "Other".                                                           | "Describe asset type" input appears. Required for save. BPR gateway/section shown (not APR). | Pass  |
| D-8 | Conditional fields required        | Select farm worker cottage. Don't answer occupied question. Attempt save. | Save blocked.                                                                                | Pass  |

---

## E. Debts Section


| #   | Test                   | Steps                                      | Pass criteria                                            | Pass? |
| ----- | ------------------------ | -------------------------------------------- | ---------------------------------------------------------- | ------- |
| E-1 | No debts               | Select "No debts or encumbrances".         | No debt fields shown.`hasDebtsEncumbrances: 'no'` saved. | Pass  |
| E-2 | Has debts              | Select "Yes - Has debts/encumbrances".     | Debt amount + description fields appear.                 | Pass  |
| E-3 | Debt reduces net value | Enter value = 500000. Debt = 100000. Save. | `netValue` = 400000 (value minus debt).                  | Pass  |
| E-4 | Debts required         | Leave debt selection blank. Attempt save.  | Save blocked.                                            | Pass  |

---

## F. APR Section (Agricultural Property Relief)


| #   | Test                           | Steps                                                          | Pass criteria                                         | Pass? |
| ----- | -------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- | ------- |
| F-1 | APR shown for qualifying types | Select agricultural land (personal ownership).                 | APR section appears with ownership duration dropdown. | Pass  |
| F-2 | Ownership duration options     | Open duration dropdown.                                        | Shows 1 year through Over 7 years + Not sure.         | Pass  |
| F-3 | Duration required              | Leave duration blank when APR visible. Attempt save.           | Save blocked.                                         | Pass  |
| F-4 | Trust type field               | Select "Held in trust" ownership.                              | Trust Type input appears in APR section.              | Pass  |
| F-5 | APR hidden for non-qualifying  | Select "Standing Crops", "Agricultural Equipment", or "Other". | APR section not shown.                                | Pass  |

---

## G. BPR Section (Business Property Relief)


| #    | Test                                            | Steps                                                                          | Pass criteria                                                                                                                                              | Pass? |
| ------ | ------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| G-1  | Gateway shown for personal + equipment          | Ownership = Personal. Type = "Agricultural Equipment".                         | Gateway question appears: "Do you use this in your own actively trading farming business?" (Yes/No only).                                                  | Pass  |
| G-2  | Gateway shown for personal + stud farm livery   | Ownership = Personal. Type = "Stud Farm". Activity = "Livery".                 | Same gateway question appears.                                                                                                                             | Pass  |
| G-3  | Gateway "Yes" shows BPR duration only           | Answer gateway "Yes".                                                          | BPR section appears with duration question only (trading question skipped — implied by gateway).                                                          | Pass  |
| G-4  | Gateway "No" hides BPR section                  | Answer gateway "No".                                                           | BPR section does not appear. Form can be saved without BPR answers.                                                                                        | Pass  |
| G-5  | Gateway NOT shown for partnership ownership     | Ownership = Partnership. Type = "Agricultural Equipment".                      | No gateway question. BPR section appears directly with trading + duration questions.                                                                       | Pass  |
| G-6  | Gateway NOT shown for trust ownership           | Ownership = Trust. Type = "Agricultural Equipment".                            | No gateway question. BPR section appears directly with trading + duration questions.                                                                       | Pass  |
| G-7  | Trading question shown for non-personal         | Ownership = Partnership. Type = "Agricultural Equipment".                      | Trading question appears in BPR section. Required for save.                                                                                                | Pass  |
| G-8  | Ownership duration required                     | Gateway = Yes. Leave duration blank. Attempt save.                             | Save blocked.                                                                                                                                              | Pass  |
| G-9  | BPR hidden for land/buildings                   | Select "Agricultural Land".                                                    | BPR section not shown (APR shown instead). No gateway question.                                                                                            | Pass  |
| G-10 | Changing asset type clears gateway              | Answer gateway "Yes", then change asset type to "Standing Crops".              | Gateway and BPR section disappear. Changing back to equipment shows gateway unanswered.                                                                    | Pass  |
| G-11 | Changing ownership from personal clears gateway | Personal + equipment, answer gateway "Yes". Change ownership to "Partnership". | Gateway disappears. BPR section shown directly with trading question.                                                                                      | Pass  |
| G-12 | BPR copy - subtext                              | Answer gateway "Yes" (personal + equipment).                                   | BPR subtext reads: "Certain agricultural assets and farming activities may qualify for Business Property Relief rather than Agricultural Property Relief." | Pass  |
| G-13 | BPR copy - duration question (equipment)        | Personal + equipment, gateway = Yes.                                           | Duration question reads: "How long have you owned this asset?"                                                                                             | Pass  |
| G-14 | BPR copy - duration question (stud farm livery) | Personal + stud farm + livery, gateway = Yes.                                  | Duration question reads: "How long have you owned this business?"                                                                                          | Pass  |
| G-15 | bprActiveTrading auto-set via gateway           | Personal + equipment, answer gateway "Yes". Save. Inspect stored data.         | `bprActiveTrading: 'yes'` saved automatically (not asked separately).                                                                                      | Pass  |
| G-16 | Gateway shown for personal + other              | Ownership = Personal. Type = "Other". Describe = "Grain dryer".                | Gateway question appears. "Yes" shows BPR duration; "No" hides BPR section.                                                                                | Pass  |
| G-17 | BPR copy - duration question (other)            | Personal + other, gateway = Yes.                                               | Duration question reads: "How long have you owned this asset?"                                                                                             | Pass  |

---

## H. Unsure of Value


| #   | Test                    | Steps                                 | Pass criteria                                              | Pass? |
| ----- | ------------------------- | --------------------------------------- | ------------------------------------------------------------ | ------- |
| H-1 | Checkbox disables value | Tick "Not sure".                      | Currency input disabled/dimmed.                            | Pass  |
| H-2 | Untick re-enables       | Tick then untick. Type 250000.        | Value accepted and saved.                                  | Pass  |
| H-3 | Blank value handling    | Leave value blank (don't type). Save. | Check whether stored as 0 or`estimatedValueUnknown: true`. | Pass  |

---

## I. Edit Flow


| #   | Test                            | Steps                                       | Pass criteria                                                                                                | Pass? |
| ----- | --------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------- |
| I-1 | Edit loads existing data        | From summary, open existing asset for edit. | All fields pre-filled including ownership, type, debts, APR/BPR fields. Header is "Edit Agricultural Asset". | Yes   |
| I-2 | Edit saves changes              | Change description and value. Save.         | Updated values in summary.                                                                                   | Yes   |
| I-3 | Edit round-trip with debts      | Save with debts. Reopen for edit.           | Debt = Yes pre-selected. Amount and description pre-filled.                                                  | Yes   |
| I-4 | Edit round-trip with APR fields | Save with APR duration. Reopen for edit.    | Duration pre-selected.                                                                                       | Pass  |
| I-5 | Edit round-trip with BPR fields | Save with BPR fields. Reopen for edit.      | Trading and duration pre-selected.                                                                           | Pass  |
| I-6 | Net wealth toast on edit        | Edit value and save.                        | Toast reflects delta.                                                                                        | Pass  |

---

## J. Delete Flow


| #   | Test                | Steps                     | Pass criteria                      | Pass? |
| ----- | --------------------- | --------------------------- | ------------------------------------ | ------- |
| J-1 | Delete from summary | From summary, tap delete. | Confirmation appears.              | Pass  |
| J-2 | Delete confirmed    | Confirm deletion.         | Asset removed. Total recalculates. | Pass  |
| J-3 | Delete cancelled    | Cancel delete dialog.     | Asset unchanged.                   | Pass  |

---

## K. Validation


| #   | Test                         | Steps                                       | Pass criteria                                  | Pass?                                                                                                                                                                                                                                                |
| ----- | ------------------------------ | --------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| K-1 | Ownership required           | Leave ownership blank.                      | Save blocked.                                  | Pass                                                                                                                                                                                                                                                 |
| K-2 | Asset type required          | Leave type blank.                           | Save blocked.                                  | Pass                                                                                                                                                                                                                                                 |
| K-3 | Description required         | Leave description blank.                    | Save blocked.                                  | Pass                                                                                                                                                                                                                                                 |
| K-4 | Debts required               | Leave debt question blank.                  | Save blocked.                                  | Pass                                                                                                                                                                                                                                                 |
| K-5 | Validation attention trigger | Tap disabled save button when form invalid. | Attention label shows count of invalid fields. | FAIL - While attention label below submit is working and autoscrolling to first invalid field, we have not implemented the attention styling (red border on inputs etc) that we have implemented in other asset categories. This must be replicated. |

---

## L. Summary Screen


| #   | Test                     | Steps                                    | Pass criteria                                | Pass?                                       |
| ----- | -------------------------- | ------------------------------------------ | ---------------------------------------------- | --------------------------------------------- |
| L-1 | Summary shows all assets | Add 3 agricultural assets, open summary. | All show with descriptions, types, values.   | Pass                                        |
| L-2 | Total value correct      | Add known values.                        | Total equals expected sum.                   | Pass                                        |
| L-3 | Empty state              | Remove all, open summary.                | Empty state with add button.                 | Pass                                        |
| L-4 | Edit from summary        | Tap existing card.                       | Opens edit form with pre-filled data.        | Pass                                        |
| L-5 | Net value reflects debts | Add asset with debts. Check summary.     | Card shows net value (after debt deduction). | FAIL - and this i guess will impact totals? |

---

## M. Data Integrity


| #   | Test                  | Steps                                   | Pass criteria                                                      | Pass? |
| ----- | ----------------------- | ----------------------------------------- | -------------------------------------------------------------------- | ------- |
| M-1 | Stored type           | Save, inspect data.                     | `type === 'agricultural-assets'`.                                  | Pass  |
| M-2 | Title generation      | Save and check stored title.            | Title is the asset description (or formatted type label fallback). | Pass  |
| M-3 | Display subline       | View in summary card.                   | Subline shows formatted asset type (e.g. "Agricultural land").     | Pass  |
| M-4 | Net value calculation | Save with value 500000 and debt 100000. | `estimatedValue: 500000`, `netValue: 400000`.                      | Pass  |

---

## Summary


| Section                | Tests  | Notes                                     |
| ------------------------ | -------- | ------------------------------------------- |
| A - Intro screen       | 5      | Navigation + APR/BPR educational content  |
| B - Ownership routing  | 6      | 5 options, company blocks form            |
| C - Add flow           | 8      | All basic asset types                     |
| D - Conditional fields | 8      | Farm worker, woodland, stud farm, other   |
| E - Debts              | 4      | Debt amount reduces net value             |
| F - APR section        | 5      | Duration, trust type, qualification       |
| G - BPR section        | 17     | Gateway question, trading, duration, copy |
| H - Unsure of value    | 3      | Disabled field + storage                  |
| I - Edit flow          | 6      | Round-trips for all sections              |
| J - Delete flow        | 3      | Confirmation + recalculation              |
| K - Validation         | 5      | Required fields + attention               |
| L - Summary            | 5      | Display + net value with debts            |
| M - Data integrity     | 4      | Storage + net value calculation           |
| **Total**              | **79** |                                           |

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
