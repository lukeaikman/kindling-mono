/**
 * BeneficiaryWithPercentages Component
 * 
 * Beneficiary selection with manual percentage or amount allocations.
 * Supports two modes: manual input or slider-based (with magic wand).
 * 
 * Features:
 * - Person/group/estate selection (reuses logic)
 * - Manual percentage or amount input per beneficiary
 * - Optional slider mode with magic wand (useSliders prop)
 * - "Equally distribute the rest" helper (manual mode)
 * - "Make Equal to 100%" button (slider mode)
 * - "Clear All" reset button
 * - Total validation (must equal 100% for percentage mode)
 * 
 * @module components/forms/BeneficiaryWithPercentages
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '../ui';
import { BeneficiarySplitCard } from './BeneficiarySplitCard';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../../styles/constants';
import { getBeneficiaryDisplayName, getTotalAllocated, evaluateWizard } from '../../utils/beneficiaryHelpers';
import type { WizardResult } from '../../utils/beneficiaryHelpers';
import { Dialog } from '../ui/Dialog';
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
   * Receives optional callback to select the newly created person
   */
  onAddNewPerson?: (onCreated?: (personId: string) => void) => void;
  
  /**
   * Callback for adding new group
   */
  onAddNewGroup?: () => void;
  
  /**
   * Use sliders for allocation (shows slider + magic wand instead of manual input only)
   * Recommended when: 3+ beneficiaries, percentage mode, visual feedback desired
   */
  useSliders?: boolean;
  
  /**
   * Require complete allocation (100% for percentage, totalValue for amount)
   * Default: true for percentage mode, false for amount mode
   */
  requireComplete?: boolean;

  /**
   * Whether to show error state for the add-beneficiaries control
   */
  error?: boolean;
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
  useSliders = false,
  requireComplete,
  error = false,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  
  // Determine if we should use slider mode
  const showSliderMode = useSliders && allocationMode === 'percentage';
  
  // Default requireComplete based on mode
  const shouldRequireComplete = requireComplete !== undefined 
    ? requireComplete 
    : (allocationMode === 'percentage');
  const [showSelectionDrawer, setShowSelectionDrawer] = useState(false);
  const [tempSelections, setTempSelections] = useState<{id: string, type: 'person' | 'group' | 'estate'}[]>([]);
  const [wizardDialog, setWizardDialog] = useState<WizardResult | null>(null);

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
    
    const updatedList = [...value, ...newBeneficiaries];
    
    if (allocationMode === 'percentage') {
      const hasManualEdits = value.some(b => b.isManuallyEdited);
      const existingAllEmpty = value.every(b => !b.percentage || b.percentage === 0);
      const existingSingleAt100 = value.length === 1 && value[0].percentage === 100 && !value[0].isManuallyEdited;
      const canAutoSplit = !hasManualEdits && (existingAllEmpty || existingSingleAt100 || value.length === 0);

      // Smart default: If only 1 beneficiary total in percentage mode, auto-set to 100%
      if (updatedList.length === 1) {
        updatedList[0] = { ...updatedList[0], percentage: 100, isManuallyEdited: false };
      } else if (newBeneficiaries.length > 0 && canAutoSplit) {
        const equalShare = parseFloat((100 / updatedList.length).toFixed(1));
        updatedList.forEach((b, idx) => {
          updatedList[idx] = { ...b, percentage: equalShare, isManuallyEdited: false };
        });
      }
    }
    
    onChange(updatedList);
    setShowSelectionDrawer(false);
    setTempSelections([]);
  };

  const isSelected = (id: string, type: string) => {
    return tempSelections.some(s => s.id === id && s.type === type);
  };

  const addTempSelection = (id: string, type: 'person' | 'group' | 'estate') => {
    setTempSelections(prev => {
      const exists = prev.some(s => s.id === id && s.type === type);
      return exists ? prev : [...prev, { id, type }];
    });
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    
    // Smart default: If only 1 beneficiary remains in percentage mode, auto-set to 100%
    if (allocationMode === 'percentage' && updated.length === 1 && !updated[0].isManuallyEdited) {
      updated[0] = { ...updated[0], percentage: 100, isManuallyEdited: false };
    }
    
    onChange(updated);
  };

  const handleUpdateAllocation = (index: number, allocationValue: number) => {
    const updated = [...value];
    if (allocationMode === 'percentage') {
      updated[index] = { ...updated[index], percentage: allocationValue, isManuallyEdited: true };
    } else {
      updated[index] = { ...updated[index], amount: allocationValue };
    }
    onChange(updated);
  };

  const handleClearAllocation = (index: number) => {
    const updated = [...value];
    if (allocationMode === 'percentage') {
      const { percentage, ...rest } = updated[index];
      updated[index] = { ...rest, percentage: undefined, isManuallyEdited: false };
    } else {
      const { amount, ...rest } = updated[index];
      updated[index] = { ...rest, amount: undefined };
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

  const applyWizardResult = (result: BeneficiaryAssignment[]) => {
    onChange(result);
    setWizardDialog(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleWizard = () => {
    if (allocationMode !== 'percentage' || value.length === 0) return;

    const wizResult = evaluateWizard(value);

    switch (wizResult.rule) {
      case 'single_unlocked':
      case 'even_auto':
        applyWizardResult(wizResult.result);
        break;
      case 'all_locked':
      case 'locked_overcommit':
      case 'uneven_popup':
        setWizardDialog(wizResult);
        break;
    }
  };

  // Calculate total and validation
  const total = getTotalAllocated({ beneficiaries: value });
  const isValid = allocationMode === 'percentage' 
    ? Math.abs(total - 100) < 0.01 
    : true; // Amount mode can be partial

  const hasBeneficiaries = value.length > 0;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Add Beneficiaries: prominent when empty, subtle when populated */}
      {!hasBeneficiaries ? (
        <TouchableOpacity
          style={[styles.addBeneficiariesButton, error && styles.addBeneficiariesButtonError]}
          onPress={handleOpenDrawer}
          activeOpacity={0.7}
        >
          <IconButton icon="account-multiple-plus" size={20} iconColor={KindlingColors.navy} style={styles.addIcon} />
          <Text style={styles.addBeneficiariesText}>Add Beneficiaries</Text>
        </TouchableOpacity>
      ) : null}

      {/* Beneficiary Selection Drawer (unchanged) */}
      <Modal
        visible={showSelectionDrawer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSelectionDrawer(false)}
      >
        <SafeAreaView style={styles.drawerContainer} edges={['top', 'bottom']}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Select Beneficiaries</Text>
            <TouchableOpacity onPress={() => setShowSelectionDrawer(false)}>
              <IconButton icon="close" size={24} iconColor={KindlingColors.navy} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[
              ...(!estateSelected ? [{ id: 'estate', type: 'estate' as const, label: '🏛️ The Estate', isSpecial: true }] : []),
              ...availablePeople.map(p => { 
                const fullName = getPersonFullName(p);
                const relationship = getPersonRelationshipDisplay(p);
                return {
                  id: p.id, 
                  type: 'person' as const, 
                  label: relationship ? `${fullName} (${relationship})` : fullName,
                  isSpecial: false
                };
              }),
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
                      <IconButton icon="check" size={16} iconColor={KindlingColors.background} style={styles.checkIcon} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              <>
                {onAddNewPerson && (
                  <TouchableOpacity
                    style={styles.drawerOptionSpecial}
                    onPress={() => {
                      setShowSelectionDrawer(false);
                      onAddNewPerson((personId) => {
                        addTempSelection(personId, 'person');
                        setShowSelectionDrawer(true);
                      });
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

          <View style={styles.drawerFooter}>
            <Text style={styles.selectedCount}>
              {`${tempSelections.length} beneficiar${tempSelections.length === 1 ? 'y' : 'ies'} selected`}
            </Text>
            <Button onPress={handleConfirmSelections} variant="primary" disabled={tempSelections.length === 0}>
              Select
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Selected Beneficiaries — compact rows */}
      {hasBeneficiaries && (
        <View style={styles.beneficiariesList}>
          {showSliderMode ? (
            value.map((beneficiary, index) => {
              const currentValue = beneficiary.percentage || 0;
              const otherTotal = value.reduce((sum, b, idx) => {
                return idx !== index ? sum + (b.percentage || 0) : sum;
              }, 0);
              return (
                <BeneficiarySplitCard
                  key={`${beneficiary.id}-${index}`}
                  beneficiary={beneficiary}
                  value={currentValue}
                  onChange={(newValue) => {
                    const updated = [...value];
                    updated[index] = { ...updated[index], percentage: newValue };
                    onChange(updated);
                  }}
                  allocationMode="percentage"
                  otherTotal={otherTotal}
                  onRemove={() => handleRemove(index)}
                  personActions={personActions}
                  beneficiaryGroupActions={beneficiaryGroupActions}
                  showMagicWand={true}
                />
              );
            })
          ) : (
            value.map((beneficiary, index) => {
              const displayName = getBeneficiaryDisplayName(beneficiary, personActions, beneficiaryGroupActions);
              const currentValue = allocationMode === 'percentage' ? beneficiary.percentage : beneficiary.amount;
              const isFocused = focusedIndex === index;
              const isLocked = !!beneficiary.isManuallyEdited;

              return (
                <View key={`${beneficiary.id}-${index}`} style={styles.rowWrapper}>
                  {/* Delete icon — top-right */}
                  <TouchableOpacity
                    style={styles.rowDeleteButton}
                    onPress={() => handleRemove(index)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={18} color={KindlingColors.mutedForeground} />
                  </TouchableOpacity>

                  {/* Card body */}
                  <View style={styles.rowCard}>
                    <View style={styles.rowAccent} />

                    {/* Name (left) */}
                    <View style={styles.rowNameSection}>
                      {beneficiary.type === 'group' && <Text style={styles.rowTypePrefix}>👥 </Text>}
                      {beneficiary.type === 'estate' && <Text style={styles.rowTypePrefix}>🏛️ </Text>}
                      <Text style={styles.rowName} numberOfLines={1}>{displayName || 'Unknown'}</Text>
                    </View>

                    {/* Padlock + percentage input (right) */}
                    <View style={styles.rowRightSection}>
                      <TouchableOpacity
                        onPress={() => {
                          const updated = [...value];
                          updated[index] = { ...updated[index], isManuallyEdited: !isLocked };
                          onChange(updated);
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        activeOpacity={0.6}
                      >
                        <View style={isLocked ? styles.padlockLocked : styles.padlockUnlocked}>
                          <MaterialCommunityIcons
                            name={isLocked ? 'lock' : 'lock-open-variant'}
                            size={13}
                            color={isLocked ? KindlingColors.background : KindlingColors.mutedForeground}
                          />
                        </View>
                      </TouchableOpacity>

                      <View style={styles.rowInputSection}>
                        {allocationMode === 'amount' && <Text style={styles.rowCurrency}>£</Text>}
                        <TextInput
                          style={styles.rowInput}
                          value={currentValue?.toString() || ''}
                          onChangeText={(text) => {
                            const num = parseFloat(text.replace(/[^\d.]/g, '')) || 0;
                            const maxValue = allocationMode === 'percentage' ? 100 : 999999999;
                            handleUpdateAllocation(index, Math.min(maxValue, num));
                          }}
                          onFocus={() => {
                            setFocusedIndex(index);
                            handleClearAllocation(index);
                          }}
                          onBlur={() => setFocusedIndex(null)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={`${KindlingColors.brown}60`}
                          textAlign="right"
                        />
                        {allocationMode === 'percentage' && <Text style={styles.rowPercent}>%</Text>}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* Footer row: "+ Add another" left, total right */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.addAnotherButton}
              onPress={handleOpenDrawer}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={KindlingColors.green} />
              <Text style={styles.addAnotherText}>Add another</Text>
            </TouchableOpacity>

            {allocationMode === 'percentage' ? (
              <Text style={styles.totalLabel}>
                Total: <Text style={isValid ? styles.totalValid : styles.totalInvalid}>
                  {`${total.toFixed(1)}%`}{isValid ? ' ✓' : ''}
                </Text>
              </Text>
            ) : (
              <Text style={styles.totalLabel}>
                Total: <Text style={styles.totalValid}>{`£${Math.round(total).toLocaleString()}`}</Text>
              </Text>
            )}
          </View>

          {/* 100% Wizard CTA — below footer when needed */}
          {allocationMode === 'percentage' && !isValid && total > 0 && (
            <TouchableOpacity onPress={handleWizard} style={styles.wizardButton}>
              <MaterialCommunityIcons name="auto-fix" size={14} color={KindlingColors.background} />
              <Text style={styles.wizardText}>100% Wizard</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Wizard Dialogs */}
      {wizardDialog?.rule === 'all_locked' && (
        <Dialog
          visible
          onDismiss={() => setWizardDialog(null)}
          title="100% Wizard"
          actions={[
            { label: 'Yes please', onPress: () => applyWizardResult(wizardDialog.proportionalResult), variant: 'primary' },
            { label: 'No thanks', onPress: () => setWizardDialog(null), variant: 'secondary' },
          ]}
        >
          All beneficiaries are locked. Shall we scale all proportionately to equal 100%?
        </Dialog>
      )}

      {wizardDialog?.rule === 'locked_overcommit' && (
        <Dialog
          visible
          onDismiss={() => setWizardDialog(null)}
          title="100% Wizard"
          actions={[
            { label: 'OK', onPress: () => setWizardDialog(null), variant: 'secondary' },
          ]}
        >
          {`Locked allocations already total ${wizardDialog.lockedSum}%. Unlock at least one beneficiary to proceed.`}
        </Dialog>
      )}

      {wizardDialog?.rule === 'uneven_popup' && (
        <Dialog
          visible
          onDismiss={() => setWizardDialog(null)}
          title="100% Wizard"
          actions={[
            { label: 'Scale proportionately', onPress: () => applyWizardResult(wizardDialog.proportionalResult), variant: 'primary' },
            { label: 'Even distribution', onPress: () => applyWizardResult(wizardDialog.evenResult), variant: 'secondary' },
            { label: 'Cancel', onPress: () => setWizardDialog(null), variant: 'secondary' },
          ]}
        >
          How would you like to distribute?
        </Dialog>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },

  // --- Empty-state prominent add button ---
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
  addBeneficiariesButtonError: {
    borderColor: KindlingColors.destructive,
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

  // --- Compact beneficiary rows ---
  beneficiariesList: {
    gap: Spacing.sm,
  },
  rowWrapper: {
    position: 'relative',
  },
  rowDeleteButton: {
    position: 'absolute',
    top: -6,
    right: -4,
    zIndex: 10,
    backgroundColor: KindlingColors.background,
    borderRadius: 10,
    padding: 1,
  },
  padlockUnlocked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${KindlingColors.border}60`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padlockLocked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: KindlingColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${KindlingColors.navy}10`,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingLeft: Spacing.md + 4,
    minHeight: 48,
    overflow: 'hidden',
    ...Shadows.small,
  },
  rowAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: KindlingColors.green,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  rowNameSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  rowRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTypePrefix: {
    fontSize: Typography.fontSize.sm,
  },
  rowName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  rowInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.inputBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 70,
  },
  rowCurrency: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    marginRight: 2,
  },
  rowInput: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    padding: 0,
    minHeight: 22,
    minWidth: 30,
    textAlign: 'right',
  },
  rowPercent: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginLeft: 2,
  },

  // --- Subtle "add another" link ---
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  addAnotherText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.green,
  },

  // --- Footer: add-another (left) + total (right) ---
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    fontWeight: Typography.fontWeight.medium,
  },
  totalValid: {
    color: KindlingColors.green,
    fontWeight: Typography.fontWeight.bold,
  },
  totalInvalid: {
    color: KindlingColors.destructive,
    fontWeight: Typography.fontWeight.bold,
  },

  // --- 100% Wizard CTA ---
  wizardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    backgroundColor: KindlingColors.navy,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: 14,
  },
  wizardText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.background,
  },

  // --- Normalize card (slider mode, kept for BeneficiarySplitCard path) ---
  normalizeCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  normalizeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: KindlingColors.navy,
    marginBottom: 12,
    textAlign: 'center',
  },
  normalizeButton: {
    backgroundColor: KindlingColors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  normalizeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  normalizeSubtext: {
    fontSize: 13,
    color: KindlingColors.brown,
    textAlign: 'center',
  },

  // --- Drawer (unchanged) ---
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

