/**
 * Estate Dashboard Screen
 *
 * The central hub for the "Your Estate" section, replacing the linear
 * category → intro → entry pipeline with a hub-and-spoke model.
 *
 * Two visual modes:
 *   Mode A (Selection) — no assets yet: warm category picker
 *   Mode B (Balance Sheet) — assets exist: net wealth hero + category cards
 *
 * Phase 1: Static UI prototype with hardcoded dummy data and a dev toggle.
 *
 * @module screens/estate-dashboard
 */

import React, { useState } from 'react';
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
import { BackButton, Button } from '../src/components/ui';
import { EstateCategoryCard } from '../src/components/ui/EstateCategoryCard';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../src/styles/constants';

// ---------------------------------------------------------------------------
// Canonical category metadata — merged and ordered
// ---------------------------------------------------------------------------

interface CategoryMeta {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'property', label: 'Property', icon: 'home', description: 'Houses, flats, land, and other real estate' },
  { id: 'bank-accounts', label: 'Bank Accounts', icon: 'piggy-bank', description: 'Current accounts, savings, ISAs' },
  { id: 'pensions', label: 'Pensions', icon: 'shield', description: 'Workplace and private pensions' },
  { id: 'investment', label: 'Investments', icon: 'trending-up', description: 'Stocks, shares, bonds, funds' },
  { id: 'life-insurance', label: 'Life Insurance', icon: 'shield-account', description: 'Life insurance policies and payouts' },
  { id: 'private-company-shares', label: 'Private Company Shares', icon: 'office-building', description: 'Shares in private companies' },
  { id: 'assets-held-through-business', label: 'Assets Held Through Business', icon: 'domain', description: 'Assets owned by your business' },
  { id: 'important-items', label: 'Important Items', icon: 'diamond', description: 'Jewellery, art, collectibles, heirlooms' },
  { id: 'crypto-currency', label: 'Cryptocurrency', icon: 'bitcoin', description: 'Bitcoin, Ethereum, and other crypto' },
  { id: 'agricultural-assets', label: 'Agricultural Assets', icon: 'nature', description: 'Farmland, livestock, equipment' },
];

// ---------------------------------------------------------------------------
// Dummy data — Phase 1 only (hardcoded constants)
// ---------------------------------------------------------------------------

interface DummyCategoryState {
  id: string;
  assetCount: number;
  netValue: number;
  isComplete: boolean;
}

const DUMMY_SELECTED: DummyCategoryState[] = [
  { id: 'property', assetCount: 2, netValue: 550000, isComplete: true },
  { id: 'bank-accounts', assetCount: 0, netValue: 0, isComplete: false },
  { id: 'investment', assetCount: 1, netValue: 200000, isComplete: false },
  { id: 'pensions', assetCount: 1, netValue: 185000, isComplete: false },
];

const DUMMY_NET = 982000;
const DUMMY_GROSS = 1247000;
const DUMMY_TRUST = 150000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format number as short GBP: £550k, £1.2m, etc. */
const formatCurrency = (value: number): string => {
  return `£${value.toLocaleString('en-GB')}`;
};

/** Warm progress sentence for Mode B */
const getProgressSentence = (selected: DummyCategoryState[]): string => {
  const completeCount = selected.filter((c) => c.isComplete).length;
  if (completeCount === 0) return 'Select your first category to get started.';
  if (completeCount === selected.length) return 'Your whole estate, mapped out.';
  return 'Your estate is taking shape.';
};

// ---------------------------------------------------------------------------
// Mode A — Selection Mode
// ---------------------------------------------------------------------------

