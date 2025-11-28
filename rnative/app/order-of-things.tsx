/**
 * Order of Things Screen - Remediated Version
 * 
 * Main dashboard screen after onboarding
 * Matches web prototype exactly
 * 
 * Features:
 * - "Your Will Dashboard" title
 * - Simple progress percentage
 * - Two card groups: "Build Your Will" and "Finalize Your Will"
 * - Square/CheckSquare icons for completion status
 * - HelpCircle icons on all options
 * - Will type option in Finalize section
 * - Tax & Estate Summary button at bottom
 * - NO family overview card
 * - NO edit family button
 * - NO coming soon badges
 * - NO dynamic assets display
 */

import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../src/components/ui/Button';
import { BackButton } from '../src/components/ui/BackButton';
import { Tooltip } from '../src/components/ui/Tooltip';
import { KindlingLogo } from '../src/components/ui/KindlingLogo';
import { useAppState } from '../src/hooks/useAppState';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography } from '../src/styles/constants';

/**
 * Section option component
 */
interface SectionOptionProps {
  icon: string;
  title: string;
  tooltip: string;
  completed?: boolean;
  onPress: () => void;
}

const SectionOption: React.FC<SectionOptionProps> = ({
  icon,
  title,
  tooltip,
  completed = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.optionCard, completed && styles.optionCardCompleted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionContent}>
        {/* Completion checkbox */}
        <IconButton
          icon={completed ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={20}
          iconColor={completed ? KindlingColors.green : `${KindlingColors.navy}99`}
        />
        
        {/* Section icon */}
        <IconButton
          icon={icon}
          size={20}
          iconColor={KindlingColors.navy}
        />
        
        {/* Title and completion status */}
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>{title}</Text>
          {completed && (
            <Text style={styles.completedBadge}>Completed</Text>
          )}
        </View>
        
        {/* Help icon */}
        <Tooltip content={tooltip}>
          <IconButton
            icon="help-circle"
            size={20}
            iconColor={`${KindlingColors.navy}66`}
          />
        </Tooltip>
      </View>
    </TouchableOpacity>
  );
};

/**
 * OrderOfThingsScreen component
 */
