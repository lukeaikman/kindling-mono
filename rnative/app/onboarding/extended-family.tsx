/**
 * Onboarding Extended Family Screen - Remediated Version
 * 
 * Fourth screen in the onboarding flow
 * Matches web prototype exactly
 * 
 * Features:
 * - Parents alive question (3 options: Yes, One alive, No)
 * - Partner's parents question (conditional on relationship status)
 * - Siblings question with number input only
 * - NO parent name collection
 * - NO other important people section
 * - NO skip button
 * - HelpCircle tooltips on all questions
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RadioGroup } from '../../src/components/ui/RadioGroup';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { Input } from '../../src/components/ui/Input';
import { Tooltip } from '../../src/components/ui/Tooltip';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { useAppState } from '../../src/hooks/useAppState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

/**
 * OnboardingExtendedFamilyScreen component
 */
export default function OnboardingExtendedFamilyScreen() {
  const { willActions, relationshipActions } = useAppState();
  
  // Form state - matches prototype exactly
  const [parentsAlive, setParentsAlive] = useState('');
  const [parentsInLawAlive, setParentsInLawAlive] = useState('');
  const [siblingsAlive, setSiblingsAlive] = useState('');
  const [numberOfSiblings, setNumberOfSiblings] = useState('');
  
  // Determine if we need to show partner's parents question
  const user = willActions.getUser();
  const spouse = user ? relationshipActions.getSpouse(user.id, 'active') : undefined;
  const showParentsInLaw = spouse !== undefined;
  
  // Load existing data on mount
  useEffect(() => {
    // Note: In prototype, this data is not persisted to the data model
    // It's used for planning/understanding only
    // We're just collecting it for now
  }, []);
  
  /**
   * Handle continue - validate and navigate
   */
  const handleContinue = () => {
    if (!isValid) return;
    
    console.log('📋 Extended family data collected:', {
      parentsAlive,
      parentsInLawAlive: showParentsInLaw ? parentsInLawAlive : undefined,
      siblingsAlive,
      numberOfSiblings: siblingsAlive === 'yes' ? numberOfSiblings : undefined,
    });
    
    // Note: In prototype, this data is NOT saved to PersonData
    // It's just collected for understanding family complexity
    
    router.push('/onboarding/wrap-up');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  // Validation - matches prototype
  const isValid = 
    parentsAlive && 
    (!showParentsInLaw || parentsInLawAlive) && 
    siblingsAlive && 
    (siblingsAlive === 'no' || numberOfSiblings);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Text style={styles.stepText}>Step 4 of 5</Text>
      </View>
      
      {/* Content with Keyboard Handling */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.contentCard}>
          {/* Icon Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="account-multiple"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title - matches prototype */}
          <Text style={styles.title}>Extended family</Text>
          <Text style={styles.subtitle}>
            A few more family details help us spot risks and plan better
          </Text>
          
          {/* Form */}
          <View style={styles.form}>
            {/* Parents Alive - with tooltip */}
            <View style={styles.questionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.questionLabel}>Are either of your parents still alive?</Text>
                <Tooltip content="Living parents may have inheritance claims if your will doesn't cover all scenarios.">
                  <IconButton
                    icon="help-circle"
                    size={16}
                    iconColor={KindlingColors.mutedForeground}
                  />
                </Tooltip>
              </View>
              <RadioGroup
                value={parentsAlive}
                onChange={setParentsAlive}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'One alive', value: 'one-alive' },
                  { label: 'No', value: 'no' },
                ]}
              />
            </View>
            
            {/* Partner's Parents - Conditional, with tooltip */}
            {showParentsInLaw && (
              <View style={styles.questionContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.questionLabel}>
                    Are either of your <Text style={{ textDecorationLine: 'underline' }}>partner's parents</Text> still alive?
                  </Text>
                  <Tooltip content="Your partner's family may become relevant if your partner passes away before you.">
                    <IconButton
                      icon="help-circle"
                      size={16}
                      iconColor={KindlingColors.mutedForeground}
                    />
                  </Tooltip>
                </View>
                <RadioGroup
                  value={parentsInLawAlive}
                  onChange={setParentsInLawAlive}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'One alive', value: 'one-alive' },
                    { label: 'No', value: 'no' },
                  ]}
                />
              </View>
            )}
            
            {/* Siblings Alive - with tooltip */}
            <View style={styles.questionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.questionLabel}>Do you have any brothers or sisters still alive?</Text>
                <Tooltip content="Siblings may have inheritance rights under certain circumstances, especially if no will exists.">
                  <IconButton
                    icon="help-circle"
                    size={16}
                    iconColor={KindlingColors.mutedForeground}
                  />
                </Tooltip>
              </View>
              <RadioGroup
                value={siblingsAlive}
                onChange={(value) => {
                  setSiblingsAlive(value);
                  if (value === 'no') {
                    setNumberOfSiblings('');
                  }
                }}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ]}
              />
            </View>
            
            {/* Number of Siblings - Conditional, with tooltip */}
            {siblingsAlive === 'yes' && (
              <View style={styles.questionContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>How many siblings are alive?</Text>
                  <Tooltip content="This helps us understand the potential complexity of family inheritance scenarios.">
                    <IconButton
                      icon="help-circle"
                      size={16}
                      iconColor={KindlingColors.mutedForeground}
                    />
                  </Tooltip>
                </View>
                <Input
                  value={numberOfSiblings}
                  onChangeText={setNumberOfSiblings}
                  placeholder="Enter number"
                  keyboardType="number-pad"
                />
              </View>
            )}
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Action Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleContinue}
          disabled={!isValid}
        >
          Continue
        </Button>
      </View>
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
  stepText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
    flexGrow: 1,
  },
  contentCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${KindlingColors.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  questionContainer: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  questionLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    flex: 1,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});
