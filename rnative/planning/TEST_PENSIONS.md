# Pensions — Test Plan

**Entry form:** `app/bequeathal/pensions/entry.tsx`
**Intro screen:** `app/bequeathal/pensions/intro.tsx`
**Summary screen:** `app/bequeathal/pensions/summary.tsx` (generic `CategorySummaryScreen`)

---

## Precursor: Purge data before testing

1. Open developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Create test people in Onboarding -> Family:
   - **Person 1:** John Smith (Spouse)
   - **Person 2:** Jane Doe (Daughter)
   - **Person 3:** Bob Smith (Son)
4. Create at least one beneficiary group (recommended for group tests)
5. Confirm estate dashboard shows no assets

---

# Part 1: Manual Tests

## A. Intro Screen


| #   | Test                        | Steps                                       | Pass criteria                                                                                                             | Pass? |
| ----- | ----------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| A-1 | Intro screen renders        | Navigate to Pensions from estate dashboard. | Header shows "Pensions" with shield icon. Video player visible. InformationCard content present.                          | Pass  |
| A-2 | Let's Go navigates          | Tap "Let's Go".                             | Navigates to pensions entry form.                                                                                         | Pass  |
| A-3 | Skip navigates              | Tap "Skip for now".                         | Returns to previous screen (dashboard/category flow).                                                                     | Pass  |
| A-4 | Back button works           | Tap back arrow in header.                   | Returns to previous screen.                                                                                               | Pass  |
| A-5 | Learn more opens link       | Tap "Learn about pensions in wills".        | External browser opens gov.uk pensions/inheritance guidance link.                                                         | Pass  |
| A-6 | Information content correct | Scroll through InformationCard.             | Mentions pensions held in trust, nomination of beneficiaries, executor facilitation, scary stat about forgotten pensions. | Pass  |

---

## B. Add Flow - Basic


| #   | Test                                | Steps                                                                                                             | Pass criteria                                                                              | Pass? |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------- |
| B-1 | Add pension - defined benefit       | Provider = "Scottish Widows". Type = "Defined Benefit". Value = 15000. Beneficiary Nominated = "Not Sure". Save.  | Asset saved. Value label shows "Annual Amount (£/year)". Type stored as`defined-benefit`. | Pass  |
| B-2 | Add pension - SIPP with beneficiary | Provider = "AJ Bell". Type = "SIPP". Beneficiary Nominated = "Yes". Add Jane at 100%. Value = 200000. Save.       | Asset saved with beneficiary. Type stored as`sipp`. Value label shows "Total Value".       | Pass  |
| B-3 | Add pension - defined contribution  | Provider = "Aviva". Type = "Defined Contribution". Beneficiary Nominated = "No". Value = 85000. Save.             | Asset saved. No beneficiary section shown. Type stored as`defined-contribution`.           | Pass  |
| B-4 | Add pension - workplace unsure type | Provider = "Nest". Type = "Workplace - Type Unsure". Beneficiary Nominated = "Not Sure". Leave value blank. Save. | Save succeeds.`estimatedValueUnknown: true`. Type stored as `workplace`.                   | Pass  |
| B-5 | Add pension - type unsure           | Provider = "Unknown Provider". Type = "Unsure". Beneficiary Nominated = "Not Sure". Tick "Unsure of value". Save. | Save succeeds.`estimatedValueUnknown: true`. Type stored as `unsure`.                      | Pass  |
| B-6 | Header/button text in add mode      | Open entry with no`?id` param.                                                                                    | Header is "Add Pension". Button is "Add this pension".                                     | Pass  |

---

## C. Pension Type Dropdown


| #   | Test                              | Steps                                              | Pass criteria                                                                          | Pass?                                                                                                               |
| ----- | ----------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| C-1 | Type options listed               | Open "Pension Type" dropdown.                      | Includes Defined Benefit, Defined Contribution, SIPP, Workplace - Type Unsure, Unsure. | Pass                                                                                                                |
| C-2 | Type is required                  | Leave type blank, fill other fields, attempt save. | Save blocked/disabled. Validation attention fires. Type dropdown shows red error border. | Pass |
| C-3 | Value label changes for DB        | Select "Defined Benefit".                          | Value field label shows "Annual Amount (£/year)".                                     | Pass                                                                                                                |
| C-4 | Value label for non-DB types      | Select "SIPP" or "Defined Contribution".           | Value field label shows "Total Value".                                                 | Pass                                                                                                                |
| C-5 | Value field hidden until type set | Open form, check value area before selecting type. | Value/unsure section is hidden until a pension type is selected.                       | Pass                                                                                                                |

---

## D. Beneficiary Nomination


