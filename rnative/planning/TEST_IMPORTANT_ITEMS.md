# Important Items — Test Plan

**Entry form:** `app/bequeathal/important-items/entry.tsx`
**Intro screen:** `app/bequeathal/important-items/intro.tsx`
**Summary screen:** `app/bequeathal/important-items/summary.tsx` (generic `CategorySummaryScreen`)

---

## Precursor: Purge data before testing

1. Open developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Create test people in Onboarding → Family:
   - **Person 1:** John Smith (Spouse)
   - **Person 2:** Jane Doe (Daughter)
   - **Person 3:** Bob Smith (Son)
4. Confirm estate dashboard shows no assets
5. Select "Important Items" category and navigate in

---

# Part 1: Manual Tests

## A. Intro Screen


| #   | Test                            | Steps                                                            | Pass criteria                                                                                                             | Pass?                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | --------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | Intro screen renders            | Navigate to Important Items from estate dashboard (first visit). | Header "Important Items" with diamond icon. Video player visible. InformationCard with "Your Valuable Possessions".       | Pass                                                                                                                                                                                                                                                                                                                                                                  |
| A-2 | Start Adding navigates to entry | Tap "Start Adding Important Items".                              | Navigates to`/bequeathal/important-items/entry`. Entry form visible with "Add a valuable or sentimental item."            | Pass                                                                                                                                                                                                                                                                                                                                                                  |
| A-3 | Skip navigates to dashboard     | Tap "Skip for now".                                              | Navigates to estate dashboard.                                                                                            | Pass                                                                                                                                                                                                                                                                                                                                                                  |
| A-4 | Back button works               | Tap back arrow.                                                  | Returns to previous screen (estate dashboard or category picker).                                                         | Back button does work but transition is same swipe (right to left) as when we nav forward - should it not be the other way around?<br /><br /><br /><br /> Also, there is a quirk in that if I go to add my first item (from the intro explanation screen) then hit back, I get to important asset dashboard, but I should go back to intro screen in only that case. |
| A-5 | Information content correct     | Scroll through InformationCard.                                  | Shows numbered list: (1) very valuable items, (2) specific person to inherit. Mentions insured items and family disputes. | Pass                                                                                                                                                                                                                                                                                                                                                                  |

---

## B. Add Flow — Basic


| #   | Test                        | Steps                                                                                                                    | Pass criteria                                                                                                                                                       | Pass?                                                                                        |
| ----- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| B-1 | Add item — single person   | Title = "Wedding Ring". Beneficiary = Jane Doe (Daughter). Value = £2,500. Tap "Add this item".                         | Navigates to summary. Asset visible: title "Wedding Ring", value £2,500. Data viewer:`type === 'important-items'`, `estimatedValue === 2500`, `netValue === 2500`. | Passed on criteria but note extra notes re person we saved against                           |
| B-2 | Add item — multiple people | Title = "Grandfather Clock". Beneficiaries = John Smith + Bob Smith. Value = £8,000. Save.                              | Asset saved.`beneficiaryAssignments.beneficiaries` has 2 entries. Both type `person`.                                                                               | Yes, but instead of just saving IDs of people, we save name, etc, as a blob - why? See notes |
| B-3 | Add item — The Estate      | Title = "Antique Desk". Beneficiary = The Estate. Value = £1,200. Save.                                                 | Asset saved. Beneficiary entry:`id === 'estate'`, `type === 'estate'`.                                                                                              | It is saved that way, but is this sensible?                                                  |
| B-4 | Add item — Estate + person | Title = "Art Collection". Beneficiaries = The Estate + Jane Doe. Value = £15,000. Save.                                 | Asset saved. Two beneficiary entries: one estate, one person.                                                                                                       | Pass                                                                                         |
| B-5 | Add item — group           | Create a beneficiary group first (see C-5). Title = "Family Photo Albums". Beneficiary = the group. Value = £500. Save. | Asset saved. Beneficiary entry:`type === 'group'`.                                                                                                                  | Yes                                                                                          |
| B-6 | Value rounding              | Title = "Silver Cutlery". Any beneficiary. Value = £3,456.78. Save.                                                     | `estimatedValue === 3457` (rounded to nearest £1).                                                                                                                 | Pass                                                                                         |
| B-7 | Header says "Add Item"      | Navigate to entry form with no`?id` param.                                                                               | Header title is "Add Item". Form title is "Add a valuable or sentimental item." Button says "Add this item".                                                        | Pass                                                                                         |

