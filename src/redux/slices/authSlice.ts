import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../api/services/auth.service';
import {
  ApiError,
  ApiMeta,
  AuthUser,
  LoginRequest,
  LoginResponse,
  LoginResponseData,
  TokenInfo,
} from '../../api/types/api.types';
import { env } from '../../config/env';
import { resolveAssetUrl } from '../../utils/url';

const tokenStorageKey = env.AUTH_TOKEN_KEY;
const refreshTokenStorageKey = env.AUTH_REFRESH_TOKEN_KEY;
const profileStorageKey = env.AUTH_PROFILE_KEY;
const assetBaseUrl = (env.ASSET_BASE_URL || env.API_BASE_URL).replace(/\/$/, '');
const preferRelativeAssets = import.meta.env.DEV && assetBaseUrl.includes('localhost:8080');

const safeGetItem = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Unable to access localStorage:', error);
    return null;
  }
};

const safeParseJSON = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse JSON from localStorage:', error);
    return null;
  }
};

type StoredProfile = {
  user: AuthUser | null;
  session?: TokenInfo | null;
};

const normalizeUserProfile = (user: AuthUser | null): AuthUser | null => {
  if (!user) {
    return null;
  }

  const resolved = resolveAssetUrl(user.profilePhotoUrl, assetBaseUrl);
  let normalizedPhotoUrl = resolved;

  if (resolved && preferRelativeAssets) {
    try {
      const parsed = new URL(resolved, assetBaseUrl);
      normalizedPhotoUrl = parsed.pathname + parsed.search;
    } catch {
      normalizedPhotoUrl = resolved;
    }
  }

  return {
    ...user,
    profilePhotoUrl: normalizedPhotoUrl,
  };
};

const profileFromStorage = safeParseJSON<StoredProfile>(safeGetItem(profileStorageKey));
const initialAccessToken = safeGetItem(tokenStorageKey);
const initialRefreshToken = safeGetItem(refreshTokenStorageKey);
const initialUser = normalizeUserProfile(profileFromStorage?.user ?? null);
const initialSession = profileFromStorage?.session ?? null;

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  session: TokenInfo | null;
  meta: ApiMeta | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  fieldErrors: Record<string, string>;
}

const initialState: AuthState = {
  user: initialUser,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  session: initialSession,
  meta: null,
  status: 'idle',
  error: null,
  fieldErrors: {},
};

export const loginThunk = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: ApiError }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    return response;
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: ApiError }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

const persistTokens = ({ accessToken, refreshToken }: LoginResponseData) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(tokenStorageKey, accessToken);
      localStorage.setItem(refreshTokenStorageKey, refreshToken);
    }
  } catch (error) {
    console.warn('Failed to persist auth tokens:', error);
  }
};

const clearPersistedTokens = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(tokenStorageKey);
      localStorage.removeItem(refreshTokenStorageKey);
    }
  } catch (error) {
    console.warn('Failed to clear auth tokens:', error);
  }
};

const persistProfile = (user: AuthUser | null, session: TokenInfo | null) => {
  try {
    if (typeof window !== 'undefined') {
      if (user || session) {
        const payload: StoredProfile = { user, session };
        localStorage.setItem(profileStorageKey, JSON.stringify(payload));
      } else {
        localStorage.removeItem(profileStorageKey);
      }
    }
  } catch (error) {
    console.warn('Failed to persist auth profile:', error);
  }
};

const clearPersistedProfile = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(profileStorageKey);
    }
  } catch (error) {
    console.warn('Failed to clear auth profile:', error);
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: AuthUser | null; session?: TokenInfo | null }>) => {
      state.user = normalizeUserProfile(action.payload.user ?? null);
      if (action.payload.session !== undefined) {
        state.session = action.payload.session;
      }
      persistProfile(state.user, state.session);
    },
    resetAuthState: () => {
      clearPersistedTokens();
      clearPersistedProfile();
      return {
        user: null,
        session: null,
        accessToken: null,
        refreshToken: null,
        meta: null,
        status: 'idle',
        error: null,
        fieldErrors: {},
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.fieldErrors = {};
        state.user = null;
        state.session = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.meta = action.payload.meta;
        state.fieldErrors = {};

        const tokens = action.payload.data;
        state.accessToken = tokens.accessToken;
        state.refreshToken = tokens.refreshToken;

        persistTokens(tokens);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Giriş başarısız oldu';
        state.fieldErrors = (action.payload?.fields || []).reduce<Record<string, string>>(
          (acc, fieldError) => {
            acc[fieldError.path] = fieldError.message;
            return acc;
          },
          {}
        );
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        clearPersistedTokens();
        clearPersistedProfile();
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.session = null;
        state.meta = null;
        state.status = 'idle';
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(logoutThunk.rejected, (state) => {
        // Even if the API logout fails, ensure local state is cleared
        clearPersistedTokens();
        clearPersistedProfile();
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.session = null;
        state.meta = null;
        state.status = 'idle';
        state.fieldErrors = {};
      });
  },
});

export const { setUser, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
