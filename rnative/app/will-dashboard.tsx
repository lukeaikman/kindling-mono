/**
 * Will Dashboard Screen
 *
 * Simplified dashboard with three stages and a signing section
 * Replaces the complex checklist with a calm, momentum-driven view
 *
 * "Three short steps, then done"
 */

import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { Button } from '../src/components/ui/Button';
import { BackButton } from '../src/components/ui/BackButton';
import { KindlingLogo } from '../src/components/ui/KindlingLogo';
import { StageCard, StageStatus } from '../src/components/ui/StageCard';
import { ReadyToSignCard } from '../src/components/ui/ReadyToSignCard';
import { GlassMenu, MenuItem } from '../src/components/ui/GlassMenu';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography } from '../src/styles/constants';

/**
 * Stage data configuration
 */
interface StageConfig {
  id: string;
  title: string;
  subline: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'your-people',
    title: 'Your People',
    subline: 'Add partner, children, guardians · 3 mins',
  },
  {
    id: 'your-estate',
    title: 'Your Estate',
    subline: 'Assets, gifts, and who gets what · 8 mins',
  },
  {
    id: 'legal-check',
    title: 'Legal Check',
    subline: 'Legal safety and tax efficiency · 5 mins',
  },
];

/**
 * Mock state for Phase 1 (UI only)
 * This will be replaced with real state derivation in Phase 2
 */
interface DashboardState {
  yourPeople: StageStatus;
  yourEstate: StageStatus;
  legalCheck: StageStatus;
  canSign: boolean;
  waitingForAcceptances: boolean;
}

const mockState: DashboardState = {
  yourPeople: 'In progress',
  yourEstate: 'Not started',
  legalCheck: 'Not started',
  canSign: false,
  waitingForAcceptances: false,
};

/**
 * Get status for a stage by ID
 */
const getStageStatus = (stageId: string, state: DashboardState): StageStatus => {
  switch (stageId) {
    case 'your-people':
      return state.yourPeople;
    case 'your-estate':
      return state.yourEstate;
    case 'legal-check':
      return state.legalCheck;
    default:
      return 'Not started';
  }
};

/**
 * Check if a stage is disabled (future stages are locked)
 */
const isStageDisabled = (stageId: string, state: DashboardState): boolean => {
  // Linear progression: can only access current or completed stages
  switch (stageId) {
    case 'your-people':
      return false; // Always accessible
    case 'your-estate':
      return state.yourPeople !== 'Complete';
    case 'legal-check':
      return state.yourEstate !== 'Complete';
    default:
      return true;
  }
};

/**
 * WillDashboardScreen component
 */
export default function WillDashboardScreen() {
  // Refs
  const lastTapRef = useRef<number>(0);
  const menuRef = useRef<BottomSheet>(null);

  // Menu items configuration
  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        id: 'profile',
        title: 'My Profile',
        subtitle: 'Your personal details',
        icon: 'account-circle-outline',
        onPress: () => console.log('Profile pressed'),
      },
      {
        id: 'settings',
        title: 'Account Settings',
        subtitle: 'Preferences and security',
        icon: 'cog-outline',
        onPress: () => console.log('Settings pressed'),
      },
      {
        id: 'about',
        title: 'About Kindling',
        subtitle: 'Our story and mission',
        icon: 'heart-outline',
        onPress: () => console.log('About pressed'),
      },
      {
        id: 'logout',
        title: 'Logout',
        icon: 'logout',
        onPress: () => console.log('Logout pressed'),
        destructive: true,
      },
    ],
    []
  );

  // Double tap functionality for dev dashboard (on header)
  const handleHeaderPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      router.push('/developer/dashboard');
    }
    lastTapRef.current = now;
  };

  const handleBack = () => {
    router.back();
  };

  const handleMenuPress = useCallback(() => {
    menuRef.current?.expand();
  }, []);

  // Phase 1: All handlers just log to console
  const handleStagePress = (stageId: string) => {
    console.log(`Stage pressed: ${stageId}`);
  };

  const handleContinue = () => {
    console.log('Continue pressed');
  };

  const handleSigningPress = () => {
    console.log('Signing card pressed');
  };

  // Use mock state for Phase 1
  const state = mockState;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.9}>
          <KindlingLogo size="sm" variant="dark" showText={false} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
          <MaterialCommunityIcons
            name="menu"
            size={24}
            color={KindlingColors.navy}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Your Will</Text>
          <Text style={styles.subtitle}>About 16 minutes start to finish</Text>
        </View>

        {/* Stage Cards */}
        <View style={styles.stagesContainer}>
          {STAGES.map((stage) => (
            <StageCard
              key={stage.id}
              title={stage.title}
              status={getStageStatus(stage.id, state)}
              subline={stage.subline}
              onPress={() => handleStagePress(stage.id)}
              disabled={isStageDisabled(stage.id, state)}
              testID={`stage-card-${stage.id}`}
              style={styles.stageCard}
            />
          ))}
        </View>

        {/* Divider spacing */}
        <View style={styles.divider} />

        {/* Ready to Sign Card */}
        <ReadyToSignCard
          eligible={state.canSign}
          waitingForAcceptances={state.waitingForAcceptances}
          onPress={handleSigningPress}
          testID="ready-to-sign-card"
        />
      </ScrollView>

      {/* Footer with Continue button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleContinue}
        >
          Continue
        </Button>
      </View>

      {/* Glass Menu */}
      <GlassMenu ref={menuRef} items={menuItems} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: KindlingColors.cream,
  },
  menuButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  titleContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
  stagesContainer: {
    gap: Spacing.md,
  },
  stageCard: {
    // Individual card spacing handled by gap
  },
  divider: {
    height: Spacing.lg,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.cream,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.navy}1a`,
  },
});