| #   | Test                                       | Steps                                                                           | Pass criteria                                                                                        | Pass?                                                                                                           |
| ----- | -------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| D-1 | Nomination is required                     | Fill provider and type. Leave "Beneficiary Nominated" unselected. Attempt save. | Save blocked/disabled. Validation attention fires. RadioGroup shows red error border.                | Pass |
| D-2 | "Yes" shows beneficiary section            | Select "Yes" for beneficiary nominated.                                         | `BeneficiaryWithPercentages` component appears with "Who are the beneficiaries?" label.              | Pass                                                                                                            |
| D-3 | "No" hides beneficiary section             | Select "No" for beneficiary nominated.                                          | Beneficiary section hidden. No beneficiary data saved.                                               | Pass                                                                                                            |
| D-4 | "Not Sure" hides beneficiary section       | Select "Not Sure" for beneficiary nominated.                                    | Beneficiary section hidden. No beneficiary data saved.                                               | Pass                                                                                                            |
| D-5 | Switching from Yes to No clears selections | Add beneficiaries while "Yes" selected. Switch to "No".                         | Beneficiary section hides. Previously added beneficiaries are cleared.                               | Pass                                                                                                            |
| D-6 | "Yes" requires valid beneficiaries         | Select "Yes". Don't add any beneficiaries. Attempt save.                        | Save blocked. Validation attention should show missing beneficiaries.                                | Pass                                                                                                            |
| D-7 | "Yes" requires valid percentages           | Select "Yes". Add Jane 60% + Bob 30% (90% total). Attempt save.                 | Save blocked until total = 100%. Attention button fires. % inputs get red borders, total underlined. | Pass                                                                                                            |

---

## E. Beneficiaries + Percentages (when nominated = "Yes")


| #   | Test                               | Steps                                                                      | Pass criteria                                                                             | Pass? |
| ----- | ------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------- |
| E-1 | Add single beneficiary at 100%     | Select "Yes". Add Jane at 100%. Save.                                      | Save succeeds. Stored with`beneficiaryAssignments.beneficiaries` containing Jane at 100%. | Pass  |
| E-2 | Multi-beneficiary percentage split | Add Jane 60% + Bob 40%. Save.                                              | Save succeeds. Both beneficiaries stored with correct percentages.                        | Pass  |
| E-3 | Estate as beneficiary              | Add "The Estate" as sole beneficiary at 100%. Save.                        | Save succeeds. Estate stored as`{ id: 'estate', type: 'estate', percentage: 100 }`.       | Pass  |
| E-4 | Group as beneficiary               | Add a beneficiary group. Save.                                             | Save succeeds. Group stored with correct id and type.                                     | Pass  |
| E-5 | 100% Wizard works                  | Add Jane 60% + Bob 10%. Tap "100% Wizard". Select "Scale proportionately". | Jane ~85.71%, Bob ~14.29%. Total = 100%.                                                  | Pass  |
| E-6 | Padlock and lock behaviour         | Add Jane, type 50%. Check padlock. Tap padlock. Check state.               | Typing doesn't auto-lock. Tap locks. Tap again unlocks.                                   | Pass  |
| E-7 | Will-maker excluded                | Open beneficiary selector.                                                 | Will-maker is excluded from selectable beneficiaries.                                     | Pass  |

---

## F. Unsure of Value


