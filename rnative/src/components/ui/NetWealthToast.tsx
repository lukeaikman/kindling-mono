import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  const safe = typeof value === 'number' && !isNaN(value) ? value : 0;
  return safe.toLocaleString('en-GB', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPRING_CONFIG = { damping: 20, stiffness: 200 };
const HOLD_MS = 2500; // extra 0.5s pause on final frame
const FADE_OUT_MS = 250;
const DIGIT_ROLL_MS = 1100; // 0.3s longer roll
const DIGIT_STAGGER_MS = 80;
const SETTLE_FLASH_MS = 200;
const DIGIT_HEIGHT = 40; // taller cells for breathing room

// ---------------------------------------------------------------------------
// OdometerDigit — a single rolling digit column
// ---------------------------------------------------------------------------

interface OdometerDigitProps {
  fromDigit: number;
  toDigit: number;
  index: number; // column index for stagger
  triggerKey: number; // changes to re-trigger animation
}

function OdometerDigit({ fromDigit, toDigit, index, triggerKey }: OdometerDigitProps) {
  const translateY = useSharedValue(-fromDigit * DIGIT_HEIGHT);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    // Reset to fromDigit position, then roll to toDigit
    translateY.value = -fromDigit * DIGIT_HEIGHT;
    translateY.value = withDelay(
      index * DIGIT_STAGGER_MS,
      withTiming(-toDigit * DIGIT_HEIGHT, {
        duration: DIGIT_ROLL_MS,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Soft settle glow when digit arrives
    const totalDelay = index * DIGIT_STAGGER_MS + DIGIT_ROLL_MS;
    flashOpacity.value = withDelay(
      totalDelay,
      withSequence(
        withTiming(0.3, { duration: 40 }),
        withTiming(0, { duration: SETTLE_FLASH_MS })
      )
    );
  }, [triggerKey, fromDigit, toDigit, index]);

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <View style={styles.digitClip}>
      <Animated.View style={[styles.digitStrip, stripStyle]}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <View key={d} style={styles.digitCell}>
            <Text style={styles.digitText}>{d}</Text>
          </View>
        ))}
      </Animated.View>
      {/* Soft settle glow */}
      <Animated.View style={[styles.digitFlash, flashStyle]} pointerEvents="none" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// StaticChar — comma, space, etc. (NOT pound sign — that's rendered separately)
// ---------------------------------------------------------------------------

