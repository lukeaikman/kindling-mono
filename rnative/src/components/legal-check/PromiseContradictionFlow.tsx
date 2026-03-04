/**
 * Promise Contradiction Flow
 *
 * A/B/C selection with distinct sub-outcomes per path:
 *   A — Alter the will to keep the promise  (task added → complete)
 *   B — Roll back on the promise            (legal warning → reach-out → confirmation)
 *   C — Accept the risk of a challenge       (risk warning → confirm or contact → confirmation)
 *
 * @module components/legal-check/PromiseContradictionFlow
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepCard } from '../ui/StepCard';
import { Button } from '../ui';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius } from '../../styles/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'choose-path' | 'path-a-outcome' | 'path-b-warning' | 'path-b-confirmed' | 'path-c-warning' | 'confirmation';
type SelectedPath = '' | 'A' | 'B' | 'C';

interface PromiseContradictionFlowProps {
  onComplete: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PromiseContradictionFlow: React.FC<PromiseContradictionFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('choose-path');
  const [selectedPath, setSelectedPath] = useState<SelectedPath>('');

  const advance = useCallback((next: Step) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(next);
  }, []);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'path-a-outcome' || step === 'path-b-warning' || step === 'path-c-warning') {
      setStep('choose-path');
    } else if (step === 'path-b-confirmed') {
      setStep('path-b-warning');
    } else if (step === 'confirmation') {
      setStep('path-c-warning');
    }
  }, [step]);

  // ---------------------------------------------------------------------------
  // Step: choose path
  // ---------------------------------------------------------------------------

  const renderChoosePath = () => (
    <StepCard title="Promise Contradiction" scrollable>
      <Text style={styles.intro}>
        If the promisee has relied on that promise, they may be able to
        challenge your will. Select your preferred option:
      </Text>

      <TouchableOpacity
        style={[styles.optionCard, selectedPath === 'A' && styles.optionCardSelected]}
        onPress={() => setSelectedPath('A')}
        activeOpacity={0.7}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionBadge, { backgroundColor: `${KindlingColors.green}20` }]}>
            <Text style={[styles.optionBadgeText, { color: KindlingColors.green }]}>A</Text>
          </View>
          <Text style={styles.optionTitle}>Alter the will, keep the promise</Text>
        </View>
        <Text style={styles.optionDesc}>
          We'll add a task to update your bequeathal so it honours the promise.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionCard, selectedPath === 'B' && styles.optionCardSelected]}
        onPress={() => setSelectedPath('B')}
        activeOpacity={0.7}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionBadge, { backgroundColor: `${KindlingColors.brown}20` }]}>
            <Text style={[styles.optionBadgeText, { color: KindlingColors.brown }]}>B</Text>
          </View>
          <Text style={styles.optionTitle}>Roll back on the promise</Text>
        </View>
        <Text style={styles.optionDesc}>
          Carries legal risk — we'll discuss the situation with you.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionCard, selectedPath === 'C' && styles.optionCardSelected]}
        onPress={() => setSelectedPath('C')}
        activeOpacity={0.7}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionBadge, { backgroundColor: `${KindlingColors.destructive}20` }]}>
            <Text style={[styles.optionBadgeText, { color: KindlingColors.buttonRed }]}>C</Text>
          </View>
          <Text style={styles.optionTitle}>Risk there will be no challenge</Text>
        </View>
        <Text style={styles.optionDesc}>
          Defending a claim can be expensive — costs fall on the estate.
        </Text>
      </TouchableOpacity>
    </StepCard>
  );

  // ---------------------------------------------------------------------------
  // Path A outcome
  // ---------------------------------------------------------------------------

  const renderPathAOutcome = () => (
    <StepCard title="Task Added" scrollable>
      <View style={styles.outcomeCenter}>
        <View style={styles.tickCircle}>
          <MaterialCommunityIcons name="check" size={32} color={KindlingColors.background} />
        </View>
        <Text style={styles.outcomeHeading}>Alter your bequeathal</Text>
        <Text style={styles.outcomeBody}>
          A task has been added to your planning section. When you're ready,
          you'll be guided to alter your bequeathal to uphold the promise.
        </Text>
      </View>
    </StepCard>
  );

  // ---------------------------------------------------------------------------
  // Path B — warning then confirmation
  // ---------------------------------------------------------------------------

  const renderPathBWarning = () => (
    <StepCard title="Rolling Back" scrollable>
      <View style={styles.adviceBox}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={24}
          color={KindlingColors.brown}
          style={styles.adviceIcon}
        />
        <Text style={styles.adviceText}>
          Rolling back on a promise is sometimes the only realistic option, but
          it carries legal risk. If the promisee took any action in reliance on
          this promise, rolling it back may not be legally effective and they
          could still succeed in court.
        </Text>
      </View>
      <Text style={styles.subtext}>
        If you confirm this as a desired route, we will reach out to discuss the
        situation.
      </Text>
    </StepCard>
  );

  const renderPathBConfirmed = () => (
    <StepCard scrollable>
      <View style={styles.outcomeCenter}>
        <View style={styles.tickCircle}>
          <MaterialCommunityIcons name="check" size={32} color={KindlingColors.background} />
        </View>
        <Text style={styles.outcomeHeading}>We will be in touch!</Text>
        <Text style={styles.outcomeBody}>
          We've noted your preference and will reach out to discuss the
          situation with you directly.
        </Text>
      </View>
    </StepCard>
  );

  // ---------------------------------------------------------------------------
  // Path C — risk warning
  // ---------------------------------------------------------------------------

  const renderPathCWarning = () => (
    <StepCard title="Accepting the Risk" scrollable>
      <View style={styles.adviceBox}>
        <MaterialCommunityIcons
          name="alert-outline"
          size={24}
          color={KindlingColors.buttonRed}
          style={styles.adviceIcon}
        />
        <Text style={styles.adviceText}>
          This is a route taken by some, but please note that defending a claim
          can be expensive, with costs falling on the estate.
        </Text>
      </View>
      <Text style={styles.subtext}>
        Are you sure you're happy to take the risk?
      </Text>
    </StepCard>
  );

  // Shared confirmation screen (used for path C contact-support too)
  const renderConfirmation = () => (
    <StepCard scrollable>
      <View style={styles.outcomeCenter}>
        <View style={styles.tickCircle}>
          <MaterialCommunityIcons name="check" size={32} color={KindlingColors.background} />
        </View>
        <Text style={styles.outcomeHeading}>We'll be in touch!</Text>
        <Text style={styles.outcomeBody}>
          We've noted your situation and will be in contact to offer support.
        </Text>
      </View>
    </StepCard>
  );

  // ---------------------------------------------------------------------------
  // Button row — varies per step
  // ---------------------------------------------------------------------------

  const renderButtons = () => {
    switch (step) {
      case 'choose-path':
        return (
          <View style={styles.buttonRow}>
            <View style={styles.buttonSpacer} />
            <Button
              variant="primary"
              onPress={() => {
                if (selectedPath === 'A') advance('path-a-outcome');
                else if (selectedPath === 'B') advance('path-b-warning');
                else if (selectedPath === 'C') advance('path-c-warning');
              }}
              disabled={selectedPath === ''}
              icon="arrow-right"
            >
              Continue
            </Button>
          </View>
        );

      case 'path-a-outcome':
        return (
          <View style={styles.buttonRow}>
            <Button variant="outline" onPress={goBack} icon="arrow-left">
              Back
            </Button>
            <View style={styles.buttonSpacer} />
            <Button variant="secondary" onPress={onComplete} icon="check">
              Continue
            </Button>
          </View>
        );

      case 'path-b-warning':
        return (
          <View style={styles.buttonRow}>
            <Button variant="outline" onPress={goBack} icon="arrow-left">
              Back
            </Button>
            <View style={styles.buttonSpacer} />
            <Button variant="secondary" onPress={() => advance('path-b-confirmed')} icon="phone-outline">
              Reach out please!
            </Button>
          </View>
        );

      case 'path-b-confirmed':
        return (
          <View style={styles.buttonRow}>
            <Button variant="outline" onPress={goBack} icon="arrow-left">
              Back
            </Button>
            <View style={styles.buttonSpacer} />
            <Button variant="secondary" onPress={onComplete} icon="check">
              Continue
            </Button>
          </View>
        );

      case 'path-c-warning':
        return (
          <View style={styles.buttonColumn}>
            <Button variant="primary" onPress={onComplete}>
              Yes — Continue
            </Button>
            <Button variant="secondary" onPress={() => advance('confirmation')} icon="phone-outline">
              Contact me for support
            </Button>
            <Button variant="outline" onPress={goBack} icon="arrow-left">
              Back
            </Button>
          </View>
        );

      case 'confirmation':
        return (
          <View style={styles.buttonRow}>
            <Button variant="outline" onPress={goBack} icon="arrow-left">
              Back
            </Button>
            <View style={styles.buttonSpacer} />
            <Button variant="secondary" onPress={onComplete} icon="check">
              Continue
            </Button>
          </View>
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const renderStep = () => {
    switch (step) {
      case 'choose-path': return renderChoosePath();
      case 'path-a-outcome': return renderPathAOutcome();
      case 'path-b-warning': return renderPathBWarning();
      case 'path-b-confirmed': return renderPathBConfirmed();
      case 'path-c-warning': return renderPathCWarning();
      case 'confirmation': return renderConfirmation();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardArea}>{renderStep()}</View>
      {renderButtons()}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardArea: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    alignItems: 'flex-end',
  },
  buttonColumn: {
    flexDirection: 'column',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  buttonSpacer: {
    flex: 1,
  },
  buttonGroup: {
    gap: Spacing.sm,
  },

  intro: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    lineHeight: Typography.fontSize.md * 1.5,
    marginBottom: Spacing.md,
  },

  optionCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: KindlingColors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionCardSelected: {
    borderStyle: 'solid',
    borderColor: KindlingColors.green,
    backgroundColor: `${KindlingColors.green}08`,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  optionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    flex: 1,
  },
  optionDesc: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: Typography.fontSize.sm * 1.5,
    marginLeft: 28 + Spacing.sm,
  },

  adviceBox: {
    flexDirection: 'row',
    backgroundColor: `${KindlingColors.cream}90`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  adviceIcon: {
    marginTop: 2,
  },
  adviceText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    lineHeight: Typography.fontSize.sm * 1.65,
  },
  subtext: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    lineHeight: Typography.fontSize.md * 1.5,
  },

  outcomeCenter: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  tickCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: KindlingColors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  outcomeHeading: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  outcomeBody: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.6,
    paddingHorizontal: Spacing.md,
  },
});
