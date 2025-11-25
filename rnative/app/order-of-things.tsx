/**
 * Order of Things Screen
 * 
 * Shows the next steps in the will creation process
 * Central navigation hub for the main will-building sections
 * 
 * Features:
 * - Dynamic section visibility based on user's situation
 * - Progress tracking (completed/pending)
 * - Navigation to each major section
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../src/components/ui/Button';
import { KindlingLogo } from '../src/components/ui/KindlingLogo';
import { useAppState } from '../src/hooks/useAppState';
import { getPersonFullName } from '../src/utils/helpers';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography } from '../src/styles/constants';

/**
 * Section definitions for the will journey
 */
interface Section {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  isComingSoon?: boolean;
  showCondition?: () => boolean;
  completedCondition?: () => boolean;
}

/**
 * Section card component for navigation
 */
interface SectionCardProps {
  section: Section;
  onPress: () => void;
  completed: boolean;
  locked?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  onPress,
  completed,
  locked = false,
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={locked ? 1 : 0.7}
      disabled={locked}
    >
      <View style={[
        styles.sectionCard, 
        completed && styles.sectionCardCompleted,
        locked && styles.sectionCardLocked,
      ]}>
        <View style={[
          styles.sectionIcon,
          completed && styles.sectionIconCompleted,
        ]}>
          <IconButton
            icon={completed ? 'check-circle' : section.icon}
            iconColor={completed ? KindlingColors.green : locked ? KindlingColors.mutedForeground : KindlingColors.navy}
            size={24}
          />
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}>
            <Text style={[
              styles.sectionTitle,
              locked && styles.sectionTitleLocked,
            ]}>
              {section.title}
            </Text>
            {section.isComingSoon && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.sectionDescription,
            locked && styles.sectionDescriptionLocked,
          ]}>
            {section.description}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          iconColor={locked ? KindlingColors.border : KindlingColors.mutedForeground}
          size={20}
        />
      </View>
    </TouchableOpacity>
  );
};

/**
 * OrderOfThingsScreen component
 * 
 * Main navigation hub for will creation process
 */
