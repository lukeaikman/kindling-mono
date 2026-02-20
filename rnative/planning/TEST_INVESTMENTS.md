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


| #   | Test                               | Steps                                                                                        | Pass criteria                                                                                                                        | Pass?                                                                                                          |
| ----- | ------------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| K-1 | Single 0% triggers dialog          | Add one beneficiary (Jane) at 0%. Fill provider. Tap save.                                   | Dialog appears: 'You added "Jane Doe (Daughter)" as a beneficiary but allocated them a 0% share.' Button reads "Save & Remove Jane". | Fail - button is diosabled. Validation should show the 'one last thing' and red border on beneficiary cards.   |
| K-2 | Save & Remove persists without 0%  | From K-1 dialog, tap "Save & Remove Jane".                                                   | Asset saved. Stored`beneficiaryAssignments.beneficiaries` array does not include Jane. Console log shows `[save-with-removal]`.      | Redundant test                                                                                                 |
| K-3 | Back dismisses dialog              | From K-1 dialog, tap "Back".                                                                 | Dialog closes. Form is still editable with beneficiary list unchanged.                                                               | Redundant test                                                                                                 |
| K-4 | Multiple 0% triggers multi message | Add Jane at 0% and Bob at 0%, John at 100%. Fill provider. Tap save.                         | Dialog: "You added 2 beneficiaries with a 0% share." Button: "Save & Remove 2 Beneficiaries".                                        | Pass - BUT Change button copy to "Save & Remove 0% beneficiaries"                                              |
| K-5 | Multi Save & Remove keeps valid    | From K-4, tap "Save & Remove 2 Beneficiaries".                                               | Asset saved with only John (100%). Jane and Bob are not in stored beneficiaries. Console log fires.                                  | Pass                                                                                                           |
| K-6 | No dialog when all > 0%            | Add Jane 60% + Bob 40%. Fill provider. Tap save.                                             | Save succeeds immediately with no dialog.                                                                                            | Pass                                                                                                           |
| K-7 | Guard runs after 100% validation   | Add Jane at 0% and Bob at 50% (total 50%). Tap save.                                         | Percentage total validation blocks first — zero-percent dialog does NOT appear until total is 100%.                                 | Button disabled as less than 100%. Which is fine, but need validation in as mentioned in a test comment above. |
| K-8 | Edit mode with existing 0% entries | Save an investment with Jane 100%. Edit it, change Jane to 0% and add Bob at 100%. Tap save. | Zero-percent dialog appears for Jane. "Save & Remove" persists only Bob.                                                             | Pass                                                                                                           |
| K-9 | Group beneficiary at 0%            | Add a group at 0% and a person at 100%. Fill provider. Tap save.                             | Dialog shows group name (not "Unknown"). "Save & Remove [GroupName]". Confirm removes group from persisted data.                     | Pass                                                                                                           |

---

## L. Beneficiary Component (Redesigned)


