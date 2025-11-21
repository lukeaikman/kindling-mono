import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { kindlingTheme } from '../src/styles/theme';

/**
 * Root layout component for Expo Router
 * Wraps the entire app with React Native Paper theme provider
 * using Kindling's custom brand colors and design system
 */
export default function RootLayout() {
  return (
    <PaperProvider theme={kindlingTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </PaperProvider>
  );
}