---

## C. Beneficiary Selection


| #   | Test                       | Steps                                                                                                     | Pass criteria                                                                                    | Pass?                                                                                     |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| C-1 | Will-maker excluded        | Open beneficiary selector dropdown.                                                                       | Will-maker (yourself) is NOT in the list. Only family members, groups, and The Estate are shown. | Pass                                                                                      |
| C-2 | The Estate at top of list  | Open beneficiary selector dropdown.                                                                       | "The Estate" appears at top of dropdown with separator below it.                                 | Pass                                                                                      |
| C-3 | Person shows as chip       | Select "John Smith (Spouse)" from dropdown.                                                               | John appears as a chip/tag above the dropdown. Chip shows name and relationship.                 | Pass                                                                                      |
| C-4 | Multi-select works         | Select John Smith, then select Jane Doe.                                                                  | Both appear as chips. Dropdown remains usable for further selections.                            | Pass                                                                                      |
| C-5 | Create group via drawer    | Tap "Create / Manage Groups" in beneficiary dropdown. Select "Bloodline Children" template. Create group. | Drawer closes. Group appears as chip in beneficiaries. Group icon visible.                       | Fail - Group creates but is not added as chip without re-opening drop down and selecting. |
| C-6 | Add new person via dialog  | Tap "Add New Person" in beneficiary dropdown. Fill in name and relationship. Create.                      | Dialog closes. New person appears as chip in beneficiaries.                                      | Fail see notes                                                                            |
| C-7 | Remove beneficiary chip    | Add two beneficiaries. Tap X on one chip.                                                                 | Chip removed. Only one beneficiary remains.                                                      | Pass                                                                                      |
| C-8 | Estate as sole beneficiary | Select only "The Estate". No other beneficiaries.                                                         | Save succeeds. Only one beneficiary entry in data:`type === 'estate'`.                           | Pass                                                                                      |

## D. Edit Flow


| #   | Test                            | Steps                                                                                                         | Pass criteria                                                                                                                                 | Pass?                   |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| D-1 | Edit loads existing data        | From summary, tap edit on "Wedding Ring" from B-1.                                                            | Form shows: title "Wedding Ring", beneficiary chip "Jane Doe (Daughter)", value £2,500. Header says "Edit Item". Button says "Save changes". | Pass                    |
| D-2 | Edit saves value change         | Change value from £2,500 to £5,000. Save.                                                                   | Summary shows £5,000. Data viewer:`estimatedValue === 5000`.                                                                                 | Pass                    |
| D-3 | Edit saves title change         | Edit "Wedding Ring". Change title to "Engagement Ring". Save.                                                 | Summary shows "Engagement Ring". Data viewer:`title === 'Engagement Ring'`.                                                                   | Pass                    |
| D-4 | Edit saves beneficiary change   | Edit an item. Remove Jane Doe. Add Bob Smith. Save.                                                           | Beneficiary updated in data viewer. Jane's ID gone, Bob's ID present.                                                                         | Pass                    |
| D-5 | Edit — add extra beneficiary   | Edit B-1 item (single beneficiary). Add The Estate as second beneficiary. Save.                               | Now two beneficiary entries. Both visible in data viewer.                                                                                     | Pass                    |
| D-6 | Edit — beneficiary names fresh | Edit an item with John Smith. In another tab/session, rename John to "Jonathan". Return and re-edit the item. | Chip shows "Jonathan Smith" (looked up fresh from Person record, not cached from beneficiaryAssignments).                                     | Redundant Test - delete |
| D-7 | Net wealth toast on edit        | Edit an item worth £2,500. Change to £5,000. Save.                                                          | Net wealth toast fires showing the updated estate total.                                                                                      | Fail                    |

