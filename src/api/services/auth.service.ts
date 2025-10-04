import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  ServiceResponse,
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
  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    
    // Clear tokens from localStorage
    localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token');
    localStorage.removeItem(import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token');
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
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(
      API_ENDPOINTS.AUTH.PROFILE,
      data
    );
    return response.data;
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
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
  },
};
