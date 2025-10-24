import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type {
  ApiSuccessResponse,
  LocalizationListParams,
  LocalizationListResponse,
  LocalizationRecord,
  CreateLocalizationRequest,
  UpdateLocalizationRequest,
} from '../types/api.types';

export const localizationsService = {
  async list(params: LocalizationListParams = {}): Promise<LocalizationListResponse> {
    const response = await apiClient.get<ApiSuccessResponse<LocalizationListResponse>>(
      API_ENDPOINTS.LOCALIZATIONS.BASE,
      { params },
    );
    return response.data.data;
  },

  async getById(id: string): Promise<LocalizationRecord> {
    const response = await apiClient.get<ApiSuccessResponse<LocalizationRecord>>(
      API_ENDPOINTS.LOCALIZATIONS.BY_ID(id),
    );
    return response.data.data;
  },

  async create(payload: CreateLocalizationRequest): Promise<LocalizationRecord> {
    const response = await apiClient.post<ApiSuccessResponse<LocalizationRecord>>(
      API_ENDPOINTS.LOCALIZATIONS.BASE,
      payload,
    );
    return response.data.data;
  },

  async update(id: string, payload: UpdateLocalizationRequest): Promise<LocalizationRecord> {
    const response = await apiClient.put<ApiSuccessResponse<LocalizationRecord>>(
      API_ENDPOINTS.LOCALIZATIONS.BY_ID(id),
      payload,
    );
    return response.data.data;
  },
};
