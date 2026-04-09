# Phase 13: Agricultural Assets - Meticulous Planning Document

## Planning Methodology

**Purpose:** Agricultural assets have complex conditional logic for tax relief qualification (APR/BPR). This is NOT over-engineering - it's critical tax law compliance that can save farming families £800k+ in inheritance tax on a £2M farm.

**Approach:**
1. **Read web prototype code thoroughly** - Understand EVERY conditional field
2. **Document base form interface** - All always-visible fields
3. **Document conditional fields** - Asset-type-specific fields (farm worker cottage, woodland, stud farm)
4. **Document APR section** - Agricultural Property Relief qualification logic
5. **Document BPR section** - Business Property Relief qualification logic
6. **Document debts section** - Conditional debt tracking
7. **Map option sets** - Every dropdown/select with all options
8. **Identify dead code** - Fields in types but never used in forms
9. **Create validation matrix** - What's required when
10. **Build implementation plan** - Step-by-step with code examples

**Critical Success Factors:**
- Retain ALL tax relief logic (APR/BPR)
- Preserve conditional field visibility rules
- Keep option sets intact
- Remove only dead code
- Ensure IHT relief qualification tracking works

---

## Step 1: Web Prototype Code Analysis

### Files Analyzed:
- `web-prototype/src/types.ts` (lines 468-491) - Type definition
- `web-prototype/src/components/AgriculturalAssetsIntroScreen.tsx` - Intro content
- `web-prototype/src/components/AgriculturalAssetsEntryScreen.tsx` (707 lines) - Form logic

### Initial Form State (lines 34-52):
```typescript
const INITIAL_ASSET_FORM = {
  assetType: 'agricultural-land',
  assetDescription: '',
  ownershipStructure: 'individual',
  customOwnershipStructure: '',
  hasDebtsEncumbrances: 'no',
  farmWorkerOccupied: 'not-sure',
  woodlandPurpose: 'not-sure',
  studFarmActivity: 'not-sure',
  otherAssetTypeDetail: '',
  aprOwnershipDuration: 'not-sure',
  aprOwnershipStructure: 'not-sure',
  aprTrustType: '',
  bprActiveTrading: 'not-sure',
  bprOwnershipDuration: 'not-sure',
  debtAmount: '',
  debtDescription: '',
  estimatedValue: ''
};
```

### APR Qualification Logic (lines 139-166):
```typescript
const qualifiesForApr = (assetType, context) => {
  // Always qualifies: agricultural-land, farm-buildings, farmhouse, fish-farming, other
  if (['agricultural-land', 'farm-buildings', 'farmhouse', 'fish-farming', 'other'].includes(assetType)) {
    return true;
  }
  
  // Conditional qualification:
  if (assetType === 'farm-worker-cottage') {
    return context.farmWorkerOccupied === 'yes';  // ONLY if occupied by farm worker
  }
  
  if (assetType === 'woodland') {
    return context.woodlandPurpose === 'shelter';  // ONLY if for agricultural shelter
  }
  
  if (assetType === 'stud-farm') {
    return context.studFarmActivity === 'breeding';  // ONLY if breeding (not livery)
  }
  
  // standing-crops, agricultural-equipment: FALSE (don't qualify for APR)
  return false;
};
```

### BPR Qualification Logic (lines 175-177):
```typescript
const shouldShowBprSection = (asset) =>
  asset.assetType === 'agricultural-equipment' ||
  (asset.assetType === 'stud-farm' && asset.studFarmActivity === 'livery');
```

---

## Step 1.5: Component Selection Pattern

**Established Pattern from Phases 5-12:**

**RadioGroup (2-4 options):**
- Used for: Yes/No, Yes/No/Not Sure, binary/ternary choices
- Visual: Stacked radio buttons with custom circles
- Examples: "Has Beneficiary Been Nominated?", "Held in Trust?"
- **Use when:** 2-4 mutually exclusive options

**Select (5-9 options):**
- Used for: Medium-length dropdown lists
- Visual: Dropdown menu (native picker)
- Examples: Ownership Structure (5), Premium Status (4), Investment Type (9)
- **Use when:** 5-9 options, no search needed

**SearchableSelect (10+ options):**
- Used for: Long lists requiring search/filter
- Visual: Modal with search bar + FlatList
- Examples: Bank Provider (25), Asset Type (10)
- **Use when:** 10+ options OR user needs to search