interface ModeAProps {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

const SelectionMode: React.FC<ModeAProps> = ({ selectedIds, onToggle }) => (
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
      {CATEGORIES.map((cat) => {
        const isSelected = selectedIds.has(cat.id);
        return (
          <TouchableOpacity
            key={cat.id}
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
        );
      })}
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Mode B — Balance Sheet Mode
// ---------------------------------------------------------------------------

interface ModeBProps {
  selected: DummyCategoryState[];
  onCardPress: (id: string) => void;
  onDeselect: (id: string) => void;
  onAddSomethingElse: () => void;
  onAllAssetsAdded: () => void;
}

const BalanceSheetMode: React.FC<ModeBProps> = ({
  selected,
  onCardPress,
  onDeselect,
  onAddSomethingElse,
  onAllAssetsAdded,
}) => {
  const progressSentence = getProgressSentence(selected);

  return (
    <View style={styles.modeBContainer}>
      {/* Hero net wealth section */}
      <View style={styles.heroCard}>
        <Text style={styles.heroAmount}>{formatCurrency(DUMMY_NET)}</Text>
        <Text style={styles.heroLabel}>Net Estate Value</Text>

        <View style={styles.heroBreakdown}>
          <View style={styles.heroBreakdownRow}>
            <Text style={styles.heroBreakdownLabel}>What You Own</Text>
            <Text style={styles.heroBreakdownValue}>{formatCurrency(DUMMY_GROSS)}</Text>
          </View>
          <View style={styles.heroBreakdownRow}>
            <Text style={styles.heroBreakdownLabel}>In Trust</Text>
            <Text style={styles.heroBreakdownValue}>{formatCurrency(DUMMY_TRUST)}</Text>
          </View>
        </View>

        <View style={styles.ihtRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={KindlingColors.mutedForeground}
          />
          <Text style={styles.ihtText}>IHT: Pending asset entry</Text>
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
        {selected.map((cat) => {
          const meta = CATEGORIES.find((c) => c.id === cat.id);
          if (!meta) return null;
          return (
            <EstateCategoryCard
              key={cat.id}
              icon={meta.icon}
              title={meta.label}
              assetCount={cat.assetCount}
              netValue={cat.netValue}
              isComplete={cat.isComplete}
              onPress={() => onCardPress(cat.id)}
              onDeselect={cat.assetCount === 0 ? () => onDeselect(cat.id) : undefined}
            />
          );
        })}
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
  // Phase 1: dev toggle between Mode A and Mode B
  const [isBalanceSheet, setIsBalanceSheet] = useState(false);

  // Mode A: local selection state (purely for prototype interactivity)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(DUMMY_SELECTED.map((c) => c.id)),
  );

  const handleToggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleCardPress = (id: string) => {
    Alert.alert('Navigate', `Would navigate to ${id} summary or intro`);
  };

  const handleDeselect = (id: string) => {
    Alert.alert('Deselect', `Would deselect ${id}`);
  };

  const handleAddSomethingElse = () => {
    Alert.alert('Add Category', 'Would open bottom sheet with unselected categories');
  };

  const handleAllAssetsAdded = () => {
    Alert.alert('All Assets Added', 'Would check completion and route to Will Dashboard');
  };

  const handleModeAGetStarted = () => {
    Alert.alert('Get Started', 'Would navigate to the first selected category intro screen');
  };

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
        <View style={styles.headerCenter}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons
              name="treasure-chest"
              size={18}
              color={KindlingColors.navy}
            />
          </View>
          <Text style={styles.headerTitle}>Your Estate</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isBalanceSheet ? (
          <BalanceSheetMode
            selected={DUMMY_SELECTED}
            onCardPress={handleCardPress}
            onDeselect={handleDeselect}
            onAddSomethingElse={handleAddSomethingElse}
            onAllAssetsAdded={handleAllAssetsAdded}
          />
        ) : (
          <SelectionMode
            selectedIds={selectedIds}
            onToggle={handleToggleCategory}
          />
        )}
      </ScrollView>

      {/* Footer */}
      {isBalanceSheet ? (
        <View style={styles.footer}>
          <Button onPress={handleAllAssetsAdded} variant="primary">
            All assets added
          </Button>
        </View>
      ) : selectedIds.size > 0 ? (
        <View style={styles.footer}>
          <Button onPress={handleModeAGetStarted} variant="primary">
            Let's get started
          </Button>
        </View>
      ) : null}

      {/* DEV toggle: switch between Mode A and Mode B */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.devToggle}
          onPress={() => setIsBalanceSheet((prev) => !prev)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isBalanceSheet ? 'view-list' : 'chart-bar'}
            size={20}
            color={KindlingColors.background}
          />
          <Text style={styles.devToggleText}>
            {isBalanceSheet ? 'A' : 'B'}
          </Text>
        </TouchableOpacity>
      )}
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
    zIndex: 10,
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
    zIndex: 10,
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
    zIndex: 10,
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

  // Selection card — warm style matching categories.tsx
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
  // DEV toggle
  // ==========================================================================
  devToggle: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: KindlingColors.navy,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.medium,
    zIndex: 100,
  },
  devToggleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.background,
  },
});
