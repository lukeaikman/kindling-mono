# Testing Plan: Asset Management Phases 5-9.5

**Created:** December 2024  
**Purpose:** Step-by-step manual testing plan for asset management implementation  
**Scope:** Phases 5-9.5 (Bank Accounts, Important Items, Cryptocurrency, Investments, Pensions, Unified Beneficiary Model)

---

## Pre-Testing Setup

### 1. Clear App Data
- Open app → Developer Dashboard
- Tap "Purge All Data"
- Confirm data cleared
- **Expected:** All AsyncStorage keys cleared

### 2. Create Test People
- Go to Onboarding → Family
- Add:
  - **Person 1:** John Smith (Spouse)
  - **Person 2:** Jane Doe (Daughter) 
  - **Person 3:** Bob Smith (Son)
- **Expected:** 3 people saved in AsyncStorage

### 3. Create Test Group
- Go to Developer Dashboard → Component Sandbox
- Tap "Manage Groups"
- Select template "Bloodline Children"
- Create group
- **Expected:** Group appears in MultiBeneficiarySelector dropdowns

---

## Phase 5: Bank Accounts Testing ✅ COMPLETE

> Tested and passed — see `TEST_BANK_ACCOUNTS.md` for full results.

### Test 5.1: Bank Accounts Intro Screen
**Path:** Assets & Bequests → Bank Accounts (Intro)

**Steps:**
1. Verify video player visible at top
2. Scroll through content
3. Tap "Learn more" link → Opens external browser
4. Tap "Skip for now" → Goes to next selected category
5. Go back, tap "Let's Go" → Goes to Bank Accounts Entry

**Expected:**
- ✅ Video loads and plays
- ✅ InformationCard shows "Estimate the Balances" content
- ✅ Morphic background visible
- ✅ Navigation works

### Test 5.2: Add UK Bank Account
**Path:** Bank Accounts Entry

**Steps:**
1. Select "Held With": Barclays
2. Select "Account Type": Current Account
3. Select "Ownership": Personal Account
4. Enter "Account Number": 12345678
5. Enter "Estimated Balance": 5000
6. Tap "Add Account"

**Expected:**
- ✅ Form visible initially
- ✅ All fields populate correctly
- ✅ After submit: Form hides, account appears in list
- ✅ Account shows: "Barclays | Current Account - 12345678 | £5,000"
- ✅ "Add Another Account" button appears
- ✅ "Continue" button appears
- ✅ "Accounts Total: £5,000" appears under last card

**Verify AsyncStorage:**
```json
{
  "type": "bank-accounts",
  "provider": "Barclays",
  "accountType": "current",
  "ownershipType": "personal",
  "accountNumber": "12345678",
  "estimatedValue": 5000,
  "netValue": 5000
}
```

### Test 5.3: Add ISA (Routes to Investments)
**Steps:**
1. Tap "Add Another Account"
2. Select "Held With": HSBC
3. Select "Account Type": ISA
4. **Notice:** Ownership field disappears
5. **Notice:** Green warning badge appears: "This will be saved under Investments..."
6. Enter "Account Number": 87654321
7. Enter "Estimated Balance": 20000
8. Tap "Add Account"

**Expected:**
- ✅ ISA appears in Bank Accounts list with green badge "Will appear under Investments"
- ✅ Accounts Total: £25,000 (includes ISA)

**Verify AsyncStorage (saved as investment):**
```json
{
  "type": "investment",
  "investmentType": "ISA",
  "provider": "HSBC",
  "accountNumber": "87654321",
  "estimatedValue": 20000
}
```

### Test 5.4: "Unsure of Balance" Checkbox
**Steps:**
1. Tap "Add Another Account"
2. Select bank, account type
3. Check "Unsure of balance"
4. **Notice:** Estimated Balance field greyed out
5. Uncheck "Unsure of balance"
6. **Notice:** Field becomes active
7. Enter value, submit

