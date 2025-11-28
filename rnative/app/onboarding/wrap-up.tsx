/**
 * Onboarding Wrap-Up Screen - Remediated Version
 * 
 * Fifth and final screen in the onboarding flow
 * Matches web prototype exactly
 * 
 * Features:
 * - Static completion message
 * - "What we've covered" checklist (static, not dynamic)
 * - "Coming up next" preview with simple bullets
 * - NO dynamic data display
 */

import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

/**
 * OnboardingWrapUpScreen component
 */
export default function OnboardingWrapUpScreen() {
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
        <BackButton onPress={handleBack} />
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Text style={styles.stepText}>Step 5 of 5</Text>
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
                icon="check-circle"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title - matches prototype exactly */}
          <Text style={styles.title}>Great work — that's the essentials</Text>
          
          {/* What we've covered - Static checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What we've covered:</Text>
            <View style={styles.checklistItem}>
              <IconButton
                icon="check-circle"
                size={16}
                iconColor={KindlingColors.green}
              />
              <Text style={styles.checklistText}>Personal details</Text>
            </View>
            <View style={styles.checklistItem}>
              <IconButton
                icon="check-circle"
                size={16}
                iconColor={KindlingColors.green}
              />
              <Text style={styles.checklistText}>Location & residence</Text>
            </View>
            <View style={styles.checklistItem}>
              <IconButton
                icon="check-circle"
                size={16}
                iconColor={KindlingColors.green}
              />
              <Text style={styles.checklistText}>Family situation</Text>
              </View>
            <View style={styles.checklistItem}>
              <IconButton
                icon="check-circle"
                size={16}
                iconColor={KindlingColors.green}
              />
              <Text style={styles.checklistText}>Extended family</Text>
            </View>
          </View>
          
          {/* Coming up next - Simple bullets (matches prototype) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coming up next:</Text>
            <Text style={styles.bulletItem}>• Choosing your executors.</Text>
            <Text style={styles.bulletItem}>• Planning guardianship</Text>
            <Text style={styles.bulletItem}>• Adding your assets</Text>
            <Text style={styles.bulletItem}>• Choosing who gets what</Text>
            <Text style={styles.bulletItem}>• Structuring to reduce tax</Text>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Action Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleFinish}
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
    marginBottom: Spacing.xl,
  },
  section: {
    backgroundColor: `${KindlingColors.cream}50`,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  checklistText: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}cc`,
    marginLeft: Spacing.xs,
  },
  bulletItem: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}b3`,
    marginVertical: Spacing.xs / 2,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});
