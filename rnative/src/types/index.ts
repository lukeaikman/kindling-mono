/**
 * Type definitions for the Kindling React Native app
 * Migrated from web prototype with full feature parity
 * 
 * This file contains all TypeScript interfaces, types, and enums used throughout the app.
 * @module types
 */

/**
 * Screen identifiers for navigation
 * Represents all screens in the app (65+ screens)
 */
export type Screen = 
  | 'splash'
  | 'login'
  | 'video-intro'
  | 'will-creation'
  | 'family-details'
  | 'executors-intro'
  | 'executors-selection'
  | 'executors-invitation'
  | 'professional-executor'
  | 'bequeathal-intro'
  | 'bequeathal-categories'
  | 'property-intro'
  | 'property-address'
  | 'property-entry'
  | 'property-trust-details'
  | 'property-details'
  | 'property-summary'
  | 'important-items-intro'
  | 'important-items-entry'
  | 'investments-intro'
  | 'investments-entry'
  | 'pensions-intro'
  | 'pensions-entry'
  | 'life-policies-intro'
  | 'life-policies-entry'
  | 'bank-accounts-intro'
  | 'bank-accounts-entry'
  | 'private-company-shares-intro'
  | 'private-company-shares-entry'
  | 'assets-held-through-business-intro'
  | 'assets-held-through-business-entry'
  | 'assets-held-through-business-summary'
  | 'agricultural-assets-intro'
  | 'agricultural-assets-entry'
  | 'crypto-currency-intro'
  | 'crypto-currency-entry'
  | 'children-guardianship-intro'
  | 'guardian-wishes'
  | 'executor-facilitation'
  | 'estate-division-intro'
  | 'estate-division-entry'
  | 'estate-remainder-who'
  | 'estate-remainder-split'
  | 'structuring-your-estate-intro'
  | 'structuring-your-estate-entry'
  | 'structure-home-inheritance'
  | 'dashboard'
  | 'developer-tools'
  | 'list-of-pages'
  | 'data-structure'
  | 'asset-test'
  | 'local-storage-viewer'
  | 'estate-quiz-question-1'
  | 'estate-quiz-question-2'
  | 'estate-quiz-question-3'
  | 'estate-quiz-question-4'
  | 'estate-quiz-question-5'
  | 'estate-quiz-summary'
  | 'onboarding-welcome'
  | 'onboarding-location'
  | 'onboarding-family'
  | 'onboarding-extended-family'
  | 'onboarding-wrap-up'
  | 'order-of-things';

/**
 * Address data structure for UK and international addresses
 */
export interface AddressData {
  address1: string;
  address2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
}

/**
 * Role that a person can have in the will creation process
 */
export type PersonRole = 'will-maker' | 'executor' | 'beneficiary' | 'witness' | 'guardian' | 'co-guardian' | 'family-member' | 'dependent';

/**
 * Category of care for dependents
 */
export type CareCategory = 
  | 'child-under-18'
  | 'adult-lacks-capacity' 
  | 'adult-full-capacity'
  | 'special-circumstances';

/**
 * @deprecated Use RelationshipEdge system with RelationshipType enum and qualifiers for new code.
 * This type is kept for backward compatibility during transition.
 * 
 * Migration notes:
 * - 'spouse' | 'ex-spouse' → RelationshipType.SPOUSE with phase: 'active' | 'divorced'
 * - 'biological-child' | 'adopted-child' | 'stepchild' → RelationshipType.PARENT_OF with qualifiers
 */
export type PersonRelationshipType = 
  | 'spouse'
  | 'partner'
  | 'ex-spouse'
  | 'ex-partner'
  | 'biological-child'
  | 'adopted-child'
  | 'stepchild'
  | 'parent'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'uncle-aunt'
  | 'nephew-niece'
  | 'cousin'
  | 'friend'
  | 'colleague'
  | 'solicitor'
  | 'accountant'
  | 'other';

/**
 * Relationship Edge System - Normalized kinship tracking
 * This is the modern approach for relationship management
 */
export enum RelationshipType {
  // Spouses/Partners (symmetric)
  SPOUSE = 'spouse',
  PARTNER = 'partner',

  // Parent-child (directed aId -> bId)
  PARENT_OF = 'parent-of',

  // Siblings (symmetric)
  SIBLING_OF = 'sibling-of',

  // Extended family (directed aId -> bId)
  AUNT_UNCLE_OF = 'aunt-uncle-of',
  COUSIN_OF = 'cousin-of', // typically treated symmetric in UI

  // Guardian/ward (directed, legal role)
  GUARDIAN_OF = 'guardian-of',
  
  // Non-family (symmetric)
  FRIEND = 'friend',
  
  // Other
  OTHER_TIE = 'other-tie'
}

/**
 * Optional lifecycle for partnerships only
 */
export type PartnershipPhase = 'active' | 'separated' | 'divorced' | 'widowed';

/**
 * Executor role in hierarchy
 */
