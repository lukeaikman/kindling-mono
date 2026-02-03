/**
 * Auth state hook for handling login/registration.
 */
import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { authApi, LoginResponse, RegisterResponse } from '../services/auth';
import { useAppState } from './useAppState';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../constants';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const DEVICE_ID_KEY = 'auth_device_id';
const USER_PROFILE_KEY = 'auth_user_profile';

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

const saveAuthState = async (accessToken: string, refreshToken: string, profile?: AuthState['userProfile']) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  if (profile) {
    await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile));
  }
};

const clearAuthState = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
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
      await syncServerIdentity(String(response.user.id), response.user.email);
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
      const response: RegisterResponse = await authApi.register({
        ...payload,
        device_id: deviceId,
        device_name: getDeviceName(),
      });

      await saveAuthState(response.access_token, response.refresh_token, {
        id: response.user_id,
        first_name: response.first_name || payload.first_name,
        last_name: response.last_name || payload.last_name,
        email: response.email || payload.email,
        phone: payload.phone ?? null,
      });

      if (response.user_id != null) {
        await syncServerIdentity(String(response.user_id), response.email || payload.email);
      }

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
