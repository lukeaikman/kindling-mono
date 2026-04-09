# Spouse/Civil Partner Exclusion Question - Implementation Plan

## Overview

Add a question "Is your spouse/civil partner excluded from benefit?" for all **settlor+beneficiary** role combinations across all trust types.

**Question:**
- "Is your spouse/civil partner excluded from benefit?"
- Options:
  - ○ Yes - specifically excluded
  - ○ No - can benefit
  - ○ Not sure

## Current Architecture Review

### Trust Role Combinations

**Life Interest Trust:**
- ✅ Beneficiary
- ✅ Settlor
- ❌ Settlor & Beneficiary (not available)

**Bare Trust:**
- ✅ Beneficiary
- ✅ Settlor
- ✅ **Settlor & Beneficiary** ← Add question here

**Discretionary Trust:**
- ✅ Beneficiary
- ✅ Settlor
- ✅ **Settlor & Beneficiary** ← Add question here

### Current Data Storage

**Frontend (Native App):**
- Trust data stored inline in `PropertyAsset` interface:
  ```typescript
  interface PropertyAsset {
    trustName?: string;
    trustType?: 'life_interest' | 'bare' | 'discretionary';
    trustRole?: 'beneficiary' | 'settlor' | 'settlor_and_beneficiary';
    // ... other fields
  }
  ```

- `TrustData` interface in `trust-details.tsx` contains role-specific fields
- Currently stored in AsyncStorage (local state management)

**Backend (Rails API):**
- No property asset schema yet (API not fully implemented)
- Will need database migration when backend is implemented
- Data structure will mirror frontend types

## Implementation Plan

### Phase 1: Frontend Type Definitions

#### 1.1 Update `TrustData` Interface

**File:** `app/bequeathal/property/trust-details.tsx` (line ~36)

**Add field to TrustData interface:**

```typescript
interface TrustData {
  // ... existing fields ...
  
  // Bare Trust Settlor & Beneficiary fields
  currentlyLiveInProperty: string;
  bareValueAtTransfer: number;
  bareSettlorAndBeneficiaryValueUnknown: boolean;
  spouseExcludedFromBenefit: 'yes' | 'no' | 'not_sure' | ''; // NEW
  
  // Discretionary Trust Settlor & Beneficiary fields
  // (Currently no fields, but will need this)
  discretionarySettlorAndBeneficiarySpouseExcluded: 'yes' | 'no' | 'not_sure' | ''; // NEW
}
```

**Initial state (line ~98):**

```typescript
const [trustData, setTrustData] = useState<TrustData>({
  // ... existing fields ...
  
  // Bare Trust Settlor & Beneficiary
  currentlyLiveInProperty: '',
  bareValueAtTransfer: 0,
  bareSettlorAndBeneficiaryValueUnknown: false,
  spouseExcludedFromBenefit: '', // NEW
  
  // Discretionary Trust Settlor & Beneficiary
  discretionarySettlorAndBeneficiarySpouseExcluded: '', // NEW
});
```

#### 1.2 Update `PropertyAsset` Interface

**File:** `src/types/index.ts` (line ~400)

**Add field to PropertyAsset:**

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
  beneficiaryAssignments?: {
    beneficiaries: Array<{
      id: string;
      type: 'person' | 'group' | 'estate';
      name?: string;
      percentage?: number;
    }>;
  };
  
  // Trust fields (inline)
  trustName?: string;
  trustType?: 'life_interest' | 'bare' | 'discretionary';
  trustRole?: 'beneficiary' | 'settlor' | 'settlor_and_beneficiary';
  spouseExcludedFromBenefit?: 'yes' | 'no' | 'not_sure'; // NEW - only when trustRole = 'settlor_and_beneficiary'
}
```

**Note:** This field is only relevant when `trustRole === 'settlor_and_beneficiary'`, but we store it at the PropertyAsset level for simplicity.

### Phase 2: UI Implementation

#### 2.1 Bare Trust Settlor & Beneficiary Fieldset

**File:** `app/bequeathal/property/trust-details.tsx`

**Location:** `renderBareSettlorAndBeneficiaryFieldset()` function (line ~734)

**Add after co-beneficiaries section (after line ~810):**

```typescript
{/* Spouse/Civil Partner Exclusion Question */}
<RadioGroup
  label="Is your spouse/civil partner excluded from benefit? *"
  value={trustData.spouseExcludedFromBenefit}
  onChange={(value) => updateTrustData('spouseExcludedFromBenefit', value)}
  options={[
    { label: 'Yes - specifically excluded', value: 'yes' },
    { label: 'No - can benefit', value: 'no' },
    { label: 'Not sure', value: 'not_sure' },
  ]}
  style={styles.compactRadioGroup}
