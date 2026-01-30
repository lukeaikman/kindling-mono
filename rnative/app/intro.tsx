import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef(0);

  const handleLogoPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      router.push('/developer/dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.8}>
            <KindlingLogo size="lg" variant="dark" showText />
          </TouchableOpacity>
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
