# Kindling Native App — Data Model ERD

```mermaid
erDiagram

    %% =====================================================================
    %% CORE DOMAIN ENTITIES
    %% =====================================================================

    Person {
        string id PK
        string serverId "optional server-side ID"
        string firstName
        string lastName
        string email
        string phone
        PersonRelationshipType relationship "deprecated - use RelationshipEdge"
        PersonRole[] roles "will-maker | executor | beneficiary | witness | guardian | co-guardian | family-member | dependent"
        string dateOfBirth
        boolean isDraft
        boolean isDependent
        boolean isUnder18
        boolean inCare
        CareCategory careCategory "child-under-18 | adult-lacks-capacity | adult-full-capacity | special-circumstances"
        string[] guardianIds "FK to Person[]"
        string capacityStatus "legacy"
        string customRelationship
        ExecutorRole executorRole "primary | secondary | tertiary | quaternary | co-primary | co-secondary | co-tertiary"
        string executorStatus "pending | accepted | declined"
        Date invitedAt
        Date respondedAt
        boolean createdInOnboarding
        Date createdAt
        Date updatedAt
    }

    AddressData {
        string address1
        string address2
        string city
        string county
        string postcode
        string country
    }

    WillData {
        string id PK
        string userId FK "FK to Person (will-maker)"
        number version
        string willType "simple | complex"
        string status "draft | active | superseded"
        string supersededBy "FK to WillData"
        string supersedes "FK to WillData"
        string[] bequestIds "FK to Bequest[]"
        Date finalizedAt
        Date createdAt
        Date updatedAt
    }

    Bequest {
        string id PK
        string willId FK "FK to WillData"
        string assetId FK "FK to Asset"
        AssetType assetType "discriminator"
        string specificInstructions
        Date createdAt
        Date updatedAt
    }

    BeneficiaryGroup {
        string id PK
        string name
        string description
        boolean isPredefined
        boolean isActive "soft delete flag"
        string[] memberIds "FK to Person[]"
        string willId "FK to Person (will-maker)"
        Date createdAt
        Date updatedAt
    }

    EstateRemainderState {
        string userId FK "FK to Person (will-maker)"
        string[] selectedPeopleIds "FK to Person[]"
        string[] selectedGroupIds "FK to BeneficiaryGroup[]"
        Record splits "keyed by person-id or group-id"
        Record lockedCards "lock status per split"
        Date lastUpdated
    }

    RelationshipEdge {
        string id PK
        string aId FK "FK to Person"
        string bId FK "FK to Person"
        RelationshipType type "spouse | partner | parent-of | sibling-of | aunt-uncle-of | cousin-of | guardian-of | friend | other-tie"
        PartnershipPhase phase "active | separated | divorced | widowed"
        Record qualifiers "e.g. biological, adoptive, step, half"
        Date startedAt
        Date endedAt
        Record metadata
        Date createdAt
        Date updatedAt
    }

    Trust {
        string id PK
        string userId FK "FK to Person (will-maker)"
        string name
        TrustType type "bare_trust | life_interest_trust | discretionary_trust | settlor_interested_trust | interest_in_possession_trust | other_trust"
        string creationMonth
        string creationYear
        Date creationDate
        TrustRole userRole "settlor | beneficiary | settlor_and_beneficiary | settlor_and_beneficial_interest | life_interest | remainderman"
        boolean chainedTrustStructure
        string preFinanceAct2006 "before_2006 | on_or_after_2006"
        string[] assetIds "FK to Asset[]"
        string createdInContext "property | investments | other"
        Date createdAt
        Date updatedAt
    }

    TrustSettlorData {
        string reservedBenefit "none | yes"
        string benefitDescription
        string[] trusteeIds "FK to Person[] or myself"
        boolean discretionaryComplexSituation
    }

    TrustBeneficiary {
        string id FK "FK to Person or group or myself"
        string type "person | group | myself"
        number percentage
        boolean isManuallyEdited
    }

    TrustBeneficiaryData {
        string entitlementType "right_to_income | right_to_use | both | other"
        string isIPDI "yes | no | not-sure"
        boolean rightOfOccupation
        string benefitDescription
        string isSettlorOfThisTrust "yes | no"
        string spouseExcludedFromBenefit "yes | no | not_sure"
        string discretionaryInsurancePolicy "yes | no | unsure"
    }

    Business {
        string id PK
        string userId FK "FK to Person (will-maker)"
        string name
        string businessType
        string registrationNumber
        number estimatedValue
        string description
        Date createdAt
        Date updatedAt
    }

    %% =====================================================================
    %% ASSET HIERARCHY (BaseAsset + discriminated union subtypes)
    %% =====================================================================

    BaseAsset {
        string id PK
        string userId FK "FK to Person (will-maker)"
        AssetType type "discriminator"
        string title
        string description
        number estimatedValue
        boolean estimatedValueUnknown
        number netValue
        HeldInTrust heldInTrust "yes | no | not-sure"
        string beneficiaryId "deprecated FK to Person"
        string createdAt
        string updatedAt
    }

    BeneficiaryAssignment {
        string id FK "FK to Person or BeneficiaryGroup or estate"
        string type "person | group | estate"
        string name
        number percentage
        number amount
        boolean isManuallyEdited
    }

    PropertyAsset {
        string type "property"
        string usage
        string propertyType "residential | commercial | land | other"
        string ownershipType "sole | joint-tenants | tenants-in-common"
        number ownershipPercentage
        boolean primaryResidence
        boolean hasLivedThere
        string acquisitionMonth
        string acquisitionYear
        boolean hasMortgage
        string trustId FK "FK to Trust"
        string businessId FK "FK to Business"
        boolean occupiedByOwner
    }

    ImportantItemAsset {
        string type "important-items"
        string category
        string specificDetails
        boolean sentimentalValue
    }

    InvestmentAsset {
        string type "investment"
        string investmentType
        string provider
        string accountNumber
    }

    PensionAsset {
        string type "pensions"
        string provider
        string policyNumber
        string linkedEmployer
        string pensionType
        number monthlyContribution
        number employerContribution
        string pensionOwner "me | spouse | child | other"
        string beneficiaryNominated "yes | no | not-sure"
    }

    LifeInsuranceAsset {
        string type "life-insurance"
        string policyType
        string provider
        string policyNumber
        string lifeAssured
        number sumInsured
        number monthlyPremium
        string beneficiaryKnown "yes | no | partial"
        string premiumStatus "active | paid-up | lapsed | suspended"
    }

    BankAccountAsset {
        string type "bank-accounts"
        string accountType
        string provider
        string accountNumber
        string sortCode
        string ownershipType "personal | joint"
        boolean isNonUkBank
    }

    PrivateCompanySharesAsset {
        string type "private-company-shares"
        string companyName
        string businessId FK "FK to Business"
        number numberOfShares
        number percentageOwnership
        string shareClass
        string companyArticlesConfident "standard | customized | not_sure"
        boolean isActivelyTrading
        boolean heldForTwoPlusYears
    }

    AssetsHeldThroughBusinessAsset {
        string type "assets-held-through-business"
        string businessId FK "FK to Business"
        string businessName
        string businessType
        string assetType
        number businessOwnershipPercentage
        number numberOfUnits
        boolean excludeFromBusinessValuation
    }

    AgriculturalAsset {
        string type "agricultural-assets"
        string assetType "agricultural-land | farm-buildings | farmhouse | etc"
        string location
        string ownershipStructure "individual | partnership | limited-company | trust | other"
        string sizeQuantity
        number yearsOwned
        string activeAgriculturalUse "yes | no | partial"
        string aprOwnershipDuration
        string bprOwnershipDuration
    }

    CryptoCurrencyAsset {
        string type "crypto-currency"
        string cryptoType
        string platform
        number quantity
    }

    %% =====================================================================
    %% AUTH & API TYPES
    %% =====================================================================

    AuthUser {
        number id PK
        string first_name
        string last_name
        string email
        string phone
    }

    LoginRequest {
        string email
        string password
        string device_id
        string device_name
    }

    LoginResponse {
        string access_token
        string access_expires_at
        string refresh_token
        string refresh_expires_at
    }

    RegisterRequest {
        string email
        string password
        string first_name
        string last_name
        string phone
        string device_id
        string device_name
    }

    RegisterResponse {
        number user_id
        string access_token
        string access_expires_at
        string refresh_token
        string refresh_expires_at
    }

    SessionValidationResponse {
        boolean valid
        number user_id
        string access_expires_at
    }

    RefreshSessionResponse {
        string access_token
        string access_expires_at
        string refresh_token
        string refresh_expires_at
    }

    ApiErrorPayload {
        string error
        string code
        number status
        string request_id
        Record details
    }

    %% =====================================================================
    %% SERVICE / INFRASTRUCTURE TYPES
    %% =====================================================================

    QueuedMutation {
        string id PK
        string type "create | update | delete"
        string entity "person | asset | will | trust | business | relationship | beneficiary-group | estate-remainder"
        any data
        Date timestamp
    }

    AttributionData {
        string source
        string campaign
        string location_id
        number show_video
        number show_risk_questionnaire
        string first_show "video | risk_questionnaire"
        string captured_at
        boolean is_organic
        string raw_url
    }

    OnboardingState {
        boolean video_completed
        number video_version
        boolean questionnaire_completed
        number questionnaire_version
    }

    NetworkState {
        boolean isConnected
        boolean isInternetReachable
        string type
        number lastCheckedAt
    }

    %% =====================================================================
    %% UI STATE / QUIZ TYPES
    %% =====================================================================

    QuizAnswers {
        boolean lifeExpectancy
        boolean lifeExpectancyShort
        number retirementAge
        boolean isAlreadyRetired
        boolean hasExcessCapital
        boolean incomeCoversLifestyle
        boolean needsAssetProtection
    }

    IHTDrawerState {
        boolean isOpen
        number currentViewIndex
        string deathTiming "now | in-2-years | in-7-years"
        string deathOrder "user-first | spouse-first"
        Date lastUpdated
    }

    BequeathalData {
        number totalEstimatedValue
        number totalNetValue
        boolean hasStartedEntry
        Record categoryStatus "Record of completedAt per category"
        Date lastUpdated
    }

    AlignmentInfo {
        string alignedUser FK "FK to Person (spouse)"
        AlignmentStatus status "accepted | pending | declined"
    }

    %% =====================================================================
    %% DEPRECATED TYPES (kept for backward compatibility)
    %% =====================================================================

    UserData_DEPRECATED {
        string id PK
        string fullName
        string dateOfBirth
        string email
        string phone
        Date createdAt
        Date updatedAt
    }

    Executor_DEPRECATED {
        string id PK
        string personId FK "FK to Person"
        boolean isPrimary
        boolean hasAccepted
        boolean invitationSent
        string invitationDate
    }

    ExecutorData_DEPRECATED {
        string executorType "personal | professional"
        boolean invitationsSent
        Date lastUpdated
    }

    GuardianHierarchy {
        string guardian FK "FK to Person"
        number level "1 2 3 4"
    }

    %% =====================================================================
    %% COMPUTED VIEW TYPES (derived, not stored)
    %% =====================================================================

    AssetSummary {
        number totalAssets
        number totalEstimatedValue
        number totalNetValue
        number completedAssets
        number draftAssets
        Record assetsByType "count, totalValue, totalNetValue, completed per AssetType"
    }

    WillProgressState {
        Person willMaker
        Person[] people
        WillData willData
        EstateRemainderState estateRemainderState
        BequeathalData bequeathalData
    }

    SummaryCTA {
        string label
        string route
        boolean isForward
    }

    CategoryMeta {
        string id
        string label
        string icon
        string description
    }

    DisplayField {
        string label
        string value
    }

    ValidationField {
        string key
        string label
        boolean isValid
        boolean scrollToEnd
    }

    BeneficiarySelection {
        string id FK "FK to Person or group"
        string type "person | group | estate"
        string name
        string relationship
    }

    ValidateEmailResponse {
        boolean available
    }

    %% =====================================================================
    %% RELATIONSHIPS
    %% =====================================================================

    %% --- Person relationships ---
    Person ||--o| AddressData : "has address"
    Person ||--o{ RelationshipEdge : "participates in (as aId or bId)"
    Person }o--o{ Person : "guardianIds references"

    %% --- Will relationships ---
    WillData }o--|| Person : "userId (will-maker)"
    WillData ||--o{ Bequest : "bequestIds"
    WillData ||--o{ AlignmentInfo : "alignment per child"
    WillData o|--o| WillData : "supersedes / supersededBy"

    %% --- Will executor/guardian references ---
    WillData }o--o{ Person : "executors[].executor"
    WillData }o--o{ Person : "guardianship[][].guardian"

    %% --- Bequest relationships ---
    Bequest }o--|| BaseAsset : "assetId"
    Bequest }o--o{ Person : "beneficiaries[].id (person)"
    Bequest }o--o{ BeneficiaryGroup : "beneficiaries[].id (group)"

    %% --- Asset hierarchy ---
    PropertyAsset ||--|| BaseAsset : "extends"
    ImportantItemAsset ||--|| BaseAsset : "extends"
    InvestmentAsset ||--|| BaseAsset : "extends"
    PensionAsset ||--|| BaseAsset : "extends"
    LifeInsuranceAsset ||--|| BaseAsset : "extends"
    BankAccountAsset ||--|| BaseAsset : "extends"
    PrivateCompanySharesAsset ||--|| BaseAsset : "extends"
    AssetsHeldThroughBusinessAsset ||--|| BaseAsset : "extends"
    AgriculturalAsset ||--|| BaseAsset : "extends"
    CryptoCurrencyAsset ||--|| BaseAsset : "extends"

    BaseAsset }o--|| Person : "userId (owner)"
    BaseAsset ||--o{ BeneficiaryAssignment : "beneficiaryAssignments (deprecated)"

    %% --- Property-specific references ---
    PropertyAsset }o--o| Trust : "trustId"
    PropertyAsset }o--o| Business : "businessId"
    PropertyAsset ||--o| AddressData : "address"

    %% --- Business-linked assets ---
    PrivateCompanySharesAsset }o--o| Business : "businessId"
    AssetsHeldThroughBusinessAsset }o--|| Business : "businessId"

    %% --- Trust relationships ---
    Trust }o--|| Person : "userId (owner)"
    Trust ||--o{ TrustBeneficiary : "settlor.beneficiaries"
    Trust }o--o{ Person : "settlor.trusteeIds"
    Trust ||--o| TrustSettlorData : "settlor (embedded)"
    Trust ||--o| TrustBeneficiaryData : "beneficiary (embedded)"
    Trust }o--o{ BaseAsset : "assetIds"
    TrustBeneficiary }o--o| Person : "id (when type=person)"

    %% --- Business relationships ---
    Business }o--|| Person : "userId (owner)"
    Business ||--o| AddressData : "address"

    %% --- BeneficiaryGroup relationships ---
    BeneficiaryGroup }o--|| Person : "willId (will-maker)"
    BeneficiaryGroup }o--o{ Person : "memberIds"

    %% --- Estate Remainder relationships ---
    EstateRemainderState }o--|| Person : "userId (will-maker)"
    EstateRemainderState }o--o{ Person : "selectedPeopleIds"
    EstateRemainderState }o--o{ BeneficiaryGroup : "selectedGroupIds"

    %% --- BequeathalData holds assets by category ---
    BequeathalData ||--o{ BaseAsset : "contains assets by type"

    %% --- Auth layer ---
    LoginResponse ||--|| AuthUser : "contains user"
    LoginRequest ||--|{ LoginResponse : "produces"
    RegisterRequest ||--|{ RegisterResponse : "produces"

    %% --- Attribution ---
    AttributionData ||--o| OnboardingState : "drives onboarding flow"

    %% --- Deprecated ---
    UserData_DEPRECATED ||--o| AddressData : "has address"
    Executor_DEPRECATED }o--|| Person : "personId"
    ExecutorData_DEPRECATED ||--o{ Executor_DEPRECATED : "executors[]"
    WillData ||--o{ GuardianHierarchy : "guardianship[] (embedded)"
    GuardianHierarchy }o--|| Person : "guardian"

    %% --- Computed views reference core entities ---
    WillProgressState }o--|| Person : "willMaker"
    WillProgressState }o--|| WillData : "willData"
    WillProgressState }o--|| EstateRemainderState : "estateRemainderState"
    WillProgressState }o--|| BequeathalData : "bequeathalData"
    AssetSummary }o--|| BequeathalData : "computed from"
    BeneficiarySelection }o--o| Person : "id (when person)"
    BeneficiarySelection }o--o| BeneficiaryGroup : "id (when group)"
```

