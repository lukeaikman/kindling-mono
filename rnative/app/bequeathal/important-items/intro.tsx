/**
 * Important Items Intro Screen
 * 
 * Educational screen introducing valuable items tracking for estate planning.
 * User can watch a video (optional) and proceed to add important items.
 * 
 * Navigation:
 * - Back: Returns to previous screen (Categories)
 * - Forward: Navigates to important items entry screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, InformationCard } from '../../../src/components/ui';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
// @ts-ignore - WebView may not be installed yet
import { WebView } from 'react-native-webview';

export default function ImportantItemsIntroScreen() {
  const [videoLoading, setVideoLoading] = useState(true);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push('/bequeathal/important-items/entry');
  };

  const handleSkip = () => {
    router.push('/estate-dashboard' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Morphic Background */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
        <View style={[styles.morphicBlob, styles.blob3]} />
        <View style={[styles.morphicBlob, styles.blob4]} />
        <View style={[styles.morphicBlob, styles.blob5]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="diamond" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Important Items</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Video Section */}
          <View style={styles.videoSection}>
            <View style={styles.videoContainer}>
              {videoLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={KindlingColors.navy} />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}
              <WebView
                source={{ uri: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1' }}
                style={styles.webview}
                onLoadStart={() => setVideoLoading(true)}
                onLoadEnd={() => setVideoLoading(false)}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          </View>

          {/* Information Card */}
          <InformationCard title="Your Valuable Possessions">
            <Text style={styles.infoText}>
              Typically your items are left to your 'estate'. That means they are split by the Executor across your beneficiaries in the proportions you dictate.
            </Text>
            
            <Text style={styles.infoText}>
              It is important to list specific items if they are:
            </Text>

            <View style={styles.numberedList}>
              <View style={styles.numberedItem}>
                <Text style={styles.numberText}>1.</Text>
                <Text style={styles.listText}>
                  Very valuable (preventing them 'disappearing', and/or ensuring special care is taken by executors to have them valued and sold appropriately)
                </Text>
              </View>
              <View style={styles.numberedItem}>
                <Text style={styles.numberText}>2.</Text>
                <Text style={styles.listText}>
                  You want a specific person to inherit them
                </Text>
              </View>
            </View>
            
            <Text style={styles.infoText}>
              If you have anything specifically insured, it should be listed.
            </Text>
            
            <Text style={styles.infoText}>
              Including these details prevents family disputes and ensures your wishes.
            </Text>
          </InformationCard>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button onPress={handleContinue} variant="primary">
          Start Adding Important Items
        </Button>
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
          <Text style={styles.skipArrow}>↗</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  morphicBlob: {
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
    zIndex: 10,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  videoSection: {
    marginBottom: Spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: '#fff',
    fontSize: 14,
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  numberedList: {
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  numberedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  numberText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing.sm,
    lineHeight: 22,
  },
  listText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}1a`,
    zIndex: 10,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  skipText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textDecorationLine: 'underline',
    fontWeight: Typography.fontWeight.medium,
  },
  skipArrow: {
    fontSize: 18,
    color: KindlingColors.brown,
  },
});

