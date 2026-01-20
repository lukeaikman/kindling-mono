/**
 * SplashScreen Component
 * 
 * Animated splash screen with two variants:
 * 1. First-time/logged-out users: Simple animation sequence
 * 2. Returning users: Animation with biometric authentication
 * 
 * Animation sequence:
 * - Initial: Cream background with dark KINDLING logo (matches native LaunchScreen)
 * - Transition 1: Background fades to blue, logo crossfades to KIND
 * - Transition 2: KIND logo centers horizontally
 * - Transition 3: Tagline fades in below logo
 * 
 * @module components/splash/SplashScreen
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFonts } from 'expo-font';

import { Button } from '../ui/Button';

// ============================================================================
// CONFIGURATION CONSTANTS
// All timing values in milliseconds - adjust these to tweak animation feel
// ============================================================================

/** Toggle biometric flow on/off for development */
const ENABLE_BIOMETRIC_FLOW = false;

/** Duration for background color change + logo crossfade */
const TRANSITION_1_DURATION = 800;

/** Duration for KIND logo centering animation */
const TRANSITION_2_DURATION = 600;

/** Duration for tagline fade in */
const TRANSITION_3_DURATION = 500;

/** Delay before tagline starts fading in (relative to Transition 2 start) */
const TRANSITION_3_DELAY = 200;

/** Pause after Transition 1 before Transition 2 begins */
const DELAY_AFTER_TRANSITION_1 = 300;

/** Duration for unlock icon fade in */
const UNLOCK_ICON_FADE_DURATION = 400;

/** Duration for moving logo to bottom on auth failure */
const MOVE_TO_BOTTOM_DURATION = 600;

/** Duration for buttons fade in */
const BUTTONS_FADE_DURATION = 400;

/** Delay before navigating after successful animation */
const NAVIGATION_DELAY = 500;

// ============================================================================
// BRAND CONSTANTS
// ============================================================================

const BRAND_BLUE = '#293241';
const BRAND_CREAM = '#EAE6E5';

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// The KIND logo needs to be centered. Since both PNGs are the same dimension
// with transparent padding where "LING" would be, we need to calculate the offset.
// This value represents how much the KIND logo needs to move right to appear centered.
// Adjust this based on actual logo dimensions.
const LOGO_CENTER_OFFSET = 40; // pixels to move right to center

// ============================================================================
// TYPES
// ============================================================================

type BiometricResult = 'pending' | 'success' | 'failed';
type AnimationPhase = 'initial' | 'transition1' | 'transition2' | 'complete' | 'auth_failed';

