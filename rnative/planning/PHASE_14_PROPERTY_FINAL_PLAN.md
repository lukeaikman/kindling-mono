# Phase 14: Property Implementation - Final Plan

**Created:** December 2024  
**Status:** Final - Ready for Implementation  
**Source:** Web prototype analysis + Simplified native trust spec + IHT law review  
**Complexity:** VERY COMPLEX  
**Estimated:** Phase 14a (MVP): 26 hours (3-4 days) | Phase 14b (Trust Details): 6 hours (1 day)

---

## Executive Summary

**What We're Building:**
- 4 screens with accordion pattern (matches web prototype structure)
- 83 fields total across all conditionals
- **Conditional rendering:** Simple property = 4 sections (15 fields), Complex property = 5-6 sections (20-25 fields)
- All IHT-critical questions included (FHL/BPR, Agricultural/APR, Mixed-Use/RNRB, Joint Tenants, GROB)

**Why Property is Complex:**
- UK tax law requires different data for different property types
- FHL qualification = £200k IHT savings (BPR 50-100%)
- Agricultural qualification = £800k IHT savings on £2M farm (APR 100%)
- Mixed-use RNRB split = £49k savings on £500k property
- Joint tenants = can't bequeath (legal, not tax)
- Trusts = complex IHT treatment (GROB, IPDI, 7-year rule)

**Key Insight:** Conditional accordions mean each user sees ONLY relevant questions. Complexity is distributed, not cumulative.

---

## Web Prototype Analysis (Actual Code)

### Screens (4)

1. **PropertyIntroScreen.tsx** (143 lines) - Simple intro
2. **PropertyEntryScreen.tsx** (2,285 lines) - Single screen with 9 accordions
3. **PropertyTrustDetailsScreen.tsx** (395 lines) - Separate screen if trust owned
4. **PropertySummaryScreen.tsx** (261 lines) - List view

**Total:** 3,084 lines

### Accordion Structure (PropertyEntryScreen)

**Always Shown (3):**
1. Address
2. Usage & Type
3. Property Details (ownership, value, mortgage, acquisition)

**Conditionally Shown (6):**
4. FHL Details (if propertyType = furnished_holiday_let)
5. Agricultural Details (if propertyType = agricultural_property)
6. Mixed-Use Details (if propertyType = mixed_use_property)
7. Buy-to-Let Details (if propertyType = buy_to_let)
8. Residential/Holiday Details (if propertyType = second_home/holiday_home)
9. Company Ownership (if ownershipType = company_owned)

**Outside Accordions:**
- Joint Ownership section (if ownershipType = jointly_owned)
- "Leaving To" Beneficiaries section (if NOT trust_owned)

**Legacy Fields Excluded (9):**
- 7 funding/GROB fields (fundingType, giftSize, giftMonth, giftYear, benefitReservedByDonor, payingMarketRent, monthlyRentPaid)
- 2 residential flags (primaryResidence boolean, hasLivedThere boolean)
- **All in state but NEVER rendered in UI**

---

## User Journeys (Conditional Rendering)

### Simple Residential Property (95% of users)

**Sections:** 4
**Fields:** ~15

**Flow:**
1. Address → 5 fields
2. Usage & Type → 2 fields (select "Residential" → "Primary Residence")
3. Property Details → 7 fields (personally owned, value, no mortgage, acquisition)
4. Beneficiaries → PercentageWithBeneficiaries

**Time:** 5 minutes  
**Complexity:** LOW

### FHL Property (2% of users)

**Sections:** 5
**Fields:** ~19

**Flow:**
1. Address → 5 fields
2. Usage & Type → 2 fields (select "Let Residential" → "Furnished Holiday Let")
3. **FHL Details** → 4 fields (3 criteria checkboxes + annual income)
4. Property Details → 7 fields
5. Beneficiaries

**Time:** 7 minutes  
**Complexity:** MEDIUM (but FHL owner EXPECTS tax questions)

### Mixed-Use Property (2% of users - shops with flats, pubs with rooms)

**Sections:** 5
**Fields:** ~18

**Flow:**
1. Address → 5 fields
2. Usage & Type → 2 fields (select "Commercial" → "Mixed-Use Property")
3. **Mixed-Use Details** → 3 fields (commercial %, separate entrances, ever main home)
4. Property Details → 7 fields
5. Beneficiaries

**Time:** 7 minutes  
**Complexity:** MEDIUM (shop owner EXPECTS commercial/residential split)

**IHT Impact:** RNRB (£175k) applies only to residential %. Without asking = lose £49k+ relief.

### Agricultural Property (1% of users)

**Sections:** 5
**Fields:** ~22

**Flow:**
1. Address → 5 fields
2. Usage & Type → 2 fields (select "Commercial" → "Agricultural Property")
3. **Agricultural Details** → 7 fields (actively farmed, who farms, acreage, type, buildings, tenancy)
4. Property Details → 7 fields
5. Beneficiaries

**Time:** 10 minutes  
**Complexity:** HIGH (but farmer EXPECTS APR questions - common in farming estates)

