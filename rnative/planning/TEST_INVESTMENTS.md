# Investments — Test Plan

**Entry form:** `app/bequeathal/investment/entry.tsx`
**Intro screen:** `app/bequeathal/investment/intro.tsx`
**Summary screen:** `app/bequeathal/investment/summary.tsx` (generic `CategorySummaryScreen`)

---

## Precursor: Purge data before testing

1. Open developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Create test people in Onboarding -> Family:
   - **Person 1:** John Smith (Spouse)
   - **Person 2:** Jane Doe (Daughter)
   - **Person 3:** Bob Smith (Son)
4. Create at least one beneficiary group (optional but recommended for group tests)
5. Confirm estate dashboard shows no assets
6. Add an ISA in Bank Accounts first (for cross-category ISA integration check):
   - Provider: HSBC
   - Account Type: ISA
   - Estimated Balance: 20000

---

# Part 1: Manual Tests

## A. Intro Screen


| #   | Test                        | Steps                                                  | Pass criteria                                                                                                       | Pass? |
| ----- | ----------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------- |
| A-1 | Intro screen renders        | Navigate to Investment Accounts from estate dashboard. | Header shows "Investment Accounts" with trending-up icon. Video player visible. InformationCard content is present. | Pass  |
| A-2 | Start Adding navigates      | Tap "Start Adding Investments".                        | Navigates to investments entry form.                                                                                | Pass  |
| A-3 | Skip navigates              | Tap "Skip for now".                                    | Returns to previous screen (dashboard/category flow).                                                               | Pass  |
| A-4 | Back button works           | Tap back arrow in header.                              | Returns to previous screen.                                                                                         | Pass  |
| A-5 | Learn more opens link       | Tap "Learn about investments in wills".                | External browser opens gov.uk inheritance/pension guidance link.                                                    | Pass  |
| A-6 | Information content correct | Scroll through InformationCard bullet points.          | Mentions portfolios, ISAs, bonds, funds, and platforms/brokers.                                                     | Pass  |

---

## B. Add Flow - Basic


| #   | Test                           | Steps                                                                                                      | Pass criteria                                                                                        | Pass? |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------- |
| B-1 | Add investment - provider only | Provider = "AJ Bell". Leave investment type blank. Select one beneficiary. Value = 15000. Save.            | Asset saved with provider. Type defaults to "unknown". Value saved.                                  | Pass  |
| B-2 | Add investment - with type     | Provider = "Hargreaves Lansdown". Type = "ISA (Stocks & Shares)". Beneficiary = Jane. Value = 50000. Save. | Asset saved and displayed with type label in title.                                                  | Pass  |
| B-3 | Add investment - zero value    | Provider = "Vanguard". Type = "General Investment Account". Beneficiary = Bob. Leave value at 0. Save.     | Save succeeds.`estimatedValue` saved as `0`.                                                         | Pass  |
| B-4 | Add investment - unsure value  | Provider = "Interactive Investor". Beneficiary = John. Tick "Unsure of balance". Save.                     | Save succeeds.`estimatedValueUnknown === true`; value stored as `undefined`; `netValue` `undefined`. | Pass  |
| B-5 | ISA from bank accounts appears | Open Investments summary after creating ISA in Bank Accounts.                                              | ISA added in Bank Accounts is visible in Investments list.                                           | Pass  |
| B-6 | Header/button text in add mode | Open entry with no`?id` param.                                                                             | Header is "Add Investment". Button is "Add this investment".                                         | Pass  |

---

## C. Investment Type Dropdown


| #   | Test                        | Steps                                  | Pass criteria                                                                                             | Pass? |
| ----- | ----------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| C-1 | Type options listed         | Open "Investment Type" dropdown.       | Includes General Investment Account, AIM, ISA, Cash ISA, CREST, JISA, NS&I, Employee Share Scheme, Other. | Pass  |
| C-2 | Optional type behavior      | Leave type blank and save valid asset. | Save works; type defaults to`unknown` in stored data.                                                     | Pass  |
| C-3 | Label used in display title | Save with type = "Cash ISA".           | Title includes provider and human-readable type label.                                                    | Pass  |

---

## D. Beneficiaries + Percentages


