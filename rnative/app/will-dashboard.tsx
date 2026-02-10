/**
 * Will Dashboard Screen
 *
 * Simplified dashboard with three stages and a signing section.
 * Replaces the complex checklist with a calm, momentum-driven view.
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
import { StageCard } from '../src/components/ui/StageCard';
import { ReadyToSignCard } from '../src/components/ui/ReadyToSignCard';
import { GlassMenu, MenuItem } from '../src/components/ui/GlassMenu';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography } from '../src/styles/constants';
import { useAppState } from '../src/hooks/useAppState';
import {
  deriveYourPeopleStatus,
  deriveYourEstateStatus,
  deriveLegalCheckStatus,
  getNextRoute,
  getContinueLabel,
  getYourPeopleProgress,
  canSign,
  isWaitingForAcceptances,
  type WillProgressState,
  type StageStatus,
} from '../src/utils/willProgress';

// ---------------------------------------------------------------------------
// Stage configuration
// ---------------------------------------------------------------------------

interface StageConfig {
  id: string;
  title: string;
  subline: string;
  route: string; // entry route when tapping the card
}

const STAGES: StageConfig[] = [
  {
    id: 'your-people',
    title: 'Your People',
    subline: 'Add partner, children, guardians \u00b7 3 mins',
    route: '/guardianship/intro', // default; overridden by getNextRoute for context
  },
  {
    id: 'your-estate',
    title: 'Your Estate',
    subline: 'Assets, gifts, and who gets what \u00b7 8 mins',
    route: '/bequeathal/categories',
  },
  {
    id: 'legal-check',
    title: 'Legal Check',
    subline: 'Legal safety and tax efficiency \u00b7 5 mins',
    route: '/legal-check',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStageStatus(
  stageId: string,
  progressState: WillProgressState,
): StageStatus {
  switch (stageId) {
    case 'your-people':
      return deriveYourPeopleStatus(progressState);
    case 'your-estate':
      return deriveYourEstateStatus(progressState);
    case 'legal-check':
      return deriveLegalCheckStatus(progressState);
    default:
      return 'Not started';
  }
}

function getStageProgress(
  stageId: string,
  progressState: WillProgressState,
): string | undefined {
  switch (stageId) {
    case 'your-people': {
      const progress = getYourPeopleProgress(progressState);
      return progress === 'Complete' ? undefined : progress;
    }
    default:
      return undefined;
  }
}

function isStageDisabled(
  stageId: string,
  progressState: WillProgressState,
): boolean {
  switch (stageId) {
    case 'your-people':
      return false;
    case 'your-estate':
      return deriveYourPeopleStatus(progressState) !== 'Complete';
    case 'legal-check':
      return deriveYourEstateStatus(progressState) !== 'Complete';
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WillDashboardScreen() {
  const lastTapRef = useRef<number>(0);
  const menuRef = useRef<BottomSheet>(null);

  // Real state from useAppState
  const { willActions, personActions, estateRemainderActions } = useAppState();

  const progressState: WillProgressState = useMemo(() => ({
    willMaker: willActions.getUser(),
    people: personActions.getPeople(),
    willData: willActions.getWillData(),
    estateRemainderState: estateRemainderActions.getEstateRemainderState(),
  }), [willActions, personActions, estateRemainderActions]);

  // Derived values
  const continueLabel = useMemo(() => getContinueLabel(progressState), [progressState]);
  const nextRoute = useMemo(() => getNextRoute(progressState), [progressState]);
  const signingEligible = useMemo(() => canSign(progressState), [progressState]);
  const waitingAcceptances = useMemo(() => isWaitingForAcceptances(progressState), [progressState]);

  // Menu items (placeholders)
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
    [],
  );

  // Handlers
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

  const handleStagePress = useCallback(
    (stageId: string) => {
      // For "your-people", use the smart routing to pick the right sub-flow
      if (stageId === 'your-people') {
        router.push(nextRoute as any);
        return;
      }
      // Other stages use their default route
      const stage = STAGES.find((s) => s.id === stageId);
      if (stage) {
        router.push(stage.route as any);
      }
    },
    [nextRoute],
  );

  const handleContinue = useCallback(() => {
    router.push(nextRoute as any);
  }, [nextRoute]);

  const handleSigningPress = useCallback(() => {
    if (signingEligible) {
      // TODO: Navigate to signing flow
      console.log('Navigate to signing');
    } else {
      // Navigate to next incomplete stage
      router.push(nextRoute as any);
    }
  }, [signingEligible, nextRoute]);

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
          {STAGES.map((stage) => {
            const status = getStageStatus(stage.id, progressState);
            const progress = getStageProgress(stage.id, progressState);
            const disabled = isStageDisabled(stage.id, progressState);

            return (
              <StageCard
                key={stage.id}
                title={stage.title}
                status={status}
                subline={progress ? `${stage.subline} \u00b7 ${progress}` : stage.subline}
                onPress={() => handleStagePress(stage.id)}
                disabled={disabled}
                testID={`stage-card-${stage.id}`}
                style={styles.stageCard}
              />
            );
          })}
        </View>

        {/* Divider spacing */}
        <View style={styles.divider} />

        {/* Ready to Sign Card */}
        <ReadyToSignCard
          eligible={signingEligible}
          waitingForAcceptances={waitingAcceptances}
          onPress={handleSigningPress}
          testID="ready-to-sign-card"
        />
      </ScrollView>

      {/* Footer with Continue button */}
      <View style={styles.footer}>
        <Button variant="primary" onPress={handleContinue}>
          {continueLabel}
        </Button>
      </View>

      {/* Glass Menu */}
      <GlassMenu ref={menuRef} items={menuItems} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
