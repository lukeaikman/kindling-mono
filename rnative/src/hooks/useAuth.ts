/**
 * Auth state hook for handling login/registration.
 */
import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, LoginResponse, RegisterResponse } from '../services/auth';
import { getAttributionForApi, trackRegistration, clearOnboardingState } from '../services/attribution';
import { useAppState } from './useAppState';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../constants';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const DEVICE_ID_KEY = 'auth_device_id';
const USER_PROFILE_KEY = 'auth_user_profile';
const SCOPE_ID_KEY = 'auth_scope_id';
const BIOMETRIC_ENABLED_KEY = 'auth_biometric_enabled';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  userProfile: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string | null;
  } | null;
  error: string | null;
};

const getDeviceId = async () => {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await SecureStore.setItemAsync(DEVICE_ID_KEY, generated);
  return generated;
};

const getDeviceName = () => {
  return Device.deviceName || Device.modelName || 'Unknown device';
};

const saveAuthState = async (
  accessToken: string,
  refreshToken: string,
  profile?: AuthState['userProfile'],
  scopeId?: string
) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  if (profile) {
    await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile));
  }
  if (scopeId) {
    await SecureStore.setItemAsync(SCOPE_ID_KEY, scopeId);
  }
};

const clearAuthState = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
  await SecureStore.deleteItemAsync(SCOPE_ID_KEY);
};

/**
 * Clear all auth data from SecureStore (for testing/dev purposes)
 * This clears tokens, profile, and scopeId - essentially a full auth reset
 */
export const clearAllAuthData = async () => {
  await clearAuthState();
  console.log('✅ Auth data cleared from SecureStore');
};

const HAS_LAUNCHED_KEY = 'kindling_has_launched';

/**
 * Detect fresh install and clear stale Keychain data.
 * 
 * iOS Keychain (SecureStore) persists across app uninstall/reinstall.
 * AsyncStorage does NOT persist. We use this difference to detect reinstalls.
 * 
 * If AsyncStorage flag is missing but Keychain has auth data = stale data from
 * a previous install. Clear it to ensure fresh start.
 */
export const handleFreshInstallCleanup = async (): Promise<boolean> => {
  const hasLaunchedBefore = await AsyncStorage.getItem(HAS_LAUNCHED_KEY);
  
  if (!hasLaunchedBefore) {
    // First launch after install - check for stale Keychain data
    const staleToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    
    if (staleToken) {
      // Stale data from previous install - clear it
      console.log('🧹 Fresh install detected - clearing stale Keychain data');
      await clearAuthState();
    }
    
    // Mark as launched
    await AsyncStorage.setItem(HAS_LAUNCHED_KEY, 'true');
    return true; // Was fresh install
  }
  
  return false; // Not a fresh install
};

const getBiometricKey = (scopeId: string) => `${BIOMETRIC_ENABLED_KEY}_${scopeId}`;

export const getBiometricEnabled = async (scopeId: string): Promise<boolean> => {
  const value = await SecureStore.getItemAsync(getBiometricKey(scopeId));
  return value === 'true';
};

export const setBiometricEnabled = async (scopeId: string, enabled: boolean): Promise<void> => {
  await SecureStore.setItemAsync(getBiometricKey(scopeId), enabled ? 'true' : 'false');
};

type SessionProfile = AuthState['userProfile'];

type SessionValidationResult =
  | { status: 'valid'; profile: SessionProfile; scopeId: string }
  | { status: 'invalid'; reason: 'no_tokens' | 'expired' | 'refresh_failed' }
  | { status: 'offline'; profile: SessionProfile; scopeId: string | null };

