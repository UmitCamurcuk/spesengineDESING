import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import { Attribute, AttributeType } from '../../types';

type BackendAttribute = {
  id: string;
  tenantId: string;
  key: string;
  type: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string;
  helpTextLocalizationId?: string;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: unknown;
  validationRules?: Record<string, unknown> | null;
  uiSettings?: Record<string, unknown> | null;
  tags?: string[];
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

const mapAttribute = (attribute: BackendAttribute): Attribute => ({
  id: attribute.id,
  name: attribute.key,
  type: (attribute.type as AttributeType) ?? AttributeType.TEXT,
  required: attribute.isRequired,
  options: Array.isArray(attribute.tags) ? attribute.tags : undefined,
  defaultValue: attribute.defaultValue,
  validation: attribute.validationRules ?? undefined,
  description: attribute.descriptionLocalizationId,
  createdAt: attribute.createdAt,
  updatedAt: attribute.updatedAt,
});

export const attributesService = {
  async list(): Promise<Attribute[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: BackendAttribute[]; total: number }>>(
      API_ENDPOINTS.ATTRIBUTES.BASE,
    );
    const items = Array.isArray(response.data.data?.items) ? response.data.data.items : [];
    return items.map(mapAttribute);
  },

  async getById(id: string): Promise<Attribute> {
    const response = await apiClient.get<ApiSuccessResponse<BackendAttribute>>(API_ENDPOINTS.ATTRIBUTES.BY_ID(id));
    return mapAttribute(response.data.data);
  },

  async create(payload: Partial<BackendAttribute>): Promise<Attribute> {
    const response = await apiClient.post<ApiSuccessResponse<BackendAttribute>>(
      API_ENDPOINTS.ATTRIBUTES.BASE,
      payload,
    );
    return mapAttribute(response.data.data);
  },

  async update(id: string, payload: Partial<BackendAttribute>): Promise<Attribute> {
    const response = await apiClient.put<ApiSuccessResponse<BackendAttribute>>(
      API_ENDPOINTS.ATTRIBUTES.BY_ID(id),
      payload,
    );
    return mapAttribute(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ATTRIBUTES.BY_ID(id));
  },
};

export type { BackendAttribute };
