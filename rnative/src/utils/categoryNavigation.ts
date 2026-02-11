/**
 * Category Navigation Utilities
 *
 * Hub-and-spoke routing helpers for the Estate section.
 * Provides canonical category ordering, route helpers, and
 * category metadata lookups.
 *
 * @module utils/categoryNavigation
 */

// ---------------------------------------------------------------------------
// Canonical category ordering
// ---------------------------------------------------------------------------

/**
 * Categories displayed in this order everywhere in the app.
 * Rationale: biggest/most-common assets first, specialist/niche last.
 */
export const CANONICAL_CATEGORY_ORDER: string[] = [
  'property',
  'bank-accounts',
  'pensions',
  'investment',
  'life-insurance',
  'private-company-shares',
  'assets-held-through-business',
  'important-items',
  'crypto-currency',
  'agricultural-assets',
];

/**
 * Sort an array of category IDs into canonical display order.
 * Categories not in the canonical list sort to the end.
 */
export const sortByCanonicalOrder = (categories: string[]): string[] => {
  return [...categories].sort((a, b) => {
    const ai = CANONICAL_CATEGORY_ORDER.indexOf(a);
    const bi = CANONICAL_CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
};

// ---------------------------------------------------------------------------
// Route map
// ---------------------------------------------------------------------------

/** Map category IDs to their screen routes */
const CATEGORY_ROUTES: Record<string, { intro: string; entry: string; summary: string }> = {
  'property': {
    intro: '/bequeathal/property/intro',
    entry: '/bequeathal/property/entry',
    summary: '/bequeathal/property/summary',
  },
  'bank-accounts': {
    intro: '/bequeathal/bank-accounts/intro',
    entry: '/bequeathal/bank-accounts/entry',
    summary: '/bequeathal/bank-accounts/summary',
  },
  'investment': {
    intro: '/bequeathal/investment/intro',
    entry: '/bequeathal/investment/entry',
    summary: '/bequeathal/investment/summary',
  },
  'pensions': {
    intro: '/bequeathal/pensions/intro',
    entry: '/bequeathal/pensions/entry',
    summary: '/bequeathal/pensions/summary',
  },
  'life-insurance': {
    intro: '/bequeathal/life-insurance/intro',
    entry: '/bequeathal/life-insurance/entry',
    summary: '/bequeathal/life-insurance/summary',
  },
  'private-company-shares': {
    intro: '/bequeathal/private-company-shares/intro',
    entry: '/bequeathal/private-company-shares/entry',
    summary: '/bequeathal/private-company-shares/summary',
  },
  'assets-held-through-business': {
    intro: '/bequeathal/assets-held-through-business/intro',
    entry: '/bequeathal/assets-held-through-business/entry',
    summary: '/bequeathal/assets-held-through-business/summary',
  },
  'agricultural-assets': {
    intro: '/bequeathal/agricultural-assets/intro',
    entry: '/bequeathal/agricultural-assets/entry',
    summary: '/bequeathal/agricultural-assets/summary',
  },
  'crypto-currency': {
    intro: '/bequeathal/crypto-currency/intro',
    entry: '/bequeathal/crypto-currency/entry',
    summary: '/bequeathal/crypto-currency/summary',
  },
  'important-items': {
    intro: '/bequeathal/important-items/intro',
    entry: '/bequeathal/important-items/entry',
    summary: '/bequeathal/important-items/summary',
  },
};

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

/** Get the intro screen route for a category */
export const getCategoryIntroRoute = (categoryId: string): string => {
  return CATEGORY_ROUTES[categoryId]?.intro || '/estate-dashboard';
};

/** Get the entry screen route for a category */
export const getCategoryEntryRoute = (categoryId: string): string => {
  return CATEGORY_ROUTES[categoryId]?.entry || '/estate-dashboard';
};

/** Get the summary screen route for a category */
export const getCategorySummaryRoute = (categoryId: string): string => {
  return CATEGORY_ROUTES[categoryId]?.summary || '/estate-dashboard';
};

/**
 * Hub-and-spoke routing: determines where tapping a category card should go.
 * - Assets exist → summary screen
 * - No assets → intro screen
 */
export const getCategoryRoute = (categoryId: string, assetCount: number): string => {
  return assetCount > 0
    ? getCategorySummaryRoute(categoryId)
    : getCategoryIntroRoute(categoryId);
};

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

export interface CategoryMeta {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/** Full metadata for all categories, in canonical order */
export const CATEGORY_META: CategoryMeta[] = [
  { id: 'property', label: 'Property', icon: 'home', description: 'Houses, flats, land, and other real estate' },
  { id: 'bank-accounts', label: 'Bank Accounts', icon: 'piggy-bank', description: 'Current accounts, savings, ISAs' },
  { id: 'pensions', label: 'Pensions', icon: 'shield', description: 'Workplace and private pensions' },
  { id: 'investment', label: 'Investments', icon: 'trending-up', description: 'Stocks, shares, bonds, funds' },
  { id: 'life-insurance', label: 'Life Insurance', icon: 'shield-account', description: 'Life insurance policies and payouts' },
  { id: 'private-company-shares', label: 'Private Company Shares', icon: 'office-building', description: 'Shares in private companies' },
  { id: 'assets-held-through-business', label: 'Assets Held Through Business', icon: 'domain', description: 'Assets owned by your business' },
  { id: 'important-items', label: 'Important Items', icon: 'diamond', description: 'Jewellery, art, collectibles, heirlooms' },
  { id: 'crypto-currency', label: 'Cryptocurrency', icon: 'bitcoin', description: 'Bitcoin, Ethereum, and other crypto' },
  { id: 'agricultural-assets', label: 'Agricultural Assets', icon: 'nature', description: 'Farmland, livestock, equipment' },
];

/** Look up a category's display label by ID */
export const getCategoryLabel = (categoryId: string): string => {
  return CATEGORY_META.find(c => c.id === categoryId)?.label || categoryId;
};

/** Look up a category's icon by ID */
export const getCategoryIcon = (categoryId: string): string => {
  return CATEGORY_META.find(c => c.id === categoryId)?.icon || 'folder';
};
