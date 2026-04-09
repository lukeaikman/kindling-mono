# Property Trust Details - Trust Specification

**Source:** Notion Property task page  
**Created:** December 16, 2024  
**Status:** Working specification - subject to refinement  

---

## Trust Fieldsets Overview

### Phase 14b: Trust Details Screen

**Only shown if:** `ownershipType === 'trust_owned'` from PropertyEntryScreen

**Base Fields (3):**
1. Trust Name *
2. Trust Type * (Life Interest / Bare / Discretionary)
3. Your Role in Trust * (options vary by type)

**Then renders 1 of 9 fieldsets based on type + role**

---
    
## Trust Fieldset 1: Life Interest Trust > Settlor

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
   - REQUIRED

6. **Property value when transferred to trust** * (CurrencyInput)
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

---

## Trust Fieldset 2: Life Interest Trust > Beneficiary

**Benefit Type Split First:**
- Life Interest Beneficiary
- Remainderman

### IF LIFE INTEREST:

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

### IF REMAINDERMAN:

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

---

## Trust Fieldset 3: Bare Trust > Settlor

**Fields (4):**

1. **Trust name** * (Input)

2-3. **Trust creation date** * (Month + Year)

4. **Property value when transferred** * (CurrencyInput)

5. **Beneficiaries** (PersonSelector multi with percentages)
   - Names, relationships, % allocations
   - Must total 100%

**Validation:** All except percentages REQUIRED if only 1 beneficiary

---

## Trust Fieldset 4: Bare Trust > Beneficiary

**Fields (2):**

1. **Co-beneficiaries** (PersonSelector multi with percentages, optional)
   - Helper: "Others who share absolute ownership"
   - Names, relationships, % allocations

2. **Trustees** (PersonSelector multi, optional)
   - Helper: "For executor information"

**Validation:** None required (all optional)

---

## Trust Fieldset 5: Bare Trust > Settlor & Beneficiary

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

---

## Trust Fieldset 6: Discretionary Trust > Beneficiary

**Fields (3):**

**Explanatory Text (Always Shown):**
> "While you're enjoying a benefit from this discretionary trust, the property is not part of your estate and therefore is not yours to give via your will."

**Your Role in the Trust:**

1. **Do all beneficiaries have the right to collapse the trust?** * (RadioGroup)
   - Yes
   - No  
   - Not sure

2. **Does the trust give you a default entitlement?** * (RadioGroup)
   - Yes
   - No
   - Not sure

**Conditional Message:**

**IF right to collapse OR default entitlement = 'yes':**
> ℹ️ Our team will reach out to you to clarify important details once the asset entry process is complete.

**ELSE (both 'no' or 'not sure'):**
- Checkbox: "If you think your situation may be more complicated than this, check this box and we'll reach out to you."

**Validation:** Both questions REQUIRED (cannot be blank)

---

## Trust Fieldset 7: Discretionary Trust > Settlor

**Fields (3):**

1. **Trust name** * (Input)

2-3. **Month and year of property transferred into trust** * (Month + Year)

4. **Value at time of transfer** * (CurrencyInput)

**Validation:** All 3 REQUIRED

---

## Trust Fieldset 8: Discretionary Trust > Settlor & Beneficiary

**Fields (1):**

**Warning Box:**
> ⚠️ **Settlor-Interested Trust**
> This appears to be a settlor-interested trust. The property will remain in your estate for inheritance tax purposes as you have a beneficial interest.

**Checkbox:** "If your situation is more complex, check here and our team will reach out."

**Validation:** None required

---

## Field Mapping: Form ↔ Storage

**"Not sure" handling:**
- UI: Shows as third radio option "Not sure"
- Storage: Empty string `''`
- Loading: `value || ''` maps empty/undefined to 'not sure' radio button
- Validation: Empty string `''` is **invalid** - must select yes or no

**Example:**
```typescript
// Saving
discretionaryRightToCollapse: '' // User selected "Not sure"

// Loading
<RadioGroup
  value={trustData.discretionaryRightToCollapse || ''} // '' selects "Not sure"
  options={[
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Not sure', value: '' },
  ]}
/>

// Validation
if (trustData.discretionaryRightToCollapse === '') {
  return false; // Not sure is NOT valid - must choose yes or no
}
```

---

## TASK 2: Trust Spec Extracted to MD

✅ **Saved to:** `planning/TRUST_SPECIFICATION.md`

**Contains:**
- All 8 trust fieldsets
- Field specifications
- Validation rules
- Current implementation details

**READY FOR YOUR SAVE CONFIRMATION**

---

## 🛑 PAUSED FOR APPROVAL

Please review:

1. ✅ **Data model changes** - 2 new string fields in TrustData interface
2. ✅ **Interface placement** - Under "Your Role in the Trust" heading
3. ✅ **Validation logic** - Empty string = "not sure" = INVALID (must choose)
4. ✅ **Conditional message** - Based on yes/no answers
5. ✅ **MD file created** - Ready for your save

**Approve to proceed to Task 3** (updating the MD file with new fields in correct locations)?
