# Entity Relationship Diagram (ERD)

**Generated:** January 12, 2026  
**Purpose:** Complete data model visualization for Kindling estate planning app  
**Storage:** AsyncStorage (local-only, offline-first)

---

## Core Entity Overview

The Kindling app uses 10 core entities with normalized relationships:

1. **Person** - People in the system (will-maker, executors, beneficiaries, family)
2. **WillData** - Main will document and configuration
3. **Trust** - Trust structures for estate planning
4. **Business** - Companies and organizations
5. **BeneficiaryGroup** - Groups of beneficiaries for estate remainder
6. **RelationshipEdge** - Normalized relationship graph between people
7. **EstateRemainderState** - Residual estate allocation
8. **Assets** (10 subtypes) - All types of property and holdings
9. **BequeathalData** - Container organizing assets by category
10. **IHTDrawerState** - UI state for tax calculator

---

## Complete ERD

```mermaid
erDiagram
    Person ||--o{ Person : "has relationship"
    Person ||--|| WillData : "is will-maker"
    Person ||--o{ WillData : "is executor"
    Person ||--o{ WillData : "is guardian"
    Person ||--o{ Trust : "settlor beneficiaries"
    Person ||--o{ Trust : "trustees"
    Person ||--o{ BeneficiaryGroup : "member of"
    Person ||--o{ RelationshipEdge : "participates in"
    Person ||--o{ EstateRemainderState : "selected for estate"
    
    WillData ||--o{ GuardianHierarchy : "defines for child"
    WillData ||--o{ AlignmentInfo : "spouse alignment"
    
    Trust ||--o{ PropertyAsset : "holds"
    Trust ||--o{ InvestmentAsset : "holds"
    Trust ||--o{ TrustBeneficiary : "has beneficiaries"
    
    Business ||--o{ AssetsHeldThroughBusinessAsset : "owns"
    
    BeneficiaryGroup ||--o{ EstateRemainderState : "in allocation"
    
    BequeathalData ||--o{ PropertyAsset : "contains"
    BequeathalData ||--o{ ImportantItemAsset : "contains"
    BequeathalData ||--o{ InvestmentAsset : "contains"
    BequeathalData ||--o{ PensionAsset : "contains"
    BequeathalData ||--o{ LifeInsuranceAsset : "contains"
    BequeathalData ||--o{ BankAccountAsset : "contains"
    BequeathalData ||--o{ PrivateCompanySharesAsset : "contains"
    BequeathalData ||--o{ AssetsHeldThroughBusinessAsset : "contains"
    BequeathalData ||--o{ AgriculturalAsset : "contains"
    BequeathalData ||--o{ CryptoCurrencyAsset : "contains"

    Person {
        string id PK
        string firstName
        string lastName
        string email
        string phone
        PersonRole[] roles
        string relationship
        string dateOfBirth
        AddressData address
        boolean isDependent
        boolean isUnder18
        boolean inCare
        CareCategory careCategory
        string[] guardianIds FK
        ExecutorRole executorRole
        string executorStatus
        boolean createdInOnboarding
        Date createdAt
        Date updatedAt
    }
    
    WillData {
        string userId FK "Person.id"
        string willType
        string status
        Executor[] executors "Person IDs"
        object guardianship "childId to guardians"
        object alignment "childId to AlignmentInfo"
        Date createdAt
        Date updatedAt
    }
    
    Trust {
        string id PK
        string name
        TrustType type
        string creationMonth
        string creationYear
        Date creationDate
        boolean isUserSettlor
        boolean isUserBeneficiary
        boolean isUserTrustee
        object settlor "beneficiaries, trustees"
        object beneficiary "entitlement, spouse exclusion"
        object trustee "duties, co-trustees"
        string[] assetIds FK "Asset IDs"
        string createdInContext
        Date createdAt
        Date updatedAt
    }
    
    Business {
        string id PK
        string name
        string businessType
        string registrationNumber
        number ownershipPercentage
        number estimatedValue
        string description
        AddressData address
        Date createdAt
        Date updatedAt
    }
    
    BeneficiaryGroup {
        string id PK
        string name
        string description
        boolean isPredefined
        boolean isActive
        string[] memberIds FK "Person IDs"
        string willId FK "Person.id"
        Date createdAt
        Date updatedAt
    }
    
    RelationshipEdge {
        string id PK
        string aId FK "Person.id"
        string bId FK "Person.id"
        RelationshipType type
        PartnershipPhase phase
        object qualifiers
        Date startedAt
        Date endedAt
        object metadata
        Date createdAt
        Date updatedAt
    }
    
    EstateRemainderState {
        string[] selectedPeopleIds FK "Person IDs"
        string[] selectedGroupIds FK "BeneficiaryGroup IDs"
        object splits "percentage allocations"
        object lockedCards "lock status"
        Date lastUpdated
    }
    
    PropertyAsset {
        string id PK
        string type "property"
        string title
        AddressData address
        string propertyType
        string ownershipType
        number ownershipPercentage
        boolean primaryResidence
        boolean hasLivedThere
        boolean hasMortgage
        object mortgage
        object beneficiaryAssignments
        string trustId FK "Trust.id"
        number estimatedValue
        number netValue
        Date createdAt
        Date updatedAt
    }
    
    ImportantItemAsset {
        string id PK
        string type "important-items"
        string title
        string category
        string specificDetails
        boolean sentimentalValue
        object beneficiaryAssignments
        number estimatedValue
        Date createdAt
        Date updatedAt
    }
    
    InvestmentAsset {
        string id PK
        string type "investment"
        string title
        string investmentType
        string provider
        string accountNumber
        number estimatedValue
        Date createdAt
        Date updatedAt
    }
    
    PensionAsset {
        string id PK
        string type "pensions"
        string title
        string provider
        string policyNumber
        string linkedEmployer
        string pensionType
        number monthlyContribution
        number employerContribution
        string pensionOwner
        string customOwner
        string beneficiaryNominated
        number estimatedValue
        Date createdAt
        Date updatedAt
    }
    
    LifeInsuranceAsset {
        string id PK
        string type "life-insurance"
        string title
        string policyType
        string provider
        string policyNumber
        string lifeAssured
        number sumInsured
        number monthlyPremium
        string beneficiaryKnown
        string premiumStatus
        object[] beneficiaries
        number estimatedValue
        Date createdAt
        Date updatedAt
    }
    
    BankAccountAsset {
        string id PK
        string type "bank-accounts"
        string title
        string accountType
        string provider
        string accountNumber
        string sortCode
        string ownershipType
        boolean isNonUkBank
        number estimatedValue
        Date createdAt
        Date updatedAt
    }
    
    PrivateCompanySharesAsset {
        string id PK
        string type "private-company-shares"
        string title
        string companyName
        number numberOfShares
        string shareClass
        number totalValue
        number costBasis
        boolean isActivelyTrading
        boolean heldForTwoPlusYears
        boolean doesNotDealInRestrictedAssets
        boolean isNotHoldingCompany
        Date createdAt
        Date updatedAt
    }
    
    AssetsHeldThroughBusinessAsset {
        string id PK
        string type "assets-held-through-business"
        string title
        string businessId FK "Business.id"
        string businessName
        string businessType
        string assetType
        string assetDescription
        number businessOwnershipPercentage
        number numberOfUnits
        boolean excludeFromBusinessValuation
        number estimatedValue
        Date createdAt
        Date updatedAt
    }
    
    AgriculturalAsset {
        string id PK
        string type "agricultural-assets"
        string title
        string assetType
        string assetDescription
        string location
        string ownershipStructure
        string customOwnershipStructure
        string sizeQuantity
        number yearsOwned
        string activeAgriculturalUse
        string hasDebtsEncumbrances
        number debtAmount
        string debtDescription
        string farmWorkerOccupied
        string woodlandPurpose
        string studFarmActivity
        string otherAssetTypeDetail
        string aprOwnershipDuration
        string aprOwnershipStructure
        string aprTrustType
        string bprActiveTrading
        string bprOwnershipDuration
        string notes
        number estimatedValue
        Date createdAt
        Date updatedAt
    }
    
    CryptoCurrencyAsset {
        string id PK
        string type "crypto-currency"
        string title
        string cryptoType
        string platform
        number quantity
        number estimatedValue
        Date createdAt
        Date updatedAt
    }
    
    BequeathalData {
        Asset[] property
        Asset[] important-items
        Asset[] investment
        Asset[] pensions
        Asset[] life-insurance
        Asset[] bank-accounts
        Asset[] private-company-shares
        Asset[] assets-held-through-business
        Asset[] debts-credit
        Asset[] agricultural-assets
        Asset[] crypto-currency
        Asset[] other
        Set selectedCategories
        number totalEstimatedValue
        number totalNetValue
        Date lastUpdated
    }
    
    GuardianHierarchy {
        object[] guardians "Person ID and level"
    }
    
    AlignmentInfo {
        string alignedUser FK "Person.id"
        AlignmentStatus status
    }
    
    TrustBeneficiary {
        string id FK "Person.id or BeneficiaryGroup.id"
        string type
        number percentage
        boolean isManuallyEdited
    }
```

