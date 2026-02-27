/**
 * BeneficiarySplitCard Component
 * 
 * Individual allocation card with slider + manual input + magic wand
 * Extracted from Estate Remainder implementation for reuse across app
 * 
 * Features:
 * - Avatar display (person initials or group icon)
 * - Manual percentage/amount input
 * - Slider for visual adjustment
 * - Magic wand button (auto-fill to complete allocation)
 * - Remove button (when value = 0)
 * 
 * @module components/forms/BeneficiarySplitCard
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { Slider } from '../ui/Slider';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import type { BeneficiaryAssignment, PersonActions, BeneficiaryGroupActions } from '../../types';
import { getBeneficiaryDisplayName } from '../../utils/beneficiaryHelpers';
import { getPersonFullName } from '../../utils/helpers';
import { useAppState } from '../../hooks/useAppState';

export interface BeneficiarySplitCardProps {
  /**
   * Beneficiary assignment
   */
  beneficiary: BeneficiaryAssignment;
  
  /**
   * Current value (percentage or amount)
   */
  value: number;
  
  /**
   * Change handler
   */
  onChange: (value: number) => void;
  
  /**
   * Allocation mode
   */
  allocationMode: 'percentage' | 'amount';
  
  /**
   * Total value for context (used in amount mode and magic wand calculation)
   */
  totalValue?: number;
  
  /**
   * Current total of OTHER allocations (for magic wand)
   */
  otherTotal: number;
  
  /**
   * Remove handler
   */
  onRemove?: () => void;
  
  /**
   * Person actions for display
   */
  personActions: PersonActions;
  
  /**
   * Beneficiary group actions for display
   */
  beneficiaryGroupActions: BeneficiaryGroupActions;
  
  /**
   * Show magic wand button
   */
  showMagicWand?: boolean;
  
  /**
   * Additional style
   */
  style?: ViewStyle;
}

/**
 * BeneficiarySplitCard Component
 * 
 * @example
 * ```tsx
 * <BeneficiarySplitCard
 *   beneficiary={{ id: 'person-123', type: 'person' }}
 *   value={40}
 *   onChange={(val) => updateAllocation(index, val)}
 *   allocationMode="percentage"
 *   otherTotal={60}
 *   personActions={personActions}
 *   beneficiaryGroupActions={beneficiaryGroupActions}
 *   showMagicWand={true}
 * />
 * ```
 */