export type ExecutorRole = 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'co-primary' | 'co-secondary' | 'co-tertiary';

/**
 * Person entity - represents any individual in the system
 * Can have multiple roles (will-maker, executor, beneficiary, etc.)
 */
export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: PersonRelationshipType;
  roles: PersonRole[];
  dateOfBirth?: string;
  address?: AddressData;
  isDependent?: boolean;
  isUnder18?: boolean;
  // Care-related fields
  inCare?: boolean; // Flag indicating this person is in the user's care
  careCategory?: CareCategory; // Type of care relationship
  guardianIds?: string[]; // Array of person IDs who are guardians for this person
  // Legacy field for backward compatibility
  capacityStatus?: 'under-18' | 'over-18-lacks-capacity' | 'over-18-full-capacity' | 'special-circumstances';
  customRelationship?: string;
  guardianDetails?: {
    isFirstChoice?: boolean;
    isSecondChoice?: boolean;
    hasAccepted?: boolean;
  };
  // Executor-specific fields
  executorRole?: ExecutorRole;
  executorStatus?: 'pending' | 'accepted' | 'declined';
  invitedAt?: Date;
  respondedAt?: Date;
  // Onboarding tracking
  createdInOnboarding?: boolean; // Flag to track if this person was created during onboarding
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @deprecated User is now stored as a Person with 'will-maker' role.
 * Use personActions.getPeopleByRole('will-maker')[0] or willActions.getUser() instead.
 * This interface is kept for backward compatibility during migration.
 */
export interface UserData {
  id: string; // Unique identifier for the user
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address?: AddressData;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Guardian hierarchy levels
 */
export type GuardianLevel = 'primary' | 'secondary' | 'tertiary' | 'quaternary';

/**
 * Guardian hierarchy structure for a child
 */
export interface GuardianHierarchy {
  guardians: Array<{
    guardian: string; // Person ID
    level: number;    // 1, 2, 3, 4...
  }>;
}

/**
 * Alignment status for spouse/partner guardianship alignment
 */
export type AlignmentStatus = 'accepted' | 'pending' | 'declined';

/**
 * Alignment information for guardianship synchronization
 */
export interface AlignmentInfo {
  alignedUser: string;        // Usually spouse (Person ID)
  status: AlignmentStatus;
}

/**
 * Will data - main will document structure
 */
export interface WillData {
  userId: string; // Person ID of will-maker (Person with 'will-maker' role)
  willType: 'simple' | 'complex';
  status: 'draft' | 'review' | 'final';
  executors: Array<{
    executor: string; // Person ID
    level: number;    // 1, 2, 3, 4...
  }>;
  
  // Simplified guardianship structure (same as executors)
  guardianship: {
    [childId: string]: Array<{
      guardian: string; // Person ID
      level: number;    // 1, 2, 3, 4...
    }>;
  };
  
