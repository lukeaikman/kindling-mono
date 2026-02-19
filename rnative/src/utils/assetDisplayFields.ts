/**
 * Asset Display Fields
 *
 * Returns type-specific display fields, titles, and sublines for each asset type.
 * All slug values are humanised through formatter functions so the UI never
 * shows raw database identifiers.
 *
 * @module utils/assetDisplayFields
 */

import type {
  Asset,
  PropertyAsset,
  BankAccountAsset,
  InvestmentAsset,
  PensionAsset,
  LifeInsuranceAsset,
  PrivateCompanySharesAsset,
  AssetsHeldThroughBusinessAsset,
  AgriculturalAsset,
  CryptoCurrencyAsset,
  ImportantItemAsset,
} from '../types';

export interface DisplayField {
  label: string;
  value: string;
}

// ===========================================================================
// Formatting helpers — every slug → human-readable label
// ===========================================================================

function formatPropertyType(type: string): string {
  const map: Record<string, string> = {
    'residential': 'Residential',
    'commercial': 'Commercial',
    'land': 'Land',
    'other': 'Other',
    'primary_residence': 'Primary residence',
    'second_home': 'Second home',
    'holiday_home': 'Holiday home',
    'buy_to_let': 'Buy-to-let',
    'furnished_holiday_let': 'Furnished holiday let',
    'mixed_use_property': 'Mixed-use property',
    'agricultural_property': 'Agricultural property',
  };
  return map[type] || type;
}

function formatOwnership(type: string): string {
  const map: Record<string, string> = {
    'sole': 'Sole owner',
    'joint-tenants': 'Joint tenants',
    'tenants-in-common': 'Tenants in common',
    'personally_owned': 'Personally owned',
    'jointly_owned': 'Jointly owned',
    'company_owned': 'Owned through company',
    'trust_owned': 'Owned through trust',
  };
  return map[type] || type;
}

function formatAccountType(type: string): string {
  const map: Record<string, string> = {
    'current': 'Current account',
    'savings': 'Savings account',
    'isa': 'ISA',
    'isa-cash': 'Cash ISA',
    'isa-stocks-shares': 'Stocks & Shares ISA',
    'isa-lifetime': 'Lifetime ISA',
    'isa-innovative-finance': 'Innovative Finance ISA',
    'premium-bonds': 'Premium Bonds',
    'fixed-term-deposit': 'Fixed-term deposit',
    'fixed-term': 'Fixed-term deposit',
    'notice-account': 'Notice account',
    'other': 'Other',
  };
  return map[type] || type;
}

function formatInvestmentType(type: string): string {
  const map: Record<string, string> = {
    'unknown': 'Unknown',
    'general-investment-account': 'General Investment Account',
    'aim-holdings': 'AIM holdings',
    'isa-stocks-shares': 'Stocks & Shares ISA',
    'cash-isa': 'Cash ISA',
    'direct-crest-holding': 'Direct CREST holding',
    'junior-isa': 'Junior ISA',
    'nsi-products': 'NS&I Products',
    'employee-share-scheme': 'Employee Share Scheme',
    'other': 'Other',
  };
  return map[type] || type;
}

function formatPensionType(type: string): string {
  const map: Record<string, string> = {
    'defined-benefit': 'Defined Benefit',
    'defined-contribution': 'Defined Contribution',
    'sipp': 'SIPP',
    'workplace': 'Workplace pension',
    'unsure': 'Pension',
  };
  return map[type] || type;
}

function formatPolicyType(type: string): string {
  const map: Record<string, string> = {
    'term': 'Term life',
    'whole-life': 'Whole life',
  };
  return map[type] || type;
}

function formatBusinessAssetType(type: string): string {
  const map: Record<string, string> = {
    'property': 'Property',
    'equipment': 'Equipment',
    'vehicles': 'Vehicles',
    'bank-accounts': 'Bank accounts',
    'investments': 'Investments',
    'inventory': 'Inventory',
    'intellectual-property': 'Intellectual property',
    'other': 'Other',
  };
  return map[type] || type;
}

function formatAgriculturalType(type: string): string {
  const map: Record<string, string> = {
    'agricultural-land': 'Agricultural land',
    'farm-buildings': 'Farm buildings',
    'farmhouse': 'Farmhouse',
    'farm-worker-cottage': 'Farm worker cottage',
    'woodland': 'Woodland',
    'stud-farm': 'Stud farm',
    'standing-crops': 'Standing crops',
    'fish-farming': 'Fish farming',
    'agricultural-equipment': 'Agricultural equipment',
    'other': 'Other',
  };
  return map[type] || type;
}

