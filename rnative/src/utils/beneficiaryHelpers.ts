/**
 * Beneficiary Helpers
 * 
 * Pure utility functions for working with beneficiary assignments.
 * Used across all asset types with beneficiaries.
 * 
 * Design: No caching, no stored calculations - always compute fresh from data.
 * 
 * @module utils/beneficiaryHelpers
 */

import type { BeneficiaryAssignments, BeneficiaryAssignment, Asset, PersonActions, BeneficiaryGroupActions, RelationshipActions } from '../types';
import { getPersonFullName } from './helpers';

/**
 * Get allocation type by inspecting data
 * Inferred from presence of percentage/amount fields - not stored
 * 
 * @param assignments - Beneficiary assignments object
 * @returns Allocation type ('none', 'percentage', or 'amount')
 */
export function getAllocationType(
  assignments?: BeneficiaryAssignments
): 'none' | 'percentage' | 'amount' {
  if (!assignments?.beneficiaries.length) return 'none';
  
  const hasPercentage = assignments.beneficiaries.some(b => 
    b.percentage !== undefined && b.percentage !== null
  );
  if (hasPercentage) return 'percentage';
  
  const hasAmount = assignments.beneficiaries.some(b => 
    b.amount !== undefined && b.amount !== null
  );
  if (hasAmount) return 'amount';
  
  return 'none';
}

/**
 * Calculate total allocated (percentage or amount)
 * Always computed fresh - never stale
 * 
 * @param assignments - Beneficiary assignments object
 * @returns Total percentage (0-100) or total amount (£)
 */
export function getTotalAllocated(
  assignments?: BeneficiaryAssignments
): number {
  if (!assignments?.beneficiaries.length) return 0;
  
  const type = getAllocationType(assignments);
  
  if (type === 'percentage') {
    return assignments.beneficiaries.reduce((sum, b) => sum + (b.percentage || 0), 0);
  }
  
  if (type === 'amount') {
    return assignments.beneficiaries.reduce((sum, b) => sum + (b.amount || 0), 0);
  }
  
  return 0;
}

/**
 * Validate percentage allocations
 * Ensures percentages total 100% (with floating point tolerance)
 * 
 * @param assignments - Beneficiary assignments object
 * @returns True if valid (totals 100% within tolerance or not percentage mode)
 */
export function validatePercentageAllocation(
  assignments?: BeneficiaryAssignments
): boolean {
  if (getAllocationType(assignments) !== 'percentage') return true;
  
  const total = getTotalAllocated(assignments);
  return Math.abs(total - 100) <= 0.01;
}

/**
 * Get display name for beneficiary
 * Looks up from Person/Group records - always current, never stale
 * 
 * @param beneficiary - Beneficiary assignment
 * @param personActions - Person actions for lookups
 * @param beneficiaryGroupActions - Group actions for lookups
 * @returns Display name with relationship if person
 */
export function getBeneficiaryDisplayName(
  beneficiary: BeneficiaryAssignment,
  personActions: PersonActions,
  beneficiaryGroupActions: BeneficiaryGroupActions,
  relationshipActions: RelationshipActions
): string {
  if (!beneficiary || !beneficiary.type) {
    return 'Unknown Beneficiary';
  }

  if (beneficiary.type === 'estate') {
    return 'The Estate';
  }
  
  if (beneficiary.type === 'group') {
    const group = beneficiaryGroupActions.getGroupById(beneficiary.id);
    return group?.name || 'Unknown Group';
  }
  
  if (beneficiary.type === 'person') {
    const person = personActions.getPersonById(beneficiary.id);
    if (!person) return 'Unknown Person';
    
    const fullName = getPersonFullName(person);
    const relationship = relationshipActions.getDisplayLabel(person.id);
    return relationship ? `${fullName} (${relationship})` : fullName;
  }
  
  return 'Unknown';
}

// ---------------------------------------------------------------------------
// Zero-percent beneficiary guard (save-time validation)
// ---------------------------------------------------------------------------
// Rule: in percentage mode, persisted beneficiaries must have percentage > 0.
// Anything else is removed or blocked at save time.
// ---------------------------------------------------------------------------

export interface ZeroPercentResult {
  /** Beneficiaries with percentage > 0 — safe to persist */
  cleaned: BeneficiaryAssignment[];
  /** Beneficiaries with missing/0 percentage — candidates for removal */
  zeroEntries: BeneficiaryAssignment[];
  /** Pre-built dialog body copy (single or multi) */
  dialogMessage: string | null;
  /** Pre-built confirm button label */
  confirmLabel: string | null;
  /** Whether the guard detected any zero-percent entries */
  hasZeroEntries: boolean;
}