  alignment: {
    [childId: string]: AlignmentInfo;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quiz answers for estate planning questionnaire
 */
export interface QuizAnswers {
  lifeExpectancy: boolean;
  lifeExpectancyShort?: boolean;
  retirementAge: number | null;
  isAlreadyRetired: boolean;
  hasExcessCapital: boolean;
  incomeCoversLifestyle?: boolean;
  needsAssetProtection: boolean;
}

/**
 * @deprecated Use Person interface with executor roles instead
 * This interface is kept for backward compatibility but should not be used in new code
 */
export interface ExecutorData {
  executors: Executor[];
  executorType: 'personal' | 'professional';
  invitationsSent: boolean;
  lastUpdated: Date;
}

/**
 * Bequeathal data - all assets organized by category
 */
export interface BequeathalData {
  property: Asset[];
  'important-items': Asset[];
  investment: Asset[];
  pensions: Asset[];
  'life-insurance': Asset[];
  'bank-accounts': Asset[];
  'private-company-shares': Asset[];
  'assets-held-through-business': Asset[];
  'debts-credit': Asset[];
  'agricultural-assets': Asset[];
  'crypto-currency': Asset[];
  other: Asset[];
  selectedCategories: Set<string>;
  totalEstimatedValue: number;
  totalNetValue: number;
  lastUpdated: Date;
}

/**
 * @deprecated Use Person interface with executor roles instead
 * This interface is kept for backward compatibility but should not be used in new code
 */
export interface Executor {
  id: string;
  personId: string;
  isPrimary: boolean;
  hasAccepted?: boolean;
  invitationSent?: boolean;
  invitationDate?: string;
}

/**
 * Beneficiary entity
 */
export interface Beneficiary {
  id: string;
  personId: string;
  shareType: 'percentage' | 'specific-amount' | 'residual';
  shareValue?: number;
  specificInstructions?: string;
}

/**
 * Asset type categories
 */
export type AssetType = 
  | 'property'
  | 'investment'
  | 'pensions'
  | 'life-insurance'
  | 'bank-accounts'
  | 'private-company-shares'
  | 'assets-held-through-business'
  | 'agricultural-assets'
  | 'crypto-currency'
  | 'important-items'
  | 'debts-credit'
  | 'other';

/**
 * Trust status for assets
 */
export type HeldInTrust = 'yes' | 'no' | 'not-sure';

/**
 * Beneficiary Assignment
 * 
 * Ultra-clean beneficiary allocation structure (4 fields max).
 * Used by ALL asset types that support beneficiary designation.
 * 
 * Design Principles:
 * - No caching: Names/relationships looked up from Person/Group records
 * - No calculated fields: Totals/types computed via helper functions
 * - Minimal storage: Only IDs and allocations
 * - Single source of truth: Person/Group records are authoritative
 * 
 * @property id - Person ID, Group ID, or 'estate'
 * @property type - Beneficiary type discriminator
 * @property percentage - Percentage allocation 0-100 (optional, for percentage mode)
 * @property amount - Amount allocation in £ (optional, for amount mode)
 */
export interface BeneficiaryAssignment {
  id: string;
  type: 'person' | 'group' | 'estate';
  percentage?: number;
  amount?: number;
}

/**
 * Beneficiary Assignments Container
 * 
 * Simple array wrapper for beneficiary assignments.
 * All metadata computed via helper functions in beneficiaryHelpers.ts:
 * - getAllocationType() - infer 'none' | 'percentage' | 'amount'
 * - getTotalAllocated() - calculate sum
 * - validatePercentageAllocation() - check 100% total
 * - getBeneficiaryDisplayName() - lookup names
 * - getAssetsForBeneficiary() - find assets for person
 * - calculateBeneficiaryInheritance() - total inheritance value
 * 
 * @property beneficiaries - Array of beneficiary assignments
 */
export interface BeneficiaryAssignments {
  beneficiaries: BeneficiaryAssignment[];
}

/**
 * Base asset interface - extended by specific asset types
 */
export interface BaseAsset {
  id: string;
  type: AssetType;
  title: string;
  description?: string;
  estimatedValue?: number;
  netValue?: number;
  beneficiaryId?: string;
  heldInTrust?: HeldInTrust;
  createdAt: string;
  updatedAt: string;
}

/**
 * Property Usage Type
 */
export type PropertyUsage = 'residential' | 'let_residential' | 'commercial';

/**
 * Property asset - real estate holdings
 * 
 * Complex asset type with conditional fields based on usage and ownership.
 * Supports IHT calculations: RNRB, BPR (FHL), APR (Agricultural), GROB (Trusts).
 * 
 * Conditional fields only populated when relevant:
 * - FHL fields: Only if propertyType includes 'furnished_holiday_let'
 * - Agricultural fields: Only if propertyType = 'agricultural_property'
 * - Mixed-use fields: Only if propertyType = 'mixed_use_property'
 * - Buy-to-let fields: Only if propertyType = 'buy_to_let'
 * - Company fields: Only if ownershipType = 'company_owned'
 * - Trust fields: Only if ownershipType = 'trust_owned'
 */
export interface PropertyAsset extends BaseAsset {
  type: 'property';
  address: AddressData;
  
  // Usage & Type (REQUIRED)
  usage: PropertyUsage;
  propertyType: string; // Conditional options based on usage
  
  // Ownership (REQUIRED)
  ownershipType: 'personally_owned' | 'jointly_owned' | 'company_owned' | 'trust_owned';
  ownershipPercentage?: number;
  
  // Mortgage (derived from amount, not input)
  hasMortgage?: boolean;
  mortgage?: {
    outstandingAmount: number;
    provider: string;
  };
  
  // Acquisition (OPTIONAL - executor context, not IHT-critical)
  acquisitionMonth?: string;
  acquisitionYear?: string;
  
  // FHL specific (conditional on propertyType)
  fhlAvailableOver210Days?: boolean;
  fhlActuallyLet105Days?: boolean;
  fhlLongLetsUnder155Days?: boolean;
  fhlEstimatedAnnualIncome?: number;
  
  // Agricultural specific (conditional on propertyType)
  agriculturalActivelyFarmed?: boolean;
  agriculturalWhoFarms?: 'owner' | 'tenant' | 'contract_farmer';
  agriculturalPre1995Tenancy?: boolean;
  agriculturalBuildingsIncluded?: boolean;
  agriculturalTotalAcreage?: number;
  agriculturalFarmingType?: 'arable' | 'livestock' | 'mixed' | 'horticulture' | 'forestry' | 'other';
  agriculturalFarmingTypeOther?: string;
  
  // Mixed-Use specific (conditional on propertyType)
  mixedUseCommercialPercentage?: number;
  mixedUseSeparateEntrances?: boolean;
  mixedUseResidentialWasMainHome?: boolean;
  
  // Buy-to-Let specific (conditional on propertyType)
  buyToLetAnnualRentalIncome?: number;
  buyToLetTenancyType?: 'ast' | 'company_let' | 'unknown' | 'other';
  buyToLetTenancyTypeOther?: string;
  buyToLetTenantedAtDeath?: boolean;
  
  // Company ownership (conditional on ownershipType)
  companyName?: string;
  companyOwnershipPercentage?: number;
  companyCountryOfRegistration?: string;
  companyShareClass?: string;
  companyNotes?: string;
  companyArticlesConfident?: boolean;
  isCompanyDirector?: boolean;
  
  // Trust reference (foreign key to Trust entity)
  trustId?: string; // Links to Trust.id - trust details stored in separate Trust table
  
  // Joint ownership (conditional on ownershipType)
  jointOwnershipType?: 'joint_tenants' | 'tenants_in_common' | 'not_sure';
  jointTenants?: Array<{id: string, name: string, relationship?: string}>;
  
  // Beneficiaries (uses unified type)
  beneficiaryAssignments?: BeneficiaryAssignments;
}

/**
 * Important items asset - jewelry, artwork, collectibles, etc.
 * Uses beneficiaryAssignments for multi-beneficiary support
 */
export interface ImportantItemAsset extends BaseAsset {
  type: 'important-items';
  specificDetails?: string;
  sentimentalValue?: boolean;
  beneficiaryAssignments?: BeneficiaryAssignments;  // Unified type
}

/**
 * Investment asset - stocks, bonds, ISAs, etc.
 */
export interface InvestmentAsset extends BaseAsset {
  type: 'investment';
  investmentType: string;
  provider: string;
  accountNumber?: string;
  beneficiaryAssignments?: BeneficiaryAssignments;  // Unified type
}

/**
 * Pension type options
 */
export type PensionType = 
  | 'defined-benefit'
  | 'defined-contribution'
  | 'sipp'
  | 'workplace'
  | 'unsure';

/**
 * Pension asset - workplace and personal pensions
 * Simplified for will creation + visualization (value first, executor details later)
 */
export interface PensionAsset extends BaseAsset {
  type: 'pensions';
  provider: string;
  pensionType: PensionType;
  beneficiaryNominated?: 'yes' | 'no' | 'not-sure';
  beneficiaryAssignments?: BeneficiaryAssignments;  // Conditional: only when beneficiaryNominated === 'yes'
  // Fields deferred to Executor Facilitation phase:
  // - policyNumber, linkedEmployer (for executor access, not will creation)
}

/**
 * Life insurance asset - life insurance policies
 */
/**
 * Life Insurance Premium Status
 * Indicates whether policy is actively paying out if life assured dies
 */
export type PremiumStatus = 'active' | 'paid-up' | 'lapsed' | 'suspended';

/**
 * Life Insurance Policy Type
 */
export type PolicyType = 'term' | 'whole-life';

/**
 * Life Insurance Asset
 * Simplified from web prototype - focuses on value and distribution
 * 
 * Design: Person IDs (not text names) for proper inheritance visualization
 * Allocation mode at policy level (not per beneficiary) for simpler UX
 */
export interface LifeInsuranceAsset extends BaseAsset {
  type: 'life-insurance';
  provider: string;                     // Provider name
  lifeAssured: string;                  // Person ID whose life is insured (or 'unknown')
  sumInsured: number;                   // Payout amount
  policyType: PolicyType;               // Term or Whole Life
  heldInTrust: HeldInTrust;             // Affects estate calculation and IHT
  premiumStatus: PremiumStatus;         // Active, Paid Up, Lapsed, Suspended
  allocationMode: 'percentage' | 'amount';  // How beneficiaries split payout
  beneficiaryAssignments?: BeneficiaryAssignments;  // Unified type (conditional on heldInTrust)
  // Fields deferred to Executor Facilitation phase:
  // - policyNumber: string (for executor access)
  // - monthlyPremium: number (not needed for value visualization)
}

/**
 * Bank account asset - current accounts, savings, ISAs
 */
export interface BankAccountAsset extends BaseAsset {
  type: 'bank-accounts';
  accountType: string;
  provider: string;
  accountNumber?: string;
  sortCode?: string;
  ownershipType?: 'personal' | 'joint';
  isNonUkBank?: boolean;
  nonUkBankName?: string;
  accountId?: string;
  notes?: string;
}

/**
 * Private company shares asset - shareholdings in private companies
 */
export interface PrivateCompanySharesAsset extends BaseAsset {
  type: 'private-company-shares';
  companyName: string;
  
  // User enters ONE of these (inline toggle in UI):
  numberOfShares?: number;       // Integer, > 0
  percentageOwnership?: number;  // 0-100, up to 2 decimals
  
  notes?: string;                // Transfer restrictions, special terms
  excludeFromNetWorth?: boolean; // For illiquid/speculative shares
  
  // IHT Planning fields (Business Property Relief eligibility)
  isActivelyTrading?: boolean;
  heldForTwoPlusYears?: boolean;
  isNotHoldingCompany?: boolean;
}

/**
 * Assets held through business - assets owned by businesses
 * 
 * Ultra-clean relational model: stores only asset-specific data.
 * Business details (name, ownership %) looked up via businessId foreign key.
 * 
 * @property businessId - Foreign key to Business record (single source of truth)
 * @property assetType - Type of asset (property, equipment, vehicles, etc.)
 * @property assetDescription - Brief description of the asset
 */
export interface AssetsHeldThroughBusinessAsset extends BaseAsset {
  type: 'assets-held-through-business';
  businessId: string;  // Foreign key to Business record
  assetType: 'property' | 'equipment' | 'vehicles' | 'bank-accounts' | 
             'investments' | 'inventory' | 'intellectual-property' | 'other';
  assetDescription?: string;
  
  // All business details looked up via: businessActions.getBusinessById(businessId)
  // REMOVED: businessName (duplication - lookup via businessId)
  // REMOVED: businessType (removed from Business interface)
  // REMOVED: businessOwnershipPercentage (duplication - lookup via businessId)
  // REMOVED: numberOfUnits (dead code, never used)
  // REMOVED: excludeFromBusinessValuation (unrealistic use case)
}

/**
 * Agricultural asset - personally-owned farms, land, agricultural equipment
 * 
 * ROUTING: Company-owned agricultural property is routed to AssetsHeldThroughBusinessAsset.
 * This interface is ONLY for personal/partnership/trust ownership.
 * 
 * APR/BPR Qualification:
 * - Agricultural Property Relief (APR): Land, buildings, farmhouse (if personally owned)
 * - Business Property Relief (BPR): Equipment, livery stud farms
 * - Conditional fields determine relief eligibility (100% IHT relief potential)
 * 
 * @property aprOwnershipStructure - How property is owned (personal/partnership/trust only - company routes away)
 * @property aprOwnershipDuration - How long owned (APR requires 2+ years)
 * @property aprTrustType - Trust type if held in trust
 * @property farmWorkerOccupied - Farm worker cottage occupancy (determines APR eligibility)
 * @property woodlandPurpose - Agricultural shelter vs commercial (determines APR vs no relief)
 * @property studFarmActivity - Breeding vs livery (determines APR vs BPR)
 */
export interface AgriculturalAsset extends BaseAsset {
  type: 'agricultural-assets';
  assetType: 'agricultural-land' | 'farm-buildings' | 'farmhouse' | 'farm-worker-cottage' | 
             'woodland' | 'stud-farm' | 'standing-crops' | 'fish-farming' | 'agricultural-equipment' | 'other';
  assetDescription?: string;
  
  // Ownership (routing decision - company option routes to Phase 12)
  aprOwnershipStructure?: 'personal' | 'partnership' | 'trust' | 'not-sure';
  
  // Asset-type conditional fields
  farmWorkerOccupied?: 'yes' | 'no' | 'not-sure';
  woodlandPurpose?: 'shelter' | 'commercial' | 'not-sure';
  studFarmActivity?: 'breeding' | 'livery' | 'not-sure';
  otherAssetTypeDetail?: string;
  
  // Debts
  hasDebtsEncumbrances?: 'yes' | 'no';
  debtAmount?: number;
  debtDescription?: string;
  
  // APR qualification (Agricultural Property Relief)
  aprOwnershipDuration?: 'year-1' | 'year-2' | 'year-3' | 'year-4' | 'year-5' | 'year-6' | 'gt-7' | 'not-sure';
  aprTrustType?: string;
  
  // BPR qualification (Business Property Relief)
  bprActiveTrading?: 'yes' | 'no' | 'not-sure';
  bprOwnershipDuration?: 'lt-2' | 'gte-2' | 'not-sure';
  
  // Additional context
  notes?: string;
  
  // REMOVED: location (dead code, never used)
  // REMOVED: sizeQuantity (dead code, never used)
  // REMOVED: yearsOwned (superseded by aprOwnershipDuration)
  // REMOVED: activeAgriculturalUse (dead code, never used)
  // REMOVED: ownershipStructure (redundant with aprOwnershipStructure)
  // REMOVED: customOwnershipStructure (removed 'other' option)
}

/**
 * Cryptocurrency asset - digital currencies and tokens
 */
/**
 * Cryptocurrency asset - simplified account-based model
 * Tracks crypto accounts/wallets rather than individual coin holdings
 * Estate planning focused: helps executors find and access accounts
 */
export interface CryptoCurrencyAsset extends BaseAsset {
  type: 'crypto-currency';
  platform: string;          // Wallet or exchange name (Coinbase, Hardware Wallet, etc.)
  accountUsername?: string;  // Account ID/username for executor access
  notes?: string;           // Additional details (hardware wallet location, etc.)
}

/**
 * Union type of all possible asset types
 */
export type Asset = 
  | PropertyAsset
  | ImportantItemAsset
  | InvestmentAsset
  | PensionAsset
  | LifeInsuranceAsset
  | BankAccountAsset
  | PrivateCompanySharesAsset
  | AssetsHeldThroughBusinessAsset
  | AgriculturalAsset
  | CryptoCurrencyAsset;

/**
 * Summary statistics for all assets
 */
export interface AssetSummary {
  totalAssets: number;
  totalEstimatedValue: number;
  totalNetValue: number;
  completedAssets: number;
  draftAssets: number;
  assetsByType: Record<AssetType, {
    count: number;
    totalValue: number;
    totalNetValue: number;
    completed: number;
  }>;
}

/**
 * Business entity - companies and organizations
 */
export interface Business {
  id: string;
  name: string;
  ownershipPercentage: number;    // From Private Company Shares
  estimatedValue: number;          // Calculated from assets
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // REMOVED: businessType (not needed - ownership via shares/GIAs)
  // REMOVED: registrationNumber (defer to Executor Facilitation)
  // REMOVED: address (defer to Executor Facilitation)
}

/**
 * Actions for managing will data
 */
export interface WillActions {
  /** @deprecated Use personActions.updatePerson(userId, updates) instead */
  updateUserData: (updates: Partial<UserData>) => void;
  /** Get the will-maker Person (user with 'will-maker' role) */
  getUser: () => Person | undefined;
  /** @deprecated Use getUser() instead - returns Person, not UserData */
  getUserData: () => UserData;
  updateWillStatus: (status: WillData['status']) => void;
  updateWillData: (updates: Partial<WillData>) => void;
  getWillData: () => WillData;
  
  // Guardian management methods (same as executors)
  addGuardian: (childId: string, guardianId: string, level: number) => void;
  removeGuardian: (childId: string, guardianId: string) => void;
  getGuardians: (childId: string) => Array<{guardian: string, level: number}>;
  setAlignment: (childId: string, alignedUser: string, status: AlignmentStatus) => void;
  getAlignment: (childId: string) => AlignmentInfo | undefined;
}

/**
 * Actions for managing people
 */
export interface PersonActions {
  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;
  getPeople: () => Person[];
  getPersonById: (id: string) => Person | undefined;
  getPersonByName: (firstName: string, lastName?: string) => Person | undefined;
  getPeopleByRole: (role: PersonRole) => Person[];
  getBeneficiaries: () => Person[];
  getExecutors: () => Person[];
  getFamilyMembers: () => Person[];
  getChildren: () => Person[];
  getChildrenUnder18: () => Person[];
  getPeopleInCare: () => Person[];
  addRoleToPerson: (personId: string, role: PersonRole) => void;
  removeRoleFromPerson: (personId: string, role: PersonRole) => void;
  hasRole: (personId: string, role: PersonRole) => boolean;
  updateExecutorStatus: (personId: string, status: Person['executorStatus']) => void;
  sendExecutorInvitations: () => void;
  getPersonData: () => Person[];
  addBeneficiary: (beneficiaryData: { name: string; relationship: string }) => string;
  addExecutor: (executorData: any) => string;
  clearOnboardingFamilyMembers: () => void;
  // Guardian management (current reality tracking)
  assignGuardian: (childId: string, guardianId: string) => void;
  removeGuardian: (childId: string, guardianId: string) => void;
  getGuardians: (childId: string) => Person[];
}

/**
 * @deprecated Use PersonActions interface instead
 * This interface is kept for backward compatibility but should not be used in new code
 */
export interface ExecutorActions {
  addExecutor: (executorData: any) => string;
  removeExecutor: (id: string) => void;
  updateExecutor: (id: string, updates: any) => void;
  getExecutors: () => any[];
  sendInvitations: () => void;
  updateExecutorType: (executorType: 'personal' | 'professional' | 'mixed') => void;
  getExecutorData: () => ExecutorData;
}

/**
 * Actions for managing beneficiaries
 */
export interface BeneficiaryActions {
  addBeneficiary: (beneficiaryData: { name: string; relationship: string }) => string;
  removeBeneficiary: (id: string) => void;
  updateBeneficiary: (id: string, updates: { name?: string; relationship?: string }) => void;
  getBeneficiaries: () => any[];
  getBeneficiaryById: (id: string) => any | undefined;
  getBeneficiaryData: () => { beneficiaries: any[]; lastUpdated: Date };
}

/**
 * Actions for managing assets (bequeathals)
 */
export interface BequeathalActions {
  addAsset: (type: AssetType, assetData: Omit<Asset, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => string;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  deleteAsset?: (id: string) => void; // @deprecated - use removeAsset instead
  getAssets: () => Asset[];
  getAssetById: (id: string) => Asset | undefined;
  getAssetsByType: (type: AssetType) => Asset[];
  getAllAssets: () => Asset[];
  getSelectedCategories: () => string[];
  setSelectedCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
}

/**
 * Actions for managing businesses
 */
export interface BusinessActions {
  addBusiness: (business: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => string;
  removeBusiness: (id: string) => void;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  getBusinesses: () => Business[];
  getBusinessById: (id: string) => Business | undefined;
  getBusinessByName: (name: string) => Business | undefined;
  getBusinessData: () => Business[];
  syncBusinessFromAssets: () => void;
}

/**
 * Beneficiary group for categorizing estate remainder recipients
 * 
 * Groups can be predefined templates (Children, Siblings, etc.) or custom user-created categories.
 * Uses lazy creation pattern - groups only created when first selected by user.
 * Soft deletion via isActive flag preserves group definition and future memberIds.
 * 
 * @interface BeneficiaryGroup
 * @property {string} id - Unique identifier
 * @property {string} name - Display name (e.g., "Children", "Godchildren")
 * @property {string} description - User-facing description shown in UI
 * @property {boolean} isPredefined - true for system templates, false for user-created
 * @property {boolean} isActive - Soft delete flag; false = deselected but preserved
 * @property {string[]} memberIds - Optional array of Person IDs belonging to this group (future feature)
 * @property {string} willId - Links group to specific will-maker (Person ID)
 * @property {Date} createdAt - Timestamp of creation
 * @property {Date} updatedAt - Timestamp of last update
 */
export interface BeneficiaryGroup {
  id: string;
  name: string;
  description: string;
  isPredefined: boolean;
  isActive: boolean;
  memberIds?: string[];
  willId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Actions for managing beneficiary groups
 * 
 * @interface BeneficiaryGroupActions
 */
export interface BeneficiaryGroupActions {
  /** Creates a new beneficiary group and returns its ID */
  addGroup: (group: Omit<BeneficiaryGroup, 'id' | 'createdAt' | 'updatedAt'>) => string;
  /** Updates an existing group's properties */
  updateGroup: (id: string, updates: Partial<BeneficiaryGroup>) => void;
  /** Retrieves all groups (active and inactive) */
  getGroups: () => BeneficiaryGroup[];
  /** Finds a group by ID */
  getGroupById: (id: string) => BeneficiaryGroup | undefined;
  /** Retrieves only active groups */
  getActiveGroups: () => BeneficiaryGroup[];
  /** Finds a group by name and will ID */
  getGroupByName: (name: string, willId: string) => BeneficiaryGroup | undefined;
  /** Sets a group's active status (soft delete) */
  setGroupActive: (id: string, isActive: boolean) => void;
}

/**
 * Estate remainder allocation state
 * 
 * Tracks which people and groups share the residual estate (after specific gifts),
 * their percentage splits, and lock states for allocation adjustments.
 * 
 * @interface EstateRemainderState
 * @property {string[]} selectedPeopleIds - Person IDs selected to share estate remainder
 * @property {string[]} selectedGroupIds - BeneficiaryGroup IDs selected to share estate remainder
 * @property {Record<string, number>} splits - Percentage allocations keyed by "person-{id}" or "group-{id}"
 * @property {Record<string, boolean>} lockedCards - Lock status for each split (locked = cannot auto-adjust)
 * @property {Date} lastUpdated - Timestamp of last update
 */
export interface EstateRemainderState {
  selectedPeopleIds: string[];
  selectedGroupIds: string[];
  splits: Record<string, number>;
  lockedCards: Record<string, boolean>;
  lastUpdated: Date;
}

/**
 * Trust types for estate planning
 */
export type TrustType = 
  | 'bare_trust'
  | 'life_interest_trust'
  | 'discretionary_trust'
  | 'settlor_interested_trust'
  | 'interest_in_possession_trust';

/**
 * Trust beneficiary allocation
 */
export interface TrustBeneficiary {
  id: string; // Person ID (from Person[]), group ID, or 'myself'
  type: 'person' | 'group' | 'myself';
  percentage: number;
  isManuallyEdited: boolean;
}

/**
 * Trust entity - trust structures for estate planning
 * 
 * Trusts can have multiple roles for the user (settlor, beneficiary, trustee)
 * and link to assets and people throughout the system.
 */
export interface Trust {
  // Core Identity
  id: string;
  name: string; // User-provided trust name
  type: TrustType;
  creationMonth: string; // '01' to '12' or '' if unknown
  creationYear: string;  // Year as string or '' if unknown
  creationDate?: Date; // Computed from month/year for easier filtering
  createdOver7YearsAgo?: 'yes' | 'no' | 'not_sure'; // Only populated if month/year unknown
  
  // User's Relationship to Trust (boolean flags for multiple roles)
  isUserSettlor: boolean;
  isUserBeneficiary: boolean;
  isUserTrustee: boolean;
  
  // Settlor-Specific Data (populated when isUserSettlor = true)
  settlor?: {
    reservedBenefit: 'none' | 'yes';
    benefitDescription?: string; // Conditional: only when reservedBenefit = 'yes'
    beneficiaries: TrustBeneficiary[];
    trusteeIds: string[]; // Array of Person IDs or 'myself' string
  };
  
  // Beneficiary-Specific Data (populated when isUserBeneficiary = true)
  beneficiary?: {
    // Life Interest Trust fields
    entitlementType?: 'right_to_income' | 'right_to_use' | 'both' | 'other';
    isIPDI?: 'yes' | 'no' | 'not-sure'; // Immediate Post Death Interest
    rightOfOccupation?: boolean;
    
    // General benefit description (all non-bare trust types)
    benefitDescription?: string;
    
    // Settlor-Interested Trust fields
    isSettlorOfThisTrust?: 'yes' | 'no';
  };
  
  // Trustee-Specific Data (populated when isUserTrustee = true)
  trustee?: {
    // Placeholder for future trustee-specific fields
    duties?: string[];
    coTrusteeIds?: string[]; // Array of person IDs from PersonData
  };
  
  // Asset References
  assetIds: string[]; // Array of asset IDs held in this trust
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdInContext?: 'property' | 'investments' | 'other'; // Where was this trust first added
}

/**
 * Actions for managing trusts
 */
export interface TrustActions {
  addTrust: (trustData: Omit<Trust, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTrust: (id: string, updates: Partial<Trust>) => void;
  deleteTrust: (id: string) => void;
  getTrusts: () => Trust[];
  getTrustById: (id: string) => Trust | undefined;
  getTrustByName: (name: string) => Trust | undefined;
  getTrustData: () => Trust[];
}

/**
 * RelationshipEdge - Normalized storage of relationships between people
 * 
 * Single edge per relationship; reads resolve bi-directionally.
 * Direction (aId/bId) has no semantic meaning for symmetric types.
 */
export interface RelationshipEdge {
  id: string;
  aId: string;                 // Person ID
  bId: string;                 // Person ID
  type: RelationshipType;      // canonical type (symmetric or directed)

  // Optional, partnerships only
  phase?: PartnershipPhase;

  // Optional qualifiers to avoid type explosion
  // e.g., for PARENT_OF: { biological?: true, adoptive?: true, step?: true }
  //       for SIBLING_OF: { half?: true, step?: true }
  qualifiers?: Record<string, boolean>;

  // Optional temporal metadata (esp. useful for partnerships)
  startedAt?: Date;
  endedAt?: Date;

  // Open-ended metadata
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * RelationshipActions - Actions for managing relationship edges
 * 
 * All writes are idempotent; all reads resolve bi-directionally.
 */
export interface RelationshipActions {
  // Canonical write (single source of truth)
  addRelationship: (
    aId: string,
    bId: string,
    type: RelationshipType,
    opts?: {
      phase?: PartnershipPhase;               // partnerships only
      qualifiers?: Record<string, boolean>;   // e.g., { biological: true }
      startedAt?: Date;
      endedAt?: Date;
      metadata?: Record<string, unknown>;
    }
  ) => string; // returns edgeId

  updateRelationship: (
    edgeId: string,
    updates: Partial<Pick<RelationshipEdge, 'type' | 'phase' | 'qualifiers' | 'startedAt' | 'endedAt' | 'metadata'>>
  ) => void;

  removeRelationship: (edgeId: string) => void;

  // Person-centric reads (both directions, single normalized output)
  getRelationships: (
    personId: string,
    filters?: {
      type?: RelationshipType;
      phase?: PartnershipPhase;
      qualifierKeysAll?: string[];  // e.g., ['biological'] means edge must include this qualifier
    }
  ) => RelationshipEdge[];

  getRelatedPeople: (
    personId: string,
    filters?: {
      type?: RelationshipType;
      phase?: PartnershipPhase;
      qualifierKeysAll?: string[];
    }
  ) => Array<Person & {
    type: RelationshipType;
    phase?: PartnershipPhase;
    qualifiers?: Record<string, boolean>;
    direction: 'out' | 'in';       // viewer was aId or bId
    edgeId: string;
  }>;

  hasRelationship: (aId: string, bId: string, type: RelationshipType) => boolean;

  // Convenience accessors
  getSpouse: (personId: string, phase?: PartnershipPhase) => Person | undefined;
  getChildren: (personId: string, qualifiersFilter?: string[]) => Person[];
  getParents: (personId: string, qualifiersFilter?: string[]) => Person[];
  getSiblings: (personId: string, qualifiersFilter?: string[]) => Person[];
}

/**
 * IHT (Inheritance Tax) Drawer State
 * Manages the tax calculator drawer UI state
 */
export interface IHTDrawerState {
  isOpen: boolean;
  currentViewIndex: number; // 0, 1, or 2
  deathTiming: 'now' | 'in-2-years' | 'in-7-years';
  deathOrder: 'user-first' | 'spouse-first';
  lastUpdated: Date;
}

/**
 * Actions for managing IHT drawer state
 */
export interface IHTDrawerActions {
  setDrawerOpen: (isOpen: boolean) => void;
  setCurrentView: (index: number) => void;
  setDeathTiming: (timing: 'now' | 'in-2-years' | 'in-7-years') => void;
  setDeathOrder: (order: 'user-first' | 'spouse-first') => void;
  getIHTDrawerState: () => IHTDrawerState;
}

