# Assets Held Through Business — Test Plan

**Entry form:** `app/bequeathal/assets-held-through-business/entry.tsx`
**Intro screen:** `app/bequeathal/assets-held-through-business/intro.tsx`
**Summary screen:** `app/bequeathal/assets-held-through-business/summary.tsx` (generic `CategorySummaryScreen`)

---

## Precursor: Purge data before testing

1. Open developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Create a test business (via Private Company Shares or directly if possible)
4. Confirm estate dashboard shows no assets

---

# Part 1: Manual Tests

## A. Intro Screen


| #   | Test                        | Steps                                                           | Pass criteria                                                                                                                           | Pass? |
| ----- | ----------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| A-1 | Intro screen renders        | Navigate to Assets Held Through Business from estate dashboard. | Header shows "Business Assets" with building icon. InformationCard and video present.                                                   | Pass  |
| A-2 | Let's Go navigates          | Tap "Let's Go".                                                 | Navigates to entry form.                                                                                                                | Pass  |
| A-3 | Skip navigates              | Tap "Skip This Section".                                        | Returns to previous screen.                                                                                                             | Pass  |
| A-4 | Back button works           | Tap back arrow in header.                                       | Returns to previous screen.                                                                                                             | Pass  |
| A-5 | Information content correct | Scroll through InformationCard.                                 | Mentions company property, equipment, vehicles, bank accounts, IP, inventory. Explains these belong to business entity, not personally. | Pass  |

---

## B. Business Selection


| #   | Test                      | Steps                                                             | Pass criteria                                               | Pass?                                                                                                    |
| ----- | --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| B-1 | Existing business appears | Create a business first (via Private Company Shares). Open entry. | Business appears in SearchableSelect dropdown.              | Pass                                                                                                     |
| B-2 | Select existing business  | Select a business from dropdown.                                  | Business name shown. Asset form fields appear below.        | Pass                                                                                                     |
| B-3 | Add new business form     | Tap "Add New Business".                                           | New business name input appears.                            | Pass                                                                                                     |
| B-4 | Create new business       | Enter "Test Trading Ltd". Tap create.                             | Business created. Asset form fields appear below.           | Pass                                                                                                     |
| B-5 | Change business           | Select a business, then tap "Change".                             | Business selector reappears. Can pick a different business. | Pass                                                                                                     |
| B-6 | Business is required      | Don't select a business. Attempt save.                            | Save blocked. Validation attention fires.                   | Fail - cannot save as no submit button present when business unselected - therefore "Failing" by design. |

---

## C. Add Flow - Basic


| #   | Test                           | Steps                                                                                                    | Pass criteria                                               | Pass?                                                   |
| ----- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| C-1 | Add property asset             | Select business. Type = "Property". Description = "Main office". Value = 500000. Save.                   | Asset saved.`assetType: 'property'`.                        | Pass                                                    |
| C-2 | Add equipment asset            | Select business. Type = "Equipment". Description = "CNC Machine". Value = 75000. Save.                   | Asset saved.`assetType: 'equipment'`.                       | Pass                                                    |
| C-3 | Add vehicle asset              | Select business. Type = "Vehicles". Description = "Delivery van". Value = 25000. Save.                   | Asset saved.`assetType: 'vehicles'`.                        | Pass                                                    |
| C-4 | Add bank account asset         | Select business. Type = "Bank Accounts". Description = "Business current account". Value = 150000. Save. | Asset saved.`assetType: 'bank-accounts'`.                   | Pass                                                    |
| C-5 | Add IP asset                   | Select business. Type = "Intellectual Property". Description = "Software license". Value = 200000. Save. | Asset saved.`assetType: 'intellectual-property'`.           | Pass                                                    |
| C-6 | Add with value unsure          | Select business. Type = "Other". Description = "IT systems". Tick "Not sure". Save.                      | `estimatedValueUnknown: true`. No `estimatedValue`.         | Pass                                                    |
| C-7 | Header/button text in add mode | Open entry with no`?id` param.                                                                           | Header is "Add Business Asset". Button is "Add this asset". | Mobile app - why d you keep suggesting tests like this? |

---

## D. Asset Type Dropdown


| #   | Test                            | Steps                           | Pass criteria                                                                                                               | Pass? |
| ----- | --------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| D-1 | All types listed                | Open Asset Type dropdown.       | Shows Property, Equipment, Vehicles, Bank Accounts, Investments, Inventory, Intellectual Property, Other (with separators). | Pass  |
| D-2 | Type is required                | Leave type blank. Attempt save. | Save blocked.                                                                                                               | Pass  |
| D-3 | Description placeholder changes | Select different asset types.   | Placeholder text updates per type (e.g. "e.g., Main office, Warehouse, Shop premises" for Property).                        | Pass  |

---

## E. Asset Description


| #   | Test                 | Steps                                  | Pass criteria                                         | Pass? |
| ----- | ---------------------- | ---------------------------------------- | ------------------------------------------------------- | ------- |
| E-1 | Description required | Leave description blank. Attempt save. | Save blocked.                                         | Pass  |
| E-2 | Description saved    | Enter "Warehouse in Manchester". Save. | `assetDescription: 'Warehouse in Manchester'` stored. | Pass  |

---