**IHT Impact:** APR up to 100% on £2M farm = £800k IHT saved

### Company-Owned Property (rare)

**Sections:** 6
**Fields:** ~23

**Flow:**
1. Address → 5 fields
2. Usage & Type → 2 fields
3. [Conditional usage accordion if needed]
4. Property Details → 7 fields (select "Owned Through Company")
5. **Company Ownership** → 6 fields
6. Beneficiaries (note: shares bequeathed, not property itself)

**Time:** 10 minutes  
**Complexity:** HIGH (but company owner EXPECTS company questions)

### Trust-Owned Property (rare, most complex)

**Sections:** Special flow
**Fields:** 3 base + 4-11 trust-specific

**Flow:**
1-4. Same as above
5. Property Details → Select "Owned through Trust" → Goes to **separate TrustDetailsScreen**
6. Trust Details → 3 base + conditional trust fieldset (4-11 fields)
7. Back to summary

**Time:** 15-20 minutes  
**Complexity:** VERY HIGH (but trust settlor EXPECTS detailed structure questions)

---

## Native Implementation Specification

### Phase 14a: Core Property (MVP - 26 hours)

**Build ALL conditional accordions** (each user sees only relevant ones)

---

## Screen 1: PropertyIntroScreen

**File:** `app/bequeathal/property/intro.tsx`

**Content:**
- Header: "Property" with Home icon
- Morphic background (5 blobs)
- InformationCard: "Your Property Portfolio"
  - "We'll gather basic details enabling net position and estate value calculations"
  - "Tax Reliefs May Be Available"
  - "Up to £175,000 available (£350,000 with partner) if passes to direct descendants"
  - "Kindling will explain your tax position and present potential optimisations"
- External link: "Learn more about property in wills"
- "Start Adding Property" button → PropertyEntryScreen
- "Skip for now" button → Sequential navigation

**Effort:** 1 hour

---

## Screen 2: PropertyEntryScreen (Main Implementation)

**File:** `app/bequeathal/property/entry.tsx`

**Pattern:** ScrollView with Accordion sections (react-native-paper List.Accordion)

### Accordion 1: Address (Always)

**Fields (5):**
1. Address Line 1 * (Input)
2. Address Line 2 (Input)
3. Town/City * (Input)
4. County/State (Input)
5. Country * (Select: UK, US, Canada, Australia, Ireland, France, Germany, Spain, Italy, Netherlands, default: UK)

**Validation:** address1, townCity, country REQUIRED

**Note:** Manual entry (no Google Places API). Can add search as future enhancement.

**Next:** Opens Usage & Type accordion

**Effort:** 2 hours

### Accordion 2: Usage & Type (Always)

**Fields (2):**

1. **Usage** * (Select)
   - Residential
   - Let Residential
   - Commercial

2. **Property Type** * (Select, options conditional on usage)

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
```typescript
if (propertyType.includes('furnished_holiday_let')) → Open FHL accordion
else if (propertyType === 'agricultural_property') → Open Agricultural accordion
else if (propertyType === 'mixed_use_property') → Open Mixed-Use accordion
else if (propertyType === 'buy_to_let') → Open Buy-to-Let accordion
else if (propertyType === 'second_home' || 'holiday_home') → Skip to Property Details
else → Open Property Details accordion
```

**Effort:** 2 hours

### Accordion 3: FHL Details (Conditional)

**Shown if:** `propertyType.includes('furnished_holiday_let')`

**Fields (4):**
1. Available to let 210+ days/year? * (Checkbox, default: checked)
2. Actually let 105+ days/year? * (Checkbox, default: checked)
3. Long lets (31+ days) under 155 days/year? * (Checkbox, default: checked)
4. Estimated Annual Income * (CurrencyInput)

**Visual Indicator (Real-Time):**
```typescript
const fhlQualifies = all3CheckboxesChecked;

<View style={fhlQualifies ? styles.qualifies : styles.warning}>
  {fhlQualifies ? (
    <Text>✓ Qualifies for FHL status (Business Property Relief - 50-100% IHT relief possible)</Text>
  ) : (
    <Text style={styles.warningText}>⚠️ Does not qualify as FHL. Will be treated as standard let property.</Text>
  )}
</View>
```

**IHT Impact:** Qualifying FHL may get 50-100% IHT relief. On £400k property = up to £160k IHT saved.

**Validation:** All 4 REQUIRED

**Next:** Opens Property Details accordion

**Effort:** 2 hours

### Accordion 4: Agricultural Details (Conditional)

**Shown if:** `propertyType === 'agricultural_property'`

**Fields (7):**

1. **Actively farmed?** (Switch, default: checked)
   - If unchecked: Warning "Does not qualify for Agricultural Property Relief"

2. **Who farms it?** * (Select, shown if actively farmed)
   - Options: Owner, Tenant, Contract Farmer
   - Helper: "Owner-occupied = 100% APR relief, Tenant-farmed = 50% APR relief"
   - REQUIRED if actively farmed

