# Asset Management Data Structure Analysis

**Created:** December 4, 2024  
**Purpose:** Document asset type structures and address critical incoherencies before implementation

---

## Asset Type Overview

### Simple Assets (Start Here)
1. **bank-accounts** - 7 fields (provider, type, balance, ownership)
2. **crypto-currency** - 4 fields (type, platform, quantity, value)
3. **important-items** - 3 fields (title, beneficiaries, value)

### Moderate Assets
4. **investment** - 6 fields (name, provider, type, beneficiary, value)
5. **pensions** - 8 fields (provider, type, value, owner, beneficiary status)
6. **life-insurance** - 8 fields (provider, policy, assured, beneficiaries array)
7. **private-company-shares** - 6 fields + 4 IHT questions

### Complex Assets
8. **assets-held-through-business** - 7 fields + business linkage
9. **agricultural-assets** - 25+ fields (APR/BPR tax planning)
10. **property** - 100+ fields across multi-step wizard

---

## Critical Incoherencies to Fix

### 1. Beneficiary Assignment Format (HIGH PRIORITY)

**Problem:** Two competing formats exist in web prototype

**Legacy format (single beneficiary):**
```typescript
{
  beneficiaryId?: string; // Person ID only
}
```

**New format (multiple beneficiaries):**
```typescript
{
  beneficiaryAssignments?: {
    beneficiaries: Array<{
      id: string;
      type: 'person' | 'group' | 'estate';
      name?: string;
    }>;
  };
}
```

**Decision:** Use new format ONLY in native app
- More flexible (multiple beneficiaries, groups, estate)
- Future-proof for complex distributions
- Already used in ImportantItemAsset

**Implementation:**
- All asset types get `beneficiaryAssignments` (optional)
- No `beneficiaryId` field in native app
- Migration not needed (fresh app)

### 2. Property Asset Structure (MEDIUM PRIORITY)

**Problem:** Redundant data structure in web prototype

**Lines 330-362 in types.ts:**
```typescript
interface PropertyAsset {
  // Top-level fields
  propertyType: string;
  ownershipType: string;
  
  // Nested duplicate
  basicDetails: {
    propertyType: string;    // DUPLICATE
    ownershipType: string;   // DUPLICATE
    // ... more duplicates
  };
}
```

**Decision:** Flatten structure in native app
- Keep top-level fields only
- Remove `basicDetails` nested object
- Simpler forms, easier state management

**Implementation:**
- PropertyAsset uses flat structure
- All fields at top level
- Forms write directly to asset properties

---

## Non-Issues (Accepted Variations)

These are intentional design choices, not problems:

### Value Field Naming
- `estimatedValue` (property, investments, important-items)
- `currentValue` (pensions, crypto)
- `currentBalance` (bank-accounts)

**Why it's fine:** Domain-specific terminology
- "Estimated" for illiquid assets (property)
- "Current" for tracked values (pensions, crypto)
- "Balance" for accounts (bank accounts)

Forms use appropriate labels; all map to `BaseAsset.estimatedValue`

### Ownership Type Variations
- Property: 'sole' | 'joint-tenants' | 'tenants-in-common' (legal terms)
- Bank: 'personal' | 'joint' (simple terms)

**Why it's fine:** Asset-specific legal requirements
- Property ownership has legal implications (inheritance rights)
- Bank accounts need simple user-friendly options

### Missing heldInTrust on Crypto
**Why it's fine:** Trusts holding crypto is extremely rare edge case

---

## Type Definitions Strategy

### BaseAsset (Foundation)
```typescript
interface BaseAsset {
  id: string;
  type: AssetType;
  title: string;
  description?: string;
  estimatedValue?: number;
  netValue?: number;
  heldInTrust?: 'yes' | 'no' | 'not-sure';
  beneficiaryAssignments?: BeneficiaryAssignments; // NEW FORMAT
  createdAt: Date;
  updatedAt: Date;
}
```

### BeneficiaryAssignments (Reusable)
```typescript
interface BeneficiaryAssignments {
  beneficiaries: Array<{
    id: string;
    type: 'person' | 'group' | 'estate';
    name?: string;
    percentage?: number;        // For splits
    isManuallyEdited?: boolean; // For auto-calculation
  }>;
}
```

### Asset-Specific Interfaces
Each extends BaseAsset and adds specific fields:
- BankAccountAsset: provider, accountType, ownershipType, accountNumber, currentBalance
- CryptoCurrencyAsset: cryptoType, platform, quantity, currentValue
- InvestmentAsset: provider, investmentType, accountNumber, currentValue
- etc.

---

## Implementation Order

### Phase 1: Foundation (This Phase)
1. ✅ Create this analysis document
2. Port type definitions to native-app/src/types/index.ts
3. Create assetHelpers.ts utilities

### Phase 2: Simple Assets First
1. Bank Accounts (establish pattern)
2. Important Items (multi-beneficiary pattern)
3. Crypto Currency (simple validation)

### Phase 3: Build Complexity
4-7. Moderate assets (pensions, investments, etc.)
8-9. Complex assets (business, agricultural)
10. Property (most complex, defer to last)

---

## Utility Functions Needed

### Value Formatting
```typescript
formatCurrency(value: number): string
parseCurrency(input: string): number
```

### Validation
```typescript
validateAsset(asset: Asset): ValidationResult
isAssetComplete(asset: Asset): boolean
```

### Summaries
```typescript
calculateTotalValue(assets: Asset[]): number
groupAssetsByType(assets: Asset[]): Record<AssetType, Asset[]>
```

### Defaults
```typescript
getDefaultAsset(type: AssetType): Partial<Asset>
```

---

## Key Decisions Made

1. **Use new beneficiary format only** - no legacy support needed
2. **Flatten property structure** - simpler is better
3. **Accept domain-specific naming** - improves UX
4. **Start simple, build complexity** - bank accounts first
5. **Keep utilities focused** - KISS principle

---

## Notes for Implementation

- All asset interfaces go in `src/types/index.ts`
- Follow JSDoc documentation standards (Rule 11)
- Use TypeScript strict mode (Rule 3)
- Test with seed data in developer tools
- Add to AsyncStorage with key `kindling-bequeathal-data`
