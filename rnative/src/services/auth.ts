/**
 * Auth service layer for Kindling API.
 *
 * Handles login, registration, and session management.
 */
export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
  device_id: string;
  device_name?: string | null;
};

export type LoginResponse = {
  access_token: string;
  access_expires_at: string;
  refresh_token: string;
  refresh_expires_at: string;
  user: AuthUser;
};

export type RegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  device_id: string;
  device_name?: string | null;
};

export type RegisterResponse = {
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  access_token: string;
  access_expires_at: string;
  refresh_token: string;
  refresh_expires_at: string;
};

export type ValidateEmailResponse = {
  available: boolean;
};

export type SessionValidationResponse = {
  valid: boolean;
  user_id: number;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  access_expires_at: string;
};

export type RefreshSessionResponse = {
  access_token: string;
  access_expires_at: string;
  refresh_token: string;
  refresh_expires_at: string;
};

export type ApiErrorPayload = {
  error?: string;
  code?: string;
  status?: number;
  request_id?: string;
  details?: Record<string, unknown>;
};

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.kindling.app/api/v1';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

class ApiError extends Error {
  status?: number;
  code?: string;
  requestId?: string;
  details?: Record<string, unknown>;

  constructor(message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = payload?.status;
    this.code = payload?.code;
    this.requestId = payload?.request_id;
    this.details = payload?.details;
  }
}

const buildHeaders = (token?: string) => {
  if (!token) return DEFAULT_HEADERS;
  return {
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${token}`,
  };
};

const requestJson = async <T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...buildHeaders(token),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorPayload: ApiErrorPayload | undefined;
    try {
      errorPayload = await response.json();
    } catch (error) {
      errorPayload = { status: response.status };
    }
    const message = errorPayload?.error || `Request failed (${response.status})`;
    throw new ApiError(message, {
      ...errorPayload,
      status: errorPayload?.status ?? response.status,
    });
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

export const authApi = {
  login: (payload: LoginRequest) =>
    requestJson<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterRequest) =>
    requestJson<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  validateEmail: (email: string) =>
    requestJson<ValidateEmailResponse>('/auth/register/validate-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  logout: (accessToken: string) =>
    requestJson<{ success: boolean }>(
      '/auth/logout',
      { method: 'POST' },
      accessToken
    ),

  validateSession: (accessToken: string) =>
    requestJson<SessionValidationResponse>(
      '/auth/session/validate',
      { method: 'GET' },
      accessToken
    ),

  refreshSession: (refreshToken: string) =>
    requestJson<RefreshSessionResponse>(
      '/auth/session/refresh',
      { method: 'POST' },
      refreshToken
    ),

  getProfile: (accessToken: string) =>
    requestJson<AuthUser>('/auth/user/profile', { method: 'GET' }, accessToken),
};

export { ApiError };
