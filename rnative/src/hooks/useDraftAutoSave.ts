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

/** Returns a formatted HH:MM:SS timestamp for log messages */
function ts(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
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

  // Track whether form data has been touched by the user (gate for debounced saves)
  const formTouched = useRef(false);

  // Synchronous guard: set to true in discardDraft() *before* any async work,
  // so the unmount flush (which runs synchronously) knows not to re-save.
  const discardedRef = useRef(false);

  // Track latest values via refs so the unmount cleanup can flush correctly
  // (useEffect cleanup closures capture stale values without refs)
  const formDataRef = useRef<T>(formData);
  formDataRef.current = formData;
  const draftKeyRef = useRef(draftKey);
  draftKeyRef.current = draftKey;
  const initialDataRef = useRef<T>(initialData);
  initialDataRef.current = initialData;

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
          console.log(`[draftautosave] [${ts()}] Found draft for ${draftKey}`);
        }
      } catch (err) {
        console.warn(`[draftautosave] [${ts()}] Failed to load draft for ${draftKey}:`, err);
      }
    })();
  }, [draftKey]);

  // -----------------------------------------------------------------------
  // 2. Debounced save on formData changes
  // -----------------------------------------------------------------------

  useEffect(() => {
    // Don't save until the form is loaded (edit-mode hydration gate)
    if (!isLoaded) return;

    // Don't save until the user has actually changed something.
    // Compare serialised snapshots so we don't false-positive on re-renders.
    if (!formTouched.current) {
      if (JSON.stringify(formData) === JSON.stringify(initialDataRef.current)) {
        return;
      }
      formTouched.current = true;
    }

    // Reset the discarded flag — the user is actively editing again
    discardedRef.current = false;

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
        console.log(`[draftautosave] [${ts()}] Saved draft for ${draftKey}`);
      } catch (err) {
        console.warn(`[draftautosave] [${ts()}] Failed to save draft for ${draftKey}:`, err);
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
    // Synchronous flags FIRST — the unmount flush runs synchronously and must
    // see these before the async removeData resolves.
    discardedRef.current = true;
    formTouched.current = false;

    // Clear any pending debounce so it can't fire after discard
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      await removeData(draftKey);
      console.log(`[draftautosave] [${ts()}] Discarded draft for ${draftKey}`);
    } catch (err) {
      console.warn(`[draftautosave] [${ts()}] Failed to discard draft for ${draftKey}:`, err);
    }
    draftDataRef.current = null;
    setHasDraft(false);
    setHasChanges(false);
  }, [draftKey]);

  // -----------------------------------------------------------------------
  // Cleanup on unmount — flush any pending debounced save immediately
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Flush the pending draft ONLY if:
        //  - the user actually touched the form, AND
        //  - discardDraft() was NOT called (i.e. this is a back-navigation, not a save)
        if (formTouched.current && !discardedRef.current) {
          saveData(draftKeyRef.current, formDataRef.current).catch(() => {});
          console.log(`[draftautosave] [${ts()}] Flushed pending draft for ${draftKeyRef.current} on unmount`);
        }
      }
    };
  }, []);

  return { hasDraft, hasChanges, restoreDraft, discardDraft };
}
