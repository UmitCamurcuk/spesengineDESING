import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import { AttributeGroup, Attribute, UserReference, AttributeType } from '../../types';

type BackendLocalizationPayload = {
  value: string;
  language: string | null;
  translations?: Record<string, string>;
} | null;

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'] | string;
    })
  | string
  | null;

type BackendAttributeGroup = {
  id: string;
  tenantId: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  noteLocalizationId?: string | null;
  name: string;
  nameLanguage: string | null;
  description: string | null;
  descriptionLanguage: string | null;
  note: string | null;
  noteLanguage: string | null;
  attributeIds: string[];
  attributeCount: number;
  displayOrder: number;
  tags?: string[];
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: BackendUserSummary;
  updatedBy?: BackendUserSummary;
  attributes?: BackendAttributeSummary[];
};

type BackendAttributeSummary = {
  id: string;
  key?: string;
  type: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  helpTextLocalizationId?: string | null;
  name: string;
  description?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: unknown;
  validationRules?: Record<string, unknown> | null;
  uiSettings?: Record<string, unknown> | null;
  options?: string[] | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
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

const mapAttributeSummary = (attribute: BackendAttributeSummary): Attribute => ({
  id: attribute.id,
  key: attribute.key,
  name: attribute.name,
  type: (attribute.type as AttributeType) ?? AttributeType.TEXT,
  required: attribute.isRequired,
  unique: attribute.isUnique,
  defaultValue: attribute.defaultValue ?? undefined,
  validation: attribute.validationRules ?? null,
  description: attribute.description ?? undefined,
  helpText: attribute.helpText ?? null,
  options: Array.isArray((attribute as any).options)
    ? ((attribute as any).options as string[])
    : undefined,
  tags: attribute.tags ?? [],
  createdAt: attribute.createdAt,
  updatedAt: attribute.updatedAt,
  uiSettings: attribute.uiSettings ?? null,
});

const mapAttributeGroup = (group: BackendAttributeGroup): AttributeGroup => ({
  id: group.id,
  key: group.key,
  name: group.name,
  description: group.description ?? undefined,
  note: group.note ?? undefined,
  attributeIds: group.attributeIds,
  attributeCount: group.attributeCount ?? (group.attributes ? group.attributes.length : 0),
  attributes: (group.attributes ?? []).map(mapAttributeSummary),
  order: group.displayOrder ?? 0,
  tags: group.tags ?? [],
  logoUrl: group.logoUrl ?? null,
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
  localization: {
    nameLocalizationId: group.nameLocalizationId,
    descriptionLocalizationId: group.descriptionLocalizationId ?? null,
    noteLocalizationId: group.noteLocalizationId ?? null,
    nameTranslations: undefined,
    descriptionTranslations: undefined,
    noteTranslations: undefined,
  },
  createdBy: mapUser(group.createdBy),
  updatedBy: mapUser(group.updatedBy),
});

export const attributeGroupsService = {
  async list(options?: { includeAttributes?: boolean }): Promise<AttributeGroup[]> {
    const params: Record<string, string> = {};
    if (options?.includeAttributes) {
      params.includeAttributes = 'true';
    }
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendAttributeGroup[]; total: number }>
    >(API_ENDPOINTS.ATTRIBUTE_GROUPS.BASE, { params });
    const items = Array.isArray(response.data.data?.items) ? response.data.data.items : [];
    return items.map(mapAttributeGroup);
  },

  async getById(id: string): Promise<AttributeGroup> {
    const response = await apiClient.get<ApiSuccessResponse<BackendAttributeGroup>>(
      API_ENDPOINTS.ATTRIBUTE_GROUPS.BY_ID(id),
    );
    return mapAttributeGroup(response.data.data);
  },

  async create(payload: Record<string, unknown>): Promise<AttributeGroup> {
    const response = await apiClient.post<ApiSuccessResponse<BackendAttributeGroup>>(
      API_ENDPOINTS.ATTRIBUTE_GROUPS.BASE,
      payload,
    );
    return mapAttributeGroup(response.data.data);
  },

  async update(id: string, payload: Record<string, unknown>): Promise<AttributeGroup> {
    const response = await apiClient.put<ApiSuccessResponse<BackendAttributeGroup>>(
      API_ENDPOINTS.ATTRIBUTE_GROUPS.BY_ID(id),
      payload,
    );
    return mapAttributeGroup(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ATTRIBUTE_GROUPS.BY_ID(id));
  },

  async resolve(params: {
    itemTypeId?: string;
    categoryId?: string;
    familyId?: string;
  }): Promise<{ attributeGroups: AttributeGroup[]; requiredAttributeGroupIds: string[] }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{
        attributeGroups?: BackendAttributeGroup[];
        requiredAttributeGroupIds?: string[];
      }>
    >(API_ENDPOINTS.ATTRIBUTE_GROUPS.RESOLVE, {
      params,
    });

    const payload = response.data.data ?? {};
    const groups = Array.isArray(payload.attributeGroups) ? payload.attributeGroups : [];
    return {
      attributeGroups: groups.map(mapAttributeGroup),
      requiredAttributeGroupIds: payload.requiredAttributeGroupIds ?? [],
    };
  },
};

export type { BackendAttributeGroup };
