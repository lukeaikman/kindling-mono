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

import type { BeneficiaryAssignments, BeneficiaryAssignment, Asset, PersonActions, BeneficiaryGroupActions } from '../types';
import { getPersonFullName, getPersonRelationshipDisplay } from './helpers';

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
  return Math.abs(total - 100) < 0.01; // 0.01 tolerance for floating point
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
  beneficiaryGroupActions: BeneficiaryGroupActions
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
    const relationship = getPersonRelationshipDisplay(person);
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

  const names = zeroEntries.map(b => getBeneficiaryDisplayName(b, personActions, beneficiaryGroupActions));

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

