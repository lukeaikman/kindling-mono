/**
 * Estate Dashboard Screen
 *
 * The central hub for the "Your Estate" section. Hub-and-spoke model:
 * users navigate into categories from here and always return here.
 *
 * Two visual modes:
 *   Mode A (Selection) — no assets yet: warm category picker
 *   Mode B (Balance Sheet) — assets exist: net wealth hero + category cards
 *
 * @module screens/estate-dashboard
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

import { BackButton, Button } from '../src/components/ui';
import { EstateCategoryCard } from '../src/components/ui/EstateCategoryCard';
import { useAppState } from '../src/hooks/useAppState';
import { useNetWealthToast } from '../src/context/NetWealthToastContext';
import {
  CATEGORY_META,
  sortByCanonicalOrder,
  getCategoryRoute,
} from '../src/utils/categoryNavigation';
import {
  getEstateNetValue,
  getEstateGrossValue,
  getEstateTrustValue,
  isIHTReady,
  formatShortCurrency,
} from '../src/utils/willProgress';
import type { WillProgressState } from '../src/utils/willProgress';
import type { BequeathalData } from '../src/types';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../src/styles/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format number as full GBP: £550,000 */
const formatCurrency = (value: number): string => {
  return `£${value.toLocaleString('en-GB')}`;
};

/** Warm progress sentence for Mode B */
const getProgressSentence = (
  selectedCount: number,
  completeCount: number,
): string => {
  if (selectedCount === 0) return 'Select your first category to get started.';
  if (completeCount === selectedCount) return 'Your whole estate, mapped out.';
  return 'Your estate is taking shape.';
};

// ---------------------------------------------------------------------------
// Mode A — Selection Mode
// ---------------------------------------------------------------------------

