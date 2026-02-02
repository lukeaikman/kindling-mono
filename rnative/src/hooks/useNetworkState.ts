/**
 * Network state hook for detecting online/offline status
 * 
 * Uses @react-native-community/netinfo to track network connectivity
 * and provide real-time updates on connection status.
 * 
 * @module hooks/useNetworkState
 */

import { useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useNetworkContext, NetworkState } from '../context/NetworkContext';

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
export const useNetworkState = (): NetworkState => useNetworkContext();

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