| #    | Test                                   | Steps                                                         | Pass criteria                                                                                                                                                    | Pass? |
| ------ | ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| L-1  | Empty state shows prominent add button | Open add investment form (no beneficiaries yet).              | Large "Add Beneficiaries" button visible with icon. No rows, no total, no wizard.                                                                                | Pass  |
| L-2  | Add first beneficiary                  | Tap "Add Beneficiaries", select Jane, confirm.                | Jane row appears with green accent bar, name on left, % input on right, open padlock icon, delete x top-right. Prominent add button replaced by "+ Add another". | Pass  |
| L-3  | "+ Add another" opens drawer           | After first add, tap "+ Add another".                         | Beneficiary selection drawer opens. Previously selected beneficiaries are excluded.                                                                              | Pass  |
| L-4  | Compact row layout                     | Add Jane 60% + Bob 40%.                                       | Two single-line rows: name left, padlock + % input right. No card bloat, no background fill bars.                                                                | Pass  |
| L-5  | Inline total displays                  | Add Jane 60% + Bob 40%.                                       | Footer row shows "+ Add another" on left and "Total: 100.0% ✓" on right, green text.                                                                            | Pass  |
| L-6  | Invalid total shown in red             | Add Jane 60% + Bob 30% (90% total).                           | Total shows "90.0%" in red. No checkmark.                                                                                                                        | Pass  |
| L-7  | Delete beneficiary via x               | Add Jane + Bob. Tap x on Bob's row.                           | Bob removed. Only Jane remains. Total updates.                                                                                                                   | Pass  |
| L-8  | Percentage input works                 | Tap Jane's % input, type "75".                                | Input accepts full number, displays "75", padlock locks (filled circle, white icon).                                                                             | Pass  |
| L-9  | Padlock shows open by default          | Add a new beneficiary.                                        | Padlock icon is open (grey circle, grey icon).                                                                                                                   | Pass  |
| L-10 | Padlock locks on manual % edit         | Type a percentage value into a beneficiary's input.           | Padlock icon switches to locked (navy filled circle, white lock icon).                                                                                           | Pass  |
| L-11 | Tap locked padlock unlocks it          | After L-10, tap the locked padlock.                           | Padlock returns to open state.`isManuallyEdited` is false.                                                                                                       | Pass  |
| L-12 | Tap unlocked padlock locks it          | Tap the open padlock on a beneficiary.                        | Padlock switches to locked.`isManuallyEdited` is true.                                                                                                           | Pass  |
| L-13 | Error state on validation              | Leave beneficiaries empty, trigger validation (tap save).     | "Add Beneficiaries" button shows red border.                                                                                                                     | Pass  |
| L-14 | Saved data has correct structure       | Add Jane 60% + Bob 40%. Save investment. Inspect stored data. | `beneficiaryAssignments.beneficiaries` array has 2 entries with correct id, type, percentage. No extra fields leaking (e.g. no `isManuallyEdited` persisted).    | Pass  |
| L-15 | Edit round-trip preserves data         | Save investment with Jane 70% + Bob 30%. Re-open for edit.    | Rows show Jane at 70% and Bob at 30%. Padlocks are in expected state. Total shows 100.0% ✓.                                                                     | Pass  |
| L-16 | Group/estate beneficiary display       | Add a group and "The Estate" as beneficiaries.                | Group row shows group emoji + name. Estate row shows estate emoji + "The Estate".                                                                                | Pass  |

---

## M. 100% Wizard


