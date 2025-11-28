/**
 * Professional Executor Screen (Placeholder)
 * 
 * Placeholder screen for professional executor service information.
 * Reference: web-prototype/src/components/ProfessionalExecutorScreen.tsx
 * 
 * @module app/executors/professional
 */

import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { Card } from '../../src/components/ui/Card';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

/**
 * ProfessionalExecutorScreen component
 * 
 * Placeholder for professional executor information and services.
 * Future: Will include forms and professional service integration.
 */
export default function ProfessionalExecutorScreen() {
  // Double tap functionality for dev dashboard (on header)
  const lastTapRef = useRef<number>(0);
  
  const handleHeaderPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      router.push('/developer/dashboard');
    }
    lastTapRef.current = now;
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const handleContinue = () => {
    // Navigate to order of things (or future bequeathal-intro)
    router.push('/order-of-things');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.9}>
        <View style={styles.header}>
          <BackButton onPress={handleBack} />
          <View style={styles.headerCenter}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="briefcase"
                size={20}
                iconColor={KindlingColors.navy}
              />
            </View>
            <Text style={styles.headerTitle}>Professional Executor Services</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </TouchableOpacity>
      
      {/* Content */}
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
            <Card style={styles.infoCard}>
              <Text style={styles.cardTitle}>Professional Executor Information</Text>
              <Text style={styles.cardText}>
                This section is under development. We'll help you explore professional executor 
                options and integrate them into your will.
              </Text>
              <Text style={styles.cardTextSecondary}>
                Professional executors typically charge a percentage of your estate value and 
                provide comprehensive estate administration services.
              </Text>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleContinue}
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
    backgroundColor: KindlingColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: KindlingColors.cream,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  headerRight: {
    width: 40,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentCard: {
    marginHorizontal: Spacing.lg,
  },
  infoCard: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  cardText: {
    fontSize: Typography.fontSize.md,
    color: `${KindlingColors.navy}cc`,
    lineHeight: 22,
  },
  cardTextSecondary: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 0.5,
    borderTopColor: KindlingColors.cream,
  },
});

