/**
 * Avoid Issues Screen
 *
 * Tinder-style swipe card flow for quick-fire legal risk questions.
 * Buttons react to card drag position: the chosen direction's button
 * bulges while the other fades. Undo button lets you re-answer.
 *
 * Front-end only — answers stored in local state (no persistence yet).
 *
 * @module screens/legal-check/avoid-issues
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import Animated, {
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BackButton, Button } from '../../src/components/ui';
import { Celebration } from '../../src/components/ui/Celebration';
import { SwipeCard, SwipeCardRef, SWIPE_THRESHOLD } from '../../src/components/ui/SwipeCard';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography, BorderRadius } from '../../src/styles/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUESTIONS = [
  { id: 'estranged-children', question: 'Do you have any children you are estranged from, or with whom you have a difficult relationship?' },
  { id: 'contradicted-promises', question: 'Does this will contradict a promise made to anyone who was promised something on your death?' },
  { id: 'family-conflict', question: 'Would you describe your family as having significant conflict that might affect the administration of your estate?' },
  { id: 'disabled-beneficiaries-care', question: 'Are any of your beneficiaries disabled with care needs?' },
  { id: 'disabled-beneficiaries-money', question: 'Do you have any beneficiaries who are disabled or have a vulnerability that affects their ability to manage money?' },
];

export default function AvoidIssuesScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [answerHistory, setAnswerHistory] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const topCardRef = useRef<SwipeCardRef>(null);

  const progressWidth = useSharedValue(0);
  const cardDragX = useSharedValue(0);

  const isComplete = currentIndex >= QUESTIONS.length;
  const canUndo = answerHistory.length > 0 && !isComplete;

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    router.back();
  }, []);

  const handleAnswer = useCallback((questionId: string, answer: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setAnswerHistory(prev => [...prev, questionId]);
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    cardDragX.value = 0;
    progressWidth.value = withTiming(nextIndex / QUESTIONS.length, { duration: 300 });

    if (nextIndex >= QUESTIONS.length) {
      setTimeout(() => setShowCelebration(true), 500);
    }
  }, [currentIndex, progressWidth, cardDragX]);

  const handleUndo = useCallback(() => {
    if (answerHistory.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lastId = answerHistory[answerHistory.length - 1];
    setAnswerHistory(prev => prev.slice(0, -1));
    setAnswers(prev => {
      const next = { ...prev };
      delete next[lastId];
      return next;
    });
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    cardDragX.value = 0;
    progressWidth.value = withTiming(prevIndex / QUESTIONS.length, { duration: 300 });
  }, [answerHistory, currentIndex, progressWidth, cardDragX]);

  const handleNo = useCallback(() => {
    if (isComplete) return;
    topCardRef.current?.dismissLeft();
  }, [isComplete]);

  const handleYes = useCallback(() => {
    if (isComplete) return;
    topCardRef.current?.dismissRight();
  }, [isComplete]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  // No button: grows when dragging left, shrinks when dragging right
  const noButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      cardDragX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD * 0.5],
      [1.12, 1, 0.85],
      'clamp'
    );
    const opacity = interpolate(
      cardDragX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD * 0.7],
      [1, 1, 0.3],
      'clamp'
    );
    return { transform: [{ scale }], opacity };
  });

  // Yes button: grows when dragging right, shrinks when dragging left
  const yesButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      cardDragX.value,
      [-SWIPE_THRESHOLD * 0.5, 0, SWIPE_THRESHOLD],
      [0.85, 1, 1.12],
      'clamp'
    );
    const opacity = interpolate(
      cardDragX.value,
      [-SWIPE_THRESHOLD * 0.7, 0, SWIPE_THRESHOLD],
      [0.3, 1, 1],
      'clamp'
    );
    return { transform: [{ scale }], opacity };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Morphic background blobs */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons
              name="shield-alert-outline"
              size={16}
              color={KindlingColors.navy}
            />
          </View>
          <Text style={styles.title}>Avoid Issues</Text>
        </View>
        <View style={styles.headerSpacer}>
          {canUndo && (
            <TouchableOpacity onPress={handleUndo} style={styles.undoButton} activeOpacity={0.7}>
              <MaterialCommunityIcons name="undo" size={20} color={KindlingColors.brown} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressBarStyle]} />
      </View>

      {/* Counter */}
      {!isComplete && (
        <Text style={styles.counter}>
          {currentIndex + 1} of {QUESTIONS.length}
        </Text>
      )}

      {/* Card stack */}
      {!isComplete && (
        <View style={styles.cardArea}>
          <View style={styles.stackContainer}>
            {QUESTIONS.slice(currentIndex, currentIndex + 3).map((q, i) => {
              const isTop = i === 0;
              return (
                <SwipeCard
                  key={q.id}
                  ref={isTop ? topCardRef : undefined}
                  question={q.question}
                  isTop={isTop}
                  stackIndex={i}
                  dragX={isTop ? cardDragX : undefined}
                  onSwipeLeft={() => handleAnswer(q.id, false)}
                  onSwipeRight={() => handleAnswer(q.id, true)}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Reactive Yes/No buttons */}
      {!isComplete && (
        <View style={styles.buttonRow}>
          <Animated.View style={[styles.buttonWrapper, noButtonStyle]}>
            <Button variant="outline" onPress={handleNo} icon="close">
              No
            </Button>
          </Animated.View>
          <Animated.View style={[styles.buttonWrapper, yesButtonStyle]}>
            <Button variant="secondary" onPress={handleYes} icon="check">
              Yes
            </Button>
          </Animated.View>
        </View>
      )}

      {/* Full confetti celebration — navigates back to legal dashboard on complete */}
      <Celebration
        visible={showCelebration}
        variant="full"
        onComplete={handleCelebrationComplete}
      />
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
    opacity: 0.08,
  },
  blob1: {
    top: -60,
    right: -80,
    width: 280,
    height: 280,
    backgroundColor: KindlingColors.navy,
    borderRadius: 140,
    transform: [{ rotate: '-15deg' }],
  },
  blob2: {
    bottom: -40,
    left: -60,
    width: 200,
    height: 160,
    backgroundColor: KindlingColors.beige,
    borderRadius: 100,
    transform: [{ rotate: '25deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}1a`,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  headerSpacer: {
    width: 48,
    alignItems: 'flex-end',
  },
  undoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${KindlingColors.brown}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: `${KindlingColors.border}80`,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: KindlingColors.green,
    borderRadius: BorderRadius.full,
  },
  counter: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackContainer: {
    width: SCREEN_WIDTH * 0.84,
    aspectRatio: 3 / 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
});
