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

| #   | Test                        | Steps                                                       | Pass criteria                                                                                                                | Pass? |
| ----- | ----------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| A-1 | Intro screen renders        | Navigate to Investment Accounts from estate dashboard.      | Header shows "Investment Accounts" with trending-up icon. Video player visible. InformationCard content is present.         |    |
| A-2 | Start Adding navigates      | Tap "Start Adding Investments".                             | Navigates to investments entry form.                                                                                         |    |
| A-3 | Skip navigates              | Tap "Skip for now".                                         | Returns to previous screen (dashboard/category flow).                                                                        |    |
| A-4 | Back button works           | Tap back arrow in header.                                   | Returns to previous screen.                                                                                                  |    |
| A-5 | Learn more opens link       | Tap "Learn about investments in wills".                     | External browser opens gov.uk inheritance/pension guidance link.                                                            |    |
| A-6 | Information content correct | Scroll through InformationCard bullet points.               | Mentions portfolios, ISAs, bonds, funds, and platforms/brokers.                                                             |    |

---

## B. Add Flow - Basic

| #   | Test                                   | Steps                                                                                     | Pass criteria                                                                                                                | Pass? |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| B-1 | Add investment - provider only         | Provider = "AJ Bell". Leave investment type blank. Select one beneficiary. Value = 15000. Save. | Asset saved with provider. Type defaults to "other". Value saved.                                                           |    |
| B-2 | Add investment - with type             | Provider = "Hargreaves Lansdown". Type = "ISA (Stocks & Shares)". Beneficiary = Jane. Value = 50000. Save. | Asset saved and displayed with type label in title.                                                                          |    |
| B-3 | Add investment - zero value            | Provider = "Vanguard". Type = "General Investment Account". Beneficiary = Bob. Leave value at 0. Save. | Save succeeds. `estimatedValue` saved as `0`.                                                                                |    |
| B-4 | Add investment - unsure value          | Provider = "Interactive Investor". Beneficiary = John. Tick "Unsure of balance". Save.   | Save succeeds. `estimatedValueUnknown === true`; value stored as `undefined`; `netValue` `undefined`.                      |    |
| B-5 | ISA from bank accounts appears         | Open Investments summary after creating ISA in Bank Accounts.                              | ISA added in Bank Accounts is visible in Investments list.                                                                   |    |
| B-6 | Header/button text in add mode         | Open entry with no `?id` param.                                                           | Header is "Add Investment". Button is "Add this investment".                                                                 |    |

---

## C. Investment Type Dropdown

| #   | Test                       | Steps                                  | Pass criteria                                                                                                                | Pass? |
| ----- | ---------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| C-1 | Type options listed        | Open "Investment Type" dropdown.       | Includes General Investment Account, AIM, ISA, Cash ISA, CREST, JISA, NS&I, Employee Share Scheme, Other.                  |    |
| C-2 | Optional type behavior     | Leave type blank and save valid asset. | Save works; type defaults to `other` in stored data.                                                                         |    |
| C-3 | Label used in display title | Save with type = "Cash ISA".           | Title includes provider and human-readable type label.                                                                       |    |

---

## D. Beneficiaries + Percentages

| #   | Test                                 | Steps                                                                                          | Pass criteria                                                                                                                | Pass? |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| D-1 | Beneficiary required                 | Fill provider only; do not pick beneficiary.                                                   | Submit disabled. Validation attention shows beneficiaries missing.                                                           |    |
| D-2 | Multi-beneficiary percentage split   | Add Jane 60% + Bob 40%, then save.                                                             | Save succeeds. Both beneficiaries stored with percentages.                                                                   |    |
| D-3 | Invalid percentage total blocked     | Add Jane 60% + Bob 30% (90% total). Try save.                                                  | Save blocked until total is 100%.                                                                                            |    |
| D-4 | Estate option available              | Open beneficiary selector.                                                                       | "The Estate" appears and can be selected.                                                                                    |    |
| D-5 | Will-maker exclusion                 | Open beneficiary selector with will-maker present in people list.                              | Will-maker is excluded from selectable beneficiaries.                                                                        |    |
| D-6 | Group selection flow                 | Open group drawer, create/select group, save investment.                                       | Group appears in selected beneficiaries and persists on save.                                                                |    |
| D-7 | Add person inline flow               | Use "+ Add person" in beneficiary flow, create person, auto-select, save.                     | New person is created and selected without losing form state.                                                                |    |

---

## E. Unsure of Balance

| #   | Test                           | Steps                                                                | Pass criteria                                                                                                                | Pass? |
| ----- | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| E-1 | Checkbox disables value field  | Tick "Unsure of balance".                                             | Currency field is disabled/dimmed.                                                                                           |    |
| E-2 | Toggling unsure resets value   | Enter value, then tick unsure.                                        | Value resets and save uses `estimatedValueUnknown`.                                                                          |    |
| E-3 | Typing value unticks unsure    | Tick unsure, then untick and enter value.                             | Value becomes editable and unsure flag is removed on save.                                                                   |    |
| E-4 | Edit round-trip with unsure    | Save with unsure. Reopen edit.                                        | Unsure state is preloaded correctly and behaves consistently when changed.                                                   |    |

---

## F. Edit Flow

