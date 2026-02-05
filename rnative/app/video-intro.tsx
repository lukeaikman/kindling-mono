import { router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Text } from 'react-native-paper';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui/Button';
import { KindlingColors } from '../src/styles/theme';
import { Spacing } from '../src/styles/constants';
import { 
  getStoredAttribution, 
  updateOnboardingState, 
  getNextOnboardingDestination 
} from '../src/services/attribution';

// Map version numbers to local video assets
const VIDEO_SOURCES: Record<number, any> = {
  1: require('../assets/videos/intro-v1.mp4'),
  // Add more versions as created
};

export default function VideoIntroScreen() {
  const [videoVersion, setVideoVersion] = useState<number>(1);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    getStoredAttribution().then(attr => {
      if (attr?.show_video) setVideoVersion(attr.show_video);
    });
    
    // Handle app backgrounding
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState.match(/inactive|background/)) {
      // Pause video when app goes to background
      videoRef.current?.pauseAsync();
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Rewind 5 seconds for context, then autoplay
      try {
        const status = await videoRef.current?.getStatusAsync();
        if (status?.isLoaded) {
          const newPosition = Math.max(0, (status.positionMillis || 0) - 5000);
          await videoRef.current?.setPositionAsync(newPosition);
          await videoRef.current?.playAsync();
        }
      } catch (error) {
        console.error('[VideoIntro] Error handling foreground:', error);
      }
    }
    appState.current = nextAppState;
  };

  const navigateToNext = async () => {
    await updateOnboardingState({ video_completed: true });
    const next = await getNextOnboardingDestination();
    router.replace(next);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      navigateToNext();
    }
  };

  const handleVideoError = (error: string) => {
    console.error('[VideoIntro] Video playback error:', error);
    setVideoError(true);
    navigateToNext();
  };

  const handleSkip = () => navigateToNext();

  // Fallback to version 1 if requested version doesn't exist
  const videoSource = VIDEO_SOURCES[videoVersion] || VIDEO_SOURCES[1];

  return (
    <View style={styles.container}>
      {!videoError ? (
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={handleVideoError}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Video unavailable</Text>
        </View>
      )}
      
      <SafeAreaView style={styles.skipContainer} edges={['bottom']}>
        <Button variant="outline" onPress={handleSkip} style={styles.skipButton}>
          Skip
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.navy,
  },
  video: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: KindlingColors.cream,
  },
  skipContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
