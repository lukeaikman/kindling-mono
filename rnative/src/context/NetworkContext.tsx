import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// ---------------------------------------------------------------------------
// NetInfo configuration
// ---------------------------------------------------------------------------
// The default reachability check hits clients3.google.com over QUIC/HTTP3.
// iOS simulators (and some real devices) suffer QUIC transport failures that
// cause isInternetReachable to flip to false even when WiFi is perfectly fine.
//
// Fix: use Apple's own captive-portal endpoint (plain HTTP/1.1, no QUIC)
// with a generous timeout so a single slow probe doesn't trip the UI.
// ---------------------------------------------------------------------------
NetInfo.configure({
  reachabilityUrl: 'https://captive.apple.com/hotspot-detect.html',
  reachabilityTest: async (response) => response.status === 200,
  reachabilityRequestTimeout: 10 * 1000, // 10 s
  reachabilityLongTimeout: 30 * 1000,    // poll every 30 s when reachable
  reachabilityShortTimeout: 5 * 1000,    // poll every 5 s when NOT reachable
});

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  lastCheckedAt: number;
}

const NetworkContext = createContext<NetworkState | undefined>(undefined);

const getNetworkState = (state: NetInfoState, lastCheckedAt: number): NetworkState => ({
  // Some platforms report null while connectivity is being determined.
  // Treat null as connected to avoid "stuck offline" UI on app launch.
  isConnected: state.isConnected ?? true,
  // Some platforms report null while reachability is being determined.
  // Treat null as reachable to avoid "stuck offline" UI.
  isInternetReachable: state.isInternetReachable ?? true,
  type: state.type,
  lastCheckedAt,
});

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    lastCheckedAt: Date.now(),
  });

  // Debounce going offline: require two consecutive offline reports within 3 s
  // before flipping the UI. A single flaky probe shouldn't trigger the banner.
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const next = getNetworkState(state, Date.now());

      if (next.isConnected && next.isInternetReachable) {
        // Online — apply immediately and cancel any pending offline timer
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = null;
        }
        setNetworkState(next);
      } else {
        // Potentially offline — debounce by 3 s to avoid flicker
        if (!offlineTimerRef.current) {
          offlineTimerRef.current = setTimeout(() => {
            offlineTimerRef.current = null;
            // Re-check before committing to offline
            NetInfo.fetch().then((fresh) => {
              setNetworkState(getNetworkState(fresh, Date.now()));
            });
          }, 3000);
        }
      }
    });

    return () => {
      unsubscribe();
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        NetInfo.fetch().then((state) => {
          setNetworkState(getNetworkState(state, Date.now()));
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const value = useMemo(() => networkState, [networkState]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetworkContext = (): NetworkState => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  return context;
};
