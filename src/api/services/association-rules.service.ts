import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { AssociationRule, UserReference } from '../../types';

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'] | string;
    })
  | string
  | null;

type BackendAssociationRule = {
  id: string;
  tenantId?: string;
  associationTypeId?: string | null;
  appliesTo?: 'source' | 'target';
  nameLocalizationId?: string | null;
  descriptionLocalizationId?: string | null;
  name?: string | null;
  nameLanguage?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
  sourceCategoryIds?: string[];
  sourceFamilyIds?: string[];
  targetCategoryIds?: string[];
  targetFamilyIds?: string[];
  minTargets: number;
  maxTargets?: number | null;
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

const mapAssociationRule = (rule: BackendAssociationRule): AssociationRule => ({
  id: rule.id,
  tenantId: rule.tenantId,
  associationTypeId: rule.associationTypeId ?? null,
  appliesTo: rule.appliesTo ?? 'source',
  nameLocalizationId: rule.nameLocalizationId ?? null,
  descriptionLocalizationId: rule.descriptionLocalizationId ?? null,
  name: rule.name ?? null,
  nameLanguage: rule.nameLanguage ?? null,
  description: rule.description ?? null,
  descriptionLanguage: rule.descriptionLanguage ?? null,
  sourceCategoryIds: rule.sourceCategoryIds ?? [],
  sourceFamilyIds: rule.sourceFamilyIds ?? [],
  targetCategoryIds: rule.targetCategoryIds ?? [],
  targetFamilyIds: rule.targetFamilyIds ?? [],
  minTargets: rule.minTargets,
  maxTargets: rule.maxTargets ?? null,
  metadataSchema: rule.metadataSchema ?? null,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
  createdBy: mapUser(rule.createdBy),
  updatedBy: mapUser(rule.updatedBy),
});

export interface AssociationRuleListParams {
  associationTypeId?: string;
  appliesTo?: 'source' | 'target';
}

export interface AssociationRuleCreateRequest {
  associationTypeId: string;
  appliesTo?: 'source' | 'target';
  nameLocalizationId?: string | null;
  descriptionLocalizationId?: string | null;
  sourceCategoryIds?: string[];
  sourceFamilyIds?: string[];
  targetCategoryIds?: string[];
  targetFamilyIds?: string[];
  minTargets: number;
  maxTargets?: number | null;
  metadataSchema?: Record<string, unknown> | null;
}

export const associationRulesService = {
  async list(
    params?: AssociationRuleListParams,
  ): Promise<{ items: AssociationRule[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendAssociationRule[]; total: number }>
    >(API_ENDPOINTS.ASSOCIATION_RULES.BASE, {
      params,
    });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items: items.map(mapAssociationRule),
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<AssociationRule> {
    const response = await apiClient.get<ApiSuccessResponse<BackendAssociationRule>>(
      API_ENDPOINTS.ASSOCIATION_RULES.BY_ID(id),
    );
    return mapAssociationRule(response.data.data);
  },

  async create(payload: AssociationRuleCreateRequest): Promise<AssociationRule> {
    const response = await apiClient.post<ApiSuccessResponse<BackendAssociationRule>>(
      API_ENDPOINTS.ASSOCIATION_RULES.BASE,
      payload,
    );
    return mapAssociationRule(response.data.data);
  },
};
