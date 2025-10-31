import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '../endpoints';
import {
  ApiError,
  ApiResponse,
  LoginResponseData,
  RefreshTokenResponseData,
} from '../types/api.types';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
  _retry?: boolean;
}

const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token';
const AUTH_REFRESH_TOKEN_KEY = import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token';
const AUTH_PROFILE_KEY = import.meta.env.VITE_AUTH_PROFILE_KEY || 'spes_auth_profile';

type StoredProfile = {
  user?: {
    authzVersion?: number;
  } | null;
};

const parseStoredProfile = (): StoredProfile | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(AUTH_PROFILE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredProfile;
  } catch (error) {
    console.warn('Failed to parse stored auth profile for authzVersion sync:', error);
    return null;
  }
};

const getStoredAuthzVersion = (): number => {
  const profile = parseStoredProfile();
  const version = profile?.user?.authzVersion;
  return typeof version === 'number' && Number.isFinite(version) ? version : 0;
};

const resolveHeaderValue = (headers: AxiosResponse['headers'] | undefined, key: string): string | undefined => {
  if (!headers) {
    return undefined;
  }

  const lowered = key.toLowerCase();

  if (typeof (headers as any)?.get === 'function') {
    const resolved = (headers as any).get(lowered) ?? (headers as any).get(key) ?? (headers as any).get(key.toUpperCase());
    return typeof resolved === 'string' ? resolved : undefined;
  }

  const headerRecord = headers as Record<string, unknown>;
  const direct =
    headerRecord[key] ??
    headerRecord[key.toLowerCase()] ??
    headerRecord[key.toUpperCase()] ??
    headerRecord[lowered];

  return typeof direct === 'string' ? direct : undefined;
};

const checkAuthzVersionHeader = (headers: AxiosResponse['headers'] | undefined) => {
  const raw = resolveHeaderValue(headers, 'x-authz-version');
  if (!raw) {
    return;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  const currentVersion = getStoredAuthzVersion();
  if (parsed > currentVersion) {
    window.dispatchEvent(
      new CustomEvent('auth:version-outdated', {
        detail: {
          serverVersion: parsed,
          currentVersion,
        },
      }),
    );
  }
};

// Create axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const extendedConfig = config as ExtendedAxiosRequestConfig;
    // Get token from localStorage
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (token && extendedConfig.headers) {
      extendedConfig.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    extendedConfig.metadata = { startTime: new Date().getTime() };
    
    return extendedConfig;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Log request duration
    const config = response.config as ExtendedAxiosRequestConfig;
    const start = config.metadata?.startTime || 0;
    const duration = start ? new Date().getTime() - start : 0;
    const method = response.config.method?.toUpperCase() ?? 'GET';

    if (import.meta.env.DEV) {
      console.debug(`API ${method} ${response.config.url} completed in ${duration}ms`);
    }
    
    checkAuthzVersionHeader(response.headers);
    return response;
  },
  async (error) => {
    if (error?.response?.headers) {
      checkAuthzVersionHeader(error.response.headers);
    }

    const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;
    const status = error.response?.status;
    const tokenOutdated =
      (error.response?.headers?.['x-token-outdated'] ?? error.response?.headers?.['X-Token-Outdated']) === 'true';

    const responseData = error.response?.data as ApiResponse | undefined;

    const apiError: ApiError = {
      message: responseData && 'error' in responseData
        ? responseData.error.message
        : error.message || 'Beklenmeyen bir hata oluştu',
      code: responseData && 'error' in responseData
        ? responseData.error.code
        : error.code || 'UNKNOWN_ERROR',
      status: status || 0,
      details: responseData && 'error' in responseData ? responseData.error.details : error.response?.data,
      fields: responseData && 'error' in responseData ? responseData.error.fields : undefined,
      meta: responseData?.meta,
      timestamp: new Date().toISOString(),
    };

    const requestUrl = originalRequest?.url || '';
    const authEndpoints = [
      API_ENDPOINTS.AUTH.LOGIN,
      API_ENDPOINTS.AUTH.REFRESH,
      API_ENDPOINTS.AUTH.LOGOUT,
    ];
    const shouldSkipRefresh = authEndpoints.some((endpoint) => requestUrl.includes(endpoint));

    // Handle 401 Unauthorized - Try to refresh token when applicable
    if ((status === 401 || tokenOutdated) && originalRequest && !originalRequest._retry && !shouldSkipRefresh) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);

        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }

        const baseURL = apiClient.defaults.baseURL?.replace(/\/$/, '') || '';
        const refreshUrl = `${baseURL}${API_ENDPOINTS.AUTH.REFRESH}`;

        const response = await axios.post<ApiResponse<RefreshTokenResponseData>>(
          refreshUrl,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data?.ok) {
          const { accessToken, refreshToken: newRefreshToken, user, session } = response.data.data;

          // Update tokens in localStorage
          localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
          localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, newRefreshToken);

          if (user) {
            try {
              localStorage.setItem(
                AUTH_PROFILE_KEY,
                JSON.stringify({ user, session })
              );
            } catch (storageError) {
              console.warn('Failed to persist refreshed profile:', storageError);
            }

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('auth:profile-updated', {
                  detail: {
                    user,
                    session,
                    accessToken,
                    refreshToken: newRefreshToken,
                  },
                })
              );
            }
          }

          // Retry original request with new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }

        throw new Error('Token refresh response invalid');
      } catch (refreshError) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(apiError);
      }
    }
    
    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// Export configured client
export default apiClient;