---

## E. Delete Flow


| #   | Test                | Steps                                         | Pass criteria                                                                      | Pass? |
| ----- | --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ | ------- |
| E-1 | Delete from summary | From summary, tap delete (X icon) on an item. | Confirmation alert: "Delete asset" / "Are you sure you want to remove this asset?" | Pass  |
| E-2 | Delete confirmed    | Confirm deletion.                             | Item removed from list. Total recalculated. Data viewer confirms asset gone.       | Pass  |
| E-3 | Delete cancelled    | Tap cancel on delete confirmation.            | Item still in list. No changes.                                                    | Pass  |

---

## F. Validation


| #   | Test                           | Steps                                                                    | Pass criteria                                                                              | Pass?                                                                                                                                                                                                                                                                       |
| ----- | -------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1 | Title required                 | Leave title blank. Select beneficiary. Enter value. Check submit button. | Submit button disabled. Attention label shows "Title" required.                            | Fail - we get the 'just one more thing, but no visual indicator of which fields - do we have a pattern where we change input outline to red or something on fields required when someone taps on a disabled button, or on a "Three little things left" marker under button? |
| F-2 | Beneficiary required           | Enter title. Leave beneficiary empty. Enter value.                       | Submit button disabled. Attention label shows "Beneficiaries" required.                    | Pass again, in that we're blocking submissing but same lack of considerate UX as in F1                                                                                                                                                                                      |
| F-3 | Value required (> 0)           | Enter title. Select beneficiary. Leave value at 0.                       | Submit button disabled. Attention label shows "Estimated Value" required.                  | Why does value need to be greater than £0? This is a business logic question for debate. There may be no value, but the willmaker may want to specify where it goes.                                                                                                       |
| F-4 | All three missing              | Open fresh form. Don't fill anything. Tap attention label.               | Attention label shows first invalid field. ScrollView scrolls to relevant field.           | Same as F1 (note as it's a short form and all fits on one page, there is no 'scroll to field')                                                                                                                                                                              |
| F-5 | Whitespace-only title rejected | Enter "   " (spaces only) as title. Fill other fields.                   | Submit button disabled. Title fails`trim()` validation.                                    | Pass                                                                                                                                                                                                                                                                        |
| F-6 | Negative value rejected        | Enter title + beneficiary. Try entering negative value in CurrencyInput. | CurrencyInput should prevent negative entry (numeric keyboard). Value stays 0 or positive. | Pass                                                                                                                                                                                                                                                                        |

---

## G. Summary Screen


| #   | Test                          | Steps                                                              | Pass criteria                                                                                             | Pass? |
| ----- | ------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| G-1 | Summary shows all items       | Add 3 items with different titles. Go to summary.                  | All 3 visible with correct titles and values.                                                             |       |
| G-2 | Total value correct           | Add items worth £2,500 + £8,000 + £1,200. Check summary banner. | Total shows £11,700. Count shows "Value of 3 Important Items".                                           |       |
| G-3 | Empty state                   | Clear all items. Go to summary.                                    | Shows empty state: diamond icon, "Nothing here yet", "Add important items" button.                        |       |
| G-4 | Add from summary              | From summary, tap "Add another".                                   | Navigates to entry form. Fresh form (no ?id param).                                                       |       |
| G-5 | "That's everything" completes | From summary with items, tap "That's everything".                  | Category marked complete. Navigates to estate dashboard. Estate dashboard card shows tick/complete state. |       |
| G-6 | Edit from summary             | From summary, tap on an item card.                                 | Navigates to entry form with`?id=` param. Form pre-filled.                                                |       |

---

## H. Data Integrity


