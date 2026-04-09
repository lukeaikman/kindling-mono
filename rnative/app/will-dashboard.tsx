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
import { KindlingLogo } from '../src/components/ui/KindlingLogo';
import { StageCard, type CardEmphasis } from '../src/components/ui/StageCard';
import { GlassMenu, MenuItem } from '../src/components/ui/GlassMenu';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography, BorderRadius } from '../src/styles/constants';
import { useAppState } from '../src/hooks/useAppState';
import {
  deriveYourPeopleStatus,
  deriveYourEstateStatus,
  deriveLegalCheckStatus,
  getNextRoute,
  getNextYourPeopleRoute,
  getYourPeopleProgress,
  getEstateSubline,
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
  defaultSubline: string;
  route: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'your-people',
    title: 'Your People',
    defaultSubline: 'Partner, children, guardians · 3 mins',
    route: '/guardianship/intro',
  },
  {
    id: 'your-estate',
    title: 'Your Estate',
    defaultSubline: 'Assets, gifts, and who gets what · 8 mins',
    route: '/estate-dashboard',
  },
  {
    id: 'legal-check',
    title: 'Legal Check',
    defaultSubline: 'Legal safety and tax efficiency · 5 mins',
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

/**
 * Determine emphasis level for each card.
 * The first non-complete, non-disabled stage is the "hero".
 */
function getStageEmphasis(
  stageId: string,
  status: StageStatus,
  disabled: boolean,
): CardEmphasis {
  if (status === 'Complete') return 'completed';
  if (disabled) return 'future';
  // First enabled, non-complete stage is the hero
  return 'hero';
}

/**
 * The pill label. "Up next" for the hero card if it hasn't been started yet.
 */
function getStatusLabel(
  status: StageStatus,
  emphasis: CardEmphasis,
): string | undefined {
  if (emphasis === 'hero' && status === 'Not started') return 'Up next';
  return undefined; // use default status text
}

/**
 * Dynamic subline — completed stages reflect what was built.
 */
function getStageSubline(
  stageId: string,
  status: StageStatus,
  defaultSubline: string,
  progressState: WillProgressState,
): string {
  // Estate stage has its own dynamic subline function
  if (stageId === 'your-estate') {
    return getEstateSubline(progressState);
  }

  if (status !== 'Complete') {
    // Show progress fraction if applicable
    if (stageId === 'your-people') {
      const progress = getYourPeopleProgress(progressState);
      if (progress !== 'Complete') return `${defaultSubline} · ${progress}`;
    }
    return defaultSubline;
  }

  // Build a completion summary
  switch (stageId) {
    case 'your-people': {
      const people = progressState.people;
      const executorCount = people.filter((p) => p.roles?.includes('executor')).length;
      const childCount = people.filter((p) => p.isUnder18 === true).length;
      const parts: string[] = [];
      if (childCount > 0) parts.push(`${childCount} child${childCount !== 1 ? 'ren' : ''}`);
      if (executorCount > 0) parts.push(`${executorCount} executor${executorCount !== 1 ? 's' : ''}`);
      parts.push('invitations sent');
      return parts.join(', ');
    }
    default:
      return defaultSubline;
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

/**
 * Warm progress sentence for the bottom of the dashboard.
 * Replaces the locked "Ready to sign" card.
 */
function getProgressSentence(progressState: WillProgressState): string {
  const statuses = [
    deriveYourPeopleStatus(progressState),
    deriveYourEstateStatus(progressState),
    deriveLegalCheckStatus(progressState),
  ];
  const completedCount = statuses.filter((s) => s === 'Complete').length;

  if (completedCount === 0) return 'Complete the three sections above to unlock signing.';
  if (completedCount === 1) return 'One down, two to go.';
  if (completedCount === 2) return 'Two down, one to go. Nearly there.';
  if (canSign(progressState)) return "You're ready to sign.";
  if (isWaitingForAcceptances(progressState)) {
    return 'All sections complete. Waiting for acceptances before signing.';
  }
  return 'All sections complete. Signing will unlock shortly.';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WillDashboardScreen() {
  const lastTapRef = useRef<number>(0);
  const menuRef = useRef<BottomSheet>(null);

  const { willActions, personActions, estateRemainderActions, bequeathalActions, isAppStateReady } = useAppState();

  const progressState: WillProgressState = useMemo(() => ({
    willMaker: willActions.getUser(),
    people: personActions.getPeople(),
    willData: willActions.getWillData(),
    estateRemainderState: estateRemainderActions.getEstateRemainderState(),
    bequeathalData: bequeathalActions.getBequeathalData(),
  }), [willActions, personActions, estateRemainderActions, bequeathalActions]);

  const nextRoute = useMemo(() => getNextRoute(progressState), [progressState]);
  const progressSentence = useMemo(() => getProgressSentence(progressState), [progressState]);
  const signingReady = useMemo(() => canSign(progressState), [progressState]);

  // Track which stage gets "hero" — the first non-complete, enabled stage
  const stageData = useMemo(() => {
    let heroAssigned = false;
    return STAGES.map((stage) => {
      const status = getStageStatus(stage.id, progressState);
      const disabled = isStageDisabled(stage.id, progressState);

      let emphasis: CardEmphasis;
      if (status === 'Complete') {
        emphasis = 'completed';
      } else if (disabled) {
        emphasis = 'future';
      } else if (!heroAssigned) {
        emphasis = 'hero';
        heroAssigned = true;
      } else {
        emphasis = 'default';
      }

      const statusLabel = getStatusLabel(status, emphasis);
      const subline = getStageSubline(stage.id, status, stage.defaultSubline, progressState);

      return { stage, status, disabled, emphasis, statusLabel, subline };
    });
  }, [progressState]);

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

  const handleMenuPress = useCallback(() => {
    menuRef.current?.expand();
  }, []);

  const handleStagePress = useCallback(
    (stageId: string) => {
      if (stageId === 'your-people') {
        // Stage-specific routing: goes to summary when complete,
        // or the next incomplete sub-flow when not
        const peopleRoute = getNextYourPeopleRoute(progressState);
        router.push(peopleRoute as any);
        return;
      }
      if (stageId === 'your-estate') {
        // Always go to estate dashboard, even when complete
        router.push('/estate-dashboard' as any);
        return;
      }
      const stage = STAGES.find((s) => s.id === stageId);
      if (stage) {
        router.push(stage.route as any);
      }
    },
    [progressState],
  );

  const handleSigningPress = useCallback(() => {
    if (signingReady) {
      console.log('Navigate to signing');
    } else {
      router.push(nextRoute as any);
    }
  }, [signingReady, nextRoute]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
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

      {/* Content — gated on AsyncStorage hydration to prevent status flash */}
      {isAppStateReady ? (
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
            {stageData.map(({ stage, status, disabled, emphasis, statusLabel, subline }) => (
              <StageCard
                key={stage.id}
                title={stage.title}
                status={status}
                statusLabel={statusLabel}
                subline={subline}
                emphasis={emphasis}
                onPress={() => handleStagePress(stage.id)}
                disabled={disabled}
                testID={`stage-card-${stage.id}`}
                style={styles.stageCard}
              />
            ))}
          </View>

          {/* Warm progress sentence — replaces Ready to Sign card */}
          <TouchableOpacity
            style={[
              styles.progressRow,
              signingReady && styles.progressRowReady,
            ]}
            onPress={handleSigningPress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={signingReady ? 'check-circle' : 'flag-checkered'}
              size={20}
              color={signingReady ? KindlingColors.green : KindlingColors.mutedForeground}
            />
            <Text
              style={[
                styles.progressText,
                signingReady && styles.progressTextReady,
              ]}
            >
              {progressSentence}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}

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
  headerSpacer: {
    width: 40,
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

  // -- Progress sentence (replaces Ready to Sign) --
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${KindlingColors.navy}08`,
  },
  progressRowReady: {
    backgroundColor: `${KindlingColors.green}12`,
  },
  progressText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  progressTextReady: {
    color: KindlingColors.green,
    fontWeight: Typography.fontWeight.semibold,
  },
});