---

## Entity Details

### 1. Person Entity

**Primary Entity** for all individuals in the system.

**Key Features:**
- Multi-role support (can be will-maker, executor, beneficiary, guardian simultaneously)
- Referenced by nearly every other entity
- Stores contact info, demographics, care status
- Links to guardians via `guardianIds[]`

**Relationships:**
- `1:1` with WillData (as will-maker via `WillData.userId`)
- `1:N` with WillData (as executor via `WillData.executors[]`)
- `1:N` with WillData (as guardian via `WillData.guardianship`)
- `M:N` with Person (via RelationshipEdge)
- `1:N` with BeneficiaryGroup (as member via `BeneficiaryGroup.memberIds[]`)
- `1:N` with Trust (as trustee via `Trust.settlor.trusteeIds[]`)
- `1:N` with Trust (as beneficiary via `Trust.settlor.beneficiaries[]`)
- `1:N` with EstateRemainderState (via `selectedPeopleIds[]`)

**Storage Key:** `kindling-person-data`

---

### 2. WillData Entity

**Central document** linking will-maker to executors and guardianship configuration.

**Key Features:**
- Single will per will-maker (userId)
- Executor hierarchy (levels 1-4)
- Guardianship configuration per child
- Spouse alignment tracking

**Relationships:**
- `N:1` with Person (userId → will-maker)
- `1:N` with Person (executors[] → Person IDs)
- `1:N` with Person (guardianship object → guardian Person IDs per child)

