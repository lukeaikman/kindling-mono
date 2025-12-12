# Phase 14 Property - Foundation Testing & Handoff

**Status:** Foundation Complete (Tasks 1-2 of 16)  
**Next Session:** Continue with PropertyEntryScreen implementation  
**Created:** December 2024

---

## What's Been Completed

### ✅ Task 14a.1: PropertyIntroScreen (COMPLETE)
**File:** `app/bequeathal/property/intro.tsx`
- Intro content with RNRB tax relief info (£175k-£350k)
- External link to gov.uk
- Sequential navigation
- Morphic background
- Commit: 9325e96

### ✅ Task 14a.2: PropertyAsset Type Update (COMPLETE)
**File:** `src/types/index.ts`
- 83 fields with conditional groups
- PropertyUsage enum
- Comprehensive JSDoc
- All usage-specific fieldsets (FHL, Agricultural, Mixed-Use, Buy-to-Let)
- Company, Trust, Joint ownership fields
- Unified BeneficiaryAssignments
- Commit: 6cfca22

---

## Testing Before Continuing

### Test 1: PropertyAsset Type Validation

**Check TypeScript Compilation:**
```bash
cd native-app
npx tsc --noEmit
```

**Expected:** No errors related to PropertyAsset

**Verify:**
- PropertyUsage type exists
- All conditional fields optional (? suffix)
- No duplicate field names
- BeneficiaryAssignments reference correct

### Test 2: PropertyIntroScreen Navigation

**Manual Test:**
1. Run app
2. Go to Assets & Bequests → Select Property
3. See PropertyIntroScreen
4. **Verify:** Content displays correctly
5. **Verify:** "Start Adding Property" → Goes to property/entry
6. **Verify:** "Skip for now" → Sequential navigation to next category OR order-of-things
7. **Verify:** External link opens browser

**Expected:** All navigation works, no crashes

### Test 3: Property Type in AsyncStorage

**Check:**
1. After Phase 14 complete, add a property
2. Open Developer Dashboard → Data Explorer
3. Find property in bequeathalData
4. **Verify:** Only populated fields saved (conditionals null/undefined)
5. **Verify:** beneficiaryAssignments uses unified type format

---

## Remaining Work (For Next Session)

### Phase 14a Remaining Tasks (24 hours)

**Task 14a.3:** Accordion Component Decision (30 min)
- Test react-native-paper List.Accordion
- OR use react-native-collapsible
- OR build custom with Animated API
- **Decision needed before proceeding**

**Task 14a.4:** PropertyEntryScreen Shell (1 hour)
- Screen structure with ScrollView
- Accordion state management (which accordion is open)
- Property form state (all 83 fields)
- Conditional accordion rendering logic
- Next button handlers

**Task 14a.5:** Address Accordion (1.5 hours)
- 5 input fields
- Validation (address1, townCity, country required)
- Next button opens Usage & Type accordion
- **First real accordion - validates chosen component**

**Task 14a.6:** Usage & Type Accordion (2 hours)
- Usage select (3 options)
- Property type select (conditional options based on usage)
- Next button conditional logic (opens FHL/Agricultural/Mixed/BuyToLet/PropertyDetails based on selection)

**Task 14a.7:** FHL Accordion (2 hours)
- 3 HMRC criteria checkboxes
- Annual income input
- Real-time qualification status (green/amber)
- Warning text conditional on checkboxes

**Task 14a.8:** Agricultural Accordion (3 hours)
- 7 fields with nested conditionals
- APR qualification logic
- Warning if not actively farmed
- Helper text about 100% vs 50% relief

**Task 14a.9:** Mixed-Use Accordion (1.5 hours)
- 3 fields
- Auto-calculate residential % display
- RNRB split explanation

**Task 14a.10:** Buy-to-Let Accordion (2 hours)
- 4 fields
- Tenancy type conditional
- Valuation discount note

**Task 14a.11:** Property Details Accordion (3 hours)
- 7 fields including ownership, value, mortgage, acquisition
- Mortgage conditionals
- Next logic (trust/company/beneficiaries)

**Task 14a.12:** Company Ownership Accordion (2 hours)
- 6 fields
- CompanySelector if Phase 11 complete
- Articles checkbox

**Task 14a.13:** Joint Ownership Section (2 hours)
- Joint tenants selector with warning
- Tenants in common with % and NumericStepper
- Not sure option

