import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  lastCheckedAt: number;
}

const NetworkContext = createContext<NetworkState | undefined>(undefined);

const getNetworkState = (state: NetInfoState, lastCheckedAt: number): NetworkState => ({
  isConnected: state.isConnected ?? false,
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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState(getNetworkState(state, Date.now()));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // TODO: We still miss some online transitions after returning from offline.
        // Add a focused-screen polling fallback when offline and stop once online.
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
