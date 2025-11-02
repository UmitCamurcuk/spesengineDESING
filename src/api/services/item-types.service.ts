import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { ItemType, UserReference, AttributeGroupBinding } from '../../types';

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'] | string;
    })
  | string
  | null;

type BackendAttributeGroupBinding = AttributeGroupBinding;

type BackendItemType = {
  id: string;
  tenantId: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
  nameLanguage: string | null;
  description: string | null;
  descriptionLanguage: string | null;
  categoryIds: string[];
  linkedFamilyIds: string[];
  lifecycleStatus: 'draft' | 'active' | 'deprecated';
  isSystemItemType: boolean;
  version: number;
  attributeGroupIds: string[];
  attributeGroupBindings: BackendAttributeGroupBinding[];
  attributeGroupCount: number;
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

const mapItemType = (itemType: BackendItemType): ItemType => ({
  id: itemType.id,
  key: itemType.key,
  name: itemType.name,
  description: itemType.description ?? null,
  nameLocalizationId: itemType.nameLocalizationId,
  descriptionLocalizationId: itemType.descriptionLocalizationId ?? null,
  categoryIds: itemType.categoryIds ?? [],
  linkedFamilyIds: itemType.linkedFamilyIds ?? [],
  lifecycleStatus: itemType.lifecycleStatus,
  isSystemItemType: Boolean(itemType.isSystemItemType),
  version: itemType.version,
  attributeGroupIds: itemType.attributeGroupIds ?? [],
  attributeGroupBindings: itemType.attributeGroupBindings ?? [],
  attributeGroupCount:
    itemType.attributeGroupCount ??
    (Array.isArray(itemType.attributeGroupIds) ? itemType.attributeGroupIds.length : 0),
  createdAt: itemType.createdAt,
  updatedAt: itemType.updatedAt,
  createdBy: mapUser(itemType.createdBy),
  updatedBy: mapUser(itemType.updatedBy),
});

export interface ItemTypeListParams {
  search?: string;
  limit?: number;
  skip?: number;
}

export const itemTypesService = {
  async list(params?: ItemTypeListParams): Promise<{ items: ItemType[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendItemType[]; total: number }>
    >(API_ENDPOINTS.ITEM_TYPES.BASE, {
      params,
    });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items: items.map(mapItemType),
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<ItemType> {
    const response = await apiClient.get<ApiSuccessResponse<BackendItemType>>(
      API_ENDPOINTS.ITEM_TYPES.BY_ID(id),
    );
    return mapItemType(response.data.data);
  },

  async create(payload: Record<string, unknown>): Promise<ItemType> {
    const response = await apiClient.post<ApiSuccessResponse<BackendItemType>>(
      API_ENDPOINTS.ITEM_TYPES.BASE,
      payload,
    );
    return mapItemType(response.data.data);
  },

  async update(id: string, payload: Record<string, unknown>): Promise<ItemType> {
    const response = await apiClient.put<ApiSuccessResponse<BackendItemType>>(
      API_ENDPOINTS.ITEM_TYPES.BY_ID(id),
      payload,
    );
    return mapItemType(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ITEM_TYPES.BY_ID(id));
  },
};

export type { BackendItemType };
