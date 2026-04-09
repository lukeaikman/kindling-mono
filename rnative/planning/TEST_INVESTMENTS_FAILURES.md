# Investments — Failed & Flagged Tests

Extracted from `TEST_INVESTMENTS.md` manual testing.
Items are grouped by severity: **Fails**, **Behaviour Changes from Recent Fix**, **Bugs / Feature Requests**, **Test Housekeeping**.

---

## 1. Hard Fails

### M-4 — Rule 4: all unlocked equal auto-evens - RESOLVED - NO ACTION NEEDED

### K-1 — Single 0% triggers dialog - SORTED


|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Steps**      | Add one beneficiary (Jane) at 0%. Fill provider. Tap save.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Expected**   | Dialog appears: "You added Jane Doe as a beneficiary but allocated them a 0% share."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Result**     | **Fail** — button is disabled. Validation should show "one last thing" and red border on beneficiary cards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Root cause** | When there is only one beneficiary at 0%, the total is 0%, so the percentage-total validation fires first and disables the submit button. The zero-percent guard never gets a chance to run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Action**     | **Design decision needed.** Options: (a) allow the zero-percent guard to fire even when total != 100% (but this could confuse users since two things are wrong); (b) show validation attention that explicitly says "beneficiary at 0%" alongside the total issue; (c) accept current behaviour — save is blocked, user sees "percentages must total 100%", which implicitly covers the 0% case. Recommend **(c)** — the 0% guard is a safety net for cases that slip through (e.g. Jane 0% + Bob 100% = valid total but useless allocation). A single beneficiary at 0% is already caught by the total check. Mark test as **expected behaviour** and update pass criteria. |

---

## 2. Behaviour Changes from Recent Fix (Retest Required)

The fix that removed auto-locking on typing (`handleUpdateAllocation` no longer sets `isManuallyEdited: true`) changes the expected behaviour of two previously-passing tests. Their pass criteria need updating.

### L-8 — Percentage input works


|                   |                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Old criteria**  | Input accepts full number, displays "75",**padlock locks** (filled circle, white icon).                                        |
| **New behaviour** | Input accepts full number, displays "75",**padlock stays open** — locking is now padlock-tap only.                            |
| **Action**        | **Update test criteria.** Change to: "Input accepts full number, displays '75'. Padlock remains open (unlocked)." Then retest. |

### L-10 — Padlock locks on manual % edit


|                   |                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Old criteria**  | Type a percentage value → padlock icon switches to locked.                                                                                                                                                                |
| **New behaviour** | Type a percentage value → padlock remains open. Locking requires explicit padlock tap.                                                                                                                                    |
| **Action**        | **Remove or repurpose test.** This test no longer applies. Replace with: "L-10: Padlock only locks via tap — Type a percentage value into input. Verify padlock remains open. Tap padlock. Verify it locks." Then retest. |

---

## 3. Bugs / Feature Requests (Pass with Comments)

### D-3 — Invalid percentage total blocked - RESOLVED NOW BY WIZARD - NO ACTION NEEDED


|             |                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Pass — but with feature request.                                                                                                                                                                                                                                                                                                                                        |
| **Comment** | "We need to pop up a dialogue that says 'Total distribution does not equal 100%. Would you like to: [Scale %s to 100%] [Give remainder to estate (ONLY if under 100%)] [Edit myself]'"                                                                                                                                                                                   |
| **Action**  | **Superseded by 100% Wizard.** The wizard now handles scaling/distribution interactively. The "give remainder to estate" option was not included in the wizard spec. **Decision needed:** is "give remainder to estate" still wanted as a wizard option, or is the current wizard sufficient? If wanted, add as a Rule 6 or as an additional button in the Rule 5 popup. |

### D-6 — Group selection flow - SORTED


|             |                                                                                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Pass — but with bug.                                                                                                                                                                                                                                    |
| **Comment** | "Group can be added twice. The already-added group is excluded from the original selection drawer, but if I click '+Create/Manage Groups' I can add the already-added group again from there."                                                           |
| **Action**  | **Bug fix needed** in the group management/selection drawer. When returning from "+Create/Manage Groups", the drawer should exclude already-selected groups. This is a shared component issue — likely affects all asset categories with beneficiaries. |

### H-3 — Percentage total required - SORTED


|             |                                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Pass — but with rounding concern.                                                                                                                                             |
| **Comment** | "We round to two decimal places when we 'scale to 100%' which occasionally leaves us slightly off total. We need a tolerance or solve the scaling."                            |
| **Action**  | **Fixed.** `applyWizardRounding` now absorbs the remainder into the last beneficiary, and validation tolerance widened to `<= 0.01`. Retest to confirm this is fully resolved. |