| #   | Test                            | Steps                                                                | Pass criteria                                                                                                                                          | Pass? |
| ----- | --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| H-1 | Beneficiary stores id + type    | Add item with John Smith. Check data viewer.                         | `beneficiaryAssignments.beneficiaries[0]` has `id` (John's person ID) and `type: 'person'`. Name field may be present but is NOT the canonical source. |       |
| H-2 | Estate beneficiary structure    | Add item with The Estate. Check data viewer.                         | Beneficiary:`id === 'estate'`, `type === 'estate'`.                                                                                                    |       |
| H-3 | Group beneficiary structure     | Add item with a group. Check data viewer.                            | Beneficiary:`id` matches group ID, `type === 'group'`.                                                                                                 |       |
| H-4 | Asset type correct              | Add any item. Check data viewer.                                     | `type === 'important-items'`. Not `important-item` (singular). Not `valuable-items` or similar.                                                        |       |
| H-5 | Title trimmed on save           | Enter title "  Grandfather Clock  " (leading/trailing spaces). Save. | Data viewer:`title === 'Grandfather Clock'` (trimmed).                                                                                                 |       |
| H-6 | netValue matches estimatedValue | Add item worth £5,000. Check data viewer.                           | `estimatedValue === 5000`, `netValue === 5000`. Both identical.                                                                                        |       |

---

## I. Navigation Edge Cases


| #   | Test                             | Steps                                                                                            | Pass criteria                                                         | Pass? |
| ----- | ---------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| I-1 | Back from entry goes to summary  | From entry form, tap back button.                                                                | Navigates to`/bequeathal/important-items/summary`.                    |       |
| I-2 | Back from summary goes to estate | From summary, tap back button.                                                                   | Navigates to`/estate-dashboard`.                                      |       |
| I-3 | Invalid edit ID redirects        | Navigate to`/bequeathal/important-items/entry?id=nonexistent-id`.                                | Redirects to summary (guard in useEffect).                            |       |
| I-4 | Wrong asset type redirects       | Find a bank account asset ID. Navigate to`/bequeathal/important-items/entry?id={bankAccountId}`. | Redirects to summary (type guard:`asset.type !== 'important-items'`). |       |

---

## Summary — Manual Tests


| Section                    | Tests  | Notes                                    |
| ---------------------------- | -------- | ------------------------------------------ |
| A — Intro screen          | 5      | Navigation + content                     |
| B — Add flow              | 7      | Core happy path + rounding               |
| C — Beneficiary selection | 8      | Person, group, estate, multi, will-maker |
| D — Edit flow             | 7      | Load + update + beneficiary changes      |
| E — Delete flow           | 3      | CRUD completion                          |
| F — Validation            | 6      | Required fields + edge cases             |
| G — Summary screen        | 6      | Display + totals + completion            |
| H — Data integrity        | 6      | Storage structure + trimming             |
| I — Navigation edges      | 4      | Guards + routing                         |
| **Total**                  | **52** |                                          |

---

# Part 2: Jest Unit Tests

## Candidates for Jest

### 1. canSubmit logic

Test: `formData.title.trim() && formData.beneficiaries.length > 0 && formData.estimatedValue > 0`.
Cases: all empty, title only, title + beneficiary, all filled, whitespace title.

### 2. Value rounding

Test: `Math.round(formData.estimatedValue)` produces correct results for various decimal inputs.

### 3. Save data mapping

Extract and test: the `itemData` object is built correctly from form state, including `beneficiaryAssignments` structure with only `id`, `type`, `name`.

### 4. Beneficiary edit loading

Test: given stored beneficiary assignments, the edit loader correctly maps estate, person, and group entries back into `BeneficiarySelection[]` with looked-up names.

### 5. Title display helper

Test: `getAssetTitle()` returns `asset.title` or fallback `'Important Item'` when title missing.

### Estimated Jest scope

~12-15 assertions across ~6-8 test cases. Would require extracting the save data builder and canSubmit logic into a testable pure function, similar to the `bankAccountMapping.ts` pattern proposed for bank accounts.
