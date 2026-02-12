/**
 * useFormValidation — lightweight validation hook for entry forms.
 *
 * Tracks required fields, counts how many are incomplete, and gates
 * error display behind an explicit "trigger" (the "X little things left"
 * button). Scrolls to the top of the form on trigger so the user sees
 * the first highlighted field immediately.
 *
 * Key design decisions:
 *   - `showErrors` starts false — no red on initial render
 *   - `triggerValidation()` sets showErrors=true and scrolls to y:0
 *   - `fieldErrors` map is always computed (for the count badge), but
 *     components only render error styles when showErrors is also true
 *   - No `measureLayout` — scroll-to-top + highlights is sufficient
 *
 * @module hooks/useFormValidation
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationField {
  /** Unique key matching the form field, e.g. 'address1' */
  key: string;
  /** Human-readable label (currently unused in logic but kept for extensibility) */
  label: string;
  /** Whether this field currently satisfies its requirement */
  isValid: boolean;
}

interface UseFormValidationOptions {
  /** Array of required field definitions */
  fields: ValidationField[];
  /** Ref to the form's ScrollView (for scroll-to-top on trigger) */
  scrollViewRef: React.RefObject<ScrollView>;
}

interface UseFormValidationReturn {
  /** Number of required fields that are currently invalid */
  invalidCount: number;
  /** Whether error styling should be rendered (only after user triggers) */
  showErrors: boolean;
  /** Call this when the user taps the "X little things left" button */
  triggerValidation: () => void;
  /** Map of field key → boolean (true = field is invalid). Use with showErrors. */
  fieldErrors: Record<string, boolean>;
  /** Returns the attention-button copy, or null if no errors remain */
  attentionLabel: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFormValidation(
  options: UseFormValidationOptions,
): UseFormValidationReturn {
  const { fields, scrollViewRef } = options;

  const [showErrors, setShowErrors] = useState(false);

  // Compute field errors and count — runs every render (cheap: just iterating
  // a small array of booleans)
  const { fieldErrors, invalidCount } = useMemo(() => {
    const errors: Record<string, boolean> = {};
    let count = 0;
    for (const field of fields) {
      const isInvalid = !field.isValid;
      errors[field.key] = isInvalid;
      if (isInvalid) count++;
    }
    return { fieldErrors: errors, invalidCount: count };
  }, [fields]);

  // Trigger validation: show errors + scroll to top
  const triggerValidation = useCallback(() => {
    setShowErrors(true);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [scrollViewRef]);

  // Attention button copy
  const attentionLabel = useMemo(() => {
    if (invalidCount === 0) return null;
    if (invalidCount === 1) return 'Just one more thing';
    return `${invalidCount} little things left`;
  }, [invalidCount]);

  return {
    invalidCount,
    showErrors,
    triggerValidation,
    fieldErrors,
    attentionLabel,
  };
}
