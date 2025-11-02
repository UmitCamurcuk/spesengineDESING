import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { Item, UserReference } from '../../types';

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'] | string;
    })
  | string
  | null;

type BackendItem = {
  id: string;
  tenantId: string;
  itemTypeId: string | null;
  categoryId?: string | null;
  familyId?: string | null;
  code: string;
  externalCode?: string | null;
  sku?: string | null;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
  nameLanguage: string | null;
  description: string | null;
  descriptionLanguage: string | null;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: BackendUserSummary;
  updatedBy?: BackendUserSummary;
};

const mapUser = (user?: BackendUserSummary): UserReference | string | null => {
  if (user === undefined || user === null) {
    return null;
  }
  if (typeof user === 'string') {
    return user;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profilePhotoUrl: user.profilePhotoUrl,
    role: user.role,
  };
};

const mapItem = (item: BackendItem): Item => ({
  id: item.id,
  itemTypeId: item.itemTypeId,
  categoryId: item.categoryId ?? null,
  familyId: item.familyId ?? null,
  code: item.code,
  externalCode: item.externalCode ?? null,
  sku: item.sku ?? null,
  name: item.name,
  nameLocalizationId: item.nameLocalizationId,
  descriptionLocalizationId: item.descriptionLocalizationId ?? null,
  description: item.description ?? null,
  status: item.status,
  version: item.version,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  createdBy: mapUser(item.createdBy),
  updatedBy: mapUser(item.updatedBy),
});

export interface ItemListParams {
  search?: string;
  itemTypeId?: string;
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  limit?: number;
  skip?: number;
}

export const itemsService = {
  async list(params?: ItemListParams): Promise<{ items: Item[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendItem[]; total: number }>
    >(API_ENDPOINTS.ITEMS.BASE, {
      params,
    });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items: items.map(mapItem),
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<Item> {
    const response = await apiClient.get<ApiSuccessResponse<BackendItem>>(
      API_ENDPOINTS.ITEMS.BY_ID(id),
    );
    return mapItem(response.data.data);
  },

  async create(payload: Record<string, unknown>): Promise<Item> {
    const response = await apiClient.post<ApiSuccessResponse<BackendItem>>(
      API_ENDPOINTS.ITEMS.BASE,
      payload,
    );
    return mapItem(response.data.data);
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Item> {
    const response = await apiClient.put<ApiSuccessResponse<BackendItem>>(
      API_ENDPOINTS.ITEMS.BY_ID(id),
      payload,
    );
    return mapItem(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ITEMS.BY_ID(id));
  },
};