**Expected:**
- ✅ Checkbox disables/enables field
- ✅ Checked = £0 saved
- ✅ Unchecked = user value saved

### Test 5.5: Account Number Validation
**Steps:**
1. Add account
2. Enter account number: "12" (too short)
3. Tap submit
4. **Expected:** Alert: "UK account numbers must be 3-8 digits"
5. Enter: "123456789" (too long - 9 digits)
6. **Notice:** Only 8 digits entered (maxLength enforced)
7. Enter: "12345" (valid)
8. Submit successfully

**Expected:**
- ✅ 3-8 digit validation works
- ✅ Only numeric input allowed

### Test 5.6: Continue to Next Category
**Steps:**
1. Tap "Continue"
2. **Expected:** Navigate to next selected category (or order-of-things if none)

---

## Phase 6: Important Items Testing ✅ COMPLETE

> Tested and passed — see `TEST_IMPORTANT_ITEMS.md` for full results.

### Test 6.1: Important Items Entry
**Path:** Important Items Entry

**Steps:**
1. Enter "What's the item?": Wedding Ring
2. Tap "Who will receive this?" dropdown
3. Select "John Smith (Spouse)"
4. **Notice:** John appears as chip above dropdown
5. Tap dropdown again, select "🏛️ The Estate"
6. **Notice:** "The Estate" at top of dropdown list
7. **Notice:** Separator line below it
8. **Notice:** The Estate appears as chip
9. Enter "What's it worth?": 2500
10. Tap "Add Item"

**Expected:**
- ✅ Item appears in list below form
- ✅ Shows: "Wedding Ring | For: John Smith (Spouse), The Estate | £2,500"
- ✅ Auto-scrolls to bottom
- ✅ "Add Another Item" button appears
- ✅ "Valuables Total: £2,500" appears

**Verify AsyncStorage:**
```json
{
  "type": "important-items",
  "title": "Wedding Ring",
  "estimatedValue": 2500,
  "beneficiaryAssignments": {
    "beneficiaries": [
      { "id": "person-123", "type": "person" },
      { "id": "estate", "type": "estate" }
    ]
  }
}
```

**Verify:** NO name/relationship fields stored (looked up on display)

### Test 6.2: Create Beneficiary Group
**Steps:**
1. Tap "Who will receive this?" dropdown
2. Select "+ Create / Manage Groups"
3. **Expected:** Group Management Drawer opens
4. **If no groups:** See introduction text
5. Tap "Choose a Group template" accordion
6. Select "Bloodline Children"
7. **Notice:** Name and description auto-fill
8. Edit description if desired
9. Tap "Create Group"

**Expected:**
- ✅ Group created
- ✅ Drawer closes
- ✅ "Bloodline Children" appears as chip in beneficiaries
- ✅ Group icon (👥) shows

**Verify AsyncStorage:**
```json
{
  "id": "group-xxx",
  "name": "Bloodline Children",
  "description": "Your biological and legally adopted children only",
  "isPredefined": false,
  "isActive": true,
  "willId": "user-id"
}
```

### Test 6.3: Will-Maker Exclusion
**Steps:**
1. Open "Who will receive this?" dropdown
2. **Expected:** Will-maker (yourself) NOT in list
3. **Expected:** Only shows: Family members, groups, The Estate
4. **Expected:** Can't inherit from yourself

### Test 6.4: Edit Item
**Steps:**
1. Tap pencil icon on existing item
2. **Notice:** Form pre-fills with item data
3. **Notice:** Beneficiaries reload correctly
4. Change value to 3000
5. Tap "Update Item"

**Expected:**
- ✅ Item updates in list
- ✅ Valuables Total updates
- ✅ Edit mode exits

---

## Phase 7: Cryptocurrency Testing ✅ COMPLETE

> Tested and passed — see `TEST_CRYPTO_CURRENCY.md` for full results.