export default function OrderOfThingsScreen() {
  const { willActions, personActions } = useAppState();
  
  // Check completion status
  const checkSectionCompletion = () => {
    try {
      const willData = willActions.getWillData();
      const executors = willData.executors || [];
      const hasExecutorsComplete = executors.length >= 1;
      
      const guardians = personActions.getPeopleByRole('guardian') || [];
      const hasGuardians = guardians.length > 0;
      
      const hasEstateDivision = false; // Not implemented yet
      
      return {
        executorsComplete: hasExecutorsComplete,
        guardiansComplete: hasGuardians,
        estateDivisionComplete: hasEstateDivision,
        anyComplete: hasExecutorsComplete || hasGuardians || hasEstateDivision,
      };
    } catch (error) {
      console.log('Error checking section completion:', error);
      return {
        executorsComplete: false,
        guardiansComplete: false,
        estateDivisionComplete: false,
        anyComplete: false,
      };
    }
  };
  
  const sectionCompletion = checkSectionCompletion();
  
  // Calculate overall progress
  const totalSections = 9; // 5 build + 4 generate
  const completedSections = 
    (sectionCompletion.executorsComplete ? 1 : 0) +
    (sectionCompletion.guardiansComplete ? 1 : 0) +
    (sectionCompletion.estateDivisionComplete ? 1 : 0);
  const progressPercentage = Math.round((completedSections / totalSections) * 100);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleNavigateToExecutors = () => {
    console.log('Navigate to Executors');
    // router.push('/executors');
  };
  
  const handleNavigateToGuardianship = () => {
    console.log('Navigate to Guardianship');
    // router.push('/guardianship');
  };
  
  const handleNavigateToEstateDivision = () => {
    console.log('Navigate to Estate Division');
    // router.push('/estate-division');
  };
  
  const handleNavigateToWarningFlags = () => {
    console.log('Navigate to Warning Flags');
    // router.push('/warning-flags');
  };
  
  const handleNavigateToOptimisations = () => {
    console.log('Navigate to Optimisations');
    // router.push('/optimisations');
  };
  
  const handleNavigateToWillType = () => {
    console.log('Navigate to Will Type');
    // router.push('/will-type');
  };
  
  const handleNavigateToReview = () => {
    console.log('Navigate to Review');
    // router.push('/review');
  };
  
  const handleNavigateToSign = () => {
    console.log('Navigate to Sign');
    // router.push('/sign');
  };
  
  const handleNavigateToStore = () => {
    console.log('Navigate to Store');
    // router.push('/store');
  };
  
  const handleSummary = () => {
    console.log('Navigate to Tax & Estate Summary');
    // router.push('/estate-summary');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Text style={styles.stepText}>Dashboard</Text>
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
        {/* Title - matches prototype */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Your Will Dashboard</Text>
        </View>
        
        {/* Build Your Will Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <IconButton
                icon="target"
                size={20}
                iconColor={KindlingColors.navy}
              />
            </View>
            <Text style={styles.sectionTitle}>Build Your Will</Text>
          </View>
          
          <View style={styles.sectionContent}>
            <SectionOption
              icon="account-group"
              title="Choose your executors"
              tooltip="Executors manage your estate after you pass away. Choose trusted people to handle your affairs."
              completed={sectionCompletion.executorsComplete}
              onPress={handleNavigateToExecutors}
            />
            
            <SectionOption
              icon="baby-face"
              title="Choose guardianship of your children"
              tooltip="If you have children under 18, you can appoint guardians to care for them if needed."
              completed={sectionCompletion.guardiansComplete}
              onPress={handleNavigateToGuardianship}
            />
            
            <SectionOption
              icon="gift"
              title="Divide your estate"
              tooltip="Decide who receives what from your estate. You can leave specific gifts or percentages."
              completed={sectionCompletion.estateDivisionComplete}
              onPress={handleNavigateToEstateDivision}
            />
            
            <SectionOption
              icon="alert-circle"
              title="Review warning flags"
              tooltip="We'll highlight any potential issues or risks with your current will setup."
              onPress={handleNavigateToWarningFlags}
            />
            
            <SectionOption
              icon="trending-up"
              title="Tax optimisation"
              tooltip="Explore ways to reduce inheritance tax and protect your beneficiaries."
              onPress={handleNavigateToOptimisations}
            />
          </View>
        </View>
        
        {/* Generate Your Will Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, styles.sectionIconCircleGreen]}>
              <IconButton
                icon="file-document-outline"
                size={20}
                iconColor={KindlingColors.green}
              />
            </View>
            <Text style={styles.sectionTitle}>Generate Your Will</Text>
          </View>
          
          <View style={styles.sectionContent}>
            <SectionOption
              icon="file-document"
              title="Will Type"
              tooltip="Choose the type of will that best suits your needs."
              onPress={handleNavigateToWillType}
            />
            
            <SectionOption
              icon="text-box-check"
              title="Review"
              tooltip="Review your will to ensure all details are correct."
              onPress={handleNavigateToReview}
            />
            
            <SectionOption
              icon="draw"
              title="Sign"
              tooltip="Electronically sign your will to make it legally valid."
              onPress={handleNavigateToSign}
            />
            
            <SectionOption
              icon="safe"
              title="Store"
              tooltip="Securely store your will and share access with your executors."
              onPress={handleNavigateToStore}
            />
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Tax & Estate Summary Button - Fixed at bottom */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleSummary}
          disabled={!sectionCompletion.anyComplete}
        >
          Tax & Estate Summary
        </Button>
        <Text style={styles.footerCaption}>
          View comprehensive breakdown of your estate
        </Text>
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
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  titleContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
  },
  progressCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
  },
  progressPercentage: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    fontWeight: Typography.fontWeight.medium,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: KindlingColors.cream,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: KindlingColors.green,
    borderRadius: 4,
  },
  sectionCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconCircleGreen: {
    backgroundColor: `${KindlingColors.green}1a`,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  sectionContent: {
    gap: Spacing.sm,
  },
  optionCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: `${KindlingColors.navy}33`,
  },
  optionCardCompleted: {
    borderColor: `${KindlingColors.green}66`,
    backgroundColor: `${KindlingColors.green}0d`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
  },
  completedBadge: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.green,
    marginTop: Spacing.xs / 2,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.cream,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.navy}1a`,
  },
  footerCaption: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.brown}99`,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
