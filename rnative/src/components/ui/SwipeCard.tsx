/**
 * SwipeCard Component
 *
 * Tinder-style swipeable card for quick-fire yes/no questions.
 * Apple Wallet-inspired surface with anamorphic blobs.
 * Exposes translateX as a shared value so parent can drive
 * button animations tied to card position.
 *
 * @module components/ui/SwipeCard
 */

import React, { useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Dimensions, View, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { KindlingColors } from '../../styles/theme';
import { Typography, Spacing } from '../../styles/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const FLY_OUT_DISTANCE = SCREEN_WIDTH * 1.5;
const CARD_RADIUS = 24;

export interface SwipeCardRef {
  dismissLeft: () => void;
  dismissRight: () => void;
}

export interface SwipeCardProps {
  question: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  stackIndex: number;
  /** Parent-owned shared value so buttons can react to drag position */
  dragX?: SharedValue<number>;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  ({ question, onSwipeLeft, onSwipeRight, isTop, stackIndex, dragX }, ref) => {
    const internalX = useSharedValue(0);
    const translateX = dragX ?? internalX;
    const isAnimatingOut = useSharedValue(false);

    const flyOut = (direction: 'left' | 'right') => {
      'worklet';
      if (isAnimatingOut.value) return;
      isAnimatingOut.value = true;
      const target = direction === 'right' ? FLY_OUT_DISTANCE : -FLY_OUT_DISTANCE;
      const cb = direction === 'right' ? onSwipeRight : onSwipeLeft;
      translateX.value = withTiming(target, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(cb)();
      });
    };

    useImperativeHandle(ref, () => ({
      dismissLeft: () => { flyOut('left'); },
      dismissRight: () => { flyOut('right'); },
    }));

    const panGesture = Gesture.Pan()
      .enabled(isTop)
      .onUpdate((e) => {
        if (isAnimatingOut.value) return;
        translateX.value = e.translationX;
      })
      .onEnd((e) => {
        if (isAnimatingOut.value) return;
        if (e.translationX > SWIPE_THRESHOLD) {
          flyOut('right');
        } else if (e.translationX < -SWIPE_THRESHOLD) {
          flyOut('left');
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
      });

    const cardStyle = useAnimatedStyle(() => {
      const rotation = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-8, 0, 8]);
      const scale = isTop
        ? 1
        : interpolate(stackIndex, [0, 1, 2, 3], [1, 0.96, 0.92, 0.88]);
      const opacity = isTop
        ? 1
        : interpolate(stackIndex, [0, 1, 2, 3], [1, 0.65, 0.35, 0.1]);
      const yOffset = isTop ? 0 : stackIndex * 10;

      return {
        transform: [
          { translateX: translateX.value },
          { rotate: `${rotation}deg` },
          { scale },
          { translateY: yOffset },
        ],
        opacity,
      };
    });

    const shadowStyle = useAnimatedStyle(() => {
      const shadowColor = interpolateColor(
        translateX.value,
        [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
        ['#c0392b', '#293241', '#27ae60']
      );
      const shadowOpacity = interpolate(
        Math.abs(translateX.value),
        [0, SWIPE_THRESHOLD],
        [0.12, 0.3],
        'clamp'
      );
      const shadowRadius = interpolate(
        Math.abs(translateX.value),
        [0, SWIPE_THRESHOLD],
        [16, 24],
        'clamp'
      );

      return Platform.OS === 'ios'
        ? { shadowColor, shadowOpacity, shadowRadius }
        : { elevation: interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [8, 16], 'clamp') };
    });

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            shadowStyle,
            { zIndex: 10 - stackIndex },
          ]}
        >
          <View style={styles.surface}>
            <View style={styles.warmBlob} />
            <View style={styles.coolBlob} />

            <View style={styles.content}>
              <Text style={styles.question}>{question}</Text>
            </View>

            <View style={styles.bottomEdge}>
              <View style={styles.bottomLine} />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    );
  }
);

export { SWIPE_THRESHOLD };

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.84,
    aspectRatio: 3 / 4,
    borderRadius: CARD_RADIUS,
    backgroundColor: '#ffffff',
    shadowColor: KindlingColors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  surface: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#f9f8f6',
  },
  warmBlob: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: KindlingColors.cream,
    opacity: 0.7,
  },
  coolBlob: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${KindlingColors.green}12`,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl + Spacing.md,
  },
  question: {
    fontSize: 27,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    textAlign: 'center',
    lineHeight: 27 * 1.35,
    letterSpacing: -0.3,
  },
  bottomEdge: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  bottomLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: `${KindlingColors.green}30`,
  },
});
