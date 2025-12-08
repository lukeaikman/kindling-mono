/**
 * Asset Helper Utilities
 * 
 * Formatting, validation, and calculation utilities for asset management.
 * Follows KISS principle - simple, focused functions.
 * 
 * @module utils/assetHelpers
 */

import { Asset, AssetType, BankAccountAsset, CryptoCurrencyAsset, ImportantItemAsset } from '../types';

/**
 * Format number as currency (£)
 * 
 * @param value - Numeric value to format
 * @returns Formatted currency string (e.g., "£1,234.56")
 * 
 * @example
 * formatCurrency(1234.56) // "£1,234.56"
 * formatCurrency(0) // "£0.00"
 */
export function formatCurrency(value: number): string {
  return `£${value.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse currency string to number
 * Strips £, commas, and whitespace
 * 
 * @param input - Currency string (e.g., "£1,234.56" or "1234")
 * @returns Numeric value or 0 if invalid
 * 
 * @example
 * parseCurrency("£1,234.56") // 1234.56
 * parseCurrency("1234") // 1234
 * parseCurrency("Not sure") // 0
 */
export function parseCurrency(input: string): number {
  const cleaned = input.replace(/[£,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate total estimated value of assets
 * 
 * @param assets - Array of assets
 * @returns Total estimated value
 */
export function calculateTotalValue(assets: Asset[]): number {
  return assets.reduce((sum, asset) => sum + (asset.estimatedValue || 0), 0);
}

/**
 * Calculate total net value of assets (after debts/mortgages)
 * 
 * @param assets - Array of assets
 * @returns Total net value
 */
export function calculateTotalNetValue(assets: Asset[]): number {
  return assets.reduce((sum, asset) => sum + (asset.netValue || 0), 0);
}

/**
 * Group assets by type
 * 
 * @param assets - Array of assets
 * @returns Record of asset arrays keyed by type
 */
export function groupAssetsByType(assets: Asset[]): Record<AssetType, Asset[]> {
  const grouped: Partial<Record<AssetType, Asset[]>> = {};
  
  assets.forEach(asset => {
    if (!grouped[asset.type]) {
      grouped[asset.type] = [];
    }
    grouped[asset.type]!.push(asset);
  });
  
  return grouped as Record<AssetType, Asset[]>;
}

/**
 * Get default asset data for a specific type
 * Provides sensible defaults for new asset creation
 * 
 * @param type - Asset type
 * @returns Partial asset with default values
 */
export function getDefaultAsset(type: AssetType): Partial<Asset> {
  const now = new Date().toISOString();
  
  const base = {
    type,
    title: '',
    description: '',
    estimatedValue: 0,
    netValue: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  // Type-specific defaults
  switch (type) {
    case 'bank-accounts':
      return {
        ...base,
        accountType: 'current',
        ownershipType: 'personal',
        provider: '',
      } as Partial<BankAccountAsset>;
      
    case 'crypto-currency':
      return {
        ...base,
        cryptoType: 'bitcoin',
        platform: '',
        quantity: 0,
      } as Partial<CryptoCurrencyAsset>;
      
    case 'important-items':
      return {
        ...base,
        category: 'other',
        beneficiaryAssignments: {
          beneficiaries: [],
        },
      } as Partial<ImportantItemAsset>;
      
    default:
      return base;
  }
}

/**
 * Validate if asset has required fields
 * Basic validation - checks title and value exist
 * 
 * @param asset - Asset to validate
 * @returns True if asset has minimum required fields
 */
export function isAssetValid(asset: Partial<Asset>): boolean {
  if (!asset.title || asset.title.trim().length === 0) {
    return false;
  }
  
  if (asset.estimatedValue === undefined || asset.estimatedValue < 0) {
    return false;
  }
  
  return true;
}

/**
 * Check if asset is marked as complete
 * Uses status field if available, otherwise checks required fields
 * 
 * @param asset - Asset to check
 * @returns True if asset is complete
 */
export function isAssetComplete(asset: Asset): boolean {
  // Check for explicit status
  if ('status' in asset && asset.status === 'complete') {
    return true;
  }
  
  // Fall back to validation
  return isAssetValid(asset);
}

/**
 * Get human-readable label for asset type
 * 
 * @param type - Asset type
 * @returns Display label
 */
export function getAssetTypeLabel(type: AssetType): string {
  const labels: Record<AssetType, string> = {
    'property': 'Property',
    'bank-accounts': 'Bank Accounts',
    'investment': 'Investments',
    'pensions': 'Pensions',
    'life-insurance': 'Life Insurance',
    'private-company-shares': 'Private Company Shares',
    'assets-held-through-business': 'Assets Held Through Business',
    'agricultural-assets': 'Agricultural Assets',
    'crypto-currency': 'Cryptocurrency',
    'important-items': 'Important Items',
    'debts-credit': 'Debts & Credit',
    'other': 'Other Assets',
  };
  
  return labels[type] || type;
}

/**
 * Generate a display title for an asset
 * Uses asset title or generates one from type and key details
 * 
 * @param asset - Asset to generate title for
 * @returns Display title
 */
export function getAssetDisplayTitle(asset: Asset): string {
  if (asset.title && asset.title.trim().length > 0) {
    return asset.title;
  }
  
  // Generate title from type and key fields
  switch (asset.type) {
    case 'bank-accounts': {
      const bankAsset = asset as BankAccountAsset;
      return `${bankAsset.provider || 'Bank'} Account`;
    }
    
    case 'crypto-currency': {
      const cryptoAsset = asset as CryptoCurrencyAsset;
      return `${cryptoAsset.cryptoType || 'Crypto'} on ${cryptoAsset.platform || 'Platform'}`;
    }
    
    default:
      return getAssetTypeLabel(asset.type);
  }
}