/>
```

#### 2.2 Discretionary Trust Settlor & Beneficiary Fieldset

**File:** `app/bequeathal/property/trust-details.tsx`

**Location:** `renderDiscretionarySettlorAndBeneficiaryFieldset()` function (line ~1045)

**Current state:** Function exists and contains:
- Warning box about settlor-interested trust
- Optional checkbox for complex situations

**Add the question after the warning box and before the checkbox:**

```typescript
const renderDiscretionarySettlorAndBeneficiaryFieldset = () => (
  <View style={styles.fieldsetContent}>
    <View style={styles.warningBox}>
      <Text style={styles.warningTitle}>⚠️ Settlor-Interested Trust</Text>
      <Text style={styles.warningText}>
        This appears to be a settlor-interested trust. The property will remain in your estate for inheritance tax purposes as you have a beneficial interest.
      </Text>
    </View>

    {/* Spouse/Civil Partner Exclusion Question - NEW */}
    <RadioGroup
      label="Is your spouse/civil partner excluded from benefit? *"
      value={trustData.discretionarySettlorAndBeneficiarySpouseExcluded}
      onChange={(value) => updateTrustData('discretionarySettlorAndBeneficiarySpouseExcluded', value)}
      options={[
        { label: 'Yes - specifically excluded', value: 'yes' },
        { label: 'No - can benefit', value: 'no' },
        { label: 'Not sure', value: 'not_sure' },
      ]}
      style={styles.compactRadioGroup}
    />

    <Checkbox
      label="If your situation is more complex, check here and our team will reach out."
      checked={trustData.discretionaryComplexSituation}
      onCheckedChange={(value) => updateTrustData('discretionaryComplexSituation', value)}
    />
  </View>
);
```

### Phase 3: Validation Logic

#### 3.1 Update Form Validation

**File:** `app/bequeathal/property/trust-details.tsx`

**Location:** `isFormValid()` function (line ~1070)

**Update Bare Trust Settlor & Beneficiary validation (line ~1136):**

```typescript
// Bare Trust Settlor & Beneficiary validation
if (trustData.trustType === 'bare' && trustData.trustRole === 'settlor_and_beneficiary') {
  // Value: Either "I don't know" is checked OR value is > 0
  const hasValueUnknown = trustData.bareSettlorAndBeneficiaryValueUnknown;
  const hasValue = trustData.bareValueAtTransfer > 0;
  
  return (
    trustData.currentlyLiveInProperty !== '' &&
    (hasValueUnknown || hasValue) &&
    trustData.spouseExcludedFromBenefit !== '' // NEW - required
  );
}
```

**Update Discretionary Trust Settlor & Beneficiary validation (line ~1205):**

```typescript
// Discretionary Trust Settlor & Beneficiary validation
if (trustData.trustType === 'discretionary' && trustData.trustRole === 'settlor_and_beneficiary') {
  return trustData.discretionarySettlorAndBeneficiarySpouseExcluded !== ''; // NEW - required
}
```

### Phase 4: Save/Load Logic

#### 4.1 Update Save Handler

**File:** `app/bequeathal/property/trust-details.tsx`

**Location:** `handleSave()` function (line ~1212)

**Current:** TODO - Save trust data to property

**Implementation needed:**

```typescript
const handleSave = () => {
  // Get property ID from route params (if editing) or create new
  const params = useLocalSearchParams();
  const propertyId = params.propertyId as string | undefined;
  
  // Get property asset
  const property = propertyId 
    ? bequeathalActions.getAssetById(propertyId) as PropertyAsset
    : null;
  
  if (!property) {
    // Error handling - property should exist
    console.error('Property not found');
    return;
  }
  
  // Update property with trust data
  bequeathalActions.updateAsset(property.id, {
    ...property,
    trustName: trustData.trustName,
    trustType: trustData.trustType,
    trustRole: trustData.trustRole,
    
    // Add spouse exclusion field when role is settlor_and_beneficiary
    ...(trustData.trustRole === 'settlor_and_beneficiary' && {
      spouseExcludedFromBenefit: 
        trustData.trustType === 'bare' 
          ? trustData.spouseExcludedFromBenefit
          : trustData.discretionarySettlorAndBeneficiarySpouseExcluded,
    }),
    
    // ... other trust-specific fields based on type + role
  });
  
  router.push('/bequeathal/property/summary');
};
```

**Note:** The save logic needs to map all trust-specific fields to PropertyAsset. This is a larger refactor that should be done comprehensively.

#### 4.2 Update Load Logic

**File:** `app/bequeathal/property/trust-details.tsx`

**Add useEffect to load existing trust data (if editing):**

```typescript
const params = useLocalSearchParams();
const propertyId = params.propertyId as string | undefined;
const loadedPropertyIdRef = useRef<string | null>(null);

