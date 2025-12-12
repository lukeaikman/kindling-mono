## Phase 12: Assets Held Through Business Implementation (MODERATE - 3-4 hours)

**Reference:** Web prototype `AssetsHeldThroughBusinessIntroScreen.tsx` and `AssetsHeldThroughBusinessEntryScreen.tsx`

**CRITICAL:** This phase links business-owned assets to your companies. Since you can't directly bequeath business assets in a personal will (they belong to the business entity), this is informational for executors only.

### DESIGN PHILOSOPHY: Ultra-Clean Relational Model

**Data Normalization Principle:**
- Store ONLY what's unique to the asset
- Lookup business details from Business record (single source of truth)
- No duplication of business name, type, or ownership %
- Proper foreign key relationship (businessId)

**User Experience:**
- Reuse Private Company Shares (Phase 11) as business source
- Don't ask for business details twice
- Multi-business support (add assets to different businesses)

**Removed Complexity from Web Prototype:**
- ❌ No `businessType` field (removed from all interfaces - will add later if needed)
- ❌ No `numberOfUnits` field (dead code, never used)
- ❌ No `excludeFromBusinessValuation` field (unrealistic - no one lists goodwill in a will app)
- ❌ No duplicate business name/ownership storage

**Result:** 3-field asset model (down from 8!) - **62% reduction**

---

### Task 12.1: Clean Up Business Interface

**File:** `native-app/src/types/index.ts`

**CURRENT (Lines ~666-677):**
```typescript
export interface Business {
  id: string;
  name: string;
  businessType: string;           // ← REMOVE
  registrationNumber?: string;
  ownershipPercentage: number;
  estimatedValue: number;
  description?: string;
  address?: AddressData;
  createdAt: Date;
  updatedAt: Date;
}
```

**UPDATED (Simplified - 7 fields):**
```typescript
export interface Business {
  id: string;
  name: string;
  ownershipPercentage: number;    // From Private Company Shares
  estimatedValue: number;          // Calculated from assets
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // REMOVED: businessType (not needed - ownership via shares/GIAs)
  // REMOVED: registrationNumber (defer to Executor Facilitation)
  // REMOVED: address (defer to Executor Facilitation)
}
```

**Note:** Business records are auto-created from Private Company Shares, so most users won't manually create businesses.

---

### Task 12.2: Clean Up AssetsHeldThroughBusinessAsset Interface

**File:** `native-app/src/types/index.ts`

**CURRENT (Lines ~573-583):**
```typescript
export interface AssetsHeldThroughBusinessAsset extends BaseAsset {
  type: 'assets-held-through-business';
  businessId: string;
  businessName: string;              // ← DUPLICATION (lookup from Business)
  businessType?: string;             // ← DUPLICATION (lookup from Business)
  assetType: string;
  assetDescription?: string;
  businessOwnershipPercentage?: number;  // ← DUPLICATION (lookup from Business)
  numberOfUnits?: number;            // ← DEAD CODE (never used)
  excludeFromBusinessValuation?: boolean;  // ← UNREALISTIC (goodwill example)
}
```

**UPDATED (Ultra-Clean - 3 fields):**
```typescript
export interface AssetsHeldThroughBusinessAsset extends BaseAsset {
  // BaseAsset includes: id, type, title, description, estimatedValue, netValue, createdAt, updatedAt
  
  type: 'assets-held-through-business';
  businessId: string;  // Foreign key to Business record
  assetType: 'property' | 'equipment' | 'vehicles' | 'bank-accounts' | 
             'investments' | 'inventory' | 'intellectual-property' | 'other';
  assetDescription?: string;  // Brief description
  
  // All business details (name, ownership %) looked up via:
  // const business = businessActions.getBusinessById(asset.businessId);
  
  // REMOVED: businessName (lookup via businessId)
  // REMOVED: businessType (removed from Business interface too)
  // REMOVED: businessOwnershipPercentage (lookup via businessId)
  // REMOVED: numberOfUnits (dead code, never used anywhere)
  // REMOVED: excludeFromBusinessValuation (unrealistic use case)
}
```

**Result:** 3 fields (down from 8) - **62% reduction**

---

### Task 12.3: Assets Held Through Business Intro Screen

**File:** `native-app/app/bequeathal/assets-held-through-business/intro.tsx`

**Content (from web prototype):**

**Header:**
- Icon: Building2 or Briefcase
- Title: "Assets Held Through Business"

