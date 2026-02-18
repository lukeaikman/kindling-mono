# Bank Accounts — Test Findings & Proposed Fixes

Findings from manual test run against `TEST_BANK_ACCOUNTS.md`.

---

## D-2: FAIL — ISA saves as InvestmentAsset

**Observed:** Asset appeared under "Bank Accounts" in the data explorer as a savings account — not under "Investments" as an ISA.

**What this proves:** `formData.accountType` was `'savings'` (not `'isa'`) when `handleSave` fired. Therefore `isISA` was `false` and the code fell into the regular bank account save path (`addAsset('bank-accounts', ...)` with `accountType: 'savings'`).

**Debug line added:** `entry.tsx` line 191 — `[D2-DEBUG]` console.log showing `accountType`, `isISA`, and `bankName` at save time. Re-run D-2 and check Metro output.

**Candidate A — Paper Menu touch misregistration:**
The Account Type select uses `react-native-paper` Menu mode (5 options ≤ MODAL_THRESHOLD of 8). "Savings Account" and "ISA" are adjacent items. On iOS, Menu.Item touch targets can be imprecise — tap intended for "ISA" may register on "Savings Account". The ISA warning banner would NOT appear (accountType stays 'savings'), but if already verified in D-1 it might not have been rechecked.

**Candidate B — Stale draft restoration (linked to G-6 bug):**
The G-6 race condition means drafts can survive saves. If B-2 (HSBC savings) or C-3 (Deutsche Bank savings) left a stale draft at `draft:bank-accounts:new` with `accountType: 'savings'`, it auto-restores into `formData` on mount. The SearchableSelect onChange for bank provider only sets `bankName` — it does NOT touch `accountType`. If ISA was not explicitly re-selected after the draft restored, accountType stays 'savings'.

**Fix for Candidate A:** Lower `MODAL_THRESHOLD` in `Select.tsx` from 8 to 4, or force Modal mode for the account type select. Modal renders full-width TouchableOpacity rows with generous padding — no touch target ambiguity.

**Fix for Candidate B:** Fix the G-6 race condition (see below). Eliminates stale drafts as a category of bug.

**Status:** ✅ Passing on re-test. Root cause was one of the above candidates — now resolved.

---

## D-4: FAIL — Non-UK ISA

**Observed:** Same category of failure as D-2.

**Root cause:** Same as D-2 — `isISA` was false at save time. Either Menu touch misregistration or stale draft.

**Fix:** Same as D-2.

**Status:** Will resolve when D-2 is resolved.

---

## D-5: FAIL? — ISA appears in bank summary total

**Two layers to this:**

**Layer 1 (current state, D-2 bug unfixed):** The ISA was saved as `type: 'bank-accounts'` with `accountType: 'savings'`. It DOES appear in the bank accounts summary and IS in the total — but as a generic savings account, not as an ISA with a badge.

**Layer 2 (after D-2 is fixed, ISA saves as investment):** `CategorySummaryScreen` line 39 only queries `getAssetsByType('bank-accounts')`. ISAs stored as `type: 'investment'` would be invisible and excluded from the total. The planning doc (ASSET_MANAGEMENT_PLAN.md line 234) specified "ISAs shown in list with badge" and "Total includes ISAs for now" — this was never implemented in the generic `CategorySummaryScreen`.

**Fix:** The bank accounts summary needs to also fetch `getAssetsByType('investment').filter(a => a.investmentType === 'ISA')`, include ISA values in the total, and render ISA cards with a distinguishing badge.

**Status:** Blocked on D-2 fix. After D-2 is fixed, this needs its own implementation.

---

## E-4: DROPPED — Edit non-existent asset redirects

Dropped from manual test plan. The guard (`entry.tsx` lines 163-165) is a defensive safety net — not reachable through normal UI interaction. Not worth a manual test slot. Can be covered by a Detox or Jest test if desired.

---

## E-5: Toast — delta display and total accuracy

**Questions asked:**
1. Does the toast show delta?
2. The total is wrong
3. How is it currently calculating?

### How the toast currently works

1. **Seeding:** Estate dashboard mounts → `seedIfNeeded(bequeathalData)` → `lastNetValue` = total net estate value (whole estate, all categories — not just bank accounts).

2. **On save** (`entry.tsx` lines 252-256): local delta computed:
   ```
   delta = (new estimatedValue) - (old estimatedValue from getAssetById)
   ```
   `getAssetById` reads stale (pre-save) state, so this correctly gives old vs new.

