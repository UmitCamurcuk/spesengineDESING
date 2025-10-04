import apiClient from '../client/axios';
import { API_ENDPOINTS, buildUrl } from '../endpoints';
import {
  Item,
  SearchParams,
  ServiceResponse,
  ServicePaginatedResponse,
} from '../types/api.types';

export const itemsService = {
  // Get all items with pagination and filters
  getAll: async (params?: SearchParams): Promise<ServicePaginatedResponse<Item>> => {
    const url = buildUrl(API_ENDPOINTS.ITEMS.BASE, params);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get item by ID
  getById: async (id: string): Promise<Item> => {
    const response = await apiClient.get<Item>(API_ENDPOINTS.ITEMS.BY_ID(id));
    return response.data;
  },

  // Create new item
  create: async (data: Partial<Item>): Promise<Item> => {
    const response = await apiClient.post<Item>(API_ENDPOINTS.ITEMS.BASE, data);
    return response.data;
  },

  // Update item
  update: async (id: string, data: Partial<Item>): Promise<Item> => {
    const response = await apiClient.put<Item>(
      API_ENDPOINTS.ITEMS.BY_ID(id),
      data
    );
    return response.data;
  },

  // Delete item
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ITEMS.BY_ID(id));
  },

  // Get item attributes
  getAttributes: async (id: string): Promise<Record<string, any>> => {
    const response = await apiClient.get(API_ENDPOINTS.ITEMS.ATTRIBUTES(id));
    return response.data;
  },

  // Update item attributes
  updateAttributes: async (
    id: string,
    attributes: Record<string, any>
  ): Promise<Record<string, any>> => {
    const response = await apiClient.put(
      API_ENDPOINTS.ITEMS.ATTRIBUTES(id),
      attributes
    );
    return response.data;
  },

  // Get item associations
  getAssociations: async (id: string): Promise<any[]> => {
    const response = await apiClient.get(API_ENDPOINTS.ITEMS.ASSOCIATIONS(id));
    return response.data;
  },

  // Create item association
  createAssociation: async (
    id: string,
    targetId: string,
    type: string,
    metadata?: Record<string, any>
  ): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.ITEMS.ASSOCIATIONS(id), {
      targetId,
      type,
      metadata,
    });
    return response.data;
  },

  // Get item history
  getHistory: async (id: string): Promise<any[]> => {
    const response = await apiClient.get(API_ENDPOINTS.ITEMS.HISTORY(id));
    return response.data;
  },

  // Bulk update items
  bulkUpdate: async (updates: Array<{ id: string; data: Partial<Item> }>): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.ITEMS.BULK_UPDATE, { updates });
  },

  // Bulk delete items
  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.ITEMS.BULK_DELETE, { ids });
  },

  // Export items
  export: async (params?: SearchParams): Promise<Blob> => {
    const url = buildUrl(API_ENDPOINTS.ITEMS.EXPORT, params);
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import items
  import: async (file: File): Promise<{ success: number; errors: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(API_ENDPOINTS.ITEMS.IMPORT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Search items
  search: async (query: string, params?: SearchParams): Promise<ServicePaginatedResponse<Item>> => {
    const searchParams = { ...params, search: query };
    const url = buildUrl(API_ENDPOINTS.SEARCH.ITEMS, searchParams);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get items by category
  getByCategory: async (categoryId: string, params?: SearchParams): Promise<ServicePaginatedResponse<Item>> => {
    const url = buildUrl(API_ENDPOINTS.CATEGORIES.ITEMS(categoryId), params);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get items by family
  getByFamily: async (familyId: string, params?: SearchParams): Promise<ServicePaginatedResponse<Item>> => {
    const url = buildUrl(API_ENDPOINTS.FAMILIES.ITEMS(familyId), params);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get items by type
  getByType: async (typeId: string, params?: SearchParams): Promise<ServicePaginatedResponse<Item>> => {
    const url = buildUrl(API_ENDPOINTS.ITEM_TYPES.ITEMS(typeId), params);
    const response = await apiClient.get(url);
    return response.data;
  },
};