### Test 7.1: Add Crypto Account
**Path:** Cryptocurrency Entry

**Steps:**
1. Select "Platform or Wallet": Coinbase
2. Enter "Account Username/ID": john@email.com
3. Enter "Estimated Value": 15000
4. Check "Unsure of balance" → Value clears
5. Uncheck → Enter 15000 again
6. Enter "Notes": "Main trading account"
7. Tap "Add Holding"

**Expected:**
- ✅ Holding appears: "Coinbase | john@email.com | £15,000"
- ✅ Notes field shown
- ✅ Crypto Total: £15,000

**Verify AsyncStorage:**
```json
{
  "type": "crypto-currency",
  "platform": "Coinbase",
  "accountUsername": "john@email.com",
  "notes": "Main trading account",
  "estimatedValue": 15000
}
```

---

## Phase 8: Investments Testing ✅ COMPLETE

> Tested and passed — see `TEST_INVESTMENTS.md` for full results (101 manual tests).
> Includes redesigned BeneficiaryWithPercentages component, 100% Wizard, and GroupManagementDrawer.

### Test 8.1: ISA Integration
**Path:** Investments Entry

**On Load:**
- **Expected:** ISA from Phase 5 (HSBC - £20,000) appears in list
- **Expected:** Shows: "HSBC - ISA | For: The Estate | £20,000"

### Test 8.2: Add Manual Investment
**Steps:**
1. Enter "Investment With": AJ Bell
2. Select "Investment Type": ISA (Stocks & Shares)
3. Tap "Who will receive this?"
4. **Notice:** "The Estate" at top with separator
5. Select "Jane Doe (Daughter)"
6. **Notice:** Jane appears as single selection (single mode)
7. Enter "Estimated Value": 50000
8. Tap "Add Investment"

**Expected:**
- ✅ Investment appears in list
- ✅ Shows: "AJ Bell - ISA (Stocks & Shares) | For: Jane Doe (Daughter) | £50,000"
- ✅ Total includes both ISAs: £70,000

**Verify beneficiaryAssignments uses unified type:**
```json
{
  "beneficiaryAssignments": {
    "beneficiaries": [
      { "id": "person-456", "type": "person" }
    ]
  }
}
```
**NO name/percentage fields stored**

### Test 8.3: Edit Investment Beneficiary
**Steps:**
1. Tap pencil on investment
2. Change beneficiary from Jane to Bob
3. Update

**Expected:**
- ✅ Beneficiary changes
- ✅ Display updates immediately
- ✅ AsyncStorage updates

---

## Phase 9: Pensions Testing ✅ COMPLETE

> Tested and passed — see `TEST_PENSIONS.md` for full results (69 manual tests).
> Includes validation error styling, blank value guard, and RadioGroup error prop.

### Test 9.1: Add Defined Benefit Pension
**Steps:**
1. Enter "Provider": Scottish Widows
2. Select "Pension Type": Defined Benefit
3. **Notice:** Value field label changes to "Annual Amount (£/year)"
4. Enter value: 15000
5. **Notice:** "Has Beneficiary Been Nominated?" has NO default selected
6. Select: "Not Sure"
7. Tap "Add Pension"

**Expected:**
- ✅ Pension appears: "Scottish Widows - Defined Benefit | £15,000/year | Beneficiary: Not Sure"
- ✅ "/year" suffix shown for DB pensions

**Verify AsyncStorage:**
```json
{
  "type": "pensions",
  "provider": "Scottish Widows",
  "pensionType": "defined-benefit",
  "beneficiaryNominated": "not-sure",
  "estimatedValue": 15000
}
```

### Test 9.2: Add SIPP Pension
**Steps:**
1. Add another pension
2. Select type: SIPP
3. **Notice:** Value field label: "Total Value" (not annual)
4. Enter: 200000
5. Select beneficiary: "Yes"

