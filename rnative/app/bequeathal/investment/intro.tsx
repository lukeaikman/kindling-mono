/**
 * Investments Intro Screen
 * 
 * Educational screen introducing investment account tracking.
 * Covers stocks, shares, ISAs, bonds, and other financial investments.
 * 
 * Navigation:
 * - Back: Returns to previous screen (Categories)
 * - Forward: Navigates to investments entry screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, InformationCard } from '../../../src/components/ui';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
// @ts-ignore - WebView may not be installed yet
import { WebView } from 'react-native-webview';

export default function InvestmentsIntroScreen() {
  const [videoLoading, setVideoLoading] = useState(true);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.replace('/bequeathal/investment/entry' as any);
  };

  const handleSkip = () => {
    router.back();
  };

  const handleLearnMore = () => {
    Linking.openURL('https://www.gov.uk/tax-on-your-private-pension/inheritance');
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
            <IconButton icon="trending-up" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Investment Accounts</Text>
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
          <InformationCard title="Your Investment Portfolio">
            <Text style={styles.infoText}>
              Let's record your investments and financial assets to ensure they're properly distributed. We'll help you document:
            </Text>
            
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>stocks & shares portfolios</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>ISAs & investment accounts</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>bonds & government securities</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>mutual funds & unit trusts</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>investment platforms & brokers</Text>
              </View>
            </View>
            
            <Text style={styles.infoText}>
              Recording your investments helps ensure they transfer smoothly to your beneficiaries and provides clarity for your executors.
            </Text>

            <TouchableOpacity onPress={handleLearnMore} style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn about investments in wills</Text>
              <IconButton icon="open-in-new" size={16} iconColor={KindlingColors.navy} style={styles.learnMoreIcon} />
            </TouchableOpacity>
          </InformationCard>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button onPress={handleContinue} variant="primary">
          Start Adding Investments
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
  bulletList: {
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    marginRight: Spacing.sm,
    lineHeight: 22,
  },
  bulletText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 22,
    flex: 1,
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