| #   | Test                               | Steps                                                                     | Pass criteria                                                      | Pass?                                                                                                                                                                                                                      |
| ----- | ------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Beneficiary required               | Fill provider only; do not pick beneficiary.                              | Submit disabled. Validation attention shows beneficiaries missing. | Pass                                                                                                                                                                                                                       |
| D-2 | Multi-beneficiary percentage split | Add Jane 60% + Bob 40%, then save.                                        | Save succeeds. Both beneficiaries stored with percentages.         | Pass                                                                                                                                                                                                                       |
| D-3 | Invalid percentage total blocked   | Add Jane 60% + Bob 30% (90% total). Try save.                             | Save blocked until total is 100%.                                  | PASS BUT - we need to pop up a dialogue that says "Total distribution does not equal 100%. Would you like to:<br />(the three buttons)[Scale %s to 100%][give remained to estate (ONLY present if under 100%)[Edit myself] |
| D-4 | Estate option available            | Open beneficiary selector.                                                | "The Estate" appears and can be selected.                          | Pass                                                                                                                                                                                                                       |
| D-5 | Will-maker exclusion               | Open beneficiary selector with will-maker present in people list.         | Will-maker is excluded from selectable beneficiaries.              | Pass                                                                                                                                                                                                                       |
| D-6 | Group selection flow               | Open group drawer, create/select group, save investment.                  | Group appears in selected beneficiaries and persists on save.      | PASS - BUT Group can be added twice. The already added group is excluded from the original selection drawer, but then if I clikc "+Create Manage Groups" I can add the already added group again from there.               |
| D-7 | Add person inline flow             | Use "+ Add person" in beneficiary flow, create person, auto-select, save. | New person is created and selected without losing form state.      | Pass                                                                                                                                                                                                                       |

---

## E. Unsure of Balance


| #   | Test                          | Steps                                     | Pass criteria                                                              | Pass?                                                        |
| ----- | ------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| E-1 | Checkbox disables value field | Tick "Unsure of balance".                 | Currency field is disabled/dimmed.                                         | Pass                                                         |
| E-2 | Toggling unsure resets value  | Enter value, then tick unsure.            | Value resets and save uses`estimatedValueUnknown`.                         | Pass                                                         |
| E-3 | Typing value unticks unsure   | Tick unsure, then untick and enter value. | Value becomes editable and unsure flag is removed on save.                 | Defunct - text box is disabled while unsure value is ticked. |
| E-4 | Edit round-trip with unsure   | Save with unsure. Reopen edit.            | Unsure state is preloaded correctly and behaves consistently when changed. |                                                              |

---

## F. Edit Flow


| #   | Test                               | Steps                                               | Pass criteria                                                                  | Pass? |
| ----- | ------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------- | ------- |
| F-1 | Edit loads existing data           | From summary, open an existing investment for edit. | Provider/type/beneficiaries/value are pre-filled. Header is "Edit Investment". | Pass  |
| F-2 | Edit saves provider/type change    | Change provider and type, save.                     | List updates immediately with new title/type.                                  | Pass  |
| F-3 | Edit saves beneficiary percentages | Update allocations (e.g., 70/30), save.             | Beneficiary assignment persists with updated percentages.                      | Pass  |
| F-4 | Edit saves value change            | Change value from 15000 to 25000, save.             | Updated value shown in summary and data.                                       | Pass  |
| F-5 | Net wealth toast on edit           | Edit an investment's value and save.                | Net wealth toast reflects delta from old value to new value.                   | Pass  |

---

## G. Delete Flow


| #   | Test                | Steps                                      | Pass criteria                                                             | Pass? |
| ----- | --------------------- | -------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| G-1 | Delete from summary | From summary, tap delete on an investment. | Confirmation appears and action is cancellable.                           | Pass  |
| G-2 | Delete confirmed    | Confirm deletion.                          | Investment removed; total recalculates; storage no longer contains asset. | Pass  |
| G-3 | Delete cancelled    | Cancel delete dialog.                      | Investment remains unchanged.                                             | Pass  |

---

## H. Validation