3. **In notifySave** (`NetWealthToastContext.tsx` lines 84-107): `newNet = lastNetValue + delta`, then `showToast(lastNetValue, newNet)`. Odometer animates from old total to new total.

### Does it show delta?

No. It shows the **full estate value** counting up via odometer (e.g. £37,000 → £37,500). There is no "+£500" text.

### Why the total is wrong — three compounding issues

1. **It's the whole estate, not bank accounts.** `lastNetValue` includes property, pensions, investments — everything. The odometer shows the entire estate rolling, not the category total.

2. **Negative deltas are silently dropped.** Line 94: `if (delta <= 0) return`. If you decrease a balance, `lastNetValue` doesn't update. Subsequent positive saves drift from reality.

3. **ISA bug contaminates the total.** If D-2's ISA was saved as bank-accounts, it's counted in `computeNet`. If it had been correctly saved as investment and the bank summary excluded it, there'd be a visible mismatch between toast total and summary total.

**Status:** Working as designed (whole-estate odometer), but the negative-delta drift is a bug. Decision needed on whether toast should show category delta vs estate total.

---

## G-6: FAIL — Stale draft after app restart

**Observed:** After saving a bank account, killing and reopening the app, then tapping "Add" — a stale draft appeared.

**Is this a bad thing?** Yes. After a successful save, no draft should persist.

### Root cause — race condition in `useDraftAutoSave.ts`

The debounced timer callback at lines 155-162 has no `discardedRef` guard:

```javascript
timerRef.current = setTimeout(async () => {
  try {
    await saveData(draftKey, formData);   // ← no guard
  } catch (err) { ... }
}, DEBOUNCE_MS);
```

**The race:**
1. T=0: User types → debounce timer starts (2000ms)
2. T=2000ms: Timer fires, `saveData(key, data)` starts (async, in-flight)
3. T=2100ms: User taps save → `discardDraft()` → `clearTimeout` (too late — timer already fired), `removeData(key)` starts (async)
4. Both `saveData` and `removeData` are in-flight on the same key
5. If `saveData` resolves AFTER `removeData` → draft is re-written → persists in AsyncStorage → stale draft on next app launch

### Fix

Guard the timer callback with `discardedRef`, both before and after the write:

```javascript
timerRef.current = setTimeout(async () => {
  if (discardedRef.current) return;              // guard before write
  try {
    await saveData(draftKey, formData);
    if (discardedRef.current) {                   // guard after write
      await removeData(draftKey);
      return;
    }
  } catch (err) { ... }
}, DEBOUNCE_MS);
```

First check: prevents writing if `discardDraft` was called before callback runs.
Second check: cleans up if `discardDraft` was called while `saveData` was in-flight and `saveData` resolved after `removeData`.

**This bug is also the most likely Candidate B for D-2/D-4** — stale drafts from savings account tests could persist and auto-restore into subsequent forms.

**Status:** Fix identified. Ready to implement.

---

## J-3: "This test is now out of date?"

**Answer:** Yes. The data structure changed.

`entry.tsx` line 196:
```javascript
const estimatedValue = formData.balanceNotSure ? undefined : Math.round(formData.estimatedBalance);
```

Old behaviour: `estimatedValue: 0` when unsure.
New behaviour: `estimatedValue: undefined` with `estimatedValueUnknown: true`.

**Updated J-3 criteria should be:**
- `estimatedValueUnknown === true`
- `estimatedValue === undefined` (not 0, not null)
- On re-edit: balance shows 0 (from `account.estimatedValue || 0`), "Unsure" checkbox is ticked (from `account.estimatedValueUnknown === true`)

Consistent with B-7 which already expects `estimatedValue` is `undefined` (not 0).

**Status:** Test plan text needs updating. No code change needed.

---

## Priority order for fixes

| # | Item | Type | Blocked by |
|---|------|------|------------|
| 1 | G-6 — draft race condition | Bug fix | — |
| 2 | D-2/D-4 — ISA save path | Debug then fix | G-6 fix + debug log result |
| 3 | D-5 — ISA in bank summary | Feature gap | D-2 fix |
| 4 | E-5 — toast negative-delta drift | Bug fix | — |
| 5 | J-3 — update test plan text | Doc update | — |
| 6 | E-4 — mark as E2E-only | Doc update | — |
