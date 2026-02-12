/**
 * Utility Functions
 * 
 * Barrel export for all utility modules
 * @module utils
 */

// Executor helpers
export {
  getDisplayRoleLabel,
  getDropdownRoleLabel,
  getAvailableLevels,
} from './executorHelpers';

// Date helpers
export {
  calculateAge,
  isUnder18,
  formatDateForDisplay,
  parseDateFromDisplay,
} from './dateHelpers';

// Clipboard helpers
export {
  copyToClipboard,
  getFromClipboard,
} from './clipboardHelpers';

// Asset helpers
export {
  formatCurrency,
  parseCurrency,
  calculateTotalValue,
  calculateTotalNetValue,
  groupAssetsByType,
  getDefaultAsset,
  isAssetValid,
  isAssetComplete,
  getAssetTypeLabel,
  getAssetDisplayTitle,
} from './assetHelpers';

// Beneficiary helpers
export {
  getAllocationType,
  getTotalAllocated,
  validatePercentageAllocation,
  getBeneficiaryDisplayName,
  getAssetsForBeneficiary,
  calculateBeneficiaryInheritance,
} from './beneficiaryHelpers';// Category navigation
export {
  getCategoryIntroRoute,
  getCategoryEntryRoute,
  getNextCategoryRoute,
  getFirstCategoryRoute,
} from './categoryNavigation';