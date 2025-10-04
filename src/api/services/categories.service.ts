import apiClient from '../client/axios';
import { API_ENDPOINTS, buildUrl } from '../endpoints';
import {
  Category,
  SearchParams,
  ServiceResponse,
  ServicePaginatedResponse,
} from '../types/api.types';

export const categoriesService = {
  // Get all categories with pagination and filters
  getAll: async (params?: SearchParams): Promise<ServicePaginatedResponse<Category>> => {
    const url = buildUrl(API_ENDPOINTS.CATEGORIES.BASE, params);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get category by ID
  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id));
    return response.data;
  },

  // Create new category
  create: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post<Category>(API_ENDPOINTS.CATEGORIES.BASE, data);
    return response.data;
  },

  // Update category
  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put<Category>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id),
      data
    );
    return response.data;
  },

  // Delete category
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  },

  // Get category tree (hierarchical structure)
  getTree: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>(API_ENDPOINTS.CATEGORIES.TREE);
    return response.data;
  },

  // Get children of a category
  getChildren: async (id: string, params?: SearchParams): Promise<ServicePaginatedResponse<Category>> => {
    const url = buildUrl(API_ENDPOINTS.CATEGORIES.CHILDREN(id), params);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get items in a category
  getItems: async (id: string, params?: SearchParams): Promise<ServicePaginatedResponse<any>> => {
    const url = buildUrl(API_ENDPOINTS.CATEGORIES.ITEMS(id), params);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get families in a category
  getFamilies: async (id: string, params?: SearchParams): Promise<ServicePaginatedResponse<any>> => {
    const url = buildUrl(API_ENDPOINTS.CATEGORIES.FAMILIES(id), params);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Move category to different parent
  move: async (id: string, newParentId: string | null): Promise<Category> => {
    const response = await apiClient.patch<Category>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id),
      { parentId: newParentId }
    );
    return response.data;
  },

  // Search categories
  search: async (query: string, params?: SearchParams): Promise<ServicePaginatedResponse<Category>> => {
    const searchParams = { ...params, search: query };
    const url = buildUrl(API_ENDPOINTS.SEARCH.CATEGORIES, searchParams);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get category statistics
  getStats: async (id: string): Promise<{
    totalItems: number;
    totalFamilies: number;
    totalSubcategories: number;
    lastUpdated: string;
  }> => {
    const response = await apiClient.get(`${API_ENDPOINTS.CATEGORIES.BY_ID(id)}/stats`);
    return response.data;
  },

  // Bulk operations
  bulkUpdate: async (updates: Array<{ id: string; data: Partial<Category> }>): Promise<void> => {
    await apiClient.post('/categories/bulk-update', { updates });
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiClient.post('/categories/bulk-delete', { ids });
  },

  // Export categories
  export: async (params?: SearchParams): Promise<Blob> => {
    const url = buildUrl('/categories/export', params);
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import categories
  import: async (file: File): Promise<{ success: number; errors: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/categories/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