**Storage Key:** `kindling-will-data`

---

### 3. Trust Entity

**Normalized trust structure** replacing inline trust fields.

**Key Features:**
- Single source of truth for trust data
- Multi-role support (settlor, beneficiary, trustee)
- Links to multiple assets via `assetIds[]`
- Conditional data objects (settlor, beneficiary, trustee)

**Relationships:**
- `1:N` with Assets (assetIds[] → Asset IDs)
- `N:1` with PropertyAsset (PropertyAsset.trustId → Trust.id)
- `1:N` with Person (settlor.trusteeIds[] → Person IDs)
- `1:N` with TrustBeneficiary (settlor.beneficiaries[] → Person/Group IDs)

**Storage Key:** `kindling-trusts`

**New Field:** `beneficiary.spouseExcludedFromBenefit` (settlor+beneficiary roles only)

---

### 4. Business Entity

**Company/organization structure** for business asset linkage.

**Key Features:**
- References by AssetsHeldThroughBusinessAsset
- Stores ownership percentage, valuation
- Optional registration details

**Relationships:**
- `1:N` with AssetsHeldThroughBusinessAsset (via `businessId`)

**Storage Key:** `kindling-business-data`

---

### 5. BeneficiaryGroup Entity

**Grouping mechanism** for estate remainder allocation.

**Key Features:**
- Predefined templates (Children, Siblings) or custom user-created
- Soft deletion via `isActive` flag
- Links to Person entities via `memberIds[]`

**Relationships:**
- `1:N` with Person (memberIds[] → Person IDs)
- `N:1` with Person (willId → will-maker Person ID)
- `1:N` with EstateRemainderState (via `selectedGroupIds[]`)

**Storage Key:** `kindling-beneficiary-groups`

---

### 6. RelationshipEdge Entity

**Normalized relationship graph** between people.

**Key Features:**
- Single edge per relationship (no duplicates)
- Symmetric (spouse, partner, sibling) or directed (parent-of)
- Optional qualifiers (biological, adoptive, step)
- Partnership phases (active, separated, divorced, widowed)

**Relationships:**
- `N:1` with Person (aId → Person.id)
- `N:1` with Person (bId → Person.id)

**Storage Key:** `kindling-relationships`

