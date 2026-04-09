/**
 * Extra Details Screen
 *
 * Lightweight orchestrator for the "Critical Information" step.
 * Holds a hard-coded array of macro flows, renders one at a time,
 * and advances on each flow's `onComplete`. Shows a macro-level
 * step counter (e.g. "1 of 3") — individual sub-steps are managed
 * inside each flow component.
 *
 * The flow array will eventually be populated dynamically by
 * back-end queries based on preliminary-question answers.
 *
 * @module screens/legal-check/avoid-issues/extra-details
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BackButton } from '../../../src/components/ui';
import { Celebration } from '../../../src/components/ui/Celebration';
import { EstrangedChildFlow } from '../../../src/components/legal-check/EstrangedChildFlow';
import { PromiseContradictionFlow } from '../../../src/components/legal-check/PromiseContradictionFlow';
import { DisabledBeneficiaryFlow } from '../../../src/components/legal-check/DisabledBeneficiaryFlow';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography, BorderRadius } from '../../../src/styles/constants';

// ---------------------------------------------------------------------------
// Hard-coded flow list — eventually populated by back-end queries
// ---------------------------------------------------------------------------

const FLOWS_NEEDED = [
  { id: 'estranged-children', label: 'Estranged Children' },
  { id: 'contradicted-promises', label: 'Promise Contradiction' },
  { id: 'disabled-beneficiaries', label: 'Disabled Beneficiaries' },
] as const;

type FlowId = (typeof FLOWS_NEEDED)[number]['id'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExtraDetailsScreen() {
  const [currentFlowIndex, setCurrentFlowIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const progressWidth = useSharedValue(0);

  const totalFlows = FLOWS_NEEDED.length;
  const currentFlow = FLOWS_NEEDED[currentFlowIndex];
  const isComplete = currentFlowIndex >= totalFlows;

  const handleFlowComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const nextIndex = currentFlowIndex + 1;
    setCurrentFlowIndex(nextIndex);
    progressWidth.value = withTiming(nextIndex / totalFlows, { duration: 400 });

    if (nextIndex >= totalFlows) {
      setTimeout(() => setShowCelebration(true), 400);
    }
  }, [currentFlowIndex, totalFlows, progressWidth]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    router.replace('/legal-check/avoid-issues' as any);
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  // ---------------------------------------------------------------------------
  // Render the active flow
  // ---------------------------------------------------------------------------

  const renderFlow = () => {
    if (isComplete) return null;

    switch (currentFlow.id as FlowId) {
      case 'estranged-children':
        return <EstrangedChildFlow onComplete={handleFlowComplete} />;
      case 'contradicted-promises':
        return <PromiseContradictionFlow onComplete={handleFlowComplete} />;
      case 'disabled-beneficiaries':
        return <DisabledBeneficiaryFlow onComplete={handleFlowComplete} />;
    }
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {/* Morphic background blobs */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={16}
              color={KindlingColors.navy}
            />
          </View>
          <Text style={styles.title}>Critical Information</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressBarStyle]} />
      </View>

      {/* Macro step counter */}
      {!isComplete && (
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>{currentFlow.label}</Text>
          <Text style={styles.counterText}>
            {currentFlowIndex + 1} of {totalFlows}
          </Text>
        </View>
      )}

      {/* Active flow */}
      {renderFlow()}

      {/* Celebration overlay */}
      <Celebration
        visible={showCelebration}
        variant="full"
        onComplete={handleCelebrationComplete}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  morphicBlob: {
    position: 'absolute',
    opacity: 0.08,
  },
  blob1: {
    top: -60,
    right: -80,
    width: 280,
    height: 280,
    backgroundColor: KindlingColors.navy,
    borderRadius: 140,
    transform: [{ rotate: '-15deg' }],
  },
  blob2: {
    bottom: -40,
    left: -60,
    width: 200,
    height: 160,
    backgroundColor: KindlingColors.beige,
    borderRadius: 100,
    transform: [{ rotate: '25deg' }],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}1a`,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  headerSpacer: {
    width: 48,
  },

  progressTrack: {
    height: 4,
    backgroundColor: `${KindlingColors.border}80`,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: KindlingColors.green,
    borderRadius: BorderRadius.full,
  },

  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  counterLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  counterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.brown,
  },
});
