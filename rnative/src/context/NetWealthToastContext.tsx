import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { getEstateNetValue, WillProgressState } from '../utils/willProgress';
import { BequeathalData } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToastState {
  visible: boolean;
  fromValue: number;
  toValue: number;
}

interface NetWealthToastContextValue {
  /** Seed lastNetValue on mount so the first save is compared correctly. */
  seedIfNeeded: (bd: BequeathalData) => void;
  /**
   * Call after addAsset / updateAsset with the NET VALUE DELTA of the save.
   *
   * For new assets: pass the asset's net value (estimatedValue, or
   * estimatedValue - mortgage for property).
   * For edits: pass newNetValue - oldNetValue.
   *
   * This avoids reading stale getBequeathalData() after a batched setState.
   */
  notifySave: (delta: number) => void;
  /** Direct show for dev testing (bypasses comparison logic). */
  show: (fromValue: number, toValue: number) => void;
  /** Hide the toast (called by the toast component after animation). */
  hide: () => void;
  /** Current toast state for rendering. */
  toast: ToastState;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const NetWealthToastContext = createContext<NetWealthToastContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function computeNet(bd: BequeathalData): number {
  return getEstateNetValue({ bequeathalData: bd } as WillProgressState);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const NetWealthToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    fromValue: 0,
    toValue: 0,
  });

  // null = not yet seeded; number = last known net estate value
  const lastNetValue = useRef<number | null>(null);

  const showToast = useCallback((from: number, to: number) => {
    console.log(`[NetWealthToast] show: ${from} → ${to}`);
    setToast((prev) => {
      // If already visible, roll FROM the current toValue (where digits are settling)
      const effectiveFrom = prev.visible ? prev.toValue : from;
      return { visible: true, fromValue: effectiveFrom, toValue: to };
    });
  }, []);

  const hide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const seedIfNeeded = useCallback((bd: BequeathalData) => {
    if (lastNetValue.current !== null) return; // already seeded
    const net = computeNet(bd);
    lastNetValue.current = net;
    console.log(`[NetWealthToast] seeded lastNetValue: ${net}`);
  }, []);

  const notifySave = useCallback(
    (delta: number) => {
      if (lastNetValue.current === null) {
        // Safety net — should not happen in normal hub-and-spoke flow.
        // Treat the delta as the initial value.
        lastNetValue.current = delta;
        console.log(`[NetWealthToast] safety-seed lastNetValue: ${delta}`);
        return;
      }

      if (delta <= 0) {
        console.log(`[NetWealthToast] delta ${delta} ≤ 0 (silent)`);
        return;
      }

      const oldNet = lastNetValue.current;
      const newNet = oldNet + delta;
      lastNetValue.current = newNet;

      console.log(`[NetWealthToast] net increased: ${oldNet} → ${newNet} (delta: ${delta})`);
      showToast(oldNet, newNet);
    },
    [showToast]
  );

  const show = useCallback(
    (fromValue: number, toValue: number) => {
      showToast(fromValue, toValue);
    },
    [showToast]
  );

  return (
    <NetWealthToastContext.Provider value={{ seedIfNeeded, notifySave, show, hide, toast }}>
      {children}
    </NetWealthToastContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useNetWealthToast = (): NetWealthToastContextValue => {
  const context = useContext(NetWealthToastContext);
  if (!context) {
    throw new Error('useNetWealthToast must be used within a NetWealthToastProvider');
  }
  return context;
};
