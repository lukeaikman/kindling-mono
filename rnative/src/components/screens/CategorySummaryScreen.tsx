/**
 * CategorySummaryScreen — generic summary screen for any asset category.
 *
 * Lists all assets in the category, allows add/edit/delete, and provides
 * "That's everything" completion action that navigates back to estate dashboard.
 *
 * Design language matches the rest of the app:
 *   - Cream summary banner (like estate dashboard hero)
 *   - Green/navy morphic blobs (like people summary)
 *   - Warm card borders (beige/navy tints, green accent bars)
 *
 * @module components/screens/CategorySummaryScreen
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { BackButton, Button, AssetCard } from '../ui';
import { useAppState } from '../../hooks/useAppState';
import { getCategoryLabel, getCategoryIcon, getCategoryEntryRoute } from '../../utils/categoryNavigation';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../../styles/constants';
import type { Asset } from '../../types';

export interface CategorySummaryScreenProps {
  categoryId: string;
}

export const CategorySummaryScreen: React.FC<CategorySummaryScreenProps> = ({ categoryId }) => {
  const { bequeathalActions } = useAppState();

  const categoryLabel = getCategoryLabel(categoryId);
  const categoryIcon = getCategoryIcon(categoryId);
  const assets = bequeathalActions.getAssetsByType(categoryId as any) as Asset[];
  const isComplete = bequeathalActions.isCategoryComplete(categoryId);

  // Calculate total value (defensive: ensure always a number)
  const totalValue = useMemo(() => {
    if (!Array.isArray(assets)) return 0;
    return assets.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
  }, [assets]);

  const totalNet = useMemo(() => {
    if (!Array.isArray(assets)) return 0;
    return assets.reduce((sum, a) => {
      const value = a.estimatedValue || 0;
      if (a.type === 'property') {
        const mortgage = (a as any).mortgage?.outstandingAmount || 0;
        return sum + (value - mortgage);
      }
      return sum + value;
    }, 0);
  }, [assets]);

  const hasAssets = Array.isArray(assets) && assets.length > 0;
  const showNet = (totalNet ?? 0) !== (totalValue ?? 0);

  // Navigation
  const handleBack = useCallback(() => {
    router.push('/estate-dashboard' as any);
  }, []);

  const handleAddAsset = useCallback(() => {
    const entryRoute = getCategoryEntryRoute(categoryId);
    router.push(entryRoute as any);
  }, [categoryId]);

  const handleEditAsset = useCallback((assetId: string) => {
    const entryRoute = getCategoryEntryRoute(categoryId);
    router.push(`${entryRoute}?id=${assetId}` as any);
  }, [categoryId]);

  const handleDeleteAsset = useCallback((assetId: string) => {
    Alert.alert(
      'Delete asset',
      'Are you sure you want to remove this asset?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => bequeathalActions.removeAsset(assetId),
        },
      ],
    );
  }, [bequeathalActions]);

  // Mark complete and navigate back to estate dashboard
  const handleMarkComplete = useCallback(() => {
    bequeathalActions.markCategoryComplete(categoryId);
    router.push('/estate-dashboard' as any);
  }, [bequeathalActions, categoryId]);

  // Dev dashboard triple-tap
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Morphic blobs — green + navy, matching people summary */}
      <View style={styles.backgroundOverlay}>
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <TouchableOpacity style={styles.headerCenter} onPress={handleHeaderPress} activeOpacity={1}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons
              name={categoryIcon as any}
              size={18}
              color={KindlingColors.navy}
            />
          </View>
          <Text style={styles.headerTitle}>{categoryLabel}</Text>
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          {!hasAssets ? (
            // Empty state
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons
                  name={categoryIcon as any}
                  size={36}
                  color={KindlingColors.navy}
                />
              </View>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>
                Add your first entry to start building this section of your estate.
              </Text>
              <Button onPress={handleAddAsset} variant="secondary" icon="plus">
                Add {categoryLabel.toLowerCase()}
              </Button>
            </View>
          ) : (
            <>
              {/* Summary banner — warm cream hero */}
              <View style={styles.summaryBanner}>
                <View style={styles.summaryIconCircle}>
                  <MaterialCommunityIcons
                    name={categoryIcon as any}
                    size={24}
                    color={KindlingColors.navy}
                  />
                </View>
                <Text style={styles.summaryTotal}>
                  £{(totalValue ?? 0).toLocaleString()}
                </Text>
                {showNet && (
                  <Text style={styles.summaryNet}>
                    Net: £{(totalNet ?? 0).toLocaleString()}
                  </Text>
                )}
                <Text style={styles.summaryCount}>
                  Value of {assets.length} {assets.length === 1
                    ? categoryLabel.replace(/s$/, '')
                    : categoryLabel}
                </Text>
              </View>

              {/* Asset cards */}
              <View style={styles.assetList}>
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={handleEditAsset}
                    onDelete={handleDeleteAsset}
                  />
                ))}
              </View>

              {/* Add another — green, the primary action on this screen */}
              <Button onPress={handleAddAsset} variant="secondary" icon="plus">
                Add another
              </Button>

              {/* That's everything — secondary button, exit to estate dashboard */}
              <Button
                onPress={handleMarkComplete}
                variant="outline"
                icon="check"
                style={styles.completeButton}
              >
                {isComplete ? "All added" : "That's everything"}
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },

  // Morphic blobs — green top-right, navy bottom-left (people summary recipe)
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
    opacity: 0.12,
  },
  blob1: {
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    backgroundColor: KindlingColors.green,
    borderRadius: 150,
    transform: [{ rotate: '-20deg' }],
  },
  blob2: {
    bottom: -80,
    left: -100,
    width: 260,
    height: 260,
    backgroundColor: KindlingColors.navy,
    borderRadius: 130,
    transform: [{ rotate: '30deg' }],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: `${KindlingColors.background}ee`,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}15`,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 48,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },

  // Summary banner — off-white bg, brand-gold outline, compact
  summaryBanner: {
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderColor: KindlingColors.beige,
  },
  summaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${KindlingColors.beige}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryTotal: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    letterSpacing: -0.5,
  },
  summaryNet: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.green,
  },
  summaryCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
    color: KindlingColors.brown,
    marginTop: 2,
  },

  // Asset list
  assetList: {
    gap: Spacing.sm,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${KindlingColors.cream}`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    textAlign: 'center',
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },

  completeButton: {
    marginTop: Spacing.sm,
  },
});
