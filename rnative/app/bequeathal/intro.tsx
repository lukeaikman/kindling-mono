/**
 * Bequeathal Intro Screen
 * 
 * Introduction to asset management and bequests.
 * Shows video explanation and key information about why asset tracking matters.
 * 
 * @module screens/bequeathal/intro
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, InformationCard } from '../../src/components/ui';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
// @ts-ignore - WebView may not be installed yet
import { WebView } from 'react-native-webview';

/**
 * Bequeathal Intro Screen Component
 * 
 * Introduces users to asset management with:
 * - Inline video player
 * - Scary facts about estate distribution
 * - Benefits of using Kindling
 */
export default function BequeathalIntroScreen() {
  const [videoLoading, setVideoLoading] = useState(true);

  const handleNext = () => {
    router.push('/bequeathal/categories');
  };

  const handleBack = () => {
    router.back();
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
            <IconButton
              icon="gift"
              size={20}
              iconColor={KindlingColors.navy}
            />
          </View>
          <Text style={styles.headerTitle}>What To Give?</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Scrollable Content */}
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

          {/* Information Cards */}
          <InformationCard title="Avoid a Painful Deaath">
            <View style={styles.listItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.listText}>
                <Text style={styles.bold}>50%</Text> of all death goes to the tax man!
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.listText}>
                <Text style={styles.bold}>90%</Text> of beneficiaries don't get their stuff as it's lost or not known about
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.listText}>
                <Text style={styles.bold}>95%</Text> of executors report having a nightmare finding and piecing together estates
              </Text>
            </View>
          </InformationCard>

          <InformationCard title="Why is this important?">
            <View style={styles.numberedItem}>
              <Text style={styles.numberText}>1.</Text>
              <Text style={styles.listText}>
                Kindling makes sure your Executors can find everything easily and distribute everything they should.
              </Text>
            </View>
            <View style={styles.numberedItem}>
              <Text style={styles.numberText}>2.</Text>
              <Text style={styles.listText}>
                Kindling maximises what you give to your loved ones
              </Text>
            </View>
            <View style={styles.numberedItem}>
              <Text style={styles.numberText}>3.</Text>
              <Text style={styles.listText}>
                Kindling minimises what's lost in tax
              </Text>
            </View>
          </InformationCard>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <Button onPress={handleNext} variant="primary">
          Let's Go
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.white,
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  numberedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bulletPoint: {
    fontSize: 16,
    color: KindlingColors.brown,
    marginRight: Spacing.sm,
    lineHeight: 24,
  },
  numberText: {
    fontSize: 16,
    color: KindlingColors.brown,
    marginRight: Spacing.sm,
    lineHeight: 24,
    fontWeight: '600',
  },
  listText: {
    fontSize: 16,
    color: KindlingColors.brown,
    lineHeight: 24,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
});