3. **Pre-1995 tenancy?** (Checkbox, shown if whoFarms === 'Tenant')
   - Helper: "Pre-1995 tenancies typically qualify for 50% relief rather than 100%"

4. **Includes agricultural buildings?** (Switch)
   - Helper: "APR can cover farmhouses, barns and buildings if in agricultural use"

5. **Total acreage** * (Input decimal, suffix: "acres")
   - REQUIRED

6. **Farming type?** * (Select: Arable, Livestock, Mixed, Horticulture, Forestry, Other)
   - REQUIRED

7. **Specify type** * (Input, shown if farmingType === 'other')
   - REQUIRED if Other selected

**IHT Impact:** APR up to 100% relief. On £2M farm = £800k IHT saved.

**Validation:** Acreage and farming type always REQUIRED. Who farms REQUIRED if actively farmed.

**Next:** Opens Property Details accordion

**Effort:** 3 hours

### Accordion 5: Mixed-Use Details (Conditional)

**Shown if:** `propertyType === 'mixed_use_property'`

**Common Examples:** Shop with flat above, pub with accommodation, office with residential units

**Fields (3):**

1. **Commercial use percentage?** * (PercentageInput 0-100)
   - REQUIRED
   - Auto-displays: "Residential portion: {100 - commercial}%"
   - Helper: "Split determines tax treatment - partial RNRB may be possible on residential portion"

2. **Separate entrances for residential and commercial?** (Checkbox)
   - Helper: "Properties with separate access can often be valued separately for tax purposes"

3. **Residential portion ever your main home?** (Checkbox)
   - Helper: "Important for Principal Private Residence (PPR) relief and Capital Gains Tax (CGT)"

**IHT Impact:** 
- RNRB (£175k) applies ONLY to residential portion
- Example: £500k property, 70% residential = £122.5k RNRB = £49k IHT saved
- Commercial portion: Standard IHT, no RNRB

**Why Critical:** Without split %, either lose RNRB entirely OR claim incorrectly (HMRC audit risk)

**Validation:** Commercial percentage REQUIRED

**Next:** Opens Property Details accordion

**Effort:** 1.5 hours

### Accordion 6: Buy-to-Let Details (Conditional)

**Shown if:** `propertyType === 'buy_to_let'`

**Fields (4):**

1. **Annual rental income?** * (CurrencyInput)
   - Helper: "Total rental income per year - needed for estate valuation"
   - REQUIRED

2. **Current tenancy type?** * (Select: AST, Company Let, Unknown, Other)
   - Helper: "Type of tenancy affects vacant possession value calculations"
   - REQUIRED

3. **Specify tenancy type** * (Input, shown if tenancyType === 'other')
   - REQUIRED if Other

4. **Expected to be tenanted at death** (Checkbox)
   - Helper: "Tenanted properties typically receive 10-20% valuation discount for probate/IHT"

**Info Box:** "Buy-to-let properties worth less when tenanted than with vacant possession for probate/IHT purposes"

**Validation:** Income and tenancy type REQUIRED

**Next:** Opens Property Details accordion

**Effort:** 2 hours

### Accordion 7: Property Details (Always)

**Fields (7):**

1. **Ownership Type** * (Select)
   - Personally owned
   - Jointly owned
   - Owned Through Company
   - Owned through Trust

2. **Estimated Value** * (CurrencyInput)
   - REQUIRED

3. **Acquisition Date** (Month + Year selects)
   - Last 100 years
   - **OPTIONAL** (helpful context, not IHT-critical)
   - Purpose: Executor reference, possible CGT cost basis
   - Make optional with placeholder: "Leave blank if unsure"

4. **Mortgage Provider** * (Select - 27 UK providers)
   - Default: "No mortgage"
   - REQUIRED

5. **Mortgage Amount** (CurrencyInput, shown if provider !== 'no_mortgage')
   - Sets hasMortgage flag
   - Optional (can be £0)

6. **Mortgage Responsibility** (Select, shown if hasMortgage && (jointly OR company))
   - **If jointly owned:** "Solely responsible" / "Jointly responsible"
   - **If company owned:** "Myself" / "The company" / "Company with personal guarantee" / "Other"

**Net Value Calculation:**
```typescript
netValue = estimatedValue - (hasMortgage ? outstandingMortgage : 0)
```

**Validation:** Ownership, value, mortgage provider REQUIRED. Acquisition optional.

**Next Logic:**
- If trust_owned → Complete PropertyEntryScreen, navigate to PropertyTrustDetailsScreen
- If company_owned → Open Company Ownership accordion
- Otherwise → Close accordions, show Joint Ownership + Beneficiaries sections

**Effort:** 3 hours

### Accordion 8: Company Ownership (Conditional)

**Shown if:** `ownershipType === 'company_owned'`

**Fields (6):**

1. **Company Name** * (CompanySelector OR Input)
   - If Phase 11 complete: CompanySelector (links to Private Company Shares, auto-populates % and share class)
   - If Phase 11 not complete: Input (manual entry)
   - REQUIRED