**Expected:**
- ✅ Shows: "Provider - SIPP | £200,000 | Beneficiary: Yes (bypasses estate)"
- ✅ Pensions Total includes both (but note about nominated beneficiaries)

---

## Phase 9.5: Unified Beneficiary Model Testing ← NEXT

### Test 9.5.1: Helper Functions
**Test in Developer Dashboard → Data Explorer or Console**

```typescript
import { 
  getAllocationType, 
  getTotalAllocated,
  validatePercentageAllocation,
  getBeneficiaryDisplayName,
  calculateBeneficiaryInheritance
} from './utils/beneficiaryHelpers';

// Test 1: getAllocationType
const simpleAssignments = {
  beneficiaries: [{ id: 'person-123', type: 'person' }]
};
console.log(getAllocationType(simpleAssignments)); // 'none'

const percentageAssignments = {
  beneficiaries: [
    { id: 'person-123', type: 'person', percentage: 60 },
    { id: 'person-456', type: 'person', percentage: 40 }
  ]
};
console.log(getAllocationType(percentageAssignments)); // 'percentage'

// Test 2: getTotalAllocated
console.log(getTotalAllocated(percentageAssignments)); // 100

// Test 3: validatePercentageAllocation
console.log(validatePercentageAllocation(percentageAssignments)); // true

const invalid = {
  beneficiaries: [
    { id: 'person-123', type: 'person', percentage: 60 },
    { id: 'person-456', type: 'person', percentage: 30 }
  ]
};
console.log(validatePercentageAllocation(invalid)); // false (only 90%)

// Test 4: getBeneficiaryDisplayName
const beneficiary = { id: 'person-123', type: 'person' };
const displayName = getBeneficiaryDisplayName(beneficiary, personActions, groupActions);
console.log(displayName); // "John Smith (Spouse)" - looked up from Person record

// Test 5: calculateBeneficiaryInheritance
// After adding assets in tests above
const johnsTotal = calculateBeneficiaryInheritance('person-123', allAssets);
console.log(johnsTotal); // Sum of all assets where John is beneficiary
```

**Expected:**
- ✅ All functions return correct values
- ✅ No stale cached data
- ✅ Lookups work correctly

### Test 9.5.2: Data Model Integrity

**Test A: No Cached Names (Stale Data Check)**

**Steps:**
1. Add Important Item with John Smith as beneficiary
2. Go to Onboarding → Family
3. Edit John Smith → Change name to "Jonathan Smith"
4. Go back to Important Items list
5. **Expected:** Item now shows "Jonathan Smith (Spouse)" - NOT "John Smith"
6. **Verify:** Name updated immediately (not cached)

**Test B: Unified Type Across Assets**

**Steps:**
1. Check Important Items storage
2. Check Investments storage  
3. Check Property storage (if built)
4. **Verify:** All use same beneficiaryAssignments structure
5. **Verify:** All have ONLY id and type fields (no name cached)

**Test C: Helper Functions with Real Data**

