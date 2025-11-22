/**
 * Onboarding Location Screen
 * 
 * Second screen in the onboarding flow
 * Collects user's location and residency information
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Select } from '../../src/components/ui/Select';
import { RadioGroup } from '../../src/components/ui/RadioGroup';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

/**
 * OnboardingLocationScreen component
 * 
 * Collects:
 * - Country of residence (UK region)
 * - Nationality
 * - Domiciled in UK status
 * - Currently resident status
 */
export default function OnboardingLocationScreen() {
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [nationality, setNationality] = useState('');
  const [domiciledInUK, setDomiciledInUK] = useState('');
  const [currentlyResident, setCurrentlyResident] = useState('');
  
  const handleContinue = () => {
    if (!isValid) return;
    
    // TODO: Save location data (no specific field in Person model yet)
    // For now, just navigate to next screen
    console.log('📍 Location data:', { countryOfResidence, nationality, domiciledInUK, currentlyResident });
    
    router.push('/onboarding/family');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const isValid = countryOfResidence && nationality && domiciledInUK && currentlyResident;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Button variant="outline" onPress={handleBack}>Back</Button>
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Text style={styles.stepText}>Step 2 of 5</Text>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          {/* Icon Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="map-marker"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Where do you live?</Text>
          <Text style={styles.subtitle}>
            Your location and status affect how the law and tax rules apply
          </Text>
          
          {/* Form */}
          <View style={styles.form}>
            <Select
              label="Which part of the UK do you live in?"
              value={countryOfResidence}
              onChange={setCountryOfResidence}
              options={[
                { label: 'England', value: 'england' },
                { label: 'Wales', value: 'wales' },
                { label: 'Scotland', value: 'scotland' },
              ]}
              placeholder="Select country"
            />
            
            <Select
              label="What's your nationality?"
              value={nationality}
              onChange={setNationality}
              options={[
                { label: 'British', value: 'british' },
                { label: 'American', value: 'american' },
                { label: 'Canadian', value: 'canadian' },
                { label: 'Australian', value: 'australian' },
                { label: 'Other', value: 'other' },
              ]}
              placeholder="Select nationality"
            />
            
            <RadioGroup
              label="Are you domiciled in the UK?"
              value={domiciledInUK}
              onChange={setDomiciledInUK}
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
                { label: 'Not sure', value: 'not-sure' },
              ]}
            />
            
            <RadioGroup
              label="Are you currently resident in the UK?"
              value={currentlyResident}
              onChange={setCurrentlyResident}
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
            />
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
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});

