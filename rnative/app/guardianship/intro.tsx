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
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { VideoPlayer } from '../../src/components/ui/VideoPlayer';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

export default function GuardianshipIntroScreen() {
  const [showVideo, setShowVideo] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push('/guardianship/wishes');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton onPress={handleBack} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Choose Guardians</Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="play-circle-outline"
            size={24}
            iconColor={KindlingColors.navy}
            onPress={() => setShowVideo(true)}
          />
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Video Section */}
        {showVideo && (
          <View style={styles.videoContainer}>
            <VideoPlayer
              videoId="dQw4w9WgXcQ"
              title="Choosing Guardians for Your Children"
              onClose={() => setShowVideo(false)}
            />
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}1a`,
  },
  headerLeft: {
    width: 48,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: KindlingColors.navy,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  videoContainer: {
    marginBottom: Spacing.md,
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
