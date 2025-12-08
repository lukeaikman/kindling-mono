/**
 * Bequeathal Categories Selection Screen
 * 
 * Allows users to select which asset categories they want to track.
 * Categories are split into two sections:
 * - Usually part of your estate (10 items)
 * - Paid on death (2 items)
 * 
 * @module screens/bequeathal/categories
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton } from '../../src/components/ui';
import { useAppState } from '../../src/hooks/useAppState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { getFirstCategoryRoute } from '../../src/utils/categoryNavigation';

// Category definitions
interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const ESTATE_CATEGORIES: CategoryItem[] = [
  {
    id: 'property',
    label: 'Property',
    icon: 'home',
    description: 'Houses, flats, land, and other real estate'
  },
  {
    id: 'bank-accounts',
    label: 'Bank Accounts',
    icon: 'piggy-bank',
    description: 'Current accounts, savings, ISAs'
  },
  {
    id: 'investment',
    label: 'Investments',
    icon: 'trending-up',
    description: 'Stocks, shares, bonds, funds'
  },
  {
    id: 'private-company-shares',
    label: 'Private Company Shares',
    icon: 'office-building',
    description: 'Shares in private companies'
  },
  {
    id: 'assets-held-through-business',
    label: 'Assets Held Through Business',
    icon: 'domain',
    description: 'Assets owned by your business'
  },
  {
    id: 'agricultural-assets',
    label: 'Agricultural Assets',
    icon: 'nature',
    description: 'Farmland, livestock, equipment'
  },
  {
    id: 'crypto-currency',
    label: 'Cryptocurrency',
    icon: 'bitcoin',
    description: 'Bitcoin, Ethereum, and other crypto'
  },
  {
    id: 'important-items',
    label: 'Important Items',
    icon: 'diamond',
    description: 'Jewelry, art, collectibles, heirlooms'
  },
];

const PAID_ON_DEATH_CATEGORIES: CategoryItem[] = [
  {
    id: 'pensions',
    label: 'Pensions',
    icon: 'shield',
    description: 'Workplace and private pensions'
  },
  {
    id: 'life-insurance',
    label: 'Life Insurance',
    icon: 'shield-account',
    description: 'Life insurance policies and payouts'
  },
];

export default function BequeathalCategoriesScreen() {
  const { bequeathalActions } = useAppState();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Load saved selections on mount
  useEffect(() => {
    const saved = bequeathalActions.getSelectedCategories();
    setSelectedCategories(saved);
  }, []);

  const handleToggleCategory = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newSelected);
  };

  const handleBack = () => {
    // Save selections before going back
    bequeathalActions.setSelectedCategories(selectedCategories);
    router.back();
  };

  const handleContinue = () => {
    // Save selections before continuing
    bequeathalActions.setSelectedCategories(selectedCategories);
    
    // Navigate to first selected category intro screen
    const nextRoute = getFirstCategoryRoute(selectedCategories);
    router.push(nextRoute);
  };

  const renderCategoryCard = (category: CategoryItem) => {
    const isSelected = selectedCategories.includes(category.id);

    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
        onPress={() => handleToggleCategory(category.id)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIconContainer}>
            <View style={styles.categoryIconCircle}>
              <IconButton
                icon={category.icon}
                size={24}
                iconColor={KindlingColors.navy}
              />
            </View>
            <View style={styles.categoryTitleContainer}>
              <Text style={styles.categoryTitle}>{category.label}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </View>
          </View>
          <View style={[styles.checkboxCircle, isSelected && styles.checkboxCircleSelected]}>
            {isSelected && (
              <IconButton
                icon="check"
                size={20}
                iconColor={KindlingColors.background}
                style={styles.checkIcon}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Morphic Background */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
        <View style={[styles.morphicBlob, styles.blob3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton
              icon="format-list-checks"
              size={20}
              iconColor={KindlingColors.navy}
            />
          </View>
          <Text style={styles.headerTitle}>Select Categories</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>What do you want to track?</Text>
            <Text style={styles.introText}>
              Select the types of assets you'd like to record. You can always add more later.
            </Text>
          </View>

          {/* Estate Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>What makes up your estate?</Text>
              <Text style={styles.sectionDescription}>
                Select the asset classes that make up your estate. Kindling will estimate your inheritance tax bill, visualise who gets what and importantly   <Text style={{ fontWeight: '700' }}>show you how people just like you reduce their tax.</Text>
              </Text>
            </View>
            <View style={styles.categoryList}>
              {ESTATE_CATEGORIES.map(renderCategoryCard)}
            </View>
          </View>

          {/* Paid on Death Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Paid on death</Text>
              <Text style={styles.sectionDescription}>
                These are typically paid directly to named beneficiaries, outside of your estate
              </Text>
            </View>
            <View style={styles.categoryList}>
              {PAID_ON_DEATH_CATEGORIES.map(renderCategoryCard)}
            </View>
          </View>

          {/* Selection Count */}
          {selectedCategories.length > 0 && (
            <View style={styles.countBadge}>
              <IconButton icon="check-circle" size={20} iconColor={KindlingColors.green} />
              <Text style={styles.countText}>
                {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <Button 
          onPress={handleContinue} 
          variant="primary"
          disabled={selectedCategories.length === 0}
        >
          {selectedCategories.length === 0 ? 'Select at least one category' : 'Continue'}
        </Button>
      </View>
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
    opacity: 0.15,
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
    top: '40%',
    left: -80,
    width: 280,
    height: 220,
    backgroundColor: KindlingColors.brown,
    borderRadius: 140,
    transform: [{ rotate: '30deg' }],
  },
  blob3: {
    bottom: -80,
    right: -60,
    width: 240,
    height: 180,
    backgroundColor: KindlingColors.beige,
    borderRadius: 120,
    transform: [{ rotate: '50deg' }],
  },
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
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${KindlingColors.navy}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 48,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  introSection: {
    marginBottom: Spacing.xl,
  },
  introTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  introText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
  categoryList: {
    gap: Spacing.sm,
  },
  categoryCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: KindlingColors.cream,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryCardSelected: {
    borderColor: KindlingColors.beige,
    backgroundColor: `${KindlingColors.cream}80`,
    shadowColor: KindlingColors.beige,
    shadowOpacity: 0.2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryIconContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 18,
  },
  checkboxCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: `${KindlingColors.beige}4D`,
    backgroundColor: KindlingColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  checkboxCircleSelected: {
    backgroundColor: KindlingColors.green,
    borderColor: KindlingColors.green,
  },
  checkIcon: {
    margin: 0,
    padding: 0,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${KindlingColors.green}15`,
    borderRadius: 24,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  countText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
    marginLeft: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 10,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}1a`,
  },
});

