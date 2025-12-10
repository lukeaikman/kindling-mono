/**
 * BeneficiaryWithPercentages Component
 * 
 * Beneficiary selection with manual percentage or amount allocations.
 * Simplified approach: Manual entry + helper buttons (no auto-lock/redistribution).
 * 
 * Features:
 * - Person/group/estate selection (reuses logic)
 * - Manual percentage or amount input per beneficiary
 * - "Equally distribute the rest" helper (user-triggered)
 * - "Clear All" reset button
 * - Total validation (must equal 100% for percentage mode)
 * 
 * @module components/forms/BeneficiaryWithPercentages
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { Button, Select } from '../ui';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import { getBeneficiaryDisplayName, getTotalAllocated } from '../../utils/beneficiaryHelpers';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../utils/helpers';
import type { BeneficiaryAssignment, PersonActions, BeneficiaryGroupActions } from '../../types';

/**
 * BeneficiaryWithPercentages Props
 */
export interface BeneficiaryWithPercentagesProps {
  /**
   * Allocation mode: percentage (must total 100%) or amount (can be partial)
   */
  allocationMode: 'percentage' | 'amount';
  
  /**
   * Total policy/asset value (for amount mode context)
   */
  totalValue?: number;
  
  /**
   * Current beneficiaries with allocations
   */
  value: BeneficiaryAssignment[];
  
  /**
   * Change handler
   */
  onChange: (value: BeneficiaryAssignment[]) => void;
  
  /**
   * Person actions for lookups
   */
  personActions: PersonActions;
  
  /**
   * Group actions for lookups
   */
  beneficiaryGroupActions: BeneficiaryGroupActions;
  
  /**
   * Person IDs to exclude
   */
  excludePersonIds?: string[];
  
  /**
   * Label for the field
   */
  label?: string;
  
  /**
   * Callback for adding new person
   */
  onAddNewPerson?: () => void;
  
  /**
   * Callback for adding new group
   */
  onAddNewGroup?: () => void;
}

/**
 * BeneficiaryWithPercentages Component
 * 
 * @example
 * ```tsx
 * <BeneficiaryWithPercentages
 *   allocationMode="percentage"
 *   value={beneficiaries}
 *   onChange={setBeneficiaries}
 *   personActions={personActions}
 *   beneficiaryGroupActions={beneficiaryGroupActions}
 *   label="Policy Beneficiaries"
 * />
 * ```
 */
