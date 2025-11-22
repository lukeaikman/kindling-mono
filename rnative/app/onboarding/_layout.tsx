/**
 * Onboarding Layout
 * 
 * Layout for all onboarding screens
 * Uses stack navigation with no headers
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="location" />
      <Stack.Screen name="family" />
      <Stack.Screen name="extended-family" />
      <Stack.Screen name="wrap-up" />
    </Stack>
  );
}