/**
 * Detect beneficiaries at 0% and build dialog copy for the confirm flow.
 * Pure function — no side effects, no state.
 */
export function detectZeroPercentBeneficiaries(
  beneficiaries: BeneficiaryAssignment[],
  personActions: PersonActions,
  beneficiaryGroupActions: BeneficiaryGroupActions,
  relationshipActions: RelationshipActions,
): ZeroPercentResult {
  const zeroEntries = beneficiaries.filter(
    b => b.percentage === undefined || b.percentage === null || b.percentage <= 0,
  );
  const cleaned = beneficiaries.filter(
    b => b.percentage !== undefined && b.percentage !== null && b.percentage > 0,
  );

  if (zeroEntries.length === 0) {
    return { cleaned, zeroEntries, dialogMessage: null, confirmLabel: null, hasZeroEntries: false };
  }

  const names = zeroEntries.map(b => getBeneficiaryDisplayName(b, personActions, beneficiaryGroupActions, relationshipActions));

  const dialogMessage = zeroEntries.length === 1
    ? `You added "${names[0]}" as a beneficiary but allocated them a 0% share.`
    : `You added ${zeroEntries.length} beneficiaries with a 0% share.`;

  const shortName = zeroEntries.length === 1
    ? (zeroEntries[0].type === 'person'
        ? personActions.getPersonById(zeroEntries[0].id)?.firstName || names[0]
        : names[0])
    : `${zeroEntries.length} Beneficiaries`;

  const confirmLabel = `Save & Remove ${shortName}`;

  return { cleaned, zeroEntries, dialogMessage, confirmLabel, hasZeroEntries: true };
}

/**
 * Get all assets for a specific beneficiary
 * Useful for "Who inherits what?" visualization
 * 
 * @param beneficiaryId - Person, group, or 'estate' ID
 * @param allAssets - All assets in the estate
 * @returns Assets where beneficiary is assigned
 */
export function getAssetsForBeneficiary(
  beneficiaryId: string,
  allAssets: Asset[]
): Asset[] {
  return allAssets.filter(asset =>
    asset.beneficiaryAssignments?.beneficiaries.some(b => b.id === beneficiaryId)
  );
}

/**
 * Calculate total value allocated to beneficiary across all assets
 * Handles percentage, amount, and simple (equal split) allocations
 * 
 * @param beneficiaryId - Person, group, or 'estate' ID
 * @param allAssets - All assets in the estate
 * @returns Total £ value allocated to this beneficiary
 */
export function calculateBeneficiaryInheritance(
  beneficiaryId: string,
  allAssets: Asset[]
): number {
  return allAssets.reduce((total, asset) => {
    const beneficiary = asset.beneficiaryAssignments?.beneficiaries.find(
      b => b.id === beneficiaryId
    );
    
    if (!beneficiary) return total;
    
    const assetValue = asset.estimatedValue || 0;
    
    // Percentage allocation
    if (beneficiary.percentage !== undefined) {
      return total + (assetValue * (beneficiary.percentage / 100));
    }
    
    // Amount allocation
    if (beneficiary.amount !== undefined) {
      return total + beneficiary.amount;
    }
    
    // Simple allocation (split equally among all beneficiaries)
    const beneficiaryCount = asset.beneficiaryAssignments?.beneficiaries.length || 1;
    return total + (assetValue / beneficiaryCount);
  }, 0);
}

// ---------------------------------------------------------------------------
// 100% Wizard — evaluation engine
// ---------------------------------------------------------------------------

export type WizardResult =
  | { rule: 'all_locked'; proportionalResult: BeneficiaryAssignment[] }
  | { rule: 'locked_overcommit'; lockedSum: number }
  | { rule: 'single_unlocked'; result: BeneficiaryAssignment[] }
  | { rule: 'even_auto'; result: BeneficiaryAssignment[] }
  | { rule: 'uneven_popup'; proportionalResult: BeneficiaryAssignment[]; evenResult: BeneficiaryAssignment[] };

function roundTo2dp(n: number): number {
  return Math.round(n * 100) / 100;
}