**Graph Structure:**
```mermaid
graph LR
    PersonA["Person A"]
    PersonB["Person B"]
    Edge["RelationshipEdge<br/>type, qualifiers, phase"]
    
    PersonA -->|"aId"| Edge
    PersonB -->|"bId"| Edge
    Edge -->|"resolves bidirectionally"| PersonA
    Edge -->|"resolves bidirectionally"| PersonB
```

---

### 7. EstateRemainderState Entity

**Residual estate allocation** after specific gifts.

**Key Features:**
- References Person and BeneficiaryGroup entities
- Percentage splits with lock states
- Slider-based allocation UI

**Relationships:**
- `1:N` with Person (selectedPeopleIds[] → Person IDs)
- `1:N` with BeneficiaryGroup (selectedGroupIds[] → BeneficiaryGroup IDs)

**Storage Key:** `kindling-estate-remainder`

---

### 8. Asset Entities (10 Types)

All assets extend `BaseAsset` and are stored in `BequeathalData` by category.

#### 8.1 PropertyAsset

**Real estate holdings.**

**Key Features:**
- Address, ownership type, mortgage
- Primary residence tracking
- Beneficiary assignments
- **NEW:** Foreign key to Trust entity (`trustId`)

**Relationships:**
- `N:1` with Trust (trustId → Trust.id)
- `1:N` with Person (beneficiaryAssignments → Person/Group IDs)

**Trust Flow:**
```mermaid
graph LR
    PropertyAsset["PropertyAsset<br/>trustId: string"]
    Trust["Trust Entity<br/>name, type, roles"]
    
    PropertyAsset -->|"references"| Trust
    Trust -->|"assetIds[] contains"| PropertyAsset
```

#### 8.2 ImportantItemAsset

**Jewelry, artwork, collectibles.**

**Key Features:**
- Sentimental value tracking
- Multi-beneficiary support

**Relationships:**
- `1:N` with Person (beneficiaryAssignments → Person/Group IDs)

#### 8.3 InvestmentAsset

**Stocks, bonds, ISAs.**

**Key Features:**
- Provider, account number
- Investment type categorization

**Relationships:**
- Can be held in Trust (Trust.assetIds[])

#### 8.4 PensionAsset

**Workplace and personal pensions.**

**Key Features:**
- Employer linkage
- Contribution tracking
- Beneficiary nomination status

#### 8.5 LifeInsuranceAsset

**Life insurance policies.**

**Key Features:**
- Policy details, premiums
- Beneficiary allocations (inline array)
- Sum insured tracking

#### 8.6 BankAccountAsset

**Current accounts, savings, ISAs.**

**Key Features:**
- Account details (number, sort code)
- Joint ownership support
- Non-UK bank flag

#### 8.7 PrivateCompanySharesAsset

**Shareholdings in private companies.**

**Key Features:**
- BPR (Business Property Relief) eligibility tracking
- Share class, cost basis
- Active trading status

#### 8.8 AssetsHeldThroughBusinessAsset

**Assets owned by businesses.**

**Key Features:**
- Links to Business entity
- Business ownership percentage
- Valuation exclusion flag

**Relationships:**
- `N:1` with Business (businessId → Business.id)

#### 8.9 AgriculturalAsset

**Farms, land, agricultural equipment.**

**Key Features:**
- APR (Agricultural Property Relief) tracking
- Ownership structure, acreage
- Active use status

#### 8.10 CryptoCurrencyAsset

**Digital currencies and tokens.**

**Key Features:**
- Platform, quantity
- Crypto type

---

### 9. BequeathalData Entity

**Container organizing all assets by category.**

**Key Features:**
- Assets grouped by type (property, investments, etc.)
- Category selection tracking
- Aggregate value calculations

**Relationships:**
- `1:N` with all Asset types (contains arrays)

**Storage Key:** `kindling-bequeathal-data`

---

### 10. IHTDrawerState Entity

**UI state** for tax calculator drawer.

**Key Features:**
- Drawer open/close state
- Death timing scenarios
- Death order (user-first vs spouse-first)

**Storage Key:** (stored in component state, not persisted)

---

## Relationship Patterns

### Foreign Key References

**Pattern 1: Simple Foreign Key**
```typescript
// PropertyAsset → Trust
PropertyAsset.trustId → Trust.id

// AssetsHeldThroughBusinessAsset → Business
AssetsHeldThroughBusinessAsset.businessId → Business.id

// WillData → Person (will-maker)
WillData.userId → Person.id
```