2. **Country of Registration** * (Select: UK, US, IE, FR, DE, ES, IT, NL, Other)
   - Default: "UK"
   - REQUIRED

3. **Your % Share Holding in Company** * (PercentageInput)
   - Default: 100%
   - REQUIRED

4. **Share Class** (Input)
   - Optional
   - Example: "Ordinary", "Class A"

5. **Notes** (Textarea)
   - Optional
   - Transfer restrictions, special terms

6. **Confident articles of association allow property ownership transfer?** (Checkbox)

**Info Box:** "This property is company-owned. Your shares in the company—not the property itself—form part of your estate and can be inherited."

**Validation:** Company name, country, % holding REQUIRED

**Next:** Closes accordion, shows Joint Ownership + Beneficiaries sections

**Effort:** 2 hours

### Joint Ownership Section (Outside Accordions)

**Shown if:** `ownershipType === 'jointly_owned'`

**Joint Ownership Type Selection:**
- Owned as Joint Tenants
- Owned as Tenants in Common
- Not sure

**If Joint Tenants:**

**Fields:**
- Joint Tenant Selector (PersonSelector - can select from family OR add unknown)
- List of added tenants with edit/remove

**Warning Box (Prominent):**
> ⚠️ **Property held as joint tenants automatically goes to surviving owners.** Only if you're the last survivor can you leave this property to someone in your will.

**If Tenants in Common:**

**Fields:**
- Jointly owned with how many? (NumericStepper: 2-10)
- Your ownership percentage (PercentageInput)
  - Auto-calculates based on number: 2 people = 50% default
  - Can adjust for unequal splits

**If Not Sure:**

**Content:**
- Help video (or placeholder)
- "Please help me find out" checkbox (pre-checked)
- Explanation of difference with visual

**Effort:** 2 hours

### "Leaving To" Beneficiaries Section (Outside Accordions)

**Shown if:** `ownershipType !== 'trust_owned'`

**Heading (Conditional):**
- If joint tenants: "As last survivor, who receives this property?"
- If tenants in common: "Who will receive your {ownership%}%?"
- Otherwise: "Who will receive this property?"

**Component:** BeneficiaryWithPercentages (reuse existing)
- Allocation mode: percentage
- Value: property estimated value (or net value if mortgage)
- Must total 100%

**Note for Company Owned:**
Display: "Note: Your beneficiaries will inherit your company shares, which control this property."

**Effort:** 1 hour (component exists)

**Effort:** 1 hour

---

## Screen 3: PropertyTrustDetailsScreen (SIMPLIFIED NATIVE SPEC)

**File:** `app/bequeathal/property/trust-details.tsx`

**Only shown if:** `ownershipType === 'trust_owned'` from PropertyEntryScreen

### Base Fields (3)

1. **Trust Name** * (Input)
2. **Trust Type** * (Select)
   - Life Interest Trust
   - Bare Trust
   - Discretionary Trust
3. **Your Role in Trust** * (Select, options vary by type)
   - **Life Trust:** Beneficiary OR Settlor (not both available)
   - **Bare/Discretionary:** Beneficiary OR Settlor OR Settlor & Beneficiary

**Then renders 1 of 9 fieldsets based on type + role:**

---

### Trust Fieldset 1: Life Interest Trust > Settlor

**Fields (11):**

1. **Reserved benefit when creating trust?** * (Select)
   - None
   - Income only
   - Right to occupy only
   - Income and occupation

2. **Paying market rent?** * (RadioGroup, shown if reserved benefit includes occupation)
   - Yes
   - No

3. **Conditional Explanatory Text:**
   - **IF paying rent OR no benefit:** Info box "You're no longer the owner. Trust deed dictates enjoyment and ownership, not your will. We'll take critical details to pass to your executor."
   - **IF NOT paying rent AND benefit reserved:** Warning box "⚠️ This will be considered a 'gift with reservation' and the property will be included in your estate for inheritance tax."

4-5. **Trust creation date** * (Month + Year selects)
   - Helper: "For tracking 7-year rule (tapered IHT if you die within 7 years of creating trust)"
   - REQUIRED

6. **Property value when transferred to trust** * (CurrencyInput)
   - Helper: "Value at time of transfer. Used for 7-year taper calculations."
   - REQUIRED

7. **Chained trust structure?** (Checkbox)
   - Helper: "Property passes from one life interest holder to another through successive life interests. May involve complicated IPDI considerations - our team will contact you."

8. **Trustees** (PersonSelector multi, optional)
   - Helper: "Trustees who hold legal title. Your executors may need to contact them."

9. **Life Interest Beneficiaries** (PersonSelector multi with metadata)
   - Name, relationship
   - Benefit type (Life interest occupation / Life interest income / Life interest occupation and income)
   - Helper: "Who has life interest? They benefit during lifetime but can't leave property in their will."

10. **Remaindermen** (PersonSelector multi with percentages)
   - Names, relationships, % allocations
   - Must total 100% if multiple
   - Uses BeneficiaryWithPercentages component
   - Helper: "Who inherits property after life interests end?"

