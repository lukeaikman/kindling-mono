/**
 * Onboarding Wrap Up Screen
 * 
 * Final screen in the onboarding flow
 * Shows summary and confirms completion
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { useAppState } from '../../src/hooks/useAppState';
import { getPersonFullName } from '../../src/utils/helpers';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

/**
 * OnboardingWrapUpScreen component
 * 
 * Shows summary of onboarding data and completes the flow
 */
export default function OnboardingWrapUpScreen() {
  const { willActions, personActions, relationshipActions } = useAppState();
  
  const user = willActions.getUser();
  const people = personActions.getPeople();
  
  // Get family statistics
  const spouse = user ? relationshipActions.getSpouse(user.id, 'active') : undefined;
  const children = user ? relationshipActions.getChildren(user.id) : [];
  const childrenUnder18 = children.filter(c => c.isUnder18);
  const siblings = user ? relationshipActions.getSiblings(user.id) : [];
  const familyMemberCount = people.filter(p => p.roles.includes('family-member')).length;
  
  const handleFinish = () => {
    console.log('✅ Onboarding completed');
    router.push('/order-of-things');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Button variant="outline" onPress={handleBack}>Back</Button>
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Text style={styles.stepText}>Step 5 of 5</Text>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.contentCard}>
          {/* Icon Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="check-circle"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Great! You're all set</Text>
          <Text style={styles.subtitle}>
            We've collected your basic information. Now let's build your will.
          </Text>
          
          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>What we know so far</Text>
            
            {user && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Will Maker</Text>
                <Text style={styles.summaryValue}>{getPersonFullName(user)}</Text>
              </View>
            )}
            
            {spouse && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Spouse/Partner</Text>
                <Text style={styles.summaryValue}>{getPersonFullName(spouse)}</Text>
              </View>
            )}
            
            {children.length > 0 && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Children</Text>
                <Text style={styles.summaryValue}>
                  {children.length} {children.length === 1 ? 'child' : 'children'}
                  {childrenUnder18.length > 0 && ` (${childrenUnder18.length} under 18)`}
                </Text>
              </View>
            )}
            
            {siblings.length > 0 && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Siblings</Text>
                <Text style={styles.summaryValue}>{siblings.length}</Text>
              </View>
            )}
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total People Added</Text>
              <Text style={styles.summaryValue}>{familyMemberCount}</Text>
            </View>
          </View>
          
          {/* Next Steps Preview */}
          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>What's next?</Text>
            <View style={styles.nextStepItem}>
              <IconButton icon="account-supervisor" size={18} iconColor={KindlingColors.green} />
              <Text style={styles.nextStepText}>Choose your executors</Text>
            </View>
            {childrenUnder18.length > 0 && (
              <View style={styles.nextStepItem}>
                <IconButton icon="human-child" size={18} iconColor={KindlingColors.green} />
                <Text style={styles.nextStepText}>Appoint guardians for your children</Text>
              </View>
            )}
            <View style={styles.nextStepItem}>
              <IconButton icon="chart-pie" size={18} iconColor={KindlingColors.green} />
              <Text style={styles.nextStepText}>Decide how to divide your estate</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Action Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleFinish}
        >
          Continue to Next Steps
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
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${KindlingColors.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  summary: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: KindlingColors.muted,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.mutedForeground,
  },
  summaryValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  nextSteps: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.green}10`,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: KindlingColors.green,
  },
  nextStepsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  nextStepText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});

