/**
 * StageCard Component
 *
 * A card component for displaying will creation stages.
 * Shows title, status pill, subline, and a chevron for navigation.
 *
 * Visual hierarchy:
 *   - "hero" (next up): pulsing green shadow glow + subtle breathing scale
 *   - "completed": receded, calm
 *   - "future": quiet, disabled
 *
 * Uses react-native-reanimated for smooth shadow + scale animations.
 *
 * @module components/ui/StageCard
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../../styles/constants';

/**
 * Stage status types
 */
export type StageStatus = 'Not started' | 'In progress' | 'Complete';

/**
 * Visual emphasis level for the card
 */
export type CardEmphasis = 'hero' | 'completed' | 'future' | 'default';

/**
 * StageCard component props
 */
export interface StageCardProps {
  /** Stage title (e.g., "Your People") */
  title: string;
  /** Current status of the stage */
  status: StageStatus;
  /** Display label for the pill — can differ from status (e.g. "Up next") */
  statusLabel?: string;
  /** Descriptive subline */
  subline: string;
  /** Press handler for navigation */
  onPress?: () => void;
  /** Whether the card is disabled (future stages) */
  disabled?: boolean;
  /** Visual emphasis level */
  emphasis?: CardEmphasis;
  /** Test ID for testing */
  testID?: string;
  /** Additional style overrides */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Pill colours
// ---------------------------------------------------------------------------

interface PillStyle {
  bg: string;
  text: string;
}

const getPillStyle = (status: StageStatus, label?: string): PillStyle => {
  if (label === 'Up next') {
    return { bg: '#FFF3E0', text: '#E65100' };
  }
  switch (status) {
    case 'Complete':
      return { bg: `${KindlingColors.green}1a`, text: KindlingColors.green };
    case 'In progress':
      return { bg: '#FFF3E0', text: '#E65100' };
    case 'Not started':
    default:
      return { bg: `${KindlingColors.mutedForeground}1a`, text: KindlingColors.mutedForeground };
  }
};

// ---------------------------------------------------------------------------
// Animated hero wrapper — Reanimated-powered glow + breathing
// ---------------------------------------------------------------------------

const GLOW_COLOR = KindlingColors.lightGreen; // #8FCB9B — softer, lighter on-brand green

const HeroCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}> = ({ children, onPress, disabled, testID, accessibilityLabel, accessibilityHint, style }) => {
  // Shadow radius: pulses 4 → 16 → 4
  const shadowRadius = useSharedValue(4);
  // Shadow opacity: pulses 0.15 → 0.4 → 0.15
  const shadowOpacity = useSharedValue(0.15);
  // Scale: breathes 1 → 1.015 → 1
  const scale = useSharedValue(1);

  React.useEffect(() => {
    const ease = Easing.inOut(Easing.sin);

    shadowRadius.value = withRepeat(
      withSequence(
        withTiming(16, { duration: 1000, easing: ease }),
        withTiming(4, { duration: 1000, easing: ease }),
      ),
      -1,
    );

    shadowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000, easing: ease }),
        withTiming(0.15, { duration: 1000, easing: ease }),
      ),
      -1,
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 1200, easing: ease }),
        withTiming(1, { duration: 1200, easing: ease }),
      ),
      -1,
    );
  }, [shadowRadius, shadowOpacity, scale]);

  // Animated shadow + scale on an Animated.View wrapper
  const glowStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'ios') {
      return {
        transform: [{ scale: scale.value }],
        shadowColor: GLOW_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: shadowOpacity.value,
        shadowRadius: shadowRadius.value,
      };
    }
    // Android fallback — static elevation
    return {
      transform: [{ scale: scale.value }],
      elevation: 6,
    };
  });

  return (
    <Animated.View style={[heroStyles.glowWrapper, glowStyle, style]}>
      <TouchableOpacity
        style={heroStyles.touchable}
        onPress={onPress}
        disabled={disabled || !onPress}
        activeOpacity={0.7}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const heroStyles = StyleSheet.create({
  glowWrapper: {
    borderRadius: BorderRadius.lg,
    // Base shadow so something is visible on first frame
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  touchable: {
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: `${GLOW_COLOR}50`,
    padding: Spacing.md,
    minHeight: 48,
    overflow: 'hidden',
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const StageCard: React.FC<StageCardProps> = ({
  title,
  status,
  statusLabel,
  subline,
  onPress,
  disabled = false,
  emphasis = 'default',
  testID,
  style,
}) => {
  const pill = getPillStyle(status, statusLabel);
  const isHero = emphasis === 'hero';
  const isCompleted = emphasis === 'completed';

  const cardContent = (
    <View style={styles.content}>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            isCompleted && styles.titleCompleted,
            disabled && styles.titleDisabled,
          ]}
        >
          {title}
        </Text>

        {/* Status pill */}
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.pillText, { color: pill.text }]}>
            {statusLabel ?? status}
          </Text>
        </View>

        <Text
          style={[
            styles.subline,
            isCompleted && styles.sublineCompleted,
          ]}
        >
          {subline}
        </Text>
      </View>

      <View style={styles.chevronContainer}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={
            disabled
              ? KindlingColors.border
              : isCompleted
              ? KindlingColors.mutedForeground
              : KindlingColors.navy
          }
        />
      </View>
    </View>
  );

  if (isHero) {
    return (
      <HeroCard
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        accessibilityLabel={`${title}, ${statusLabel ?? status}`}
        accessibilityHint={subline}
        style={style}
      >
        {cardContent}
      </HeroCard>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompleted && styles.containerCompleted,
        disabled && styles.containerDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${statusLabel ?? status}`}
      accessibilityHint={subline}
    >
      {cardContent}
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    padding: Spacing.md,
    minHeight: 48,
    ...Shadows.small,
  },
  containerCompleted: {
    opacity: 0.7,
    borderColor: `${KindlingColors.green}30`,
  },
  containerDisabled: {
    opacity: 0.45,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  titleCompleted: {
    color: KindlingColors.mutedForeground,
  },
  titleDisabled: {
    color: KindlingColors.mutedForeground,
  },

  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  pillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },

  subline: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    color: KindlingColors.mutedForeground,
  },
  sublineCompleted: {
    opacity: 0.8,
  },

  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
});
