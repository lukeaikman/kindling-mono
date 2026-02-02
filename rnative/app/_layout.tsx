import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { kindlingTheme } from '../src/styles/theme';
import { NetworkProvider } from '../src/context/NetworkContext';

/**
 * Root layout component for Expo Router
 * Wraps the entire app with React Native Paper theme provider
 * using Kindling's custom brand colors and design system
 * 
 * Note: React Native Paper v5 requires explicit icon configuration.
 * The theme must include version: 3 to enable MD3 components properly.
 */
export default function RootLayout() {
  return (
    <PaperProvider theme={kindlingTheme}>
      <NetworkProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="intro" />
          <Stack.Screen name="auth" />
        </Stack>
      </NetworkProvider>
    </PaperProvider>
  );
}

