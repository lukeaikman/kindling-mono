/**
 * Category Navigation Utilities
 * 
 * Helper functions for navigating between asset category screens
 * based on user's selected categories.
 * 
 * @module utils/categoryNavigation
 */

/**
 * Map category IDs to their intro screen routes
 */
const CATEGORY_ROUTES: Record<string, { intro: string; entry: string }> = {
  'property': {
    intro: '/bequeathal/property/intro',
    entry: '/bequeathal/property/entry',
  },
  'bank-accounts': {
    intro: '/bequeathal/bank-accounts/intro',
    entry: '/bequeathal/bank-accounts/entry',
  },
  'investment': {
    intro: '/bequeathal/investment/intro',
    entry: '/bequeathal/investment/entry',
  },
  'pensions': {
    intro: '/bequeathal/pensions/intro',
    entry: '/bequeathal/pensions/entry',
  },
  'life-insurance': {
    intro: '/bequeathal/life-insurance/intro',
    entry: '/bequeathal/life-insurance/entry',
  },
  'private-company-shares': {
    intro: '/bequeathal/private-company-shares/intro',
    entry: '/bequeathal/private-company-shares/entry',
  },
  'assets-held-through-business': {
    intro: '/bequeathal/assets-held-through-business/intro',
    entry: '/bequeathal/assets-held-through-business/entry',
  },
  'agricultural-assets': {
    intro: '/bequeathal/agricultural-assets/intro',
    entry: '/bequeathal/agricultural-assets/entry',
  },
  'crypto-currency': {
    intro: '/bequeathal/crypto-currency/intro',
    entry: '/bequeathal/crypto-currency/entry',
  },
  'important-items': {
    intro: '/bequeathal/important-items/intro',
    entry: '/bequeathal/important-items/entry',
  },
};

/**
 * Get the intro screen route for a category
 */
export const getCategoryIntroRoute = (categoryId: string): string => {
  return CATEGORY_ROUTES[categoryId]?.intro || '/order-of-things';
};

/**
 * Get the entry screen route for a category
 */
export const getCategoryEntryRoute = (categoryId: string): string => {
  return CATEGORY_ROUTES[categoryId]?.entry || '/order-of-things';
};

/**
 * Get the next category in the selected list
 * Returns the intro route for the next category, or '/order-of-things' if no more
 */
export const getNextCategoryRoute = (
  currentCategoryId: string,
  selectedCategories: string[]
): string => {
  const currentIndex = selectedCategories.indexOf(currentCategoryId);
  
  // If not found or last in list, go to order-of-things
  if (currentIndex === -1 || currentIndex === selectedCategories.length - 1) {
    return '/order-of-things';
  }
  
  // Get next category intro route
  const nextCategoryId = selectedCategories[currentIndex + 1];
  return getCategoryIntroRoute(nextCategoryId);
};

/**
 * Get the first category intro route from selected list
 */
export const getFirstCategoryRoute = (selectedCategories: string[]): string => {
  if (selectedCategories.length === 0) {
    return '/order-of-things';
  }
  return getCategoryIntroRoute(selectedCategories[0]);
};