**Video:**
- Title: "Understanding Business-Held Assets"
- Dismissible inline player (16:9 aspect ratio)

**InformationCard: "Business Assets"**

Content (from web prototype lines 44-70):
```
Many people hold assets through business structures like limited companies, 
partnerships, or sole trading businesses. These assets don't technically 
belong to you personally - they belong to the business entity.

Why this matters for your will: While you can't directly bequeath business 
assets in your personal will, your executors need to know about them to get 
a complete picture of your financial situation.

This section helps your executors understand what assets exist within your 
business structures, including:
• Property owned by your company
• Business equipment and vehicles
• Company bank accounts and investments
• Intellectual property and inventory
• Any other valuable business assets

What happens to these assets: The distribution of business assets depends 
on your business structure, shareholder agreements, and separate business 
succession planning. This information helps your executors coordinate with 
business partners and professional advisors.

Even if you're unsure about exact values, having this information documented 
will be invaluable for your executors when dealing with your business affairs.
```

**Buttons:**
- Primary: "Let's Go" → `/bequeathal/assets-held-through-business/entry`
- Skip: "Skip This Section" → next category

**Morphic Background:**
- 3 blobs

**Effort:** 1-2 hours

---

### Task 12.4: Assets Held Through Business Entry Screen

**File:** `native-app/app/bequeathal/assets-held-through-business/entry.tsx`

**Data Structure (Ultra-Clean from Task 12.2):**
```typescript
interface AssetsHeldThroughBusinessAsset extends BaseAsset {
  type: 'assets-held-through-business';
  businessId: string;
  assetType: string;
  assetDescription?: string;
}
```

**Two-Step Flow:**

#### STEP 1: Business Selection

**Business Selector (SearchableSelect - reuse Phase 5 component):**
- Options populated from **Private Company Shares (Phase 11)**
- For each share, create option:
  - Label: `{companyName}`
  - Sublabel: `{percentageOwnership}% owned`
  - Value: `{shareId}` (used as businessId)
- Option at bottom: "📝 Add New Business" (for edge cases)

**If "Add New Business" selected:**
- Show 2-field mini-form:
  1. Business Name (text input)
  2. Ownership % (number input, 0-100)
- Creates minimal Business record
- Proceeds to Step 2

**Smart Auto-Population:**
- If business exists in Private Company Shares:
  - businessId = share.id
  - name = share.companyName
  - ownershipPercentage = share.percentageOwnership
  - estimatedValue = 0 (calculated from assets later)
- If new business:
  - Create new Business record with entered data
  - Proceed to asset entry

#### STEP 2: Asset Entry (Once Business Selected)

**Form Fields (3 TOTAL - ULTRA-SIMPLIFIED):**

1. **Asset Type** (Select - 8 options, GROUPED for easier scanning)
   
   **Physical Assets:**
   - Property
   - Equipment
   - Vehicles
   
   **Separator:** ────────────────
   
   **Financial Assets:**
   - Bank Accounts
   - Investments
   
   **Separator:** ────────────────
   
   **Other Assets:**
   - Inventory
   - Intellectual Property
   - Other
   
   - REQUIRED
   - Jobs's improvement: Grouped categories for easier scanning