interface ModeAProps {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

function SelectionMode({ selectedIds, onToggle }: ModeAProps) {
  // Float selected cards to top, preserving canonical order within each group
  const sortedCategories = useMemo(() => {
    const selected = CATEGORY_META.filter((c) => selectedIds.has(c.id));
    const unselected = CATEGORY_META.filter((c) => !selectedIds.has(c.id));
    return [...selected, ...unselected];
  }, [selectedIds]);

  return (
    <View style={styles.modeAContainer}>
      {/* Intro */}
      <View style={styles.introSection}>
        <Text style={styles.modeATitle}>Let's map out what you own</Text>
        <Text style={styles.modeASubtitle}>
          Tick everything that applies — you can always add more later.
        </Text>
      </View>

      {/* Category selection cards */}
      <View style={styles.categoryList}>
        {sortedCategories.map((cat) => {
          const isSelected = selectedIds.has(cat.id);
          return (
            <Animated.View
              key={cat.id}
              layout={Layout.springify().damping(50).stiffness(300)}
            >
              <TouchableOpacity
                style={[styles.selectionCard, isSelected && styles.selectionCardSelected]}
                onPress={() => onToggle(cat.id)}
                activeOpacity={0.7}
              >
                <View style={styles.selectionRow}>
                  <View style={styles.selectionIconCircle}>
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={22}
                      color={KindlingColors.navy}
                    />
                  </View>
                  <View style={styles.selectionTextContainer}>
                    <Text style={styles.selectionTitle}>{cat.label}</Text>
                    <Text style={styles.selectionDescription}>{cat.description}</Text>
                  </View>
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color={KindlingColors.background}
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mode B — Balance Sheet Mode
// ---------------------------------------------------------------------------

interface CategoryCardData {
  id: string;
  label: string;
  icon: string;
  assetCount: number;
  netValue: number;
  trustValue: number;
  isComplete: boolean;
  hasUnknownValues?: boolean;
}

interface ModeBProps {
  cards: CategoryCardData[];
  netValue: number;
  grossValue: number;
  trustValue: number;
  ihtReady: boolean;
  onCardPress: (id: string, assetCount: number) => void;
  onDeselect: (id: string) => void;
  onAddSomethingElse: () => void;
}

const BalanceSheetMode: React.FC<ModeBProps> = ({
  cards,
  netValue,
  grossValue,
  trustValue,
  ihtReady,
  onCardPress,
  onDeselect,
  onAddSomethingElse,
}) => {
  const completeCount = cards.filter((c) => c.isComplete).length;
  const progressSentence = getProgressSentence(cards.length, completeCount);

  return (
    <View style={styles.modeBContainer}>
      {/* Hero net wealth section */}
      <View style={styles.heroCard}>
        <Text style={styles.heroAmount}>{formatCurrency(netValue)}</Text>
        <Text style={styles.heroLabel}>Net Estate Value</Text>

        <View style={styles.heroBreakdown}>
          <View style={styles.heroBreakdownRow}>
            <Text style={styles.heroBreakdownLabel}>What You Own</Text>
            <Text style={styles.heroBreakdownValue}>{formatCurrency(grossValue)}</Text>
          </View>
          {trustValue > 0 && (
            <View style={styles.heroBreakdownRow}>
              <Text style={styles.heroBreakdownLabel}>In Trust</Text>
              <Text style={styles.heroBreakdownValue}>{formatCurrency(trustValue)}</Text>
            </View>
          )}
        </View>

        <View style={styles.ihtRow}>
          <MaterialCommunityIcons
            name={ihtReady ? 'calculator' : 'clock-outline'}
            size={14}
            color={KindlingColors.mutedForeground}
          />
          <Text style={styles.ihtText}>
            {ihtReady ? 'IHT estimate available' : 'IHT: Pending asset entry'}
          </Text>
        </View>
      </View>

      {/* Section header: Your Assets */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionLine} />
        <Text style={styles.sectionLabel}>YOUR ASSETS</Text>
        <View style={styles.sectionLine} />
      </View>

      {/* Selected category cards */}
      <View style={styles.categoryCards}>
        {cards.map((cat) => (
          <Animated.View
            key={cat.id}
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify().damping(50).stiffness(300)}
          >
            <EstateCategoryCard
              icon={cat.icon}
              title={cat.label}
              assetCount={cat.assetCount}
              netValue={cat.netValue}
              trustValue={cat.trustValue}
              isComplete={cat.isComplete}
              hasUnknownValues={cat.hasUnknownValues}
              onPress={() => onCardPress(cat.id, cat.assetCount)}
              onDeselect={cat.assetCount === 0 ? () => onDeselect(cat.id) : undefined}
            />
          </Animated.View>
        ))}
      </View>

      {/* Add something else */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddSomethingElse}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="plus-circle-outline"
          size={20}
          color={KindlingColors.green}
        />
        <Text style={styles.addButtonText}>Add something else</Text>
      </TouchableOpacity>

      {/* Warm progress sentence */}
      <View style={styles.progressRow}>
        <MaterialCommunityIcons
          name="flag-checkered"
          size={18}
          color={KindlingColors.mutedForeground}
        />
        <Text style={styles.progressText}>{progressSentence}</Text>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EstateDashboardScreen() {
  const { bequeathalActions, willActions, personActions, estateRemainderActions, isBequeathalHydrated } = useAppState();
  const netWealthToast = useNetWealthToast();

  // Seed the net wealth toast so first asset save is compared correctly
  const bd: BequeathalData = bequeathalActions.getBequeathalData();
  useEffect(() => {
    if (isBequeathalHydrated) {
      netWealthToast.seedIfNeeded(bd);
    }
  }, [isBequeathalHydrated]);

  // Build progress state for willProgress helpers
  const progressState: WillProgressState = useMemo(
    () => ({
      willMaker: willActions.getUser(),
      people: personActions.getPeople(),
      willData: willActions.getWillData(),
      estateRemainderState: estateRemainderActions.getEstateRemainderState(),
      bequeathalData: bd,
    }),
    [willActions, personActions, estateRemainderActions, bd],
  );

  // Derive real values
  const totalAssetCount = bequeathalActions.getTotalAssetCount();
  const selectedCategories = sortByCanonicalOrder(bequeathalActions.getSelectedCategories());
  const hasStartedEntry = bequeathalActions.getBequeathalData().hasStartedEntry === true;
  const isBalanceSheet = totalAssetCount > 0 || (hasStartedEntry && selectedCategories.length > 0);
  const selectedSet = useMemo(() => new Set(selectedCategories), [selectedCategories]);

  // Real calculated values for Mode B
  const netValue = useMemo(() => getEstateNetValue(progressState), [progressState]);
  const grossValue = useMemo(() => getEstateGrossValue(progressState), [progressState]);
  const trustValue = useMemo(() => getEstateTrustValue(progressState), [progressState]);
  const ihtReady = useMemo(() => isIHTReady(progressState), [progressState]);

  // Build category card data for Mode B
  const categoryCards: CategoryCardData[] = useMemo(() => {
    return selectedCategories.map((catId) => {
      const meta = CATEGORY_META.find((c) => c.id === catId);
      const assetCount = bequeathalActions.getAssetCountByType(catId);
      const assets = bequeathalActions.getAssetsByType(catId as any);

      let catNet = 0;
      let catTrust = 0;
      for (const asset of assets) {
        const val = asset.netValue !== undefined
          ? asset.netValue
          : asset.type === 'property'
            ? (asset.estimatedValue || 0) - ((asset as any).mortgage?.outstandingAmount || 0)
            : (asset.estimatedValue || 0);

        if (asset.heldInTrust === 'yes') {
          catTrust += val;
        } else {
          catNet += val;
        }
      }

      const hasUnknown = assets.some(a => a.estimatedValueUnknown === true);

      return {
        id: catId,
        label: meta?.label || catId,
        icon: meta?.icon || 'folder',
        assetCount,
        netValue: catNet,
        trustValue: catTrust,
        isComplete: bequeathalActions.isCategoryComplete(catId),
        hasUnknownValues: hasUnknown,
      };
    });
  }, [selectedCategories, bequeathalActions]);

  // ---- Bottom sheet for "Add something else" ----
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Unselected categories for the tray
  const unselectedCategories = useMemo(
    () => CATEGORY_META.filter((c) => !selectedSet.has(c.id)),
    [selectedSet],
  );

  // ---- Dev dashboard triple-tap ----
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef(0);
  const handleHeaderPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      router.push('/developer/dashboard');
    }
  };

  // ---- Handlers ----
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleToggleCategory = useCallback(
    (id: string) => {
      if (bequeathalActions.isCategorySelected(id)) {
        bequeathalActions.deselectCategory(id);
      } else {
        bequeathalActions.selectCategory(id);
      }
    },
    [bequeathalActions],
  );

  const handleCardPress = useCallback(
    (id: string, assetCount: number) => {
      const route = getCategoryRoute(id, assetCount);
      router.push(route as any);
    },
    [],
  );

  const handleDeselect = useCallback(
    (id: string) => {
      bequeathalActions.deselectCategory(id);
      // If this was the last category, reset the started flag so Mode A returns
      const remaining = bequeathalActions.getSelectedCategories().filter(c => c !== id);
      if (remaining.length === 0) {
        bequeathalActions.setHasStartedEntry(false);
      }
    },
    [bequeathalActions],
  );

  const handleAddSomethingElse = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleSelectFromTray = useCallback(
    (id: string) => {
      bequeathalActions.selectCategory(id);
      bottomSheetRef.current?.close();
    },
    [bequeathalActions],
  );

  const handleAllAssetsAdded = useCallback(() => {
    if (bequeathalActions.areAllCategoriesComplete()) {
      // All complete — route to Will Dashboard
      router.push('/will-dashboard' as any);
      return;
    }

    // Find incomplete categories
    const incomplete = selectedCategories.filter(
      (cat) => !bequeathalActions.isCategoryComplete(cat),
    );
    const zeroAsset = incomplete.filter(
      (cat) => bequeathalActions.getAssetCountByType(cat) === 0,
    );
    const hasAssetsNotMarked = incomplete.filter(
      (cat) => bequeathalActions.getAssetCountByType(cat) > 0,
    );

    // Build a human-readable message
    const getNames = (cats: string[]) =>
      cats
        .map((c) => CATEGORY_META.find((m) => m.id === c)?.label || c)
        .join(', ');

    if (zeroAsset.length > 0) {
      const names = getNames(zeroAsset);
      Alert.alert(
        'Some categories are empty',
        `${names} ${zeroAsset.length === 1 ? 'has' : 'have'} no assets yet. Mark ${zeroAsset.length === 1 ? 'it' : 'them'} complete anyway, or go back and add some?`,
        [
          { text: 'Go back', style: 'cancel' },
          {
            text: 'Mark complete anyway',
            onPress: () => {
              bequeathalActions.markAllCategoriesComplete();
              router.push('/will-dashboard' as any);
            },
          },
        ],
      );
    } else if (hasAssetsNotMarked.length > 0) {
      Alert.alert(
        'Almost there',
        'Shall we mark all asset categories as complete?',
        [
          { text: 'Not yet', style: 'cancel' },
          {
            text: "Yes, that's everything",
            onPress: () => {
              bequeathalActions.markAllCategoriesComplete();
              router.push('/will-dashboard' as any);
            },
          },
        ],
      );
    }
  }, [selectedCategories, bequeathalActions]);

  const handleModeAGetStarted = useCallback(() => {
    // Commit the transition from Mode A (category picker) to Mode B (dashboard cards)
    if (selectedCategories.length > 0) {
      bequeathalActions.setHasStartedEntry(true);
      const firstCat = selectedCategories[0];
      const route = getCategoryRoute(firstCat, 0); // 0 assets in mode A
      router.push(route as any);
    }
  }, [selectedCategories, bequeathalActions]);

  // ---- Render ----
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Morphic Background */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
        <View style={[styles.morphicBlob, styles.blob3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <TouchableOpacity style={styles.headerCenter} onPress={handleHeaderPress} activeOpacity={1}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons
              name="treasure-chest"
              size={18}
              color={KindlingColors.navy}
            />
          </View>
          <Text style={styles.headerTitle}>Your Estate</Text>
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </View>

      {/* Content — gated on AsyncStorage hydration to prevent Mode A flash */}
      {isBequeathalHydrated ? (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {isBalanceSheet ? (
              <BalanceSheetMode
                cards={categoryCards}
                netValue={netValue}
                grossValue={grossValue}
                trustValue={trustValue}
                ihtReady={ihtReady}
                onCardPress={handleCardPress}
                onDeselect={handleDeselect}
                onAddSomethingElse={handleAddSomethingElse}
              />
            ) : (
              <SelectionMode
                selectedIds={selectedSet}
                onToggle={handleToggleCategory}
              />
            )}
          </ScrollView>

          {/* Footer */}
          {isBalanceSheet ? (
            totalAssetCount > 0 ? (
              <View style={styles.footer}>
                <Button onPress={handleAllAssetsAdded} variant="primary">
                  All assets added
                </Button>
              </View>
            ) : null
          ) : selectedSet.size > 0 ? (
            <View style={styles.footer}>
              <Button onPress={handleModeAGetStarted} variant="primary">
                Let's get started
              </Button>
            </View>
          ) : null}
        </>
      ) : null}

      {/* Bottom Sheet — "Add something else" tray */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%', '75%']}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        )}
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.bottomSheetHandle}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Add a category</Text>
          <Text style={styles.bottomSheetSubtitle}>
            Select a category to add to your estate
          </Text>
          {unselectedCategories.length === 0 ? (
            <Text style={styles.bottomSheetEmpty}>
              All categories are already selected.
            </Text>
          ) : (
            <View style={styles.bottomSheetList}>
              {unselectedCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.bottomSheetItem}
                  onPress={() => handleSelectFromTray(cat.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bottomSheetItemIcon}>
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={20}
                      color={KindlingColors.navy}
                    />
                  </View>
                  <View style={styles.bottomSheetItemText}>
                    <Text style={styles.bottomSheetItemTitle}>{cat.label}</Text>
                    <Text style={styles.bottomSheetItemDesc}>{cat.description}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="plus-circle-outline"
                    size={22}
                    color={KindlingColors.green}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // -- Layout shell --
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
    opacity: 0.12,
  },
  blob1: {
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    backgroundColor: KindlingColors.navy,
    borderRadius: 175,
    transform: [{ rotate: '-20deg' }],
  },
  blob2: {
    top: '45%',
    left: -80,
    width: 260,
    height: 200,
    backgroundColor: KindlingColors.brown,
    borderRadius: 130,
    transform: [{ rotate: '30deg' }],
  },
  blob3: {
    bottom: -80,
    right: -60,
    width: 220,
    height: 170,
    backgroundColor: KindlingColors.beige,
    borderRadius: 110,
    transform: [{ rotate: '50deg' }],
  },

  // -- Header --
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: KindlingColors.background,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  headerRight: {
    width: 48,
  },

  // -- Scroll --
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },

  // -- Footer --
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}1a`,
  },

  // ==========================================================================
  // MODE A — Selection
  // ==========================================================================
  modeAContainer: {
    flex: 1,
  },
  introSection: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  modeATitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modeASubtitle: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    textAlign: 'center',
    lineHeight: Typography.fontSize.md * 1.5,
  },
  categoryList: {
    gap: Spacing.sm,
  },

  // Selection card
  selectionCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: KindlingColors.cream,
    ...Shadows.small,
  },
  selectionCardSelected: {
    borderColor: KindlingColors.beige,
    backgroundColor: `${KindlingColors.cream}80`,
    shadowColor: KindlingColors.beige,
    shadowOpacity: 0.2,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${KindlingColors.navy}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 4,
  },
  selectionTextContainer: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: 2,
  },
  selectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 18,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: `${KindlingColors.beige}4D`,
    backgroundColor: KindlingColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  checkCircleSelected: {
    backgroundColor: KindlingColors.green,
    borderColor: KindlingColors.green,
  },

  // ==========================================================================
  // MODE B — Balance Sheet
  // ==========================================================================
  modeBContainer: {
    flex: 1,
  },

  // Hero card
  heroCard: {
    backgroundColor: KindlingColors.cream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  heroAmount: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  heroLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.mutedForeground,
    marginBottom: Spacing.md,
  },
  heroBreakdown: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  heroBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBreakdownLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
  heroBreakdownValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  ihtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.navy}10`,
    width: '100%',
  },
  ihtText: {
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
    color: KindlingColors.mutedForeground,
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: KindlingColors.border,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.mutedForeground,
    letterSpacing: 1.2,
  },

  // Category cards
  categoryCards: {
    gap: Spacing.sm,
  },

  // Add something else
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  addButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.green,
  },

  // Progress sentence
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${KindlingColors.navy}08`,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    lineHeight: Typography.fontSize.sm * 1.5,
  },

  // ==========================================================================
  // Bottom Sheet — "Add something else" tray
  // ==========================================================================
  bottomSheetBg: {
    backgroundColor: KindlingColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHandle: {
    backgroundColor: KindlingColors.green,
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  bottomSheetTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  bottomSheetSubtitle: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginBottom: Spacing.lg,
  },
  bottomSheetEmpty: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  bottomSheetList: {
    gap: Spacing.sm,
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    backgroundColor: `${KindlingColors.cream}40`,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${KindlingColors.beige}33`,
  },
  bottomSheetItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${KindlingColors.navy}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  bottomSheetItemText: {
    flex: 1,
  },
  bottomSheetItemTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  bottomSheetItemDesc: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
});
