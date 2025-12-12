# Phase 14: Property Implementation - Detailed Plan

**Created:** December 2024  
**Status:** Planning  
**Source:** ACTUAL web prototype code (not assumptions)  
**Complexity:** VERY COMPLEX  
**Estimated:** 31 hours (4 days) MVP, 39 hours (5 days) complete

---

## Summary: What We're Building

**Web Prototype:** 4 screens, 3,084 lines total
- PropertyIntroScreen (143 lines)
- PropertyEntryScreen (2,285 lines) - ACCORDION PATTERN
- PropertyTrustDetailsScreen (395 lines) - SEPARATE SCREEN
- PropertySummaryScreen (261 lines)

**Native Implementation:** Same 4 screens, accordion pattern on mobile

**Fields:** 85 actually used (7 legacy funding fields excluded)

---

## Web Prototype Actual Implementation

### Screen 1: PropertyIntroScreen (143 lines)

**Simple intro screen:**
- Video (dismissible)
- Content: "Your Property Portfolio"
- "Up to £175k available if passes to descendants"
- "Learn more" external link
- "Start Adding Property" button
- "Skip for now" button

### Screen 2: PropertyEntryScreen (2,285 lines)

**ACCORDION PATTERN - Single Scrollable Screen**

**9 Accordion Sections:**
1. Address (always)
2. Usage & Type (always)
3. FHL Details (if property type = FHL)
4. Agricultural Details (if property type = agricultural)
5. Mixed-Use Details (if property type = mixed-use)
6. Buy-to-Let Details (if property type = buy-to-let)
7. Residential/Holiday Details (if property type = second/holiday home)
8. Property Details (always) - ownership, value, mortgage, acquisition
9. Company Ownership (if ownership type = company)

**Outside Accordions:**
- Joint Ownership section (if ownership = jointly owned)
- "Leaving To" Beneficiaries section (if NOT trust owned)
- Action buttons

**Flow:** Accordion → Accordion → ... → Complete

### Screen 3: PropertyTrustDetailsScreen (395 lines)

**Only shown if:** Ownership type = "Owned through Trust"

**Base fields (3):**
1. Trust Name
2. Trust Type (Life/Bare/Discretionary)
3. Your Role (Beneficiary/Settlor/Both - varies by type)

**Then renders 1 of 9 trust fieldsets:**
- 3 trust types × 3 roles = 9 combinations
- 1-14 fields per fieldset
- 28-556 lines per fieldset

### Screen 4: PropertySummaryScreen (261 lines)

**List view:**
- All properties
- Edit/delete functionality
- Total values

---

## Accordion-by-Accordion Field Analysis

### Accordion 1: Address (Always Shown)

**Fields (5 + optional search):**

1. **Address Search** (AddressSearchField - Google Places API)
   - Optional autocomplete
   - Web has this, native can defer

2. **Address Line 1** * (Input)
   - REQUIRED

3. **Address Line 2** (Input)
   - Optional

4. **Town/City** * (Input)
   - REQUIRED

5. **County/State** (Input)
   - Optional

6. **Country** * (Select)
   - Default: "United Kingdom"
   - Options: UK, US, Canada, Australia, Ireland, France, Germany, Spain, Italy, Netherlands
   - REQUIRED

**Validation:** address1, townCity, country REQUIRED

**Next:** Opens Usage & Type accordion

### Accordion 2: Usage & Type (Always Shown)

**Fields (2):**

1. **Usage** * (Select)
   - Residential
   - Let Residential
   - Commercial

2. **Property Type** * (Select - options conditional on usage)
   
   **If Residential:**
   - Primary Residence
   - Second Home
   - Holiday Home
   
   **If Let Residential:**
   - Buy To Let
   - Furnished Holiday Let
   - Short-term Let/Airbnb
   
   **If Commercial:**
   - Mixed-Use Property (shop with flat above)
   - Agricultural Property
   - Furnished Holiday Let (Commercial)

**Validation:** Both REQUIRED

**Next Logic:**
```
if FHL → Open FHL accordion
else if Agricultural → Open Agricultural accordion
else if Mixed-Use → Open Mixed-Use accordion
else if Buy-to-Let → Open Buy-to-Let accordion
else if Second/Holiday Home → Open Residential accordion
else → Open Property Details accordion
```

