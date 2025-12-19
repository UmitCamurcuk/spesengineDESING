import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import { Attribute, AttributeType, AttributeGroupSummary, UserReference } from '../../types';

type BackendLocalizationPayload = {
  value: string;
  language: string | null;
  translations?: Record<string, string>;
} | null;

type BackendUserSummary =
  | (UserReference & {
      role?: UserReference['role'];
    })
  | string
  | null;

type BackendAttributeGroupSummary = {
  id: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
};

type BackendAttribute = {
  id: string;
  tenantId: string;
  key: string;
  type: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  helpTextLocalizationId?: string | null;
  name: BackendLocalizationPayload;
  description: BackendLocalizationPayload;
  helpText: BackendLocalizationPayload;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: unknown;
  validationRules?: Record<string, unknown> | null;
  uiSettings?: Record<string, unknown> | null;
  tags?: string[];
  logoUrl?: string | null;
  createdBy?: BackendUserSummary;
  updatedBy?: BackendUserSummary;
  createdAt: string;
  updatedAt: string;
  attributeGroups?: BackendAttributeGroupSummary[];
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

const mapGroup = (group: BackendAttributeGroupSummary): AttributeGroupSummary => ({
  id: group.id,
  key: group.key,
  nameLocalizationId: group.nameLocalizationId,
  descriptionLocalizationId: group.descriptionLocalizationId ?? null,
  name: group.name,
});

const extractOptions = (attribute: BackendAttribute): string[] | undefined => {
  const uiSettings = attribute.uiSettings as Record<string, unknown> | null | undefined;
  if (!uiSettings) {
    return undefined;
  }
  const possibleOptions = (uiSettings as Record<string, unknown>).options;
  if (Array.isArray(possibleOptions)) {
    return possibleOptions.map((option) => String(option));
  }
  return undefined;
};

const mapAttribute = (attribute: BackendAttribute): Attribute => {
  const options = extractOptions(attribute);
  const localization = {
    nameLocalizationId: attribute.nameLocalizationId,
    descriptionLocalizationId: attribute.descriptionLocalizationId ?? null,
    helpTextLocalizationId: attribute.helpTextLocalizationId ?? null,
    nameTranslations: attribute.name?.translations,
    descriptionTranslations: attribute.description?.translations,
    helpTextTranslations: attribute.helpText?.translations,
  };

  return {
    id: attribute.id,
    key: attribute.key,
    name: attribute.name?.value || attribute.key,
    type: (attribute.type as AttributeType) ?? AttributeType.TEXT,
    required: attribute.isRequired,
    unique: attribute.isUnique,
    options,
    defaultValue: attribute.defaultValue ?? undefined,
    validation: attribute.validationRules ?? null,
    description: attribute.description?.value ?? undefined,
    helpText: attribute.helpText?.value ?? null,
    tags: attribute.tags ?? [],
    logoUrl: attribute.logoUrl ?? null,
    createdAt: attribute.createdAt,
    updatedAt: attribute.updatedAt,
    attributeGroups: attribute.attributeGroups?.map(mapGroup),
    createdBy: mapUser(attribute.createdBy),
    updatedBy: mapUser(attribute.updatedBy),
    localization,
    uiSettings: attribute.uiSettings ?? null,
  };
};

export const attributesService = {
  async list(): Promise<Attribute[]> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendAttribute[]; total: number }>
    >(API_ENDPOINTS.ATTRIBUTES.BASE);
    const items = Array.isArray(response.data.data?.items) ? response.data.data.items : [];
    return items.map(mapAttribute);
  },

  async getById(id: string): Promise<Attribute> {
    const response = await apiClient.get<ApiSuccessResponse<BackendAttribute>>(
      API_ENDPOINTS.ATTRIBUTES.BY_ID(id),
    );
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

export type { BackendAttribute, BackendAttributeGroupSummary };