**Task 14a.14:** Beneficiaries Section (1 hour)
- BeneficiaryWithPercentages (reuse)
- Conditional heading

**Task 14a.15:** PropertySummaryScreen (2 hours)
- List view
- Edit/Delete
- Totals

**Task 14a.16:** Testing & Polish (3 hours)
- 12 test scenarios
- Bug fixes
- Visual polish

**Total Remaining:** ~24 hours (3 days)

---

## Key Decisions Needed

### 1. Accordion Component Choice

**Options:**

**A. react-native-paper List.Accordion**
- Pros: Already have Paper, built-in, simple API
- Cons: Limited styling control, may not handle controlled expansion perfectly
- Example:
```tsx
<List.Accordion
  title="Address"
  expanded={expandedAccordion === 'address'}
  onPress={() => setExpandedAccordion('address')}
>
  {/* Content */}
</List.Accordion>
```

**B. react-native-collapsible**
- Pros: More control, smooth animations, popular library
- Cons: Need to install dependency
- Example:
```tsx
<TouchableOpacity onPress={() => toggle('address')}>
  <Text>Address</Text>
</TouchableOpacity>
<Collapsible collapsed={expandedAccordion !== 'address'}>
  {/* Content */}
</Collapsible>
```

**C. Custom with Animated API**
- Pros: Full control, no dependencies
- Cons: Most work, need to build height animations
- Example:
```tsx
<Animated.View style={{height: heightAnim}}>
  {/* Content */}
</Animated.View>
```

**Recommendation:** Try **A** (List.Accordion) first in Task 14a.5. If issues, switch to **B**.

### 2. State Management Pattern

**Single property state object:**
```typescript
const [propertyData, setPropertyData] = useState<Partial<PropertyAsset>>({
  address: { address1: '', address2: '', townCity: '', countyState: '', country: 'United Kingdom' },
  usage: '',
  propertyType: '',
  ownershipType: '',
  // ... all 83 fields with defaults
});
```

**OR separate state per accordion:**
```typescript
const [address, setAddress] = useState<AddressData>({...});
const [usage, setUsage] = useState<PropertyUsage | ''>('');
const [propertyType, setPropertyType] = useState('');
// ...
```

**Recommendation:** Single object (easier to save/load, matches web prototype)

---

## Critical Implementation Notes for Next Session

### Conditional Accordion Rendering

**Pattern from web prototype:**
```typescript
// Always show
<Accordion title="Address">...</Accordion>
<Accordion title="Usage & Type">...</Accordion>

// Conditional
{isFHL() && <Accordion title="FHL Details">...</Accordion>}
{isAgricultural() && <Accordion title="Agricultural Details">...</Accordion>}
{isMixedUse() && <Accordion title="Mixed-Use Details">...</Accordion>}
{isBuyToLet() && <Accordion title="Buy-to-Let Details">...</Accordion>}

// Always show
<Accordion title="Property Details">...</Accordion>

// Conditional
{isCompanyOwned() && <Accordion title="Company Ownership">...</Accordion>}
```

**Helper functions:**
```typescript
const isFHL = () => propertyData.propertyType?.includes('furnished_holiday_let');
const isAgricultural = () => propertyData.propertyType === 'agricultural_property';
const isMixedUse = () => propertyData.propertyType === 'mixed_use_property';
const isBuyToLet = () => propertyData.propertyType === 'buy_to_let';
const isCompanyOwned = () => propertyData.ownershipType === 'company_owned';
```

### State Preservation (from web analysis)

**When user changes selections:**
- Usage change → Clears propertyType only
- Property type change → No clearing
- Ownership change → No clearing

**Hidden conditional fields persist in state**

**Don't clear data when hiding accordions** (matches web behavior, prevents data loss)

### Next Accordion Logic

**Each accordion's "Next" button:**
```typescript
const handleAddressNext = () => setExpandedAccordion('usage-type');

const handleUsageNext = () => {
  if (isFHL()) setExpandedAccordion('fhl');
  else if (isAgricultural()) setExpandedAccordion('agricultural');
  else if (isMixedUse()) setExpandedAccordion('mixed-use');
  else if (isBuyToLet()) setExpandedAccordion('buy-to-let');
  else setExpandedAccordion('property-details');
};

// Conditional accordions all go to property-details
const handleFHLNext = () => setExpandedAccordion('property-details');
```

