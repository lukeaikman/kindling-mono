/**
 * Onboarding Family Screen
 * 
 * Third screen in the onboarding flow
 * Collects information about spouse/partner and children
 * 
 * NOTE: This is a simplified version. Full implementation will include:
 * - Relationship status (married, civil partnership, etc.)
 * - Spouse/partner details
 * - Children management (add, edit, remove)
 * - Guardian assignment
 * - Relationship edge creation
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RadioGroup } from '../../src/components/ui/RadioGroup';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

/**
 * OnboardingFamilyScreen component (simplified)
 */
export default function OnboardingFamilyScreen() {
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [hasChildren, setHasChildren] = useState('');
  
  const handleContinue = () => {
    if (!isValid) return;
    
    console.log('👨‍👩‍👧‍👦 Family data:', { relationshipStatus, hasChildren });
    
    // Skip extended family for now, go straight to wrap-up
    router.push('/onboarding/wrap-up');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const isValid = relationshipStatus && hasChildren;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Button variant="outline" onPress={handleBack}>Back</Button>
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Text style={styles.stepText}>Step 3 of 5</Text>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          {/* Icon Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="account-group"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Tell us about your family</Text>
          <Text style={styles.subtitle}>
            This helps us understand your situation
          </Text>
          
          {/* Form */}
          <View style={styles.form}>
            <RadioGroup
              label="What's your relationship status?"
              value={relationshipStatus}
              onChange={setRelationshipStatus}
              options={[
                { label: 'Married', value: 'married' },
                { label: 'Civil Partnership', value: 'civil-partnership' },
                { label: 'Living with Partner', value: 'living-with-partner' },
                { label: 'Single', value: 'single' },
                { label: 'Divorced', value: 'divorced' },
                { label: 'Widowed', value: 'widowed' },
              ]}
            />
            
            <RadioGroup
              label="Do you have any children?"
              value={hasChildren}
              onChange={setHasChildren}
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
            />
            
            <Text style={styles.note}>
              Note: Full family management (spouse details, children details, guardian assignment) will be implemented in the complete version.
            </Text>
          </View>
        </Card>
      </ScrollView>
      
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
  form: {
    gap: Spacing.md,
  },
  note: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    fontStyle: 'italic',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: KindlingColors.muted,
    borderRadius: 8,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});

