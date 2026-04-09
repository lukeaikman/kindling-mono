/**
 * Celebration Component
 *
 * Two variants:
 *   - "full"  – Confetti particles + "Nice Work" text (~1.8s). For major milestones.
 *   - "micro" – Green checkmark scales in + subtle haptic (~1s). For sub-flow wins.
 *
 * Usage:
 *   <Celebration visible={show} variant="full" onComplete={() => router.push(next)} />
 *   <Celebration visible={show} variant="micro" onComplete={() => router.push(next)} />
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KindlingColors } from '../../styles/theme';
import { Typography } from '../../styles/constants';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Full variant
const CONFETTI_COUNT = 40;
const CONFETTI_DURATION = 1800;
const TEXT_FADE_IN = 400;
const TEXT_HOLD = 800;
const TEXT_FADE_OUT = 400;
const FULL_DURATION = TEXT_FADE_IN + TEXT_HOLD + TEXT_FADE_OUT + 200;

// Micro variant
const MICRO_SCALE_IN = 300;
const MICRO_HOLD = 400;
const MICRO_FADE_OUT = 300;
const MICRO_DURATION = MICRO_SCALE_IN + MICRO_HOLD + MICRO_FADE_OUT;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  KindlingColors.green,
  KindlingColors.lightGreen,
  KindlingColors.beige,
  KindlingColors.navy,
  KindlingColors.cream,
  '#F5C242',
];

// ---------------------------------------------------------------------------
// Confetti particle (full variant only)
// ---------------------------------------------------------------------------

interface ParticleConfig {
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  isSquare: boolean;
}

function generateParticles(): ParticleConfig[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 600,
    duration: CONFETTI_DURATION + Math.random() * 800,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    isSquare: Math.random() > 0.5,
  }));
}

const ConfettiParticle: React.FC<{ config: ParticleConfig; trigger: boolean }> = ({
  config,
  trigger,
}) => {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;

    opacity.value = withDelay(
      config.delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(config.duration - 400, withTiming(0, { duration: 300 })),
      ),
    );

    translateY.value = withDelay(
      config.delay,
      withTiming(SCREEN_HEIGHT + 40, {
        duration: config.duration,
        easing: Easing.in(Easing.quad),
      }),
    );

    translateX.value = withDelay(
      config.delay,
      withTiming((Math.random() - 0.5) * 120, {
        duration: config.duration,
        easing: Easing.inOut(Easing.sin),
      }),
    );

    rotate.value = withDelay(
      config.delay,
      withTiming(config.rotation + 360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: config.duration,
      }),
    );
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.x,
          top: -20,
          width: config.size,
          height: config.size * (config.isSquare ? 1 : 0.6),
          backgroundColor: config.color,
          borderRadius: config.isSquare ? 2 : config.size,
        },
        animatedStyle,
      ]}
    />
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export type CelebrationVariant = 'full' | 'micro';

interface CelebrationProps {
  /** When true, the celebration animation plays */
  visible: boolean;
  /** "full" = confetti + text (~1.8s); "micro" = checkmark + haptic (~1s) */
  variant?: CelebrationVariant;
  /** Called when the animation finishes – use to navigate forward */
  onComplete?: () => void;
  /** Override the celebration text (full variant only) */
  message?: string;
}

export const Celebration: React.FC<CelebrationProps> = ({
  visible,
  variant = 'full',
  onComplete,
  message = 'Nice Work',
}) => {
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.8);
  const overlayOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const particles = useMemo(() => generateParticles(), []);

  useEffect(() => {
    if (!visible) {
      textOpacity.value = 0;
      textScale.value = 0.8;
      overlayOpacity.value = 0;
      iconScale.value = 0;
      iconOpacity.value = 0;
      return;
    }

    const isMicro = variant === 'micro';
    const duration = isMicro ? MICRO_DURATION : FULL_DURATION;

    // Overlay fade in
    overlayOpacity.value = withTiming(1, { duration: 150 });

    if (isMicro) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Checkmark: scale in → hold → fade out
      iconScale.value = withSequence(
        withTiming(1, { duration: MICRO_SCALE_IN, easing: Easing.out(Easing.back(2)) }),
        withDelay(MICRO_HOLD, withTiming(0.8, { duration: MICRO_FADE_OUT })),
      );
      iconOpacity.value = withSequence(
        withTiming(1, { duration: MICRO_SCALE_IN }),
        withDelay(MICRO_HOLD, withTiming(0, { duration: MICRO_FADE_OUT })),
      );
    } else {
      // Full: text fade in → hold → fade out
      textOpacity.value = withSequence(
        withTiming(1, { duration: TEXT_FADE_IN, easing: Easing.out(Easing.cubic) }),
        withDelay(TEXT_HOLD, withTiming(0, { duration: TEXT_FADE_OUT })),
      );
      textScale.value = withSequence(
        withTiming(1, { duration: TEXT_FADE_IN, easing: Easing.out(Easing.back(1.5)) }),
        withDelay(TEXT_HOLD, withTiming(0.9, { duration: TEXT_FADE_OUT })),
      );
    }

    // Trigger onComplete after duration
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  if (!visible) return null;

  const isMicro = variant === 'micro';

  return (
    <View style={styles.wrapper} pointerEvents="none">
      {/* Semi-transparent backdrop */}
      <Animated.View
        style={[
          styles.overlay,
          isMicro && styles.overlayMicro,
          overlayStyle,
        ]}
      />

      {/* Full variant: confetti particles */}
      {!isMicro &&
        particles.map((p, i) => (
          <ConfettiParticle key={i} config={p} trigger={visible} />
        ))}

      {/* Full variant: "Nice Work" text */}
      {!isMicro && (
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Animated.Text style={styles.celebrationText}>{message}</Animated.Text>
        </Animated.View>
      )}

      {/* Micro variant: green checkmark */}
      {isMicro && (
        <Animated.View style={[styles.textContainer, iconStyle]}>
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons
              name="check"
              size={36}
              color={KindlingColors.background}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  overlayMicro: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationText: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: KindlingColors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
