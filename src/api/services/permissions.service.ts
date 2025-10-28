import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type {
  ApiSuccessResponse,
  PermissionRecord,
  PermissionListResponse,
  PermissionCreateRequest,
  PermissionUpdateRequest,
} from '../types/api.types';

export const permissionsService = {
  async list(
    params: { page?: number; pageSize?: number; search?: string; permissionGroupId?: string; language?: string } = {},
  ): Promise<PermissionListResponse> {
    const response = await apiClient.get<ApiSuccessResponse<PermissionListResponse>>(
      API_ENDPOINTS.PERMISSIONS.BASE,
      { params },
    );
    return response.data.data;
  },

  async getById(id: string, options: { language?: string } = {}): Promise<PermissionRecord> {
    const response = await apiClient.get<ApiSuccessResponse<PermissionRecord>>(
      API_ENDPOINTS.PERMISSIONS.BY_ID(id),
      { params: options },
    );
    return response.data.data;
  },

  async create(payload: PermissionCreateRequest): Promise<PermissionRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PermissionRecord>>(
      API_ENDPOINTS.PERMISSIONS.BASE,
      payload,
    );
    return response.data.data;
  },

  async update(
    id: string,
    payload: PermissionUpdateRequest,
    comment: string,
  ): Promise<PermissionRecord> {
    const response = await apiClient.put<ApiSuccessResponse<PermissionRecord>>(
      API_ENDPOINTS.PERMISSIONS.BY_ID(id),
      { ...payload, comment },
    );
    return response.data.data;
  },

  async delete(id: string, comment: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PERMISSIONS.BY_ID(id), { data: { comment } });
  },
};