| #   | Test                                | Steps                                                                      | Pass criteria                                                                                                                | Pass? |
| ----- | ------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| F-1 | Edit loads existing data            | From summary, open an existing investment for edit.                        | Provider/type/beneficiaries/value are pre-filled. Header is "Edit Investment".                                               |    |
| F-2 | Edit saves provider/type change     | Change provider and type, save.                                            | List updates immediately with new title/type.                                                                                |    |
| F-3 | Edit saves beneficiary percentages  | Update allocations (e.g., 70/30), save.                                    | Beneficiary assignment persists with updated percentages.                                                                     |    |
| F-4 | Edit saves value change             | Change value from 15000 to 25000, save.                                    | Updated value shown in summary and data.                                                                                     |    |
| F-5 | Net wealth toast on edit            | Edit an investment's value and save.                                       | Net wealth toast reflects delta from old value to new value.                                                                 |    |

---

## G. Delete Flow

| #   | Test                | Steps                                           | Pass criteria                                                                                                                | Pass? |
| ----- | --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| G-1 | Delete from summary | From summary, tap delete on an investment.      | Confirmation appears and action is cancellable.                                                                              |    |
| G-2 | Delete confirmed    | Confirm deletion.                               | Investment removed; total recalculates; storage no longer contains asset.                                                   |    |
| G-3 | Delete cancelled    | Cancel delete dialog.                           | Investment remains unchanged.                                                                                                |    |

---

## H. Validation

| #   | Test                                | Steps                                                                          | Pass criteria                                                                                                                | Pass? |
| ----- | ------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| H-1 | Provider required                   | Leave provider blank, fill beneficiaries, attempt save.                        | Save blocked/disabled until provider entered.                                                                                |    |
| H-2 | Beneficiaries required              | Fill provider, leave beneficiaries empty.                                      | Save blocked/disabled.                                                                                                       |    |
| H-3 | Percentage total required           | Use non-100 split and attempt save.                                            | Save blocked until total is exactly 100%.                                                                                    |    |
| H-4 | Validation attention trigger        | Tap ValidationAttentionButton when form invalid.                               | Attention label points to first invalid field and scrolls/focuses correctly where applicable.                               |    |
| H-5 | Value not required                  | Fill required fields; leave value at 0. Save.                                  | Save succeeds.                                                                                                               |    |

---

## I. Summary Screen

| #   | Test                               | Steps                                                                             | Pass criteria                                                                                                                | Pass? |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| I-1 | Summary shows all investments      | Add 3 investments with mixed types/beneficiaries and open summary.                | All items show correctly with names, beneficiaries, and values.                                                              |    |
| I-2 | Total value correct                | Add known values (e.g., 15000 + 50000 + 20000).                                   | Summary total equals expected sum (excluding unknown values if present).                                                     |    |
| I-3 | Empty state                        | Remove all investments and open summary.                                           | Empty state shown with add action.                                                                                            |    |
| I-4 | Add from summary                   | Tap "Add" from summary.                                                            | Opens add form in create mode.                                                                                                |    |
| I-5 | Edit from summary                  | Tap an existing investment card.                                                   | Opens edit form with `?id=` and pre-filled data.                                                                             |    |
| I-6 | Unknown balance handling in total  | Add one known value and one unsure value.                                          | Total behavior is correct and unknown value item is visibly distinguished.                                                   |    |
| I-7 | "That's everything" marks complete | From non-empty summary, tap completion CTA.                                        | Category marked complete and returns to expected dashboard/category flow.                                                    |    |

---

## J. Data Integrity + Navigation Edges

| #   | Test                              | Steps                                                                                 | Pass criteria                                                                                                                | Pass? |
| ----- | ----------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| J-1 | Stored type is investment         | Save any investment and inspect data explorer.                                         | `type === 'investment'`.                                                                                                     |    |
| J-2 | Beneficiaries stored unified      | Save with person/group/estate mix where possible.                                     | Uses unified `beneficiaryAssignments.beneficiaries[]` with id/type/percentage only.                                         |    |
| J-3 | Title generation logic            | Save one with type and one without type.                                               | With type: `Provider - TypeLabel`; without type: `Provider`.                                                                 |    |
| J-4 | Invalid edit id guarded           | Navigate to `/bequeathal/investment/entry?id=bad-id`.                                 | Redirects safely to investments summary (no crash).                                                                          |    |
| J-5 | Back from entry                   | Open entry, tap back.                                                                  | Returns to prior summary/flow without duplicate screens.                                                                      |    |
| J-6 | Back from summary                 | Open summary, tap back.                                                                | Returns to expected previous screen in estate flow.                                                                          |    |

---

## Summary - Manual Tests

| Section                         | Tests | Notes                                                |
| --------------------------------- | ------- | ------------------------------------------------------ |
| A - Intro screen               | 6     | Navigation + educational content                      |
| B - Add flow                   | 6     | Happy path + ISA carry-over                           |
| C - Type dropdown              | 3     | Options + optional default behavior                   |
| D - Beneficiaries/percentages  | 7     | Required field + percentage validation + groups       |
| E - Unsure of balance          | 4     | Disabled field + storage behavior                     |
| F - Edit flow                  | 5     | Prefill + updates + toast                             |
| G - Delete flow                | 3     | Confirmation + recalculation                          |
| H - Validation                 | 5     | Required fields + attention                           |
| I - Summary screen             | 7     | Display + totals + completion                         |
| J - Data + navigation edges    | 6     | Storage model + guard rails                           |
| **Total**                       | **52** |                                                      |

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
- default type to `'other'`
- beneficiaries persisted as id/type/percentage
- `estimatedValueUnknown` behavior
- `netValue` mirrors `estimatedValue`

### 4. Percentage validation integration

Test invalid totals (e.g., 90%, 110%) block save; valid 100% allows save.

### 5. Unsure balance mapping

Test `balanceNotSure ? undefined : Math.round(value)` and that unsure sets flag while removing numeric value.

### Estimated Jest scope

~10-14 assertions across ~6-8 test cases (more complex than crypto due to beneficiary percentage logic).