export const validateSession = async (): Promise<SessionValidationResult> => {
  const [accessToken, refreshToken, cachedProfileStr, scopeId] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_PROFILE_KEY),
    SecureStore.getItemAsync(SCOPE_ID_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return { status: 'invalid', reason: 'no_tokens' };
  }

  let profile: SessionProfile = null;
  if (cachedProfileStr) {
    try {
      profile = JSON.parse(cachedProfileStr);
    } catch {
      profile = null;
    }
  }

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    return { status: 'offline', profile, scopeId };
  }

  try {
    const validation = await authApi.validateSession(accessToken);
    if (validation.valid) {
      const validatedProfile = { id: validation.user_id, ...validation.profile };
      await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(validatedProfile));
      return { status: 'valid', profile: validatedProfile, scopeId: scopeId ?? '' };
    }

    return { status: 'invalid', reason: 'expired' };
  } catch (error: any) {
    if (typeof error?.status !== 'number') {
      return { status: 'offline', profile, scopeId };
    }

    if (error.status === 401) {
      try {
        const refreshed = await authApi.refreshSession(refreshToken);
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, refreshed.access_token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshed.refresh_token);

        const newProfile = await authApi.getProfile(refreshed.access_token);
        await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(newProfile));

        return { status: 'valid', profile: newProfile, scopeId: scopeId ?? '' };
      } catch {
        return { status: 'invalid', reason: 'refresh_failed' };
      }
    }

    return { status: 'offline', profile, scopeId };
  }
};