| #   | Test                          | Steps                                                       | Pass criteria                                                          | Pass?                         |
| ----- | ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------- |
| F-1 | Checkbox disables value field | Select a pension type. Tick "Unsure of value".              | Currency field is disabled/dimmed.                                     | Pass                          |
| F-2 | Toggling unsure resets value  | Enter value 50000, then tick unsure.                        | Value resets. Save uses`estimatedValueUnknown: true`.                  | Pass                          |
| F-3 | Untick unsure re-enables      | Tick unsure, then untick. Type 75000.                       | Value field re-enables. Typed value is accepted and saved.             | Pass                          |
| F-4 | Blank value saves as unknown  | Select type. Leave value blank (don't type anything). Save. | Save succeeds. Stored as `estimatedValueUnknown: true` (not value = 0). | Pass |

---

## G. Edit Flow


| #   | Test                               | Steps                                                            | Pass criteria                                                                          | Pass? |
| ----- | ------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------- |
| G-1 | Edit loads existing data           | From summary, open an existing pension for edit.                 | Provider/type/value/nomination/beneficiaries are pre-filled. Header is "Edit Pension". | Pass  |
| G-2 | Edit saves provider/type change    | Change provider and type, save.                                  | List updates immediately with new title/type.                                          | Pass  |
| G-3 | Edit saves beneficiary changes     | Change nomination from "Not Sure" to "Yes", add Jane 100%, save. | Beneficiary data now stored. Summary updates.                                          | Pass  |
| G-4 | Edit saves value change            | Change value from 15000 to 25000, save.                          | Updated value shown in summary and data.                                               | Pass  |
| G-5 | Net wealth toast on edit           | Edit a pension's value and save.                                 | Net wealth toast reflects delta from old value to new value.                           | Pass  |
| G-6 | Edit round-trip with unsure value  | Save pension with "unsure" ticked. Reopen for edit.              | Unsure checkbox is pre-ticked. Value field is disabled.                                | Pass  |
| G-7 | Edit round-trip with beneficiaries | Save pension with Jane 70% + Bob 30%. Reopen for edit.           | Rows show Jane at 70% and Bob at 30%. Total shows 100.0% ✓.                           | Pass  |

---

## H. Delete Flow


| #   | Test                | Steps                                  | Pass criteria                                                          | Pass? |
| ----- | --------------------- | ---------------------------------------- | ------------------------------------------------------------------------ | ------- |
| H-1 | Delete from summary | From summary, tap delete on a pension. | Confirmation appears and action is cancellable.                        | Pass  |
| H-2 | Delete confirmed    | Confirm deletion.                      | Pension removed; total recalculates; storage no longer contains asset. | Pass  |
| H-3 | Delete cancelled    | Cancel delete dialog.                  | Pension remains unchanged.                                             | Pass  |

---

## I. Validation


| #   | Test                              | Steps                                                                 | Pass criteria                                                                         | Pass?                                                             |
| ----- | ----------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| I-1 | Provider required                 | Leave provider blank, fill other fields, attempt save.                | Save blocked/disabled. Provider input shows red error border.                         | Pass |
| I-2 | Pension type required             | Leave type blank, fill other fields, attempt save.                    | Save blocked/disabled. Type dropdown shows red error border.                          | Pass |
| I-3 | Beneficiary nominated required    | Fill provider and type, leave nomination blank, attempt save.         | Save blocked/disabled. RadioGroup shows red error border.                             | Pass |
| I-4 | Beneficiaries required when "Yes" | Select "Yes" for nomination. Leave beneficiaries empty. Attempt save. | Save blocked. Attention label shows missing beneficiaries. Add button highlighted.    | Pass |
| I-5 | Percentage total required         | Select "Yes". Add Jane 60% + Bob 30% (90%). Attempt save.             | Save blocked. Attention fires. % inputs get red borders, total underlined in red.     | Pass |
| I-6 | Validation attention trigger      | Tap disabled save button or attention button when form invalid.       | Attention label shows count of invalid fields. Scrolls to top. Red highlights appear. | Pass |
| I-7 | Value not required                | Fill required fields. Leave value blank. Save.                        | Save succeeds. Stored as `estimatedValueUnknown: true`.                               | Pass |

---

## J. Summary Screen


| #   | Test                               | Steps                                             | Pass criteria                                                             | Pass? |
| ----- | ------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| J-1 | Summary shows all pensions         | Add 3 pensions with mixed types and open summary. | All items show correctly with names, types, and values.                   | Pass  |
| J-2 | Total value correct                | Add known values (e.g., 15000 + 200000 + 85000).  | Summary total equals expected sum (excluding unknown values if present).  | Pass  |
| J-3 | Empty state                        | Remove all pensions and open summary.             | Empty state shown: "No pensions yet" with add action.                     | Pass  |
| J-4 | Add from summary                   | Tap "Add another" from summary.                   | Opens add form in create mode.                                            | Pass  |
| J-5 | Edit from summary                  | Tap an existing pension card.                     | Opens edit form with`?id=` and pre-filled data.                           | Pass  |
| J-6 | Unknown balance handling in total  | Add one known value and one unsure value.         | Total shows known sum with`+` suffix if unknowns present.                 | Pass  |
| J-7 | "That's everything" marks complete | From non-empty summary, tap completion CTA.       | Category marked complete and returns to expected dashboard/category flow. | Pass  |

---

## K. Data Integrity + Navigation Edges


| #   | Test                         | Steps                                             | Pass criteria                                                                                                   | Pass?                                                 |
| ----- | ------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| K-1 | Stored type is pensions      | Save any pension and inspect data explorer.       | `type === 'pensions'`.                                                                                          | Pass                                                  |
| K-2 | Beneficiaries stored unified | Save with person/group/estate mix where possible. | Uses unified`beneficiaryAssignments.beneficiaries[]` with id/type/percentage only.                              | Pass                                                  |
| K-3 | Title generation logic       | Save one pension and check stored title.          | Title format:`"Provider - PensionTypeLabel"` (e.g. "Scottish Widows - Defined Benefit").                        | Pass                                                  |
| K-4 | Display title and subline    | View pension in summary card.                     | Card title: provider name. Subline: type label only (e.g. "Defined Benefit"), no provider repetition. | Pass |
| K-5 | Back from entry              | Open entry, tap back.                             | Returns to prior summary/flow without duplicate screens.                                                        | Pass                                                  |
| K-6 | Back from summary            | Open summary, tap back.                           | Returns to expected previous screen in estate flow.                                                             | Pass                                                  |

---

## L. Zero-Percent Beneficiary Guard


| #   | Test                              | Steps                                                                    | Pass criteria                                                        | Pass? |
| ----- | ----------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| L-1 | Single 0% blocked by total check  | Select "Yes". Add Jane at 0%. Fill other fields. Tap save.               | Save blocked (total = 0%). Attention fires. % input gets red border. | Pass  |
| L-2 | 0% dialog when total is 100%      | Select "Yes". Add Jane at 0% + Bob at 100%. Fill other fields. Tap save. | Zero-percent dialog appears for Jane. Button: "Save & Remove Jane".  | Pass  |
| L-3 | Save & Remove persists without 0% | From L-2, tap "Save & Remove Jane".                                      | Asset saved. Beneficiaries contain only Bob.                         | Pass  |
| L-4 | No dialog when all > 0%           | Select "Yes". Add Jane 60% + Bob 40%. Fill other fields. Tap save.       | Save succeeds immediately with no dialog.                            | Pass  |

**Note:** The zero-percent beneficiary guard may not yet be wired into the pensions entry form. If L-2 fails, it needs to be added (import `detectZeroPercentBeneficiaries` and add the guard to `handleSave`, matching the investments pattern).

---

## Summary - Manual Tests


| Section                         | Tests  | Notes                                       |
| --------------------------------- | -------- | --------------------------------------------- |
| A - Intro screen                | 6      | Navigation + educational content            |
| B - Add flow                    | 6      | All pension types + nomination variants     |
| C - Pension type dropdown       | 5      | Options + conditional value label           |
| D - Beneficiary nomination      | 7      | Three-state nomination + conditional UI     |
| E - Beneficiaries/percentages   | 7      | When nominated=Yes: wizard, padlock, groups |
| F - Unsure of value             | 4      | Disabled field + storage behavior           |
| G - Edit flow                   | 7      | Prefill + updates + round-trips             |
| H - Delete flow                 | 3      | Confirmation + recalculation                |
| I - Validation                  | 7      | Required fields + percentage + attention    |
| J - Summary screen              | 7      | Display + totals + completion               |
| K - Data integrity + navigation | 6      | Storage model + display + guard rails       |
| L - Zero-percent guard          | 4      | 0% detection + dialog (may need wiring)     |
| **Total**                       | **69** |                                             |

---

# Part 2: Known Gaps — All Resolved

These gaps were identified pre-testing and have all been fixed.

### 1. Percentage total in validation fields — ✅ FIXED

Added `beneficiaries` and `percentages` fields to `useFormValidation` (conditionally valid when nomination != "yes"). Attention button now fires for invalid totals.

### 2. Zero-percent beneficiary guard — ✅ Already present

The pensions entry already had `detectZeroPercentBeneficiaries` wired in. Tests L-1 through L-4 all passed on first run.

### 3. Blank value → unknown — ✅ FIXED

Added guard to `handleSave`: blank value (0) with "unsure" unticked now saves as `estimatedValueUnknown: true`.

### 4. `alreadySelectedGroupIds` on GroupManagementDrawer — ✅ Already present

Confirmed present and working.

### 5. Validation error styling on form fields — ✅ FIXED

Added `error` prop to `RadioGroup` component. Wired `error` props to `Input`, `Select`, `RadioGroup`, and `BeneficiaryWithPercentages` in pensions entry.

---

# Part 3: Jest Unit Tests (implement after manual tests pass)

## Candidates for Jest

### 1. canSubmit logic

Test: submit enabled only when:

- `provider.trim()` is truthy
- `pensionType` is selected
- `beneficiaryNominated` is selected
- If nominated = "yes": at least 1 beneficiary exists AND percentages total 100%
- If nominated = "no" or "not-sure": no beneficiary requirement

### 2. Save data mapping

Extract and test:

- `title` format: `"Provider - PensionTypeLabel"`
- `pensionType` stored as slug (e.g. `defined-benefit`)
- `beneficiaryAssignments` only present when nominated = "yes"
- `estimatedValueUnknown` behaviour (blank value, unsure checkbox)
- `netValue` mirrors `estimatedValue`
- Value rounded to nearest £1

### 3. Conditional value label

Test:

- `defined-benefit` → "Annual Amount (£/year)"
- All other types → "Total Value"

### 4. Beneficiary nomination state transitions

Test:

- Switching from "Yes" to "No" clears beneficiaries
- Switching from "No" to "Yes" shows empty beneficiary section
- Saved data reflects final nomination state

### Estimated Jest scope

~14-18 assertions across ~8-12 test cases.
