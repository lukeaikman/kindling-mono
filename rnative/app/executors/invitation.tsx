/**
 * Executor Invitation Screen
 * 
 * Informational screen explaining that executors will receive invitations.
 * Reference: web-prototype/src/components/ExecutorInvitationScreen.tsx
 * 
 * @module app/executors/invitation
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { VideoPlayer } from '../../src/components/ui/VideoPlayer';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

/**
 * ExecutorInvitationScreen component
 * 
 * Provides information about executor invitations and notifications.
 * UI only - no actual email functionality (backend feature for future).
 */
export default function ExecutorInvitationScreen() {
  const [showVideo, setShowVideo] = useState(false);
  
  // Double tap functionality for dev dashboard (on header)
  const lastTapRef = useRef<number>(0);
  
  const handleHeaderPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      router.push('/developer/dashboard');
    }
    lastTapRef.current = now;
  }, []);
  
  const handleBack = useCallback(() => {
    router.back();
  }, []);
  
  const handleContinue = useCallback(() => {
    router.push('/order-of-things');
  }, []);
  
  const handleDismissVideo = useCallback(() => {
    setShowVideo(false);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Subtle Morphic Background */}
      <View style={styles.backgroundOverlay} pointerEvents="none">
        <View style={[styles.morphicBlob, styles.morphicBlob1]} />
        <View style={[styles.morphicBlob, styles.morphicBlob2]} />
        <View style={[styles.morphicBlob, styles.morphicBlob3]} />
        <View style={[styles.morphicBlob, styles.morphicBlob4]} />
        <View style={[styles.morphicBlob, styles.morphicBlob5]} />
      </View>
      
      {/* Header */}
      <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.9}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton onPress={handleBack} />
          </View>
          <View style={styles.headerCenter}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="account-group"
                size={20}
                iconColor={KindlingColors.navy}
              />
            </View>
            <Text style={styles.headerTitle}>Executors Invited!</Text>
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
      </TouchableOpacity>
      
      {/* Content */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentCard}>
            {/* Information Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Know when your Executors accept</Text>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoText}>
                  Your executors will receive an email explaining you'd love them to be your 
                  Executors and what that means.
                </Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoText}>
                  <Text style={styles.infoTextBold}>Turn on notifications! </Text>
                  When they accept (we're sure they will, it's an honour) we'll notify you.
                </Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoText}>
                  If for any reason they don't accept the request, you'll be notified and 
                  asked to suggest new options.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleContinue}
        >
          Executors Complete
        </Button>
      </View>
      
      {/* Video Player Modal - Only render when visible */}
      {showVideo && (
        <VideoPlayer
          videoUrl="https://www.youtube.com/watch?v=aqz-KE-bpKQ"
          title="Understanding Executors"
          visible={showVideo}
          onDismiss={handleDismissVideo}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  backgroundOverlay: {
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
  morphicBlob1: {
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    backgroundColor: KindlingColors.navy,
    borderRadius: 160,
    transform: [{ rotate: '-15deg' }],
  },
  morphicBlob2: {
    top: '33%',
    left: -64,
    width: 256,
    height: 192,
    backgroundColor: `${KindlingColors.beige}cc`,
    borderRadius: 128,
    transform: [{ rotate: '25deg' }],
  },
  morphicBlob3: {
    bottom: -64,
    left: '25%',
    width: 192,
    height: 160,
    backgroundColor: `${KindlingColors.beige}99`,
    borderRadius: 96,
    transform: [{ rotate: '45deg' }],
  },
  morphicBlob4: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${KindlingColors.navy}1a`,
  },
  morphicBlob5: {
    top: '50%',
    right: '20%',
    width: 96,
    height: 128,
    backgroundColor: `${KindlingColors.cream}cc`,
    borderRadius: 48,
    transform: [{ rotate: '-30deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: KindlingColors.cream,
    zIndex: 10,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
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
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.xl,
    flexGrow: 1,
  },
  contentCard: {
    marginHorizontal: Spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  infoCard: {
    gap: Spacing.lg,
  },
  infoTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  infoSection: {
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    color: `${KindlingColors.navy}cc`,
    lineHeight: 22,
  },
  infoTextBold: {
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 0.5,
    borderTopColor: KindlingColors.cream,
  },
});

