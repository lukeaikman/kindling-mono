/**
 * Trust Test Summary Screen
 * 
 * Development tool for testing Trust entity CRUD operations
 * Lists standalone trusts (not linked to properties) for testing
 * 
 * @module screens/developer/trust-test-summary
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Card as PaperCard } from 'react-native-paper';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { useAppState } from '../../src/hooks/useAppState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

export default function TrustTestSummaryScreen() {
  const { trustActions } = useAppState();
  
  // Get all trusts (filter for standalone ones - no assets linked)
  const allTrusts = trustActions.getTrusts();
  const standaloneTrusts = allTrusts.filter(t => !t.assetIds || t.assetIds.length === 0);
  
  const handleEdit = (trustId: string) => {
    router.push(`/bequeathal/property/trust-details?trustId=${trustId}`);
  };
  
  const handleDelete = (trustId: string) => {
    trustActions.deleteTrust(trustId);
    // Force re-render by navigating away and back
    router.replace('/developer/trust-test-summary');
  };
  
  const handleAddNew = () => {
    router.push('/bequeathal/property/trust-details');
  };
  
  const getTrustTypeLabel = (type: string) => {
    if (type === 'bare_trust') return 'Bare Trust';
    if (type === 'life_interest_trust') return 'Life Interest Trust';
    if (type === 'discretionary_trust') return 'Discretionary Trust';
    return type;
  };
  
  const getCreationDateDisplay = (trust: any) => {
    if (trust.creationMonth && trust.creationYear) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthLabel = months[parseInt(trust.creationMonth) - 1] || trust.creationMonth;
      return `${monthLabel} ${trust.creationYear}`;
    }
    if (trust.createdOver7YearsAgo === 'yes') return 'Over 7 years ago';
    if (trust.createdOver7YearsAgo === 'no') return 'Within 7 years';
    if (trust.createdOver7YearsAgo === 'not_sure') return 'Unknown (< or > 7 years)';
    return 'Unknown';
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Test Trusts</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.content}>
          <Text style={styles.description}>
            Standalone trusts created in sandbox for testing. These are NOT linked to properties.
          </Text>
          
          {standaloneTrusts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Test Trusts</Text>
              <Text style={styles.emptyText}>
                Create a trust to test the full CRUD cycle
              </Text>
              <Button
                onPress={handleAddNew}
                variant="primary"
                style={styles.emptyButton}
              >
                Create Test Trust
              </Button>
            </View>
          ) : (
            <>
              <Text style={styles.summaryText}>
                {standaloneTrusts.length} Test {standaloneTrusts.length === 1 ? 'Trust' : 'Trusts'}
              </Text>

              {/* Trust Cards */}
              {standaloneTrusts.map((trust) => (
                <PaperCard key={trust.id} style={styles.trustCard}>
                  <PaperCard.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <IconButton icon="shield-account" size={20} iconColor={KindlingColors.navy} />
                        <Text style={styles.trustName}>{trust.name}</Text>
                      </View>
                      <View style={styles.cardActions}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          iconColor={KindlingColors.navy}
                          onPress={() => handleEdit(trust.id)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={KindlingColors.destructive}
                          onPress={() => handleDelete(trust.id)}
                        />
                      </View>
                    </View>

                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Type:</Text>
                        <Text style={styles.detailValue}>{getTrustTypeLabel(trust.type)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Created:</Text>
                        <Text style={styles.detailValue}>{getCreationDateDisplay(trust)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Your Role:</Text>
                        <Text style={styles.detailValue}>
                          {trust.isUserSettlor && trust.isUserBeneficiary ? 'Settlor & Beneficiary' :
                           trust.isUserSettlor ? 'Settlor' : 'Beneficiary'}
                        </Text>
                      </View>
                    </View>
                  </PaperCard.Content>
                </PaperCard>
              ))}

              {/* Add Another Button */}
              <Button
                onPress={handleAddNew}
                variant="secondary"
                icon="plus"
                style={styles.addButton}
              >
                Add Another Test Trust
              </Button>
            </>
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 48,
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
    gap: Spacing.lg,
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 22,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: `${KindlingColors.cream}40`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyButton: {
    minWidth: 200,
  },
  summaryText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  trustCard: {
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
  trustName: {
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
  addButton: {
    marginTop: Spacing.md,
  },
});