// ===========================================================================
// getAssetTitle — the bold primary label for an asset card
// ===========================================================================

/**
 * Returns the primary title for an asset (address, name, provider, etc.)
 */
export function getAssetTitle(asset: Asset): string {
  switch (asset.type) {
    case 'property': {
      const p = asset as PropertyAsset;
      return p.address?.address1 || p.title || 'Untitled Property';
    }
    case 'bank-accounts': {
      const b = asset as BankAccountAsset;
      return b.provider ? `${b.provider}` : b.title || 'Bank Account';
    }
    case 'investment': {
      const i = asset as InvestmentAsset;
      return i.provider ? `${i.provider}` : i.title || 'Investment';
    }
    case 'pensions': {
      const p = asset as PensionAsset;
      return p.provider ? `${p.provider}` : p.title || 'Pension';
    }
    case 'life-insurance': {
      const l = asset as LifeInsuranceAsset;
      return l.provider ? `${l.provider}` : l.title || 'Life Insurance';
    }
    case 'private-company-shares': {
      const s = asset as PrivateCompanySharesAsset;
      return s.companyName || s.title || 'Company Shares';
    }
    case 'assets-held-through-business': {
      const a = asset as AssetsHeldThroughBusinessAsset;
      return a.businessName || a.title || 'Business Asset';
    }
    case 'agricultural-assets': {
      const a = asset as AgriculturalAsset;
      return a.location || a.title || 'Agricultural Asset';
    }
    case 'crypto-currency': {
      const c = asset as CryptoCurrencyAsset;
      return c.cryptoType ? `${c.cryptoType}` : c.title || 'Cryptocurrency';
    }
    case 'important-items': {
      const i = asset as ImportantItemAsset;
      return i.title || 'Important Item';
    }
    default:
      return asset.title || 'Asset';
  }
}

// ===========================================================================
// getAssetSubline — one-liner subtitle, always human-readable
// ===========================================================================

/**
 * Returns a compact, human-readable one-liner for an asset.
 * e.g. "Stocks & Shares ISA", "Residential · London"
 */
