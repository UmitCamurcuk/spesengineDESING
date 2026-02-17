import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { Backup, BackupSettingsData, StorageSettings } from '../../types';

export const backupsService = {
  list: async (params?: { page?: number; pageSize?: number }) => {
    const response = await apiClient.get(API_ENDPOINTS.BACKUPS.BASE, { params });
    return response.data.data as {
      items: Backup[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(API_ENDPOINTS.BACKUPS.BY_ID(id));
    return response.data.data as Backup;
  },

  trigger: async () => {
    const response = await apiClient.post(API_ENDPOINTS.BACKUPS.TRIGGER);
    return response.data.data as { backupId: string; message: string };
  },

  updateSettings: async (payload: Partial<BackupSettingsData>) => {
    const response = await apiClient.patch(API_ENDPOINTS.BACKUPS.SETTINGS, payload);
    return response.data.data as { backup: BackupSettingsData };
  },

  updateStorageSettings: async (payload: Partial<StorageSettings>) => {
    const response = await apiClient.patch(API_ENDPOINTS.BACKUPS.STORAGE, payload);
    return response.data.data as { storage: StorageSettings };
  },

  testMinio: async (config: StorageSettings['minio']) => {
    const response = await apiClient.post(API_ENDPOINTS.BACKUPS.TEST_MINIO, config);
    return response.data.data as { ok: boolean; latencyMs: number };
  },
};
