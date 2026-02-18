/**
 * Main entry screen for the Kindling app
 * 
 * Displays the animated splash screen which handles:
 * - Seamless handoff from native LaunchScreen
 * - Animated logo transition
 * - Optional biometric authentication
 * - Navigation to the appropriate destination
 *
 * In __DEV__ builds on iOS, checks for a Detox seed flag via the
 * Settings API (NSUserDefaults) and writes pre-onboarded state before
 * the SplashScreen mounts, eliminating a write/read race condition.
 */

import React, { useState, useEffect } from 'react';
import { Settings, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from '../src/components/splash';

export default function Index() {
  const [ready, setReady] = useState(!__DEV__);

  useEffect(() => {
    if (__DEV__ && Platform.OS === 'ios') {
      const shouldSeed = Settings.get('detoxSeedState');
      if (shouldSeed) {
        const { seedTestState } = require('../src/utils/detoxSeedState');
        seedTestState()
          .then(() => setReady(true))
          .catch((err: unknown) => {
            console.error('Detox seed failed:', err);
            setReady(true);
          });
        return;
      }
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      <SplashScreen navigateTo="/intro" />
      <StatusBar style="light" />
    </>
  );
}
