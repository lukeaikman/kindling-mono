import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { KindlingColors } from '../src/styles/theme';
import { Typography, Spacing } from '../src/styles/constants';

/**
 * Main entry screen for the Kindling app
 * Redirects to onboarding welcome screen
 */
export default function Index() {
  useEffect(() => {
    // Auto-redirect to onboarding after a brief delay
    const timer = setTimeout(() => {
      router.replace('/onboarding/welcome');
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kindling</Text>
      <Text style={styles.subtitle}>Loading...</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  text: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    color: KindlingColors.navy,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.mutedForeground,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.md,
  },
});

