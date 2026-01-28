/**
 * Main entry screen for the Kindling app
 * 
 * Displays the animated splash screen which handles:
 * - Seamless handoff from native LaunchScreen
 * - Animated logo transition
 * - Optional biometric authentication
 * - Navigation to the appropriate destination
 */

import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from '../src/components/splash';

export default function Index() {
  return (
    <>
      <SplashScreen
        navigateTo="/intro"
        // Note: Update navigateTo based on user state or deeplinks
        // For example:
        // - First-time users: /onboarding/welcome
        // - Returning users: /dashboard or wherever appropriate
        // - Deeplinks: pass navigationParams
      />
      <StatusBar style="light" />
    </>
  );
}
