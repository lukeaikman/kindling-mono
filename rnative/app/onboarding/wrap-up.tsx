/**
 * Onboarding Wrap Up Screen
 * 
 * Final screen in the onboarding flow
 * Shows summary and confirms completion
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
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
  const { willActions, personActions } = useAppState();
  
  const user = willActions.getUser();
  const people = personActions.getPeople();
  
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
        <Card style={styles.card}>
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
            <Text style={styles.summaryTitle}>Summary</Text>
            
            {user && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Will Maker:</Text>
                <Text style={styles.summaryValue}>{getPersonFullName(user)}</Text>
              </View>
            )}
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Family Members:</Text>
              <Text style={styles.summaryValue}>{people.length - 1} person(s)</Text>
            </View>
          </View>
        </Card>
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
    padding: Spacing.lg,
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
    padding: Spacing.lg,
    flexGrow: 1,
  },
  card: {
    padding: Spacing.lg,
    width: '100%',
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
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});

