import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { AssociationType, AssociationTypeItemRef, UserReference } from '../../types';

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'] | string;
    })
  | string
  | null;

type BackendAssociationTypeItemRef = {
  id: string;
  key: string;
  nameLocalizationId?: string | null;
  name?: string | null;
  nameLanguage?: string | null;
};

type BackendAssociationType = {
  id: string;
  tenantId?: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
  nameLanguage?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
  sourceItemTypeId?: string | null;
  targetItemTypeId?: string | null;
  sourceItemType?: BackendAssociationTypeItemRef | null;
  targetItemType?: BackendAssociationTypeItemRef | null;
  cardinality: AssociationType['cardinality'];
  isRequired: boolean;
  direction: AssociationType['direction'];
  metadataSchema?: Record<string, unknown> | null;
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

const mapAssociationType = (type: BackendAssociationType): AssociationType => ({
  id: type.id,
  tenantId: type.tenantId,
  key: type.key,
  nameLocalizationId: type.nameLocalizationId,
  descriptionLocalizationId: type.descriptionLocalizationId ?? null,
  name: type.name,
  nameLanguage: type.nameLanguage ?? null,
  description: type.description ?? null,
  descriptionLanguage: type.descriptionLanguage ?? null,
  sourceItemTypeId: type.sourceItemTypeId ?? null,
  targetItemTypeId: type.targetItemTypeId ?? null,
  sourceItemType: type.sourceItemType
    ? {
        id: type.sourceItemType.id,
        key: type.sourceItemType.key,
        nameLocalizationId: type.sourceItemType.nameLocalizationId ?? null,
        name: type.sourceItemType.name ?? null,
        nameLanguage: type.sourceItemType.nameLanguage ?? null,
      }
    : null,
  targetItemType: type.targetItemType
    ? {
        id: type.targetItemType.id,
        key: type.targetItemType.key,
        nameLocalizationId: type.targetItemType.nameLocalizationId ?? null,
        name: type.targetItemType.name ?? null,
        nameLanguage: type.targetItemType.nameLanguage ?? null,
      }
    : null,
  cardinality: type.cardinality,
  isRequired: Boolean(type.isRequired),
  direction: type.direction,
  metadataSchema: type.metadataSchema ?? null,
  createdAt: type.createdAt,
  updatedAt: type.updatedAt,
  createdBy: mapUser(type.createdBy),
  updatedBy: mapUser(type.updatedBy),
});

export interface AssociationTypeListParams {
  sourceItemTypeId?: string;
  targetItemTypeId?: string;
}

export interface AssociationTypeCreateRequest {
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  sourceItemTypeId: string;
  targetItemTypeId: string;
  cardinality: AssociationType['cardinality'];
  isRequired?: boolean;
  direction?: AssociationType['direction'];
  metadataSchema?: Record<string, unknown> | null;
}

export interface AssociationTypeUpdateRequest {
  nameLocalizationId?: string;
  descriptionLocalizationId?: string | null;
  cardinality?: AssociationType['cardinality'];
  isRequired?: boolean;
  direction?: AssociationType['direction'];
  metadataSchema?: Record<string, unknown> | null;
  comment?: string;
}

export const associationTypesService = {
  async list(
    params?: AssociationTypeListParams,
  ): Promise<{ items: AssociationType[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendAssociationType[]; total: number }>
    >(API_ENDPOINTS.ASSOCIATION_TYPES.BASE, {
      params,
    });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items: items.map(mapAssociationType),
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<AssociationType> {
    const response = await apiClient.get<ApiSuccessResponse<BackendAssociationType>>(
      API_ENDPOINTS.ASSOCIATION_TYPES.BY_ID(id),
    );
    return mapAssociationType(response.data.data);
  },

  async create(payload: AssociationTypeCreateRequest): Promise<AssociationType> {
    const response = await apiClient.post<ApiSuccessResponse<BackendAssociationType>>(
      API_ENDPOINTS.ASSOCIATION_TYPES.BASE,
      payload,
    );
    return mapAssociationType(response.data.data);
  },

  async update(id: string, payload: AssociationTypeUpdateRequest): Promise<AssociationType> {
    const response = await apiClient.put<ApiSuccessResponse<BackendAssociationType>>(
      API_ENDPOINTS.ASSOCIATION_TYPES.BY_ID(id),
      payload,
    );
    return mapAssociationType(response.data.data);
  },
};