## F. Unsure of Value


| #   | Test                    | Steps                                 | Pass criteria                                              | Pass?                                                                |
| ----- | ------------------------- | --------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| F-1 | Checkbox disables value | Tick "Not sure".                      | Currency input disabled/dimmed.                            | Pass                                                                 |
| F-2 | Untick re-enables       | Tick then untick. Type 50000.         | Value accepted and saved.                                  | Pass                                                                 |
| F-3 | Blank value handling    | Leave value blank (don't type). Save. | Check whether stored as 0 or`estimatedValueUnknown: true`. | PASS |

---

## G. Edit Flow


| #   | Test                        | Steps                                         | Pass criteria                                                                                | Pass? |
| ----- | ----------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------- |
| G-1 | Edit loads existing data    | From summary, open existing asset for edit.   | Business pre-selected. Type, description, value pre-filled. Header is "Edit Business Asset". | Pass  |
| G-2 | Edit saves changes          | Change description and value. Save.           | Updated values shown in summary.                                                             | Pass  |
| G-3 | Edit round-trip with unsure | Save with "Not sure" ticked. Reopen for edit. | Unsure checkbox pre-ticked. Value field disabled.                                            | Pass  |
| G-4 | Net wealth toast on edit    | Edit an asset's value and save.               | Toast reflects delta.                                                                        | Pass  |

---

## H. Delete Flow


| #   | Test                | Steps                     | Pass criteria                      | Pass? |
| ----- | --------------------- | --------------------------- | ------------------------------------ | ------- |
| H-1 | Delete from summary | From summary, tap delete. | Confirmation appears.              | Pass  |
| H-2 | Delete confirmed    | Confirm deletion.         | Asset removed. Total recalculates. | Pass  |
| H-3 | Delete cancelled    | Cancel delete dialog.     | Asset unchanged.                   | Pass  |

---

## I. Validation


| #   | Test                         | Steps                                       | Pass criteria                                  | Pass? |
| ----- | ------------------------------ | --------------------------------------------- | ------------------------------------------------ | ------- |
| I-1 | Business required            | Don't select business. Attempt save.        | Save blocked. Attention fires.                 | Pass  |
| I-2 | Asset type required          | Leave type blank. Attempt save.             | Save blocked. Attention fires.                 | Pass  |
| I-3 | Description required         | Leave description blank. Attempt save.      | Save blocked. Attention fires.                 | Pass  |
| I-4 | Validation attention trigger | Tap disabled save button when form invalid. | Attention label shows count of invalid fields. | Pass  |

---

## J. Summary Screen


| #   | Test                     | Steps                                | Pass criteria                                | Pass? |
| ----- | -------------------------- | -------------------------------------- | ---------------------------------------------- | ------- |
| J-1 | Summary shows all assets | Add 3 business assets, open summary. | All show with business names, types, values. | Pass  |
| J-2 | Total value correct      | Add known values.                    | Total equals expected sum.                   | Pass  |
| J-3 | Empty state              | Remove all, open summary.            | Empty state with add button.                 | Pass  |
| J-4 | Edit from summary        | Tap existing card.                   | Opens edit form with pre-filled data.        | Pass  |
| J-5 | Unknown balance in total | Add one known value and one unsure.  | Total shows known sum with`+` suffix.        | Pass  |

---

## K. Data Integrity


| #   | Test              | Steps                        | Pass criteria                                                         | Pass? |
| ----- | ------------------- | ------------------------------ | ----------------------------------------------------------------------- | ------- |
| K-1 | Stored type       | Save, inspect data.          | `type === 'assets-held-through-business'`.                            | Pass  |
| K-2 | Title generation  | Save and check stored title. | Format:`"BusinessName - Description"` (or asset type label fallback). | Pass  |
| K-3 | Display subline   | View in summary card.        | Subline shows formatted asset type (e.g. "Property", "Equipment").    | Pass  |
| K-4 | businessId stored | Save and check data.         | `businessId` references correct business entity.                      | Pass  |

---

## Summary


| Section                 | Tests  | Notes                               |
| ------------------------- | -------- | ------------------------------------- |
| A - Intro screen        | 5      | Navigation + educational content    |
| B - Business selection  | 6      | New vs existing, change business    |
| C - Add flow            | 7      | All asset types + unsure value      |
| D - Asset type dropdown | 3      | 8 types with separators             |
| E - Asset description   | 2      | Required text field                 |
| F - Unsure of value     | 3      | Disabled field + storage            |
| G - Edit flow           | 4      | Round-trips + toast                 |
| H - Delete flow         | 3      | Confirmation + recalculation        |
| I - Validation          | 4      | 3 required fields + attention       |
| J - Summary             | 5      | Display + totals + unknown handling |
| K - Data integrity      | 4      | Storage model + display             |
| **Total**               | **46** |                                     |

---

# Known Gaps

### 1. No error props wired to form fields

`useFormValidation` tracks 3 fields (business, type, description) but `error` props are not passed to form components.

### 2. No beneficiaries

This asset type does not support beneficiary assignment (assets belong to the business entity, not the individual).

### 3. Blank value handling

May save blank value as 0 rather than `estimatedValueUnknown: true`. Test F-3 will verify — fix if needed (same pattern as pensions/investments).
