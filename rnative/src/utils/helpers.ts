/**
 * Helper functions for the Kindling app
 * Migrated from web prototype
 * 
 * @module utils/helpers
 */

import { Person, PersonRelationshipType, RelationshipType } from '../types';

/**
 * Get the full name of a person (first name + last name)
 * @param {Person} person - The person object
 * @returns {string} The full name as a string
 */
export const getPersonFullName = (person: Person): string => {
  return `${person.firstName} ${person.lastName}`.trim();
};

/**
 * Get the display label for a person's relationship type
 * @param {Person} person - The person object
 * @returns {string} The display label for the relationship (e.g., "Spouse", "Biological child")
 */
export const getPersonRelationshipDisplay = (person: Person): string => {
  if (person.relationship === 'other' && person.customRelationship) {
    return person.customRelationship;
  }
  
  // Convert relationship type to display string
  const relationshipMap: Record<PersonRelationshipType, string> = {
    'spouse': 'Spouse',
    'partner': 'Partner',
    'ex-spouse': 'Ex-Spouse',
    'ex-partner': 'Ex-Partner',
    'biological-child': 'Biological child',
    'adopted-child': 'Adopted child',
    'stepchild': 'Stepchild',
    'parent': 'Parent',
    'sibling': 'Sibling',
    'grandparent': 'Grandparent',
    'grandchild': 'Grandchild',
    'uncle-aunt': 'Uncle/Aunt',
    'nephew-niece': 'Nephew/Niece',
    'cousin': 'Cousin',
    'friend': 'Friend',
    'colleague': 'Colleague',
    'solicitor': 'Solicitor',
    'accountant': 'Accountant',
    'other': 'Other'
  };
  
  return relationshipMap[person.relationship] || person.relationship;
};

// =============================================================================
// New RelationshipType System Helpers (aligned with relationship edge store)
// =============================================================================

/**
 * Convert legacy PersonRelationshipType to new RelationshipType + qualifiers
 * Used when migrating data or interfacing with old forms
 */
export const legacyToRelationshipType = (
  legacy: PersonRelationshipType
): { type: RelationshipType; qualifiers?: Record<string, boolean> } | null => {
  switch (legacy) {
    case 'spouse':
    case 'ex-spouse':
      return { type: RelationshipType.SPOUSE };
    case 'partner':
    case 'ex-partner':
      return { type: RelationshipType.PARTNER };
    case 'biological-child':
      return { type: RelationshipType.PARENT_OF, qualifiers: { biological: true } };
    case 'adopted-child':
      return { type: RelationshipType.PARENT_OF, qualifiers: { adoptive: true } };
    case 'stepchild':
      return { type: RelationshipType.PARENT_OF, qualifiers: { step: true } };
    case 'sibling':
      return { type: RelationshipType.SIBLING_OF };
    case 'friend':
      return { type: RelationshipType.FRIEND };
    // Professional/non-kinship relationships not tracked in edge store
    case 'solicitor':
    case 'accountant':
    case 'colleague':
    case 'parent':
    case 'grandparent':
    case 'grandchild':
    case 'other':
      return null;
    default:
      return null;
  }
};

/**
 * Get relationship options for parent-child relationships
 * Aligned with RelationshipType.PARENT_OF + qualifiers
 * @returns {Array} Array of relationship option objects with value, label, relationshipType, and qualifiers
 */
export const getParentChildRelationshipOptions = () => [
  { 
    value: 'biological-child', 
    label: 'Biological child',
    relationshipType: RelationshipType.PARENT_OF,
    qualifiers: { biological: true }
  },
  { 
    value: 'adopted-child', 
    label: 'Adopted child',
    relationshipType: RelationshipType.PARENT_OF,
    qualifiers: { adoptive: true }
  },
  { 
    value: 'stepchild', 
    label: 'Stepchild',
    relationshipType: RelationshipType.PARENT_OF,
    qualifiers: { step: true }
  },
  { 
    value: 'foster-child', 
    label: 'Foster child',
    relationshipType: RelationshipType.PARENT_OF,
    qualifiers: { foster: true }
  },
  { 
    value: 'other', 
    label: 'Other',
    relationshipType: RelationshipType.PARENT_OF,
    qualifiers: {}
  }
];

/**
 * Get human-readable label for a relationship value
 * @param {string} relationshipValue - The stored relationship value (e.g., 'biological-child')
 * @returns {string} Human-readable label (e.g., 'Biological child')
 */
