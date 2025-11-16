import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { Category, UserReference, AttributeGroupBinding } from '../../types';

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'] | string;
    })
  | string
  | null;

type BackendAttributeGroupBinding = AttributeGroupBinding;

type BackendCategory = {
  id: string;
  tenantId: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
  nameLanguage: string | null;
  description: string | null;
  descriptionLanguage: string | null;
  parentCategoryId?: string | null;
  hierarchyPath: string[];
  defaultItemTypeId?: string | null;
  linkedItemTypeIds: string[];
  linkedFamilyIds: string[];
  isSystemCategory: boolean;
  allowItemCreation: boolean;
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

const mapCategory = (category: BackendCategory): Category => ({
  id: category.id,
  key: category.key,
  name: category.name,
  description: category.description ?? undefined,
  nameLocalizationId: category.nameLocalizationId,
  descriptionLocalizationId: category.descriptionLocalizationId ?? null,
  parentCategoryId: category.parentCategoryId ?? null,
  hierarchyPath: category.hierarchyPath ?? [],
  defaultItemTypeId: category.defaultItemTypeId ?? null,
  linkedItemTypeIds: category.linkedItemTypeIds ?? [],
  linkedFamilyIds: category.linkedFamilyIds ?? [],
  isSystemCategory: Boolean(category.isSystemCategory),
  allowItemCreation: Boolean(category.allowItemCreation),
  attributeGroupIds: category.attributeGroupIds ?? [],
  attributeGroupBindings: category.attributeGroupBindings ?? [],
  attributeGroupCount:
    category.attributeGroupCount ??
    (Array.isArray(category.attributeGroupIds) ? category.attributeGroupIds.length : 0),
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
  createdBy: mapUser(category.createdBy),
  updatedBy: mapUser(category.updatedBy),
});

export interface CategoryListParams {
  search?: string;
  parentCategoryId?: string;
  itemTypeId?: string;
  limit?: number;
  skip?: number;
}

export const categoriesService = {
  async list(params?: CategoryListParams): Promise<{ items: Category[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendCategory[]; total: number }>
    >(API_ENDPOINTS.CATEGORIES.BASE, {
      params,
    });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items: items.map(mapCategory),
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<Category> {
    const response = await apiClient.get<ApiSuccessResponse<BackendCategory>>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id),
    );
    return mapCategory(response.data.data);
  },

  async create(payload: Record<string, unknown>): Promise<Category> {
    const response = await apiClient.post<ApiSuccessResponse<BackendCategory>>(
      API_ENDPOINTS.CATEGORIES.BASE,
      payload,
    );
    return mapCategory(response.data.data);
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Category> {
    const response = await apiClient.put<ApiSuccessResponse<BackendCategory>>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id),
      payload,
    );
    return mapCategory(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  },
};

export type { BackendCategory };