**Pattern 2: Array of IDs**
```typescript
// Trust → Assets (bidirectional)
Trust.assetIds[] → Asset.id[]
PropertyAsset.trustId → Trust.id

// Trust → Person (trustees)
Trust.settlor.trusteeIds[] → Person.id[]

// BeneficiaryGroup → Person (members)
BeneficiaryGroup.memberIds[] → Person.id[]

// EstateRemainderState → Person & Groups
EstateRemainderState.selectedPeopleIds[] → Person.id[]
EstateRemainderState.selectedGroupIds[] → BeneficiaryGroup.id[]
```

**Pattern 3: Complex Objects with References**
```typescript
// WillData executors
WillData.executors: Array<{
  executor: string; // Person.id
  level: number;
}>

// WillData guardianship
WillData.guardianship: {
  [childId: string]: Array<{
    guardian: string; // Person.id
    level: number;
  }>;
}

// Trust beneficiaries
Trust.settlor.beneficiaries: TrustBeneficiary[] // references Person or BeneficiaryGroup
```

### Inline vs Normalized

**Inline Data (No Entity):**
- `AddressData` - embedded in Person, Property, Business
- `beneficiaryAssignments` - embedded in some assets
- `mortgage` - embedded in PropertyAsset

**Normalized Entities (Referenced):**
- Trust - normalized (was inline, now entity)
- Person - normalized (never inline)
- Business - normalized (referenced by assets)
- BeneficiaryGroup - normalized (referenced by estate remainder)

---

## Data Flow Examples

### Example 1: Property with Trust

```mermaid
sequenceDiagram
    participant User
    participant PropertyEntry
    participant TrustDetails
    participant trustActions
    participant bequeathalActions
    participant AsyncStorage
    
    User->>PropertyEntry: Enter property details
    PropertyEntry->>bequeathalActions: Save PropertyAsset (no trust data)
    PropertyEntry->>TrustDetails: Navigate with propertyId
    User->>TrustDetails: Enter trust details + spouse exclusion
    TrustDetails->>trustActions: addTrust(trustData)
    trustActions->>AsyncStorage: Save Trust entity
    TrustDetails->>bequeathalActions: Update PropertyAsset.trustId
    bequeathalActions->>AsyncStorage: Update PropertyAsset
```

### Example 2: Loading Trust for Edit

```mermaid
sequenceDiagram
    participant User
    participant PropertySummary
    participant TrustDetails
    participant trustActions
    participant bequeathalActions
    participant AsyncStorage
    
    User->>PropertySummary: Edit property
    PropertySummary->>TrustDetails: Navigate with propertyId + trustId
    TrustDetails->>AsyncStorage: Load from AsyncStorage
    AsyncStorage->>trustActions: Return Trust[]
    TrustDetails->>trustActions: getTrustById(trustId)
    trustActions->>TrustDetails: Return Trust entity
    TrustDetails->>TrustDetails: Map Trust → form state
    TrustDetails->>User: Display populated form
```

### Example 3: Estate Remainder Allocation

```mermaid
graph TD
    EstateRemainderState["EstateRemainderState"]
    Person1["Person<br/>Alice (child)"]
    Person2["Person<br/>Bob (child)"]
    Group["BeneficiaryGroup<br/>Godchildren"]
    Person3["Person<br/>Carol (member)"]
    Person4["Person<br/>Dave (member)"]
    
    EstateRemainderState -->|"selectedPeopleIds[]"| Person1
    EstateRemainderState -->|"selectedPeopleIds[]"| Person2
    EstateRemainderState -->|"selectedGroupIds[]"| Group
    Group -->|"memberIds[]"| Person3
    Group -->|"memberIds[]"| Person4
    
    EstateRemainderState -->|"splits: person-alice: 40%"| Person1
    EstateRemainderState -->|"splits: person-bob: 30%"| Person2
    EstateRemainderState -->|"splits: group-god: 30%"| Group
```

---

