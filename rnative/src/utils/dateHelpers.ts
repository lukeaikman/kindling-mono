/**
 * Date Utility Functions
 * 
 * Provides functions for date calculations and age validation.
 * 
 * @module utils/dateHelpers
 */

/**
 * Calculate age from a date of birth string
 * 
 * @param dateOfBirth - Date of birth in YYYY-MM-DD format
 * @returns Age in years, or null if invalid date
 * 
 * @example
 * ```tsx
 * calculateAge('2000-01-15'); // 24 (assuming current year is 2024)
 * calculateAge(''); // null
 * ```
 */
export const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  const today = new Date();
  
  // Check for invalid date
  if (isNaN(dob.getTime())) return null;
  
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    return age - 1;
  }
  
  return age;
};

/**
 * Check if a person is under 18 years old
 * 
 * @param dateOfBirth - Date of birth in YYYY-MM-DD format (optional)
 * @returns True if person is under 18, false otherwise
 * 
 * @example
 * ```tsx
 * isUnder18('2010-06-15'); // true
 * isUnder18('1990-01-01'); // false
 * isUnder18(undefined); // false
 * ```
 */
export const isUnder18 = (dateOfBirth?: string): boolean => {
  if (!dateOfBirth) return false;
  
  const age = calculateAge(dateOfBirth);
  return age !== null && age < 18;
};

/**
 * Format a date string to DD-MM-YYYY for display
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in DD-MM-YYYY format
 * 
 * @example
 * ```tsx
 * formatDateForDisplay('2024-01-15'); // "15-01-2024"
 * ```
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Parse a DD-MM-YYYY date string to YYYY-MM-DD for storage
 * 
 * @param displayDate - Date string in DD-MM-YYYY format
 * @returns Date string in YYYY-MM-DD format
 * 
 * @example
 * ```tsx
 * parseDateFromDisplay('15-01-2024'); // "2024-01-15"
 * ```
 */
export const parseDateFromDisplay = (displayDate: string): string => {
  if (!displayDate) return '';
  
  const parts = displayDate.split('-');
  if (parts.length !== 3) return displayDate;
  
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
};