function StaticChar({ char }: { char: string }) {
  return (
    <View style={styles.digitCell}>
      <Text style={styles.digitText}>{char}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// OdometerValue — splits formatted value into digit columns + static chars
// ---------------------------------------------------------------------------

interface OdometerValueProps {
  fromValue: number;
  toValue: number;
  triggerKey: number;
}

function OdometerValue({ fromValue, toValue, triggerKey }: OdometerValueProps) {
  const toFormatted = formatCurrency(toValue);
  const fromFormatted = formatCurrency(fromValue);

  // Pad the shorter string to match lengths (leading spaces become 0s for digits)
  const maxLen = Math.max(toFormatted.length, fromFormatted.length);
  const toPadded = toFormatted.padStart(maxLen, ' ');
  const fromPadded = fromFormatted.padStart(maxLen, ' ');

  let digitIndex = 0;

  return (
    <View style={styles.odometerRow}>
      {/* Pound sign — lighter weight, slightly smaller */}
      <Text style={styles.currencySign}>£</Text>
      {toPadded.split('').map((toChar, i) => {
        const fromChar = fromPadded[i] || ' ';

        // Non-digit characters (commas, spaces) are static
        if (!/\d/.test(toChar)) {
          return <StaticChar key={`s-${i}`} char={toChar} />;
        }

        const toD = parseInt(toChar, 10);
        const fromD = /\d/.test(fromChar) ? parseInt(fromChar, 10) : 0;
        const idx = digitIndex++;

        return (
          <OdometerDigit
            key={`d-${i}`}
            fromDigit={fromD}
            toDigit={toD}
            index={idx}
            triggerKey={triggerKey}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// GrowingSprout — sprout icon that scales up from the bottom
// ---------------------------------------------------------------------------

function GrowingSprout({ triggerKey }: { triggerKey: number }) {
  const scaleY = useSharedValue(0);
  const scaleX = useSharedValue(0.8);
  const iconOpacity = useSharedValue(0);

  useEffect(() => {
    // Reset
    scaleY.value = 0;
    scaleX.value = 0.8;
    iconOpacity.value = 0;

    // Grow upward after a tiny delay (let toast settle first)
    iconOpacity.value = withDelay(150, withTiming(1, { duration: 200 }));
    scaleY.value = withDelay(
      150,
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    scaleX.value = withDelay(
      150,
      withSpring(1, { damping: 14, stiffness: 160 })
    );
  }, [triggerKey]);

  const sproutStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: scaleY.value },
      { scaleX: scaleX.value },
    ],
    opacity: iconOpacity.value,
  }));

  return (
    <Animated.View style={[styles.sproutContainer, sproutStyle]}>
      <MaterialCommunityIcons
        name="sprout"
        size={20}
        color={KindlingColors.green}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// NetWealthToast
// ---------------------------------------------------------------------------

interface NetWealthToastProps {
  visible: boolean;
  fromValue: number;
  toValue: number;
  onHide: () => void;
}

export function NetWealthToast({ visible, fromValue, toValue, onHide }: NetWealthToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-140);
  const opacity = useSharedValue(0);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [renderState, setRenderState] = React.useState<{
    show: boolean;
    from: number;
    to: number;
    key: number;
  }>({ show: false, from: 0, to: 0, key: 0 });

  // Stable callback for hiding render state — avoids passing function updater through runOnJS
  const hideRenderState = React.useCallback(() => {
    setRenderState((prev) => ({ ...prev, show: false }));
  }, []);

  useEffect(() => {
    if (visible) {
      // Clear any pending hide timer (handles rapid consecutive triggers)
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      // Update render state for the odometer (defensive: ensure values are numbers)
      const safeFrom = typeof fromValue === 'number' && !isNaN(fromValue) ? fromValue : 0;
      const safeTo = typeof toValue === 'number' && !isNaN(toValue) ? toValue : 0;

      setRenderState((prev) => ({
        show: true,
        from: safeFrom,
        to: safeTo,
        key: prev.key + 1,
      }));

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Slide down
      translateY.value = -140;
      opacity.value = 1;
      translateY.value = withSpring(0, SPRING_CONFIG);

      // Schedule hide after hold
      hideTimerRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
          if (finished) {
            runOnJS(onHide)();
            runOnJS(hideRenderState)();
          }
        });
      }, HOLD_MS);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible, fromValue, toValue]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!renderState.show && !visible) return null;

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        { paddingTop: insets.top + Spacing.sm },
        containerStyle,
      ]}
      pointerEvents="none"
    >
      {/* Glass background */}
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.glassOverlay} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label}>Your estate grew</Text>
        <View style={styles.valueRow}>
          <GrowingSprout triggerKey={renderState.key} />
          <OdometerValue
            fromValue={renderState.from}
            toValue={renderState.to}
            triggerKey={renderState.key}
          />
        </View>
      </View>

      {/* Dissolving bottom edge — fades from glass to transparent */}
      <View style={styles.dissolveEdge} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
  dissolveEdge: {
    height: 10,
    // Simulated fade — lighter glass thinning out at the bottom
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.normal as any,
    color: KindlingColors.brown,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sproutContainer: {
    marginRight: 6,
    // Anchor growth from bottom
    transformOrigin: 'center bottom',
  },
  // Odometer
  odometerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySign: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.normal as any,
    color: KindlingColors.navy,
    marginRight: 1,
    opacity: 0.7,
  },
  digitText: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: KindlingColors.navy,
    fontVariant: ['tabular-nums'],
  },
  digitClip: {
    height: DIGIT_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  digitStrip: {
    // 10 digits stacked vertically
  },
  digitCell: {
    height: DIGIT_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 17,
  },
  digitFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: KindlingColors.lightGreen,
    borderRadius: 8,
  },
});