## Cardinality Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| Person ↔ Person | M:N | Via RelationshipEdge (symmetric/directed) |
| Person ← WillData | 1:1 | Will-maker (userId) |
| Person ← WillData | 1:N | Executors (executors[]) |
| Person ← WillData | 1:N | Guardians (guardianship object) |
| Person ← Trust | 1:N | Trustees (settlor.trusteeIds[]) |
| Person ← Trust | 1:N | Beneficiaries (settlor.beneficiaries[]) |
| Person ← BeneficiaryGroup | 1:N | Members (memberIds[]) |
| Person ← EstateRemainderState | 1:N | Selected (selectedPeopleIds[]) |
| Trust ↔ PropertyAsset | 1:N / N:1 | Bidirectional (trustId / assetIds[]) |
| Business ← AssetsHeldThroughBusinessAsset | 1:N | Business assets (businessId) |
| BeneficiaryGroup ← EstateRemainderState | 1:N | Selected groups (selectedGroupIds[]) |
| BequeathalData ← Assets | 1:N | Contains all assets by category |

---

## Storage Keys (AsyncStorage)

All entities persisted to AsyncStorage with these keys:

```typescript
const STORAGE_KEYS = {
  WILL_DATA: 'kindling-will-data',              // WillData
  PERSON_DATA: 'kindling-person-data',          // Person[]
  BUSINESS_DATA: 'kindling-business-data',      // Business[]
  BEQUEATHAL_DATA: 'kindling-bequeathal-data',  // BequeathalData
  TRUST_DATA: 'kindling-trusts',                // Trust[]
  BENEFICIARY_GROUP_DATA: 'kindling-beneficiary-groups', // BeneficiaryGroup[]
  ESTATE_REMAINDER_DATA: 'kindling-estate-remainder',    // EstateRemainderState
  RELATIONSHIP_DATA: 'kindling-relationships',  // RelationshipEdge[]
};
```

---

## Migration Notes

### Recent Changes (January 12, 2026)

**Trust Entity Migration:**
- PropertyAsset now uses `trustId` foreign key (was inline `trustName`, `trustType`, `trustRole`)
- All trust data stored in Trust entity (single source of truth)
- Automatic migration in `useAppState.ts` converts inline fields to Trust entities
- trust-details.tsx now uses `trustActions` (not local useState)

**Spouse Exclusion Field:**
- Added `Trust.beneficiary.spouseExcludedFromBenefit`
- Only populated when `isUserSettlor && isUserBeneficiary` (settlor-interested trusts)
- Required field for Bare Trust and Discretionary Trust settlor+beneficiary roles

---

## Data Integrity Rules

### 1. Person as Central Hub
- Person entity is never duplicated
- All references use Person.id
- Names looked up from Person record (no caching)

### 2. Trust Normalization
- One Trust entity per trust structure
- Multiple assets can reference same Trust (trustId)
- Trust.assetIds[] maintains bidirectional reference

### 3. Beneficiary Assignments
- Can reference Person, BeneficiaryGroup, or 'estate'
- Percentage or amount allocations
- No caching of names (looked up from Person/Group)

### 4. Relationship Graph
- Single edge per relationship (no duplicates)
- Symmetric types resolve bidirectionally
- Uniqueness key: `[aId, bId].sort() + type` (symmetric) or `aId + bId + type` (directed)

### 5. Soft Deletion
- BeneficiaryGroup uses `isActive` flag
- Preserves group definition for future use
- No actual deletion of data

---

## Query Patterns

### Get All Properties in a Trust

```typescript
const trust = trustActions.getTrustById(trustId);
const properties = trust.assetIds.map(id => 
  bequeathalActions.getAssetById(id)
).filter(asset => asset?.type === 'property');
```

### Get All Trusts Holding a Property

```typescript
const property = bequeathalActions.getAssetById(propertyId) as PropertyAsset;
const trust = property.trustId 
  ? trustActions.getTrustById(property.trustId) 
  : undefined;
```

### Get All Assets for a Person

```typescript
const allAssets = bequeathalActions.getAllAssets();
const personAssets = allAssets.filter(asset => 
  asset.beneficiaryAssignments?.beneficiaries.some(b => b.id === personId)
);
```

### Get All Children of Will-Maker

```typescript
const willMaker = willActions.getUser();
const children = willMaker 
  ? relationshipActions.getChildren(willMaker.id)
  : [];
```

### Get Trust Beneficiaries (Expanded)

