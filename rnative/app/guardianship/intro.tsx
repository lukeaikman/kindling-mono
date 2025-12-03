/**
 * Guardianship Intro Screen
 * 
 * Educational screen introducing the importance of appointing guardians for children.
 * User can watch a video (optional) and proceed to select guardians.
 * 
 * Navigation:
 * - Back: Returns to previous screen (Order of Things)
 * - Forward: Navigates to guardian selection screen
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { VideoPlayer } from '../../src/components/ui/VideoPlayer';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

export default function GuardianshipIntroScreen() {
  const [videoVisible, setVideoVisible] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push('/guardianship/wishes');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>
              <IconButton icon="heart" size={20} iconColor={KindlingColors.navy} />
            </View>
            <Text style={styles.title}>Children - Guardianship</Text>
          </View>
        </View>

        {/* Video Section */}
        {videoVisible ? (
          <View style={styles.videoContainer}>
            <VideoPlayer
              videoId="dQw4w9WgXcQ"
              title="Choosing Guardians for Your Children"
              onClose={() => setVideoVisible(false)}
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.videoButton}
            onPress={() => setVideoVisible(true)}
          >
            <Text style={styles.videoButtonText}>▶ Watch Video: Choosing Guardians</Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.section}>
          <Text style={styles.heading}>Protecting Your Children's Future</Text>
          
          <Text style={styles.boldText}>
            If you have children under 18, appointing guardians in your will is one of the most important decisions you'll make.
          </Text>
          
          <Text style={styles.bodyText}>
            Without nominated guardians, the courts will decide who cares for your children, which may not align with your wishes.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleContinue}
          style={styles.continueButton}
        >
          Choose Guardians
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    ...Typography.body,
    color: KindlingColors.navy,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h2,
    color: KindlingColors.navy,
  },
  videoContainer: {
    marginVertical: Spacing.md,
  },
  videoButton: {
    backgroundColor: KindlingColors.navy,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  videoButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  section: {
    gap: Spacing.md,
  },
  heading: {
    ...Typography.h3,
    color: KindlingColors.navy,
  },
  boldText: {
    ...Typography.body,
    fontWeight: '700',
    color: KindlingColors.navy,
  },
  bodyText: {
    ...Typography.body,
    color: KindlingColors.brown,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.navy}1a`,
  },
  continueButton: {
    width: '100%',
  },
});
