/**
 * Onboarding Welcome Screen
 * 
 * First screen in the onboarding flow
 * Collects user's name and date of birth
 * 
 * This is the entry point to will creation
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { useAppState } from '../../src/hooks/useAppState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { calculateAge } from '../../src/utils/helpers';

/**
 * OnboardingWelcomeScreen component
 * 
 * Collects:
 * - First name
 * - Middle names (optional)
 * - Last name
 * - Date of birth (with age validation)
 * 
 * Features:
 * - Double-tap on step indicator to access developer tools
 * - Age validation (under 18, over 90 warnings)
 * - Loads existing data if user returns to this screen
 */
export default function OnboardingWelcomeScreen() {
  const { willActions, personActions } = useAppState();
  
  const [firstName, setFirstName] = useState('');
  const [middleNames, setMiddleNames] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ageError, setAgeError] = useState<string | null>(null);
  
  // Double tap functionality for dev dashboard
  const lastTapRef = useRef<number>(0);
  const tapCount = useRef<number>(0);
  
  // Load existing user data on mount
  useEffect(() => {
    const user = willActions.getUser();
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setDateOfBirth(user.dateOfBirth || '');
      
      // Middle names are not stored separately in Person model
      // TODO: Add middleNames field to Person interface if needed
    }
  }, []);
  
  /**
   * Handle double-tap on step indicator to access dev tools
   */
  const handleStepPress = () => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected - navigate to dev dashboard
      router.push('/developer/dashboard');
    }
    
    lastTapRef.current = now;
  };
  
  /**
   * Handle date of birth change with age validation
   */
  const handleDateOfBirthChange = (value: string) => {
    setDateOfBirth(value);
    
    // Validate age
    const age = calculateAge(value);
    if (age !== null && !isNaN(age)) {
      if (age < 18) {
        setAgeError(`under-18:${age}`);
      } else if (age > 90) {
        setAgeError(`over-90:${age}`);
      } else {
        setAgeError(null);
      }
    } else {
      setAgeError(null);
    }
  };
  
  /**
   * Handle form submission
   */
  const handleContinue = () => {
    if (!isValid) return;
    
    // Create or update user as Person with 'will-maker' role
    const existingUser = personActions.getPeopleByRole('will-maker')[0];
    
    if (existingUser) {
      // Update existing user
      personActions.updatePerson(existingUser.id, {
        firstName,
        lastName,
        dateOfBirth,
      });
      console.log('✅ Updated existing will-maker:', existingUser.id);
    } else {
      // Create new user as Person
      const userId = personActions.addPerson({
        firstName,
        lastName,
        email: '',
        phone: '',
        dateOfBirth,
        relationship: 'other', // Will-maker doesn't have a relationship to themselves
        roles: ['will-maker']
      });
      
      // Set userId in WillData
      willActions.updateWillData({ userId });
      console.log('✅ Created will-maker Person:', userId);
    }
    
    // Navigate to next screen
    router.push('/onboarding/location');
  };
  
  const isValid = firstName && lastName && dateOfBirth && !ageError;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Pressable onPress={handleStepPress}>
          <Text style={styles.stepText}>Step 1 of 5</Text>
        </Pressable>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          {/* Icon Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="account"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Let's start with the basics</Text>
          <Text style={styles.subtitle}>
            We'll ask just a few simple questions to get your will started
          </Text>
          
          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="What's your first name?"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
            />
            
            <Input
              label="Middle names (Optional)"
              value={middleNames}
              onChangeText={setMiddleNames}
              placeholder="Enter your middle names"
              autoCapitalize="words"
            />
            
            <Input
              label="Family name or surname"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your surname"
              autoCapitalize="words"
            />
            
            <Input
              label="Date of Birth"
              value={dateOfBirth}
              onChangeText={handleDateOfBirthChange}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar"
            />
            
            {/* Age Warning */}
            {ageError && (
              <View style={styles.ageWarning}>
                <Text style={styles.ageWarningText}>
                  You have indicated you are {ageError.split(':')[1]} years old. Please contact Kindling via our website to speak with our team and ensure our product is appropriate for you.
                </Text>
              </View>
            )}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, // Reduced from lg (24) to md (16) = 33% reduction
    backgroundColor: KindlingColors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg, // Only vertical padding for scroll comfort
    flexGrow: 1,
  },
  card: {
    marginHorizontal: Spacing.lg, // Horizontal spacing from edges
    marginVertical: 0,
    padding: Spacing.lg, // Internal content padding
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
    gap: Spacing.sm,
  },
  ageWarning: {
    backgroundColor: `${KindlingColors.brown}15`,
    borderWidth: 1,
    borderColor: `${KindlingColors.brown}30`,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  ageWarningText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});

