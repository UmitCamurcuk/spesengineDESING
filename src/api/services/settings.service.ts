import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse, AppSettings, SettingsPatchPayload } from '../types/api.types';

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const response = await apiClient.get<ApiSuccessResponse<AppSettings>>(API_ENDPOINTS.SETTINGS);
    return response.data.data;
  },

  async updateSettings(payload: SettingsPatchPayload): Promise<AppSettings> {
    const response = await apiClient.put<ApiSuccessResponse<AppSettings>>(API_ENDPOINTS.SETTINGS, payload);
    return response.data.data;
  },
};