useEffect(() => {
  if (!propertyId) return;
  if (loadedPropertyIdRef.current === propertyId) return;
  
  // Wait for AsyncStorage
  const allAssets = bequeathalActions.getAllAssets();
  if (allAssets.length === 0) return;
  
  const property = bequeathalActions.getAssetById(propertyId) as PropertyAsset;
  if (!property) return;
  
  // Load trust data
  if (property.trustName && property.trustType && property.trustRole) {
    setTrustData({
      trustName: property.trustName,
      trustType: property.trustType,
      trustRole: property.trustRole,
      
      // Load spouse exclusion if settlor_and_beneficiary
      ...(property.trustRole === 'settlor_and_beneficiary' && {
        spouseExcludedFromBenefit: property.spouseExcludedFromBenefit || '',
        discretionarySettlorAndBeneficiarySpouseExcluded: property.spouseExcludedFromBenefit || '',
      }),
      
      // ... load other trust-specific fields
    });
  }
  
  loadedPropertyIdRef.current = propertyId;
}, [propertyId]);
```

### Phase 5: Backend Storage (Future)

#### 5.1 Database Schema

**When Rails API is implemented, add migration:**

```ruby
class AddSpouseExcludedFromBenefitToPropertyAssets < ActiveRecord::Migration[8.1]
  def change
    add_column :property_assets, :spouse_excluded_from_benefit, :string
    
    # Add check constraint to ensure valid values
    add_check_constraint :property_assets, 
      "spouse_excluded_from_benefit IN ('yes', 'no', 'not_sure') OR spouse_excluded_from_benefit IS NULL",
      name: 'check_spouse_excluded_from_benefit_values'
  end
end
```

#### 5.2 API Serialization

**PropertyAsset serializer should include:**

```ruby
# app/serializers/property_asset_serializer.rb
class PropertyAssetSerializer < ActiveModel::Serializer
  attributes :id, :title, :address, :property_type, :ownership_type,
             :trust_name, :trust_type, :trust_role,
             :spouse_excluded_from_benefit # NEW
  
  # ... other attributes
end
```

#### 5.3 Validation

**Model validation (when implemented):**

```ruby
# app/models/property_asset.rb
class PropertyAsset < ApplicationRecord
  validates :spouse_excluded_from_benefit, 
    inclusion: { in: %w[yes no not_sure] }, 
    allow_nil: true,
    if: -> { trust_role == 'settlor_and_beneficiary' }
  
  # Only required when trust_role is settlor_and_beneficiary
  validates :spouse_excluded_from_benefit, 
    presence: true,
    if: -> { trust_role == 'settlor_and_beneficiary' }
end
```

## Implementation Checklist

### Frontend
- [ ] Add `spouseExcludedFromBenefit` to `TrustData` interface
- [ ] Add `discretionarySettlorAndBeneficiarySpouseExcluded` to `TrustData` interface
- [ ] Initialize fields in `useState` initial state
- [ ] Add `spouseExcludedFromBenefit` to `PropertyAsset` interface
- [ ] Add RadioGroup UI to Bare Trust Settlor & Beneficiary fieldset
- [ ] Add RadioGroup UI to Discretionary Trust Settlor & Beneficiary fieldset
- [ ] Update validation for Bare Trust Settlor & Beneficiary
- [ ] Update validation for Discretionary Trust Settlor & Beneficiary
- [ ] Update save handler to persist field
- [ ] Update load logic to restore field
- [ ] Test all settlor+beneficiary combinations

### Backend (Future)
- [ ] Create database migration
- [ ] Update API serializer
- [ ] Add model validation
- [ ] Update API documentation

## Questions & Decisions

### Q1: Single Field vs. Separate Fields?

**Decision:** Use separate fields in `TrustData` interface for clarity:
- `spouseExcludedFromBenefit` (Bare Trust)
- `discretionarySettlorAndBeneficiarySpouseExcluded` (Discretionary Trust)

But store as single field `spouseExcludedFromBenefit` in `PropertyAsset` since it's role-specific.

**Rationale:** 
- Clearer in UI code (know which trust type)
- Simpler storage (one field)
- Can be mapped during save/load

### Q2: Required vs. Optional?

**Decision:** **Required** when `trustRole === 'settlor_and_beneficiary'`

**Rationale:** This is important IHT information that should be captured.

### Q3: Life Interest Trust?

**Decision:** Not applicable - Life Interest Trust doesn't have settlor+beneficiary role option.

**Rationale:** Based on current role options, only Bare and Discretionary trusts support this combination.

## Testing Plan

1. **Bare Trust Settlor & Beneficiary:**
   - [ ] Question appears after co-beneficiaries
   - [ ] All three options work
   - [ ] Required validation works
   - [ ] Save/load works correctly

2. **Discretionary Trust Settlor & Beneficiary:**
   - [ ] Question appears in fieldset
   - [ ] All three options work
   - [ ] Required validation works
   - [ ] Save/load works correctly

3. **Other Roles:**
   - [ ] Question does NOT appear for settlor-only
   - [ ] Question does NOT appear for beneficiary-only
   - [ ] Question does NOT appear for Life Interest Trust

4. **Data Persistence:**
   - [ ] Field saves to PropertyAsset
   - [ ] Field loads correctly on edit
   - [ ] Field persists across app restarts (AsyncStorage)

## Files to Modify

1. `app/bequeathal/property/trust-details.tsx`
   - TrustData interface
   - Initial state
   - Bare Trust Settlor & Beneficiary fieldset
   - Discretionary Trust Settlor & Beneficiary fieldset
   - Validation logic
   - Save handler
   - Load logic (useEffect)

2. `src/types/index.ts`
   - PropertyAsset interface

3. Backend (Future):
   - Database migration
   - Model validation
   - API serializer
