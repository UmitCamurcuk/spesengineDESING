import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type {
  ApiSuccessResponse,
  RoleRecord,
  RoleWithPermissions,
  RoleListResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
} from '../types/api.types';

export const rolesService = {
  async list(): Promise<RoleRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<RoleListResponse>>(
      API_ENDPOINTS.ROLES.BASE,
    );
    return response.data.data.items;
  },

  async getById(id: string): Promise<RoleWithPermissions> {
    const response = await apiClient.get<ApiSuccessResponse<RoleWithPermissions>>(
      API_ENDPOINTS.ROLES.BY_ID(id),
    );
    return response.data.data;
  },

  async create(payload: RoleCreateRequest): Promise<RoleRecord> {
    const response = await apiClient.post<ApiSuccessResponse<RoleRecord>>(
      API_ENDPOINTS.ROLES.BASE,
      payload,
    );
    return response.data.data;
  },

  async update(id: string, payload: RoleUpdateRequest): Promise<RoleRecord> {
    const response = await apiClient.put<ApiSuccessResponse<RoleRecord>>(
      API_ENDPOINTS.ROLES.BY_ID(id),
      payload,
    );
    return response.data.data;
  },

  async getPermissions(id: string): Promise<string[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ permissions: string[] }>>(
      API_ENDPOINTS.ROLES.PERMISSIONS(id),
    );
    return response.data.data.permissions;
  },
};