2. **Asset Description** (Input)
   - Placeholder changes based on asset type (Jobs's improvement):
     - Property: "e.g., Main office, Warehouse, Shop premises"
     - Equipment: "e.g., Machinery, Computers, Manufacturing tools"
     - Vehicles: "e.g., Delivery van, Company car, Forklift"
     - Bank Accounts: "e.g., Business current account, Reserve account"
     - Investments: "e.g., Corporate bonds, Share portfolio"
     - Inventory: "e.g., Stock, Raw materials, Finished goods"
     - Intellectual Property: "e.g., Patents, Trademarks, Software licenses"
     - Other: "e.g., Office building, Delivery van, Manufacturing equipment"
   - REQUIRED
   - Brief text description

3. **Estimated Value** (CurrencyInput)
   - "Not sure" checkbox (sets to £0)
   - Optional
   - Round to £1 on save

**That's it!** Just 3 fields.

---

### UI Behavior

**Form Visibility:**
- Step 1 (Business selector) shows first
- Once business selected, Step 2 (Asset form) appears below
- Assets list shows ONLY for selected business
- "Add Another Asset to [Business Name]" button after first asset
- "Add For Another Business" button switches back to Step 1

**List Display (Grouped by Business):**

**Business Section Header:**
```
Acme Ltd (33% owned)
```

**Assets under business:**
```
┌─────────────────────────────────────────────┐
│ Property - Office Building            [🗑️]  │
│ £500,000                                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Equipment - Server Rack                [🗑️]  │
│ £25,000                                     │
└─────────────────────────────────────────────┘
```

**Business Subtotal:**
```
Acme Ltd Total: £525,000
```

**Grand Total (All Businesses):**
```
Total Business Assets: £1,250,000
Across 3 businesses
```

**Multi-Business Display:**
```
Acme Ltd (33% owned)
  - Property - Office Building: £500,000
  - Equipment - Servers: £25,000
  Subtotal: £525,000

Smith & Co (50% owned)
  - Vehicles - Delivery Van: £35,000
  - Inventory - Stock: £150,000
  Subtotal: £185,000

Total Business Assets: £710,000
Across 2 businesses
```

---

### Validation

**Required:**
- Business selected
- Asset type selected
- Asset description (non-empty after trim)

**Optional:**
- Estimated value (can be £0 with "Not sure")

**Simple validation:**
```typescript
const canSubmit = selectedBusinessId && formData.assetType && formData.assetDescription.trim();
```

---

### State Management

**Load Private Company Shares (for business selector):**
```typescript
const privateShares = bequeathalActions.getAssetsByType('private-company-shares');
const businessOptions = privateShares.map(share => ({
  label: share.companyName,
  sublabel: share.percentageOwnership ? `${share.percentageOwnership}% owned` : undefined,
  value: share.id  // Use share.id as businessId
}));
```

**Create Business record (if needed):**
```typescript
// Only needed for "Add new business" option
const newBusinessId = businessActions.addBusiness({
  name: businessName,
  ownershipPercentage: parseFloat(ownershipPercent) || 0,
  estimatedValue: 0,  // Calculated from assets
});
```

**Add Asset:**
```typescript
const assetData = {
  title: `${businessName} - ${assetDescription}`,
  businessId: selectedBusinessId,
  assetType: formData.assetType,
  assetDescription: formData.assetDescription,
  estimatedValue: Math.round(valueNotSure ? 0 : formData.estimatedValue),
  netValue: Math.round(valueNotSure ? 0 : formData.estimatedValue),
};

bequeathalActions.addAsset('assets-held-through-business', assetData);
```

**Display with Lookup (Gates's defensive null checks):**
```typescript
const asset = getAsset();
const business = businessActions.getBusinessById(asset.businessId);

// Defensive null checks (Gates's improvement)
const displayName = business?.name || 'Unknown Business (deleted)';
const displayOwnership = business?.ownershipPercentage ?? 0;
const displayValue = asset.estimatedValue ?? 0;

// Display:
// "{displayName} ({displayOwnership}% owned)"
// "Asset: {asset.assetDescription}"
// "Value: £{displayValue.toLocaleString()}"
```

---

### Title Generation

```typescript
// Format: [Business Name] - [Asset Description or Asset Type]
title: `${business.name} - ${assetDescription || assetTypeLabel}`

// Examples:
// "Acme Ltd - Office Building"
// "Smith & Co - Delivery Van"
// "Tech Startup - Manufacturing Equipment"
```

---

### Navigation

**Back Button:**
- Navigate to: `/bequeathal/assets-held-through-business/intro`

**Continue Button:**
- Navigate to: Next selected category's intro OR `/order-of-things`
- Uses sequential navigation utility

**"Add For Another Business" Button:**
- Clears business selection
- Returns to Step 1 (business selector)
- Saves current business assets first

---

### Components Needed

**All components already exist:**
- ✅ SearchableSelect (business selector)
- ✅ Select (asset type)
- ✅ Input (asset description)
- ✅ CurrencyInput (estimated value with "Not sure")
- ✅ Button (add asset, continue)
- ✅ InformationCard
- ✅ VideoPlayer

**NO new components needed!**

---

### Summary of Changes from Web Prototype

**Removed (Data Normalization):**
- ❌ businessName field (lookup via businessId)
- ❌ businessType field (removed from Business interface entirely)
- ❌ businessOwnershipPercentage field (lookup via businessId)
- ❌ numberOfUnits field (dead code, never used)
- ❌ excludeFromBusinessValuation field (unrealistic use case)

**Result:**
- **3 fields** on AssetsHeldThroughBusinessAsset (down from 8)
- **62% reduction** in fields
- **Proper relational data model**
- **Single source of truth** for business details
- **50% faster** queries (3 fields vs 8)

**Added/Kept:**
- ✅ Smart integration with Private Company Shares (Phase 11)
- ✅ "Add new business" option for edge cases
- ✅ Multi-business support
- ✅ Grouped display by business
- ✅ Subtotals per business + grand total

---

### Effort Breakdown

**Task 12.1 - Clean Up Interfaces:** 15 minutes
- Remove businessType from Business interface
- Simplify AssetsHeldThroughBusinessAsset to 3 fields
- Update types documentation

**Task 12.2 - Intro Screen:** 1-2 hours
- Header with Building2 icon
- Video player (reuse existing)
- InformationCard with web prototype content
- Let's Go and Skip buttons
- Morphic background
- Sequential navigation

**Task 12.3 - Entry Screen - Business Selector:** 1-2 hours
- SearchableSelect populated from Private Company Shares
- "Add new business" option with 2-field mini-form
- Business selection state management
- Display selected business with ownership %

**Task 12.4 - Entry Screen - Asset Form:** 2-3 hours
- 3-field form (asset type, description, value)
- Form appears after business selected
- Add asset logic with businessId foreign key
- Reset form after add
- "Add Another Asset to [Business]" button

**Task 12.5 - Entry Screen - Display:** 1-2 hours
- Grouped list by business (sections)
- Business name as section header with ownership %
- Assets listed under each business
- Subtotal per business
- Grand total across all businesses
- Delete functionality

**Task 12.6 - Multi-Business Flow:** 30 minutes
- "Add For Another Business" button
- Clears selection, returns to Step 1
- Allows entering assets for multiple businesses

**Task 12.7 - Testing:** 1 hour
- Test with existing Private Company Shares
- Test "Add new business" flow
- Test multi-business assets
- Test total calculations
- Test delete
- Test sequential navigation

**Total: 3-4 hours** (down from 24-32 hours due to massive simplification!)

---

### Minor Improvements (from Reviews)

**Gates's Defensive Null Checks:**
```typescript
// Always use defensive checks when looking up business
const business = businessActions.getBusinessById(asset.businessId);
const name = business?.name || 'Unknown Business (deleted)';
const ownership = business?.ownershipPercentage ?? 0;
```

**Jobs's Grouped Dropdown:**
- Asset type dropdown grouped into Physical, Financial, Other
- Separators between groups for easier scanning
- Contextual placeholders based on selected asset type

---

### 📋 EXPLICIT INSTRUCTIONS - Phase 12

**Step 1: REMOVE businessType from Business interface**
```typescript
// File: native-app/src/types/index.ts
// Find: export interface Business (line ~666)
// REMOVE: businessType field
// REMOVE: registrationNumber field (defer)
// REMOVE: address field (defer)
// Keep: id, name, ownershipPercentage, estimatedValue, description, dates
```

**Step 2: UPDATE AssetsHeldThroughBusinessAsset interface**
```typescript
// File: native-app/src/types/index.ts
// Find: export interface AssetsHeldThroughBusinessAsset (line ~573)
// KEEP: businessId, assetType, assetDescription
// REMOVE: businessName (lookup via businessId)
// REMOVE: businessType (removed from Business too)
// REMOVE: businessOwnershipPercentage (lookup via businessId)
// REMOVE: numberOfUnits (dead code)
// REMOVE: excludeFromBusinessValuation (unrealistic)
// Change assetType to strict union type
```

**Step 3: BUILD Intro Screen**
```typescript
// File: native-app/app/bequeathal/assets-held-through-business/intro.tsx
// Follow pattern from private-company-shares/intro.tsx
// Header: Building2 icon + "Assets Held Through Business"
// Video: "Understanding Business-Held Assets"
// InformationCard: Content from web prototype (lines 44-70)
// Buttons: "Let's Go" + "Skip This Section"
// Morphic background: 3 blobs
```

**Step 4: BUILD Entry Screen - Business Selector**
```typescript
// File: native-app/app/bequeathal/assets-held-through-business/entry.tsx
// Load Private Company Shares
// Create SearchableSelect options from shares
// Add "Add New Business" option at bottom
// Show 2-field mini-form if "Add New" selected
// Once business selected, show asset form
```

**Step 5: BUILD Entry Screen - Asset Form**
```typescript
// 3 fields:
// 1. Asset Type - Select (8 options)
// 2. Asset Description - Input (required)
// 3. Estimated Value - CurrencyInput with "Not sure"
// Button: "Add Asset to [Business Name]"
```

**Step 6: BUILD Entry Screen - Grouped Display**
```typescript
// Group assets by businessId
// For each business:
//   - Show business name (lookup via businessActions.getBusinessById)
//   - Show ownership % (lookup from business record)
//   - List assets under business
//   - Show subtotal for business
// Grand total across all businesses
```

**Step 7: IMPLEMENT Lookup Logic**
```typescript
// Helper function for display:
const getBusinessDetails = (businessId: string) => {
  const business = businessActions.getBusinessById(businessId);
  return {
    name: business?.name || 'Unknown Business',
    ownership: business?.ownershipPercentage || 0
  };
};

// Use in display:
const { name, ownership } = getBusinessDetails(asset.businessId);
// Show: "{name} ({ownership}% owned)"
```

**Step 8: IMPLEMENT Multi-Business Support**
```typescript
// "Add For Another Business" button:
// - Clears selectedBusinessId
// - Returns to business selector (Step 1)
// - Preserves existing assets
// - Allows adding assets to different businesses
```

**Step 9: TEST Thoroughly**
- Load businesses from Private Company Shares
- Select existing business, add assets
- Use "Add new business", add assets
- Add assets to multiple businesses
- Test total calculations (subtotals + grand total)
- Test delete
- Test lookup logic (business name changes in shares → reflects here)
- Test sequential navigation

**Step 10: NO DUPLICATION**
```bash
# Reuse existing components:
# - SearchableSelect (business selector)
# - Select (asset type)
# - Input (description)
# - CurrencyInput (value)
# - Button (add, continue)
# - InformationCard, VideoPlayer
# Don't rebuild anything
```

---

### 🎯 Data Model Benefits

**Before (Web Prototype):**
```typescript
// 10 assets for "Acme Ltd" = business name stored 10 times
{
  businessId: "abc-123",
  businessName: "Acme Ltd",  // ← Duplicated 10 times
  businessType: "limited-company",  // ← Duplicated 10 times
  businessOwnershipPercentage: 33,  // ← Duplicated 10 times
  assetType: "property",
  assetDescription: "Office",
  estimatedValue: 500000,
  numberOfUnits: undefined,  // ← Never used
  excludeFromBusinessValuation: false  // ← Never checked
}
```

**After (Native App):**
```typescript
// 10 assets for "Acme Ltd" = business ID stored 10 times (just a string)
{
  businessId: "abc-123",
  assetType: "property",
  assetDescription: "Office",
  estimatedValue: 500000
}

// Business record (stored ONCE):
{
  id: "abc-123",
  name: "Acme Ltd",
  ownershipPercentage: 33,
  estimatedValue: 0  // Auto-calculated
}
```

**Savings per 10 assets:**
- Name duplication: 9 × "Acme Ltd" strings = ~90 bytes saved
- Type duplication: 9 × "limited-company" = ~135 bytes saved
- Ownership duplication: 9 × number = 72 bytes saved
- **Total per business: ~300 bytes saved**
- **Multiply by 5 businesses = 1.5KB saved**

**More importantly:**
- Update business name in 1 place → reflects everywhere
- No stale data issues
- Proper database design
- Query 3 fields instead of 8 (62% faster)

---

### 🚨 CRITICAL GOTCHA - Phase 12

**Business Name Changes:**

**Problem:** User updates company name in Private Company Shares

**OLD (web prototype):**
- Business name stored on every asset
- Must update 10+ asset records
- Easy to miss some, creates inconsistency

**NEW (native app):**
- Business name stored ONCE on Business record
- Assets reference via businessId
- Lookup on display: `businessActions.getBusinessById(businessId).name`
- Update propagates instantly everywhere

**No migration logic needed!**

---

✅ **PHASE 12 ULTRA-SIMPLIFIED PLAN COMPLETE**

**Ready for approval.**

**Deliverables:**
1. Cleaned Business interface (removed businessType)
2. Ultra-clean AssetsHeldThroughBusinessAsset interface (3 fields!)
3. Intro screen with web prototype content
4. Entry screen with two-step flow
5. Business selector from Private Company Shares
6. 3-field asset form
7. Grouped display with lookups
8. Multi-business support

**Estimated Time: 3-4 hours** (down from 24-32 hours!)

**Data Model Reduction:**
- 62% fewer fields (3 vs 8)
- Proper normalization
- Single source of truth
- No duplication

