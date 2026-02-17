/**
 * Trust Data Mapping Utilities
 *
 * Centralises bidirectional mapping between the form state (TrustData)
 * and the persistent entities (Trust + PropertyAsset).
 *
 * Extracted from trust-details.tsx to:
 * - Eliminate duplication between sandbox and normal save paths
 * - Make mapping logic testable in isolation
 * - Provide a single place to add new field mappings
 */

import { Trust, TrustType, TrustRole, PropertyAsset } from '../../../src/types';

// ─── Types ─────────────────────────────────────────────────────

/**
 * Beneficiary assignment type (matches structure from beneficiaryAssignments)
 */
export type BeneficiaryAssignment = {
  id: string;
  type: 'person' | 'group' | 'estate';
  name?: string;
  percentage?: number;
};

/**
 * Trust data structure — form-local state for the trust-details screen.
 * This interface defines every field the form can collect across all 9
 * trust type + role combinations.
 */
export interface TrustData {
  // Base fields (3)
  trustName: string;
  trustType: 'life_interest' | 'bare' | 'discretionary' | 'other' | '';
  trustRole: string; // Options depend on trust type

  // Life Interest Settlor fields (new spec)
  settlorTransferWithin7Years: string; // 'yes' | 'no' | ''
  settlorTransferMonth: string;
  settlorTransferYear: string;
  settlorTransferValue: number;
  settlorNoBenefitConfirmed: boolean; // User confirms they cannot benefit from trust

  // Life Interest Settlor + Beneficial Interest fields (new spec)
  settlorAndBeneficialBenefitType: string; // 'life_interest' | 'right_to_occupy' | 'right_to_income' | 'discretionary' | 'other' | ''
  settlorAndBeneficialWantsReview: boolean; // User wants team to reach out about alternatives
  // Legacy fields (kept for backwards compatibility, may be removed later)
  reservedBenefit: string;
  payingMarketRent: string;
  creationMonth: string;
  creationYear: string;
  lifeInterestDateUnknown: boolean;
  lifeInterestValueUnknown: boolean;
  chainedTrustStructure: boolean;
  lifeInterestEndingEvents: string;

  // Life Interest Beneficiary fields
  benefitType: string; // 'life_interest' or 'remainderman' (auto-set based on role)
  // New Life Interest fields (per spec)
  lifeInterestTrustCreationDate: string; // 'before_2006' | 'on_or_after_2006' | ''
  lifeInterestIsIPDI: string; // 'yes' | 'no' | '' - Only shown if post-2006
  lifeInterestSpouseSuccession: string; // 'yes' | 'no' | ''
  lifeInterestSharing: string; // 'not_shared' | 'shared_equally' | 'shared_unequally' | 'successive' | ''
  lifeInterestEqualSharingCount: number; // 2-10+
  lifeInterestUnequalSharingPercentage: number; // 1-99
  lifeInterestSuccessiveCurrentTenant: string; // Text input
  lifeInterestSuccessiveCurrentStatus: string; // 'not_started' | 'active' | 'not_sure' | ''
  interestType: string;
  hasComplexCircumstances: boolean;

  // Remainderman fields (new spec)
  remaindermanLifeTenantAlive: string; // 'yes' | 'no' | 'not_sure' | ''
  remaindermanOwnershipClarification: string; // 'now_own' | 'not_sure' | ''
  remaindermanLifeTenantAge: number; // 18-110
  remaindermanTransferWithin7Years: string; // 'yes' | 'no' | 'not_sure' | '' — gateway question
  remaindermanTransferMonth: string;
  remaindermanTransferYear: string;
  remaindermanTransferValue: number;
  remaindermanTransferDateUnsure: boolean; // User is unsure about transfer date
  remaindermanTransferValueUnsure: boolean; // User is unsure about transfer value
  remaindermanSettlorAlive: string; // 'yes' | 'no' | 'not_sure' | ''
  remaindermanSuccessionBeneficiary: string; // Person/group/estate ID for succession planning

  // Bare Trust Settlor fields
  bareSettlorTransferWithin7Years: string; // 'yes' | 'no' | ''
  bareSettlorTransferMonth: string;
  bareSettlorTransferYear: string;
  bareSettlorDateUnknown: boolean;
  bareSettlorValueUnknown: boolean;

  // Bare Trust Beneficiary fields
  bareBeneficiaryPercentage: number;
  bareBeneficiaryPercentageUnknown: boolean;
  bareBeneficiaryShareWithOthers: string; // 'yes' | 'no' | ''
  bareBeneficiaryNumberOfOthers: string; // 'unknown' | '1' | '2' | ... | '30' | ''
  bareBeneficiaryEstimatedPercentage: number; // Calculated
  bareBeneficiaryTotalUnknownBeneficiaries: number; // Calculated: 1 + numberOfOthers
  bareBeneficiaryGiftedByLivingSettlor: string; // 'yes_less_than_7' | 'yes_more_than_7' | 'no_not_sure' | ''
  bareBeneficiaryGiftMonth: string;
  bareBeneficiaryGiftYear: string;

