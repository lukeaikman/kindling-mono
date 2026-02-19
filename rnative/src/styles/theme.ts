import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { configureFonts } from 'react-native-paper';

/**
 * Kindling Brand Colors
 * These colors match the web prototype's design system
 */
export const KindlingColors = {
  // Primary brand colors
  navy: '#293241',
  cream: '#EAE6E5',
  green: '#5B9279',
  lightGreen: '#8FCB9B',
  beige: '#CCB7A4',
  brown: '#8F8073',
  
  // UI colors
  background: '#ffffff',
  destructive: '#ec8686',
  buttonRed: '#c70e0e',
  muted: '#f8f9fa',
  mutedForeground: '#6c757d',
  border: '#e9ecef',
  inputBackground: '#f8f9fa',
} as const;

/**
 * Kindling theme configuration for React Native Paper
 * Extends the Material Design 3 light theme with custom brand colors
 * 
 * Note: Icons are configured in app/_layout.tsx using @expo/vector-icons
 */
export const kindlingTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: KindlingColors.navy,
    secondary: KindlingColors.green,
    tertiary: KindlingColors.lightGreen,
    background: KindlingColors.background,
    surface: KindlingColors.background,
    surfaceVariant: KindlingColors.muted,
    error: KindlingColors.destructive,
    onPrimary: KindlingColors.cream,
    onSecondary: KindlingColors.cream,
    onBackground: KindlingColors.navy,
    onSurface: KindlingColors.navy,
    outline: KindlingColors.border,
  },
  // Custom theme extensions
  roundness: 8,
  // Ensure Paper v5 uses proper Material Design 3 defaults
  version: 3 as const,
};

/**
 * Type for the Kindling theme
 */
export type KindlingTheme = typeof kindlingTheme;