export const BeneficiarySplitCard: React.FC<BeneficiarySplitCardProps> = ({
  beneficiary,
  value,
  onChange,
  allocationMode,
  totalValue,
  otherTotal,
  onRemove,
  personActions,
  beneficiaryGroupActions,
  showMagicWand = true,
  style,
}) => {
  const { relationshipActions } = useAppState();
  const [manualInput, setManualInput] = useState('');

  // Get display name WITHOUT relationship (we show that separately)
  const getDisplayName = () => {
    if (beneficiary.type === 'estate') return 'The Estate';
    if (beneficiary.type === 'group') {
      const group = beneficiaryGroupActions.getGroupById(beneficiary.id);
      return group?.name || 'Unknown Group';
    }
    
    const person = personActions.getPersonById(beneficiary.id);
    return person ? getPersonFullName(person) : 'Unknown Person';
  };

  // Get relationship/type label
  const getSubLabel = () => {
    if (beneficiary.type === 'group') return 'Category';
    if (beneficiary.type === 'estate') return 'Estate';
    
    return relationshipActions.getDisplayLabel(beneficiary.id);
  };
  
  const displayName = getDisplayName();

  // Get avatar content
  const getAvatarContent = () => {
    if (beneficiary.type === 'group') {
      return <IconButton icon="account-group" size={20} iconColor={KindlingColors.brown} style={{margin: 0}} />;
    }
    if (beneficiary.type === 'estate') {
      return <IconButton icon="bank" size={20} iconColor={KindlingColors.navy} style={{margin: 0}} />;
    }
    
    const person = personActions.getPersonById(beneficiary.id);
    const initials = person 
      ? `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`
      : '?';
    return <Text style={styles.avatarText}>{initials}</Text>;
  };

  // Format value for display
  const formattedValue = allocationMode === 'percentage'
    ? (value === 100 ? '100' : value.toFixed(1))
    : Math.round(value).toLocaleString();
  
  const displayValue = manualInput || formattedValue;

  // Clamp value
  const clampValue = (val: number) => {
    if (Number.isNaN(val)) return 0;
    const max = allocationMode === 'percentage' ? 100 : (totalValue || 999999999);
    return Math.min(max, Math.max(0, val));
  };

  // Handlers
  const handleManualInputChange = (text: string) => {
    setManualInput(text);
  };

  const handleManualInputBlur = () => {
    if (!manualInput) return;
    
    const parsed = parseFloat(manualInput);
    const clamped = clampValue(parsed);
    
    if (clamped !== value) {
      onChange(clamped);
    }
    
    setManualInput('');
  };

  const handleSliderChange = (newValue: number) => {
    onChange(clampValue(newValue));
    setManualInput(''); // Clear any pending manual input
  };

  const handleMagicWand = () => {
    // Calculate what's needed to reach 100%/totalValue
    const target = allocationMode === 'percentage' ? 100 : (totalValue || 0);
    const remaining = target - otherTotal;
    const clamped = clampValue(remaining);
    
    onChange(clamped);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const subLabel = getSubLabel();
  const isGroup = beneficiary.type === 'group';
  const maxValue = allocationMode === 'percentage' ? 100 : (totalValue || 100);

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.info}>
          <View style={[styles.avatar, isGroup && styles.avatarGroup]}>
            {getAvatarContent()}
          </View>
          <View style={styles.labels}>
            <Text style={styles.name}>{displayName || 'Unknown'}</Text>
            {subLabel && (
              <Text style={styles.subLabel}>{subLabel}</Text>
            )}
          </View>
        </View>

        {/* Value Input */}
        <View style={styles.inputContainer}>
          {allocationMode === 'amount' && (
            <Text style={styles.currencySymbol}>£</Text>
          )}
          <TextInput
            value={displayValue}
            onChangeText={handleManualInputChange}
            onBlur={handleManualInputBlur}
            keyboardType="numeric"
            style={styles.input}
            placeholder="0"
          />
          <Text style={styles.symbol}>
            {allocationMode === 'percentage' ? '%' : ''}
          </Text>
        </View>
      </View>

      {/* Slider Row */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderRow}>
          <View style={styles.sliderWrapper}>
            <Slider
              value={value}
              onValueChange={handleSliderChange}
              minimumValue={0}
              maximumValue={maxValue}
              step={allocationMode === 'percentage' ? 0.1 : 1}
              showValue={false}
              style={styles.slider}
            />
          </View>
          
          {/* Magic Wand Button */}
          {showMagicWand && (
            <Pressable
              onPress={handleMagicWand}
              style={styles.wandButton}
            >
              <Text style={styles.wandIcon}>✦</Text>
            </Pressable>
          )}
        </View>

        {/* Remove link when value = 0 */}
        {value < 0.1 && onRemove && (
          <Pressable onPress={onRemove} style={styles.removeLink}>
            <Text style={styles.removeLinkText}>Remove</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.1)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGroup: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: KindlingColors.green,
  },
  labels: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: KindlingColors.navy,
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 13,
    color: KindlingColors.brown,
    textTransform: 'capitalize',
  },
  inputContainer: {
    position: 'relative',
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 8,
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 36,
    paddingLeft: 8,
    paddingRight: 28,
    fontSize: 15,
    color: KindlingColors.navy,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.2)',
    borderRadius: 8,
    textAlign: 'right',
  },
  symbol: {
    position: 'absolute',
    right: 8,
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
  },
  sliderContainer: {
    marginTop: 0,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderWrapper: {
    flex: 1,
  },
  slider: {
    width: '100%',
  },
  wandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wandIcon: {
    fontSize: 20,
    color: '#000000',
  },
  removeLink: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 4,
  },
  removeLinkText: {
    fontSize: 11,
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
});

