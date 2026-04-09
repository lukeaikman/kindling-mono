import { Stack } from 'expo-router';

/**
 * Auth layout for login/registration screens.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