export const useAuth = () => {
  const { personActions, activeWillMakerId, loadUserNamespace, findScopeByServerId, clearInMemoryState } = useAppState();
  const [state, setState] = useState<AuthState>({
    status: 'idle',
    accessToken: null,
    refreshToken: null,
    userProfile: null,
    error: null,
  });

  useEffect(() => {
    const loadAuthState = async () => {
      const [accessToken, refreshToken, storedProfile] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_PROFILE_KEY),
      ]);

      const userProfile = storedProfile ? JSON.parse(storedProfile) : null;

      setState({
        status: accessToken ? 'authenticated' : 'unauthenticated',
        accessToken,
        refreshToken,
        userProfile,
        error: null,
      });
    };

    loadAuthState();
  }, []);

  const writeLocalIdentity = useCallback(
    async (scopeId: string, serverUserId: string, email?: string | null) => {
      const serverId = String(serverUserId);
      const nextEmail = email ?? '';

      const peopleKey = `kindling:${scopeId}:${STORAGE_KEYS.PERSON_DATA}`;
      const people = await storage.load<any[]>(peopleKey, []);
      
      if (!Array.isArray(people) || people.length === 0) {
        return;
      }

      // Find the will-maker directly by role - they own this namespace
      const willMaker = people.find((p) => p.roles?.includes('will-maker'));
      if (!willMaker) {
        return;
      }

      // Update in-memory state
      personActions.updatePerson(willMaker.id, {
        serverId,
        ...(nextEmail ? { email: nextEmail } : {}),
      });

      // Update storage
      const updated = people.map((person) =>
        person.roles?.includes('will-maker')
          ? { ...person, serverId, ...(nextEmail ? { email: nextEmail } : {}) }
          : person
      );
      
      await storage.save(peopleKey, updated);
    },
    [personActions]
  );

  /**
   * Sync server identity after login/register.
   * 
   * Flow:
   * 1. If we have an active scope, update the will-maker's serverId in that scope
   * 2. Otherwise, search storage for a scope with matching serverId and load it
   * 3. After finding/confirming the scope, update the will-maker's identity
   */
  const syncServerIdentity = useCallback(async (serverUserId: string, email?: string | null) => {
    const serverId = String(serverUserId);

    // Case 1: We already have an active scope - update identity in current scope
    if (activeWillMakerId) {
      await writeLocalIdentity(activeWillMakerId, serverId, email);
      return activeWillMakerId;
    }

    // Case 2: Check in-memory state for a will-maker
    const currentWillMaker = personActions.getPeopleByRole('will-maker')[0];
    if (currentWillMaker?.id) {
      // Load this namespace explicitly and update identity
      const loaded = await loadUserNamespace(currentWillMaker.id);
      if (loaded) {
        await writeLocalIdentity(currentWillMaker.id, serverId, email);
        return currentWillMaker.id;
      }
    }

    // Case 3: Search storage for a scope with matching serverId (returning user)
    const scopeId = await findScopeByServerId(serverId);
    if (scopeId) {
      // Found existing data for this user - load it
      const loaded = await loadUserNamespace(scopeId);
      if (loaded) {
        await writeLocalIdentity(scopeId, serverId, email);
        return scopeId;
      }
    }

    // No existing data found for this user
    return null;
  }, [activeWillMakerId, personActions, loadUserNamespace, findScopeByServerId, writeLocalIdentity]);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    const deviceId = await getDeviceId();
    const response: LoginResponse = await authApi.login({
      email,
      password,
      device_id: deviceId,
      device_name: getDeviceName(),
    });

    await saveAuthState(response.access_token, response.refresh_token, response.user);
    if (response.user?.id != null) {
      const scopeId = await syncServerIdentity(String(response.user.id), response.user.email);
      if (scopeId) {
        await SecureStore.setItemAsync(SCOPE_ID_KEY, scopeId);
      }
    }

    setState({
      status: 'authenticated',
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      userProfile: response.user,
      error: null,
    });

    return response;
  }, [syncServerIdentity]);

  const register = useCallback(
    async (payload: { email: string; password: string; first_name: string; last_name: string; phone?: string | null }) => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }));
      const deviceId = await getDeviceId();
      
      // Get attribution data for API
      const attribution = await getAttributionForApi();
      
      // TODO: Backend integration - attribution will be sent to server when API is ready
      // For now, log what would be sent
      if (attribution) {
        console.log('[useAuth] Attribution data for registration:', JSON.stringify(attribution, null, 2));
      }
      
      const response: RegisterResponse = await authApi.register({
        ...payload,
        device_id: deviceId,
        device_name: getDeviceName(),
        attribution: attribution || undefined,
      });

      await saveAuthState(response.access_token, response.refresh_token, {
        id: response.user_id,
        first_name: response.first_name || payload.first_name,
        last_name: response.last_name || payload.last_name,
        email: response.email || payload.email,
        phone: payload.phone ?? null,
      });

      if (response.user_id != null) {
        const scopeId = await syncServerIdentity(String(response.user_id), response.email || payload.email);
        if (scopeId) {
          await SecureStore.setItemAsync(SCOPE_ID_KEY, scopeId);

          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Open Kindling Instantly',
              disableDeviceFallback: false,
            });

            if (result.success) {
              await setBiometricEnabled(scopeId, true);
            }
          }
        }
      }

      // Track registration event and clear onboarding state
      if (response.user_id) {
        trackRegistration(String(response.user_id));
      }
      await clearOnboardingState();

      setState((prev) => ({
        status: 'authenticated',
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        userProfile: {
          id: response.user_id,
          first_name: response.first_name || payload.first_name,
          last_name: response.last_name || payload.last_name,
          email: response.email || payload.email,
          phone: payload.phone ?? null,
        },
        error: null,
      }));

      return response;
    },
    [syncServerIdentity]
  );

  const validateEmail = useCallback(async (email: string) => {
    return authApi.validateEmail(email);
  }, []);

  const logout = useCallback(async () => {
    if (state.accessToken) {
      try {
        await authApi.logout(state.accessToken);
      } catch (error) {
        // Ignore logout errors to avoid blocking local sign-out.
      }
    }

    await clearAuthState();
    clearInMemoryState();
    setState({
      status: 'unauthenticated',
      accessToken: null,
      refreshToken: null,
      userProfile: null,
      error: null,
    });
  }, [state.accessToken, clearInMemoryState]);

  const setError = useCallback((message: string | null) => {
    setState((prev) => ({ ...prev, error: message }));
  }, []);

  return {
    ...state,
    login,
    register,
    validateEmail,
    logout,
    setError,
  };
};