```typescript
const trust = trustActions.getTrustById(trustId);
const beneficiaries = trust.settlor?.beneficiaries.map(b => {
  if (b.type === 'person' || b.type === 'myself') {
    const person = personActions.getPersonById(b.id);
    return { ...b, name: person?.firstName + ' ' + person?.lastName };
  } else if (b.type === 'group') {
    const group = beneficiaryGroupActions.getGroupById(b.id);
    return { ...b, name: group?.name };
  }
});
```

---

## First Principles Review

### Single Source of Truth
- ✅ Person entity (never duplicated)
- ✅ Trust entity (was inline, now normalized)
- ✅ Business entity (referenced, not embedded)
- ✅ BeneficiaryGroup entity (lazy creation, soft delete)

### No Data Duplication
- ✅ Names looked up from Person/Group (not cached)
- ✅ Trust data in Trust entity (not inline in PropertyAsset)
- ✅ Relationships in RelationshipEdge (not in Person)

### Proper Normalization
- ✅ Foreign keys (trustId, businessId, userId)
- ✅ Junction entities (RelationshipEdge for M:N)
- ✅ Bidirectional references (Trust.assetIds ↔ PropertyAsset.trustId)

### Entity Storage Pattern
- ✅ All persistent data uses entity storage (trustActions, personActions, etc.)
- ✅ Form state (useState) only for ephemeral UI data
- ✅ AsyncStorage via useAppState hook (Rule 4)

---

## Future Considerations

### Potential Entities
- **TrustDeed** - Separate entity for trust deed documents
- **LegalDocument** - Will documents, trust deeds, POAs
- **Appointment** - Meetings, deadlines, milestones
- **Note** - Comments, annotations on assets/people

### Potential Relationships
- **Person → LegalDocument** (signatory)
- **Trust → LegalDocument** (trust deed)
- **Asset → LegalDocument** (supporting docs)

### Backend Sync
- All entities map 1:1 to Rails API tables
- AsyncStorage keys match API endpoints
- Offline-first with sync queue
- Conflict resolution strategy needed

---

## ERD Legend

**Entity Types:**
- **Core Entities** - Person, WillData, Trust, Business
- **Organizational Entities** - BeneficiaryGroup, EstateRemainderState
- **Asset Entities** - 10 types extending BaseAsset
- **Relationship Entities** - RelationshipEdge (M:N junction)
- **UI State Entities** - IHTDrawerState (ephemeral)

**Relationship Notation:**
- `1:1` - One-to-one
- `1:N` - One-to-many
- `M:N` - Many-to-many
- `FK` - Foreign key
- `PK` - Primary key

**Reference Patterns:**
- `string` - Single ID reference
- `string[]` - Array of IDs
- `object` - Embedded data (not entity)
- `object[]` - Array of embedded data

---

## Validation & Constraints

### Required Fields
- All entities require: `id`, `createdAt`, `updatedAt`
- Person requires: `firstName`, `lastName`, `email`
- WillData requires: `userId`, `willType`, `status`
- Trust requires: `name`, `type`, at least one role flag
- PropertyAsset with trust requires: `trustId`

### Conditional Requirements
- `Trust.settlor` - required when `isUserSettlor = true`
- `Trust.beneficiary` - required when `isUserBeneficiary = true`
- `Trust.beneficiary.spouseExcludedFromBenefit` - required when settlor+beneficiary roles
- `PropertyAsset.mortgage` - required when `hasMortgage = true`

### Uniqueness Constraints
- Person: email (unique)
- BeneficiaryGroup: name + willId (unique per will-maker)
- Trust: name (should be unique, not enforced)
- RelationshipEdge: uniqueness key (aId, bId, type)

---

## Architecture Principles (Elon Review)

### Simplification
- ✅ Minimal entities (10 core, not 50)
- ✅ Flat structures where possible
- ✅ No unnecessary abstraction layers

### Normalization
- ✅ Trust entity (not inline duplication)
- ✅ Person entity (single source)
- ✅ RelationshipEdge (M:N normalized)

### First Principles
- ✅ Entity storage for all persistent data
- ✅ Foreign keys for relationships
- ✅ Bidirectional references where needed
- ✅ Single source of truth

### Data Integrity
- ✅ Type safety (TypeScript interfaces)
- ✅ Validation in entity actions
- ✅ Migration for breaking changes
- ✅ Backward compatibility

---

**Document Status:** Current as of January 12, 2026  
**Next Review:** When new entities added or relationships change