**Steps:**
1. After adding assets, open Developer Dashboard → Data Explorer
2. Find Important Item with John and The Estate
3. Use helper: `getAllocationType()` → 'none'
4. Find ISA from Bank Accounts
5. Use helper: `getAllocationType()` → 'none' (ISAs don't have % yet)
6. Use helper: `getAssetsForBeneficiary('estate')` → Returns all assets with Estate
7. **Verify:** Functions work with real stored data

---

## Integration Testing

### Test INT-1: Sequential Navigation Flow
**Path:** Categories → Select Bank Accounts, Important Items, Crypto, Investments

**Steps:**
1. Categories → Select Bank Accounts, Important Items
2. Tap Continue
3. **Expected:** Bank Accounts Intro
4. Let's Go → Bank Accounts Entry
5. Add account → Continue
6. **Expected:** Important Items Intro (next category)
7. Start Adding → Important Items Entry
8. Add item → Continue
9. **Expected:** Order of Things (no more categories)

**Verify:**
- ✅ Sequential flow works
- ✅ Skip buttons work
- ✅ Navigation utilities work correctly

### Test INT-2: Cross-Asset Beneficiary Queries
**After adding assets across all categories:**

**Query 1: Find all assets for John Smith**
```typescript
const johnsAssets = getAssetsForBeneficiary('person-123', allAssets);
```
**Expected:**
- ✅ Returns Wedding Ring (Important Item)
- ✅ Returns any investments assigned to John
- ✅ Works across all asset types

**Query 2: Calculate John's Total Inheritance**
```typescript
const johnsTotal = calculateBeneficiaryInheritance('person-123', allAssets);
```
**Expected:**
- ✅ Sums values from all assets
- ✅ Handles percentage allocations (when implemented)
- ✅ Handles simple equal splits

### Test INT-3: Unified Type Compatibility
**Check existing implementations still work:**

**Important Items:**
- ✅ Add item with multiple beneficiaries
- ✅ Save/load works
- ✅ Display shows names correctly (looked up)

**Investments:**
- ✅ Add investment with single beneficiary
- ✅ Edit beneficiary
- ✅ ISA from Bank Accounts displays correctly

**Verify:**
- ✅ NO breaking changes from type unification
- ✅ Existing data still loads
- ✅ New data saves correctly

---

## Edge Cases & Error Handling

### Edge 1: Empty Beneficiaries
**Test:** Try to save asset with no beneficiaries selected
- **Expected:** Submit button disabled
- **Expected:** Validation prevents save

### Edge 2: Deleted Person
**Test:** 
1. Add asset with John as beneficiary
2. Delete John from People
3. View asset
- **Expected:** Shows "Unknown Person" or handles gracefully
- **Expected:** No crash

### Edge 3: Collapsible Lists
**Test:**
1. Add 3+ accounts/items
2. Tap eye icon to hide list
3. **Expected:** List collapses
4. Tap again
5. **Expected:** List expands

### Edge 4: Unknown Balance Count
**Test:**
1. Add 2 accounts with values
2. Add 1 account with "Unsure of balance"
3. **Expected:** Total shows "Accounts Total: £X | (+ 1 unknown balance)"

---

## Performance Testing

### Perf 1: Large Number of Beneficiaries
**Test:**
1. Create 20 people
2. Add Important Item
3. Add all 20 as beneficiaries
4. **Expected:** 
   - Dropdown loads quickly
   - Chips render without lag
   - Scroll is smooth

### Perf 2: Name Lookup Performance
**Test:**
1. Add 10 assets with different beneficiaries
2. Scroll through lists
3. **Expected:**
   - Names load instantly (synchronous lookup)
   - No loading spinners needed
   - Smooth scrolling

---

## Regression Testing

**After Phase 9.5, verify Phases 5-9 still work:**

- ✅ Bank Accounts: Add/edit/delete
- ✅ Important Items: Beneficiary selection works
- ✅ Cryptocurrency: Add/edit/delete
- ✅ Investments: ISA integration works
- ✅ Pensions: Conditional value field works

---

## Success Criteria

**All tests must pass before Phase 10:**

**Data Model:**
- ✅ BeneficiaryAssignments unified across all assets
- ✅ No duplicate type definitions
- ✅ Helper functions work correctly
- ✅ No cached/stale data issues

**Functionality:**
- ✅ All CRUD operations work
- ✅ Sequential navigation works
- ✅ Validation works
- ✅ Edit mode works

**Performance:**
- ✅ No lag with 20+ beneficiaries
- ✅ Name lookups instant
- ✅ Smooth scrolling

**Data Integrity:**
- ✅ Person name changes reflect immediately
- ✅ Beneficiary queries work across assets
- ✅ AsyncStorage structure correct

---

## Next Phase Prep

**Before building BeneficiaryWithPercentages component:**
- Run all tests above
- Fix any issues
- Confirm unified model working correctly
- Then proceed to component implementation





