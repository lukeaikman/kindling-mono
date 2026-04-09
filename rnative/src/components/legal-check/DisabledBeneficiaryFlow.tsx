/**
 * Disabled Beneficiary Flow
 *
 * For each identified disabled/vulnerable beneficiary, asks whether
 * they currently receive means-tested benefits. YES or NOT SURE
 * triggers a flag for manual review.
 *
 * @module components/legal-check/DisabledBeneficiaryFlow
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepCard } from '../ui/StepCard';
import { Button, RadioGroup } from '../ui';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius } from '../../styles/constants';

// ---------------------------------------------------------------------------
// Mock data — will come from the data layer eventually
// ---------------------------------------------------------------------------

const MOCK_DISABLED_BENEFICIARIES = [
  { id: '1', name: 'Thomas Aikman' },
  { id: '2', name: 'Rachel Aikman' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'question' | 'outcome';

interface DisabledBeneficiaryFlowProps {
  onComplete: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DisabledBeneficiaryFlow: React.FC<DisabledBeneficiaryFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('question');
  const [currentPersonIndex, setCurrentPersonIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentPerson = MOCK_DISABLED_BENEFICIARIES[currentPersonIndex];
  const currentAnswer = currentPerson ? answers[currentPerson.id] ?? '' : '';
  const isLastPerson = currentPersonIndex >= MOCK_DISABLED_BENEFICIARIES.length - 1;

  const anyFlagged = Object.values(answers).some(a => a === 'yes' || a === 'not-sure');

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === 'question') {
      if (isLastPerson) {
        setStep('outcome');
      } else {
        setCurrentPersonIndex(prev => prev + 1);
      }
    }
  }, [step, isLastPerson]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === 'outcome') {
      setStep('question');
      return;
    }
    if (currentPersonIndex > 0) {
      setCurrentPersonIndex(prev => prev - 1);
    }
  }, [step, currentPersonIndex]);

  const setAnswer = (value: string) => {
    if (!currentPerson) return;
    setAnswers(prev => ({ ...prev, [currentPerson.id]: value }));
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderQuestion = () => (
    <StepCard title="Means-Tested Benefits" scrollable>
      <View style={styles.personBadge}>
        <MaterialCommunityIcons name="account-outline" size={20} color={KindlingColors.navy} />
        <Text style={styles.personName}>{currentPerson.name}</Text>
        <Text style={styles.personCounter}>
          {currentPersonIndex + 1} of {MOCK_DISABLED_BENEFICIARIES.length}
        </Text>
      </View>

      <Text style={styles.question}>
        Is {currentPerson.name} currently receiving means-tested benefits?
      </Text>

      <View style={styles.infoBox}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={KindlingColors.brown}
        />
        <Text style={styles.infoText}>
          An outright inheritance above ~£16,000 can disqualify someone from
          Universal Credit and similar benefits. This is important for us to know.
        </Text>
      </View>

      <RadioGroup
        value={currentAnswer}
        onChange={setAnswer}
        options={[
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Not sure', value: 'not-sure' },
        ]}
        collapseOnSelect={false}
      />
    </StepCard>
  );

  const renderOutcome = () => (
    <StepCard scrollable>
      <View style={styles.outcomeCenter}>
        <View style={[styles.tickCircle, anyFlagged && styles.tickCircleFlagged]}>
          <MaterialCommunityIcons
            name={anyFlagged ? 'flag-outline' : 'check'}
            size={32}
            color={KindlingColors.background}
          />
        </View>
        <Text style={styles.outcomeHeading}>
          {anyFlagged ? 'Flagged for Review' : 'All Clear'}
        </Text>
        <Text style={styles.outcomeBody}>
          {anyFlagged
            ? 'One or more beneficiaries may receive means-tested benefits. We\'ve flagged this for manual review and will be in touch to discuss the best approach.'
            : 'None of your identified beneficiaries appear to receive means-tested benefits. No further action needed here.'}
        </Text>

        {anyFlagged && (
          <View style={styles.flaggedList}>
            {MOCK_DISABLED_BENEFICIARIES.filter(
              p => answers[p.id] === 'yes' || answers[p.id] === 'not-sure',
            ).map(p => (
              <View key={p.id} style={styles.flaggedItem}>
                <MaterialCommunityIcons name="flag" size={16} color={KindlingColors.brown} />
                <Text style={styles.flaggedName}>{p.name}</Text>
                <Text style={styles.flaggedStatus}>
                  {answers[p.id] === 'yes' ? 'Receiving benefits' : 'Unsure'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </StepCard>
  );

  const isFirstStep = step === 'question' && currentPersonIndex === 0;
  const isFinalStep = step === 'outcome';

  return (
    <View style={styles.container}>
      <View style={styles.cardArea}>
        {step === 'question' ? renderQuestion() : renderOutcome()}
      </View>

      <View style={styles.buttonRow}>
        {!isFirstStep && (
          <Button variant="outline" onPress={handleBack} icon="arrow-left">
            Back
          </Button>
        )}
        <View style={styles.buttonSpacer} />
        {isFinalStep ? (
          <Button variant="secondary" onPress={onComplete} icon="check">
            Continue
          </Button>
        ) : (
          <Button
            variant="primary"
            onPress={handleContinue}
            disabled={currentAnswer === ''}
            icon="arrow-right"
          >
            {isLastPerson ? 'Finish' : 'Next Person'}
          </Button>
        )}
      </View>
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
  },
  buttonSpacer: {
    flex: 1,
  },

  personBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${KindlingColors.navy}0a`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    alignSelf: 'flex-start',
  },
  personName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  personCounter: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.mutedForeground,
    marginLeft: Spacing.xs,
  },

  question: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    lineHeight: Typography.fontSize.md * 1.5,
    marginBottom: Spacing.sm,
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${KindlingColors.cream}90`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: Typography.fontSize.sm * 1.55,
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
  tickCircleFlagged: {
    backgroundColor: KindlingColors.brown,
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
    marginBottom: Spacing.md,
  },

  flaggedList: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  flaggedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${KindlingColors.cream}60`,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  flaggedName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    flex: 1,
  },
  flaggedStatus: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.brown,
  },
});
