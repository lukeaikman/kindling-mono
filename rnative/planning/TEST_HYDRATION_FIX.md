# Test: Estate Remainder Hydration Fix

**What changed:** Fixed a race condition where residual beneficiary data could be lost on app restart, and the will dashboard could incorrectly show "Your People" as incomplete.

**Files touched:**
- `src/hooks/useAppState.ts` — hydration flags, migration guard, empty-key fix
- `app/will-dashboard.tsx` — gated content on `isAppStateReady`
- `app/bequeathal/estate-remainder-who.tsx` — gated on `isAppStateReady`
- `src/types/index.ts` — removed dead `Beneficiary` interface

---

## A. Regression: Did We Break Anything?

### A-1: New user (fresh install / no data)
1. Purge all data via developer dashboard
2. Restart the app
3. **Expected:** Will dashboard loads normally, shows "Your People: Not started", "Your Estate" disabled. No blank screen, no infinite spinner.
- [ ] Pass

### A-2: Existing user cold start
1. With an existing user who has completed at least the onboarding, force-quit the app
2. Reopen the app
3. **Expected:** Will dashboard loads within ~1 second. No flash of incorrect status. Stage cards show correct state immediately.
- [ ] Pass

### A-3: TypeScript compilation
1. Run `npx tsc --noEmit` in `native-app/`
2. **Expected:** No new errors. (The removed `Beneficiary` type was unused.)
- [ ] Pass

### A-4: Estate dashboard still works
1. Navigate to Your Estate dashboard
2. **Expected:** Asset categories load correctly. No blank screen. `isBequeathalHydrated` gate still works as before.
- [ ] Pass

### A-5: Developer data explorer
1. Open developer dashboard > data explorer
2. Check person data, will data, estate remainder data all load
3. **Expected:** All data visible, no empty states that should have data.
- [ ] Pass

---

## B. Fix Verification: Residue Persists Across Restarts

### B-1: Residue survives cold start
1. Complete the people section including residue allocation (select 2+ people, set splits)
2. Confirm "Your People" shows as "Complete" on dashboard
3. Force-quit the app completely
4. Reopen the app
5. **Expected:** Dashboard shows "Your People: Complete". "Your Estate" is NOT disabled.
- [ ] Pass

### B-2: Residue data intact after restart
1. From the dashboard, tap "Your People" to reach the people summary
2. Check the "Residue" card
3. **Expected:** Shows the correct names and percentages you entered before quitting.
- [ ] Pass

### B-3: Estate remainder edit screen loads correctly
1. From the people summary, tap "Edit" on the Residue card
2. **Expected:** The estate-remainder-who screen shows your previously selected people/groups as checked.
- [ ] Pass

### B-4: Re-edit and re-save
1. From B-3, change a selection (add or remove a person)
2. Tap Next, adjust splits, complete the flow
3. Force-quit and reopen
4. **Expected:** New selections persist. Dashboard still shows "Complete".
- [ ] Pass

---

## C. Fix Verification: Migration Doesn't Destroy Data

### C-1: Console log check
1. Open the app with React Native debugger / Metro logs visible
2. Watch for `Multi-user + bequest migration complete`
3. **Expected:** The log appears ONCE, NOT before estate remainder data has loaded. You should NOT see the migration log followed by empty estate remainder state.
- [ ] Pass

---

## D. Edge Cases

### D-1: Only one residue beneficiary
1. Set exactly one person as residue beneficiary (100%)
2. Restart
3. **Expected:** Persists. People section still "Complete".
- [ ] Pass

### D-2: Groups as residue beneficiaries
1. Select a group (e.g. "Children") as a residue beneficiary
2. Restart
3. **Expected:** Group selection persists. Summary card shows group name.
- [ ] Pass

### D-3: Purge and rebuild
1. Purge all data
2. Go through the full onboarding + people flow from scratch
3. **Expected:** Everything works as before. No errors. Residue persists after restart.
- [ ] Pass

---

## Results

| Section | Pass/Fail | Notes |
|---------|-----------|-------|
| A-1 New user | | |
| A-2 Cold start | | |
| A-3 TypeScript | | |
| A-4 Estate dashboard | | |
| A-5 Data explorer | | |
| B-1 Residue survives restart | | |
| B-2 Data intact | | |
| B-3 Edit screen loads | | |
| B-4 Re-edit persists | | |
| C-1 Migration log | | |
| D-1 Single beneficiary | | |
| D-2 Group beneficiary | | |
| D-3 Purge and rebuild | | |
