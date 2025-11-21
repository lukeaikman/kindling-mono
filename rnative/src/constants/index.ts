/**
 * Constants and initial data structures for the Kindling app
 * Migrated from web prototype
 * 
 * @module constants
 */

import { WillData, BequeathalData, Person, Business, Trust } from '../types';

/**
 * AsyncStorage keys for persisting app data
 * Used by the useAppState hook to save/load state
 */
export const STORAGE_KEYS = {
  WILL_DATA: 'kindling-will-data',
  PERSON_DATA: 'kindling-person-data',
  BUSINESS_DATA: 'kindling-business-data',
  BEQUEATHAL_DATA: 'kindling-bequeathal-data',
  TRUST_DATA: 'kindling-trusts',
  RELATIONSHIP_DATA: 'kindling-relationships',
  BENEFICIARY_GROUP_DATA: 'kindling-beneficiary-groups',
  ESTATE_REMAINDER_DATA: 'kindling-estate-remainder',
  IHT_DRAWER_STATE: 'kindling-iht-drawer-state',
  ONBOARDING_DATA: 'kindling-onboarding-data',
  QUIZ_ANSWERS: 'kindling-quiz-answers',
} as const;

/**
 * Get initial will data structure with default values
 * @returns {WillData} Initial will data object with empty arrays and default values
 */
export const getInitialWillData = (): WillData => ({
  userId: '', // Will be set when user Person is created during onboarding
  willType: 'simple',
  status: 'draft',
  executors: [],
  guardianship: {},
  alignment: {},
  createdAt: new Date(),
  updatedAt: new Date()
});

/**
 * Get initial person data structure (empty array)
 * @returns {Person[]} Empty array representing no people yet
 */
export const getInitialPersonData = (): Person[] => [];

/**
 * Get initial business data structure (empty array)
 * @returns {Business[]} Empty array representing no businesses yet
 */
export const getInitialBusinessData = (): Business[] => [];

/**
 * Get initial bequeathal data structure with default values
 * @returns {BequeathalData} Initial bequeathal data object with empty arrays for all asset categories
 */
export const getInitialBequeathalData = (): BequeathalData => ({
  property: [],
  'important-items': [],
  investment: [],
  pensions: [],
  'life-insurance': [],
  'bank-accounts': [],
  'private-company-shares': [],
  'assets-held-through-business': [],
  'debts-credit': [],
  'agricultural-assets': [],
  'crypto-currency': [],
  other: [],
  selectedCategories: new Set(),
  totalEstimatedValue: 0,
  totalNetValue: 0,
  lastUpdated: new Date()
});

/**
 * Get initial trust data structure (empty array)
 * @returns {Trust[]} Empty array representing no trusts yet
 */
export const getInitialTrustData = (): Trust[] => [];

/**
 * Predefined beneficiary group templates
 * These are used to create BeneficiaryGroup records on demand when user selects them
 */
export const PREDEFINED_GROUP_TEMPLATES = [
  { name: 'Children', description: 'All your children' },
  { name: 'Grandchildren', description: 'All your grandchildren' },
  { name: 'Great Grandchildren', description: 'All your great grandchildren' },
  { name: 'Siblings', description: 'All your brothers and sisters' },
  { name: 'Parents', description: 'Your parents' },
  { name: 'Cousins', description: 'All your cousins' },
  { name: 'Friends', description: 'All your friends' }
] as const;

