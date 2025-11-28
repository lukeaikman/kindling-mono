/**
 * Clipboard Utility Functions
 * 
 * Helpers for copying data to clipboard with React Native/Expo
 * 
 * @module utils/clipboardHelpers
 */

import * as Clipboard from 'expo-clipboard';

/**
 * Copy data to clipboard
 * Accepts strings or objects (will be JSON stringified)
 * 
 * @param data - String or object to copy
 * @returns Promise<boolean> - true if successful, false if failed
 * 
 * @example
 * ```tsx
 * const success = await copyToClipboard(personData);
 * if (success) {
 *   showToast('Copied to clipboard!');
 * }
 * ```
 */
export const copyToClipboard = async (data: any): Promise<boolean> => {
  try {
    const text = typeof data === 'string' 
      ? data 
      : JSON.stringify(data, null, 2);
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Get text from clipboard
 * 
 * @returns Promise<string> - clipboard contents
 */
export const getFromClipboard = async (): Promise<string> => {
  try {
    return await Clipboard.getStringAsync();
  } catch (error) {
    console.error('Failed to get clipboard contents:', error);
    return '';
  }
};

