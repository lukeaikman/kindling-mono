/**
 * Network state hook for detecting online/offline status
 * 
 * Uses @react-native-community/netinfo to track network connectivity
 * and provide real-time updates on connection status.
 * 
 * @module hooks/useNetworkState
 */

import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Network state interface
 */
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

/**
 * Hook to track network connectivity state
 * 
 * @returns {NetworkState} Current network state
 * 
 * @example
 * ```tsx
 * const { isConnected, isInternetReachable } = useNetworkState();
 * 
 * if (!isConnected) {
 *   return <OfflineMessage />;
 * }
 * ```
 */
export const useNetworkState = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true, // Assume connected initially
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        // Some platforms report null while reachability is being determined.
        // Treat null as reachable to avoid "stuck offline" UI.
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type,
      });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return networkState;
};

/**
 * Hook to listen for network state changes
 * Calls the callback whenever network state changes
 * 
 * @param {Function} callback - Function to call when network state changes
 * 
 * @example
 * ```tsx
 * useNetworkStateListener((isConnected) => {
 *   if (isConnected) {
 *     syncOfflineQueue();
 *   }
 * });
 * ```
 */
export const useNetworkStateListener = (callback: (isConnected: boolean) => void) => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      callback(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, [callback]);
};