## Entity Count Summary

| Category | Count | Entities |
|----------|-------|----------|
| **Core Domain** | 8 | Person, WillData, Bequest, BeneficiaryGroup, EstateRemainderState, RelationshipEdge, AlignmentInfo, GuardianHierarchy |
| **Asset Hierarchy** | 12 | BaseAsset, PropertyAsset, ImportantItemAsset, InvestmentAsset, PensionAsset, LifeInsuranceAsset, BankAccountAsset, PrivateCompanySharesAsset, AssetsHeldThroughBusinessAsset, AgriculturalAsset, CryptoCurrencyAsset, BeneficiaryAssignment |
| **Trust System** | 4 | Trust, TrustSettlorData, TrustBeneficiaryData, TrustBeneficiary |
| **Business** | 1 | Business |
| **Shared Value Objects** | 2 | AddressData, BequeathalData |
| **Auth/API** | 8 | AuthUser, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, SessionValidationResponse, RefreshSessionResponse, ValidateEmailResponse, ApiErrorPayload |
| **Infrastructure** | 3 | QueuedMutation, AttributionData, OnboardingState |
| **UI State** | 3 | QuizAnswers, IHTDrawerState, NetworkState |
| **Deprecated** | 3 | UserData, Executor, ExecutorData |
| **Computed Views** | 6 | AssetSummary, WillProgressState, SummaryCTA, CategoryMeta, DisplayField, ValidationField |
| **Component Data Types** | 1 | BeneficiarySelection |
| **Total** | **51** | |