export default function OrderOfThingsScreen() {
  const { willActions, personActions, relationshipActions, bequeathalActions } = useAppState();
  
  const user = willActions.getUser();
  const executors = personActions.getExecutors();
  const childrenInCare = personActions.getPeopleInCare();
  const assets = bequeathalActions.getAllAssets();
  const willData = willActions.getWillData();
  
  // Get children to check for guardianship needs
  const children = user ? relationshipActions.getChildren(user.id) : [];
  const childrenUnder18 = children.filter(c => c.isUnder18);
  
  // Check if guardianship section should show
  const needsGuardianship = childrenUnder18.length > 0 || childrenInCare.length > 0;
  
  // Check guardianship completion
  const hasGuardians = Object.keys(willData.guardianship || {}).length > 0;
  
  /**
   * Define all sections of the will journey
   */
  const sections: Section[] = [
    {
      id: 'executors',
      title: 'Choose Your Executors',
      description: 'Who will carry out your wishes',
      icon: 'account-supervisor',
      route: '/executors',
      isComingSoon: true,
      completedCondition: () => executors.length > 0,
    },
    {
      id: 'guardianship',
      title: 'Guardianship',
      description: 'Who will care for your children',
      icon: 'human-child',
      route: '/guardianship',
      isComingSoon: true,
      showCondition: () => needsGuardianship,
      completedCondition: () => hasGuardians,
    },
    {
      id: 'assets',
      title: 'Your Assets',
      description: 'Tell us about your property, savings, and valuables',
      icon: 'home-city',
      route: '/assets',
      isComingSoon: true,
      completedCondition: () => assets.length > 0,
    },
    {
      id: 'estate-division',
      title: 'Divide Your Estate',
      description: 'How your assets will be distributed',
      icon: 'chart-pie',
      route: '/estate-division',
      isComingSoon: true,
      completedCondition: () => false, // TODO: Check estate remainder state
    },
    {
      id: 'warnings',
      title: 'Warning Flags',
      description: 'Issues that need attention',
      icon: 'alert-circle',
      route: '/warnings',
      isComingSoon: true,
      completedCondition: () => false,
    },
    {
      id: 'optimisations',
      title: 'Optimisations',
      description: 'Tax planning opportunities',
      icon: 'lightbulb',
      route: '/optimisations',
      isComingSoon: true,
      completedCondition: () => false,
    },
    {
      id: 'review',
      title: 'Review & Sign',
      description: 'Final review before completion',
      icon: 'file-document-check',
      route: '/review',
      isComingSoon: true,
      completedCondition: () => willData.status === 'final',
    },
  ];
  
  /**
   * Filter sections based on show conditions
   */
  const visibleSections = sections.filter(section => 
    !section.showCondition || section.showCondition()
  );
  
  /**
   * Handle section navigation
   */
  const handleSectionPress = (section: Section) => {
    if (section.isComingSoon) {
      Alert.alert(
        'Coming Soon',
        `The "${section.title}" section is currently being developed. Check back soon!`,
        [{ text: 'OK' }]
      );
    } else if (section.route) {
      router.push(section.route as any);
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  /**
   * Calculate progress
   */
  const completedCount = visibleSections.filter(s => 
    s.completedCondition && s.completedCondition()
  ).length;
  const progressPercentage = Math.round((completedCount / visibleSections.length) * 100);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Button variant="outline" onPress={handleBack}>Back</Button>
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Button variant="outline" onPress={() => router.push('/developer/dashboard')}>
          Dev
        </Button>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Your Will Journey</Text>
          <Text style={styles.pageSubtitle}>
            {user ? `Hi ${user.firstName}! ` : ''}Here's what we'll cover together to create your will
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedCount} of {visibleSections.length} sections complete
            </Text>
          </View>
        </View>
        
        {/* Sections */}
        <View style={styles.sections}>
          {visibleSections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              onPress={() => handleSectionPress(section)}
              completed={section.completedCondition ? section.completedCondition() : false}
            />
          ))}
        </View>
        
        {/* Family Summary Card */}
        <View style={styles.familySummaryCard}>
          <Text style={styles.familySummaryTitle}>Family Overview</Text>
          <View style={styles.familySummaryRow}>
            <View style={styles.familyStat}>
              <Text style={styles.familyStatNumber}>
                {children.length}
              </Text>
              <Text style={styles.familyStatLabel}>
                {children.length === 1 ? 'Child' : 'Children'}
              </Text>
            </View>
            <View style={styles.familyStat}>
              <Text style={styles.familyStatNumber}>
                {executors.length}
              </Text>
              <Text style={styles.familyStatLabel}>
                {executors.length === 1 ? 'Executor' : 'Executors'}
              </Text>
            </View>
            <View style={styles.familyStat}>
              <Text style={styles.familyStatNumber}>
                {assets.length}
              </Text>
              <Text style={styles.familyStatLabel}>
                {assets.length === 1 ? 'Asset' : 'Assets'}
              </Text>
            </View>
          </View>
          
          {/* Edit Family Button */}
          <TouchableOpacity 
            style={styles.editFamilyButton}
            onPress={() => router.push('/onboarding/family')}
            activeOpacity={0.7}
          >
            <IconButton icon="pencil" size={16} iconColor={KindlingColors.green} />
            <Text style={styles.editFamilyText}>Edit Family Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  titleContainer: {
    marginBottom: Spacing.xl,
  },
  pageTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  pageSubtitle: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginBottom: Spacing.md,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: KindlingColors.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: KindlingColors.green,
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    marginTop: Spacing.xs,
  },
  sections: {
    gap: Spacing.sm,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KindlingColors.border,
  },
  sectionCardCompleted: {
    borderColor: KindlingColors.green,
    backgroundColor: `${KindlingColors.green}05`,
  },
  sectionCardLocked: {
    opacity: 0.6,
    backgroundColor: KindlingColors.muted,
  },
  sectionIcon: {
    marginRight: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${KindlingColors.navy}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconCompleted: {
    backgroundColor: `${KindlingColors.green}15`,
  },
  sectionContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  sectionTitleLocked: {
    color: KindlingColors.mutedForeground,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    marginTop: 2,
  },
  sectionDescriptionLocked: {
    color: KindlingColors.border,
  },
  comingSoonBadge: {
    backgroundColor: `${KindlingColors.brown}20`,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.brown,
    fontWeight: Typography.fontWeight.medium,
  },
  familySummaryCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KindlingColors.border,
  },
  familySummaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.md,
  },
  familySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  familyStat: {
    alignItems: 'center',
  },
  familyStatNumber: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.green,
  },
  familyStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
  editFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
    marginTop: Spacing.sm,
  },
  editFamilyText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.green,
    fontWeight: Typography.fontWeight.medium,
  },
});
