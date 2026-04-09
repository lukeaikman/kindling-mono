/**
 * AsyncStorage wrapper service for persistent data storage
 * Provides a consistent API for storing and retrieving data in React Native
 * 
 * This service wraps AsyncStorage with type-safe methods and error handling,
 * similar to localStorage in the web prototype but adapted for React Native.
 * 
 * @module services/storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Save data to AsyncStorage
 * Automatically stringifies objects and arrays
 * 
 * @param {string} key - Storage key
 * @param {T} data - Data to store (will be JSON stringified)
 * @returns {Promise<void>}
 */
export const saveData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`[Storage] Failed to save data for key "${key}":`, error);
    throw error;
  }
};

/**
 * Load data from AsyncStorage
 * Automatically parses JSON data
 * 
 * @param {string} key - Storage key
 * @param {T} defaultValue - Default value if key doesn't exist
 * @param {string[]} dateFields - Array of field paths to convert to Date objects
 * @returns {Promise<T>} Stored data or default value
 */
export const loadData = async <T>(
  key: string, 
  defaultValue: T,
  dateFields: string[] = []
): Promise<T> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    
    if (jsonValue === null) {
      return defaultValue;
    }
    
    const parsed = JSON.parse(jsonValue);
    
    // Convert date strings back to Date objects
    if (dateFields.length > 0) {
      convertDates(parsed, dateFields);
    }
    
    return parsed;
  } catch (error) {
    console.warn(`[Storage] Failed to load data for key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Remove data from AsyncStorage
 * 
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to remove data for key "${key}":`, error);
    throw error;
  }
};

/**
 * Clear all data from AsyncStorage
 * Use with caution - this will delete ALL app data
 * 
 * @returns {Promise<void>}
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log('[Storage] All data cleared');
  } catch (error) {
    console.error('[Storage] Failed to clear all data:', error);
    throw error;
  }
};

/**
 * Get all storage keys
 * Useful for debugging and data export
 * 
 * @returns {Promise<readonly string[]>} Array of all storage keys
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('[Storage] Failed to get all keys:', error);
    return [];
  }
};

/**
 * Get multiple values at once
 * More efficient than multiple getItem calls
 * 
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<Record<string, string | null>>} Object mapping keys to values
 */
export const getMultiple = async (keys: string[]): Promise<Record<string, string | null>> => {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(pairs);
  } catch (error) {
    console.error('[Storage] Failed to get multiple keys:', error);
    return {};
  }
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert date string fields to Date objects
 * Mutates the object in place
 * 
 * @param {any} obj - Object to process
 * @param {string[]} dateFields - Array of field paths to convert
 * @param {string} path - Current path (used for recursion)
 */
const convertDates = (obj: any, dateFields: string[], path: string = '') => {
  if (!obj || typeof obj !== 'object') return;
  
  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (dateFields.includes(currentPath) && obj[key]) {
      obj[key] = new Date(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any, index: number) => {
        convertDates(item, dateFields, `${currentPath}[${index}]`);
      });
    } else if (typeof obj[key] === 'object') {
      convertDates(obj[key], dateFields, currentPath);
    }
  }
};

/**
 * Export all storage functions for use in other modules
 */
export const storage = {
  save: saveData,
  load: loadData,
  remove: removeData,
  clearAll,
  getAllKeys: () => getAllKeys(),
  getMultiple: (keys: string[]) => getMultiple(keys),
};

