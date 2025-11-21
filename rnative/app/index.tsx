import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';
import { KindlingColors } from '../src/styles/theme';
import { Typography, Spacing } from '../src/styles/constants';

/**
 * Main entry screen for the Kindling app
 * This will be replaced with the actual onboarding/splash screen
 * 
 * Currently shows a placeholder screen demonstrating the theme system
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kindling App</Text>
      <Text style={styles.subtitle}>React Native Migration - Phase 1 Complete</Text>
      <Button 
        mode="contained" 
        style={styles.button}
        onPress={() => console.log('Button pressed')}
      >
        Get Started
      </Button>
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