export const BeneficiaryWithPercentages: React.FC<BeneficiaryWithPercentagesProps> = ({
  allocationMode,
  totalValue,
  value,
  onChange,
  personActions,
  beneficiaryGroupActions,
  excludePersonIds = [],
  label = 'Beneficiaries',
  onAddNewPerson,
  onAddNewGroup,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [showSelectionDrawer, setShowSelectionDrawer] = useState(false);
  const [tempSelections, setTempSelections] = useState<{id: string, type: 'person' | 'group' | 'estate'}[]>([]);

  // Get available people/groups/estate (excluding already selected)
  const allPeople = personActions.getPeople();
  const selectedPersonIds = value.filter(b => b.type === 'person').map(b => b.id);
  const availablePeople = allPeople.filter(person => 
    !excludePersonIds.includes(person.id) && 
    !selectedPersonIds.includes(person.id)
  );

  const allGroups = beneficiaryGroupActions.getActiveGroups();
  const selectedGroupIds = value.filter(b => b.type === 'group').map(b => b.id);
  const availableGroups = allGroups.filter(group => !selectedGroupIds.includes(group.id));

  const estateSelected = value.some(b => b.type === 'estate');

  // Open drawer for multi-select
  const handleOpenDrawer = () => {
    setTempSelections([]);
    setShowSelectionDrawer(true);
  };

  // Toggle selection in drawer
  const toggleSelection = (id: string, type: 'person' | 'group' | 'estate') => {
    const exists = tempSelections.some(s => s.id === id && s.type === type);
    if (exists) {
      setTempSelections(tempSelections.filter(s => !(s.id === id && s.type === type)));
    } else {
      setTempSelections([...tempSelections, { id, type }]);
    }
  };

  // Confirm selections from drawer
  const handleConfirmSelections = () => {
    const newBeneficiaries: BeneficiaryAssignment[] = tempSelections.map(s => ({
      id: s.id,
      type: s.type,
    }));
    
    onChange([...value, ...newBeneficiaries]);
    setShowSelectionDrawer(false);
    setTempSelections([]);
  };

  const isSelected = (id: string, type: string) => {
    return tempSelections.some(s => s.id === id && s.type === type);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleUpdateAllocation = (index: number, allocationValue: number) => {
    const updated = [...value];
    if (allocationMode === 'percentage') {
      updated[index] = { ...updated[index], percentage: allocationValue };
    } else {
      updated[index] = { ...updated[index], amount: allocationValue };
    }
    onChange(updated);
  };

  const handleEquallyDistributeRest = (currentIndex: number) => {
    // Calculate total allocated
    const filledTotal = value.reduce((sum, b) => 
      sum + ((allocationMode === 'percentage' ? b.percentage : b.amount) || 0), 0
    );
    
    const remaining = (allocationMode === 'percentage' ? 100 : (totalValue || 0)) - filledTotal;
    
    // Find empty beneficiaries (excluding current)
    const emptyIndices = value
      .map((b, idx) => ({ b, idx }))
      .filter(({b, idx}) => {
        const currentValue = allocationMode === 'percentage' ? b.percentage : b.amount;
        return idx !== currentIndex && (!currentValue || currentValue === 0);
      })
      .map(({idx}) => idx);
    
    if (emptyIndices.length === 0 || remaining <= 0) return;
    
    const equalShare = parseFloat((remaining / emptyIndices.length).toFixed(1));
    
    const updated = [...value];
    emptyIndices.forEach(idx => {
      if (allocationMode === 'percentage') {
        updated[idx] = { ...updated[idx], percentage: equalShare };
      } else {
        updated[idx] = { ...updated[idx], amount: Math.round(equalShare) };
      }
    });
    
    onChange(updated);
  };

  const handleClearAll = () => {
    const cleared = value.map(b => {
      const { percentage, amount, ...rest } = b;
      return rest;
    });
    onChange(cleared);
  };

  // Calculate total and validation
  const total = getTotalAllocated({ beneficiaries: value });
  const isValid = allocationMode === 'percentage' 
    ? Math.abs(total - 100) < 0.01 
    : true; // Amount mode can be partial

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Add Beneficiaries Button */}
      <TouchableOpacity
        style={styles.addBeneficiariesButton}
        onPress={handleOpenDrawer}
        activeOpacity={0.7}
      >
        <IconButton icon="account-multiple-plus" size={20} iconColor={KindlingColors.navy} style={styles.addIcon} />
        <Text style={styles.addBeneficiariesText}>Add Beneficiaries</Text>
      </TouchableOpacity>

      {/* Beneficiary Selection Drawer */}
      <Modal
        visible={showSelectionDrawer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSelectionDrawer(false)}
      >
        <SafeAreaView style={styles.drawerContainer} edges={['top', 'bottom']}>
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Select Beneficiaries</Text>
            <TouchableOpacity onPress={() => setShowSelectionDrawer(false)}>
              <IconButton icon="close" size={24} iconColor={KindlingColors.navy} />
            </TouchableOpacity>
          </View>

          {/* Beneficiary List */}
          <FlatList
            data={[
              ...(!estateSelected ? [{ id: 'estate', type: 'estate' as const, label: '🏛️ The Estate', isSpecial: true }] : []),
              ...availablePeople.map(p => ({ 
                id: p.id, 
                type: 'person' as const, 
                label: `${getPersonFullName(p)} (${getPersonRelationshipDisplay(p)})`,
                isSpecial: false
              })),
              ...availableGroups.map(g => ({ 
                id: g.id, 
                type: 'group' as const, 
                label: `👥 ${g.name}`,
                isSpecial: false
              })),
            ]}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => {
              const selected = isSelected(item.id, item.type);
              
              return (
                <TouchableOpacity
                  style={styles.drawerOption}
                  onPress={() => toggleSelection(item.id, item.type)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.drawerOptionText}>{item.label}</Text>
                  <View style={[styles.checkboxCircle, selected && styles.checkboxCircleSelected]}>
                    {selected && (
                      <IconButton
                        icon="check"
                        size={16}
                        iconColor={KindlingColors.background}
                        style={styles.checkIcon}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              <>
                {/* Add New Options */}
                {onAddNewPerson && (
                  <TouchableOpacity
                    style={styles.drawerOptionSpecial}
                    onPress={() => {
                      setShowSelectionDrawer(false);
                      onAddNewPerson();
                    }}
                  >
                    <Text style={styles.drawerOptionSpecialText}>+ Add New Person</Text>
                  </TouchableOpacity>
                )}
                {onAddNewGroup && (
                  <TouchableOpacity
                    style={styles.drawerOptionSpecial}
                    onPress={() => {
                      setShowSelectionDrawer(false);
                      onAddNewGroup();
                    }}
                  >
                    <Text style={styles.drawerOptionSpecialText}>+ Create / Manage Groups</Text>
                  </TouchableOpacity>
                )}
              </>
            }
          />

          {/* Confirm Button */}
          <View style={styles.drawerFooter}>
            <Text style={styles.selectedCount}>
              {tempSelections.length} beneficiar{tempSelections.length === 1 ? 'y' : 'ies'} selected
            </Text>
            <Button
              onPress={handleConfirmSelections}
              variant="primary"
              disabled={tempSelections.length === 0}
            >
              Select
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Selected Beneficiaries with Allocations */}
      {value.length > 0 && (
        <View style={styles.beneficiariesList}>
          {value.map((beneficiary, index) => {
            const displayName = getBeneficiaryDisplayName(
              beneficiary, 
              personActions, 
              beneficiaryGroupActions
            );
            const currentValue = allocationMode === 'percentage' 
              ? beneficiary.percentage 
              : beneficiary.amount;
            const isFocused = focusedIndex === index;

            return (
              <View key={`${beneficiary.id}-${index}`} style={styles.beneficiaryCard}>
                <View style={styles.beneficiaryHeader}>
                  <View style={styles.beneficiaryNameRow}>
                    {beneficiary.type === 'group' && (
                      <IconButton icon="account-multiple" size={16} iconColor={KindlingColors.navy} style={styles.beneficiaryIcon} />
                    )}
                    {beneficiary.type === 'estate' && (
                      <IconButton icon="bank" size={16} iconColor={KindlingColors.navy} style={styles.beneficiaryIcon} />
                    )}
                    <Text style={styles.beneficiaryName}>{displayName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(index)}>
                    <IconButton icon="close" size={18} iconColor={KindlingColors.brown} style={styles.removeIcon} />
                  </TouchableOpacity>
                </View>

                {/* Allocation Input */}
                <View style={styles.allocationRow}>
                  <Text style={styles.allocationLabel}>
                    {allocationMode === 'percentage' ? 'Percentage:' : 'Amount:'}
                  </Text>
                  <View style={styles.allocationInputContainer}>
                    {allocationMode === 'amount' && (
                      <Text style={styles.currencySymbol}>£</Text>
                    )}
                    <TextInput
                      style={styles.allocationInput}
                      value={currentValue?.toString() || ''}
                      onChangeText={(text) => {
                        const num = parseFloat(text.replace(/[^\d.]/g, '')) || 0;
                        const maxValue = allocationMode === 'percentage' ? 100 : 999999999;
                        handleUpdateAllocation(index, Math.min(maxValue, num));
                      }}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={`${KindlingColors.brown}80`}
                    />
                    {allocationMode === 'percentage' && (
                      <Text style={styles.percentSymbol}>%</Text>
                    )}
                  </View>
                </View>

                {/* Equally Distribute Helper (shows when focused and there are empty beneficiaries) */}
                {isFocused && value.some((b, idx) => {
                  const val = allocationMode === 'percentage' ? b.percentage : b.amount;
                  return idx !== index && (!val || val === 0);
                }) && (
                  <TouchableOpacity
                    onPress={() => handleEquallyDistributeRest(index)}
                    style={styles.helperButton}
                  >
                    <Text style={styles.helperButtonText}>↳ Equally distribute the rest</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Total Display */}
      {value.length > 0 && (
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={[
              styles.totalValue,
              isValid ? styles.totalValid : styles.totalInvalid
            ]}>
              {allocationMode === 'percentage' ? `${total.toFixed(1)}%` : `£${Math.round(total).toLocaleString()}`}
              {isValid && allocationMode === 'percentage' && ' ✓'}
            </Text>
          </View>
          
          {allocationMode === 'percentage' && (
            <Text style={styles.remainingText}>
              {isValid 
                ? 'Fully allocated'
                : `${(100 - total).toFixed(1)}% remaining`}
            </Text>
          )}
          
          {!isValid && allocationMode === 'percentage' && (
            <Text style={styles.errorText}>
              Percentages must total 100%
            </Text>
          )}

          {/* Clear All Button */}
          {value.some(b => b.percentage || b.amount) && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.clearAllButton}
            >
              <Text style={styles.clearAllText}>Clear All {allocationMode === 'percentage' ? 'Percentages' : 'Amounts'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  beneficiariesList: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  beneficiaryCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
    gap: Spacing.sm,
  },
  beneficiaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  beneficiaryNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  beneficiaryIcon: {
    margin: 0,
    padding: 0,
    marginRight: -4,
  },
  beneficiaryName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  removeIcon: {
    margin: 0,
    padding: 0,
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  allocationLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    minWidth: 90,
  },
  allocationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.inputBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flex: 1,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    marginRight: Spacing.xs,
  },
  allocationInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    padding: 0,
    minHeight: 24,
  },
  percentSymbol: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    marginLeft: Spacing.xs,
  },
  helperButton: {
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
  },
  helperButtonText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    textDecorationLine: 'underline',
  },
  totalSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.cream}40`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
    gap: Spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    fontWeight: Typography.fontWeight.medium,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  totalValid: {
    color: KindlingColors.green,
  },
  totalInvalid: {
    color: KindlingColors.destructive,
  },
  remainingText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.destructive,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  clearAllButton: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    textDecorationLine: 'underline',
  },
  addBeneficiariesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KindlingColors.background,
    borderWidth: 2,
    borderColor: KindlingColors.beige,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  addIcon: {
    margin: 0,
    padding: 0,
    marginRight: -4,
  },
  addBeneficiariesText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  drawerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  drawerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}40`,
  },
  drawerOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
  },
  drawerOptionSpecial: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}40`,
  },
  drawerOptionSpecialText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    fontWeight: Typography.fontWeight.medium,
  },
  checkboxCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: `${KindlingColors.beige}4D`,
    backgroundColor: KindlingColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: KindlingColors.green,
    borderColor: KindlingColors.green,
  },
  checkIcon: {
    margin: 0,
    padding: 0,
  },
  drawerFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
    gap: Spacing.sm,
  },
  selectedCount: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
});

