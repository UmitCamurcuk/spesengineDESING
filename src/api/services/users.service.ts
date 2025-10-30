import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type {
  ApiSuccessResponse,
  UserSummary,
  UserListResponse,
  UserUpdateRequest,
  UserRoleUpdateRequest,
} from '../types/api.types';

interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  status?: 'active' | 'inactive' | 'partial';
  language?: string;
}

interface GetUserParams {
  language?: string;
}

export const usersService = {
  async list(params: ListUsersParams = {}): Promise<UserListResponse> {
    const response = await apiClient.get<ApiSuccessResponse<UserListResponse>>(
      API_ENDPOINTS.USERS.BASE,
      { params },
    );
    return response.data.data;
  },

  async getById(id: string, params: GetUserParams = {}): Promise<UserSummary> {
    const response = await apiClient.get<ApiSuccessResponse<UserSummary>>(
      API_ENDPOINTS.USERS.BY_ID(id),
      { params },
    );
    return response.data.data;
  },

  async update(
    id: string,
    payload: UserUpdateRequest,
    options: { language?: string } = {},
  ): Promise<UserSummary> {
    const response = await apiClient.put<ApiSuccessResponse<UserSummary>>(
      API_ENDPOINTS.USERS.BY_ID(id),
      payload,
      { params: options },
    );
    return response.data.data;
  },

  async updateRole(
    id: string,
    payload: UserRoleUpdateRequest,
    options: { language?: string } = {},
  ): Promise<UserSummary> {
    const response = await apiClient.put<ApiSuccessResponse<UserSummary>>(
      API_ENDPOINTS.USERS.ROLE(id),
      payload,
      { params: options },
    );
    return response.data.data;
  },
};
