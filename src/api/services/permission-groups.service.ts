import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type {
  ApiSuccessResponse,
  PermissionGroupRecord,
  PermissionGroupListResponse,
  PermissionGroupCreateRequest,
  PermissionGroupUpdateRequest,
} from '../types/api.types';

export const permissionGroupsService = {
  async list(
    params: { page?: number; pageSize?: number; search?: string; language?: string } = {},
  ): Promise<PermissionGroupListResponse> {
    const response = await apiClient.get<ApiSuccessResponse<PermissionGroupListResponse>>(
      API_ENDPOINTS.PERMISSION_GROUPS.BASE,
      { params },
    );
    return response.data.data;
  },

  async getById(id: string, options: { language?: string } = {}): Promise<PermissionGroupRecord> {
    const response = await apiClient.get<ApiSuccessResponse<PermissionGroupRecord>>(
      API_ENDPOINTS.PERMISSION_GROUPS.BY_ID(id),
      { params: options },
    );
    return response.data.data;
  },

  async create(payload: PermissionGroupCreateRequest): Promise<PermissionGroupRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PermissionGroupRecord>>(
      API_ENDPOINTS.PERMISSION_GROUPS.BASE,
      payload,
    );
    return response.data.data;
  },

  async update(
    id: string,
    payload: PermissionGroupUpdateRequest,
    comment: string,
  ): Promise<PermissionGroupRecord> {
    const response = await apiClient.put<ApiSuccessResponse<PermissionGroupRecord>>(
      API_ENDPOINTS.PERMISSION_GROUPS.BY_ID(id),
      { ...payload, comment },
    );
    return response.data.data;
  },

  async delete(id: string, comment: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PERMISSION_GROUPS.BY_ID(id), { data: { comment } });
  },
};
