# Phase 14: Property Implementation - Detailed Plan

**Created:** December 2024  
**Status:** Planning  
**Complexity:** VERY COMPLEX (5-7 days estimated)  
**Dependencies:** All previous phases complete (Phases 1-13)

---

## High-Level Implementation Steps

### Step 0: Review Existing Native PropertyAsset Type
**Purpose:** Understand what we already have as baseline  
**Effort:** 30 minutes  
**Deliverable:** Gap analysis between current type and web prototype requirements

### Step 1: Web Prototype Data Structure Review
**Purpose:** Analyze PropertyAsset interface, nested objects, and related types  
**Effort:** 1-2 hours  
**Deliverable:** Complete data model documentation with all fields catalogued

### Step 2: Web Prototype Interface Review (Base + Conditional Fields)
**Purpose:** Document every form field, conditional display logic, and user flow  
**Effort:** 2-3 hours  
**Deliverable:** Field-by-field specification with conditional logic mapping

### Step 3: Code Review for Business Logic (WHY These Fields/Rules)
**Purpose:** Understand IHT implications, legal requirements, and tax relief qualifications  
**Effort:** 2-3 hours  
**Deliverable:** Business logic documentation explaining rationale for each field

### Step 4: Native App Architecture Design
**Purpose:** Design screen flow, navigation, and implementation approach  
**Effort:** 2-3 hours  
**Deliverable:** Complete architecture spec with screen breakdown and navigation flow

**Sub-steps:**
- 4a: Screen Flow & Navigation Structure
- 4b: Field Specifications per Screen
- 4c: Conditional Logic Mapping

### Step 5: Differences from Web Prototype (with Rationale)
**Purpose:** Document simplifications, deferrals, and enhancements  
**Effort:** 1 hour  
**Deliverable:** Change log with justifications

### Step 6: Critical Gotchas & Implementation Instructions
**Purpose:** Prevent common mistakes, provide step-by-step implementation guide  
**Effort:** 1-2 hours  
**Deliverable:** Gotchas list + 20+ explicit implementation steps

### Step 7: Success Criteria & Testing Checklist
**Purpose:** Define "done" and create comprehensive test plan  
**Effort:** 1 hour  
**Deliverable:** Testing scenarios and validation checklist

### Step 8: Titan Review (Elon/Gates/Jobs Perspectives)
**Purpose:** Sanity check - are we over/under-engineering?  
**Effort:** 30 minutes  
**Deliverable:** Executive summary with recommendations

**Total Planning Effort:** 11-16 hours  
**Total Implementation Effort:** TBD based on plan findings

---

## Step 0: Review Existing Native PropertyAsset Type

### Current Implementation

**File:** `native-app/src/types/index.ts` (Lines 439-453)

**Current PropertyAsset Interface:**
```typescript
export interface PropertyAsset extends BaseAsset {
  type: 'property';
  address: AddressData;
  propertyType: 'residential' | 'commercial' | 'land' | 'other';
  ownershipType: 'sole' | 'joint-tenants' | 'tenants-in-common';
  ownershipPercentage?: number;
  primaryResidence?: boolean;
  hasLivedThere?: boolean;
  hasMortgage?: boolean;
  mortgage?: {
    outstandingAmount: number;
    provider: string;
  };
  beneficiaryAssignments?: BeneficiaryAssignments;  // Unified type
}
```

**Field Count:** 10 fields (plus 6 from AddressData = 16 total)

### Baseline Analysis

**What We Have:**
- ✅ Address structure (6 fields)
- ✅ Property type (4 options)
- ✅ Ownership type (3 options)
- ✅ Ownership percentage
- ✅ Primary residence flag
- ✅ Has lived there flag
- ✅ Mortgage structure (2 fields)
- ✅ Beneficiary assignments (unified type with percentage support)

**What's Missing (likely needed):**
- ❌ Property usage (buy-to-let, FHL, agricultural, etc.)
- ❌ Usage-specific fields (rental income, FHL criteria, etc.)
- ❌ Trust ownership details
- ❌ Company ownership details
- ❌ Joint ownership person details
- ❌ Acquisition date (for IHT planning)
- ❌ Funding type (gift, inheritance, purchase)
- ❌ Many more IHT-related fields

**Gap Analysis:**
- Current: 16 fields (simple baseline)
- Web prototype: Estimated 100+ fields
- Gap: ~84 fields to analyze and potentially add

**Conclusion:** Current PropertyAsset is a **skeleton**. Need massive expansion for IHT compliance.

---

## Step 1: Web Prototype Data Structure Review

### Files to Analyze

**Primary Files:**
1. `web-prototype/src/types.ts` - PropertyAsset interface
2. `web-prototype/src/components/PropertyEntryScreen.tsx` - PropertyData interface (local form state)
3. `web-prototype/src/components/property-trust-fieldsets/` - Trust-specific types

### PropertyAsset Interface (Web Prototype)

**File:** `web-prototype/src/types.ts` (Lines 330-362)

```typescript
export interface PropertyAsset extends BaseAsset {
  type: 'property';
  address: AddressData;
  propertyType: 'residential' | 'commercial' | 'land' | 'other';
  ownershipType: 'sole' | 'joint-tenants' | 'tenants-in-common';
  ownershipPercentage?: number;
  basicDetails: {                    // ← NESTED OBJECT (DUPLICATION)
    propertyType: string;
    ownershipType: string;
    ownershipPercentage: string;
    primaryResidence: boolean;
    hasLivedThere: boolean;
    hasMortgage: boolean;
    outstandingMortgage?: string;
    estimatedValue: string;
  };
  mortgage?: {
    outstandingAmount: number;
    provider: string;
  };
  beneficiaryAssignments?: {       // ← OLD FORMAT (pre-unified)
    beneficiaries: Array<{
      id: string;
      type: 'person';
      percentage: number;
    }>;
    groups: Array<{
      id: string;
      type: 'group';
      percentage: number;
    }>;
  };
}
```

