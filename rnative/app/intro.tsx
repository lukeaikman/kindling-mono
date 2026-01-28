import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from '../src/components/ui/Button';
import { KindlingLogo } from '../src/components/ui/KindlingLogo';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography } from '../src/styles/constants';

/**
 * First Onboarding Screen (Entry Point)
 * Routes users to start onboarding or login.
 */
export default function IntroScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <KindlingLogo size="lg" variant="dark" showText />
          <Text style={styles.tagline}>Protect today. Build tomorrow.</Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button variant="primary" onPress={() => router.push('/onboarding/welcome')}>
            Start Creating Your Will And Estate Plan
          </Button>
          <Button variant="outline" onPress={() => router.push('/auth/login')}>
            Login
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.cream,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  logoBlock: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: Spacing.md,
  },
});
