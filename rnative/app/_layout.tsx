import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { kindlingTheme } from '../src/styles/theme';
import { NetworkProvider } from '../src/context/NetworkContext';
import { NetWealthToastProvider, useNetWealthToast } from '../src/context/NetWealthToastContext';
import { NetWealthToast } from '../src/components/ui/NetWealthToast';

/**
 * Inner layout that can consume the NetWealthToast context.
 * Renders the navigation stack + the global toast overlay.
 */
function AppContent() {
  const { toast, hide } = useNetWealthToast();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="intro" />
        <Stack.Screen name="auth" />
      </Stack>
      <NetWealthToast
        visible={toast.visible}
        fromValue={toast.fromValue}
        toValue={toast.toValue}
        onHide={hide}
      />
    </>
  );
}

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={kindlingTheme}>
        <NetworkProvider>
          <NetWealthToastProvider>
            <AppContent />
          </NetWealthToastProvider>
        </NetworkProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