**For Agricultural Assets:**
- assetType (10 options) → SearchableSelect ✅
- ownershipStructure (5 options) → Select ✅
- hasDebtsEncumbrances (2 options) → RadioGroup ✅
- farmWorkerOccupied (3 options) → RadioGroup ✅
- woodlandPurpose (2 options) → RadioGroup ✅
- studFarmActivity (2 options) → RadioGroup ✅
- aprOwnershipDuration (8 options) → Select ✅
- aprOwnershipStructure (5 options) → Select ✅
- bprActiveTrading (3 options) → RadioGroup ✅
- bprOwnershipDuration (3 options) → RadioGroup ✅

---

## Step 2: Routing Decision (FIRST - Before Base Form)

### CRITICAL: Ownership Routing Field (Determines Asset Category)

**This is asked FIRST, before any other fields.**

**Purpose:** Route company-owned property to correct category (business assets vs agricultural assets)

**Field:**
- **Type:** RadioGroup (5 options)
- **Label:** "Who owns this agricultural property? *"
- **Required:** YES (routing decision)
- **Options:**
  1. "I own it personally" → Continue (aprOwnershipStructure = 'personal')
  2. "Owned through a partnership" → Continue (aprOwnershipStructure = 'partnership')
  3. "Held in trust" → Continue (aprOwnershipStructure = 'trust')
  4. "Owned by a limited company" → **Route to Phase 12**
  5. "Not sure" → Continue (aprOwnershipStructure = 'not-sure')

**IF "Owned by a limited company" selected:**