| #    | Test                                  | Steps                                                                                                      | Pass criteria                                                                                                           | Pass? |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| M-1  | Wizard hidden at 100%                 | Add Jane 60% + Bob 40%. Check footer.                                                                      | No "100% Wizard" button visible.                                                                                        | Pass  |
| M-2  | Wizard visible when off 100%          | Add Jane 60% + Bob 30% (90% total).                                                                        | "100% Wizard" pill button appears.                                                                                      | Pass  |
| M-3  | Rule 3: single unlocked auto-sets     | Add Jane (locked at 60%) + Bob (unlocked). Tap wizard.                                                     | Bob auto-set to 40%. No popup. Total = 100%. Haptic fires.                                                              | Pass  |
| M-4  | Rule 4: all unlocked equal auto-evens | Add Jane 20% + Bob 20% + John 20% (all unlocked). Tap wizard.                                              | All three set to 33.33% (or 33.34% for last to absorb remainder). No popup. Total = 100%.                               | Fail  |
| M-5  | Rule 4: all unlocked at 0% auto-evens | Add Jane + Bob + John, leave all at 0%. Lock none. Tap wizard.                                             | All three get even share (~33.33%). No popup. Total = 100%.                                                             | Pass  |
| M-6  | Rule 5: uneven popup — scale         | Add Jane 60% + Bob 10% (unlocked, uneven). Tap wizard. Select "Scale proportionately".                     | Popup appears with three buttons. After "Scale proportionately": Jane ~85.71%, Bob ~14.29%. Total = 100%.               | Pass  |
| M-7  | Rule 5: uneven popup — even          | Add Jane 60% + Bob 10% (unlocked, uneven). Tap wizard. Select "Even distribution".                         | After "Even distribution": Jane 50%, Bob 50%. Total = 100%.                                                             | Pass  |
| M-8  | Rule 5: uneven popup — cancel        | Add Jane 60% + Bob 10%. Tap wizard. Tap "Cancel".                                                          | Dialog closes. Values unchanged.                                                                                        | Pass  |
| M-9  | Rule 1: all locked popup              | Add Jane 60% + Bob 30%. Lock both. Tap wizard.                                                             | Popup: "All beneficiaries are locked. Shall we scale all proportionately to equal 100%?" [Yes please] / [No thanks].    | Pass  |
| M-10 | Rule 1: all locked — yes please      | From M-9, tap "Yes please".                                                                                | Jane ~66.67%, Bob ~33.33%. Total = 100%. Haptic fires.                                                                  | Pass  |
| M-11 | Rule 1: all locked — no thanks       | From M-9, tap "No thanks".                                                                                 | Dialog closes. Values unchanged.                                                                                        | Pass  |
| M-12 | Rule 2: locked overcommit             | Add Jane (locked 70%) + Bob (locked 40%) + John (unlocked 0%). Tap wizard.                                 | Popup: "Locked allocations already total 110%. Unlock at least one beneficiary to proceed." [OK].                       | Pass  |
| M-13 | Wizard respects lock boundaries       | Jane locked at 50%, Bob unlocked at 20%, John unlocked at 10%. Tap wizard. Select "Scale proportionately". | Jane stays at 50%. Bob and John scaled to fill remaining 50% proportionately (Bob ~33.33%, John ~16.67%). Total = 100%. | Pass  |
| M-14 | Rounding to 2dp                       | Set up 3 unlocked beneficiaries at values that cause infinite decimals. Tap wizard.                        | All percentages shown to max 2 decimal places. Total is exactly 100%.                                                   | Pass  |

---

## Summary - Manual Tests


| Section                            | Tests  | Notes                                             |
| ------------------------------------ | -------- | --------------------------------------------------- |
| A - Intro screen                   | 6      | Navigation + educational content                  |
| B - Add flow                       | 6      | Happy path + ISA carry-over                       |
| C - Type dropdown                  | 3      | Options + optional default behavior               |
| D - Beneficiaries/percentages      | 7      | Required field + percentage validation + groups   |
| E - Unsure of balance              | 4      | Disabled field + storage behavior                 |
| F - Edit flow                      | 5      | Prefill + updates + toast                         |
| G - Delete flow                    | 3      | Confirmation + recalculation                      |
| H - Validation                     | 5      | Required fields + attention                       |
| I - Summary screen                 | 7      | Display + totals + completion                     |
| J - Data + navigation edges        | 6      | Storage model + guard rails                       |
| K - Zero-percent beneficiary guard | 9      | 0% detection + dialog + persistence cleanup       |
| L - Beneficiary component          | 16     | Compact rows, padlock, add states, data integrity |
| M - 100% Wizard                    | 14     | Lock-aware rules, popups, rounding                |
| **Total**                          | **91** |                                                   |

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

### 7. 100% Wizard (`evaluateWizard`)

Test:

- All locked → `rule === 'all_locked'`, `proportionalResult` sums to 100%
- Locked sum ≥ 100% with unlocked → `rule === 'locked_overcommit'`, `lockedSum` correct
- Single unlocked → `rule === 'single_unlocked'`, result gives remainder to that beneficiary
- Multiple unlocked, all equal → `rule === 'even_auto'`, each unlocked gets equal share
- Multiple unlocked, all 0% → `rule === 'even_auto'`, even distribution applied
- Multiple unlocked, uneven → `rule === 'uneven_popup'`, both `proportionalResult` and `evenResult` sum to 100%
- Locked beneficiaries untouched in scale/even results (rules 3-5)
- Rounding: all percentages ≤ 2dp, total exactly 100% after rounding

### Estimated Jest scope

~28-34 assertions across ~18-22 test cases (extended with wizard rule evaluation and rounding).