### Accordion 3: FHL Details (Conditional - if FHL)

**Fields (4):**

1. **Available 210+ days/year?** * (Checkbox)
   - Default: checked
   - HMRC FHL requirement

2. **Actually let 105+ days/year?** * (Checkbox)
   - Default: checked
   - HMRC FHL requirement

3. **Long lets under 155 days/year?** * (Checkbox)
   - Default: checked
   - Label: "31+ day lets do not surpass 155 days/year"
   - HMRC FHL requirement

4. **Estimated Annual Income** * (CurrencyInput)
   - REQUIRED

**Visual Warning (Real-time):**
- All 3 checked: Neutral info "Confirm FHL criteria"
- Any unchecked: Amber warning "Does not qualify as FHL. Treated as standard let."

**Why Critical:** BPR = 50-100% IHT relief on qualifying FHL

**Next:** Opens Property Details accordion

### Accordion 4: Agricultural Details (Conditional - if Agricultural)

**Fields (7):**

1. **Actively farmed?** (Switch)
   - Default: checked
   - If unchecked: Warning "Does not qualify for APR"

2. **Who farms it?** * (Select, conditional on #1)
   - Options: Owner, Tenant, Contract Farmer
   - Helper: "Owner = 100% APR, Tenant = 50% APR"
   - REQUIRED if actively farmed

3. **Pre-1995 tenancy?** (Checkbox, conditional on tenant)
   - Shown if whoFarms === 'Tenant'
   - Warning: "Pre-1995 = typically 50% not 100%"

4. **Includes buildings?** (Switch)
   - Helper: "APR covers farmhouses, barns if in agricultural use"

5. **Total acreage** * (Input decimal)
   - Suffix: "acres"
   - REQUIRED

6. **Farming type?** * (Select)
   - Options: Arable, Livestock, Mixed, Horticulture, Forestry, Other
   - REQUIRED

7. **Specify type** * (Input, conditional on Other)
   - REQUIRED if Other selected

**Why Critical:** APR = up to 100% IHT relief on agricultural property

**Next:** Opens Property Details accordion

### Accordion 5: Mixed-Use Details (Conditional - if Mixed-Use)

**Fields (3):**

1. **Commercial percentage?** * (PercentageInput 0-100)
   - REQUIRED
   - Auto-shows: "Residential portion: X%"
   - Helper: "Split determines tax - partial RNRB possible on residential"

2. **Separate entrances?** (Checkbox)
   - Helper: "Can be valued separately for tax"

3. **Residential ever main home?** (Checkbox)
   - Helper: "Important for PPR relief and CGT"

**Why Critical:** RNRB split calculation based on residential %

**Next:** Opens Property Details accordion

### Accordion 6: Buy-to-Let Details (Conditional - if Buy-to-Let)

**Fields (4):**

1. **Annual rental income?** * (CurrencyInput)
   - REQUIRED
   - Helper: "Total per year - needed for valuation"

2. **Tenancy type?** * (Select)
   - Options: AST (Assured Shorthold), Company Let, Unknown, Other
   - REQUIRED
   - Helper: "Affects vacant possession value"

3. **Specify tenancy** * (Input, conditional on Other)
   - REQUIRED if Other

4. **Expected tenanted at death** (Checkbox)
   - Helper: "Tenanted = 10-20% discount for probate"

**Why Critical:** Tenanted property valuation differs from vacant

**Next:** Opens Property Details accordion

### Accordion 7: Residential/Holiday Details (Conditional - if Second/Holiday Home)

**Fields (2):**

1. **Sometimes rented out?** (Checkbox)

2. **Weeks per year?** * (Input 0-52, conditional)
   - Shown if sometimes rented
   - Helper: "Determines if potentially qualifies as FHL"

**Can SKIP:** Not critical for IHT (edge case detection)

**Next:** Opens Property Details accordion

### Accordion 8: Property Details (Always Shown)

**Fields (7):**

1. **Ownership** * (Select)
   - Personally owned
   - Jointly owned
   - Owned Through Company
   - Owned through Trust

2. **Estimated Value** * (CurrencyInput)

3. **Acquisition Date** * (Month + Year selects)
   - Last 100 years

4. **Mortgage Provider** * (Select)
   - 27 UK providers + "Other"
   - Default: "No mortgage"

5. **Mortgage Amount** (CurrencyInput, conditional)
   - Shown if provider !== 'no_mortgage'

6. **Mortgage Responsibility** (Select, conditional)
   - If jointly owned: "Solely responsible" / "Jointly responsible"
   - If company owned: "Myself" / "The company" / "Company with guarantee" / "Other"
   - Shown if hasMortgage && (jointly OR company)

**Next Logic:**
- If trust → Complete, go to TrustDetailsScreen
- If company → Open Company Ownership accordion
- Else → Close accordions, show "Leaving To" section

### Accordion 9: Company Ownership (Conditional - if Company)

**Fields (6):**

1. **Company Name** * (CompanySelector)
   - Links to Private Company Shares
   - Auto-populates % and share class if exists

2. **Country of Registration** * (Select)
   - Default: "UK"

3. **% Share Holding** * (PercentageInput)
   - Default: 100%

4. **Share Class** (Input)
   - Optional

5. **Notes** (Textarea)
   - Optional

6. **Articles allow transfer?** (Checkbox)

**Info:** "Your shares—not the property—form part of estate"

**Next:** Closes accordion, shows "Leaving To" section

### Joint Ownership Section (Outside Accordions)

**Shown if:** `jointlyOwned === true`

**Joint Ownership Type:**
- Owned as Joint Tenants
- Owned as Tenants in Common
- Not sure

**If Joint Tenants:**
- Joint Tenant Selector
- List with edit/remove
- **Warning:** "Automatically goes to survivors. Only if last survivor can you leave in will."

**If Tenants in Common:**
- "Jointly owned with how many?" (NumericStepper 2-10)
- "Percentage ownership" (PercentageInput)

**If Not Sure:**
- Help video
- "Please help me find out" checkbox

### "Leaving To" Beneficiaries Section (Outside Accordions)

**Shown if:** NOT trustOwned

**Component:** PropertyBeneficiaryForm (uses beneficiaries with %)

**Heading:**
- Joint Tenants: "As last survivor:"
- Tenants in Common: "Who will receive your X%?"
- Other: "Leaving To:"

**Uses:** BeneficiaryWithPercentages pattern

---

## PropertyTrustDetailsScreen (Separate Screen)

**Only if:** ownership type = "Owned through Trust"

**Base Fields (3):**
1. Trust Name *
2. Trust Type * (Life Trust, Bare Trust, Discretionary Trust)
3. Your Role * (Beneficiary, Settlor, Settlor & Beneficiary)
   - Life Trust: Only Beneficiary OR Settlor (not both)
   - Others: All 3 options

**Then renders 1 of 9 trust fieldsets:**

### Trust Fieldset Matrix

**3 Trust Types × 3 Roles = 9 Fieldsets**

**Line counts (actual):**
1. Life Trust Beneficiary: 556 lines (14 fields) - MOST COMPLEX
2. Life Trust Settlor: 528 lines (10 fields)
3. Bare Trust Settlor+Beneficiary: 165 lines (4 fields)
4. Bare Trust Settlor: 138 lines (4 fields)
5. Discretionary Trust Settlor: 115 lines (3 fields)
6. Bare Trust Beneficiary: 58 lines (2 fields)
7. Discretionary Trust Beneficiary: 49 lines (1 field)
8. Discretionary Trust Settlor+Beneficiary: 30 lines (0 unique fields)
9. Life Trust Settlor+Beneficiary: 28 lines (0 unique fields)

**Total trust code:** 2,167 lines

### Common Trust Fieldsets (Build These)

**Life Trust Settlor (10 fields):**
1-2. Creation date (month/year)
3. Property value when transferred
4. Chained trust structure? (checkbox)
5. Reserved benefit? (none/income/occupy/both)
6-7. Paying market rent? Amount? (conditional)
8. Trustees (multi-select)
9. Life Interest Beneficiaries (with interest type + cessation criteria)
10. Remaindermen (with %)
11. Events ending life interest (textarea)

**Life Trust Beneficiary (14 fields):**
1-2. Creation date
3. Benefit type (income/capital/both/discretionary)
4. Settlor (who created)
5. Is settlor living?
6-7. Life interest began details (conditional)
8. Interest type
9-10. Share interest? % (conditional)
11. Remaindermen
12. Complex circumstances?
13-14. Capital interest details (conditional)
Plus trustees

**Bare Trust Settlor (4 fields):**
1-2. Creation date
3. Property value transferred
4. Beneficiaries

---

## Native Implementation Plan

### Phase 14a: Core Property (MVP - 31 hours)

**Screens:**
1. PropertyIntroScreen
2. PropertyEntryScreen (with accordions)
3. PropertySummaryScreen

**Includes:**
- ✅ All 9 accordions (Address, Usage, FHL, Agricultural, Mixed-Use, Buy-to-Let, Residential/Holiday, Property Details, Company)
- ✅ Joint ownership section (all 3 types)
- ✅ Beneficiaries section (reuse BeneficiaryWithPercentages)
- ✅ Trust ownership: Collect name only, defer details

**Excludes:**
- ⏸️ PropertyTrustDetailsScreen (full trust structure)
- ⏸️ Address search API (use manual entry)

### Phase 14b: Trust Details (Optional - 8 hours)

**Screen:** PropertyTrustDetailsScreen

**Includes:**
- ✅ 3 most common trust fieldsets:
  - Life Trust Settlor (10 fields)
  - Life Trust Beneficiary (14 fields)
  - Bare Trust Settlor (4 fields)

**Excludes:**
- ⏸️ 6 less common fieldsets (can add later if needed)

---

## Detailed Task Breakdown

### Task 14.1: PropertyIntroScreen (1 hour)

**File:** `app/bequeathal/property/intro.tsx`

**Content:**
- Header with Home icon
- Video (optional - can skip)
- InformationCard: "Your Property Portfolio"
- Content about RNRB (£175k relief)
- "Start Adding Property" button
- "Skip for now" button → sequential navigation
- Morphic background

### Task 14.2: Update PropertyAsset Type (1 hour)

**File:** `src/types/index.ts`

**Add fields from web (exclude 7 legacy):**
```typescript
export interface PropertyAsset extends BaseAsset {
  type: 'property';
  address: AddressData;
  
  // Usage & Type
  usage: 'residential' | 'let_residential' | 'commercial';
  propertyType: string; // Conditional options based on usage
  
  // Ownership
  ownershipType: 'personally_owned' | 'jointly_owned' | 'company_owned' | 'trust_owned';
  ownershipPercentage?: number;
  
  // Residential
  primaryResidence?: boolean;
  hasLivedThere?: boolean;
  
  // Mortgage
  hasMortgage?: boolean;
  mortgage?: {
    outstandingAmount: number;
    provider: string;
    jointlyHeldWith?: string;
  };
  
  // Acquisition
  acquisitionMonth?: string;
  acquisitionYear?: string;
  
  // FHL specific
  fhlAvailableOver210Days?: boolean;
  fhlActuallyLet105Days?: boolean;
  fhlLongLetsUnder155Days?: boolean;
  fhlEstimatedAnnualIncome?: number;
  
  // Agricultural specific
  agriculturalActivelyFarmed?: boolean;
  agriculturalWhoFarms?: 'owner' | 'tenant' | 'contract_farmer';
  agriculturalPre1995Tenancy?: boolean;
  agriculturalBuildingsIncluded?: boolean;
  agriculturalTotalAcreage?: number;
  agriculturalFarmingType?: string;
  agriculturalFarmingTypeOther?: string;
  
  // Mixed-Use specific
  mixedUseCommercialPercentage?: number;
  mixedUseSeparateEntrances?: boolean;
  mixedUseResidentialWasMainHome?: boolean;
  
  // Buy-to-Let specific
  buyToLetAnnualRentalIncome?: number;
  buyToLetTenancyType?: string;
  buyToLetTenancyTypeOther?: string;
  buyToLetTenantedAtDeath?: boolean;
  
  // Residential/Holiday (can skip)
  residentialSometimesRentedOut?: boolean;
  residentialWeeksRentedPerYear?: number;
  
  // Company ownership
  companyName?: string;
  companyOwnershipPercentage?: number;
  companyCountryOfRegistration?: string;
  companyShareClass?: string;
  companyNotes?: string;
  companyArticlesConfident?: boolean;
  isCompanyDirector?: boolean;
  
  // Trust basic (MVP - just name)
  trustName?: string;
  trustType?: 'life_trust' | 'bare_trust' | 'discretionary_trust';
  trustRole?: 'beneficiary' | 'settlor' | 'settlor_and_beneficiary';
  
  // Joint ownership
  jointOwnershipType?: 'joint_tenants' | 'tenants_in_common' | 'not_sure';
  jointTenants?: Array<{id: string, name: string}>;
  
  // Beneficiaries
  beneficiaryAssignments?: BeneficiaryAssignments;
}
```

**Note:** Trust detailed fields defer to Phase 14b or Trust Management module

### Task 14.3: Build Accordion Component (2 hours)

**New Component:** `src/components/ui/Accordion.tsx`

**Pattern:** Collapsible sections
- Only one open at a time (controlled)
- Smooth expand/collapse animation
- Checkmark when section valid
- Lock icon if not yet accessible

**Or:** Use `react-native-collapsible` library

### Task 14.4-14.12: Build Each Accordion (18 hours)

**14.4:** Address accordion (2 hours)
**14.5:** Usage & Type accordion (2 hours)
**14.6:** FHL accordion with real-time warning (2 hours)
**14.7:** Agricultural accordion with APR logic (3 hours)
**14.8:** Mixed-Use accordion (1 hour)
**14.9:** Buy-to-Let accordion (2 hours)
**14.10:** Residential/Holiday accordion (1 hour) - **CAN SKIP**
**14.11:** Property Details accordion (3 hours)
**14.12:** Company Ownership accordion (2 hours)

### Task 14.13: Joint Ownership Section (2 hours)

Outside accordions, conditional rendering

### Task 14.14: Beneficiaries Section (1 hour)

Reuse BeneficiaryWithPercentages

### Task 14.15: PropertySummaryScreen (2 hours)

List view with edit/delete

### Task 14.16: Testing (4 hours)

10+ test scenarios

**Total Phase 14a:** 31 hours (4 days)

---

## What We're NOT Building (And Why)

### ❌ Funding/GROB Fields (7 fields)

**Why:** Legacy code - in state but NEVER RENDERED in UI
- fundingType, giftSize, giftMonth, giftYear
- benefitReservedByDonor, payingMarketRent, monthlyRentPaid

**Confirmed:** Lines 59-65, 242-248, 356-362 initialize these fields, but ZERO rendering code exists

### ❌ Residential "Sometimes Rented" (2 fields)

**Why:** Edge case, not critical for IHT
- If significant rental = should be "Let Residential" usage
- Occasional Airbnb doesn't change tax treatment

**Can add later if needed**

### ⏸️ Full Trust Details (6 fieldsets)

**Why:** Complex, 80% of users don't have trust-owned property
- Build 3 most common in Phase 14b
- Or defer ALL to "Trust Management" module

---

## Critical Implementation Notes

### Gotcha 1: No Accordion Component in RN Paper

**Options:**
1. Build custom with Animated API
2. Use `react-native-collapsible` library
3. Use List.Accordion from react-native-paper

**Recommended:** react-native-paper List.Accordion (already have Paper)

### Gotcha 2: Google Places API

**Web has it, native doesn't need it for MVP**
- Manual entry works fine
- No API key needed
- No rate limits
- Works offline

**Future enhancement:** Add address autocomplete

### Gotcha 3: CompanySelector Dependency

**Requires Phase 11 (Private Company Shares) complete**
- If not: Allow manual company name entry
- If yes: Can select existing company

### Gotcha 4: Joint Tenants Legal Warning

**MUST be prominent:**
- Big card, can't miss
- Clear language about automatic survivorship
- This is LAW, not UI preference

### Gotcha 5: FHL/APR Warnings Are Tax Advice

**Must be accurate:**
- 210/105/155 days = HMRC rules
- 100% vs 50% APR = tax law
- Get language right, cite sources

---

## Recommendations

**MVP (Phase 14a):**
- 4 days work
- Covers 95% of properties
- Trust name collected (details deferred)
- All IHT-critical fields included

**Then decide:**
- Ship MVP, add trust details later if users need it
- Or build Phase 14b (+ 1 day) before shipping

**Personally recommend:** Ship MVP, see if users actually have complex trust-owned properties before building 2,167 lines of trust fieldsets

---

## Next Steps

1. Review this plan for accuracy
2. Approve MVP approach (14a only)
3. Confirm no more "junk planning"
4. Begin implementation

**Status:** READY FOR APPROVAL