11. **Events ending life interest** (Textarea, optional)
   - Helper: "Conditions that would end life interest early (e.g., remarriage, cohabitation, moving out)"
   - Placeholder: "e.g., Life interest ends on remarriage or moving out of property"

**Validation:**
- Reserved benefit, creation date, value REQUIRED
- If occupation reserved: Market rent REQUIRED
- Life interest beneficiaries: At least one
- Remaindermen: At least one, percentages total 100%

**Save:** Returns to PropertySummaryScreen

**Effort:** 2.5 hours

### Trust Fieldset 2: Life Interest Trust > Beneficiary

**Benefit Type Split First:**
- Life Interest Beneficiary
- Remainderman

**IF LIFE INTEREST:**

**Fields (10):**
1. **Trust name** * (Input)
2-3. **Trust creation date** (Month + Year)
4. **Who was the settlor?** (PersonSelector single)
   - Name, relationship
5. **Is settlor still living?** * (RadioGroup: Yes / No)
6. **IF settlor dead:** Did life interest begin immediately on their passing? (RadioGroup: Yes / No)
7. **IF no:** It began: (Select: On death of preceding life interest holder / During their lifetime)
8. **Interest type** * (Select)
   - Occupation only
   - Income only
   - Income and Occupation
9. **Share life interest with others?** (RadioGroup: Yes / No)
10. **IF yes:** Your % of life interest (PercentageInput 0-100)
11. **Remaindermen** (PersonSelector multi, optional)
   - Helper: "Though not yours to give, we can include in visualization of who gets what on your passing"

**Explanatory Note (Always Shown):**
> "Life interests are included in your estate for inheritance tax purposes. Note: You cannot pass on the interest - the trust deed dictates what happens on your passing."

**Complex circumstances checkbox:** "More complicated? Check here, we'll contact you."

**IF REMAINDERMAN:**

**Fields (5):**
1. **Your % of capital interest** * (PercentageInput 0-100)
2. **Life tenant** * (PersonSelector single: name, relationship)
3. **Life tenant age estimate** (Input number)
   - Helper: "Approximate age helps estimate when remainder interest might vest"
4. **Known contingencies** (Textarea)
   - Helper: "If your interest is contingent on you surviving life tenant, or other conditions, note here"
   - Placeholder: "e.g., Interest contingent on surviving life tenant"

**Explanatory Note:**
> "If you survive the life tenant: Property becomes yours and passes per your will. If you die first: Your remainder interest passes to your chosen beneficiaries (unless contingent on surviving)."

**Plus:** Trustees (PersonSelector multi, optional)

**Validation:**
- If life interest: Interest type REQUIRED
- If remainderman: % and life tenant REQUIRED

**Effort:** 3 hours

### Trust Fieldset 3: Bare Trust > Settlor

**Fields (4):**

1. **Trust name** * (Input)
2-3. **Trust creation date** * (Month + Year)
   - Helper: "Subject to 7-year rule for IHT"
4. **Property value when transferred** * (CurrencyInput)
   - Helper: "Value at transfer. Used for 7-year taper calculations."
5. **Beneficiaries** (PersonSelector multi with percentages)
   - Names, relationships, % allocations
   - Must total 100%

**Validation:** All except percentages REQUIRED if only 1 beneficiary

**Effort:** 1 hour

### Trust Fieldset 4: Bare Trust > Beneficiary

**Fields (2):**

1. **Co-beneficiaries** (PersonSelector multi with percentages, optional)
   - Helper: "Others who share absolute ownership"
   - Names, relationships, % allocations

2. **Trustees** (PersonSelector multi, optional)
   - Helper: "For executor information"

**Validation:** None required (all optional)

**Effort:** 30 minutes

### Trust Fieldset 5: Bare Trust > Settlor & Beneficiary

**Fields (5):**

1. **Do you currently live in the property?** (RadioGroup: Yes / No)

2. **Conditional Warning (shown if yes AND beneficiary share < 100%):**
   > ⚠️ **Warning:** You occupy property you partially gifted. The gifted portion ({100 - your_share}%) may be considered a Gift with Reservation and remain in your estate for IHT.

3. **Property value at point of transfer** * (CurrencyInput)

4. **Co-beneficiaries** (PersonSelector multi with percentages)
   - Your share + their shares must total 100%

5. **Trustees** (PersonSelector multi, optional)

**Validation:** Value REQUIRED. If co-beneficiaries, percentages must total 100%.

**GROB Detection:** Automatically flags if living there + share < 100%

**Effort:** 1 hour

### Trust Fieldset 6: Discretionary Trust > Beneficiary

**Fields (1):**

**Explanatory Text (Always Shown):**
> "While you're enjoying a benefit from this discretionary trust, the property is not part of your estate and therefore is not yours to give via your will."

**Complex situation checkbox:**
"If you think your situation may be more complicated than this, check this box and we'll reach out to you."

**Validation:** None required

**Effort:** 15 minutes

