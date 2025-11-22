/**
 * Order of Things Screen
 * 
 * Shows the next steps in the will creation process
 * Central navigation hub for the main will-building sections
 */

import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { KindlingLogo } from '../src/components/ui/KindlingLogo';
import { useAppState } from '../src/hooks/useAppState';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography } from '../src/styles/constants';

/**
 * Section card for navigation
 */
interface SectionCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  completed?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon,
  onPress,
  completed = false,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.sectionCard, completed && styles.sectionCardCompleted]}>
        <View style={styles.sectionIcon}>
          <IconButton
            icon={icon}
            iconColor={completed ? KindlingColors.green : KindlingColors.navy}
            size={24}
          />
        </View>
        <View style={styles.sectionContent}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{description}</Text>
        </View>
        <IconButton
          icon="chevron-right"
          iconColor={KindlingColors.mutedForeground}
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
  const { willActions, personActions } = useAppState();
  
  const user = willActions.getUser();
  const executors = personActions.getExecutors();
  const childrenInCare = personActions.getPeopleInCare();
  
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
        <Button variant="outline" onPress={() => router.push('/developer/dashboard')}>
          Dev
        </Button>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Your Will Journey</Text>
          <Text style={styles.pageSubtitle}>
            Here's what we'll cover together to create your will
          </Text>
        </View>
        
        {/* Sections */}
        <View style={styles.sections}>
          <SectionCard
            title="Choose Your Executors"
            description="Who will carry out your wishes"
            icon="account-supervisor"
            onPress={() => console.log('Navigate to executors')}
            completed={executors.length > 0}
          />
          
          {childrenInCare.length > 0 && (
            <SectionCard
              title="Guardianship"
              description="Who will care for your children"
              icon="human-child"
              onPress={() => console.log('Navigate to guardianship')}
            />
          )}
          
          <SectionCard
            title="Divide Your Estate"
            description="How your assets will be distributed"
            icon="chart-pie"
            onPress={() => console.log('Navigate to estate division')}
          />
          
          <SectionCard
            title="Warning Flags"
            description="Issues that need attention"
            icon="alert-circle"
            onPress={() => console.log('Navigate to warnings')}
          />
          
          <SectionCard
            title="Optimisations"
            description="Tax planning opportunities"
            icon="lightbulb"
            onPress={() => console.log('Navigate to optimisations')}
          />
          
          <SectionCard
            title="Review & Sign"
            description="Final review before completion"
            icon="file-document-check"
            onPress={() => console.log('Navigate to review')}
          />
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
    paddingVertical: Spacing.lg,
    flexGrow: 1,
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
  },
  sections: {
    gap: Spacing.md,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    marginBottom: Spacing.sm,
  },
  sectionCardCompleted: {
    borderColor: KindlingColors.green,
    backgroundColor: `${KindlingColors.green}05`,
  },
  sectionIcon: {
    marginRight: Spacing.md,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
});

