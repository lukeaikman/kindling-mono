/**
 * Property Intro Screen
 * 
 * Educational introduction to property in estate planning.
 * Emphasizes tax relief opportunities (RNRB up to £175k).
 * 
 * @module screens/bequeathal/property/intro
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, InformationCard } from '../../../src/components/ui';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';

export default function PropertyIntroScreen() {
  const handleSkip = () => {
    router.push('/estate-dashboard' as any);
  };

  const handleLearnMore = () => {
    Linking.openURL('https://www.gov.uk/guidance/inheritance-tax-property-and-land-owned-by-the-deceased');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Morphic Background */}
      <View style={styles.morphicBackground}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
        <View style={[styles.blob, styles.blob4]} />
        <View style={[styles.blob, styles.blob5]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="home" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Property</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          {/* Information Card */}
          <InformationCard title="Your Property Portfolio">
            <Text style={styles.infoText}>
              We'll gather basic details on each property enabling net position and estate value calculations.
            </Text>
            
            <Text style={[styles.infoText, styles.sectionTitle]}>Tax Reliefs May Be Available</Text>
            
            <Text style={styles.infoText}>
              There may be up to <Text style={styles.bold}>£175,000 available</Text> (and <Text style={styles.bold}>£350,000 if owned with a partner</Text>) if your property passes wholly or in part to one or more direct descendants (including children, stepchildren, grandchildren, and their spouses).
            </Text>
            
            <Text style={styles.infoText}>
              Kindling will take your property details and explain your tax position and present potential optimisations if available.
            </Text>

            {/* Learn More Link */}
            <TouchableOpacity onPress={handleLearnMore} style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn more about property in wills</Text>
              <IconButton icon="open-in-new" size={14} iconColor={KindlingColors.navy} style={styles.learnMoreIcon} />
            </TouchableOpacity>
          </InformationCard>

          {/* Action Buttons */}
          <Button
            onPress={() => router.push('/bequeathal/property/entry')}
            variant="primary"
            style={styles.startButton}
          >
            Start Adding Property
          </Button>

          <Button
            onPress={handleSkip}
            variant="secondary"
            style={styles.skipButton}
          >
            Skip for now
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  morphicBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  blob: {
    position: 'absolute',
    opacity: 0.2,
  },
  blob1: {
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    backgroundColor: KindlingColors.navy,
    borderRadius: 160,
    transform: [{ rotate: '-15deg' }],
  },
  blob2: {
    top: '33%',
    left: -64,
    width: 256,
    height: 192,
    backgroundColor: KindlingColors.brown,
    borderRadius: 128,
    transform: [{ rotate: '25deg' }],
  },
  blob3: {
    bottom: -64,
    left: '25%',
    width: 192,
    height: 160,
    backgroundColor: KindlingColors.beige,
    borderRadius: 96,
    transform: [{ rotate: '45deg' }],
  },
  blob4: {
    top: '50%',
    right: '20%',
    width: 96,
    height: 128,
    backgroundColor: KindlingColors.cream,
    borderRadius: 48,
    transform: [{ rotate: '-30deg' }],
  },
  blob5: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}1a`,
    zIndex: 10,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
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
  headerRight: {
    width: 48,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginTop: Spacing.sm,
  },
  bold: {
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  learnMoreText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    textDecorationLine: 'underline',
  },
  learnMoreIcon: {
    margin: 0,
    padding: 0,
    marginLeft: -8,
  },
  startButton: {
    marginTop: Spacing.md,
  },
  skipButton: {
    marginTop: Spacing.sm,
  },
});
