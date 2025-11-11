import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  MeResponse,
  MeResponseData,
  RefreshTokenResponse,
  ProfilePhotoResponse,
  ProfilePhotoResponseData,
  ApiSuccessResponse,
} from '../types/api.types';

export const authService = {
  // Login user
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return response.data;
  },

  // Logout user
  logout: async (options?: { refreshToken?: string | null; allSessions?: boolean }): Promise<void> => {
    const refreshTokenStorageKey = import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token';
    const storedRefreshToken =
      options?.refreshToken ??
      (typeof window !== 'undefined' ? localStorage.getItem(refreshTokenStorageKey) : null);

    const payload =
      storedRefreshToken && storedRefreshToken.length > 0
        ? { refreshToken: storedRefreshToken }
        : { allSessions: options?.allSessions ?? true };

    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, payload);

    // Clear tokens from localStorage
    localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token');
    localStorage.removeItem(refreshTokenStorageKey);
    localStorage.removeItem(import.meta.env.VITE_AUTH_PROFILE_KEY || 'spes_auth_profile');
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<MeResponseData> => {
    const response = await apiClient.get<MeResponse>(API_ENDPOINTS.AUTH.ME);
    return response.data.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<AuthUser>): Promise<AuthUser> => {
    const response = await apiClient.put<ApiSuccessResponse<AuthUser>>(
      API_ENDPOINTS.USERS.ME,
      data
    );
    return response.data.data;
  },

  // Upload profile photo
  uploadProfilePhoto: async (file: File): Promise<ProfilePhotoResponseData> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ProfilePhotoResponse>(
      API_ENDPOINTS.USERS.PROFILE_PHOTO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  },

  // Update existing profile photo
  updateProfilePhoto: async (file: File): Promise<ProfilePhotoResponseData> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.put<ProfilePhotoResponse>(
      API_ENDPOINTS.USERS.PROFILE_PHOTO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  },

  // Delete profile photo
  deleteProfilePhoto: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USERS.PROFILE_PHOTO);
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token');
    return !!token;
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token');
  },

  // Get stored refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem(import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token');
  },

  // Store tokens
  setTokens: (token: string, refreshToken: string): void => {
    localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token', token);
    localStorage.setItem(import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token', refreshToken);
  },

  // Clear all auth data
  clearAuth: (): void => {
    localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token');
    localStorage.removeItem(import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token');
    localStorage.removeItem(import.meta.env.VITE_AUTH_PROFILE_KEY || 'spes_auth_profile');
  },
};
