/**
 * Agricultural Assets Intro Screen
 * 
 * Educational screen introducing agricultural assets and tax reliefs (APR/BPR).
 * Explains importance of documenting farming assets for IHT relief qualification.
 * 
 * Navigation:
 * - Back: Returns to previous screen (Categories)
 * - Forward: Navigates to agricultural assets entry screen
 * - Skip: Navigates to next selected category or will-dashboard
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

export default function AgriculturalAssetsIntroScreen() {
  const [videoLoading, setVideoLoading] = useState(true);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.replace('/bequeathal/agricultural-assets/entry' as any);
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Morphic Background - 3 blobs */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
        <View style={[styles.morphicBlob, styles.blob3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="sprout" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Agricultural Assets</Text>
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
          <InformationCard title="Agricultural Assets & Tax Reliefs">
            <Text style={styles.infoText}>
              Agricultural assets include farmland, agricultural buildings, livestock, farming equipment, and crops. These assets often represent significant value in rural estates and require careful consideration for inheritance planning.
            </Text>
            
            <Text style={[styles.infoText, styles.bold]}>Agricultural Property Relief (APR)</Text>
            <Text style={styles.infoText}>
              APR can provide up to <Text style={styles.bold}>100% inheritance tax relief</Text> on qualifying agricultural property, including farmland and buildings used for agricultural purposes. To qualify, the property must be occupied for agricultural purposes and either owned for two years before death or occupied by the deceased for seven years if they were a tenant.
            </Text>

            <Text style={[styles.infoText, styles.bold]}>Business Property Relief (BPR)</Text>
            <Text style={styles.infoText}>
              BPR may also apply to farming businesses, potentially providing up to 100% relief on the business value of farming operations. This can include livestock, machinery, and other business assets used in the farming enterprise. The combination of APR and BPR can significantly reduce inheritance tax liability for farming families.
            </Text>

            <Text style={styles.infoText}>
              Recording your agricultural assets helps executors understand the scope of farm operations, obtain proper valuations, and claim appropriate reliefs. This is particularly important as agricultural valuations can be complex and may require specialist expertise.
            </Text>
          </InformationCard>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button onPress={handleContinue} variant="primary">
          Let's Go
        </Button>
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip this section</Text>
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
  bold: {
    fontWeight: '700',
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
