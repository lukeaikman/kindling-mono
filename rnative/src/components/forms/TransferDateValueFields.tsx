/**
 * TransferDateValueFields
 *
 * Reusable form component for collecting a transfer date (month + year)
 * and a transfer value, each with an optional "I don't know" checkbox.
 *
 * Used by LI Settlor, Bare Settlor, Discretionary Settlor, and
 * Discretionary Beneficiary fieldsets in the trust-details screen.
 *
 * @module components/forms/TransferDateValueFields
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Select, Checkbox, CurrencyInput } from '../ui';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

// ─── Month options (defined once) ──────────────────────────────

const MONTH_OPTIONS = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

// ─── Props ─────────────────────────────────────────────────────

export interface TransferDateValueFieldsProps {
  // Date section
  dateLabel: string;
  month: string;
  year: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  yearRange?: number;
  dateHelperText?: string;

  // Date unknown
  showDateUnknown?: boolean;
  dateUnknown?: boolean;
  onDateUnknownChange?: (value: boolean) => void;
  dateUnknownLabel?: string;

  // Value section
  showValue?: boolean;
  valueLabel: string;
  value: number;
  onValueChange: (value: number) => void;
  valuePlaceholder?: string;
  valueHelperText?: string;

  // Value unknown
  showValueUnknown?: boolean;
  valueUnknown?: boolean;
  onValueUnknownChange?: (value: boolean) => void;
  valueUnknownLabel?: string;

  // 7-year contradiction warning
  showContradictionWarning?: boolean;
  contradictionMessage?: string;
  onContradiction?: (isContradicting: boolean) => void;
}

// ─── Component ─────────────────────────────────────────────────

export const TransferDateValueFields: React.FC<TransferDateValueFieldsProps> = ({
  dateLabel,
  month,
  year,
  onMonthChange,
  onYearChange,
  yearRange = 100,
  dateHelperText,
  showDateUnknown = true,
  dateUnknown = false,
  onDateUnknownChange,
  dateUnknownLabel = "I'm not sure",
  showValue = true,
  valueLabel,
  value,
  onValueChange,
  valuePlaceholder = 'Enter value at transfer...',
  valueHelperText,
  showValueUnknown = true,
  valueUnknown = false,
  onValueUnknownChange,
  valueUnknownLabel = "I'm not sure",
  showContradictionWarning = false,
  contradictionMessage = "This date is more than 7 years ago. If that's right, change your answer above to 'No' — the transfer is fully exempt.",
  onContradiction,
}) => {
  // Generate year options from yearRange
  const yearOptions = Array.from({ length: yearRange }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { label: y.toString(), value: y.toString() };
  });

  // Contradiction check: is the entered date >= 7 years ago?
  const isContradicting = (() => {
    if (!showContradictionWarning || !month || !year) return false;
    const enteredDate = new Date(parseInt(year), parseInt(month) - 1);
    const elapsed = (Date.now() - enteredDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return elapsed >= 7;
  })();

  // Notify parent of contradiction state changes
  const prevContradicting = useRef(false);
  useEffect(() => {
    if (prevContradicting.current !== isContradicting) {
      prevContradicting.current = isContradicting;
      onContradiction?.(isContradicting);
    }
  }, [isContradicting, onContradiction]);

  return (
    <View>
      {/* ── Date section ── */}
      <Text style={styles.fieldLabel}>{dateLabel}</Text>

      {dateHelperText ? (
        <Text style={styles.helperText}>{dateHelperText}</Text>
      ) : null}

      {!dateUnknown && (
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Select
              placeholder="Month..."
              value={month}
              options={MONTH_OPTIONS}
              onChange={onMonthChange}
            />
          </View>
          <View style={styles.dateField}>
            <Select
              placeholder="Year..."
              value={year}
              options={yearOptions}
              onChange={onYearChange}
            />
          </View>
        </View>
      )}

      {showDateUnknown && onDateUnknownChange ? (
        <Checkbox
          label={dateUnknownLabel}
          checked={dateUnknown}
          onCheckedChange={onDateUnknownChange}
        />
      ) : null}

      {/* Contradiction warning */}
      {isContradicting && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{contradictionMessage}</Text>
        </View>
      )}

      {/* ── Value section ── */}
      {showValue && (
        <>
          <Text style={styles.fieldLabel}>{valueLabel}</Text>

          {valueHelperText ? (
            <Text style={styles.helperText}>{valueHelperText}</Text>
          ) : null}

          {!valueUnknown && (
            <CurrencyInput
              placeholder={valuePlaceholder}
              value={value}
              onValueChange={onValueChange}
            />
          )}

          {showValueUnknown && onValueUnknownChange ? (
            <Checkbox
              label={valueUnknownLabel}
              checked={valueUnknown}
              onCheckedChange={onValueUnknownChange}
              disabled={value > 0}
            />
          ) : null}
        </>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateField: {
    flex: 1,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: '#856404',
    lineHeight: 20,
  },
});