| #   | Test                         | Steps                                                   | Pass criteria                                                                                 | Pass?                                                                                                                                                                                                                                                                                                                                                              |
| ----- | ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-1 | Provider required            | Leave provider blank, fill beneficiaries, attempt save. | Save blocked/disabled until provider entered.                                                 | Pass                                                                                                                                                                                                                                                                                                                                                               |
| H-2 | Beneficiaries required       | Fill provider, leave beneficiaries empty.               | Save blocked/disabled.                                                                        | Pass                                                                                                                                                                                                                                                                                                                                                               |
| H-3 | Percentage total required    | Use non-100 split and attempt save.                     | Save blocked until total is exactly 100%.                                                     | Pass: Though we have a bug - we round to two decimal places when we "scale to 100%" which occassionally leaves us slightly off total. We therefore need a tollerance (on the validation, or to solve the scaling to account for uneven splits and give someone an extra iota). Your opinion should be expressed and I will then feedback before we build anything. |
| H-4 | Validation attention trigger | Tap ValidationAttentionButton when form invalid.        | Attention label points to first invalid field and scrolls/focuses correctly where applicable. | Pass                                                                                                                                                                                                                                                                                                                                                               |
| H-5 | Value not required           | Fill required fields; leave value at 0. Save.           | Save succeeds.                                                                                | Pass (NB there is no 0 as default, so leaving it is unknown - update text of test here, unless you think i'm mistaken)                                                                                                                                                                                                                                             |

---

## I. Summary Screen


| #   | Test                               | Steps                                                              | Pass criteria                                                              | Pass?                                                                                                                                                           |
| ----- | ------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-1 | Summary shows all investments      | Add 3 investments with mixed types/beneficiaries and open summary. | All items show correctly with names, beneficiaries, and values.            | Pass - Summary does not show beneficiaries, but that's by design. Unless I'm mistaken, please amend the text here or come back to me with what you're expecting |
| I-2 | Total value correct                | Add known values (e.g., 15000 + 50000 + 20000).                    | Summary total equals expected sum (excluding unknown values if present).   | Pass                                                                                                                                                            |
| I-3 | Empty state                        | Remove all investments and open summary.                           | Empty state shown with add action.                                         | Pass                                                                                                                                                            |
| I-4 | Add from summary                   | Tap "Add" from summary.                                            | Opens add form in create mode.                                             | Pass                                                                                                                                                            |
| I-5 | Edit from summary                  | Tap an existing investment card.                                   | Opens edit form with`?id=` and pre-filled data.                            | Pass                                                                                                                                                            |
| I-6 | Unknown balance handling in total  | Add one known value and one unsure value.                          | Total behavior is correct and unknown value item is visibly distinguished. | Pass                                                                                                                                                            |
| I-7 | "That's everything" marks complete | From non-empty summary, tap completion CTA.                        | Category marked complete and returns to expected dashboard/category flow.  | Pass                                                                                                                                                            |

---

## J. Data Integrity + Navigation Edges


| #   | Test                         | Steps                                                | Pass criteria                                                                      | Pass?                                            |
| ----- | ------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| J-1 | Stored type is investment    | Save any investment and inspect data explorer.       | `type === 'investment'`.                                                           | Pass                                             |
| J-2 | Beneficiaries stored unified | Save with person/group/estate mix where possible.    | Uses unified`beneficiaryAssignments.beneficiaries[]` with id/type/percentage only. | Pass                                             |
| J-3 | Title generation logic       | Save one with type and one without type.             | With type:`Provider - TypeLabel`; without type: `Provider`.                        | Thisis not how we generate titles I don't think? |
| J-4 | Invalid edit id guarded      | Navigate to`/bequeathal/investment/entry?id=bad-id`. | Redirects safely to investments summary (no crash).                                | Redundant test - mobile app?                     |
| J-5 | Back from entry              | Open entry, tap back.                                | Returns to prior summary/flow without duplicate screens.                           | Pass                                             |
| J-6 | Back from summary            | Open summary, tap back.                              | Returns to expected previous screen in estate flow.                                | Pass                                             |

---

## K. Zero-Percent Beneficiary Guard


| #   | Test                               | Steps                                                                                        | Pass criteria                                                                                                                        | Pass? |
| ----- | ------------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| K-1 | Single 0% triggers dialog          | Add one beneficiary (Jane) at 0%. Fill provider. Tap save.                                   | Dialog appears: 'You added "Jane Doe (Daughter)" as a beneficiary but allocated them a 0% share.' Button reads "Save & Remove Jane". | TBD   |
| K-2 | Save & Remove persists without 0%  | From K-1 dialog, tap "Save & Remove Jane".                                                   | Asset saved. Stored`beneficiaryAssignments.beneficiaries` array does not include Jane. Console log shows `[save-with-removal]`.      | TBD   |
| K-3 | Back dismisses dialog              | From K-1 dialog, tap "Back".                                                                 | Dialog closes. Form is still editable with beneficiary list unchanged.                                                               | TBD   |
| K-4 | Multiple 0% triggers multi message | Add Jane at 0% and Bob at 0%, John at 100%. Fill provider. Tap save.                         | Dialog: "You added 2 beneficiaries with a 0% share." Button: "Save & Remove 2 Beneficiaries".                                        | TBD   |
| K-5 | Multi Save & Remove keeps valid    | From K-4, tap "Save & Remove 2 Beneficiaries".                                               | Asset saved with only John (100%). Jane and Bob are not in stored beneficiaries. Console log fires.                                  | TBD   |
| K-6 | No dialog when all > 0%            | Add Jane 60% + Bob 40%. Fill provider. Tap save.                                             | Save succeeds immediately with no dialog.                                                                                            | TBD   |
| K-7 | Guard runs after 100% validation   | Add Jane at 0% and Bob at 50% (total 50%). Tap save.                                         | Percentage total validation blocks first — zero-percent dialog does NOT appear until total is 100%.                                 | TBD   |
| K-8 | Edit mode with existing 0% entries | Save an investment with Jane 100%. Edit it, change Jane to 0% and add Bob at 100%. Tap save. | Zero-percent dialog appears for Jane. "Save & Remove" persists only Bob.                                                             | TBD   |
| K-9 | Group beneficiary at 0%            | Add a group at 0% and a person at 100%. Fill provider. Tap save.                             | Dialog shows group name (not "Unknown"). "Save & Remove [GroupName]". Confirm removes group from persisted data.                     | TBD   |

---

## Summary - Manual Tests


| Section                            | Tests  | Notes                                           |
| ------------------------------------ | -------- | ------------------------------------------------- |
| A - Intro screen                   | 6      | Navigation + educational content                |
| B - Add flow                       | 6      | Happy path + ISA carry-over                     |
| C - Type dropdown                  | 3      | Options + optional default behavior             |
| D - Beneficiaries/percentages      | 7      | Required field + percentage validation + groups |
| E - Unsure of balance              | 4      | Disabled field + storage behavior               |
| F - Edit flow                      | 5      | Prefill + updates + toast                       |
| G - Delete flow                    | 3      | Confirmation + recalculation                    |
| H - Validation                     | 5      | Required fields + attention                     |
| I - Summary screen                 | 7      | Display + totals + completion                   |
| J - Data + navigation edges        | 6      | Storage model + guard rails                     |
| K - Zero-percent beneficiary guard | 9      | 0% detection + dialog + persistence cleanup     |
| **Total**                          | **61** |                                                 |

---

# Part 2: Jest Unit Tests (implement after manual tests pass)

## Candidates for Jest

### 1. Title generation

Extract and test:

- with type: ``${provider} - ${investmentTypeLabel}``
- without type: `provider`

### 2. canSubmit logic

Test: submit enabled only when:

- `provider.trim()` is truthy
- at least 1 beneficiary exists
- percentage allocation validates to 100%

### 3. Save data mapping

Extract and test: `investmentData` mapping includes:

- default type to `'unknown'`
- beneficiaries persisted as id/type/percentage
- `estimatedValueUnknown` behavior
- `netValue` mirrors `estimatedValue`

### 4. Percentage validation integration

Test invalid totals (e.g., 90%, 110%) block save; valid 100% allows save.

### 5. Unsure balance mapping

Test `balanceNotSure ? undefined : Math.round(value)` and that unsure sets flag while removing numeric value.

### 6. Zero-percent beneficiary guard (`detectZeroPercentBeneficiaries`)

Test:

- Empty list → `hasZeroEntries === false`, empty `zeroEntries`
- All positive percentages → `hasZeroEntries === false`
- Single 0% → `hasZeroEntries === true`, correct single-name dialog message, cleaned list excludes 0% entry
- Multiple 0% → correct multi-count dialog message ("2 beneficiaries with a 0% share"), cleaned list only includes > 0% entries
- `undefined` and `null` percentage treated as 0%
- `confirmLabel` uses first name for person, group name for group, count for multi

### Estimated Jest scope

~16-20 assertions across ~10-12 test cases (extended from crypto due to beneficiary percentage logic and zero-percent guard).