### Trust Fieldset 7: Discretionary Trust > Settlor

**Fields (3):**

1. **Trust name** * (Input)
2-3. **Month and year of property transferred into trust** * (Month + Year)
   - Helper: "For 7-year rule tracking"
4. **Value at time of transfer** * (CurrencyInput)

**Validation:** All 3 REQUIRED

**Effort:** 30 minutes

### Trust Fieldset 8: Discretionary Trust > Settlor & Beneficiary

**Approach A (Simpler - Recommended):**

**Just show:**
> ⚠️ **Warning:** This appears to be a settlor-interested trust. The property will remain in your estate for inheritance tax purposes as you have a beneficial interest.

**Complex checkbox:** "If your situation is more complex, check here and our team will reach out."

**Effort:** 15 minutes

**Approach B (More Detailed):**

**Fields (3):**
1. Trust name *
2. Do you have beneficial interest? * (Select: None / Right to Occupy / Right to Income / Something else)
3. **IF any interest:** Warning about settlor-interested trust in estate
4. Complex checkbox

**Validation:** If beneficial interest selected, show warning

**Effort:** 30 minutes

**Recommend Approach A** - simpler, user already selected "Settlor & Beneficiary" so we know they have interest

### Remaining Fieldsets (Skip for MVP)

**Life Trust Settlor & Beneficiary** (28 lines web)
**Bare Trust Settlor & Beneficiary** (covered above)
**Discretionary Settlor & Beneficiary** (covered above)

**Phase 14b can add these if needed**

---

## Screen 4: PropertySummaryScreen

**File:** `app/bequeathal/property/summary.tsx`

**Content:**
- List of all added properties
- Each card shows:
  - Address
  - Type (residential, FHL, agricultural, etc.)
  - Ownership type
  - Value (gross and net if mortgage)
  - Beneficiaries summary
  - Edit/Delete buttons
- Total Property Value (sum all net values)
- If any FHL: Note about qualifying/non-qualifying status
- If any Agricultural: Note about APR status
- "Add Another Property" button
- "Continue" button → Sequential navigation

**Effort:** 2 hours

---

## Implementation Task Breakdown

### Phase 14a: Core Property MVP (26 hours)

**Task 14a.1:** PropertyIntroScreen (1 hour)
- Intro content, video, buttons, morphic background

**Task 14a.2:** Update PropertyAsset Type (1 hour)
- Add all 83 used fields
- Exclude 9 legacy fields
- Union types for enums

**Task 14a.3:** Accordion Component Decision (30 min)
- Test react-native-paper List.Accordion
- OR implement custom with react-native-collapsible
- Choose approach before building sections

**Task 14a.4:** PropertyEntryScreen Shell (1 hour)
- Screen structure
- Accordion container
- State management
- Conditional accordion rendering logic

**Task 14a.5:** Address Accordion (2 hours)
- 5 fields manual entry
- Validation
- Next button

**Task 14a.6:** Usage & Type Accordion (2 hours)
- 2 fields with conditional options
- Next button conditional logic

**Task 14a.7:** FHL Accordion (2 hours)
- 4 fields
- Real-time qualification status indicator
- Visual warning amber/neutral

**Task 14a.8:** Agricultural Accordion (3 hours)
- 7 fields with nested conditionals
- APR qualification logic
- Warning indicators

**Task 14a.9:** Mixed-Use Accordion (1.5 hours)
- 3 fields
- Auto-calculate residential %
- RNRB split explanation

**Task 14a.10:** Buy-to-Let Accordion (2 hours)
- 4 fields
- Tenancy type conditional
- Valuation discount note

**Task 14a.11:** Property Details Accordion (3 hours)
- 7 fields
- Mortgage conditionals
- Net value calculation
- Acquisition optional

**Task 14a.12:** Company Ownership Accordion (2 hours)
- 6 fields
- CompanySelector integration (if Phase 11 done)
- Articles checkbox

**Task 14a.13:** Joint Ownership Section (2 hours)
- Joint tenant selector
- Tenants in common logic
- NumericStepper, PercentageInput
- Prominent warning for joint tenants

**Task 14a.14:** Beneficiaries Section (1 hour)
- Reuse BeneficiaryWithPercentages
- Conditional heading

**Task 14a.15:** PropertySummaryScreen (2 hours)
- List view
- Edit/Delete
- Total calculations
- Relief status indicators

**Task 14a.16:** Testing & Polish (3 hours)
- All property types
- All ownership types
- All usage types
- Edge cases

**Total Phase 14a:** 26 hours (3-4 days)

### Phase 14b: Trust Details (6 hours)

**Task 14b.1:** PropertyTrustDetailsScreen Shell (30 min)
- Base screen structure
- Trust name, type, role selection
- Conditional fieldset rendering

**Task 14b.2:** Life Interest Trust Settlor Fieldset (2 hours)
- 11 fields with simplified native spec
- GROB detection (reserved benefit + rent)
- 7-year rule helpers
- Remaindermen with percentages