  // Bare Trust Settlor & Beneficiary fields
  currentlyLiveInProperty: string;
  bareValueAtTransfer: number;
  bareSettlorAndBeneficiaryValueUnknown: boolean;
  spouseExcludedFromBenefit: 'yes' | 'no' | 'not_sure' | '';

  // Discretionary Trust Settlor fields
  discretionarySettlorTransferWithin7Years: string; // 'yes' | 'no' | ''
  discretionaryTransferMonth: string;
  discretionaryTransferYear: string;
  discretionarySettlorDateUnknown: boolean;
  discretionaryValueAtTransfer: number;
  discretionarySettlorValueUnknown: boolean;
  discretionaryComplexSituation: boolean;

  // Discretionary Trust Beneficiary fields
  discretionaryBeneficiaryTransferWithin7Years: string; // 'yes' | 'no' | 'not_sure' | ''
  discretionaryBeneficiaryTransferMonth: string;
  discretionaryBeneficiaryTransferYear: string;
  discretionaryBeneficiaryDateUnknown: boolean;
  discretionaryBeneficiaryValueAtTransfer: number;
  discretionaryBeneficiaryValueUnknown: boolean;
  discretionaryBeneficiaryInsurancePolicy: 'yes' | 'no' | 'unsure' | '';

  // Discretionary Trust Settlor & Beneficiary fields
  discretionarySettlorAndBeneficiarySpouseExcluded: 'yes' | 'no' | 'not_sure' | '';
}

// ─── Defaults ──────────────────────────────────────────────────

export const TRUST_DATA_DEFAULTS: TrustData = {
  trustName: '',
  trustType: '',
  trustRole: '',
  // Life Interest Settlor (new spec)
  settlorTransferWithin7Years: '',
  settlorTransferMonth: '',
  settlorTransferYear: '',
  settlorTransferValue: 0,
  settlorNoBenefitConfirmed: false,
  // Life Interest Settlor + Beneficial Interest (new spec)
  settlorAndBeneficialBenefitType: '',
  settlorAndBeneficialWantsReview: false,
  // Legacy fields (kept for backwards compatibility)
  reservedBenefit: '',
  payingMarketRent: '',
  creationMonth: '',
  creationYear: '',
  lifeInterestDateUnknown: false,
  lifeInterestValueUnknown: false,
  chainedTrustStructure: false,
  lifeInterestEndingEvents: '',
  // Life Interest Beneficiary
  benefitType: '',
  // New Life Interest fields
  lifeInterestTrustCreationDate: '',
  lifeInterestIsIPDI: '',
  lifeInterestSpouseSuccession: '',
  lifeInterestSharing: '',
  lifeInterestEqualSharingCount: 0,
  lifeInterestUnequalSharingPercentage: 0,
  lifeInterestSuccessiveCurrentTenant: '',
  lifeInterestSuccessiveCurrentStatus: '',
  interestType: '',
  hasComplexCircumstances: false,
  // Remainderman (new spec)
  remaindermanLifeTenantAlive: '',
  remaindermanOwnershipClarification: '',
  remaindermanLifeTenantAge: 0,
  remaindermanTransferWithin7Years: '',
  remaindermanTransferMonth: '',
  remaindermanTransferYear: '',
  remaindermanTransferValue: 0,
  remaindermanTransferDateUnsure: false,
  remaindermanTransferValueUnsure: false,
  remaindermanSettlorAlive: '',
  remaindermanSuccessionBeneficiary: '',
  // Bare Trust Settlor
  bareSettlorTransferWithin7Years: '',
  bareSettlorTransferMonth: '',
  bareSettlorTransferYear: '',
  bareSettlorDateUnknown: false,
  bareSettlorValueUnknown: false,
  // Bare Trust Beneficiary
  bareBeneficiaryPercentage: 0,
  bareBeneficiaryPercentageUnknown: false,
  bareBeneficiaryShareWithOthers: '',
  bareBeneficiaryNumberOfOthers: '',
  bareBeneficiaryEstimatedPercentage: 0,
  bareBeneficiaryTotalUnknownBeneficiaries: 0,
  bareBeneficiaryGiftedByLivingSettlor: '',
  bareBeneficiaryGiftMonth: '',
  bareBeneficiaryGiftYear: '',
  // Bare Trust Settlor & Beneficiary
  currentlyLiveInProperty: '',
  bareValueAtTransfer: 0,
  bareSettlorAndBeneficiaryValueUnknown: false,
  spouseExcludedFromBenefit: '',
  // Discretionary Trust Settlor
  discretionarySettlorTransferWithin7Years: '',
  discretionaryTransferMonth: '',
  discretionaryTransferYear: '',
  discretionarySettlorDateUnknown: false,
  discretionaryValueAtTransfer: 0,
  discretionarySettlorValueUnknown: false,
  discretionaryComplexSituation: false,
  // Discretionary Trust Beneficiary
  discretionaryBeneficiaryTransferMonth: '',
  discretionaryBeneficiaryTransferWithin7Years: '',
  discretionaryBeneficiaryTransferYear: '',
  discretionaryBeneficiaryDateUnknown: false,
  discretionaryBeneficiaryValueAtTransfer: 0,
  discretionaryBeneficiaryValueUnknown: false,
  discretionaryBeneficiaryInsurancePolicy: '',
  // Discretionary Trust Settlor & Beneficiary
  discretionarySettlorAndBeneficiarySpouseExcluded: '',
};

