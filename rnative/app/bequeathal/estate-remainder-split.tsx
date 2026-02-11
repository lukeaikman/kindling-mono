/**
 * Estate Remainder Split Screen
 * 
 * Second screen in estate residue flow - adjust HOW MUCH each recipient gets
 * Must total exactly 100% before proceeding
 * 
 * Features:
 * - Slider + manual input for each recipient
 * - "Make Equal to 100%" button (proportional adjustment)
 * - Add charity inline
 * - Remove recipient when percentage = 0%
 * - Haptic feedback on 100% achievement
 * - Validation prevents progression unless total = 100%
 * 
 * @module app/bequeathal/estate-remainder-split
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { IconButton, Text as PaperText } from 'react-native-paper';
import { useAppState } from '../../src/hooks/useAppState';
import { BackButton } from '../../src/components/ui/BackButton';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Slider } from '../../src/components/ui/Slider';
import { Celebration } from '../../src/components/ui/Celebration';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { getNextYourPeopleRoute, type WillProgressState } from '../../src/utils/willProgress';
import type { Person } from '../../src/types';

interface SharingRecipient {
  splitId: string;
  label: string;
  subLabel?: string;
  avatarText?: string;
  isGroup: boolean;
}

export default function EstateRemainderSplitScreen() {
  const {
    personActions,
    beneficiaryGroupActions,
    estateRemainderActions,
    willActions,
    bequeathalActions,
  } = useAppState();

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  const progressState: WillProgressState = useMemo(() => ({
    willMaker: willActions.getUser(),
    people: personActions.getPeople(),
    willData: willActions.getWillData(),
    estateRemainderState: estateRemainderActions.getEstateRemainderState(),
    bequeathalData: bequeathalActions.getBequeathalData(),
  }), [willActions, personActions, estateRemainderActions, bequeathalActions]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    const next = getNextYourPeopleRoute(progressState);
    router.push(next as any);
  }, [progressState]);

  // Local state for manual input tracking
  const [manualEntries, setManualEntries] = useState<Record<string, string>>(
    {}
  );
  const [showAddCharity, setShowAddCharity] = useState(false);
  const [charityName, setCharityName] = useState('');
  const [previousTotal, setPreviousTotal] = useState(0);

  // Get estate remainder state from actions
  const estateState = estateRemainderActions.getEstateRemainderState();
  const { selectedPeopleIds, selectedGroupIds, splits } = estateState;

  // Get person/group objects
  const selectedPeople = selectedPeopleIds
    .map((id) => personActions.getPersonById(id))
    .filter((person): person is Person => Boolean(person));

  // Calculate total percentage
  const getTotalPercentage = (splitsObj: Record<string, number>) => {
    return Object.values(splitsObj).reduce(
      (sum, percentage) => sum + (Number.isFinite(percentage) ? percentage : 0),
      0
    );
  };

  const totalPercentage = getTotalPercentage(splits);
  const remainingPercentage = 100 - totalPercentage;

  // Haptic feedback when achieving 100%
  useEffect(() => {
    const isExactly100 = Math.abs(totalPercentage - 100) <= 0.1;
    const wasNot100 = Math.abs(previousTotal - 100) > 0.1;

    if (isExactly100 && wasNot100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setPreviousTotal(totalPercentage);
  }, [totalPercentage]);

  // Helper functions
  const getPersonFullName = (person: Person) => {
    return `${person.firstName} ${person.lastName}`.trim();
  };

  const clampPercentage = (value: number) => {
    if (Number.isNaN(value)) return 0;
    return Math.min(100, Math.max(0, value));
  };

  // Split update handlers
  const updateSplit = (splitId: string, percentage: number) => {
    const clamped = clampPercentage(percentage);
    estateRemainderActions.updateSplit(splitId, clamped);
  };

  const handleManualInputChange = (splitId: string, value: string) => {
    setManualEntries((prev) => ({
      ...prev,
      [splitId]: value,
    }));
  };

  const handleManualInputBlur = (splitId: string) => {
    if (!(splitId in manualEntries)) return;

    const rawValue = manualEntries[splitId];
    const parsedValue = clampPercentage(parseFloat(rawValue));

    if (parsedValue !== splits[splitId]) {
      updateSplit(splitId, parsedValue);
    }

    // Clear from manual entries
    setManualEntries((prev) => {
      const next = { ...prev };
      delete next[splitId];
      return next;
    });
  };

  const handleSliderChange = (splitId: string, value: number) => {
    updateSplit(splitId, value);

    // Clear any pending manual entry
    setManualEntries((prev) => {
      if (!(splitId in prev)) return prev;
      const next = { ...prev };
      delete next[splitId];
      return next;
    });
  };

  // NEW: Proportional normalization to 100%
  const handleMakeEqualTo100 = () => {
    const currentTotal = getTotalPercentage(splits);
    if (currentTotal === 0) return; // Prevent division by zero

    const scaleFactor = 100 / currentTotal;

    // Update all splits proportionally
    Object.keys(splits).forEach((splitId) => {
      const newValue = splits[splitId] * scaleFactor;
      estateRemainderActions.updateSplit(splitId, newValue);
    });

    // Success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveRecipient = (splitId: string) => {
    estateRemainderActions.removeRecipient(splitId);
  };

  // NEW: "Magic wand" - fill this recipient to whatever makes 100%
  const handleAutoFillTo100 = (targetSplitId: string) => {
    // Calculate total of OTHER recipients
    const otherTotal = Object.keys(splits)
      .filter(id => id !== targetSplitId)
      .reduce((sum, id) => sum + (splits[id] || 0), 0);
    
    // Set this recipient to the remainder
    const remainingValue = 100 - otherTotal;
    const clampedValue = clampPercentage(remainingValue);
    
    updateSplit(targetSplitId, clampedValue);
    
    // Haptic feedback for the magic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddCharity = () => {
    if (charityName.trim()) {
      const willId = willActions.getWillData().userId;
      const groupId = beneficiaryGroupActions.addGroup({
        name: charityName.trim(),
        description: 'Charity',
        isPredefined: false,
        isActive: true,
        willId,
      });

      // Add to estate remainder state
      const updatedGroupIds = [...selectedGroupIds, groupId];
      estateRemainderActions.updateSelectedBeneficiaries(
        selectedPeopleIds,
        updatedGroupIds
      );

      setCharityName('');
      setShowAddCharity(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    // Celebrate completion of residue allocation, then auto-progress
    setShowCelebration(true);
  };

  // Build recipients array
  const recipientsFromPeople: SharingRecipient[] = selectedPeople.map((person) => ({
    splitId: `person-${person.id}`,
    label: getPersonFullName(person),
    subLabel: person.relationship?.replace(/-/g, ' '),
    avatarText: `${person.firstName?.[0]}${person.lastName?.[0]}`,
    isGroup: false,
  }));

  const recipientsFromGroups: SharingRecipient[] = selectedGroupIds
    .map((groupId) => {
      const group = beneficiaryGroupActions.getGroupById(groupId);
      if (!group) return null;
      return {
        splitId: `group-${groupId}`,
        label: group.name,
        subLabel: 'Category',
        avatarText: group.name[0],
        isGroup: true,
      };
    })
    .filter((item) => item !== null) as SharingRecipient[];

  const recipients: SharingRecipient[] = [...recipientsFromPeople, ...recipientsFromGroups];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton onPress={handleBack} />
          <View style={styles.titleContainer}>
            <View style={styles.iconCircle}>
              <IconButton icon="account-group" size={20} iconColor={KindlingColors.navy} style={{margin: 0}} />
            </View>
            <Text style={styles.title}>Residue Split</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Adjust how the residual estate should be split
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {recipients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Add beneficiaries or categories to start sharing the residual
              estate.
            </Text>
          </View>
        )}

        {/* Show "Adjust to 100%" button when NOT at 100% */}
        {Math.abs(remainingPercentage) > 0.1 && recipients.length > 0 && (
          <Card style={styles.normalizeCard}>
            <Text style={styles.normalizeTitle}>
              {remainingPercentage > 0
                ? `Over allocated by ${Math.abs(remainingPercentage).toFixed(1)}%`
                : `Under allocated by ${remainingPercentage.toFixed(1)}%`}
            </Text>
            
            <Pressable
              onPress={handleMakeEqualTo100}
              style={styles.normalizeButton}
            >
              <Text style={styles.normalizeButtonText}>
                Adjust to 100%
              </Text>
            </Pressable>
            
            <Text style={styles.normalizeSubtext}>
              Alter all proportionately to total 100%
            </Text>
          </Card>
        )}

        {/* Recipient Cards */}
        {recipients.map(({ splitId, label, subLabel, avatarText, isGroup }) => {
          const percentage = splits[splitId] || 0;

          // Format percentage for display
          const formattedPercentage =
            percentage === 100 ? '100' : percentage.toFixed(1);
          const displayValue = manualEntries[splitId] ?? formattedPercentage;

          return (
            <View key={splitId} style={styles.recipientCard}>
              <View style={styles.recipientHeader}>
                <View style={styles.recipientInfo}>
                  <View
                    style={[
                      styles.avatar,
                      isGroup ? styles.avatarGroup : styles.avatarPerson,
                    ]}
                  >
                    {isGroup ? (
                      <IconButton icon="account-group" size={20} iconColor={KindlingColors.brown} style={{margin: 0}} />
                    ) : (
                      <Text style={styles.avatarText}>{avatarText}</Text>
                    )}
                  </View>
                  <View style={styles.recipientLabels}>
                    <Text style={styles.recipientName}>{label}</Text>
                    {subLabel && (
                      <Text style={styles.recipientSubLabel}>{subLabel}</Text>
                    )}
                  </View>
                </View>

                {/* Percentage Input */}
                <View style={styles.percentageInputContainer}>
                  <TextInput
                    value={displayValue}
                    onChangeText={(value) =>
                      handleManualInputChange(splitId, value)
                    }
                    onBlur={() => handleManualInputBlur(splitId)}
                    keyboardType="numeric"
                    style={styles.percentageInput}
                    placeholder="0"
                  />
                  <Text style={styles.percentageSymbol}>%</Text>
                </View>
              </View>

              {/* Slider with Magic Wand Button */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderRow}>
                  <View style={styles.sliderWrapper}>
                    <Slider
                      value={percentage}
                      onValueChange={(value) => handleSliderChange(splitId, value)}
                      minimumValue={0}
                      maximumValue={100}
                      step={0.1}
                      showValue={false}
                      style={styles.slider}
                    />
                  </View>
                  
                  {/* Magic Wand Button */}
                  <Pressable
                    onPress={() => handleAutoFillTo100(splitId)}
                    style={styles.wandButton}
                  >
                    <Text style={styles.wandIcon}>✦</Text>
                  </Pressable>
                </View>

                {/* Show Remove link when allocation is 0 */}
                {percentage < 0.1 && (
                  <Pressable
                    onPress={() => handleRemoveRecipient(splitId)}
                    style={styles.removeLink}
                  >
                    <Text style={styles.removeLinkText}>Remove</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        {/* Add Charity Section */}
        <View style={styles.addCharitySection}>
          {!showAddCharity ? (
            <Pressable
              onPress={() => setShowAddCharity(true)}
              style={styles.addCharityButton}
            >
              <IconButton icon="plus" size={14} iconColor={KindlingColors.green} style={{margin: 0}} />
              <Text style={styles.addCharityButtonText}>Add Charity</Text>
            </Pressable>
          ) : (
            <Card style={styles.addCharityCard}>
              <View style={styles.addCharityForm}>
                <Input
                  value={charityName}
                  onChangeText={setCharityName}
                  placeholder="Enter charity name"
                />
                <View style={styles.addCharityButtons}>
                  <Pressable
                    onPress={handleAddCharity}
                    disabled={!charityName.trim()}
                    style={[
                      styles.iconButton,
                      styles.iconButtonPrimary,
                      !charityName.trim() && styles.iconButtonDisabled,
                    ]}
                  >
                    <IconButton icon="check" size={16} iconColor={KindlingColors.background} style={{margin: 0, padding: 0}} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowAddCharity(false);
                      setCharityName('');
                    }}
                    style={[styles.iconButton, styles.iconButtonSecondary]}
                  >
                    <IconButton icon="close" size={16} iconColor={KindlingColors.navy} style={{margin: 0, padding: 0}} />
                  </Pressable>
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Over-allocation warning */}
        {remainingPercentage < -0.1 && (
          <Card style={styles.overAllocationCard}>
            <Text style={styles.overAllocationTitle}>
              You've allocated more than 100%
            </Text>
            <Text style={styles.overAllocationText}>
              Please reduce allocations by{' '}
              {Math.abs(remainingPercentage).toFixed(1)}%
            </Text>
          </Card>
        )}

        <Pressable
          onPress={handleNext}
          disabled={Math.abs(remainingPercentage) > 0.1}
          style={[
            styles.nextButton,
            Math.abs(remainingPercentage) > 0.1 && styles.nextButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.nextButtonText,
              Math.abs(remainingPercentage) > 0.1 &&
                styles.nextButtonTextDisabled,
            ]}
          >
            {Math.abs(remainingPercentage) <= 0.1
              ? 'Continue'
              : remainingPercentage > 0.1
              ? `Allocate remaining ${remainingPercentage.toFixed(1)}%`
              : 'Reduce allocation to continue'}
          </Text>
        </Pressable>

        {Math.abs(remainingPercentage) > 0.1 && remainingPercentage > 0 && (
          <Text style={styles.footerHelper}>
            You must allocate 100% of the residual to continue
          </Text>
        )}
      </View>

      {/* Micro celebration – brief checkmark + haptic after completing residue */}
      <Celebration
        visible={showCelebration}
        variant="micro"
        onComplete={handleCelebrationComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 58, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(30, 58, 95, 0.6)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(242, 237, 227, 0.3)',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(30, 58, 95, 0.6)',
    textAlign: 'center',
  },
  normalizeCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  normalizeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
    textAlign: 'center',
  },
  normalizeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  normalizeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  normalizeSubtext: {
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
    textAlign: 'center',
  },
  recipientCard: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.1)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recipientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPerson: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  avatarGroup: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  recipientLabels: {
    flex: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  recipientSubLabel: {
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
    textTransform: 'capitalize',
  },
  percentageInputContainer: {
    position: 'relative',
    width: 96,
  },
  percentageInput: {
    height: 36,
    paddingLeft: 8,
    paddingRight: 28,
    fontSize: 15,
    color: '#1E3A5F',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.2)',
    borderRadius: 8,
    textAlign: 'right',
  },
  percentageSymbol: {
    position: 'absolute',
    right: 8,
    top: 8,
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderWrapper: {
    flex: 1,
  },
  slider: {
    width: '100%',
  },
  wandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wandIcon: {
    fontSize: 20,
    color: '#000000',
  },
  removeLink: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 4,
  },
  removeLinkText: {
    fontSize: 11,
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
  addCharitySection: {
    marginTop: 16,
  },
  addCharityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    alignSelf: 'flex-start',
  },
  addCharityButtonText: {
    fontSize: 13,
    color: '#4CAF50',
  },
  addCharityCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  addCharityForm: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  charityInput: {
    flex: 1,
  },
  addCharityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  iconButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.2)',
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  overAllocationCard: {
    padding: 12,
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderColor: 'rgba(139, 69, 19, 0.2)',
    marginBottom: 12,
  },
  overAllocationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 4,
  },
  overAllocationText: {
    fontSize: 12,
    color: 'rgba(139, 69, 19, 0.7)',
    textAlign: 'center',
  },
  nextButton: {
    height: 48,
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: 'rgba(30, 58, 95, 0.4)',
  },
  footerHelper: {
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
});

