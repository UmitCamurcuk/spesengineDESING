import apiClient from '../client/axios';
import { API_ENDPOINTS, buildUrl } from '../endpoints';
import {
  User,
  SearchParams,
  ServiceResponse,
  ServicePaginatedResponse,
} from '../types/api.types';

export const usersService = {
  // Get all users with pagination and filters
  getAll: async (params?: SearchParams): Promise<ServicePaginatedResponse<User>> => {
    const url = buildUrl(API_ENDPOINTS.USERS.BASE, params);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(API_ENDPOINTS.USERS.BY_ID(id));
    return response.data;
  },

  // Create new user
  create: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.post<User>(API_ENDPOINTS.USERS.BASE, data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(
      API_ENDPOINTS.USERS.BY_ID(id),
      data
    );
    return response.data;
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USERS.BY_ID(id));
  },

  // Get user profile
  getProfile: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(API_ENDPOINTS.USERS.PROFILE(id));
    return response.data;
  },

  // Update user profile
  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(
      API_ENDPOINTS.USERS.PROFILE(id),
      data
    );
    return response.data;
  },

  // Get user roles
  getRoles: async (id: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(API_ENDPOINTS.USERS.ROLES(id));
    return response.data;
  },

  // Assign roles to user
  assignRoles: async (id: string, roleIds: string[]): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.USERS.ROLES(id), { roleIds });
  },

  // Remove roles from user
  removeRoles: async (id: string, roleIds: string[]): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USERS.ROLES(id), { data: { roleIds } });
  },

  // Get user permissions
  getPermissions: async (id: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(API_ENDPOINTS.USERS.PERMISSIONS(id));
    return response.data;
  },

  // Activate user
  activate: async (id: string): Promise<User> => {
    const response = await apiClient.patch<User>(
      API_ENDPOINTS.USERS.BY_ID(id),
      { isActive: true }
    );
    return response.data;
  },

  // Deactivate user
  deactivate: async (id: string): Promise<User> => {
    const response = await apiClient.patch<User>(
      API_ENDPOINTS.USERS.BY_ID(id),
      { isActive: false }
    );
    return response.data;
  },

  // Reset user password
  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.USERS.BY_ID(id)}/reset-password`, {
      newPassword,
    });
  },

  // Search users
  search: async (query: string, params?: SearchParams): Promise<ServicePaginatedResponse<User>> => {
    const searchParams = { ...params, search: query };
    const url = buildUrl(API_ENDPOINTS.SEARCH.USERS, searchParams);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get user statistics
  getStats: async (id: string): Promise<{
    totalLogins: number;
    lastLoginAt: string;
    totalActions: number;
    isActive: boolean;
  }> => {
    const response = await apiClient.get(`${API_ENDPOINTS.USERS.BY_ID(id)}/stats`);
    return response.data;
  },

  // Bulk operations
  bulkUpdate: async (updates: Array<{ id: string; data: Partial<User> }>): Promise<void> => {
    await apiClient.post('/users/bulk-update', { updates });
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiClient.post('/users/bulk-delete', { ids });
  },

  // Export users
  export: async (params?: SearchParams): Promise<Blob> => {
    const url = buildUrl('/users/export', params);
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import users
  import: async (file: File): Promise<{ success: number; errors: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