interface SplashScreenProps {
  /** Override the default navigation destination */
  navigateTo?: string;
  /** Additional params to pass to navigation */
  navigationParams?: Record<string, unknown>;
  /** Callback when splash completes (alternative to navigation) */
  onComplete?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SplashScreen Component
 * 
 * Displays an animated splash screen that matches the native LaunchScreen
 * and provides a smooth transition into the app.
 * 
 * @example
 * ```tsx
 * // Simple usage - navigates to dashboard
 * <SplashScreen />
 * 
 * // Custom destination
 * <SplashScreen navigateTo="/onboarding/welcome" />
 * 
 * // With callback instead of navigation
 * <SplashScreen onComplete={() => setAppReady(true)} />
 * ```
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  navigateTo = '/onboarding/welcome',
  navigationParams,
  onComplete,
}) => {
  // Load Montserrat font
  const [fontsLoaded] = useFonts({
    'Montserrat-SemiBold': require('../../../assets/fonts/Montserrat-SemiBold.ttf'),
  });

  // Animation state
  const [phase, setPhase] = useState<AnimationPhase>('initial');
  const [biometricResult, setBiometricResult] = useState<BiometricResult>('pending');
  const [showUnlockIcon, setShowUnlockIcon] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Animated values
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const darkLogoOpacity = useRef(new Animated.Value(1)).current;
  const lightLogoOpacity = useRef(new Animated.Value(0)).current;
  const logoPositionX = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const unlockIconOpacity = useRef(new Animated.Value(0)).current;
  const contentPositionY = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  // Interpolate background color
  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BRAND_CREAM, BRAND_BLUE],
  });

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const handleNavigation = useCallback(() => {
    if (onComplete) {
      onComplete();
    } else {
      router.replace({
        pathname: navigateTo,
        params: navigationParams,
      } as any);
    }
  }, [navigateTo, navigationParams, onComplete]);

  // ============================================================================
  // BIOMETRIC AUTHENTICATION
  // ============================================================================

  const triggerBiometric = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        console.log('Biometric not available or not enrolled');
        setBiometricResult('failed');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Kindling',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setBiometricResult('success');
      } else {
        setBiometricResult('failed');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setBiometricResult('failed');
    }
  }, []);

  const retryBiometric = useCallback(() => {
    setBiometricResult('pending');
    triggerBiometric();
  }, [triggerBiometric]);

  // ============================================================================
  // ANIMATION SEQUENCES
  // ============================================================================

  const runTransition1 = useCallback(() => {
    setPhase('transition1');
    
    Animated.parallel([
      // Background color transition
      Animated.timing(backgroundColorAnim, {
        toValue: 1,
        duration: TRANSITION_1_DURATION,
        useNativeDriver: false, // Can't use native driver for colors
      }),
      // Crossfade logos
      Animated.timing(darkLogoOpacity, {
        toValue: 0,
        duration: TRANSITION_1_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(lightLogoOpacity, {
        toValue: 1,
        duration: TRANSITION_1_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After Transition 1 completes, wait then start Transition 2
      setTimeout(() => {
        runTransition2();
      }, DELAY_AFTER_TRANSITION_1);
    });
  }, [backgroundColorAnim, darkLogoOpacity, lightLogoOpacity]);

  const runTransition2 = useCallback(() => {
    setPhase('transition2');

    // Start Transition 2 (logo centering) and Transition 3 (tagline) simultaneously
    // but with configurable delay for tagline

    // Logo centering
    Animated.timing(logoPositionX, {
      toValue: LOGO_CENTER_OFFSET,
      duration: TRANSITION_2_DURATION,
      useNativeDriver: true,
    }).start();

    // Tagline fade in (with delay)
    setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: TRANSITION_3_DURATION,
        useNativeDriver: true,
      }).start(() => {
        setPhase('complete');
        setAnimationComplete(true);
      });
    }, TRANSITION_3_DELAY);
  }, [logoPositionX, taglineOpacity]);

  const showUnlockSuccess = useCallback(() => {
    setShowUnlockIcon(true);
    Animated.timing(unlockIconOpacity, {
      toValue: 1,
      duration: UNLOCK_ICON_FADE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      // Navigate after showing unlock icon
      setTimeout(handleNavigation, NAVIGATION_DELAY);
    });
  }, [unlockIconOpacity, handleNavigation]);

  const showAuthFailedUI = useCallback(() => {
    setPhase('auth_failed');
    
    // Move logo + tagline to bottom
    Animated.timing(contentPositionY, {
      toValue: SCREEN_HEIGHT * 0.3, // Move down
      duration: MOVE_TO_BOTTOM_DURATION,
      useNativeDriver: true,
    }).start(() => {
      // Fade in buttons
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: BUTTONS_FADE_DURATION,
        useNativeDriver: true,
      }).start();
    });
  }, [contentPositionY, buttonsOpacity]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Start animation sequence on mount
  useEffect(() => {
    if (!fontsLoaded) return;

    // Small delay to ensure seamless handoff from native splash
    const startTimer = setTimeout(() => {
      runTransition1();

      // If biometric flow is enabled, trigger it immediately
      if (ENABLE_BIOMETRIC_FLOW) {
        triggerBiometric();
      }
    }, 100);

    return () => clearTimeout(startTimer);
  }, [fontsLoaded, runTransition1, triggerBiometric]);

  // Handle post-animation logic based on biometric result
  useEffect(() => {
    if (!animationComplete) return;

    if (!ENABLE_BIOMETRIC_FLOW) {
      // No biometric flow - just navigate
      setTimeout(handleNavigation, NAVIGATION_DELAY);
      return;
    }

    // Biometric flow
    if (biometricResult === 'success') {
      showUnlockSuccess();
    } else if (biometricResult === 'failed') {
      showAuthFailedUI();
    }
    // If still pending, wait for biometric to resolve
  }, [animationComplete, biometricResult, handleNavigation, showUnlockSuccess, showAuthFailedUI]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: BRAND_CREAM }]}>
        {/* Show initial state while fonts load */}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      {/* Main content container - animated for auth failure state */}
      <Animated.View
        style={[
          styles.contentContainer,
          { transform: [{ translateY: contentPositionY }] },
        ]}
      >
        {/* Unlock Icon (shown on biometric success) */}
        {showUnlockIcon && (
          <Animated.View style={[styles.unlockContainer, { opacity: unlockIconOpacity }]}>
            <Image
              source={require('../../../assets/unlocked.png')}
              style={styles.unlockIcon}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ translateX: logoPositionX }] },
          ]}
        >
          {/* Dark KINDLING logo (for cream background) */}
          <Animated.Image
            source={require('../../../assets/kindling-dark.png')}
            style={[styles.logo, { opacity: darkLogoOpacity }]}
            resizeMode="contain"
          />

          {/* Light KIND logo (for blue background) */}
          <Animated.Image
            source={require('../../../assets/kindling-light.png')}
            style={[styles.logo, styles.logoAbsolute, { opacity: lightLogoOpacity }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Protect today. Build tomorrow.
        </Animated.Text>
      </Animated.View>

      {/* Auth Failed Buttons */}
      {phase === 'auth_failed' && (
        <Animated.View style={[styles.buttonsContainer, { opacity: buttonsOpacity }]}>
          <Button
            variant="primary"
            onPress={retryBiometric}
            style={styles.button}
          >
            {Platform.OS === 'ios' ? 'Retry Face ID' : 'Retry Biometric'}
          </Button>
          <Button
            variant="outline"
            onPress={handleNavigation}
            style={styles.button}
          >
            Login With Form
          </Button>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockContainer: {
    marginBottom: 24,
  },
  unlockIcon: {
    width: 80,
    height: 88,
    tintColor: BRAND_CREAM,
  },
  logoContainer: {
    width: 240,
    height: 60,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tagline: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 19,
    letterSpacing: 19 * 0.08, // 8% letter spacing
    color: BRAND_CREAM,
    marginTop: 20,
    textAlign: 'center',
  },
  buttonsContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.35,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    gap: 16,
  },
  button: {
    width: '100%',
  },
});

export default SplashScreen;
