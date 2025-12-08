/**
 * Important Items Entry Screen
 * 
 * Form for adding and managing valuable items with beneficiary assignments.
 * Items can be assigned to specific people, groups, or the estate.
 * 
 * Navigation:
 * - Back: Returns to important items intro
 * - Continue: Proceeds to next category or order-of-things
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Input, CurrencyInput, Dialog } from '../../../src/components/ui';
import { MultiBeneficiarySelector, BeneficiarySelection, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../../src/utils/helpers';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import type { ImportantItemAsset } from '../../../src/types';

interface ImportantItemForm {
  title: string;
  beneficiaries: BeneficiarySelection[];
  estimatedValue: number;
}

export default function ImportantItemsEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, willActions } = useAppState();
  const scrollViewRef = useRef<ScrollView>(null);
  const [formData, setFormData] = useState<ImportantItemForm>({
    title: '',
    beneficiaries: [],
    estimatedValue: 0,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  // Get existing important items
  const importantItems = bequeathalActions.getAssetsByType('important-items') as ImportantItemAsset[];
  const totalValue = importantItems.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

  // Get will-maker ID to exclude from beneficiary selection
  const willMaker = willActions.getUser();
  const excludePersonIds = willMaker?.id ? [willMaker.id] : [];

  const handleBeneficiariesChange = (newBeneficiaries: BeneficiarySelection | BeneficiarySelection[]) => {
    const beneficiariesArray = Array.isArray(newBeneficiaries) ? newBeneficiaries : [newBeneficiaries];
    setFormData(prev => ({ ...prev, beneficiaries: beneficiariesArray }));
  };

  const handleAddItem = () => {
    if (!formData.title.trim() || formData.beneficiaries.length === 0 || formData.estimatedValue === 0) {
      return;
    }

    const estimatedValue = Math.round(formData.estimatedValue);

    const itemData = {
      title: formData.title.trim(),
      beneficiaryAssignments: {
        beneficiaries: formData.beneficiaries.map(b => ({
          id: b.id,
          type: b.type,
          name: b.name,
        }))
      },
      estimatedValue,
      netValue: estimatedValue,
    };

    if (editingItemId) {
      bequeathalActions.updateAsset(editingItemId, itemData);
      setEditingItemId(null);
    } else {
      bequeathalActions.addAsset('important-items', itemData);
    }

    // Reset form
    setFormData({
      title: '',
      beneficiaries: [],
      estimatedValue: 0,
    });

    // Scroll to bottom to show the new item (double RAF to ensure render complete)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    });
  };

  const handleEditItem = (itemId: string) => {
    const item = bequeathalActions.getAssetById(itemId) as ImportantItemAsset;
    if (!item) return;

    const beneficiaries: BeneficiarySelection[] = item.beneficiaryAssignments?.beneficiaries.map(b => {
      if (b.type === 'estate') {
        return { id: 'estate', type: 'estate', name: 'The Estate' };
      }
      if (b.type === 'person') {
        const person = personActions.getPersonById(b.id);
        return {
          id: b.id,
          type: 'person',
          name: person ? getPersonFullName(person) : b.name || 'Unknown',
          relationship: person ? getPersonRelationshipDisplay(person) : undefined,
        };
      }
      return { id: b.id, type: b.type, name: b.name || 'Unknown' };
    }) || [];

    setFormData({
      title: item.title,
      beneficiaries,
      estimatedValue: item.estimatedValue || 0,
    });
    setEditingItemId(itemId);
  };

  const handleCancelEdit = () => {
    setFormData({
      title: '',
      beneficiaries: [],
      estimatedValue: 0,
    });
    setEditingItemId(null);
  };

  const handleDeleteItem = (itemId: string) => {
    bequeathalActions.removeAsset(itemId);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('important-items', selectedCategories);
    router.push(nextRoute);
  };

  const canSubmit = formData.title.trim() && formData.beneficiaries.length > 0 && formData.estimatedValue > 0;

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
            <IconButton icon="diamond" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Important Items</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Add Item Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingItemId ? 'Edit Item' : 'Add New Item'}
            </Text>

            <Input
              label="What's the item?"
              placeholder="e.g., Wedding ring, Painting, Car"
              value={formData.title}
              onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
            />

            {/* Beneficiary Selector */}
            <MultiBeneficiarySelector
              mode="multi"
              value={formData.beneficiaries}
              onChange={handleBeneficiariesChange}
              allowEstate={true}
              allowGroups={true}
              excludePersonIds={excludePersonIds}
              label="Who will receive this? *"
              placeholder="Select recipient(s)"
              personActions={personActions}
              beneficiaryGroupActions={beneficiaryGroupActions}
              onAddNewPerson={() => setShowAddPersonDialog(true)}
              onAddNewGroup={() => setShowGroupDrawer(true)}
            />

            <CurrencyInput
              label="What's it worth?"
              placeholder="0"
              value={formData.estimatedValue}
              onValueChange={(value) => setFormData(prev => ({ ...prev, estimatedValue: value }))}
            />

            <View style={styles.formActions}>
              <Button
                onPress={handleAddItem}
                variant="primary"
                disabled={!canSubmit}
                style={styles.submitButton}
              >
                {editingItemId ? 'Update Item' : 'Add Item'}
              </Button>
              
              {editingItemId && (
                <Button
                  onPress={handleCancelEdit}
                  variant="outline"
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
              )}
            </View>
          </View>

          {/* Items List */}
          {importantItems.length > 0 ? (
            <View style={styles.itemsSection}>
              <Text style={styles.itemsTitle}>
                Added Items ({importantItems.length})
              </Text>
              
              <View style={styles.itemsList}>
                {importantItems.map((item) => {
                  const beneficiaries = item.beneficiaryAssignments?.beneficiaries || [];
                  
                  return (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        
                        <View style={styles.itemDetail}>
                          <Text style={styles.detailLabel}>For:</Text>
                          <View style={styles.beneficiariesList}>
                            {beneficiaries.map((b, idx) => {
                              let displayName = b.name || 'Unknown';
                              if (b.type === 'person') {
                                const person = personActions.getPersonById(b.id);
                                if (person) {
                                  displayName = `${getPersonFullName(person)} (${getPersonRelationshipDisplay(person)})`;
                                }
                              } else if (b.type === 'estate') {
                                displayName = 'The Estate';
                              }
                              
                              return (
                                <Text key={idx} style={styles.beneficiaryText}>
                                  {displayName}
                                </Text>
                              );
                            })}
                          </View>
                        </View>
                        
                        <View style={styles.itemDetail}>
                          <Text style={styles.detailLabel}>Value:</Text>
                          <Text style={styles.valueText}>
                            £{(item.estimatedValue || 0).toLocaleString('en-GB', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2
                            })}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.itemActions}>
                        <TouchableOpacity onPress={() => handleEditItem(item.id)} style={styles.actionButton}>
                          <IconButton icon="pencil" size={18} iconColor={KindlingColors.navy} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.actionButton}>
                          <IconButton icon="delete" size={18} iconColor={KindlingColors.destructive} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Total Value */}
              {totalValue > 0 && (
                <Text style={styles.totalText}>
                  Valuables Total: <Text style={styles.totalValue}>£{totalValue.toLocaleString('en-GB', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  })}</Text>
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <IconButton icon="diamond" size={32} iconColor={KindlingColors.navy} />
              </View>
              <Text style={styles.emptyTitle}>No items added yet</Text>
              <Text style={styles.emptyText}>Add your first important item using the form above</Text>
            </View>
          )}

          {/* Action Buttons - naturally at bottom of content */}
          {importantItems.length > 0 && (
            <TouchableOpacity
              onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
              style={styles.addAnotherButton}
              activeOpacity={0.7}
            >
              <Text style={styles.addAnotherText}>Add Another Item</Text>
            </TouchableOpacity>
          )}
          
          <Button onPress={handleContinue} variant="primary" style={styles.continueButton}>
            Continue
          </Button>
        </View>
      </ScrollView>

      {/* Add Person Dialog */}
      <Dialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        title="Add New Person"
      >
        <Text style={styles.dialogText}>
          Person creation dialog to be implemented.
          For now, please add people from the Onboarding or Family screens.
        </Text>
        <Button onPress={() => setShowAddPersonDialog(false)} variant="primary">
          OK
        </Button>
      </Dialog>

      {/* Group Management Drawer */}
      <GroupManagementDrawer
        visible={showGroupDrawer}
        onClose={() => setShowGroupDrawer(false)}
        onSelectGroup={(groupId) => {
          // Add the selected group to beneficiaries
          const group = beneficiaryGroupActions.getGroupById(groupId);
          if (group) {
            const groupSelection: BeneficiarySelection = {
              id: group.id,
              type: 'group',
              name: group.name,
            };
            setFormData(prev => ({
              ...prev,
              beneficiaries: [...prev.beneficiaries, groupSelection]
            }));
          }
          setShowGroupDrawer(false);
        }}
        beneficiaryGroupActions={beneficiaryGroupActions}
        willId={willActions.getUser()?.id || 'default-user'}
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
    opacity: 0.2,
  },
  blob1: {
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    backgroundColor: KindlingColors.navy,
    borderRadius: 160,
    transform: [{ rotate: '-15deg' }],
  },
  blob2: {
    top: '33%',
    left: -64,
    width: 256,
    height: 192,
    backgroundColor: KindlingColors.brown,
    borderRadius: 128,
    transform: [{ rotate: '25deg' }],
  },
  blob3: {
    bottom: -64,
    left: '25%',
    width: 192,
    height: 160,
    backgroundColor: KindlingColors.beige,
    borderRadius: 96,
    transform: [{ rotate: '45deg' }],
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
  formCard: {
    backgroundColor: `${KindlingColors.cream}33`,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  itemsSection: {
    gap: Spacing.md,
  },
  itemsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  itemsList: {
    gap: Spacing.sm,
  },
  itemCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  itemDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
  beneficiariesList: {
    flex: 1,
    gap: 2,
  },
  beneficiaryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  valueText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  actionButton: {
    padding: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${KindlingColors.navy}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
  totalText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    marginTop: 0,
    textAlign: 'center',
  },
  totalValue: {
    fontWeight: Typography.fontWeight.semibold,
  },
  addAnotherButton: {
    backgroundColor: KindlingColors.background,
    borderWidth: 2,
    borderColor: KindlingColors.green,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  addAnotherText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
  continueButton: {
    marginTop: Spacing.sm,
  },
  dialogText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginBottom: Spacing.md,
  },
});