function applyWizardRounding(beneficiaries: BeneficiaryAssignment[]): BeneficiaryAssignment[] {
  const result = beneficiaries.map(b => ({
    ...b,
    percentage: b.percentage !== undefined ? roundTo2dp(b.percentage) : b.percentage,
  }));

  const total = result.reduce((sum, b) => sum + (b.percentage || 0), 0);
  const diff = roundTo2dp(100 - total);

  if (Math.abs(diff) > 0.001) {
    let adjusted = false;
    for (let i = result.length - 1; i >= 0; i--) {
      if (!result[i].isManuallyEdited && result[i].percentage !== undefined) {
        result[i] = { ...result[i], percentage: roundTo2dp((result[i].percentage || 0) + diff) };
        adjusted = true;
        break;
      }
    }
    if (!adjusted) {
      for (let i = result.length - 1; i >= 0; i--) {
        if (result[i].percentage !== undefined) {
          result[i] = { ...result[i], percentage: roundTo2dp((result[i].percentage || 0) + diff) };
          break;
        }
      }
    }
  }

  return result;
}

function scaleProportionately(
  beneficiaries: BeneficiaryAssignment[],
  locked: BeneficiaryAssignment[],
  unlocked: BeneficiaryAssignment[],
): BeneficiaryAssignment[] {
  const lockedSum = locked.reduce((s, b) => s + (b.percentage || 0), 0);
  const unlockedSum = unlocked.reduce((s, b) => s + (b.percentage || 0), 0);
  const targetSum = 100 - lockedSum;

  if (unlockedSum === 0) {
    return evenDistribution(beneficiaries, locked, unlocked);
  }

  const factor = targetSum / unlockedSum;

  const scaled = beneficiaries.map(b => {
    if (b.isManuallyEdited) return b;
    return { ...b, percentage: (b.percentage || 0) * factor };
  });

  return applyWizardRounding(scaled);
}

function evenDistribution(
  beneficiaries: BeneficiaryAssignment[],
  locked: BeneficiaryAssignment[],
  unlocked: BeneficiaryAssignment[],
): BeneficiaryAssignment[] {
  const lockedSum = locked.reduce((s, b) => s + (b.percentage || 0), 0);
  const available = 100 - lockedSum;
  const share = available / unlocked.length;

  const distributed = beneficiaries.map(b => {
    if (b.isManuallyEdited) return b;
    return { ...b, percentage: share };
  });

  return applyWizardRounding(distributed);
}

function areUnlockedEqual(unlocked: BeneficiaryAssignment[], tolerance = 0.01): boolean {
  const pcts = unlocked.map(b => b.percentage || 0);
  const min = Math.min(...pcts);
  const max = Math.max(...pcts);
  return (max - min) <= tolerance;
}

/**
 * Evaluate which wizard rule applies and compute result(s).
 * Pure function — returns a discriminated union the caller can act on.
 */
export function evaluateWizard(beneficiaries: BeneficiaryAssignment[]): WizardResult {
  const locked = beneficiaries.filter(b => !!b.isManuallyEdited);
  const unlocked = beneficiaries.filter(b => !b.isManuallyEdited);

  // Rule 1: all locked — reuse scaleProportionately treating all as unlocked
  if (unlocked.length === 0) {
    const allAsUnlocked = beneficiaries.map(b => ({ ...b, isManuallyEdited: false }));
    const scaled = scaleProportionately(allAsUnlocked, [], allAsUnlocked);
    return { rule: 'all_locked', proportionalResult: scaled };
  }

  // Rule 2: locked sum >= 100 with unlocked present
  const lockedSum = locked.reduce((s, b) => s + (b.percentage || 0), 0);
  if (lockedSum >= 100) {
    return { rule: 'locked_overcommit', lockedSum: roundTo2dp(lockedSum) };
  }

  // Rule 3: exactly 1 unlocked
  if (unlocked.length === 1) {
    const remainder = roundTo2dp(100 - lockedSum);
    const result = beneficiaries.map(b => {
      if (b.isManuallyEdited) return b;
      return { ...b, percentage: remainder };
    });
    return { rule: 'single_unlocked', result };
  }

  // Rule 4: multiple unlocked, all equal (within tolerance) or all at 0%
  const allZero = unlocked.every(b => !b.percentage || b.percentage === 0);
  if (allZero || areUnlockedEqual(unlocked)) {
    return { rule: 'even_auto', result: evenDistribution(beneficiaries, locked, unlocked) };
  }

  // Rule 5: multiple unlocked, uneven
  return {
    rule: 'uneven_popup',
    proportionalResult: scaleProportionately(beneficiaries, locked, unlocked),
    evenResult: evenDistribution(beneficiaries, locked, unlocked),
  };
}

