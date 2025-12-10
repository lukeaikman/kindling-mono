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

