/**
 * useDraftAutoSave — debounced auto-save of form data to AsyncStorage.
 *
 * Persists a JSON snapshot of `formData` under a deterministic key so that
 * the user can leave a half-filled form, return later, and pick up where
 * they left off.
 *
 * Key design decisions:
 *   - 2-second debounce (useRef timer, not a dependency-heavy library)
 *   - Unmount flush: if a debounce is pending when the user navigates away,
 *     the draft is saved immediately (fire-and-forget) so nothing is lost
 *   - `isLoaded` gate prevents saving blank initial state during edit hydration
 *   - `hasChanges` is a simple boolean flip, not a deep compare on every render
 *   - Draft auto-restores silently; caller renders a warm banner, not a dialog
 *
 * @module hooks/useDraftAutoSave
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveData, loadData, removeData } from '../services/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseDraftAutoSaveOptions<T> {
  /** Asset category slug, e.g. 'property' */
  category: string;
  /** null = new asset; string = editing an existing asset */
  assetId: string | null;
  /** Current form state — hook debounces writes when this changes */
  formData: T;
  /** Gate: don't save until edit-mode data has been loaded into the form */
  isLoaded: boolean;
  /** Blank defaults (new asset) or the last-saved asset data (edit mode) */
  initialData: T;
}

interface UseDraftAutoSaveReturn<T> {
  /** true if a draft was found in AsyncStorage on mount */
  hasDraft: boolean;
  /** true once the form has changed from initialData */
  hasChanges: boolean;
  /** Returns the draft data (caller sets it into form state) */
  restoreDraft: () => T | null;
  /** Clears the draft from AsyncStorage and resets hasChanges */
  discardDraft: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 2000;

function getDraftKey(category: string, assetId: string | null): string {
  return `draft:${category}:${assetId || 'new'}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDraftAutoSave<T>(
  options: UseDraftAutoSaveOptions<T>,
): UseDraftAutoSaveReturn<T> {
  const { category, assetId, formData, isLoaded, initialData } = options;

  const draftKey = getDraftKey(category, assetId);

  // Draft state
  const [hasDraft, setHasDraft] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const draftDataRef = useRef<T | null>(null);

  // Debounce timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether we've done the initial load check
  const initialCheckDone = useRef(false);

  // Track whether form data has been touched (gate for debounced saves)
  const formTouched = useRef(false);

  // Track latest values via refs so the unmount cleanup can flush correctly
  // (useEffect cleanup closures capture stale values without refs)
  const formDataRef = useRef<T>(formData);
  formDataRef.current = formData;
  const draftKeyRef = useRef(draftKey);
  draftKeyRef.current = draftKey;

  // -----------------------------------------------------------------------
  // 1. On mount: check for existing draft
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    (async () => {
      try {
        const stored = await loadData<T | null>(draftKey, null);
        if (stored !== null) {
          draftDataRef.current = stored;
          setHasDraft(true);
          console.log(`[DraftAutoSave] Found draft for ${draftKey}`);
        }
      } catch (err) {
        console.warn(`[DraftAutoSave] Failed to load draft for ${draftKey}:`, err);
      }
    })();
  }, [draftKey]);

  // -----------------------------------------------------------------------
  // 2. Debounced save on formData changes
  // -----------------------------------------------------------------------

  useEffect(() => {
    // Don't save until the form is loaded (edit-mode hydration gate)
    if (!isLoaded) return;

    // Don't save the very first render (initial data, no user interaction)
    if (!formTouched.current) {
      // Mark touched after the first real change.
      // On the very first effect run, formData === initialData, so skip.
      // On subsequent runs, formData has changed — mark as touched.
      formTouched.current = true;
      return;
    }

    // Mark that the form has been changed
    setHasChanges(true);

    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Debounce the save
    timerRef.current = setTimeout(async () => {
      try {
        await saveData(draftKey, formData);
        console.log(`[DraftAutoSave] Saved draft for ${draftKey}`);
      } catch (err) {
        console.warn(`[DraftAutoSave] Failed to save draft for ${draftKey}:`, err);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [formData, isLoaded, draftKey]);

  // -----------------------------------------------------------------------
  // 3. restoreDraft — returns the cached draft data for the caller to apply
  // -----------------------------------------------------------------------

  const restoreDraft = useCallback((): T | null => {
    return draftDataRef.current;
  }, []);

  // -----------------------------------------------------------------------
  // 4. discardDraft — clears AsyncStorage + resets flags
  // -----------------------------------------------------------------------

  const discardDraft = useCallback(async () => {
    try {
      await removeData(draftKey);
      console.log(`[DraftAutoSave] Discarded draft for ${draftKey}`);
    } catch (err) {
      console.warn(`[DraftAutoSave] Failed to discard draft for ${draftKey}:`, err);
    }
    draftDataRef.current = null;
    setHasDraft(false);
    setHasChanges(false);
    formTouched.current = false;
  }, [draftKey]);

  // -----------------------------------------------------------------------
  // Cleanup on unmount — flush any pending debounced save immediately
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // If the user navigated away before the debounce fired, save now
        if (formTouched.current) {
          saveData(draftKeyRef.current, formDataRef.current).catch(() => {});
          console.log(`[DraftAutoSave] Flushed pending draft for ${draftKeyRef.current} on unmount`);
        }
      }
    };
  }, []);

  return { hasDraft, hasChanges, restoreDraft, discardDraft };
}
