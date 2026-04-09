/**
 * Estranged Child Flow
 *
 * Multi-step branching flow for the estranged-child flag.
 * Steps: listed in app? → select or add children → minor check
 * → legal advice → allocation review.
 *
 * Manages its own internal sub-steps; the parent orchestrator
 * only sees `onComplete`.
 *
 * @module components/legal-check/EstrangedChildFlow
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepCard } from '../ui/StepCard';
import { Button, Checkbox, RadioGroup, DatePicker, Dialog } from '../ui';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius } from '../../styles/constants';

// ---------------------------------------------------------------------------
// Mock data — will come from the data layer eventually
// ---------------------------------------------------------------------------

const MOCK_CHILDREN = [
  { id: '1', name: 'James Aikman', isUnder18: false },
  { id: '2', name: 'Sophie Aikman', isUnder18: true },
  { id: '3', name: 'Emily Aikman', isUnder18: false },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step =
  | 'listed-in-app'
  | 'select-children'
  | 'add-children'
  | 'legal-advice'
  | 'outcome';

interface AddedChild {
  name: string;
  isUnder18: boolean;
  estimatedDob: string;
}

interface EstrangedChildFlowProps {
  onComplete: () => void;
}

/** Compute age in years and months from a date of birth */
function getAgeYearsMonths(dob: Date): { years: number; months: number } {
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (today.getDate() < dob.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  return { years, months };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EstrangedChildFlow: React.FC<EstrangedChildFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('listed-in-app');
  const [listedInApp, setListedInApp] = useState('');

  // Select-children state
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());

  // Add-children state
  const [addedChildren, setAddedChildren] = useState<AddedChild[]>([
    { name: '', isUnder18: false, estimatedDob: '' },
  ]);

  // Allocation review answer
  const [wantsToChangeAllocations, setWantsToChangeAllocations] = useState('');

  // DOB-over-18 confirmation dialog
  const [dobConfirmState, setDobConfirmState] = useState<{
    visible: boolean;
    childIndex: number;
    dob: Date;
  } | null>(null);

  const minorInvolved = (() => {
    if (listedInApp === 'yes') {
      return MOCK_CHILDREN.some(c => selectedChildIds.has(c.id) && c.isUnder18);
    }
    return addedChildren.some(c => c.isUnder18);
  })();

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const goToNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === 'listed-in-app') {
      setStep(listedInApp === 'yes' ? 'select-children' : 'add-children');
    } else if (step === 'select-children' || step === 'add-children') {
      setStep('legal-advice');
    } else if (step === 'legal-advice') {
      setStep('outcome');
    }
  }, [step, listedInApp]);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === 'select-children' || step === 'add-children') {
      setStep('listed-in-app');
    } else if (step === 'legal-advice') {
      setStep(listedInApp === 'yes' ? 'select-children' : 'add-children');
    } else if (step === 'outcome') {
      setStep('legal-advice');
    }
  }, [step, listedInApp]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const canContinue = (() => {
    switch (step) {
      case 'listed-in-app':
        return listedInApp !== '';
      case 'select-children':
        return selectedChildIds.size > 0;
      case 'add-children':
        return addedChildren.every(c => c.name.trim() !== '');
      case 'legal-advice':
        return wantsToChangeAllocations !== '';
      default:
        return true;
    }
  })();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const toggleChild = (id: string) => {
    setSelectedChildIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateAddedChild = (index: number, updates: Partial<AddedChild>) => {
    setAddedChildren(prev =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    );
  };

  const addAnotherChild = () => {
    setAddedChildren(prev => [...prev, { name: '', isUnder18: false, estimatedDob: '' }]);
  };

  const removeAddedChild = (index: number) => {
    if (addedChildren.length <= 1) return;
    setAddedChildren(prev => prev.filter((_, i) => i !== index));
  };

  const handleDobChange = (index: number, date: Date) => {
    const { years, months } = getAgeYearsMonths(date);
    if (years >= 18) {
      setDobConfirmState({ visible: true, childIndex: index, dob: date });
    } else {
      updateAddedChild(index, { estimatedDob: date.toISOString() });
    }
  };

  const handleDobConfirmNo = () => {
    setDobConfirmState(null);
  };

  const handleDobConfirmYes = () => {
    if (dobConfirmState) {
      updateAddedChild(dobConfirmState.childIndex, {
        isUnder18: false,
        estimatedDob: '',
      });
      setDobConfirmState(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const handleListedInAppSelect = (value: string) => {
    setListedInApp(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(value === 'yes' ? 'select-children' : 'add-children');
  };

  const renderListedInApp = () => (
    <StepCard title="Estranged Children" scrollable>
      <Text style={styles.question}>
        Have you listed your estranged child(ren) in the app already?
      </Text>
      <RadioGroup
        value={listedInApp}
        onChange={handleListedInAppSelect}
        options={[
          { label: 'Yes, they are already listed', value: 'yes' },
          { label: 'No, I need to add them', value: 'no' },
        ]}
        collapseOnSelect={false}
      />
    </StepCard>
  );

  const renderSelectChildren = () => (
    <StepCard title="Select Estranged Children" scrollable>
      <Text style={styles.question}>
        Please select which child(ren) are estranged below.
      </Text>
      <View style={styles.checkboxList}>
        {MOCK_CHILDREN.map(child => (
          <Checkbox
            key={child.id}
            label={`${child.name}${child.isUnder18 ? ' (under 18)' : ''}`}
            checked={selectedChildIds.has(child.id)}
            onCheckedChange={() => toggleChild(child.id)}
          />
        ))}
      </View>
    </StepCard>
  );

  const renderAddChildren = () => (
    <StepCard title="Add Estranged Children" scrollable>
      <Text style={styles.question}>
        Please add your estranged child(ren). We also need to know whether they
        are over or under 18, and if under, an estimated date of birth.
      </Text>

      {addedChildren.map((child, index) => (
        <View key={index} style={styles.addChildCard}>
          <View style={styles.addChildHeader}>
            <Text style={styles.addChildLabel}>Child {index + 1}</Text>
            {addedChildren.length > 1 && (
              <TouchableOpacity
                onPress={() => removeAddedChild(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.removeBtn}
              >
                <IconButton icon="close" size={18} iconColor={KindlingColors.brown} style={styles.removeIcon} />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Child's full name"
            placeholderTextColor={KindlingColors.mutedForeground}
            value={child.name}
            onChangeText={text => updateAddedChild(index, { name: text })}
          />

          <RadioGroup
            label="Age"
            value={child.isUnder18 ? 'under18' : child.name ? 'over18' : ''}
            onChange={val => updateAddedChild(index, { isUnder18: val === 'under18' })}
            options={[
              { label: 'Over 18', value: 'over18' },
              { label: 'Under 18', value: 'under18' },
            ]}
            collapseOnSelect={false}
          />

          {child.isUnder18 && (
            <DatePicker
              label="Estimated date of birth"
              placeholder="Select date"
              value={child.estimatedDob ? new Date(child.estimatedDob) : null}
              onChange={date => handleDobChange(index, date)}
              maxDate={new Date()}
              minDate={new Date(1990, 0, 1)}
            />
          )}
        </View>
      ))}

      <Button variant="outline" onPress={addAnotherChild} icon="plus">
        Add another child
      </Button>
    </StepCard>
  );

  const renderLegalAdvice = () => {
    if (minorInvolved) {
      return (
        <StepCard title="Important Information" scrollable>
          <View style={styles.adviceBox}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={24}
              color={KindlingColors.brown}
              style={styles.adviceIcon}
            />
            <Text style={styles.adviceText}>
              <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }}>If</Text> your will is challenged, courts have been known to make financial provision for childeen under 18. The court's primary concern is the child's welfare and maintenance — your reasons for the current allocation will be considered but are unlikely to override this.
            </Text>
          </View>

          <Text style={styles.question}>
            Would you like to change your allocations?
          </Text>
          <RadioGroup
            value={wantsToChangeAllocations}
            onChange={setWantsToChangeAllocations}
            options={[
              { label: 'Yes, I\'d like to review my allocations', value: 'yes' },
              { label: 'No, keep as they are', value: 'no' },
            ]}
            collapseOnSelect={false}
          />
        </StepCard>
      );
    }

    return (
      <StepCard title="Important Information" scrollable>
        <View style={styles.adviceBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={24}
            color={KindlingColors.brown}
            style={styles.adviceIcon}
          />
          <Text style={styles.adviceText}>
            To challenge your will, an adult would need to demonstrate financial
            need or dependency. A court will consider their circumstances, your
            reasons for the current allocation, and the size of your estate.
          </Text>
        </View>
        <View style={styles.adviceBox}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={24}
            color={KindlingColors.green}
            style={styles.adviceIcon}
          />
          <Text style={styles.adviceText}>
            The strength of any challenge depends heavily on the individual's
            situation. A letter of wishes explaining your reasoning is your most
            important protection here.
          </Text>
        </View>

        <Text style={styles.question}>
          Would you like to review any of these allocations?
        </Text>
        <RadioGroup
          value={wantsToChangeAllocations}
          onChange={setWantsToChangeAllocations}
          options={[
            { label: 'Yes, I\'d like to review my allocations', value: 'yes' },
            { label: 'No, keep as they are', value: 'no' },
          ]}
          collapseOnSelect={false}
        />
      </StepCard>
    );
  };

  const renderOutcome = () => {
    const changesRequested = wantsToChangeAllocations === 'yes';
    return (
      <StepCard title="Noted" scrollable>
        <View style={styles.outcomeCenter}>
          <View style={styles.tickCircle}>
            <MaterialCommunityIcons name="check" size={32} color={KindlingColors.background} />
          </View>
          <Text style={styles.outcomeHeading}>
            {changesRequested ? 'Allocation review added' : 'Answer recorded'}
          </Text>
          <Text style={styles.outcomeBody}>
            {changesRequested
              ? 'A task has been added to your planning section to review your allocations. We\'ll also prepare a side letter explaining your intentions.'
              : 'A task has been added to your planning section to create a side letter explaining your intentions.'}
          </Text>
        </View>
      </StepCard>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const renderStep = () => {
    switch (step) {
      case 'listed-in-app': return renderListedInApp();
      case 'select-children': return renderSelectChildren();
      case 'add-children': return renderAddChildren();
      case 'legal-advice': return renderLegalAdvice();
      case 'outcome': return renderOutcome();
    }
  };

  const isFirstStep = step === 'listed-in-app';
  const isFinalStep = step === 'outcome';

  return (
    <View style={styles.container}>
      <View style={styles.cardArea}>{renderStep()}</View>

      <View style={styles.buttonRow}>
        {!isFirstStep && (
          <Button variant="outline" onPress={goBack} icon="arrow-left">
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
            onPress={goToNext}
            disabled={!canContinue}
            icon="arrow-right"
          >
            Continue
          </Button>
        )}
      </View>

      <Dialog
        visible={dobConfirmState?.visible ?? false}
        onDismiss={handleDobConfirmNo}
        title="Check date"
        actions={[
          { label: 'No', onPress: handleDobConfirmNo },
          { label: 'Yes', onPress: handleDobConfirmYes, variant: 'primary' },
        ]}
      >
        {dobConfirmState
          ? `The estimated DOB makes the child ${getAgeYearsMonths(dobConfirmState.dob).years} years, ${getAgeYearsMonths(dobConfirmState.dob).months} months old. Does that sound right?`
          : ''}
      </Dialog>
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

  question: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    lineHeight: Typography.fontSize.md * 1.5,
    marginBottom: Spacing.sm,
  },
  checkboxList: {
    marginTop: Spacing.xs,
  },

  addChildCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  addChildHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addChildLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  removeBtn: {
    padding: Spacing.xs,
    margin: -Spacing.xs,
  },
  removeIcon: {
    margin: 0,
    padding: 0,
  },
  textInput: {
    backgroundColor: KindlingColors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
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