// ─── Maps ──────────────────────────────────────────────────────

/** Maps form trust type string → TrustType enum for saving */
export const formToTrustTypeMap: Record<string, TrustType> = {
  'life_interest': 'life_interest_trust',
  'bare': 'bare_trust',
  'discretionary': 'discretionary_trust',
  'other': 'other_trust',
};

/** Maps TrustType enum → form trust type string for loading */
export const trustTypeToFormMap: Partial<Record<TrustType, 'life_interest' | 'bare' | 'discretionary'>> = {
  'life_interest_trust': 'life_interest',
  'bare_trust': 'bare',
  'discretionary_trust': 'discretionary',
  'settlor_interested_trust': 'discretionary', // Map to discretionary for now
  'interest_in_possession_trust': 'life_interest', // Map to life_interest for now
};

// ─── Role helpers ──────────────────────────────────────────────

/** Returns true if the current trustType + trustRole combination is a settlor role */
export function isSettlorRole(trustData: TrustData): boolean {
  if (trustData.trustType === 'other') return false;
  if (trustData.trustType === 'life_interest') {
    return trustData.trustRole === 'settlor' || trustData.trustRole === 'settlor_and_beneficial_interest';
  }
  return trustData.trustRole.includes('settlor');
}

/** Returns true if the current trustType + trustRole combination is a beneficiary role */
export function isBeneficiaryRole(trustData: TrustData): boolean {
  if (trustData.trustType === 'other') return false;
  if (trustData.trustType === 'life_interest') {
    return trustData.trustRole === 'life_interest' ||
           trustData.trustRole === 'remainderman' ||
           trustData.trustRole === 'settlor_and_beneficial_interest' ||
           trustData.trustRole === 'beneficiary'; // Legacy
  }
  return trustData.trustRole.includes('beneficiary');
}

// ─── Role-aware switch helpers (7 total) ───────────────────────
// Each helper selects the correct TrustData alias for the current
// trustType + trustRole combination, avoiding stale data from
// previously-selected roles. Uses ?? (nullish coalescing) throughout.

