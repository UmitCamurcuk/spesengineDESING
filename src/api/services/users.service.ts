import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type {
  ApiSuccessResponse,
  PaginatedResponse,
  UserSummary,
  UserListResponse,
} from '../types/api.types';

interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
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
};
