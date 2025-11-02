import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { Family, UserReference, AttributeGroupBinding } from '../../types';

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'] | string;
    })
  | string
  | null;

type BackendAttributeGroupBinding = AttributeGroupBinding;

type BackendFamily = {
  id: string;
  tenantId: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
  nameLanguage: string | null;
  description: string | null;
  descriptionLanguage: string | null;
  parentFamilyId?: string | null;
  hierarchyPath: string[];
  categoryId?: string | null;
  isSystemFamily: boolean;
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

const mapFamily = (family: BackendFamily): Family => ({
  id: family.id,
  key: family.key,
  name: family.name,
  description: family.description ?? null,
  nameLocalizationId: family.nameLocalizationId,
  descriptionLocalizationId: family.descriptionLocalizationId ?? null,
  parentFamilyId: family.parentFamilyId ?? null,
  hierarchyPath: family.hierarchyPath ?? [],
  categoryId: family.categoryId ?? null,
  isSystemFamily: Boolean(family.isSystemFamily),
  attributeGroupIds: family.attributeGroupIds ?? [],
  attributeGroupBindings: family.attributeGroupBindings ?? [],
  attributeGroupCount:
    family.attributeGroupCount ??
    (Array.isArray(family.attributeGroupIds) ? family.attributeGroupIds.length : 0),
  createdAt: family.createdAt,
  updatedAt: family.updatedAt,
  createdBy: mapUser(family.createdBy),
  updatedBy: mapUser(family.updatedBy),
});

export interface FamilyListParams {
  search?: string;
  parentFamilyId?: string;
  limit?: number;
  skip?: number;
}

export const familiesService = {
  async list(params?: FamilyListParams): Promise<{ items: Family[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendFamily[]; total: number }>
    >(API_ENDPOINTS.FAMILIES.BASE, {
      params,
    });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items: items.map(mapFamily),
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<Family> {
    const response = await apiClient.get<ApiSuccessResponse<BackendFamily>>(
      API_ENDPOINTS.FAMILIES.BY_ID(id),
    );
    return mapFamily(response.data.data);
  },

  async create(payload: Record<string, unknown>): Promise<Family> {
    const response = await apiClient.post<ApiSuccessResponse<BackendFamily>>(
      API_ENDPOINTS.FAMILIES.BASE,
      payload,
    );
    return mapFamily(response.data.data);
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Family> {
    const response = await apiClient.put<ApiSuccessResponse<BackendFamily>>(
      API_ENDPOINTS.FAMILIES.BY_ID(id),
      payload,
    );
    return mapFamily(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FAMILIES.BY_ID(id));
  },
};

export type { BackendFamily };
