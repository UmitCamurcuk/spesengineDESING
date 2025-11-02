import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { Association, UserReference } from '../../types';

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'] | string;
    })
  | string
  | null;

type BackendAssociation = {
  id: string;
  tenantId: string;
  associationTypeId: string;
  sourceItemId: string;
  targetItemId: string;
  metadata?: Record<string, unknown> | null;
  orderIndex?: number | null;
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

const mapAssociation = (association: BackendAssociation): Association => ({
  id: association.id,
  associationTypeId: association.associationTypeId,
  sourceItemId: association.sourceItemId,
  targetItemId: association.targetItemId,
  metadata: association.metadata ?? null,
  orderIndex: association.orderIndex ?? null,
  createdAt: association.createdAt,
  updatedAt: association.updatedAt,
  createdBy: mapUser(association.createdBy),
  updatedBy: mapUser(association.updatedBy),
});

export interface AssociationListParams {
  associationTypeId?: string;
  sourceItemId?: string;
  targetItemId?: string;
}

export const associationsService = {
  async list(params?: AssociationListParams): Promise<{ items: Association[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendAssociation[]; total: number }>
    >(API_ENDPOINTS.ASSOCIATIONS.BASE, {
      params,
    });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items: items.map(mapAssociation),
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<Association> {
    const response = await apiClient.get<ApiSuccessResponse<BackendAssociation>>(
      API_ENDPOINTS.ASSOCIATIONS.BY_ID(id),
    );
    return mapAssociation(response.data.data);
  },

  async create(payload: Record<string, unknown>): Promise<Association> {
    const response = await apiClient.post<ApiSuccessResponse<BackendAssociation>>(
      API_ENDPOINTS.ASSOCIATIONS.BASE,
      payload,
    );
    return mapAssociation(response.data.data);
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Association> {
    const response = await apiClient.put<ApiSuccessResponse<BackendAssociation>>(
      API_ENDPOINTS.ASSOCIATIONS.BY_ID(id),
      payload,
    );
    return mapAssociation(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ASSOCIATIONS.BY_ID(id));
  },
};

export type { BackendAssociation };