## Key Enums & Type Aliases

| Name | Values |
|------|--------|
| `RelationshipType` (enum) | SPOUSE, PARTNER, PARENT_OF, SIBLING_OF, AUNT_UNCLE_OF, COUSIN_OF, GUARDIAN_OF, FRIEND, OTHER_TIE |
| `AssetType` | property, investment, pensions, life-insurance, bank-accounts, private-company-shares, assets-held-through-business, agricultural-assets, crypto-currency, important-items, debts-credit, other |
| `PersonRole` | will-maker, executor, beneficiary, witness, guardian, co-guardian, family-member, dependent |
| `TrustType` | bare_trust, life_interest_trust, discretionary_trust, settlor_interested_trust, interest_in_possession_trust, other_trust |
| `TrustRole` | settlor, beneficiary, settlor_and_beneficiary, settlor_and_beneficial_interest, life_interest, remainderman |
| `PartnershipPhase` | active, separated, divorced, widowed |
| `ExecutorRole` | primary, secondary, tertiary, quaternary, co-primary, co-secondary, co-tertiary |
| `CareCategory` | child-under-18, adult-lacks-capacity, adult-full-capacity, special-circumstances |
| `HeldInTrust` | yes, no, not-sure |
| `AlignmentStatus` | accepted, pending, declined |
| `Screen` | 65+ screen identifiers for navigation |

## Key Architectural Notes

1. **Person is the central hub** — referenced by nearly every other entity via ID. Persons hold multiple roles rather than using separate User/Executor/Beneficiary tables.
2. **Asset discriminated union** — `BaseAsset` is extended by 10 concrete subtypes, discriminated by the `type` field.
3. **Bequest separates ownership from disposition** — Assets describe what you own (stable facts); Bequests describe who gets what (versioned per will).
4. **RelationshipEdge graph** — Normalized relationship tracking with qualifiers, replacing the older flat `PersonRelationshipType`.
5. **Trust** has deeply nested embedded structures (settlor, beneficiary, trustee) rather than separate tables.
6. **Will versioning** — WillData supports version chains via `supersedes`/`supersededBy`.
7. **Offline-first** — QueuedMutation enables offline mutation queuing for eventual sync.
