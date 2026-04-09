/**
 * Spacing constants for consistent layout throughout the app
 * Based on an 8px grid system
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Typography constants
 * Font sizes and weights used throughout the app
 */
export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Shadow constants for elevation
 * iOS and Android compatible shadow definitions
 */
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * Border radius constants
 */
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/**
 * Screen dimensions helper
 * Use for responsive design decisions
 */
import { Dimensions } from 'react-native';

export const Screen = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
  isSmall: Dimensions.get('window').width < 375,
  isMedium: Dimensions.get('window').width >= 375 && Dimensions.get('window').width < 768,
  isLarge: Dimensions.get('window').width >= 768,
} as const;