**Show Warning Card (Jobs's simplified version):**
```
⚠️ Company Property

This belongs to your company, not you personally.

Save under: Business Assets →
Tax Relief: BPR on shares (not APR on property)

[Continue to Business Assets]
```

**Actions:**
- Button: "Continue to Business Assets" → Navigate to Phase 12 entry screen
- Pre-populate Phase 12 form:
  - Business selector (from Private Company Shares)
  - Asset Type: 'property' (pre-selected)
  - Asset Description: Copy from agricultural form if entered
  - User completes Phase 12 flow
- **State cleanup (Gates's concern):** If user clicks back, clear company selection, reset routing state

**Result:** Asset saved as `AssetsHeldThroughBusinessAsset`, NOT `AgriculturalAsset`

**IF any other option selected:**
- Continue in Agricultural Assets form
- Store selection in `aprOwnershipStructure` field
- Show APR section (if asset qualifies)
- Save as `AgriculturalAsset`

---

## Step 3: Base Form Interface (After Routing - Personal/Partnership/Trust Only)

### Fields Shown to Users Who Selected Personal/Partnership/Trust (4 fields):

#### Field 1: Asset Description
- **Type:** Text Input
- **Label:** "What is this asset?" (Jobs: Not "Identifier" - users don't think that way)
- **Placeholder:** "e.g. North field, Cow barn, Main farmhouse"
- **Required:** YES
- **Validation:** Non-empty after trim
- **Storage:** `assetDescription: string`

#### Field 2: Asset Type
- **Type:** SearchableSelect (10 options, GROUPED for easier scanning - Jobs's improvement)
- **Label:** "Asset Type"
- **Required:** YES
- **Options (from web prototype lines 72-83, regrouped):**
  
  **Land & Buildings:**
  1. Agricultural Land
  2. Farm Buildings
  3. Farmhouse
  4. Farm Worker Cottage
  
  **Separator:** ────────────────
  
  **Livestock & Crops:**
  5. Stud Farm
  6. Standing Crops
  7. Fish Farming Facilities
  
  **Separator:** ────────────────
  
  **Other:**
  8. Woodland
  9. Agricultural Equipment
  10. Other

- **Default:** 'agricultural-land'
- **Validation:** Must be one of 10 values
- **Storage:** `assetType: 'agricultural-land' | 'farm-buildings' | ...`
- **Triggers conditional fields:** Yes (see Step 3)

#### Field 3: Debts or Encumbrances
- **Type:** RadioGroup (2 options - Yes/No pattern)
- **Label:** "Debts or encumbrances"
- **Required:** YES
- **Options (from lines 93-96):**
  1. No debts or encumbrances
  2. Yes - Has debts/encumbrances

- **Default:** 'no'
- **Validation:** Must select one
- **Storage:** `hasDebtsEncumbrances: 'yes' | 'no'`
- **Triggers conditional fields:** IF 'yes', show debtAmount + debtDescription

#### Field 4: Estimated Value
- **Type:** CurrencyInput
- **Label:** "Estimated Value"
- **Required:** NO
- **"Not sure" button:** YES (sets to £0)
- **Validation:** Numeric, >= 0
- **Storage:** `estimatedValue: number`
- **Display:** Round to £1 on save

---

## Step 3: Conditional Fields Based on Asset Type

### 3A: Farm Worker Cottage → farmWorkerOccupied

**Trigger:** IF `assetType === 'farm-worker-cottage'`

**Field:**
- **Type:** RadioGroup (3 options - Yes/No/Not Sure pattern)
- **Label:** "Occupied by farm worker?"
- **Required:** YES (determines APR eligibility!)
- **Options (lines 98-102):**
  1. Yes
  2. No
  3. Not sure

- **Default:** 'not-sure'
- **Storage:** `farmWorkerOccupied: 'yes' | 'no' | 'not-sure'`
- **APR Impact:** Only qualifies for APR if 'yes'
- **Location in form:** After asset type selection (line 449-460)

---

### 3B: Woodland → woodlandPurpose

**Trigger:** IF `assetType === 'woodland'`

**Field:**
- **Type:** RadioGroup (2 options)
- **Label:** "Woodland purpose"
- **Required:** YES (determines APR eligibility!)
- **Options (lines 104-107):**
  1. Agricultural use (shelter, firewood for farm)
  2. Commercial timber business

- **Default:** 'not-sure'
- **Storage:** `woodlandPurpose: 'shelter' | 'commercial' | 'not-sure'`
- **APR Impact:** Only qualifies for APR if 'shelter'
- **BPR Impact:** Commercial timber qualifies for BPR instead
- **Location in form:** After asset type selection (line 462-473)

---

### 3C: Stud Farm → studFarmActivity

**Trigger:** IF `assetType === 'stud-farm'`

**Field:**
- **Type:** RadioGroup (2 options)
- **Label:** "Stud farm activity"
- **Required:** YES (determines APR vs BPR!)
- **Options (lines 109-112):**
  1. Breeding horses/ponies for sale (agricultural)
  2. Livery, riding school, or training (business)

- **Default:** 'not-sure'
- **Storage:** `studFarmActivity: 'breeding' | 'livery' | 'not-sure'`
- **APR Impact:** 'breeding' qualifies for APR
- **BPR Impact:** 'livery' triggers BPR section instead
- **Location in form:** After asset type selection (line 475-488)
- **Special:** Changes which relief section shows (APR vs BPR)

---

### 3D: Other → otherAssetTypeDetail

**Trigger:** IF `assetType === 'other'`

**Field:**
- **Type:** Textarea
- **Label:** "Describe asset type"
- **Placeholder:** "Provide detail about this agricultural asset type"
- **Required:** YES
- **Validation:** Non-empty trim
- **Storage:** `otherAssetTypeDetail: string`
- **Location in form:** After asset type selection (line 490-499)

---

## Step 4: Conditional Fields Based on Debts

### 4A: Has Debts → debtAmount

**Trigger:** IF `hasDebtsEncumbrances === 'yes'`

**Field:**
- **Type:** CurrencyInput
- **Label:** "Outstanding debt amount"
- **Placeholder:** "£0"
- **Required:** NO
- **Validation:** Numeric, >= 0
- **Storage:** `debtAmount: number`
- **Location in form:** Grid layout (line 629-637)
- **Net Value Calculation:** `netValue = estimatedValue - debtAmount`

---

### 4B: Has Debts → debtDescription

**Trigger:** IF `hasDebtsEncumbrances === 'yes'`

**Field:**
- **Type:** Input (text)
- **Label:** "Debt description"
- **Placeholder:** "e.g. Agricultural mortgage, equipment finance"
- **Required:** NO
- **Validation:** None
- **Storage:** `debtDescription: string`
- **Location in form:** Grid layout next to debtAmount (line 638-646)

---

## Step 5: APR Section (Agricultural Property Relief)

### APR Section Visibility Logic (lines 168-173):

**Show APR Section IF:**
```typescript
qualifiesForApr(assetType, {
  farmWorkerOccupied,
  woodlandPurpose,
  studFarmActivity
})
```

**Qualifying Asset Types:**
- ✅ agricultural-land (always)
- ✅ farm-buildings (always)
- ✅ farmhouse (always)
- ✅ fish-farming (always)
- ✅ other (always)
- ✅ farm-worker-cottage (IF occupied by worker)
- ✅ woodland (IF for shelter, not commercial)
- ✅ stud-farm (IF breeding, not livery)
- ❌ standing-crops (never - BPR instead)
- ❌ agricultural-equipment (never - BPR instead)

### APR Fields (2 fields, conditional on qualifying asset type):

**NOTE:** aprOwnershipStructure already captured in Step 2 (routing decision)

#### APR Field 1: aprOwnershipDuration

**Trigger:** IF qualifiesForApr() returns true

**Field:**
- **Type:** Select (8 options - no search needed)
- **Label:** "How long have you owned this property?"
- **Required:** NO (defaults to 'not-sure')
- **Options (lines 114-123):**
  1. 1 year
  2. 2 years
  3. 3 years
  4. 4 years
  5. 5 years
  6. 6 years
  7. Over 7 years
  8. Not sure

- **Default:** 'not-sure'
- **Storage:** `aprOwnershipDuration: 'year-1' | 'year-2' | ... | 'gt-7' | 'not-sure'`
- **APR Relevance:** APR requires 2+ years ownership OR 7+ years occupation if tenant
- **Location in form:** APR section card (line 512-521)

---

#### APR Field 2: aprTrustType (Sub-conditional)

**NOTE:** aprOwnershipStructure already determined in Step 2 (routing decision)

**Trigger:** IF routing decision (Step 2) was 'trust'

**Field:**
- **Type:** Input (text)
- **Label:** "Trust Type"
- **Placeholder:** "e.g. discretionary, life interest"
- **Required:** NO
- **Validation:** None
- **Storage:** `aprTrustType: string`
- **APR Relevance:** Trust type affects APR evidence requirements
- **Info message shown:** "Trust-held assets often need additional evidence to qualify for APR"

---

#### APR Info Message for Trust Ownership:

**IF aprOwnershipStructure === 'trust'** (from Step 2 routing):
```
Message: "Trust-held assets often need additional evidence to qualify for APR."
Style: Info box (brown background)
```

---

## Step 6: BPR Section (Business Property Relief)

### BPR Section Visibility Logic (lines 175-177):

**Show BPR Section IF:**
```typescript
asset.assetType === 'agricultural-equipment' OR
(asset.assetType === 'stud-farm' AND asset.studFarmActivity === 'livery')
```

**Qualifying Scenarios:**
- ✅ Agricultural Equipment (always shows BPR)
- ✅ Stud Farm with Livery activity (BPR instead of APR)
- ❌ All other asset types (show APR instead)

**Mutual Exclusivity:** Asset either qualifies for APR OR BPR, never both

### BPR Fields (2 fields, conditional on equipment or livery):

#### BPR Field 1: bprActiveTrading

**Trigger:** IF shouldShowBprSection() returns true

**Field:**
- **Type:** RadioGroup (3 options - Yes/No/Not Sure pattern)
- **Label:** "Is the stud farm business actively trading?" (or equipment business)
- **Required:** NO (defaults to 'not-sure')
- **Options (lines 98-102 - reused yesNoNotSureOptions):**
  1. Yes
  2. No
  3. Not sure

- **Default:** 'not-sure'
- **Storage:** `bprActiveTrading: 'yes' | 'no' | 'not-sure'`
- **BPR Relevance:** BPR requires actively trading business
- **Location in form:** BPR section card (line 565-574)

---

#### BPR Field 2: bprOwnershipDuration

**Trigger:** IF shouldShowBprSection() returns true

**Field:**
- **Type:** RadioGroup (3 options)
- **Label:** "How long have you owned these shares/this business?"
- **Required:** NO (defaults to 'not-sure')
- **Options (lines 133-137):**
  1. Less than 2 years
  2. 2+ years
  3. Not sure

- **Default:** 'not-sure'
- **Storage:** `bprOwnershipDuration: 'lt-2' | 'gte-2' | 'not-sure'`
- **BPR Relevance:** BPR requires 2+ years ownership
- **Location in form:** BPR section card (line 576-586)

---

## Step 7: Complete Field Inventory

### Fields Used in Form (15 total):

**Routing Decision (1):**
1. ✅ aprOwnershipStructure (asked FIRST - personal/partnership/trust/company/not-sure)
   - IF company → route to Phase 12, don't save as AgriculturalAsset
   - ELSE → continue, store value

**Base Fields (3, shown after routing):**
2. ✅ assetDescription (always required)
3. ✅ assetType (always required)
4. ✅ hasDebtsEncumbrances (always required)
5. ✅ estimatedValue (optional with "Not sure")

**Asset-Type Conditional (4):**
6. ✅ farmWorkerOccupied (IF farm-worker-cottage)
7. ✅ woodlandPurpose (IF woodland)
8. ✅ studFarmActivity (IF stud-farm)
9. ✅ otherAssetTypeDetail (IF other)

**Debts Conditional (2):**
10. ✅ debtAmount (IF hasDebts = yes)
11. ✅ debtDescription (IF hasDebts = yes)

**APR Section (2, conditional on qualifying asset - aprOwnershipStructure already captured):**
12. ✅ aprOwnershipDuration
13. ✅ aprTrustType (sub-conditional IF aprOwnershipStructure = trust from Step 2)

**BPR Section (2, conditional on equipment or livery):**
14. ✅ bprActiveTrading
15. ✅ bprOwnershipDuration

---

### Dead Code to Remove (4 fields):

16. ❌ **location** - In types.ts line 605, NEVER used in form
17. ❌ **sizeQuantity** - In types.ts line 608, NEVER used in form
18. ❌ **yearsOwned** - In types.ts line 609, NEVER used (aprOwnershipDuration does this)
19. ❌ **activeAgriculturalUse** - In types.ts line 610, NEVER used in form

### Removed Through Routing (2 fields):

20. ❌ **ownershipStructure** - Removed (redundant with aprOwnershipStructure)
21. ❌ **customOwnershipStructure** - Removed (no 'other' option needed)

### Added Field:

✅ **notes** - Optional field for additional context (add to form)

---

## Step 8: Validation Matrix

### Required Field Matrix:

| Asset Type | Required Fields |
|-----------|----------------|
| Agricultural Land | **aprOwnershipStructure (routing)**, description, assetType, hasDebts |
| Farm Buildings | **aprOwnershipStructure (routing)**, description, assetType, hasDebts |
| Farmhouse | **aprOwnershipStructure (routing)**, description, assetType, hasDebts |
| Farm Worker Cottage | **aprOwnershipStructure (routing)**, description, assetType, hasDebts, **farmWorkerOccupied** |
| Woodland | **aprOwnershipStructure (routing)**, description, assetType, hasDebts, **woodlandPurpose** |
| Stud Farm | **aprOwnershipStructure (routing)**, description, assetType, hasDebts, **studFarmActivity** |
| Standing Crops | **aprOwnershipStructure (routing)**, description, assetType, hasDebts |
| Fish Farming | **aprOwnershipStructure (routing)**, description, assetType, hasDebts |
| Agricultural Equipment | **aprOwnershipStructure (routing)**, description, assetType, hasDebts |
| Other | **aprOwnershipStructure (routing)**, description, assetType, hasDebts, **otherAssetTypeDetail** |

**Additional Conditionals:**
- IF aprOwnershipStructure = 'company': Route to Phase 12 (don't save as AgriculturalAsset)
- IF aprOwnershipStructure = 'trust': Show aprTrustType field
- IF hasDebts = 'yes': debtAmount/debtDescription optional but form shown
- APR/BPR fields: All optional (default 'not-sure')

---

## Step 9: Conditional Logic Flow Chart

```
STEP 1: User answers "Who owns this property?"
    ↓
IF "Limited Company"
    → Show Warning Card
    → Route to Phase 12 (Assets Held Through Business)
    → Save as AssetsHeldThroughBusinessAsset
    → END (don't continue agricultural form)
    ↓
ELSE (Personal/Partnership/Trust/Not Sure)
    → Store in aprOwnershipStructure
    → Continue to Step 2
    ↓
STEP 2: User selects Asset Type
    ↓
IF farm-worker-cottage → Show farmWorkerOccupied field
    ↓
    IF farmWorkerOccupied = 'yes' → Show APR section
    IF farmWorkerOccupied = 'no' → No APR section
    ↓
IF woodland → Show woodlandPurpose field
    ↓
    IF woodlandPurpose = 'shelter' → Show APR section
    IF woodlandPurpose = 'commercial' → No relief section
    ↓
IF stud-farm → Show studFarmActivity field
    ↓
    IF studFarmActivity = 'breeding' → Show APR section
    IF studFarmActivity = 'livery' → Show BPR section
    ↓
IF agricultural-equipment → Show BPR section (always)
    ↓
IF agricultural-land, farm-buildings, farmhouse, fish-farming, other → Show APR section (always)
    ↓
IF standing-crops → No relief section
```

---

## Step 10: Form Layout Structure (from web prototype, with routing)

### Layout Pattern (lines 396-676, modified with routing):

**Section 0: Ownership Routing (NEW - FIRST THING SHOWN)**
- RadioGroup: "Who owns this property?"
- 5 options: Personal, Partnership, Trust, Company, Not Sure
- IF Company → Show warning card + route button
- ELSE → Continue to Section 1

**Section 1: Existing Assets List** (if any exist)
- Card with list of added assets
- Click to edit
- Delete button per asset
- Shows: description, asset type, value

**Section 2: Add/Edit Asset Form Card**
- Always visible (no form show/hide pattern)
- Edit mode: "Update Agricultural Asset" title + Reset button
- Add mode: "Add Agricultural Asset" title

**Section 3: Base Fields**
- Identifier (description) - always
- Asset Type - always
- [Asset-type conditional fields here]
- [Debts conditional section here]
- NO ownership structure here (already captured in Section 0)

**Section 4: APR Section** (conditional card, green background)
- Heading: "APR Qualification"
- Subtext: "These answers help us understand whether Agricultural Property Relief might apply."
- Border: kindling-green/30
- Background: kindling-green/5
- Contains 1-2 fields (aprOwnershipDuration always, aprTrustType if trust)
- aprOwnershipStructure already known from Section 0

**Section 5: BPR Section** (conditional card, green background)
- Heading: "BPR Qualification"
- Subtext: "These answers help us understand whether Business Property Relief might apply."
- Border: kindling-green/30
- Background: kindling-green/5
- Contains 2 fields

**Section 6: Estimated Value** (always at bottom)
- Currency input
- "Not sure" button

**Section 7: Footer**
- "Add Another" or "Save Changes" button
- "Continue" button (outline style)
- Total value display (if assets exist)

---

## Step 11: Implementation Plan

### Phase 13 Tasks:

**Task 13.1: Update AgriculturalAsset Interface (30 minutes)**
- Remove 6 fields: location, sizeQuantity, yearsOwned, activeAgriculturalUse, ownershipStructure, customOwnershipStructure
- Update aprOwnershipStructure type: REMOVE 'company' option (Gates's fix)
  ```typescript
  aprOwnershipStructure?: 'personal' | 'partnership' | 'trust' | 'not-sure';
  // NOT: 'personal' | 'partnership' | 'trust' | 'company' | 'not-sure'
  // Company routes to Phase 12, never saved in AgriculturalAsset
  ```
- Add notes field (optional)
- Add JSDoc explaining routing logic and APR/BPR conditional logic
- Document each field's purpose
- Result: 15 fields (down from 21)

**Task 13.2: Build Intro Screen (1-2 hours)**
- Sprout icon header
- Video: "Introduction to Agricultural Assets"
- InformationCard with APR/BPR explanation from web prototype
- "Let's Go" and "Skip this section" buttons
- 3-blob morphic background

**Task 13.3: Build Entry Screen - Routing Decision (1 hour)**
- FIRST question: "Who owns this property?" (RadioGroup, 5 options)
- IF company → Show warning card (Jobs's simplified version)
- Warning card: Brief, scannable, clear action button
- Route button to Phase 12 with pre-filled data
- Back button state cleanup (Gates's concern)
- ELSE → Store in aprOwnershipStructure, continue to base fields

**Task 13.4: Build Entry Screen - Base Fields (1-2 hours)**
- 3 base fields (shown after routing)
- Description (Jobs: not "Identifier"), Asset Type (grouped - Jobs), Debts, Value
- SearchableSelect for asset type with grouped options
- "Not sure" value checkbox
- NO ownership field here (already done in routing)

**Task 13.5: Build Entry Screen - Asset Type Conditionals (2 hours)**
- Farm worker cottage → farmWorkerOccupied (RadioGroup)
- Woodland → woodlandPurpose (RadioGroup)
- Stud farm → studFarmActivity (RadioGroup)
- Other → otherAssetTypeDetail (Textarea)
- Test conditional visibility

**Task 13.6: Build Entry Screen - Debts Conditionals (1 hour)**
- debtAmount + debtDescription (IF hasDebts = yes)
- Net value calculation: estimatedValue - debtAmount

**Task 13.7: Build Entry Screen - APR Section (2 hours)**
- APR qualification logic (qualifiesForApr function)
- 2 APR fields (aprOwnershipDuration, aprTrustType if trust)
- aprOwnershipStructure already known from routing decision
- Green info card styling
- Info message for trust ownership

**Task 13.8: Build Entry Screen - BPR Section (1 hour)**
- BPR qualification logic (shouldShowBprSection function)
- 2 BPR fields
- Green info card styling
- Mutual exclusivity with APR

**Task 13.9: Build Entry Screen - List & Display (1 hour)**
- Existing assets list
- Edit mode (click to edit, form always visible)
- Delete functionality
- Total calculation

**Task 13.10: Testing (2-3 hours)**
- Test routing: company ownership → Phase 12
- Test personal/partnership/trust ownership → stays in Phase 13
- Test all 10 asset types
- Test APR conditional visibility for each type
- Test BPR conditional visibility
- Test debts/ownership conditionals
- Verify APR/BPR mutual exclusivity
- Test net value calculation

**Total Estimated Time: 13-15 hours (1.5-2 days)**

**Complexity justified by:**
- 100% IHT relief potential (APR/BPR)
- £800k+ tax savings on £2M farm
- Proper tax law compliance
- Critical for farming families

---

## Step 13: Next Steps

**BEFORE Implementation:**
1. ✅ Document base interface (DONE - Step 2)
2. ✅ Document all conditional fields (DONE - Steps 3-7)
3. ✅ Document APR/BPR logic (DONE - Steps 6-7)
4. ✅ Create validation matrix (DONE - Step 9)
5. ✅ Map conditional logic flow (DONE - Step 10)
6. ✅ Create implementation plan (DONE - Step 12)

**NEXT:**
- Get user approval on plan
- Write detailed Phase 13 plan into ASSET_MANAGEMENT_PLAN.md
- Implement screens
- Test thoroughly

---

## Notes for Implementation

**Critical Logic to Preserve:**
1. `qualifiesForApr()` function - determines APR section visibility
2. `shouldShowBprSection()` function - determines BPR section visibility
3. Mutual exclusivity: Asset shows APR OR BPR, never both
4. Conditional field cleanup: When asset type changes, clear irrelevant conditional fields
5. Net value calculation: estimatedValue - debtAmount (if debts exist)

**UX Patterns:**
- Form always visible (no show/hide pattern like other assets)
- Edit mode: Click asset to edit, shows "Editing" badge
- Reset button in edit mode
- Validation on submit (lines 306-311) - complex validation logic

**No Simplification Here:**
- Don't remove APR/BPR fields (critical tax logic)
- Don't remove conditional fields (required for qualification)
- Don't simplify option sets (UK tax law specific)
- DO remove dead code only

---

---

## Step 12: Web Prototype vs Our Approach - Detailed Comparison

### Key Architectural Differences

**Web Prototype Approach:**
```typescript
// Stores ALL agricultural assets as AgriculturalAsset, including company-owned
{
  type: 'agricultural-assets',
  assetType: 'agricultural-land',
  ownershipStructure: 'limited-company',     // ← Base field (always stored)
  customOwnershipStructure: '',
  aprOwnershipStructure: 'company',          // ← DUPLICATE in APR section
  aprOwnershipDuration: 'not-sure',
  // ... saves to AgriculturalAsset table
}

// Shows warning message (line 535-538):
// "May qualify for BPR on company shares instead of APR"
// But still saves as agricultural asset (WRONG CATEGORY)
```

**Our Approach:**
```typescript
// ROUTING DECISION FIRST
if (aprOwnershipStructure === 'company') {
  // Route to Phase 12 - Assets Held Through Business
  {
    type: 'assets-held-through-business',
    businessId: 'company-abc',  // Link to company from Phase 11
    assetType: 'property',
    assetDescription: 'Farmland - 50 acres',
    estimatedValue: 2000000
    // No APR fields (BPR applies to shares, not property details)
  }
} else {
  // Continue in Phase 13 - Agricultural Assets
  {
    type: 'agricultural-assets',
    assetType: 'agricultural-land',
    aprOwnershipStructure: 'personal',  // Only ONE ownership field
    aprOwnershipDuration: 'gt-7',
    // ... APR fields (relevant for personal ownership)
  }
}
```

### Comparison Table

| Aspect | Web Prototype | Our Approach |
|--------|--------------|--------------|
| **Company-owned farms** | Stored as AgriculturalAsset ❌ | Routed to AssetsHeldThroughBusinessAsset ✅ |
| **Ownership fields** | 2 fields (base + APR) ❌ | 1 field (aprOwnershipStructure) ✅ |
| **Base ownershipStructure** | Always stored, never used ❌ | Removed (redundant) ✅ |
| **customOwnershipStructure** | For 'other' ownership edge cases ❌ | Removed (use notes) ✅ |
| **Tax treatment** | BPR mentioned in message only ❌ | BPR tracked on shares (Phase 11) ✅ |
| **Total fields** | 21 fields (4 dead code) | 15 fields (29% reduction) ✅ |
| **Data duplication** | Yes (2 ownership fields) ❌ | No (single source) ✅ |
| **Categorization** | Mixed (company + personal) ❌ | Separated by ownership ✅ |

### Benefits of Our Approach

**1. Correct Tax Treatment:**
- Company farms: BPR tracked on company shares (Private Company Shares - Phase 11)
- Personal farms: APR tracked on agricultural property (Agricultural Assets - Phase 13)
- No confusion about which relief applies

**2. Proper Data Categorization:**
- `AssetsHeldThroughBusinessAsset`: Company-owned property, equipment, etc.
- `AgriculturalAsset`: Personally-owned farms, land, buildings
- Query optimization: "Show me all my business assets" vs "Show me all my personal property"

**3. No Duplication:**
- Web: 2 ownership fields per asset (base + APR)
- Us: 1 ownership field (aprOwnershipStructure)
- Business name/ownership looked up from Business record (Phase 12 pattern)

**4. Cleaner UX:**
- Early routing → users in correct flow immediately
- No confusing "this might qualify for BPR instead" messages
- Clear separation: company assets vs personal assets

**5. Data Integrity:**
- Company owns farmland → tracked with other company assets
- Update company name → reflects across all company assets
- Single source of truth (Business record from Phase 11)

### What We Kept from Web Prototype

**✅ All APR/BPR qualification logic:**
- qualifiesForApr() function (lines 139-166)
- shouldShowBprSection() function (lines 175-177)
- All conditional field visibility rules
- All option sets (dropdown choices)

**✅ All tax-relevant fields:**
- aprOwnershipDuration (how long owned - APR requires 2+ years)
- aprTrustType (trust type for evidence requirements)
- bprActiveTrading (BPR requires active business)
- bprOwnershipDuration (BPR requires 2+ years)
- All asset-type conditionals (farm worker, woodland, stud farm)

**✅ Net value calculation:**
- estimatedValue - debtAmount = netValue
- Proper debt tracking

### What We Removed/Changed

**❌ Dead Code (4 fields):**
- location (never used)
- sizeQuantity (never used)
- yearsOwned (superseded by aprOwnershipDuration)
- activeAgriculturalUse (never used)

**❌ Redundant Fields (2 fields):**
- ownershipStructure (duplicate of aprOwnershipStructure)
- customOwnershipStructure (removed 'other' option)

**✅ Added:**
- notes field (for edge case explanations)
- Routing logic (company → Phase 12)

**Result:** 15 fields (down from 21) = 29% reduction with BETTER architecture

---

## Step 13: Summary - Why Our Approach is Superior

**Web Prototype Issues:**
1. Stores assets in wrong category (company farms as agricultural)
2. Duplicates ownership data (2 fields saying same thing)
3. Shows warning but doesn't enforce action
4. BPR qualification data scattered across wrong asset types

**Our Solution:**
1. ✅ Enforces correct categorization via routing
2. ✅ Single ownership field (no duplication)
3. ✅ Proactive routing (not just passive warning)
4. ✅ BPR on shares (Phase 11), APR on personal property (Phase 13)
5. ✅ Cleaner data model (29% fewer fields)
6. ✅ Same tax qualification logic preserved
7. ✅ Better UX (users in correct flow from start)

**Approved by design principles:**
- Data normalization (single source of truth)
- Proper categorization (company vs personal assets)
- No duplication (DRY principle)
- Tax law compliance (APR/BPR correctly applied)

---

✅ **PLANNING PHASE COMPLETE - READY FOR REVIEW**

This approach is architecturally superior to the web prototype while preserving all critical tax qualification logic.