export const getRelationshipLabel = (relationshipValue: string): string => {
  // Check parent-child relationships
  const parentChildOption = getParentChildRelationshipOptions().find(opt => opt.value === relationshipValue);
  if (parentChildOption) return parentChildOption.label;
  
  // Check spouse/partner relationships
  const spousePartnerOption = getSpousePartnerRelationshipOptions().find(opt => opt.value === relationshipValue);
  if (spousePartnerOption) return spousePartnerOption.label;
  
  // Check general kinship relationships
  const kinshipOption = getKinshipRelationshipOptions().find(opt => opt.value === relationshipValue);
  if (kinshipOption) return kinshipOption.label;
  
  // If not found in predefined options, capitalize the value for display
  // e.g., 'biological-child' -> 'Biological Child' or custom text like 'Ward' -> 'Ward'
  return relationshipValue
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get relationship options for spouse/partner relationships
 * Aligned with RelationshipType.SPOUSE/PARTNER
 * @returns {Array} Array of relationship option objects with value, label, and relationshipType
 */
export const getSpousePartnerRelationshipOptions = () => [
  { 
    value: 'spouse', 
    label: 'Spouse',
    relationshipType: RelationshipType.SPOUSE
  },
  { 
    value: 'partner', 
    label: 'Partner',
    relationshipType: RelationshipType.PARTNER
  }
];

/**
 * Get relationship options for general family members
 * Includes relationships tracked in the edge store
 * @returns {Array} Array of relationship option objects with value, label, relationshipType, and optional qualifiers
 */
export const getKinshipRelationshipOptions = () => [
  { value: 'spouse', label: 'Spouse', relationshipType: RelationshipType.SPOUSE },
  { value: 'partner', label: 'Partner', relationshipType: RelationshipType.PARTNER },
  { value: 'biological-child', label: 'Biological child', relationshipType: RelationshipType.PARENT_OF, qualifiers: { biological: true } },
  { value: 'adopted-child', label: 'Adopted child', relationshipType: RelationshipType.PARENT_OF, qualifiers: { adoptive: true } },
  { value: 'stepchild', label: 'Stepchild', relationshipType: RelationshipType.PARENT_OF, qualifiers: { step: true } },
  { value: 'sibling', label: 'Sibling', relationshipType: RelationshipType.SIBLING_OF },
  { value: 'friend', label: 'Friend', relationshipType: RelationshipType.FRIEND },
  { value: 'other', label: 'Other', relationshipType: RelationshipType.OTHER_TIE }
];

/**
 * Get qualifiers from legacy relationship type string
 * @param {string} legacy - The legacy relationship type string
 * @returns {Record<string, boolean>} Object with qualifier flags (biological, adoptive, step, foster)
 */
export const getQualifiersFromLegacyType = (legacy: string): Record<string, boolean> => {
  const qualifiers: Record<string, boolean> = {};
  if (legacy === 'biological-child') qualifiers.biological = true;
  if (legacy === 'adopted-child') qualifiers.adoptive = true;
  if (legacy === 'stepchild') qualifiers.step = true;
  if (legacy === 'foster-child') qualifiers.foster = true;
  return qualifiers;
};

/**
 * Get display label for relationship type with qualifiers
 * @param {RelationshipType} type - The relationship type enum value
 * @param {Record<string, boolean>} [qualifiers] - Optional qualifiers object (biological, adoptive, step, etc.)
 * @returns {string} Human-readable display label (e.g., "Biological child", "Half-sibling")
 */
export const getRelationshipTypeDisplay = (
  type: RelationshipType, 
  qualifiers?: Record<string, boolean>
): string => {
  if (type === RelationshipType.PARENT_OF && qualifiers) {
    if (qualifiers.biological) return 'Biological child';
    if (qualifiers.adoptive) return 'Adopted child';
    if (qualifiers.step) return 'Stepchild';
    if (qualifiers.foster) return 'Foster child';
    return 'Child';
  }
  
  if (type === RelationshipType.SIBLING_OF && qualifiers) {
    if (qualifiers.half) return 'Half-sibling';
    if (qualifiers.step) return 'Step-sibling';
    return 'Sibling';
  }
  
  const typeDisplayMap: Record<RelationshipType, string> = {
    [RelationshipType.SPOUSE]: 'Spouse',
    [RelationshipType.PARTNER]: 'Partner',
    [RelationshipType.PARENT_OF]: 'Child',
    [RelationshipType.SIBLING_OF]: 'Sibling',
    [RelationshipType.AUNT_UNCLE_OF]: 'Aunt/Uncle',
    [RelationshipType.COUSIN_OF]: 'Cousin',
    [RelationshipType.GUARDIAN_OF]: 'Guardian',
    [RelationshipType.FRIEND]: 'Friend',
    [RelationshipType.OTHER_TIE]: 'Other'
  };
  
  return typeDisplayMap[type] || type;
};

// =============================================================================
// React Native Specific Helpers
// =============================================================================

/**
 * Format currency amount for display (£ prefix, thousands separators)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "£1,234.56")
 */
export const formatCurrency = (amount: number): string => {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Format percentage for display (with % suffix)
 * @param {number} percentage - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string (e.g., "25.5%")
 */
export const formatPercentage = (percentage: number, decimals: number = 1): string => {
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Parse currency string to number
 * Removes £, commas, and other non-numeric characters
 * @param {string} currencyString - The currency string to parse
 * @returns {number} Parsed number value
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[£,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UK phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid UK phone format
 */
export const isValidUKPhone = (phone: string): boolean => {
  // Remove spaces and common separators
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // UK phone numbers: +44 followed by 10 digits OR 0 followed by 10 digits
  const ukPhoneRegex = /^(\+44|0)[0-9]{10}$/;
  return ukPhoneRegex.test(cleaned);
};

/**
 * Format UK postcode (uppercase with space)
 * @param {string} postcode - Postcode to format
 * @returns {string} Formatted postcode
 */
export const formatPostcode = (postcode: string): string => {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  // Insert space before last 3 characters (e.g., WD173DP -> WD17 3DP)
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
  }
  return cleaned;
};

/**
 * Generate a random UUID (React Native compatible)
 * Uses crypto.randomUUID() if available, otherwise falls back to a simple implementation
 * @returns {string} UUID string
 */
export const generateUUID = (): string => {
  // Check if crypto.randomUUID is available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older React Native versions
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Truncate string to maximum length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
};

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date of birth in ISO format (YYYY-MM-DD)
 * @returns {number} Age in years
 */
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format date for display (e.g., "15 January 2024")
 * @param {Date | string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