/** Helper 1: getTransferValue — 6 form aliases → PropertyAsset.trustTransferValue */
function getTransferValue(td: TrustData): number | undefined {
  const { trustType, trustRole } = td;
  if (trustType === 'life_interest') {
    if (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest')
      return td.settlorTransferValue ?? undefined;
    if (trustRole === 'remainderman') return td.remaindermanTransferValue ?? undefined;
  }
  if (trustType === 'bare') {
    if (trustRole === 'settlor') return td.bareValueAtTransfer ?? undefined;
    if (trustRole === 'settlor_and_beneficiary') return td.bareValueAtTransfer ?? undefined;
  }
  if (trustType === 'discretionary') {
    if (trustRole === 'settlor') return td.discretionaryValueAtTransfer ?? undefined;
    if (trustRole === 'beneficiary') return td.discretionaryBeneficiaryValueAtTransfer ?? undefined;
  }
  return undefined;
}

/** Helper 2: getTransferMonth — 5 form aliases → PropertyAsset.trustTransferMonth */
function getTransferMonth(td: TrustData): string | undefined {
  const { trustType, trustRole } = td;
  if (trustType === 'life_interest') {
    if (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest')
      return td.settlorTransferMonth ?? undefined;
    if (trustRole === 'remainderman') return td.remaindermanTransferMonth ?? undefined;
  }
  if (trustType === 'bare') {
    if (trustRole === 'settlor') return td.bareSettlorTransferMonth ?? undefined;
  }
  if (trustType === 'discretionary') {
    if (trustRole === 'settlor') return td.discretionaryTransferMonth ?? undefined;
    if (trustRole === 'beneficiary') return td.discretionaryBeneficiaryTransferMonth ?? undefined;
  }
  return undefined;
}

/** Helper 3: getTransferYear — 5 form aliases → PropertyAsset.trustTransferYear */
function getTransferYear(td: TrustData): string | undefined {
  const { trustType, trustRole } = td;
  if (trustType === 'life_interest') {
    if (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest')
      return td.settlorTransferYear ?? undefined;
    if (trustRole === 'remainderman') return td.remaindermanTransferYear ?? undefined;
  }
  if (trustType === 'bare') {
    if (trustRole === 'settlor') return td.bareSettlorTransferYear ?? undefined;
  }
  if (trustType === 'discretionary') {
    if (trustRole === 'settlor') return td.discretionaryTransferYear ?? undefined;
    if (trustRole === 'beneficiary') return td.discretionaryBeneficiaryTransferYear ?? undefined;
  }
  return undefined;
}

/** Helper 4: getTransferDateUnknown — 5 form aliases → PropertyAsset.trustTransferDateUnknown */
function getTransferDateUnknown(td: TrustData): boolean | undefined {
  const { trustType, trustRole } = td;
  if (trustType === 'life_interest') {
    if (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest')
      return td.lifeInterestDateUnknown ?? undefined;
    if (trustRole === 'remainderman') return td.remaindermanTransferDateUnsure ?? undefined;
  }
  if (trustType === 'bare') {
    if (trustRole === 'settlor') return td.bareSettlorDateUnknown ?? undefined;
  }
  if (trustType === 'discretionary') {
    if (trustRole === 'settlor') return td.discretionarySettlorDateUnknown ?? undefined;
    if (trustRole === 'beneficiary') return td.discretionaryBeneficiaryDateUnknown ?? undefined;
  }
  return undefined;
}

/** Helper 5: getTransferValueUnknown — 6 form aliases → PropertyAsset.trustTransferValueUnknown */
function getTransferValueUnknown(td: TrustData): boolean | undefined {
  const { trustType, trustRole } = td;
  if (trustType === 'life_interest') {
    if (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest')
      return td.lifeInterestValueUnknown ?? undefined;
    if (trustRole === 'remainderman') return td.remaindermanTransferValueUnsure ?? undefined;
  }
  if (trustType === 'bare') {
    if (trustRole === 'settlor') return td.bareSettlorValueUnknown ?? undefined;
    if (trustRole === 'settlor_and_beneficiary') return td.bareSettlorAndBeneficiaryValueUnknown ?? undefined;
  }
  if (trustType === 'discretionary') {
    if (trustRole === 'settlor') return td.discretionarySettlorValueUnknown ?? undefined;
    if (trustRole === 'beneficiary') return td.discretionaryBeneficiaryValueUnknown ?? undefined;
  }
  return undefined;
}

/**
 * Helper 6: getTransferWithin7Years — LI Settlor/S&BI + LI Remainderman + Bare Settlor + Discretionary Settlor/S&B + Discretionary Beneficiary
 * String → boolean: 'yes' → true, 'no' → false, '' → undefined
 */
function getTransferWithin7Years(td: TrustData): boolean | undefined {
  if (td.trustType === 'life_interest' &&
      (td.trustRole === 'settlor' || td.trustRole === 'settlor_and_beneficial_interest')) {
    if (td.settlorTransferWithin7Years === 'yes') return true;
    if (td.settlorTransferWithin7Years === 'no') return false;
  }
  if (td.trustType === 'life_interest' && td.trustRole === 'remainderman') {
    if (td.remaindermanTransferWithin7Years === 'yes') return true;
    if (td.remaindermanTransferWithin7Years === 'no') return false;
    // 'not_sure' falls through to return undefined
  }
  if (td.trustType === 'bare' && td.trustRole === 'settlor') {
    if (td.bareSettlorTransferWithin7Years === 'yes') return true;
    if (td.bareSettlorTransferWithin7Years === 'no') return false;
  }
  if (td.trustType === 'discretionary' &&
      (td.trustRole === 'settlor' || td.trustRole === 'settlor_and_beneficiary')) {
    if (td.discretionarySettlorTransferWithin7Years === 'yes') return true;
    if (td.discretionarySettlorTransferWithin7Years === 'no') return false;
  }
  if (td.trustType === 'discretionary' && td.trustRole === 'beneficiary') {
    if (td.discretionaryBeneficiaryTransferWithin7Years === 'yes') return true;
    if (td.discretionaryBeneficiaryTransferWithin7Years === 'no') return false;
    // 'not_sure' → undefined
  }
  return undefined;
}

/**
 * Helper 7: getOccupiedByOwner — ONLY Bare S&B
 * String → boolean: 'yes' → true, 'no' → false, '' → undefined
 */
function getOccupiedByOwner(td: TrustData): boolean | undefined {
  if (td.trustType === 'bare' && td.trustRole === 'settlor_and_beneficiary') {
    if (td.currentlyLiveInProperty === 'yes') return true;
    if (td.currentlyLiveInProperty === 'no') return false;
  }
  return undefined;
}

// ─── Save mapping ──────────────────────────────────────────────

/**
 * Builds the PropertyAsset transfer data from form state.
 * Calls all 7 role-aware helpers to map the correct form alias
 * to the single stored field on PropertyAsset.
 */
export function buildPropertyTransferData(trustData: TrustData): Partial<PropertyAsset> {
  return {
    trustTransferValue: getTransferValue(trustData),
    trustTransferMonth: getTransferMonth(trustData),
    trustTransferYear: getTransferYear(trustData),
    trustTransferDateUnknown: getTransferDateUnknown(trustData),
    trustTransferValueUnknown: getTransferValueUnknown(trustData),
    trustTransferWithin7Years: getTransferWithin7Years(trustData),
    occupiedByOwner: getOccupiedByOwner(trustData),
  };
}

/** Convert a BeneficiaryAssignment array to TrustBeneficiary[] for persistence */
function mapToTrustBeneficiaries(assignments: BeneficiaryAssignment[]) {
  return assignments.map(b => ({
    id: b.id,
    type: b.type as 'person' | 'group' | 'myself',
    percentage: b.percentage ?? 0,
    isManuallyEdited: false,
  }));
}

/**
 * Builds the Trust entity data from form state.
 *
 * Both sandbox and normal save paths call this function.
 * Only populates sub-objects relevant to the current trustType + trustRole.
 * Uses role-aware switches to prevent stale data from previous role selections.
 */
export function buildTrustEntityData(params: {
  trustData: TrustData;
  remaindermen: BeneficiaryAssignment[];
  bareBeneficiaries: BeneficiaryAssignment[];
  bareCoBeneficiaries: BeneficiaryAssignment[];
  userId: string;
  assetIds: string[];
  createdInContext: 'property' | 'investments' | 'other';
}): Omit<Trust, 'id' | 'createdAt' | 'updatedAt'> {
  const { trustData, remaindermen, bareBeneficiaries, bareCoBeneficiaries, userId, assetIds, createdInContext } = params;
  const { trustType, trustRole } = trustData;

  // ── Top-level fields ──
  const chainedTrustStructure = trustData.chainedTrustStructure || undefined;
  const preFinanceAct2006 = (trustData.lifeInterestTrustCreationDate || undefined) as
    'before_2006' | 'on_or_after_2006' | undefined;

  // ── Settlor sub-object ──
  const settlor: Trust['settlor'] = isSettlorRole(trustData) ? {
    reservedBenefit: (trustData.reservedBenefit ? (trustData.reservedBenefit === 'none' ? 'none' : 'yes') : 'none') as 'yes' | 'none',
    benefitDescription: trustData.reservedBenefit && trustData.reservedBenefit !== 'none' ? trustData.reservedBenefit : undefined,
    beneficiaries: mapToTrustBeneficiaries(bareBeneficiaries),
    trusteeIds: [] as string[],
    // Life Interest Settlor / S&BI sub-object
    ...(trustType === 'life_interest' && (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest') ? {
      lifeInterest: {
        noBenefitConfirmed: trustData.settlorNoBenefitConfirmed,
        payingMarketRent: (trustData.payingMarketRent ?? '') as 'yes' | 'no' | '',
        lifeInterestEndingEvents: trustData.lifeInterestEndingEvents ?? '',
        remaindermen: mapToTrustBeneficiaries(remaindermen),
        beneficialInterestType: trustData.settlorAndBeneficialBenefitType ?? '',
        wantsReview: trustData.settlorAndBeneficialWantsReview,
      },
    } : {}),
    // Discretionary Settlor (pure settlor, not S&B)
    ...(trustType === 'discretionary' && trustRole === 'settlor' ? {
      discretionaryComplexSituation: trustData.discretionaryComplexSituation,
    } : {}),
  } : undefined;

  // ── Beneficiary sub-object ──
  const isSB = trustRole === 'settlor_and_beneficiary' || trustRole === 'settlor_and_beneficial_interest';
  const beneficiary: Trust['beneficiary'] = isBeneficiaryRole(trustData) ? {
    entitlementType: (trustData.interestType || undefined) as 'right_to_income' | 'right_to_use' | 'both' | 'other' | undefined,
    rightOfOccupation: trustData.currentlyLiveInProperty === 'yes',
    benefitDescription: '',
    isSettlorOfThisTrust: isSB ? 'yes' as const : 'no' as const,
    // Spouse exclusion for bare S&B — stored on existing field
    spouseExcludedFromBenefit: (trustType === 'bare' && isSB)
      ? (trustData.spouseExcludedFromBenefit || undefined) as 'yes' | 'no' | 'not_sure' | undefined
      : undefined,
    // isIPDI — only for life interest beneficiary
    ...(trustType === 'life_interest' && trustRole === 'life_interest' && trustData.lifeInterestIsIPDI ? {
      isIPDI: trustData.lifeInterestIsIPDI as 'yes' | 'no' | 'not-sure',
    } : {}),
    // Life Interest Beneficiary (life tenant) sub-object
    ...(trustType === 'life_interest' && trustRole === 'life_interest' ? {
      lifeInterest: {
        spouseSuccession: (trustData.lifeInterestSpouseSuccession ?? '') as 'yes' | 'no' | '',
        sharing: (trustData.lifeInterestSharing ?? '') as 'not_shared' | 'shared_equally' | 'shared_unequally' | 'successive' | '',
        equalSharingCount: trustData.lifeInterestEqualSharingCount ?? 0,
        unequalSharingPercentage: trustData.lifeInterestUnequalSharingPercentage ?? 0,
        successiveCurrentTenant: trustData.lifeInterestSuccessiveCurrentTenant ?? '',
        successiveCurrentStatus: (trustData.lifeInterestSuccessiveCurrentStatus ?? '') as 'not_started' | 'active' | 'not_sure' | '',
        hasComplexCircumstances: trustData.hasComplexCircumstances,
      },
    } : {}),
    // Life Interest Remainderman sub-object
    ...(trustType === 'life_interest' && trustRole === 'remainderman' ? {
      remainderman: {
        lifeTenantAlive: (trustData.remaindermanLifeTenantAlive ?? '') as 'yes' | 'no' | 'not_sure' | '',
        ownershipClarification: (trustData.remaindermanOwnershipClarification ?? '') as 'now_own' | 'not_sure' | '',
        lifeTenantAge: trustData.remaindermanLifeTenantAge ?? 0,
        settlorAlive: (trustData.remaindermanSettlorAlive ?? '') as 'yes' | 'no' | 'not_sure' | '',
        successionBeneficiary: trustData.remaindermanSuccessionBeneficiary ?? '',
      },
    } : {}),
    // Bare Beneficiary — full sub-object
    ...(trustType === 'bare' && trustRole === 'beneficiary' ? {
      bare: {
        percentage: trustData.bareBeneficiaryPercentage ?? 0,
        percentageUnknown: trustData.bareBeneficiaryPercentageUnknown,
        shareWithOthers: (trustData.bareBeneficiaryShareWithOthers ?? '') as 'yes' | 'no' | '',
        numberOfOthers: trustData.bareBeneficiaryNumberOfOthers ?? '',
        giftedByLivingSettlor: (trustData.bareBeneficiaryGiftedByLivingSettlor ?? '') as 'yes_less_than_7' | 'yes_more_than_7' | 'no_not_sure' | '',
        giftMonth: trustData.bareBeneficiaryGiftMonth ?? '',
        giftYear: trustData.bareBeneficiaryGiftYear ?? '',
        coBeneficiaries: mapToTrustBeneficiaries(bareCoBeneficiaries),
      },
    } : {}),
    // Bare S&B — only coBeneficiaries (scoped save per plan Section 3D)
    ...(trustType === 'bare' && trustRole === 'settlor_and_beneficiary' ? {
      bare: {
        percentage: 0,
        percentageUnknown: false,
        shareWithOthers: '' as 'yes' | 'no' | '',
        numberOfOthers: '',
        giftedByLivingSettlor: '' as 'yes_less_than_7' | 'yes_more_than_7' | 'no_not_sure' | '',
        giftMonth: '',
        giftYear: '',
        coBeneficiaries: mapToTrustBeneficiaries(bareCoBeneficiaries),
      },
    } : {}),
    // Discretionary Beneficiary — flattened field
    ...(trustType === 'discretionary' && trustRole === 'beneficiary' ? {
      discretionaryInsurancePolicy: (trustData.discretionaryBeneficiaryInsurancePolicy || undefined) as 'yes' | 'no' | 'unsure' | '' | undefined,
    } : {}),
    // Discretionary S&B — flattened fields
    ...(trustType === 'discretionary' && trustRole === 'settlor_and_beneficiary' ? {
      discretionarySettlorBeneficiarySpouseExcluded: (trustData.discretionarySettlorAndBeneficiarySpouseExcluded || undefined) as 'yes' | 'no' | 'not_sure' | '' | undefined,
      discretionarySettlorBeneficiaryComplexSituation: trustData.discretionaryComplexSituation,
    } : {}),
  } : undefined;

  return {
    userId,
    name: trustData.trustName,
    type: formToTrustTypeMap[trustData.trustType] || 'bare_trust',
    creationMonth: trustData.creationMonth ?? '',
    creationYear: trustData.creationYear ?? '',
    userRole: (trustType === 'other' ? undefined : trustRole) as TrustRole | undefined,
    chainedTrustStructure,
    preFinanceAct2006,
    assetIds,
    createdInContext,
    settlor,
    beneficiary,
  };
}

// ─── Load mapping ──────────────────────────────────────────────

/** Convert boolean stored field → string form field ('yes'/'no'/'') */
function boolToYesNo(val: boolean | undefined): string {
  if (val === true) return 'yes';
  if (val === false) return 'no';
  return '';
}

/**
 * Derive trustRole from Trust entity.
 * Returns `trust.userRole` directly, or empty string if not yet set.
 */
function deriveTrustRole(trust: Trust): string {
  return trust.userRole ?? '';
}

/**
 * Maps a Trust entity + PropertyAsset back to the TrustData form state.
 *
 * Uses `trust.userRole` to determine which sub-objects to unpack.
 * Populates ALL form field aliases from single stored fields (e.g.
 * settlorTransferValue and remaindermanTransferValue both from
 * property.trustTransferValue, gated by role).
 *
 * Uses ?? (nullish coalescing) throughout to handle 0 correctly.
 */
export function loadTrustToFormData(trust: Trust, property?: PropertyAsset): TrustData {
  const mappedTrustType = trustTypeToFormMap[trust.type] || '';
  const trustRole = deriveTrustRole(trust);

  // Start from defaults, then overlay stored values per role
  const data: TrustData = {
    ...TRUST_DATA_DEFAULTS,
    // ── Core fields (always loaded) ──
    trustName: trust.name,
    trustType: (mappedTrustType || '') as TrustData['trustType'],
    trustRole,
    creationMonth: trust.creationMonth ?? '',
    creationYear: trust.creationYear ?? '',
    // Benefit type (auto-derived from role)
    benefitType: mappedTrustType === 'life_interest' && trustRole === 'remainderman'
      ? 'remainderman'
      : mappedTrustType === 'life_interest' && (trustRole === 'life_interest' || trustRole === 'beneficiary')
        ? 'life_interest'
        : '',
    // Settlor base fields
    reservedBenefit: trust.settlor?.reservedBenefit === 'yes' ? 'yes' : '',
    // Trust-level fields
    chainedTrustStructure: trust.chainedTrustStructure ?? false,
    lifeInterestTrustCreationDate: trust.preFinanceAct2006 ?? '',
  };

  // ── PropertyAsset transfer fields → populate ALL aliases by role ──
  if (property) {
    const transferValue = property.trustTransferValue;
    const transferMonth = property.trustTransferMonth;
    const transferYear = property.trustTransferYear;
    const dateUnknown = property.trustTransferDateUnknown;
    const valueUnknown = property.trustTransferValueUnknown;
    const within7Years = property.trustTransferWithin7Years;
    const occupied = property.occupiedByOwner;

    if (mappedTrustType === 'life_interest') {
      if (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest') {
        data.settlorTransferValue = transferValue ?? 0;
        data.settlorTransferMonth = transferMonth ?? '';
        data.settlorTransferYear = transferYear ?? '';
        data.lifeInterestDateUnknown = dateUnknown ?? false;
        data.lifeInterestValueUnknown = valueUnknown ?? false;
        data.settlorTransferWithin7Years = boolToYesNo(within7Years);
      }
      if (trustRole === 'remainderman') {
        // 4-way gateway mapping: true→'yes', false→'no', undefined+dateUnknown→'not_sure', else ''
        if (within7Years === true) {
          data.remaindermanTransferWithin7Years = 'yes';
        } else if (within7Years === false) {
          data.remaindermanTransferWithin7Years = 'no';
        } else if (within7Years === undefined && (dateUnknown ?? false)) {
          data.remaindermanTransferWithin7Years = 'not_sure';
        } else {
          data.remaindermanTransferWithin7Years = '';
        }
        data.remaindermanTransferValue = transferValue ?? 0;
        data.remaindermanTransferMonth = transferMonth ?? '';
        data.remaindermanTransferYear = transferYear ?? '';
        data.remaindermanTransferDateUnsure = dateUnknown ?? false;
        data.remaindermanTransferValueUnsure = valueUnknown ?? false;
      }
    }
    if (mappedTrustType === 'bare') {
      if (trustRole === 'settlor') {
        data.bareSettlorTransferWithin7Years = boolToYesNo(within7Years);
        data.bareSettlorTransferMonth = transferMonth ?? '';
        data.bareSettlorTransferYear = transferYear ?? '';
        data.bareValueAtTransfer = transferValue ?? 0;
        data.bareSettlorDateUnknown = dateUnknown ?? false;
        data.bareSettlorValueUnknown = valueUnknown ?? false;
      }
      if (trustRole === 'settlor_and_beneficiary') {
        data.bareValueAtTransfer = transferValue ?? 0;
        data.bareSettlorAndBeneficiaryValueUnknown = valueUnknown ?? false;
        data.currentlyLiveInProperty = boolToYesNo(occupied);
      }
    }
    if (mappedTrustType === 'discretionary') {
      if (trustRole === 'settlor' || trustRole === 'settlor_and_beneficiary') {
        data.discretionarySettlorTransferWithin7Years = boolToYesNo(within7Years);
        data.discretionaryValueAtTransfer = transferValue ?? 0;
        data.discretionaryTransferMonth = transferMonth ?? '';
        data.discretionaryTransferYear = transferYear ?? '';
        data.discretionarySettlorDateUnknown = dateUnknown ?? false;
        data.discretionarySettlorValueUnknown = valueUnknown ?? false;
      }
      if (trustRole === 'beneficiary') {
        // Load gateway: true→'yes', false→'no', undefined+dateUnknown→'not_sure', else ''
        if (within7Years === true) {
          data.discretionaryBeneficiaryTransferWithin7Years = 'yes';
        } else if (within7Years === false) {
          data.discretionaryBeneficiaryTransferWithin7Years = 'no';
        } else if (within7Years === undefined && (dateUnknown ?? false)) {
          data.discretionaryBeneficiaryTransferWithin7Years = 'not_sure';
        } else {
          data.discretionaryBeneficiaryTransferWithin7Years = '';
        }
        data.discretionaryBeneficiaryValueAtTransfer = transferValue ?? 0;
        data.discretionaryBeneficiaryTransferMonth = transferMonth ?? '';
        data.discretionaryBeneficiaryTransferYear = transferYear ?? '';
        data.discretionaryBeneficiaryDateUnknown = dateUnknown ?? false;
        data.discretionaryBeneficiaryValueUnknown = valueUnknown ?? false;
      }
    }
  }

  // ── Settlor sub-object fields ──
  const sli = trust.settlor?.lifeInterest;
  if (sli && mappedTrustType === 'life_interest' && (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest')) {
    data.settlorNoBenefitConfirmed = sli.noBenefitConfirmed ?? false;
    data.payingMarketRent = sli.payingMarketRent ?? '';
    data.lifeInterestEndingEvents = sli.lifeInterestEndingEvents ?? '';
    data.settlorAndBeneficialBenefitType = sli.beneficialInterestType ?? '';
    data.settlorAndBeneficialWantsReview = sli.wantsReview ?? false;
  }
  if (mappedTrustType === 'discretionary' && trustRole === 'settlor') {
    data.discretionaryComplexSituation = trust.settlor?.discretionaryComplexSituation ?? false;
  }

  // ── Beneficiary sub-object fields ──
  data.interestType = trust.beneficiary?.entitlementType ?? '';

  // Life Interest Beneficiary (life tenant)
  const bli = trust.beneficiary?.lifeInterest;
  if (bli && mappedTrustType === 'life_interest' && trustRole === 'life_interest') {
    data.lifeInterestIsIPDI = trust.beneficiary?.isIPDI ?? '';
    data.lifeInterestSpouseSuccession = bli.spouseSuccession ?? '';
    data.lifeInterestSharing = bli.sharing ?? '';
    data.lifeInterestEqualSharingCount = bli.equalSharingCount ?? 0;
    data.lifeInterestUnequalSharingPercentage = bli.unequalSharingPercentage ?? 0;
    data.lifeInterestSuccessiveCurrentTenant = bli.successiveCurrentTenant ?? '';
    data.lifeInterestSuccessiveCurrentStatus = bli.successiveCurrentStatus ?? '';
    data.hasComplexCircumstances = bli.hasComplexCircumstances ?? false;
  }

  // Life Interest Remainderman
  const brm = trust.beneficiary?.remainderman;
  if (brm && mappedTrustType === 'life_interest' && trustRole === 'remainderman') {
    data.remaindermanLifeTenantAlive = brm.lifeTenantAlive ?? '';
    data.remaindermanOwnershipClarification = brm.ownershipClarification ?? '';
    data.remaindermanLifeTenantAge = brm.lifeTenantAge ?? 0;
    data.remaindermanSettlorAlive = brm.settlorAlive ?? '';
    data.remaindermanSuccessionBeneficiary = brm.successionBeneficiary ?? '';
  }

  // Bare Beneficiary
  const bbr = trust.beneficiary?.bare;
  if (bbr && mappedTrustType === 'bare' && trustRole === 'beneficiary') {
    data.bareBeneficiaryPercentage = bbr.percentage ?? 0;
    data.bareBeneficiaryPercentageUnknown = bbr.percentageUnknown ?? false;
    data.bareBeneficiaryShareWithOthers = bbr.shareWithOthers ?? '';
    data.bareBeneficiaryNumberOfOthers = bbr.numberOfOthers ?? '';
    data.bareBeneficiaryGiftedByLivingSettlor = bbr.giftedByLivingSettlor ?? '';
    data.bareBeneficiaryGiftMonth = bbr.giftMonth ?? '';
    data.bareBeneficiaryGiftYear = bbr.giftYear ?? '';
  }

  // Bare S&B — currentlyLiveInProperty already handled via PropertyAsset above
  // spouseExcludedFromBenefit for bare S&B
  if (mappedTrustType === 'bare' && trustRole === 'settlor_and_beneficiary') {
    data.spouseExcludedFromBenefit = (trust.beneficiary?.spouseExcludedFromBenefit ?? '') as TrustData['spouseExcludedFromBenefit'];
  }

  // Discretionary Beneficiary
  if (mappedTrustType === 'discretionary' && trustRole === 'beneficiary') {
    data.discretionaryBeneficiaryInsurancePolicy = (trust.beneficiary?.discretionaryInsurancePolicy ?? '') as TrustData['discretionaryBeneficiaryInsurancePolicy'];
  }

  // Discretionary S&B
  if (mappedTrustType === 'discretionary' && trustRole === 'settlor_and_beneficiary') {
    data.discretionarySettlorAndBeneficiarySpouseExcluded = (trust.beneficiary?.discretionarySettlorBeneficiarySpouseExcluded ?? '') as TrustData['discretionarySettlorAndBeneficiarySpouseExcluded'];
    data.discretionaryComplexSituation = trust.beneficiary?.discretionarySettlorBeneficiaryComplexSituation ?? false;
  }

  return data;
}

/** Convert a TrustBeneficiary[] from the Trust entity to BeneficiaryAssignment[] for component state */
function mapFromTrustBeneficiaries(
  beneficiaries?: Array<{ id: string; type: string; percentage?: number }>
): BeneficiaryAssignment[] {
  if (!beneficiaries || beneficiaries.length === 0) return [];
  return beneficiaries.map(b => ({
    id: b.id,
    type: b.type as 'person' | 'group' | 'estate',
    percentage: b.percentage ?? 0,
  }));
}

/**
 * Loads state arrays from a Trust entity.
 * Reads remaindermen, bareBeneficiaries, and bareCoBeneficiaries from
 * their respective locations on the Trust entity.
 */
export function loadStateArrays(trust: Trust): {
  remaindermen: BeneficiaryAssignment[];
  bareBeneficiaries: BeneficiaryAssignment[];
  bareCoBeneficiaries: BeneficiaryAssignment[];
} {
  return {
    remaindermen: mapFromTrustBeneficiaries(trust.settlor?.lifeInterest?.remaindermen),
    bareBeneficiaries: mapFromTrustBeneficiaries(trust.settlor?.beneficiaries),
    bareCoBeneficiaries: mapFromTrustBeneficiaries(trust.beneficiary?.bare?.coBeneficiaries),
  };
}
