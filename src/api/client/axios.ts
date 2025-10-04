import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '../types/api.types';

// Create axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date().getTime() };
    
    return config;
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
    const duration = new Date().getTime() - (response.config.metadata?.startTime || 0);
    console.log(`API Request completed in ${duration}ms:`, response.config.url);
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(
          import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token'
        );
        
        if (refreshToken) {
          const response = await axios.post('/auth/refresh', {
            refreshToken
          });
          
          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens in localStorage
          localStorage.setItem(
            import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token',
            token
          );
          localStorage.setItem(
            import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token',
            newRefreshToken
          );
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'spes_auth_token');
        localStorage.removeItem(import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY || 'spes_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Normalize error response
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 0,
      details: error.response?.data?.details || error.response?.data,
      timestamp: new Date().toISOString(),
    };
    
    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// Export configured client
export default apiClient;