---

## Files to Reference

### Planning Documents:
1. **PHASE_14_PROPERTY_FINAL_PLAN.md** - Master plan with all specs
2. **TRUST_FIELDSETS_COMPARISON.md** - Trust implementation approach (simplified native vs web)

### Similar Implementations:
1. **app/bequeathal/pensions/entry.tsx** - Conditional field pattern (beneficiaries only if nominated)
2. **app/bequeathal/investment/entry.tsx** - Form with BeneficiaryWithPercentages
3. **app/bequeathal/bank-accounts/entry.tsx** - Collapsible list pattern

### Components to Reuse:
1. **BeneficiaryWithPercentages** - For property beneficiaries, remaindermen
2. **PersonSelector** - For joint tenants, life tenants
3. **Select, Input, CurrencyInput** - Form fields
4. **SearchableSelect** - For mortgage providers (27 options)

---

## Known Gotchas (Don't Forget)

1. **Joint Tenants Warning:** Must be prominent (legal requirement, can't bequeath)
2. **FHL Real-Time Status:** Warning color changes as checkboxes toggle
3. **Mixed-Use RNRB Split:** Auto-calculate and display residential %
4. **Company Ownership:** Check if Phase 11 complete for CompanySelector
5. **State Preservation:** Don't clear hidden accordion data
6. **GROB Detection:** 3 scenarios (Life Trust Settlor, Bare Trust S&B, Discretionary S&B)
7. **Remaindermen Percentages:** Must total 100% (use BeneficiaryWithPercentages component)
8. **Acquisition Date:** Make OPTIONAL (helpful, not required)

---

## What to Test After Next Session

### Foundation Tests (After Address Accordion Built)

**Test F1: Accordion Component**
- Open/close Address accordion
- Verify smooth animation
- Verify only one open at a time
- No visual glitches

**Test F2: Address Validation**
- Leave address1 blank → Next disabled
- Leave townCity blank → Next disabled
- Fill both + country → Next enabled
- Tap Next → Usage accordion opens

**Test F3: State Management**
- Enter address data
- Navigate away (back button)
- Return to screen
- **Verify:** Address data persists

### Full Tests (After All Accordions Built)

**Test P1: Simple Residential Property**
- Address → Usage (Residential) → Type (Primary Residence) → Property Details → Beneficiaries
- **Sees:** 4 sections
- **Time:** ~5 minutes
- **Verify:** Saves correctly, no conditional accordions shown

**Test P2: FHL Property**
- Select Let Residential → FHL
- **Verify:** FHL accordion appears
- Check all 3 criteria
- **Verify:** Green status
- Uncheck one
- **Verify:** Amber warning

**Test P3: Agricultural Property**
- Select Commercial → Agricultural
- **Verify:** Agricultural accordion appears
- Actively farmed by owner
- **Verify:** "100% APR" noted

**Test P4: Mixed-Use Property**
- Select Commercial → Mixed-Use
- **Verify:** Mixed-Use accordion appears
- Enter 30% commercial
- **Verify:** "Residential: 70%" displays
- **Verify:** RNRB split explanation shown

**Test P5: Joint Tenants**
- Select Jointly owned
- Select Joint tenants
- **Verify:** BIG orange warning about automatic survivorship
- **Verify:** Beneficiary heading "As last survivor"

**Test P6: Company Owned**
- Select Owned Through Company
- **Verify:** Company accordion appears after Property Details
- If Phase 11 complete: Verify CompanySelector works

---

## Session Handoff Prompt

**Use this prompt to start the next session:**

```
Continue Phase 14 Property implementation from where we left off.

COMPLETED THIS SESSION (Foundation):
- PropertyIntroScreen (app/bequeathal/property/intro.tsx) ✅
- PropertyAsset type updated with 83 conditional fields (src/types/index.ts) ✅
- Planning documents finalized and cleaned up ✅

CONTEXT:
- Read: @planning/PHASE_14_PROPERTY_FINAL_PLAN.md (the master plan)
- Read: @planning/TRUST_FIELDSETS_COMPARISON.md (trust approach - simplified native, not web)
- Read: @planning/PHASE_14_FOUNDATION_TEST_PLAN.md (this file - testing & handoff)

CURRENT STATUS:
- Phase 14a: Tasks 1-2 complete (PropertyIntro + Type update)
- Phase 14a: Tasks 3-16 remaining (Accordions + Testing)
- Estimated remaining: ~24 hours

NEXT TASKS (In Order):
1. Task 14a.3: Test accordion component approach (30 min)
   - Try react-native-paper List.Accordion first
   - Build simple test in Component Sandbox
   - If issues, switch to react-native-collapsible library
   - Document decision before proceeding

2. Task 14a.4: PropertyEntryScreen shell (1 hour)
   - File: app/bequeathal/property/entry.tsx
   - Replace placeholder
   - State management (single propertyData object with all 83 fields)
   - Accordion state (expandedAccordion: string)
   - Conditional rendering helpers (isFHL, isAgricultural, etc.)

3. Task 14a.5: Build Address accordion (1.5 hours)
   - First real accordion (validates chosen component)
   - 5 fields: address1, address2, townCity, countyState, country
   - Validation
   - Next button → Opens Usage & Type accordion

4. Continue with Tasks 14a.6-14a.16 (remaining accordions + testing)

CRITICAL DECISIONS MADE:
- Accordion pattern (not wizard) - matches web prototype
- Keep ALL conditional accordions (FHL, Agricultural, Mixed-Use, Buy-to-Let) - all tax-critical
- Skip ONLY Residential/Holiday "sometimes rented" (edge case)
- Make acquisition date OPTIONAL (not IHT-critical)
- Use SIMPLIFIED NATIVE trust spec (not web's over-engineered version) - see TRUST_FIELDSETS_COMPARISON.md
- Conditional rendering = streamlined (simple property sees 4 sections, complex sees 5-6)

KEY INSIGHTS:
- Mixed-Use NOT edge case - RNRB split critical (£49k savings on £500k property)
- Acquisition date NOT for 7-year rule (that's gifts BY you, not properties you own)
- GROB in trusts (reserved benefit), not in acquisition date
- Each property type owner EXPECTS their specific questions (conditional = good UX)
- Web has 9 legacy fields (7 funding/GROB + 2 residential booleans) - exclude from native

IMPORTANT PATTERNS:
- State preservation when accordions hide (don't clear conditional data)
- Next button logic varies by accordion (see plan)
- BeneficiaryWithPercentages reusable for property beneficiaries and trust remaindermen
- PropertyAsset has 83 fields but users see 15-25 depending on type

COMPONENTS AVAILABLE:
- BeneficiaryWithPercentages (Phase 9.5) - for beneficiaries, remaindermen
- PersonSelector (Phase 10) - for joint tenants, life tenants
- SearchableSelect - for mortgage providers (27 options)
- All form inputs (Input, CurrencyInput, Select, RadioGroup, Checkbox)

GOTCHAS TO REMEMBER:
- Joint tenants can't bequeath (legal, not tax) - BIG WARNING needed
- FHL qualification status real-time (checkboxes → status color)
- Mixed-use RNRB split auto-calculates residential %
- Company ownership info box: "Shares bequeathed, not property itself"
- Acquisition date optional (web requires but shouldn't)

TEST ACCORDION COMPONENT FIRST before building all 8. If List.Accordion doesn't work well, switch to react-native-collapsible early.

Start with Task 14a.3 (accordion component test).
```

---

## Questions for Next Session

1. **Accordion component working?** (List.Accordion vs collapsible vs custom)
2. **Address accordion renders correctly?** (First real test)
3. **State management approach confirmed?** (Single object vs multiple)
4. **Any issues with conditional rendering?** (isFHL() helper pattern)

---

## Success Criteria for Foundation

Before continuing to remaining accordions:
- ✅ PropertyAsset type compiles with no errors
- ✅ PropertyIntroScreen navigation works
- ✅ Accordion component chosen and tested
- ✅ PropertyEntryScreen shell renders
- ✅ Address accordion works (expand/collapse/validate/next)

**If all pass:** Foundation solid, continue with 7 more accordions

**If any fail:** Fix foundation before building more

---

**Status:** READY FOR NEXT SESSION

**Estimated Time to Complete Phase 14a:** 24 hours (3 days)

**Then Phase 14b (Trust Details):** 6 hours (1 day) - if needed