### H-5 — Value not required - SORTED


|             |                                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Pass — with note to update test text.                                                                                                                                                       |
| **Comment** | "There is no 0 as default, so leaving it is unknown — update text of test here."                                                                                                            |
| **Action**  | **Update test description.** Change B-3/H-5 language to reflect that leaving value blank saves as `estimatedValueUnknown: true`, not `estimatedValue: 0`. This was fixed in a prior session. |

### I-1 — Summary shows all investments - SORTED


|             |                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Pass — with criteria mismatch.                                                                                                           |
| **Comment** | "Summary does not show beneficiaries, but that's by design. Unless I'm mistaken, please amend the text here."                             |
| **Action**  | **Update test criteria.** Remove "beneficiaries" from pass criteria. Change to: "All items show correctly with names, types, and values." |

### K-4 — Multiple 0% triggers multi message


|             |                                                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Pass — with copy change request.                                                                                                                                                                                                      |
| **Comment** | "Change button copy to 'Save & Remove 0% beneficiaries'."                                                                                                                                                                              |
| **Action**  | **Code change needed** in `detectZeroPercentBeneficiaries` (`beneficiaryHelpers.ts`). Update the `confirmLabel` for the multi-beneficiary case from "Save & Remove N Beneficiaries" to "Save & Remove 0% Beneficiaries". Small change. |

### K-7 — Guard runs after 100% validation


|             |                                                                                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Noted — button disabled as less than 100%.                                                                                                                                                                                                                                   |
| **Comment** | "Which is fine, but need validation in as mentioned in a test comment above."                                                                                                                                                                                                 |
| **Action**  | **Same as K-1 decision.** If the total isn't 100%, save is disabled and validation attention fires. The zero-percent guard only needs to catch cases where total = 100% but some beneficiaries are at 0%. Current behaviour is correct. Update test criteria to reflect this. |

---

## 4. Test Housekeeping (Redundant / Defunct / Queries)

### E-3 — Typing value unticks unsure


|             |                                                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Defunct.                                                                                                                                                                                                                                        |
| **Comment** | "Text box is disabled while unsure value is ticked."                                                                                                                                                                                            |
| **Action**  | **Remove or mark as N/A.** The test describes behaviour that can't occur — the input is disabled when "unsure" is ticked, so the user can't type into it. The correct flow is: untick unsure first, then type. This is already covered by E-2. |

### E-4 — Edit round-trip with unsure


|            |                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Status** | Not tested (blank).                                                                                                         |
| **Action** | **Test this.** It's a valid test — save with unsure, reopen, verify unsure checkbox is ticked and value field is disabled. |

### J-3 — Title generation logic


|             |                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Query.                                                                                                                                                                                      |
| **Comment** | "This is not how we generate titles I don't think?"                                                                                                                                         |
| **Action**  | **Verify and update.** Check `assetDisplayFields.ts` → `getAssetSubline` and the title generation in `entry.tsx` to confirm actual format, then update the test criteria to match reality. |

### J-4 — Invalid edit id guarded


|            |                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Status** | Query — "Redundant test - mobile app?"                                                                                        |
| **Action** | **Remove.** This is a deep-link / URL-bar scenario that doesn't apply to a native mobile app. Users can't type arbitrary URLs. |

### K-2 / K-3 — Save & Remove / Back from K-1 dialog


|             |                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Marked "Redundant test".                                                                                                                                          |
| **Comment** | Since K-1 fails (dialog never appears), these can't be tested.                                                                                                    |
| **Action**  | **Keep but defer.** If K-1 is resolved or reclassified, K-2 and K-3 become valid tests of the dialog's buttons. Don't remove — just note they're blocked by K-1. |

---

## Summary


| Category                | Count         | Action                                                                                  |
| ------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| Hard fails              | 2 (M-4, K-1)  | M-4: retest after fix. K-1: design decision needed.                                     |
| Behaviour changes       | 2 (L-8, L-10) | Update criteria + retest.                                                               |
| Bugs / feature requests | 7             | 2 fixed (H-3, H-5 text), 3 need code (D-6, K-4, I-1 text), 2 need decisions (D-3, K-7). |
| Housekeeping            | 5             | Remove 2 (E-3, J-4), test 1 (E-4), verify 1 (J-3), defer 2 (K-2/K-3).                   |
| **Total flagged**       | **16**        |                                                                                         |
