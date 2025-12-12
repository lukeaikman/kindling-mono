# Phase 14: Property Implementation - ACTUAL Web Prototype Analysis

**Created:** December 2024  
**Status:** Planning (Based on ACTUAL implemented code, not assumptions)  
**Complexity:** VERY COMPLEX  
**Dependencies:** Phases 1-13 complete

---

## ACTUAL Web Prototype Implementation

### Screens (4 Total)

1. **PropertyIntroScreen.tsx** (143 lines)
   - Simple intro with video + content + buttons
   
2. **PropertyEntryScreen.tsx** (2,285 lines) 
   - **SINGLE SCREEN with ACCORDIONS** (not multi-screen wizard)
   - 9 accordion sections (some conditional)
   - "Leaving To" beneficiary section outside accordions
   
3. **PropertyTrustDetailsScreen.tsx** (395 lines)
   - Separate screen ONLY if trust owned
   - 9 trust fieldset variants (3 trust types × 3 roles)
   
4. **PropertySummaryScreen.tsx** (261 lines)
   - List view of all properties
   - Edit/delete functionality

**Total:** ~3,084 lines (extremely complex)

---

## Step 0: Review Current Native PropertyAsset Type

### What We Already Have

**File:** `native-app/src/types/index.ts` (Lines 439-453)

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
  beneficiaryAssignments?: BeneficiaryAssignments;
}
```

**Current: 10 fields** (simplified baseline)

---

## Step 1: Web Prototype PropertyData Structure (ACTUAL STATE FIELDS)

### PropertyData Interface (Lines 26-171)

**Total State Fields:** 92 fields

**Fields by Category:**

#### Base Fields (8)
- ownershipType
- usage  
- propertyType
- acquisitionMonth
- acquisitionYear
- jointlyOwned (derived from ownershipType)
- companyOwned (derived from ownershipType)
- trustOwned (derived from ownershipType)

#### Company Ownership (7)
- companyName
- companyOwnershipPercentage
- companyCountryOfRegistration
- companyShareClass
- companyNotes
- companyArticlesConfident
- isCompanyDirector

#### Trust Basic (10)
- trustRole
- trustName
- trustType
- trustCreationMonth
- trustCreationYear
- trustEntitlementType
- trustRightOfOccupation
- trustBenefitDescription
- trustIsIPDI
- trustIsSettlor

#### Residential/Mortgage (8)
- primaryResidence
- hasLivedThere
- hasMortgage
- estimatedValue
- outstandingMortgage
- mortgageProvider
- mortgageJointlyHeldWith

#### FHL Specific (4)
- fhlAvailableOver210Days
- fhlActuallyLet105Days
- fhlLongLetsUnder155Days
- fhlEstimatedAnnualIncome

#### Agricultural Specific (7)
- agriculturalActivelyFarmed
- agriculturalWhoFarms
- agriculturalPre1995Tenancy
- agriculturalBuildingsIncluded
- agriculturalTotalAcreage
- agriculturalFarmingType
- agriculturalFarmingTypeOther

#### Mixed-Use Specific (3)
- mixedUseCommercialPercentage
- mixedUseSeparateEntrances
- mixedUseResidentialWasMainHome

#### Buy-to-Let Specific (4)
- buyToLetAnnualRentalIncome
- buyToLetTenancyType
- buyToLetTenancyTypeOther
- buyToLetTenantedAtDeath

#### Residential/Holiday (2)
- residentialSometimesRentedOut
- residentialWeeksRentedPerYear

#### LEGACY FIELDS (NOT RENDERED - 7)
- fundingType
- giftSize
- giftMonth
- giftYear
- benefitReservedByDonor
- payingMarketRent
- monthlyRentPaid

#### Settlor Trust Fields (20+)
- settlorReservedBenefit
- settlorBenefitDescription
- settlorValueWhenTransferred
- settlorIsIPDI
- settlorLifeTenant
- settlorRemaindermen
- settlorBeneficiaries
- settlorBeneficiaryClasses
- settlorSettlorSpouseCanReceive
- settlorCoBeneficiaries
- settlorTrustees
- Plus 13 more settlor+beneficiary combination fields

#### Beneficiary Trust Fields (9)
- beneficiaryTrustees
- beneficiaryCoBeneficiaries
- Plus 7 more settlor+beneficiary combination fields

**Actual Used Fields:** ~85 (after removing 7 legacy funding fields)

---

## Step 2: ACTUAL PropertyEntryScreen Accordion Structure

### Screen Layout

**Single Scrollable Screen with Accordion Sections**

**Always-Visible Sections:**
1. ✅ Address (Accordion)
2. ✅ Usage & Type (Accordion)
3. ✅ Property Details (Accordion) - ownership, value, mortgage, acquisition

**Conditional Accordion Sections (based on propertyType/usage):**
4. FHL Details (if `propertyType === 'furnished_holiday_let'`)
5. Agricultural Details (if `propertyType === 'agricultural_property'`)
6. Mixed-Use Details (if `propertyType === 'mixed_use_property'`)
7. Buy-to-Let Details (if `propertyType === 'buy_to_let'`)
8. Residential/Holiday Details (if `propertyType === 'second_home' || 'holiday_home'`)
9. Company Ownership (if `companyOwned === true`)

**Outside Accordions:**
- Joint Ownership section (if `jointlyOwned === true`)
- "Leaving To" Beneficiaries section
- Action buttons

### Accordion 1: Address (Lines 1079-1191)

**Fields (6 - via AddressSearchField + manual inputs):**

1. **Address Search** (AddressSearchField component)
   - Google Places API autocomplete
   - Optional - can manually enter instead

2. **Address 1** * (Input)
   - House number and street name
   - REQUIRED
   
3. **Address 2** (Input)
   - Apartment, suite, unit (optional)

4. **Town/City** * (Input)
   - REQUIRED

5. **County/State** (Input)
   - Optional

6. **Country** * (Select)
   - Default: "United Kingdom"
   - Options: UK, US, Canada, Australia, Ireland, France, Germany, Spain, Italy, Netherlands
   - REQUIRED

**Validation:**
- address1, townCity, country REQUIRED
- Can't proceed without these

**Next Button:** Goes to next section when validation passes

### Accordion 2: Usage & Type (Lines 1194-1250)

**Fields (2):**

1. **Usage** * (SelectField)
   - Options:
     - Residential
     - Let Residential
     - Commercial
   - REQUIRED
   - Triggers propertyType options

2. **Property Type** * (SelectField, conditional on usage)
   - **If usage === 'residential':**
     - Primary Residence
     - Second Home
     - Holiday Home
   
   - **If usage === 'let_residential':**
     - Buy To Let
     - Furnished Holiday Let
     - Short-term Let/Airbnb
   
   - **If usage === 'commercial':**
     - Mixed-Use Property (e.g., shop with flat above)
     - Agricultural Property
     - Furnished Holiday Let (Commercial)
   
   - REQUIRED

**Next Button Logic:**
- If FHL: Opens FHL accordion
- If Agricultural: Opens Agricultural accordion
- If Mixed-Use: Opens Mixed-Use accordion
- If Buy-to-Let: Opens Buy-to-Let accordion
- If Second Home/Holiday: Opens Residential/Holiday accordion
- Otherwise: Opens Property Details accordion

### Accordion 2b: FHL Details (Lines 1253-1337, CONDITIONAL)

**Shown if:** `propertyType === 'furnished_holiday_let'` OR `'furnished_holiday_let_commercial'`

**Fields (4):**

1. **Available to let 210+ days/year?** * (Checkbox)
   - Default: checked
   - Part of HMRC FHL qualification
   
2. **Actually let 105+ days/year?** * (Checkbox)
   - Default: checked
   - Part of HMRC FHL qualification

3. **Long lets under 155 days/year?** * (Checkbox)
   - Default: checked
   - Part of HMRC FHL qualification
   - Label: "31+ day lets totalled do not surpass 155 days per year"

4. **Estimated Annual Income** * (CurrencyInput)
   - REQUIRED
   - Rental income from FHL

**Visual Warning:**
- If ANY checkbox unchecked: Amber warning "Property does not qualify as a Furnished Holiday Let. It will be treated as a standard let property."
- If all checked: Info box "Please confirm the following criteria for this Furnished Holiday Let property."

**Validation:**
- All 4 fields REQUIRED to proceed

**Next Button:** Goes to Property Details accordion

### Accordion 2c: Agricultural Details (Lines 1340-1561, CONDITIONAL)

**Shown if:** `propertyType === 'agricultural_property'`

**Fields (7):**

1. **Is this property actively farmed?** (Switch)
   - Default: checked
   - If unchecked: Triggers warning about no APR

2. **Who farms this property?** * (Select, conditional)
   - Shown if actively farmed === true
   - Options: Owner, Tenant, Contract Farmer
   - REQUIRED if shown
   - Helper: "Owner-occupied typically receives 100% APR relief vs 50% for tenanted"

3. **Pre-September 1995 tenancy?** (Checkbox, conditional)
   - Shown if whoFarms === 'tenant'
   - Helper: "Pre-1995 tenancies receive 50% relief, post-1995 receive 100%"
   - Warning if checked: "Pre-1995 tenancies typically qualify for 50% APR relief rather than 100%"

4. **Includes agricultural buildings?** (Switch)
   - Barns, farmhouses in agricultural use
   - Helper: "APR can cover farmhouses, barns and buildings if they're in agricultural use"

5. **Total acreage** * (Input number)
   - REQUIRED
   - Decimal allowed (0.01 step)
   - Suffix: "acres"

6. **Type of farming operation?** * (Select)
   - Options: Arable, Livestock, Mixed (Arable & Livestock), Horticulture, Forestry, Other
   - REQUIRED

7. **Specify farming type** * (Input, conditional)
   - Shown if farmingType === 'other'
   - REQUIRED if shown

**Visual Warning:**
- If not actively farmed: Amber warning "Property does not qualify for Agricultural Property Relief. It will be treated as standard commercial property."
- If actively farmed: Info "Agricultural Property Relief (APR) can provide up to 100% IHT relief for qualifying agricultural property. Please provide accurate details."

**Validation:**
- Acreage and farming type always REQUIRED
- Who farms REQUIRED if actively farmed
- Other specification REQUIRED if "other" selected

**Next Button:** Goes to Property Details accordion

### Accordion 2d: Mixed-Use Details (Lines 1565-1666, CONDITIONAL)

**Shown if:** `propertyType === 'mixed_use_property'`

**Fields (3):**

1. **Commercial use percentage?** * (PercentageInput)
   - 0-100
   - REQUIRED
   - Auto-calculates residential: "Residential portion: X%"
   - Helper: "Remaining percentage will be treated as residential. This split determines tax treatment - partial RNRB may be possible on the residential portion if personally owned"

2. **Separate entrances?** (Checkbox)
   - For residential and commercial areas
   - Helper: "Properties with separate access can often be valued separately for tax purposes"

3. **Residential portion ever your main home?** (Checkbox)
   - Helper: "Important for Principal Private Residence (PPR) relief and Capital Gains Tax (CGT) implications"

**Validation:**
- Commercial percentage REQUIRED (0-100)

**Next Button:** Goes to Property Details accordion

### Accordion 2e: Buy-to-Let Details (Lines 1670-1786, CONDITIONAL)

**Shown if:** `propertyType === 'buy_to_let'`

**Fields (4):**

1. **Estimated annual rental income?** * (CurrencyInput)
   - REQUIRED
   - Helper: "Total rental income received per year - needed for accurate estate valuation"

2. **Current tenancy type?** * (Select)
   - Options: AST (Assured Shorthold Tenancy), Company Let, Unknown, Other
   - REQUIRED
   - Helper: "The type of tenancy affects vacant possession value calculations"

3. **Specify tenancy type** * (Input, conditional)
   - Shown if tenancyType === 'other'
   - REQUIRED if shown

4. **Property expected to be tenanted at death** (Checkbox)
   - Helper: "Tenanted properties typically receive a 10-20% valuation discount for probate/IHT purposes compared to vacant possession"

**Info:** "Buy-to-let properties require specific information for accurate estate valuation. Tenanted properties are worth less than vacant possession for probate/IHT purposes."

**Validation:**
- Rental income REQUIRED
- Tenancy type REQUIRED
- Other specification REQUIRED if "other" selected

**Next Button:** Goes to Property Details accordion

### Accordion 2f: Residential/Holiday Details (Lines 1789-1856, CONDITIONAL)

**Shown if:** `propertyType === 'second_home'` OR `'holiday_home'`

**Fields (2):**

1. **Sometimes Rented Out?** (Checkbox)
   - If checked: Shows weeks field

2. **Estimated weeks per year?** * (Input number, conditional)
   - Shown if sometimes rented === true
   - REQUIRED if shown
   - Min: 0, Max: 52
   - Helper: "This information enables Kindling to determine if your property potentially qualifies as a furnished holiday let which has tax advantages."

**Validation:**
- If sometimes rented checked: weeks REQUIRED

**Next Button:** Goes to Property Details accordion

### Accordion 3: Property Details (Lines 1858-1979)

**Fields (7):**

1. **Ownership** * (SelectField)
   - Options:
     - Personally owned
     - Jointly owned
     - Owned Through Company
     - Owned through Trust
   - REQUIRED
   - Sets jointlyOwned, companyOwned, trustOwned flags

2. **Estimated Value** * (CurrencyInput)
   - REQUIRED

3. **Acquisition Date** * (2 Selects)
   - Month (dropdown)
   - Year (dropdown - last 100 years)
   - REQUIRED

4. **Mortgage Provider** * (SelectField)
   - 27 UK mortgage providers + "Other"
   - Default: "No mortgage"
   - REQUIRED

5. **Mortgage Amount** (CurrencyInput, conditional)
   - Shown if provider !== 'no_mortgage'
   - Sets hasMortgage flag
   - Optional (can leave blank)

6. **Mortgage Responsibility** (SelectField, conditional)
   - **If jointly owned:** "I'm solely responsible" / "I'm jointly responsible"
   - **If company owned:** "Myself" / "The company" / "The Company With Personal Guarantee" / "Other"
   - Shown if hasMortgage && (jointlyOwned OR companyOwned)

**Next Button Logic:**
- If trustOwned: Completes and goes to TrustDetails screen (separate)
- If companyOwned: Opens Company Ownership accordion
- Otherwise: Closes accordions, reveals "Leaving To" section

### Accordion 4: Company Ownership (Lines 1982-2064, CONDITIONAL)

**Shown if:** `companyOwned === true`

**Fields (Uses CompanySelector + CompanyShareDetailsFields components):**

1. **Company Name** * (CompanySelector)
   - Can select existing company from Private Company Shares
   - Or enter new company name
   - Auto-populates ownership % and share class if existing
   - REQUIRED

2. **Company Registered in** * (Select)
   - Options: UK, US, IE, FR, DE, ES, IT, NL, Other
   - Default: "UK"
   - REQUIRED

3. **Estimated % Share Holding** * (PercentageInput)
   - Default: 100%
   - REQUIRED

4. **Share Class** (Input via CompanyShareDetailsFields)
   - Optional

5. **Notes** (Textarea via CompanyShareDetailsFields)
   - Optional

6. **Confident articles allow transfer?** (Checkbox)
   - CompanyShareDetailsFields component
   - Label: "I'm confident the articles of association allow transfer of property ownership"

**Info:** "As this property is company-owned, it's your shares in the company—not the property itself—that form part of your estate and can be inherited."

**Validation:**
- Company name REQUIRED
- Country REQUIRED
- Ownership % REQUIRED

**Next Button:** Closes accordion, reveals "Leaving To" section

---

## ACTUAL RENDERED ACCORDION SUMMARY

**Funding Fields:** ❌ **NOT RENDERED** - In state but no UI (lines 59-65, 242-248, 356-362 show state initialization but ZERO rendering code)

**Accordions Actually Used:** 9 total
- 3 always shown (Address, Usage/Type, Property Details)
- 5 conditional usage screens (FHL, Agricultural, Mixed-Use, Buy-to-Let, Residential)
- 1 conditional ownership screen (Company)

---

## Step 2: Outside-Accordion Sections

### Joint Ownership Section (Lines 2068-2189, NOT in accordion)

**Shown if:** `jointlyOwned === true`

**Fields (varies by joint ownership type):**

**Joint Ownership Type Selection:**
- Owned as Joint Tenants
- Owned as Tenants in Common
- Not sure

**If Joint Tenants:**
- Joint Tenant Selector (PersonSelectField or manual add)
- List of added joint tenants with edit/remove

**If Tenants in Common:**
- "Jointly owned with how many?" (NumericStepper, 2-10)
- "Percentage ownership" (PercentageInput with complicated mode toggle)

**If Not Sure:**
- Help video placeholder
- "Please help me find out" checkbox (pre-checked)

### "Leaving To" Beneficiary Section (Lines 2190-2217, NOT in accordion)

**Shown if:** NOT trustOwned

**Component:** PropertyBeneficiaryForm

**Heading varies by ownership:**
- Joint Tenants: "As last survivor:"
- Tenants in Common: "Who will receive your X%?"
- Other: "Leaving To:"

**Warning for Joint Tenants:**
"Property held as joint tenants automatically goes to surviving owners. Only if you're the last survivor can you leave this property to someone in your will."

**Fields:**
- Uses PropertyBeneficiaryForm component
- Beneficiary selection with percentages

### Action Buttons (Lines 2220-2248)

**If trustOwned:**
- Single "Next" button → Goes to PropertyTrustDetailsScreen

**If NOT trustOwned:**
- "Complete" button → Saves property
- "Add Another Property" button → Resets form

---

## Step 3: PropertyTrustDetailsScreen (SEPARATE SCREEN)

### Screen Structure (395 lines)

**Only shown if:** `trustOwned === true` from PropertyEntryScreen

**Fields (3 base + conditional fieldsets):**

1. **Trust Name** * (Input)
2. **Trust Type** * (Select)
   - Options: Life Trust, Bare Trust, Discretionary Trust
3. **Your Role** * (Select, conditional on trust type)
   - Options: Beneficiary, Settlor, Settlor & Beneficiary
   - For Life Trust: Only Beneficiary or Settlor (not both)
   - For Bare/Discretionary: All 3 options

**Then renders ONE of 9 trust fieldsets based on type + role combination:**

### Trust Fieldsets (9 Variants)

#### 1. Life Trust + Settlor (LifeTrustSettlorFieldset.tsx - 528 lines)

**Fields (10):**
1. Trust creation date (month/year)
2. Property value when transferred
3. Chained trust structure? (checkbox)
4. Reserved benefit? (select: none, income only, right to occupy, both)
5. Paying market rent? (radio, conditional on reserved benefit)
6. Monthly market rent (currency, conditional on paying rent)
7. Trustees (multi-select)
8. Life Interest Beneficiaries (PersonSelector with interest type + cessation criteria)
9. Remaindermen (PersonSelector with percentages)
10. Events that would end life interest (textarea)

#### 2. Life Trust + Beneficiary (LifeTrustBeneficiaryFieldset.tsx - 557 lines)

**Fields (14):**
1. Trust creation date (month/year)
2. Benefit type (income/capital/both/discretionary)
3. Settlor (PersonSelector - who created trust)
4. Is settlor living? (radio)
5. Life interest began on passing? (radio, conditional)
6. When began (text, conditional)
7. Interest type (income/occupation/both)
8. Share life interest? (radio)
9. Life interest percentage (conditional)
10. Remaindermen (PersonSelector)
11. Complex circumstances? (checkbox)
12. Capital interest percentage (conditional)
13. Life tenant details (conditional)
14. Trustees (multi-select)

#### 3-9. Other Trust Fieldset Variants

**Each trust type (Life, Bare, Discretionary) × role (Settlor, Beneficiary, Settlor+Beneficiary) = 9 fieldsets**

Each fieldset: 8-14 fields

**Total Trust Fields Range:** 8-14 fields per property (depending on combination)

---

## Step 4: What We Need to Build for Native App

### Approach: ACCORDION PATTERN (not wizard)

**Match web prototype structure:**
- Single entry screen with accordions
- Separate trust screen if needed
- Summary list screen

### Screens (4):

1. **PropertyIntroScreen** (simple)
2. **PropertyEntryScreen** (complex - accordions)
3. **PropertyTrustDetailsScreen** (conditional - if trust owned)
4. **PropertySummaryScreen** (list view)

### Fields to Include

**Must Have (Core):**
- Address (6 fields)
- Usage & Type (2 fields)
- Property Details (7 fields: ownership, value, acquisition, mortgage)
- Beneficiaries (if not trust/company owned)

**Conditional Usage Sections:**
- FHL (4 fields) - Business Property Relief critical
- Agricultural (7 fields) - Agricultural Property Relief critical
- Mixed-Use (3 fields) - RNRB split calculation
- Buy-to-Let (4 fields) - Valuation discount
- Residential/Holiday (2 fields) - Can SKIP (not critical for IHT)

**Conditional Ownership Sections:**
- Joint Ownership (varies) - Legal requirement
- Company Ownership (6 fields) - Critical
- Trust Ownership → Separate screen with 8-14 fields

**Total Fields Range:** 15-40 depending on property type

---

## Step 5: Proposed Native Implementation

### Simplified Approach (MVP)

**Phase 14a: Core Property (15-20 hours)**
- PropertyIntroScreen (1 hour)
- PropertyEntryScreen with accordions:
  - Address accordion (2 hours)
  - Usage & Type accordion (2 hours)
  - Property Details accordion (3 hours)
  - Joint ownership section (2 hours)
  - Beneficiaries section (1 hour, reuse BeneficiaryWithPercentages)
  - FHL accordion (2 hours)
  - Buy-to-Let accordion (2 hours)
  - Agricultural accordion (3 hours)
  - Company ownership accordion (2 hours)
- PropertySummaryScreen list view (2 hours)

**Phase 14b: Trust Details (8-12 hours)**
- PropertyTrustDetailsScreen (2 hours shell)
- 9 trust fieldsets (simplified versions, 1 hour each = 9 hours)
  - Or: Build 3 most common (Life Settlor, Life Beneficiary, Bare Settlor) = 3 hours
  - Defer others

**Total:** 23-32 hours (3-4 days)

### Fields We Can SKIP

- ❌ Mixed-Use residential/holiday details (2 fields) - edge case
- ❌ Residential sometimes rented (2 fields) - not critical
- ❌ ALL funding fields (7 fields) - legacy, not rendered
- ❌ Acquisition date (2 fields) - defer to Executor Facilitation
- ❌ 6 trust fieldsets (build only 3 most common)

**Savings:** ~20 fields, ~8 hours

---

## Step 6: Critical Implementation Notes

### Gotchas from ACTUAL Code

**1. Accordion Navigation Logic**
- Usage selection determines which conditional accordion opens next
- Must implement decision tree (lines 1222-1241)

**2. Joint Tenants Warning**
- MUST show warning about automatic survivorship
- Legal requirement, not optional

**3. FHL Real-Time Status**
- Warning changes color based on checkboxes
- Amber border if any unchecked

**4. Company Ownership Links to Private Company Shares**
- CompanySelector can pull from existing companies
- Auto-populates ownership % and share class

**5. Trust Screen is SEPARATE**
- Don't try to fit in accordion
- Separate route/screen

**6. Beneficiary Section Outside Accordions**
- After all accordions complete
- Uses PropertyBeneficiaryForm component

**7. No Funding Fields**
- Don't build these - they're dead code in web prototype

---

## Step 7: Recommended Build Order

1. ✅ PropertyIntroScreen (1 hour)
2. ✅ Address accordion (2 hours)
3. ✅ Usage & Type accordion (2 hours)  
4. ✅ Property Details accordion (3 hours)
5. ✅ FHL accordion (2 hours) - Most common rental type
6. ✅ Buy-to-Let accordion (2 hours) - Second most common
7. ✅ Agricultural accordion (3 hours) - APR critical
8. ✅ Joint ownership section (2 hours)
9. ✅ Company ownership accordion (2 hours)
10. ✅ Beneficiaries section (1 hour)
11. ✅ PropertySummaryScreen (2 hours)
12. ⏸️ Trust screen (8-12 hours) - Can defer or build simplified

**MVP:** Steps 1-11 = 22 hours (~3 days)  
**Complete:** Steps 1-12 = 30-34 hours (~4-5 days)

---

## Next: Read Trust Fieldsets in Detail

[To be continued with detailed trust fieldset analysis]