**Issues Identified:**
1. **Duplication:** `basicDetails` nested object duplicates top-level fields
2. **Old beneficiary format:** Separate arrays for people/groups (we've unified this)
3. **Limited fields:** Only 12 fields (but PropertyData interface has 100+)

### PropertyData Interface (Local Form State)

**File:** `web-prototype/src/components/PropertyEntryScreen.tsx` (Lines 26-170)

**Documented Fields (categorized):**

#### Basic Details (8 fields)
- `ownershipType`: 'sole' | 'joint-tenants' | 'tenants-in-common' | 'company' | 'trust'
- `usage`: 'residential' | 'let_residential' | 'commercial' | 'let_commercial' | 'agricultural' | 'mixed_use'
- `propertyType`: Conditional on usage (primary_residence, buy_to_let, furnished_holiday_let, etc.)
- `acquisitionMonth`: string
- `acquisitionYear`: string
- `jointlyOwned`: boolean
- `companyOwned`: boolean
- `trustOwned`: boolean

#### Company Ownership Fields (9 fields)
- `companyName`: string
- `companyOwnershipPercentage`: string
- `companyCountryOfRegistration`: string
- `companyShareClass`: string
- `companyNotes`: string
- `companyArticlesConfident`: boolean
- `isCompanyDirector`: boolean

#### Trust Ownership Fields (15+ fields)
- `trustRole`: 'beneficiary' | 'settlor' | 'trustee' | 'life-tenant'
- `trustName`: string
- `trustType`: string
- `trustCreationMonth`: string
- `trustCreationYear`: string
- `trustEntitlementType`: string
- `trustRightOfOccupation`: boolean
- `trustBenefitDescription`: string
- `trustIsIPDI`: string (yes/no/not-sure)
- `trustIsSettlor`: string (yes/no)
- Plus settlor-specific fields (10+ more)

#### Residential Details (3 fields)
- `primaryResidence`: boolean
- `hasLivedThere`: boolean
- `hasMortgage`: boolean

#### Mortgage Details (3 fields)
- `estimatedValue`: string
- `outstandingMortgage`: string
- `mortgageProvider`: string
- `mortgageJointlyHeldWith`: string

#### Funding Details (6 fields)
- `fundingType`: string[] (multiple select: gift, inheritance, purchase, etc.)
- `giftSize`: string
- `giftMonth`: string
- `giftYear`: string
- `benefitReservedByDonor`: string (yes/no/not-sure)
- `payingMarketRent`: boolean
- `monthlyRentPaid`: string

#### FHL (Furnished Holiday Let) Specific (4 fields)
- `fhlAvailableOver210Days`: boolean
- `fhlActuallyLet105Days`: boolean
- `fhlLongLetsUnder155Days`: boolean
- `fhlEstimatedAnnualIncome`: string

#### Agricultural Specific (4 fields)
- `agriculturalActivelyFarmed`: boolean
- `agriculturalWhoFarms`: string
- `agriculturalPre1995Tenancy`: boolean
- `agriculturalEstimatedAnnualIncome`: string

#### Buy-to-Let Specific (4 fields)
- `buyToLetAnnualRentalIncome`: string
- `buyToLetTenancyType`: string
- `buyToLetTenancyTypeOther`: string
- `buyToLetTenantedAtDeath`: boolean

#### Residential + Holiday Home (2 fields)
- `residentialSometimesRentedOut`: boolean
- `residentialWeeksRentedPerYear`: string

#### Settlor Trust Fields (20+ additional fields)
- `settlorLifeTenant`: Person | null
- `settlorRemaindermen`: Person[]
- `settlorBeneficiaries`: Person[] (with percentages)
- `settlorBeneficiaryClasses`: string
- `settlorSettlorSpouseCanReceive`: string
- `settlorCoBeneficiaries`: Person[]
- `settlorTrustees`: Person[]
- Plus more trust-specific fields

**Total Field Count:** ~100+ fields across all conditional paths

### Data Structure Observations

**Complexity Drivers:**
1. **Ownership type** (5 options) → Each unlocks different fieldsets
2. **Usage type** (6+ options) → Each has unique IHT/tax implications
3. **Property type** (conditional on usage) → Further conditional fields
4. **Trust role** (4 options) → Massive fieldset per role

**Conditional Nesting:**
```
ownershipType
├─ sole → Basic fields only
├─ joint-tenants → Joint tenant details
├─ tenants-in-common → Joint tenant details + percentage split
├─ company → Company details (9 fields)
└─ trust → Trust role selection
    ├─ beneficiary → Trust beneficiary fields (~10 fields)
    ├─ settlor → Settlor fields (~20 fields) + trust structure
    ├─ trustee → Trustee fields
    └─ life-tenant → Life tenant fields + remaindermen

usage
├─ residential → Primary residence? + Sometimes rented?
├─ let_residential → Property type selection
│   ├─ buy_to_let → Buy-to-Let fields (4)
│   ├─ furnished_holiday_let → FHL fields (4)
│   └─ short_term_let → Similar to FHL
├─ commercial → Commercial usage fields
├─ let_commercial → FHL commercial variant
├─ agricultural → Agricultural fields (4)
└─ mixed_use → Combinations of above
```

**This is a decision tree with ~8-10 branches, each 5-15 fields deep.**

---

## Step 2: Web Prototype Interface Review (Base + Conditional Fields)

### Screen Flow Analysis

**Web Prototype Uses Multi-Step Wizard:**

**Screens:**
1. Property Intro Screen
2. Address Search Screen (Google Places API)
3. Basic Details Screen (ownership, usage, type)
4. **Conditional Screens Based on Ownership:**
   - If company: Company Details Screen
   - If trust: Trust Details Screen (extensive)
5. **Conditional Screens Based on Usage:**
   - If FHL: FHL Qualification Screen
   - If Buy-to-Let: Buy-to-Let Details Screen
   - If Agricultural: Agricultural Details Screen
6. Mortgage & Valuation Screen
7. **Conditional:**
   - If funded by gift: Gift Details Screen
8. Property Summary Screen

**Total:** 3-8 screens depending on selections

### Base Fields (Always Required)

**Address (6 fields) - Screen 1:**
- address1 (string, REQUIRED)
- address2 (string, optional)
- city (string, REQUIRED)
- county (string, REQUIRED)
- postcode (string, REQUIRED, format validation)
- country (string, REQUIRED)

**OR:**
- Google Places API address search (simplified entry)

**Ownership Type (1 field) - Screen 2:**
- ownershipType (RadioGroup, REQUIRED)
  - Options: Sole Ownership / Joint Tenants / Tenants in Common / Company Owned / Held in Trust
  - Triggers: Different conditional screens based on selection

**Usage (1 field) - Screen 2:**
- usage (RadioGroup, REQUIRED)
  - Options: Residential / Let Residential / Commercial / Let Commercial / Agricultural / Mixed Use
  - Triggers: Different property type options and conditional screens

**Property Type (1 field) - Screen 2:**
- propertyType (Select, REQUIRED, conditional on usage)
  - If residential: Primary Residence / Second Home
  - If let_residential: Buy to Let / Furnished Holiday Let / Short-term Let/Airbnb
  - If commercial: Office / Retail / Industrial / Other
  - If let_commercial: Furnished Holiday Let / Other
  - If agricultural: Farmland / Farm Buildings / Farmhouse / Mixed
  - If mixed_use: Combinations

**Basic Residential Details (3 fields) - Screen 2:**
- primaryResidence (boolean) - If residential usage
- hasLivedThere (boolean) - If residential usage
- hasMortgage (boolean) - Always shown

**Estimated Value (1 field) - Screen 6:**
- estimatedValue (CurrencyInput, REQUIRED)
- Round to £1

**Total Base Fields:** 13-14 fields (depending on usage selections)

### Conditional Fieldsets

#### Ownership Type: Joint Tenants or Tenants in Common

**Fields (2-3):**
- Joint tenant selector (person from family)
- If tenants in common: Ownership percentage split

**Purpose:**
- Joint Tenants: Property automatically goes to survivor (bypasses will)
- Tenants in Common: Your share goes via will (needs % and beneficiaries)

**IHT Implications:**
- Joint Tenants: Not distributed via will (flag for user)
- Tenants in Common: Part of estate, needs beneficiary designation

#### Ownership Type: Company Owned

**Fields (7):**
- companyName (string, REQUIRED)
- companyOwnershipPercentage (number, 0-100)
- companyCountryOfRegistration (string)
- companyShareClass (string)
- companyNotes (textarea)
- companyArticlesConfident (boolean) - "Confident articles of association allow transfer?"
- isCompanyDirector (boolean)

**Purpose:**
- Property owned by company = complex transfer
- Articles of association may restrict transfer
- Director status affects control

**IHT Implications:**
- Property owned by company may qualify for BPR
- Transfer restrictions affect executors

#### Ownership Type: Held in Trust

**THIS IS THE BIG ONE - 30+ fields depending on trust role**

**Trust Role Selection (RadioGroup):**
- Beneficiary of Trust
- Settlor of Trust (created the trust)
- Trustee
- Life Tenant

**Each role unlocks different fieldsets...**

**If Trust Beneficiary (10 fields):**
- Trust name
- Trust type
- Trust creation date (month/year)
- Entitlement type
- Right of occupation?
- Benefit description
- Is it an IPDI (Immediate Post Death Interest)?
- Co-beneficiaries (person selector, multiple)

**If Settlor (20-30 fields):**
- All trust beneficiary fields, PLUS:
- Life tenant selection (person)
- Remaindermen (person selector, multiple, with %)
- Beneficiaries (person selector, multiple, with %)
- Beneficiary classes description
- Can settlor's spouse receive benefits?
- Trustees (person selector, multiple)
- Trust value when transferred
- Settlor reserved benefits?
- Benefit description
- Is it an IPDI for settlor?
- Plus funding details (gift with reservation, etc.)

**If Life Tenant (8 fields):**
- Trust name
- Right to live in property
- Can you sell/mortgage?
- Remaindermen (who gets it after you)
- Trust creation details

**Purpose:**
- Trusts have complex IHT treatment
- IPDI trusts qualify for nil-rate band
- Settlor-interested trusts may be in estate (GROB - Gift with Reservation of Benefit)
- Life tenant interests affect valuation

**IHT Implications:**
- Different trust types = different IHT treatments
- IPDI = can use nil-rate band
- GROB = still in estate despite trust
- Remaindermen = who ultimately inherits

#### Usage: Furnished Holiday Let (FHL)

**Fields (4):**
- fhlAvailableOver210Days (checkbox, must be checked for BPR)
- fhlActuallyLet105Days (checkbox, must be checked for BPR)
- fhlLongLetsUnder155Days (checkbox, must be checked for BPR)
- fhlEstimatedAnnualIncome (currency)

**Purpose:**
- FHL qualifying criteria for Business Property Relief
- ALL 3 checkboxes must be true for 50-100% BPR
- Annual income helps valuation

**IHT Implications:**
- Qualifying FHL = Business Property Relief (50-100% IHT relief)
- Non-qualifying FHL = standard property IHT

**Validation:**
- If all 3 checkboxes checked: Property qualifies for BPR
- If any unchecked: Show warning "Property does not qualify as FHL"

#### Usage: Buy-to-Let

**Fields (4):**
- buyToLetAnnualRentalIncome (currency, REQUIRED)
- buyToLetTenancyType (select, REQUIRED)
  - Options: Assured Shorthold Tenancy (AST) / Company Let / Holiday Let / Other
- buyToLetTenancyTypeOther (text, conditional on "Other")
- buyToLetTenantedAtDeath (boolean)

**Purpose:**
- Rental income affects valuation
- Tenancy type affects executor's ability to sell
- Tenanted property = harder to sell quickly

**IHT Implications:**
- Rental income capitalized for valuation
- Tenanted property may have reduced quick-sale value

#### Usage: Agricultural

**Fields (4):**
- agriculturalActivelyFarmed (boolean)
- agriculturalWhoFarms (string - "self", "tenant", "contractor")
- agriculturalPre1995Tenancy (boolean)
- agriculturalEstimatedAnnualIncome (currency)

**Purpose:**
- Agricultural Property Relief (APR) qualification
- Actively farmed = up to 100% APR
- Pre-1995 tenancies have special treatment

**IHT Implications:**
- APR = 50-100% IHT relief on agricultural property
- Must be actively farmed
- Tenanted agricultural land may qualify at lower rate

#### Usage: Residential (Sometimes Rented)

**Fields (2):**
- residentialSometimesRentedOut (boolean)
- residentialWeeksRentedPerYear (number)

**Purpose:**
- Income generation affects valuation
- May affect primary residence relief

#### Mortgage Details (3-4 fields)

**Always Shown if hasMortgage = true:**
- outstandingMortgage (currency, REQUIRED)
- mortgageProvider (string, REQUIRED)
- mortgageJointlyHeldWith (person selector, if joint ownership)

**Purpose:**
- Net value = Gross value - Mortgage
- Joint mortgage = liability split

#### Funding Type (7 fields)

**If property acquired by gift:**
- fundingType (multi-select checkboxes)
  - Gift
  - Inheritance
  - Purchase
  - Other
- giftSize (currency, if gift selected)
- giftMonth/giftYear (date, if gift selected)
- benefitReservedByDonor (yes/no/not-sure) - GROB question
- payingMarketRent (boolean, if benefit reserved)
- monthlyRentPaid (currency, if paying rent)

**Purpose:**
- Gift with Reservation of Benefit (GROB) = still in donor's estate
- 7-year rule for IHT on gifts
- Paying market rent = not a GROB

**IHT Implications:**
- Gifts within 7 years = tapered IHT
- GROB = full IHT as if still owned
- Paying market rent negates GROB

### Data Structure Summary

**Total Fields by Category:**
- Base/Always: 14 fields
- Company Ownership: +9 fields (23 total if company)
- Trust Ownership: +30-40 fields (44-54 total if trust)
- FHL Usage: +4 fields
- Buy-to-Let Usage: +4 fields
- Agricultural Usage: +4 fields
- Funding (Gift): +7 fields

**Absolute Maximum:** ~70 fields if user selects:
- Trust ownership (settlor) + FHL usage + Gift funded + Mortgage

**Typical Case:** ~20-30 fields
- Sole ownership + Residential + Mortgage + Basic details

**Minimum Case:** ~14 fields
- Sole ownership + Residential + No mortgage + Basic details

---

## Step 3: Code Review for Business Logic (WHY These Fields/Rules)

### IHT and Tax Relief Logic

#### Why FHL Needs 3 Specific Criteria

**From PropertyEntryScreen.tsx lines 892-903:**

```typescript
const isFHLSectionValid = () => {
  return propertyData.fhlAvailableOver210Days &&
         propertyData.fhlActuallyLet105Days &&
         propertyData.fhlLongLetsUnder155Days &&
         propertyData.fhlEstimatedAnnualIncome.trim() !== "";
};
```

**Business Logic:**
- **210 days available:** HMRC requirement for FHL status
- **105 days actually let:** HMRC requirement for FHL status  
- **155 days long lets:** HMRC requirement (short lets only)
- **All 3 must be true** for Business Property Relief (50-100% IHT relief)

**Why This Matters:**
- FHL qualifying for BPR = £500k property might save £200k IHT (40% of value)
- Non-qualifying = full IHT liability
- Critical distinction for estate planning

**Source:** HMRC guidance on Furnished Holiday Lettings (FHL)

#### Why Joint Tenants vs Tenants in Common Matters

**From PropertyEntryScreen.tsx conditional logic:**

```typescript
if (ownershipType === 'joint-tenants') {
  // Property automatically passes to surviving joint tenant
  // Does NOT go through will
  // Show warning to user
}

if (ownershipType === 'tenants-in-common') {
  // Your share goes through will
  // Need ownership percentage
  // Need beneficiary designation
}
```

**Business Logic:**
- **Joint Tenants:** Right of survivorship (bypasses will entirely)
- **Tenants in Common:** Share is a bequeathable asset (goes via will)

**Why This Matters:**
- Joint tenants = can't bequeath in will (user needs to know!)
- Tenants in common = MUST specify beneficiaries
- Legal distinction, not user preference

**Source:** UK property law on joint ownership

#### Why GROB (Gift with Reservation of Benefit) Questions

**From PropertyEntryScreen.tsx funding section:**

```typescript
if (fundingType.includes('gift')) {
  // Ask: Did donor reserve benefit?
  // If yes: Ask if paying market rent
  // If no market rent: GROB = still in donor's estate for IHT
}
```

**Business Logic:**
- **Gift with reservation** = you received property as gift but donor still uses it
- **Example:** Parents gift house to child, but still live there rent-free
- **IHT Treatment:** Property still counted in DONOR's estate (even though legally yours)
- **Exception:** If you pay donor market rent, it's not a GROB

**Why This Matters:**
- GROB = £500k property in YOUR will AND donor's estate (double taxation risk)
- Need to flag for executor to claim relief
- Paying market rent = proves it's a genuine gift

**Source:** HMRC IHT400 guidance on Gifts with Reservation of Benefit

#### Why Agricultural Property Relief (APR) Fields

**From PropertyEntryScreen.tsx agricultural section:**

```typescript
if (usage === 'agricultural') {
  // Must be actively farmed for APR
  // Who farms it? (self = 100% relief, tenant = 50% relief)
  // Pre-1995 tenancy = special rules
}
```

**Business Logic:**
- **APR rates:**
  - Farmed by owner/hand: 100% relief
  - Farmed by tenant: 50% relief (unless pre-1995 tenancy = 100%)
- **Actively farmed requirement:** Must be in active agricultural use
- **7-year ownership:** For full relief (but not asked in web prototype - assume user knows)

**Why This Matters:**
- APR = up to 100% IHT relief on farmland
- £2M farm could save £800k IHT
- Critical for farming families

**Source:** HMRC guidance on Agricultural Property Relief

#### Why Trust Fields Are So Extensive

**From property-trust-fieldsets/ components:**

**Trust types have different IHT treatments:**

1. **IPDI (Immediate Post Death Interest):**
   - Qualifies for nil-rate band
   - Life tenant has immediate right to income/occupation
   - On life tenant's death, property passes to remaindermen
   - IHT charged at that point (not on trust creation)

2. **Discretionary Trust:**
   - No automatic IHT benefits
   - Flexible for trustees
   - 10-year charges

3. **Bare Trust:**
   - Beneficiaries have absolute right
   - Treated as belonging to beneficiary for IHT

**Why We Need Settlor vs Beneficiary vs Life Tenant:**
- **Settlor:** Created the trust = may still be in their estate (GROB rules)
- **Beneficiary:** Receives benefit = needs to know entitlement type
- **Life Tenant:** Has use during life, then passes to remaindermen
- **Trustee:** Manages trust = not owner

**Why Remaindermen with Percentages:**
- After life tenant dies, property passes to remaindermen
- Need to track WHO and HOW MUCH (percentage splits)
- Critical for long-term estate planning

**Source:** UK trust law and HMRC IHT treatment of trusts

### Field Dependencies & Validation Rules

**Discovered from Code:**

**Rule 1: Joint Ownership Requires Person Selection**
```typescript
if (ownershipType === 'joint-tenants' || ownershipType === 'tenants-in-common') {
  // MUST select joint tenant(s)
  // Validation: jointTenants.length > 0
}
```

**Rule 2: Tenants in Common Requires Percentage**
```typescript
if (ownershipType === 'tenants-in-common') {
  // MUST specify your ownership %
  // Validation: 0 < ownershipPercentage <= 100
  // Context: Other tenant(s) own (100 - your %)
}
```

**Rule 3: FHL All-or-Nothing**
```typescript
if (propertyType === 'furnished_holiday_let') {
  // ALL 3 criteria must be checked for BPR qualification
  // If any unchecked: Show warning "Does not qualify as FHL"
  // Still allow save (user might want to record it anyway)
}
```

**Rule 4: Company Ownership Requires Company Details**
```typescript
if (ownershipType === 'company') {
  // MUST have company name
  // SHOULD have ownership % (what % of company do you own?)
  // SHOULD answer articles confident question
}
```

**Rule 5: Trust Ownership Requires Role Selection**
```typescript
if (ownershipType === 'trust') {
  // MUST select trust role (beneficiary/settlor/trustee/life-tenant)
  // Each role unlocks 8-30 additional fields
  // Settlor role = most complex (full trust structure)
}
```

**Rule 6: Gift Funding Triggers GROB Questions**
```typescript
if (fundingType.includes('gift')) {
  // MUST ask if donor reserved benefit
  // If yes: MUST ask if paying market rent
  // Logic: No market rent = GROB = still in donor's estate
}
```

**Rule 7: Mortgage Details Conditional**
```typescript
if (hasMortgage === true) {
  // MUST have outstanding amount
  // MUST have provider
  // If joint ownership: SHOULD specify if mortgage jointly held
}
```

### Why We Can't Simplify Much

**Critical IHT Questions We MUST Ask:**
- FHL criteria (3 checkboxes) → Determines £200k+ tax savings
- Joint tenants vs tenants in common → Legal distinction (can't bequeath joint tenants)
- Agricultural actively farmed → 100% vs 50% vs 0% APR
- Trust role and structure → Complex IHT treatment
- GROB questions → Prevents double-taxation confusion

**These aren't "nice to haves" - they're legal/tax requirements.**

---

## Step 4: Native App Architecture Design

### Step 4a: Screen Flow & Navigation Structure

**Proposed Approach: Progressive Disclosure Wizard**

**Why Wizard:**
- 100+ fields in one screen = overwhelming
- Conditional logic easier to handle across screens
- User can see progress (Step 2 of 5)
- Can save partial data between screens

**Screen Sequence:**

#### Screen 1: Property Intro
**Route:** `/bequeathal/property/intro`
- Educational content
- Video about property in wills
- "Let's Go" → Screen 2

#### Screen 2: Address Entry
**Route:** `/bequeathal/property/address`
- Manual address entry (6 fields)
- OR: Address search component (if we build it)
- Continue → Screen 3

#### Screen 3: Basic Details
**Route:** `/bequeathal/property/basic-details`
- Ownership type (5 options)
- Usage (6 options)
- Property type (conditional on usage)
- Primary residence / Has lived there (if residential)
- Continue → Screen 4 (conditional)

#### Screen 4a: Company Details (Conditional)
**Route:** `/bequeathal/property/company-details`
**Shown if:** ownershipType === 'company'
- 7 company fields
- Continue → Screen 5

#### Screen 4b: Trust Details (Conditional)
**Route:** `/bequeathal/property/trust-details`
**Shown if:** ownershipType === 'trust'
- Trust role selection
- Role-specific fields (8-30 fields)
- Continue → Screen 5

#### Screen 4c: Joint Ownership Details (Conditional)
**Route:** `/bequeathal/property/joint-details`
**Shown if:** ownershipType === 'joint-tenants' OR 'tenants-in-common'
- Joint tenant selector
- Ownership percentage (if tenants in common)
- Continue → Screen 5

#### Screen 5a: FHL Details (Conditional)
**Route:** `/bequeathal/property/fhl-details`
**Shown if:** propertyType === 'furnished_holiday_let'
- 3 FHL qualifying checkboxes
- Annual income
- Continue → Screen 6

#### Screen 5b: Buy-to-Let Details (Conditional)
**Route:** `/bequeathal/property/buy-to-let-details`
**Shown if:** propertyType === 'buy_to_let'
- 4 buy-to-let fields
- Continue → Screen 6

#### Screen 5c: Agricultural Details (Conditional)
**Route:** `/bequeathal/property/agricultural-details`
**Shown if:** usage === 'agricultural'
- 4 agricultural fields
- Continue → Screen 6

#### Screen 6: Mortgage & Valuation
**Route:** `/bequeathal/property/valuation`
- Has mortgage? (yes/no)
- If yes: Mortgage details (3 fields)
- Estimated value (REQUIRED)
- Continue → Screen 7 (conditional) OR Summary

#### Screen 7: Funding Details (Conditional)
**Route:** `/bequeathal/property/funding`
**Shown if:** User wants to specify funding (optional screen)
- Funding type (multi-select)
- If gift: Gift details + GROB questions (7 fields)
- Continue → Summary

#### Screen 8: Summary
**Route:** `/bequeathal/property/summary`
- Review all entered data
- Edit buttons → Go back to specific screen
- Confirm & Save → Adds property to bequeathal data
- Add Another Property → Reset to Screen 2
- Continue → Next category or order-of-things

**Total Screens:** 3-8 depending on selections

**Navigation State Management:**
- Store partial property data in component state
- Save to AsyncStorage only on final confirmation
- Allow back navigation to edit
- Track which screens user needs to see (conditional path)

### Step 4b: Field Specifications per Screen

#### Screen 2: Address Entry

**Fields (6):**
1. Address Line 1 * (Input)
2. Address Line 2 (Input, optional)
3. City/Town * (Input)
4. County * (Input)
5. Postcode * (Input, format validation)
6. Country * (Select: England, Wales, Scotland, Northern Ireland, Other)

**Validation:**
- Address 1, City, County, Postcode, Country: REQUIRED
- Postcode format: UK postcode regex (flexible, allow variations)

**Title Generation:**
- Use address line 1 + postcode for property title
- Example: "15 High Street, SW1A 1AA"

#### Screen 3: Basic Details

**Fields (3-5):**
1. **Ownership Type** * (RadioGroup)
   - Sole Ownership
   - Joint Tenants
   - Tenants in Common
   - Company Owned
   - Held in Trust

2. **Usage** * (RadioGroup)
   - Residential
   - Let Residential
   - Commercial
   - Let Commercial
   - Agricultural
   - Mixed Use

3. **Property Type** * (Select, conditional on usage)
   - Options change based on usage selection
   - See "Property Type Options" section below

4. **Primary Residence?** (Checkbox, if usage === 'residential')
   - Affects Main Residence Relief

5. **Have you lived there?** (Checkbox, if usage === 'residential')
   - Context for executors

**Conditional Property Type Options:**

**If usage === 'residential':**
- Primary Residence
- Second Home

**If usage === 'let_residential':**
- Buy to Let
- Furnished Holiday Let
- Short-term Let/Airbnb

**If usage === 'commercial':**
- Office
- Retail
- Industrial
- Other

**If usage === 'let_commercial':**
- Furnished Holiday Let (Commercial)
- Other

**If usage === 'agricultural':**
- Farmland
- Farm Buildings
- Farmhouse
- Mixed Agricultural

**If usage === 'mixed_use':**
- Residential + Commercial
- Other Combination

#### Screen 4a: Company Details (Conditional)

**Shown if:** ownershipType === 'company'

**Fields (7):**
1. Company Name * (Input)
2. Your Ownership % in Company (PercentageInput, 0-100)
3. Country of Registration (Input, default: "United Kingdom")
4. Share Class (Input, optional, e.g., "Ordinary", "Class A")
5. Notes (Textarea, optional)
6. Confident Articles Allow Transfer? (Checkbox)
   - Label: "I'm confident the articles of association allow transfer of property ownership"
7. Are you a Company Director? (Checkbox)

**Validation:**
- Company name REQUIRED
- All others optional

**Purpose:**
- Property owned by company = complex transfer
- Articles of association may restrict transfers
- Director status gives control

#### Screen 4b: Trust Details (Conditional)

**Shown if:** ownershipType === 'trust'

**MASSIVE COMPLEXITY - Needs Sub-Wizard**

**First: Trust Role Selection (RadioGroup):**
- I'm a Beneficiary of the Trust
- I'm the Settlor (created the trust)
- I'm a Trustee
- I'm a Life Tenant

**Then: Role-Specific Fields**

**If Beneficiary (10 fields):**
1. Trust Name * (Input)
2. Trust Type (Select: Bare, Discretionary, Interest in Possession, Other)
3. Trust Creation Month (Select)
4. Trust Creation Year (Input, 1900-2024)
5. Your Entitlement Type (Select: Income only, Capital only, Income and Capital, Discretionary)
6. Right of Occupation? (RadioGroup: Yes/No/Limited)
7. Benefit Description (Textarea)
8. Is it an IPDI? (RadioGroup: Yes/No/Not Sure)
9. Co-Beneficiaries (PersonSelector, multi, optional)
10. Trustees (PersonSelector, multi, optional)

**If Settlor (30+ fields):**
1-10: All beneficiary fields above, PLUS:
11. Life Tenant (PersonSelector, single, can be "myself")
12. Remaindermen (PersonSelector, multi, with %) 
13. Beneficiaries (PersonSelector, multi, with %)
14. Beneficiary Classes (Textarea, e.g., "My children and remoter issue")
15. Can Settlor's Spouse Receive Benefits? (RadioGroup)
16. Trust Value When Transferred (Currency)
17. Did Settlor Reserve Benefits? (RadioGroup)
18. If yes: Benefit Description (Textarea)
19. If yes: Paying Market Rent? (Checkbox)
20. If yes: Monthly Rent Paid (Currency)
21. Is it an IPDI for Settlor? (RadioGroup)
22-30: More trust-specific fields...

**If Life Tenant (8 fields):**
1. Trust Name *
2. Right to Live in Property? (RadioGroup)
3. Can You Sell/Mortgage? (RadioGroup)
4. Remaindermen (PersonSelector, multi)
5. Remaindermen Percentages (if multiple)
6. Trust Creation Date
7. Trust Type
8. Notes

**If Trustee (5 fields):**
1. Trust Name *
2. Trust Type
3. Your Trustee Role (Select: Individual, Corporate, Professional)
4. Other Trustees (PersonSelector, multi)
5. Notes

**Complexity Level: EXTREME**

**Simplification Opportunities:**
- Could defer detailed trust structure to "Trust Management" section
- Just collect: Trust name, your role, basic details
- Link to full Trust record (if we build Trust management)

#### Screen 5a: FHL Details (Conditional)

**Shown if:** propertyType contains 'furnished_holiday_let'

**Fields (4):**
1. Available to let 210+ days/year? * (Checkbox)
2. Actually let 105+ days/year? * (Checkbox)
3. Long lets (31+ days) under 155 days/year? * (Checkbox)
4. Estimated Annual Income * (Currency)

**Validation:**
- All 4 fields REQUIRED
- If any checkbox unchecked: Show warning "Property may not qualify for FHL status (affects IHT relief)"

**Visual Warning:**
```
⚠️ FHL Qualification Status
All 3 criteria must be met for Business Property Relief (50-100% IHT relief)
Current status: ✓✓✗ - Does not qualify
```

#### Screen 5b: Buy-to-Let Details (Conditional)

**Shown if:** propertyType === 'buy_to_let'

**Fields (4):**
1. Annual Rental Income * (Currency)
2. Tenancy Type * (Select)
   - Assured Shorthold Tenancy (AST)
   - Company Let
   - Holiday Let
   - Other
3. If Other: Specify Tenancy Type * (Input)
4. Currently Tenanted? (Checkbox)
   - Label: "Will the property be tenanted at your death?"

**Validation:**
- Annual rental income REQUIRED
- Tenancy type REQUIRED
- If "Other": Specification REQUIRED

#### Screen 5c: Agricultural Details (Conditional)

**Shown if:** usage === 'agricultural'

**Fields (4):**
1. Actively Farmed? * (RadioGroup: Yes/No)
2. Who Farms It? * (Select: Self, Family Member, Tenant, Contractor)
3. Pre-1995 Tenancy? (Checkbox)
4. Estimated Annual Income (Currency, optional)

**Validation:**
- Actively farmed REQUIRED
- Who farms REQUIRED if actively farmed

**APR Qualification Logic:**
- Self/Family farmed + Active = 100% APR likely
- Tenant farmed + Active = 50% APR likely (100% if pre-1995)
- Not actively farmed = 0% APR

#### Screen 6: Mortgage & Valuation

**Fields (4-5):**
1. Estimated Property Value * (Currency)
2. Has Mortgage? * (RadioGroup: Yes/No)
3. If Yes: Outstanding Mortgage Amount * (Currency)
4. If Yes: Mortgage Provider * (Input)
5. If Yes + Joint Ownership: Mortgage Jointly Held? (Checkbox)

**Validation:**
- Estimated value REQUIRED
- If has mortgage: Amount and provider REQUIRED

**Calculation:**
```typescript
netValue = estimatedValue - (hasMortgage ? outstandingMortgage : 0)
```

#### Screen 7: Funding Details (Conditional - Optional Screen)

**Shown if:** User taps "Add Funding Details" (optional)

**Fields (7 max):**
1. How Was Property Funded? (Multi-select checkboxes)
   - Gift
   - Inheritance
   - Purchase (mortgage/savings)
   - Other
   
**If "Gift" selected (6 additional fields):**
2. Gift Amount (Currency)
3. Gift Month (Select)
4. Gift Year (Input)
5. Did Donor Reserve Benefit? (RadioGroup: Yes/No/Not Sure)
6. If Yes: Paying Market Rent? (Checkbox)
7. If Yes: Monthly Rent Paid (Currency)

**Validation:**
- If gift selected: Gift amount, month, year REQUIRED
- If donor reserved benefit: Market rent question REQUIRED

**GROB Logic:**
- Donor reserved benefit + No market rent = GROB (still in donor's estate)
- Show warning to user

#### Screen 8: Property Summary

**Review Screen:**
- Display all entered data in sections
- Edit buttons per section → Jump back to that screen
- "Confirm & Add Property" button
- "Add Another Property" button (after save)
- "Continue to Next Category" button

**Data Persistence:**
- Save property to AsyncStorage on confirm
- Reset wizard state
- Navigate to entry screen list view OR next category

### Step 4c: Conditional Logic Mapping

**Decision Tree:**

```
START → Address Entry → Basic Details
                            ↓
                    Ownership Type?
                    ├─ Sole → Skip to Usage Conditionals
                    ├─ Joint Tenants → Joint Details Screen → Usage Conditionals
                    ├─ Tenants in Common → Joint Details Screen → Usage Conditionals
                    ├─ Company → Company Details Screen → Usage Conditionals
                    └─ Trust → Trust Details Screen → Usage Conditionals
                            ↓
                    Usage/Property Type?
                    ├─ FHL → FHL Details Screen
                    ├─ Buy-to-Let → Buy-to-Let Screen
                    ├─ Agricultural → Agricultural Screen
                    └─ Other → Skip
                            ↓
                    Mortgage & Valuation (Always)
                            ↓
                    Funding Details (Optional)
                            ↓
                    Summary & Confirm
```

**State Management:**
```typescript
interface PropertyWizardState {
  currentScreen: 'address' | 'basic' | 'company' | 'trust' | 'joint' | 
                 'fhl' | 'buy-to-let' | 'agricultural' | 'valuation' | 
                 'funding' | 'summary';
  completedScreens: Set<string>;
  propertyData: Partial<PropertyAsset>;
  
  // Track which conditional screens to show
  requiresCompanyScreen: boolean;
  requiresTrustScreen: boolean;
  requiresJointScreen: boolean;
  requiresFHLScreen: boolean;
  requiresBuyToLetScreen: boolean;
  requiresAgriculturalScreen: boolean;
}
```

**Navigation Logic:**
```typescript
const getNextScreen = (currentScreen, propertyData) => {
  switch (currentScreen) {
    case 'address':
      return 'basic';
    
    case 'basic':
      // Check ownership type
      if (propertyData.ownershipType === 'company') return 'company';
      if (propertyData.ownershipType === 'trust') return 'trust';
      if (propertyData.ownershipType === 'joint-tenants' || 
          propertyData.ownershipType === 'tenants-in-common') return 'joint';
      // Fall through to usage conditionals
      return getUsageScreen(propertyData);
    
    case 'company':
    case 'trust':
    case 'joint':
      return getUsageScreen(propertyData);
    
    case 'fhl':
    case 'buy-to-let':
    case 'agricultural':
      return 'valuation';
    
    case 'valuation':
      return 'summary';  // Funding is optional, skip to summary
    
    case 'summary':
      return null;  // End of wizard
  }
};

const getUsageScreen = (propertyData) => {
  if (propertyData.propertyType === 'furnished_holiday_let') return 'fhl';
  if (propertyData.propertyType === 'buy_to_let') return 'buy-to-let';
  if (propertyData.usage === 'agricultural') return 'agricultural';
  return 'valuation';  // No usage-specific screen needed
};
```

---

## Step 5: Differences from Web Prototype (with Rationale)

### Proposed Simplifications

#### 1. Defer Funding Details Screen

**Web Prototype:** Always asks funding type, gift details, GROB questions

**Proposed:** Make funding screen OPTIONAL (user can skip)

**Rationale:**
- Funding type doesn't affect will distribution (property is already yours)
- GROB is edge case (property gifted but donor still lives there)
- User can add funding details later in "Executor Facilitation"
- Reduces mandatory fields by 7

**Keep:** GROB warning if user does provide gift details

#### 2. Simplify Trust Structure Collection

**Web Prototype:** Full trust structure (30+ fields for settlor role)

**Proposed:** Simplified trust collection
- Trust name
- Your role in trust
- Basic entitlement
- Defer: Full trust structure to "Trust Management" section

**Rationale:**
- Trust management is a whole separate flow
- Property wizard shouldn't duplicate trust setup
- Link property to Trust record (if exists)
- Most users aren't trust settlors

**Exception:** Life tenant + remaindermen MUST be collected (affects inheritance)

#### 3. Remove "Sometimes Rented Out" for Residential

**Web Prototype:** Asks if residential property sometimes rented (weeks/year)

**Proposed:** Remove this field

**Rationale:**
- Doesn't affect IHT treatment significantly
- If significant rental = should be "Let Residential" usage
- Occasional Airbnb doesn't change tax treatment
- Reduces fields by 2

**Keep:** FHL and Buy-to-Let (different tax treatment)

#### 4. Simplify Company Ownership

**Web Prototype:** 9 fields (share class, registration country, articles, director status, etc.)

**Proposed:** 5 fields
- Company name *
- Ownership % in company
- Articles allow transfer? (yes/no/not-sure)
- Are you a director? (yes/no)
- Notes (optional)

**Remove:**
- Country of registration (assume UK, can add in notes if foreign)
- Share class (executor detail, not will-critical)

**Rationale:**
- Simpler for user
- Core questions still asked
- Non-critical details can go in notes

#### 5. Address Entry Method

**Web Prototype:** Google Places API address search

**Proposed:** Manual address entry (6 fields)

**Rationale:**
- No external API dependency
- No rate limits
- Works offline
- User has full control
- Can add address search as enhancement later

**Format:** Standard UK address fields

### Proposed Additions (Not in Web Prototype)

#### 1. "Unsure of Value" Checkbox

**Add to valuation screen** (consistent with other assets)

**Rationale:**
- User might not know property value
- Can estimate later
- Consistency with bank accounts, crypto, etc.

#### 2. Visual IHT Relief Indicators

**Add badges showing relief status:**
- FHL Qualifying: 🟢 "May qualify for BPR (50-100% relief)"
- FHL Non-Qualifying: 🔴 "Standard IHT treatment"
- Agricultural Active: 🟢 "May qualify for APR (50-100% relief)"
- Primary Residence: 🟢 "May qualify for RNRB (£175k extra allowance)"

**Rationale:**
- User understands why questions matter
- Visual feedback on tax implications
- Steve Jobs would approve

#### 3. Net Value Auto-Calculation

**Display:** Gross Value - Mortgage = Net Value

**Rationale:**
- Immediate feedback
- User sees what's actually in estate
- Matches other asset types

### Fields Kept (Critical - Can't Simplify)

**MUST Keep:**
- ✅ FHL 3 criteria (BPR qualification)
- ✅ Buy-to-Let rental income + tenancy type
- ✅ Agricultural actively farmed + who farms
- ✅ Joint ownership person + percentage
- ✅ Mortgage details
- ✅ Primary residence flag (RNRB)
- ✅ Company articles question
- ✅ Trust role and basic structure

**Why:** These directly affect IHT calculations and legal distribution

---

## Step 6: Critical Gotchas & Implementation Instructions

### ⚠️ CRITICAL GOTCHAS - Phase 14

#### Gotcha 1: Joint Tenants Can't Be Bequeathed

**Problem:** User enters property as Joint Tenants, then tries to add beneficiaries

**MUST:**
- Show clear warning: "Joint tenants property automatically passes to co-owner(s), NOT via your will"
- Disable beneficiary selection for joint tenants
- Explain legal principle clearly

**Code:**
```typescript
if (ownershipType === 'joint-tenants') {
  return (
    <View style={styles.warningCard}>
      <Text>⚠️ This property will automatically pass to the surviving joint tenant(s) and 
      will NOT be distributed according to your will.</Text>
    </View>
  );
}
```

#### Gotcha 2: Wizard State Persistence

**Problem:** User goes through 5 screens, app crashes, loses all data

**MUST:**
- Save partial property data to AsyncStorage after each screen
- Load partial data on mount
- Allow user to resume wizard where they left off

**Code:**
```typescript
// After each screen:
await AsyncStorage.setItem('kindling-property-draft', JSON.stringify(propertyData));

// On mount:
const draft = await AsyncStorage.getItem('kindling-property-draft');
if (draft) {
  // Ask user: "Resume property entry?" or "Start fresh?"
}
```

#### Gotcha 3: FHL Checkbox Confusion

**Problem:** User unchecks one FHL criterion, doesn't understand they lost BPR

**MUST:**
- Real-time warning when ANY checkbox unchecked
- Visual color change (green → red)
- Explain consequence: "May not qualify for Business Property Relief"

**Code:**
```typescript
const fhlQualifies = fhlAvailable210 && fhlActuallyLet105 && fhlLongLets155;

<View style={[styles.fhlStatus, fhlQualifies ? styles.fhlGood : styles.fhlBad]}>
  <Text style={fhlQualifies ? styles.goodText : styles.badText}>
    {fhlQualifies 
      ? '✓ Qualifies for FHL status (may get 50-100% IHT relief)'
      : '⚠️ Does not qualify for FHL status (standard IHT treatment)'
    }
  </Text>
</View>
```

#### Gotcha 4: Conditional Screen Path Confusion

**Problem:** User doesn't understand why they're seeing 8 screens for one property but friend only saw 4

**MUST:**
- Show progress indicator: "Step 3 of 6" (calculate based on their selections)
- Breadcrumb trail of completed screens
- Allow jumping back to any completed screen

**Code:**
```typescript
const calculateTotalScreens = (propertyData) => {
  let total = 3; // Address, Basic, Valuation always
  if (needsCompanyScreen) total++;
  if (needsTrustScreen) total++;
  if (needsJointScreen) total++;
  if (needsFHLScreen) total++;
  if (needsBuyToLetScreen) total++;
  if (needsAgriculturalScreen) total++;
  total++; // Summary
  return total;
};

<Text style={styles.progress}>
  Step {currentScreenIndex} of {calculateTotalScreens(propertyData)}
</Text>
```

#### Gotcha 5: Trust Role Determines Everything

**Problem:** User selects "Settlor" and gets 30 fields, panics, goes back and selects "Beneficiary" to avoid questions

**MUST:**
- Explain each role clearly BEFORE selection
- Show field count estimate: "Beneficiary (10 fields)" vs "Settlor (30 fields)"
- Offer "Not Sure" option → Collects minimal details, flags for later

**Code:**
```typescript
const trustRoleOptions = [
  { 
    value: 'beneficiary', 
    label: 'Beneficiary of Trust',
    description: 'You receive benefits from the trust (~10 questions)',
  },
  { 
    value: 'settlor', 
    label: 'Settlor (Created the Trust)',
    description: 'You set up the trust (~30 questions - detailed structure)',
  },
  { 
    value: 'not-sure', 
    label: 'Not Sure',
    description: 'Basic details only, review with solicitor later',
  },
];
```

#### Gotcha 6: Multiple Property Types Same Address

**Problem:** User owns 15 High Street as primary residence AND rents out upstairs as Airbnb

**MUST:**
- Support "Mixed Use" category
- Allow user to specify combination
- Or: Create 2 separate property entries (simpler)

**Recommendation:** Separate entries (cleaner data model)

#### Gotcha 7: Agricultural + Residential Combination

**Problem:** Farmhouse with land = Agricultural property type, but also primary residence

**MUST:**
- Show both agricultural AND residential fields
- Primary residence flag ALWAYS available (even for agricultural)
- Different reliefs stack (APR on land, RNRB on farmhouse)

**Code:**
```typescript
// Always show primary residence checkbox
// If usage === agricultural AND primaryResidence: Show APR + RNRB info
```

#### Gotcha 8: Percentage Inputs for Remaindermen

**Problem:** Settlor trust with 3 remaindermen needs percentage splits

**MUST:**
- Use BeneficiaryWithPercentages component
- Must total 100%
- Same component we built in Phase 9.5

**Reuse:** Our component works perfectly for this

#### Gotcha 9: Back Navigation Data Loss

**Problem:** User completes 6 screens, goes back to screen 2, changes ownership type, loses screens 4-5 data

**MUST:**
- Detect ownership type change
- Ask: "Changing ownership will clear company/trust details. Continue?"
- Only clear relevant conditional data, keep other data

**Code:**
```typescript
const handleOwnershipTypeChange = (newType) => {
  const oldType = propertyData.ownershipType;
  
  if (oldType !== newType && 
      (oldType === 'company' || oldType === 'trust' || newType === 'company' || newType === 'trust')) {
    Alert.alert(
      'Confirm Change',
      'Changing ownership type will clear related details. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          setPropertyData(prev => ({
            ...prev,
            ownershipType: newType,
            // Clear conditional data
            ...clearConditionalData(oldType)
          }));
        }}
      ]
    );
  }
};
```

#### Gotcha 10: Required vs Optional Screens

**Problem:** User doesn't know which screens they can skip

**MUST:**
- Mark screens as REQUIRED or OPTIONAL
- Required screens: Can't skip
- Optional screens: "Skip this section" button

**Funding screen = OPTIONAL**  
**All others = REQUIRED (but fields within may be optional)**

---

## Step 7: Success Criteria & Testing Checklist

### Must Pass Before Shipping

#### Data Integrity Tests

**Test 1: Joint Tenants Warning**
- Create property with joint tenants ownership
- Verify warning shows about automatic survivorship
- Verify can't add beneficiaries

**Test 2: FHL Qualification**
- Create FHL property
- Check all 3 criteria → See green "Qualifies" badge
- Uncheck one criterion → See red "Does not qualify" warning
- Verify annual income required

**Test 3: Trust Settlor Full Flow**
- Select trust ownership, settlor role
- Complete all 30+ fields
- Verify life tenant, remaindermen, beneficiaries save correctly
- Verify percentages total 100%

**Test 4: Wizard State Persistence**
- Start property entry
- Complete 3 screens
- Force quit app
- Reopen → Verify can resume

**Test 5: Conditional Screen Paths**
- Test all ownership types (5 paths)
- Test all usage types (6 paths)
- Verify correct screens shown for each combination

#### IHT Calculation Tests

**Test 6: Primary Residence RNRB**
- Mark property as primary residence
- Verify flagged for Residence Nil-Rate Band
- Check estate calculation excludes RNRB amount

**Test 7: FHL BPR Qualification**
- FHL qualifying → Verify 50-100% relief flagged
- FHL non-qualifying → Verify standard IHT

**Test 8: Agricultural APR**
- Actively farmed by self → 100% relief flagged
- Farmed by tenant → 50% relief flagged
- Not actively farmed → 0% relief

**Test 9: GROB Detection**
- Gift funded + Donor reserved benefit + No market rent → GROB flagged
- Gift funded + Paying market rent → Not GROB

#### User Experience Tests

**Test 10: Navigation Flow**
- Complete wizard start to finish (shortest path)
- Test back navigation to previous screens
- Test edit from summary screen
- Test cancel wizard (data cleared)

**Test 11: Multiple Properties**
- Add 3 properties with different ownership types
- Verify all save correctly
- Verify list displays all properties
- Verify totals calculate correctly

**Test 12: Edit Existing Property**
- Edit property → Wizard reopens with data
- Change ownership type → Conditional screens update
- Verify changes save correctly

#### Edge Case Tests

**Test 13: No People Created**
- User hasn't created family members
- Try to create joint tenants property
- Verify graceful handling (can add unknown or skip)

**Test 14: Unknown Joint Tenant**
- Select "Unknown Person" as joint tenant
- Verify saves and displays correctly

**Test 15: Mixed Use Property**
- Select mixed use
- Verify can specify combination
- Verify correct fields shown

---

## Step 8: Titan Review (Elon/Gates/Jobs Perspectives)

### Pre-Implementation Review Questions

**To Elon:**
1. "100+ fields across 8 screens - too much?"
2. "Can we cut more without breaking IHT calculations?"
3. "Wizard vs single long form?"

**To Gates:**
4. "Data model sound for 30-year maintenance?"
5. "State management approach for wizard?"
6. "Testing strategy comprehensive enough?"

**To Jobs:**
7. "User experience - is wizard flow intuitive?"
8. "Visual indicators (FHL status, GROB warnings) clear enough?"
9. "Progress indication helpful?"

**Deliverable:** Executive summary with go/no-go recommendation

---

## Implementation Checklist

### Phase 14 Tasks

**Task 14.1:** Update PropertyAsset Type (2 hours)
- Add all fields from web prototype analysis
- Use unified BeneficiaryAssignments
- Add trust, company, FHL, Buy-to-Let, Agricultural structures
- Clean up duplications
- Add TypeScript union types for enums

**Task 14.2:** Build Property Intro Screen (1 hour)
- Educational content
- Video about property in wills
- Morphic background

**Task 14.3:** Build Wizard Navigation System (3 hours)
- Screen routing logic
- State persistence
- Progress tracking
- Conditional screen paths

**Task 14.4:** Build Address Entry Screen (1 hour)
- 6 address fields
- Validation
- Auto-capitalize appropriately

**Task 14.5:** Build Basic Details Screen (2 hours)
- Ownership type selector
- Usage selector
- Conditional property type
- Primary residence / has lived there

**Task 14.6:** Build Company Details Screen (1.5 hours)
- 5 company fields
- Conditional on ownership type

**Task 14.7:** Build Trust Details Screen (4-6 hours)
- Trust role selector
- Role-specific fields (4 variants)
- BeneficiaryWithPercentages integration for remaindermen
- MOST COMPLEX SCREEN

**Task 14.8:** Build Joint Ownership Screen (1 hour)
- Joint tenant selector (person)
- Ownership percentage (if tenants in common)

**Task 14.9:** Build FHL Details Screen (1.5 hours)
- 3 qualifying checkboxes
- Annual income
- Real-time qualification status indicator

**Task 14.10:** Build Buy-to-Let Screen (1.5 hours)
- 4 buy-to-let fields
- Tenancy type conditional

**Task 14.11:** Build Agricultural Screen (1.5 hours)
- 4 agricultural fields
- APR qualification logic

**Task 14.12:** Build Valuation Screen (2 hours)
- Has mortgage toggle
- Conditional mortgage fields
- Estimated value
- Net value calculation
- "Unsure of value" checkbox

**Task 14.13:** Build Funding Screen (Optional) (2 hours)
- Multi-select funding type
- Conditional gift fields
- GROB logic and warnings

**Task 14.14:** Build Summary Screen (2 hours)
- Display all data in sections
- Edit buttons per section
- Confirmation flow
- Save to AsyncStorage

**Task 14.15:** Build Property List View (2 hours)
- Entry screen with list of properties
- Property cards with key details
- Edit/Delete
- Add Another Property
- Total property value
- Relief indicators

**Task 14.16:** Testing & Polish (4-6 hours)
- Run all 15 test scenarios
- Fix edge cases
- Visual polish
- Performance optimization

**Total Estimated:** 30-40 hours (5-7 days)

---

## Next Steps

1. **Review this plan**
2. **Get approval** on simplifications vs web prototype
3. **Decide:** Build Property now, or defer to final phase?
4. **If building:** Start with Task 14.1 (type updates)

---

## Questions for Review

1. **Funding screen:** Optional or required?
2. **Trust structure:** Full collection or simplified?
3. **Address entry:** Manual or API search?
4. **Mixed use:** Support or require separate entries?
5. **Simplifications:** Acceptable or need more fields?

---

**Status:** PLANNING COMPLETE - AWAITING APPROVAL

**Estimated Effort:** 30-40 hours (5-7 days)  
**Complexity:** VERY COMPLEX (most complex asset type)  
**Dependencies:** All previous phases complete ✓


