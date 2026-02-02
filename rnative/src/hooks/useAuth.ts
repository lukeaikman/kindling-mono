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
  const { personActions, willActions, setActiveWillMakerId, clearInMemoryState } = useAppState();
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

  const syncServerIdentity = useCallback(async (serverUserId: string) => {
    const serverId = String(serverUserId);
    const scopeMap = await storage.load<Record<string, string>>(STORAGE_KEYS.USER_SCOPE_MAP, {});
    let willMakerId = scopeMap[serverId];

    if (!willMakerId) {
      const currentWillMaker = willActions.getUser() || personActions.getPeopleByRole('will-maker')[0];
      if (currentWillMaker) {
        willMakerId = currentWillMaker.id;
        scopeMap[serverId] = willMakerId;
        await storage.save(STORAGE_KEYS.USER_SCOPE_MAP, scopeMap);
      }
    }

    if (willMakerId) {
      setActiveWillMakerId(willMakerId);

      const currentWillMaker = personActions.getPersonById(willMakerId);
      if (currentWillMaker) {
        if (currentWillMaker.serverId && currentWillMaker.serverId !== serverId) {
          throw new Error('Server ID mismatch. Contact support.');
        }
        if (!currentWillMaker.serverId) {
          personActions.updatePerson(willMakerId, { serverId });
        }
      } else {
        const peopleKey = `kindling:${willMakerId}:${STORAGE_KEYS.PERSON_DATA}`;
        const people = await storage.load<any[]>(peopleKey, []);
        const updated = people.map((person) => {
          if (person.id !== willMakerId) return person;
          if (person.serverId && person.serverId !== serverId) {
            throw new Error('Server ID mismatch. Contact support.');
          }
          return { ...person, serverId };
        });
        if (updated.length > 0) {
          await storage.save(peopleKey, updated);
        }
      }
    }
  }, [personActions, setActiveWillMakerId, storage, willActions]);

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
      await syncServerIdentity(String(response.user.id));
    }

    setState({
      status: 'authenticated',
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      userProfile: response.user,
      error: null,
    });

    return response;
  }, []);

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
        await syncServerIdentity(String(response.user_id));
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
    []
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
  }, [state.accessToken]);

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
