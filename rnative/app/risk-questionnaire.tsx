import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui/Button';
import { KindlingLogo } from '../src/components/ui/KindlingLogo';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography } from '../src/styles/constants';
import { 
  getStoredAttribution, 
  updateOnboardingState, 
  getNextOnboardingDestination 
} from '../src/services/attribution';

export default function RiskQuestionnaireScreen() {
  const [questionnaireVersion, setQuestionnaireVersion] = useState<number>(1);

  useEffect(() => {
    getStoredAttribution().then(attr => {
      if (attr?.show_risk_questionnaire) {
        setQuestionnaireVersion(attr.show_risk_questionnaire);
      }
    });
  }, []);

  const handleComplete = async () => {
    await updateOnboardingState({ questionnaire_completed: true });
    const next = await getNextOnboardingDestination();
    router.replace(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <KindlingLogo size="md" variant="light" showText />
          <Text style={styles.title}>Evaluate Your Estate Risk</Text>
          <Text style={styles.subtitle}>
            Answer a few questions to understand your current estate planning situation.
          </Text>
        </View>
        
        {/* TODO: Implement actual questionnaire based on version */}
        <View style={styles.questionnaire}>
          <Text style={styles.placeholderText}>
            Questionnaire v{questionnaireVersion}
          </Text>
          <Text style={styles.placeholderSubtext}>
            Content to be implemented before launch.
          </Text>
        </View>
        
        <View style={styles.actions}>
          <Button variant="primary" onPress={handleComplete}>
            Continue
          </Button>
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
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
  questionnaire: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  placeholderText: {
    fontSize: Typography.fontSize.lg,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  actions: {
    gap: Spacing.md,
  },
});