export function getAssetSubline(asset: Asset): string | null {
  switch (asset.type) {
    case 'property': {
      const p = asset as PropertyAsset;
      const parts: string[] = [];
      if (p.propertyType) parts.push(formatPropertyType(p.propertyType));
      if (p.address?.city) parts.push(p.address.city);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'bank-accounts': {
      const b = asset as BankAccountAsset;
      if (b.accountType && b.provider) return `${formatAccountType(b.accountType)} with ${b.provider}`;
      if (b.accountType) return formatAccountType(b.accountType);
      return b.provider ? `Account with ${b.provider}` : null;
    }
    case 'investment': {
      const i = asset as InvestmentAsset;
      if (i.investmentType) return formatInvestmentType(i.investmentType);
      return null;
    }
    case 'pensions': {
      const p = asset as PensionAsset;
      if (p.pensionType && p.provider) return `${formatPensionType(p.pensionType)} with ${p.provider}`;
      if (p.pensionType) return formatPensionType(p.pensionType);
      return p.linkedEmployer ? `Employer: ${p.linkedEmployer}` : null;
    }
    case 'life-insurance': {
      const l = asset as LifeInsuranceAsset;
      if (l.policyType && l.provider) return `${formatPolicyType(l.policyType)} with ${l.provider}`;
      if (l.policyType) return formatPolicyType(l.policyType);
      return l.provider ? `Policy with ${l.provider}` : null;
    }
    case 'private-company-shares': {
      const s = asset as PrivateCompanySharesAsset;
      const parts: string[] = [];
      if (s.percentageOwnership) parts.push(`${s.percentageOwnership}% ownership`);
      if (s.shareClass) parts.push(s.shareClass);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'assets-held-through-business': {
      const a = asset as AssetsHeldThroughBusinessAsset;
      return a.assetType ? formatBusinessAssetType(a.assetType) : null;
    }
    case 'agricultural-assets': {
      const a = asset as AgriculturalAsset;
      const parts: string[] = [];
      if (a.assetType) parts.push(formatAgriculturalType(a.assetType));
      if (a.sizeQuantity) parts.push(a.sizeQuantity);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'crypto-currency': {
      const c = asset as CryptoCurrencyAsset;
      const parts: string[] = [];
      if (c.platform) parts.push(c.platform);
      if (c.quantity) parts.push(`${c.quantity} units`);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'important-items': {
      const i = asset as ImportantItemAsset;
      return i.category || null;
    }
    default:
      return null;
  }
}

// ===========================================================================
// getAssetDisplayFields — detailed field rows (used if needed elsewhere)
// ===========================================================================

/**
 * Returns an array of display fields for an asset, based on its type.
 * Each field has a label and a human-readable value string.
 */
export function getAssetDisplayFields(asset: Asset): DisplayField[] {
  const fields: DisplayField[] = [];

  switch (asset.type) {
    case 'property': {
      const p = asset as PropertyAsset;
      if (p.propertyType) {
        fields.push({ label: 'Type', value: formatPropertyType(p.propertyType) });
      }
      if (p.ownershipType) {
        fields.push({ label: 'Ownership', value: formatOwnership(p.ownershipType) });
      }
      if (p.hasMortgage && p.mortgage?.outstandingAmount) {
        fields.push({ label: 'Mortgage', value: `£${p.mortgage.outstandingAmount.toLocaleString()}` });
      }
      if (p.address?.city) {
        fields.push({ label: 'Location', value: p.address.city });
      }
      break;
    }

    case 'bank-accounts': {
      const b = asset as BankAccountAsset;
      if (b.accountType) {
        fields.push({ label: 'Account type', value: formatAccountType(b.accountType) });
      }
      if (b.ownershipType) {
        fields.push({ label: 'Ownership', value: b.ownershipType === 'joint' ? 'Joint' : 'Personal' });
      }
      break;
    }

    case 'investment': {
      const i = asset as InvestmentAsset;
      if (i.investmentType) {
        fields.push({ label: 'Type', value: formatInvestmentType(i.investmentType) });
      }
      if (i.provider) {
        fields.push({ label: 'Provider', value: i.provider });
      }
      break;
    }

    case 'pensions': {
      const p = asset as PensionAsset;
      if (p.pensionType) {
        fields.push({ label: 'Type', value: formatPensionType(p.pensionType) });
      }
      if (p.linkedEmployer) {
        fields.push({ label: 'Employer', value: p.linkedEmployer });
      }
      break;
    }

    case 'life-insurance': {
      const l = asset as LifeInsuranceAsset;
      if (l.policyType) {
        fields.push({ label: 'Policy type', value: formatPolicyType(l.policyType) });
      }
      if (l.policyNumber) {
        fields.push({ label: 'Policy #', value: l.policyNumber });
      }
      if (l.sumInsured) {
        fields.push({ label: 'Sum insured', value: `£${l.sumInsured.toLocaleString()}` });
      }
      break;
    }

    case 'private-company-shares': {
      const s = asset as PrivateCompanySharesAsset;
      if (s.percentageOwnership) {
        fields.push({ label: 'Ownership', value: `${s.percentageOwnership}%` });
      }
      if (s.shareClass) {
        fields.push({ label: 'Share class', value: s.shareClass });
      }
      break;
    }

    case 'assets-held-through-business': {
      const a = asset as AssetsHeldThroughBusinessAsset;
      if (a.assetType) {
        fields.push({ label: 'Asset type', value: formatBusinessAssetType(a.assetType) });
      }
      if (a.businessOwnershipPercentage) {
        fields.push({ label: 'Ownership', value: `${a.businessOwnershipPercentage}%` });
      }
      break;
    }

    case 'agricultural-assets': {
      const a = asset as AgriculturalAsset;
      if (a.assetType) {
        fields.push({ label: 'Type', value: formatAgriculturalType(a.assetType) });
      }
      if (a.sizeQuantity) {
        fields.push({ label: 'Size', value: a.sizeQuantity });
      }
      if (a.ownershipStructure) {
        fields.push({ label: 'Structure', value: a.ownershipStructure });
      }
      break;
    }

    case 'crypto-currency': {
      const c = asset as CryptoCurrencyAsset;
      if (c.platform) {
        fields.push({ label: 'Platform', value: c.platform });
      }
      if (c.quantity) {
        fields.push({ label: 'Quantity', value: String(c.quantity) });
      }
      break;
    }

    case 'important-items': {
      const i = asset as ImportantItemAsset;
      if (i.category) {
        fields.push({ label: 'Category', value: i.category });
      }
      if (i.specificDetails) {
        fields.push({ label: 'Details', value: i.specificDetails });
      }
      break;
    }
  }

  return fields;
}