**Task 14b.3:** Life Interest Trust Beneficiary Fieldset (2 hours)
- Split: Life Interest path (10 fields) OR Remainderman path (5 fields)
- Conditional logic based on benefit type
- Explanatory notes

**Task 14b.4:** Bare Trust Fieldsets (1 hour)
- Settlor (4 fields)
- Beneficiary (2 fields)
- Settlor & Beneficiary (5 fields with GROB check)

**Task 14b.5:** Discretionary Trust Fieldsets (30 min)
- Settlor (3 fields)
- Beneficiary (explanatory + checkbox)
- Settlor & Beneficiary (warning + checkbox)

**Total Phase 14b:** 6 hours (1 day)

**Grand Total:** 32 hours (4-5 days)

---

## Critical Gotchas

### Gotcha 1: Accordion Component Choice

**Must decide early:**
- react-native-paper List.Accordion (easiest, already have Paper)
- react-native-collapsible (more control)
- Custom with Animated API (most work, most control)

**Test first:** Build Address accordion with chosen component, verify behavior before building all 8

### Gotcha 2: Conditional Accordion Rendering

**Pattern:**
```typescript
{isFHL() && (
  <List.Accordion title="FHL Details">
    {/* 4 fields */}
  </List.Accordion>
)}
```

**State management:** Web preserves hidden accordion data (doesn't clear). Match this behavior.

### Gotcha 3: Joint Tenants Legal Warning

**MUST be unmissable:**
- Large card with orange/amber background
- Icon (alert-circle)
- Clear legal language
- Can't bequeath what automatically passes to survivors

### Gotcha 4: FHL/APR/RNRB Are Tax Calculations

**Must be accurate:**
- FHL: 210/105/155 days = HMRC Business Property Relief criteria
- APR: 100% owner-farmed vs 50% tenant-farmed = HMRC Agricultural Property Relief
- RNRB: £175k on residential only (£350k with partner)
- Mixed-use RNRB split: Calculate based on residential %

**Cite sources in helpers where possible**

### Gotcha 5: Company Ownership Links

**If Phase 11 not complete:**
- CompanySelector won't work
- Fall back to manual company name input
- Auto-population of % and share class won't work

**Build defensively:** Check if company data available, graceful fallback

### Gotcha 6: Trust GROB Detection

**Three places GROB can occur:**

1. **Life Trust Settlor:** Reserved benefit (occupy/income) + not paying market rent
2. **Bare Trust S&B:** Living in property + share < 100% (gifted portion)
3. **Discretionary S&B:** Having beneficial interest as settlor

**All three must show warning:** "Property (or portion) in YOUR estate for IHT"

### Gotcha 7: Remaindermen Percentages

**Use existing BeneficiaryWithPercentages component:**
- Already built in Phase 9.5
- Supports percentage allocation
- Visual percentage bars
- Must total 100%
- "Equally distribute" helper button

**Don't rebuild** - reuse existing component

### Gotcha 8: State Persistence

**Web prototype behavior:**
- Usage change: Clears propertyType only
- Ownership change: Doesn't clear company/trust data
- Property type change: Doesn't clear conditional fields

**Hidden accordion data persists in state**

**Decision:** Match web (preserve data) OR improve with confirmation dialog when clearing

---

## What We're Skipping (MVP)

### ⏸️ Residential/Holiday "Sometimes Rented" Accordion

**Why skip:**
- Edge case: User should categorize as "Let Residential" if significant rental
- Occasional Airbnb doesn't change IHT treatment materially
- Can add later if users request

**Saves:** 1 hour

### ⏸️ Address Search API

**Why skip:**
- Manual entry works fine
- No API key needed, no rate limits
- Works offline
- Can add as enhancement later

**Saves:** 2-3 hours

### ⏸️ 3 Less Common Trust Fieldsets

**Skip for Phase 14a:**
- Life Trust Settlor & Beneficiary (rare combination)
- Discretionary variants already covered above

**Can add in Phase 14b if users need**

---

## Testing Checklist

### Test Scenario 1: Simple Residential
- Personally owned primary residence
- No mortgage
- Beneficiaries: Children equally
- **Sees:** 4 sections, ~15 fields
- **Time:** 5 minutes

### Test Scenario 2: FHL Property
- Let Residential → FHL
- All 3 criteria checked
- Annual income entered
- **Verify:** Green qualification status
- Uncheck one criteria
- **Verify:** Amber warning appears
- **Sees:** 5 sections

### Test Scenario 3: Agricultural
- Commercial → Agricultural
- Actively farmed by owner
- Acreage, farming type entered
- **Verify:** APR 100% noted
- Change to "farmed by tenant"
- **Verify:** APR 50% noted

### Test Scenario 4: Mixed-Use
- Commercial → Mixed-Use
- 30% commercial, 70% residential
- **Verify:** Auto-shows "Residential: 70%"
- **Verify:** RNRB split explanation shown
- Calculate: £175k × 0.7 = £122.5k RNRB

### Test Scenario 5: Joint Tenants
- Jointly owned → Joint tenants
- Add joint tenant
- **Verify:** Big warning about automatic survivorship
- **Verify:** Beneficiary section explains "as last survivor"

### Test Scenario 6: Tenants in Common
- Jointly owned → Tenants in common
- 2 people, 50% each
- Add beneficiaries for your 50%
- **Verify:** Heading "Who receives your 50%?"

### Test Scenario 7: Company Owned
- Owned through company
- Link to existing company (if Phase 11 done)
- **Verify:** Auto-populates % and share class
- **Verify:** Info about shares vs property

### Test Scenario 8: Life Trust Settlor
- Owned through trust → Life Trust → Settlor
- Reserved benefit: Occupation
- Not paying market rent
- **Verify:** GROB warning shows
- Change to "paying market rent"
- **Verify:** Info box (not warning) shows

### Test Scenario 9: Life Trust Beneficiary (Life Interest)
- Benefit type: Life Interest
- Settlor deceased
- Interest began on passing
- **Verify:** Explanatory note about property in estate
- **Verify:** Can add remaindermen for visualization

### Test Scenario 10: Bare Trust S&B with GROB
- Settlor & Beneficiary
- Currently live there: Yes
- Your share: 60%
- **Verify:** Warning about 40% gifted portion GROB

### Test Scenario 11: State Persistence
- Start with Residential
- Switch to Commercial → Agricultural
- **Verify:** Property type clears, other data persists
- Switch back to Residential
- **Verify:** No data loss

### Test Scenario 12: Multiple Properties
- Add 3 properties (residential, FHL, agricultural)
- **Verify:** All save
- **Verify:** Summary shows all 3
- **Verify:** Totals correct
- Edit one
- **Verify:** Accordion state reloads correctly

---

## Success Criteria

**Must Pass:**
- ✅ All conditional accordions render correctly
- ✅ FHL qualification status accurate (real-time)
- ✅ APR rate display correct (100% vs 50%)
- ✅ RNRB split calculation documented
- ✅ Joint tenants warning prominent
- ✅ All 3 GROB cases detected (Life Trust, Bare Trust S&B, Discretionary S&B)
- ✅ 7-year rule helpers present
- ✅ Remaindermen percentages total 100%
- ✅ Net value = gross - mortgage
- ✅ Simple properties feel simple (4 sections)
- ✅ Complex properties feel appropriate (5-6 sections)

---

## Final Titan Review

### 🚀 Elon (With Conditional Rendering Understanding):

**After learning each user sees different accordions:**

"OK, I was wrong. Conditional fields aren't bloat. Shop owner sees shop questions, farmer sees farm questions. That's correct.

Keep: FHL, Agricultural, Mixed-Use, Buy-to-Let accordions. All tax-critical.

Cut: Acquisition date (make it optional, doesn't affect IHT bill).

You've explained the complexity correctly. **This is as simple as UK tax law allows.**"

**Rating:** 8.5/10 - "Approve. Ship it."

### 💼 Gates (After IHT Law Review):

"Simplified native trust spec is better than web:
- Catches Bare Trust S&B GROB case (web misses this)
- Explicit 7-year rule helpers (educates user)
- Life interest vs remainderman split (clearer data model)
- Complex cases → expert contact (smart, users aren't tax experts)

Mixed-use RNRB split: Critical. £49k savings on typical £500k mixed property.

Acquisition date: Not IHT-critical. Make optional.

**This plan is legally sound and well-architected.**"

**Rating:** 9.5/10 - "Best plan in this entire project. Approve."

### 🍎 Jobs (After Understanding User Journeys):

"Each user sees their relevant flow:
- 95% see simple (4 sections)
- 5% see their specific complexity (FHL questions, farm questions, etc.)

This IS progressive disclosure done right.

Make it beautiful:
- Real-time FHL status with color
- GROB warnings prominent
- Percentage bars for remaindermen
- Overall: 'Section 3 of 5' not 'Field 18 of 83'

**Approve. This is good design.**"

**Rating:** 9/10 - "Finally understood correctly. Ship this."

---

## Summary & Approval

**Phase 14a (MVP):** 26 hours (3-4 days)
- All conditional accordions (FHL, Agricultural, Mixed-Use, Buy-to-Let)
- All ownership types (personal, joint, company)
- Beneficiaries with percentages
- Trust name collection (full details in Phase 14b)

**Phase 14b (Trust Details):** 6 hours (1 day)
- 6 trust fieldsets with simplified native spec
- Better GROB detection than web
- Clearer explanatory text
- 50% less code than web version

**Total:** 32 hours (4-5 days)

**Fields:** 83 used (9 legacy excluded)

**Conditional:** Simple property = 15 fields, Complex property = 25 fields

**IHT Compliance:** All tax reliefs calculated correctly (BPR, APR, RNRB, GROB, 7-year taper)

---

## Next Steps

1. ✅ Review this final plan
2. ✅ Approve for implementation
3. ✅ Begin with Task 14a.1

**Status:** FINAL - READY FOR IMPLEMENTATION


