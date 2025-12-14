/**
 * Property Summary Screen
 * 
 * List view of all added properties with summary cards.
 * Shows total property value and allows adding more properties.
 * 
 * @module screens/bequeathal/property/summary
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Card as PaperCard } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import type { PropertyAsset } from '../../../src/types';

export default function PropertySummaryScreen() {
  const { bequeathalActions } = useAppState();

  // Get properties from state
  const properties = bequeathalActions.getAssetsByType('property') as PropertyAsset[];

  // Calculate total property value and net value
  const totalValue = properties.reduce((sum, property) => {
    return sum + (property.estimatedValue || 0);
  }, 0);
  
  const totalMortgages = properties.reduce((sum, property) => {
    return sum + (property.mortgage?.outstandingAmount || 0);
  }, 0);
  
  const totalNetValue = totalValue - totalMortgages;

  const handleAddAnother = () => {
    router.push('/bequeathal/property/entry');
  };

  const handleEdit = (propertyId: string) => {
    // TODO: Navigate to edit mode with property ID
    router.push(`/bequeathal/property/entry?id=${propertyId}`);
  };

  const handleDelete = (propertyId: string) => {
    bequeathalActions.removeAsset(propertyId);
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('property', selectedCategories);
    router.push(nextRoute);
  };

  // Helper to get property type display name
  const getPropertyTypeDisplay = (property: PropertyAsset): string => {
    const typeMap: Record<string, string> = {
      'primary_residence': 'Primary Residence',
      'second_home': 'Second Home',
      'holiday_home': 'Holiday Home',
      'buy_to_let': 'Buy To Let',
      'furnished_holiday_let': 'Furnished Holiday Let',
      'furnished_holiday_let_commercial': 'Furnished Holiday Let (Commercial)',
      'short_term_let': 'Short-term Let/Airbnb',
      'mixed_use_property': 'Mixed-Use Property',
      'agricultural_property': 'Agricultural Property',
    };
    return typeMap[property.propertyType] || property.propertyType;
  };

  // Helper to get ownership type display name
  const getOwnershipDisplay = (property: PropertyAsset): string => {
    const ownershipMap: Record<string, string> = {
      'personally_owned': 'Personally owned',
      'jointly_owned': 'Jointly owned',
      'company_owned': 'Owned through company',
      'trust_owned': 'Owned through trust',
    };
    return ownershipMap[property.ownershipType] || property.ownershipType;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="home" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Property Summary</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          {properties.length === 0 ? (
            // Empty state
            <View style={styles.emptyState}>
              <IconButton 
                icon="home-outline" 
                size={64} 
                iconColor={KindlingColors.beige}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Properties Added Yet</Text>
              <Text style={styles.emptyText}>
                Add your first property to begin building your property portfolio
              </Text>
              <Button
                onPress={handleAddAnother}
                variant="primary"
                icon="plus"
                style={styles.emptyButton}
              >
                Add Property
              </Button>
            </View>
          ) : (
            // Property list
            <>
              

              {/* Property Cards */}
              {properties.map((property) => {
                const netValue = (property.estimatedValue || 0) - (property.mortgage?.outstandingAmount || 0);
                
                return (
                  <PaperCard key={property.id} style={styles.propertyCard}>
                    <PaperCard.Content>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <IconButton icon="home" size={20} iconColor={KindlingColors.navy} />
                          <Text style={styles.propertyAddress}>
                            {property.address.address1}
                          </Text>
                        </View>
                        <View style={styles.cardActions}>
                          <IconButton
                            icon="pencil"
                            size={20}
                            iconColor={KindlingColors.navy}
                            onPress={() => handleEdit(property.id)}
                          />
                          <IconButton
                            icon="delete"
                            size={20}
                            iconColor={KindlingColors.brown}
                            onPress={() => handleDelete(property.id)}
                          />
                        </View>
                      </View>

                      <View style={styles.cardDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Value:</Text>
                          <Text style={styles.detailValue}>£{(property.estimatedValue || 0).toLocaleString()}</Text>
                        </View>
                        {property.hasMortgage && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Net Value:</Text>
                            <Text style={[styles.detailValue, styles.netValue]}>
                              £{netValue.toLocaleString()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </PaperCard.Content>
                  </PaperCard>
                );
              })}

              {/* Total Summary */}
              <View style={styles.totalSection}>
                <Text style={styles.totalText}>
                  Total Property Value: <Text style={styles.totalValueText}>£{totalValue.toLocaleString()}</Text>
                </Text>
                {totalMortgages > 0 && (
                  <Text style={styles.totalNetText}>
                    Total Net Value: <Text style={[styles.totalValueText, styles.netValue]}>£{totalNetValue.toLocaleString()}</Text>
                  </Text>
                )}
              </View>

              {/* Add Another Button */}
              <Button
                onPress={handleAddAnother}
                variant="secondary"
                icon="plus"
                style={styles.addButton}
              >
                Add Another Property
              </Button>
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer - only show if properties exist */}
      {properties.length > 0 && (
        <View style={styles.footer}>
          <Button onPress={handleContinue} variant="primary">
            Continue
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
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
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
  summaryText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  totalSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.cream}66`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  totalText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  totalNetText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  totalValueText: {
    fontWeight: Typography.fontWeight.semibold,
  },
  propertyCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  propertyAddress: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
  },
  cardDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
  },
  detailValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  netValue: {
    color: KindlingColors.green,
  },
  beneficiariesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
  },
  beneficiariesLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.brown,
    marginBottom: Spacing.xs,
  },
  beneficiaryText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
  addButton: {
    marginTop: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}1a`,
  },
});

