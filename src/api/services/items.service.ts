import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type {
  Attribute,
  AttributeGroupBinding,
  Category,
  Family,
  Item,
  ItemAttributeGroupSummary,
  ItemAssociationSummary,
  ItemAttributeValue,
  ItemDetails,
  ItemHierarchyNode,
  ItemType,
  UserReference,
} from '../../types';
import { AttributeType } from '../../types';
import type { DocumentationSection, APIEndpoint, Statistics } from '../../types/common';

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
  nameLocalizationId?: string | null;
  descriptionLocalizationId?: string | null;
  name: string;
  nameLanguage?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: BackendUserSummary;
  updatedBy?: BackendUserSummary;
};

type BackendItemTypeSummary = {
  id: string;
  key: string;
  name?: string | null;
  nameLocalizationId?: string | null;
  description?: string | null;
  descriptionLocalizationId?: string | null;
  categoryIds?: Array<string | null>;
  linkedFamilyIds?: Array<string | null>;
  lifecycleStatus?: 'draft' | 'active' | 'deprecated';
  isSystemItemType?: boolean;
  showInNavbar?: boolean;
  version?: number;
  attributeGroupIds?: Array<string | null>;
  attributeGroupBindings?: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: BackendUserSummary;
  updatedBy?: BackendUserSummary;
};

type BackendCategorySummary = {
  id: string;
  key: string;
  name?: string | null;
  nameLocalizationId?: string | null;
  description?: string | null;
  descriptionLocalizationId?: string | null;
  parentCategoryId?: string | null;
  hierarchyPath?: Array<string | null>;
  defaultItemTypeId?: string | null;
  linkedItemTypeIds?: Array<string | null>;
  linkedFamilyIds?: Array<string | null>;
  isSystemCategory?: boolean;
  attributeGroupIds?: Array<string | null>;
  attributeGroupBindings?: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: BackendUserSummary;
  updatedBy?: BackendUserSummary;
};

type BackendFamilySummary = {
  id: string;
  key: string;
  name?: string | null;
  nameLocalizationId?: string | null;
  description?: string | null;
  descriptionLocalizationId?: string | null;
  parentFamilyId?: string | null;
  hierarchyPath?: Array<string | null>;
  categoryId?: string | null;
  isSystemFamily?: boolean;
  attributeGroupIds?: Array<string | null>;
  attributeGroupBindings?: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: BackendUserSummary;
  updatedBy?: BackendUserSummary;
};

type BackendAttributeSummary = {
  id: string;
  key: string;
  type: string;
  name: string;
  description?: string | null;
  helpText?: string | null;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  helpTextLocalizationId?: string | null;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: unknown;
  validationRules?: Record<string, unknown> | null;
  uiSettings?: Record<string, unknown> | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

type BackendItemAttributeGroup = {
  id: string;
  key?: string;
  name: string;
  description?: string | null;
  note?: string | null;
  required: boolean;
  inherited: boolean;
  attributeCount: number;
  displayOrder?: number;
  tags?: string[];
  attributes: BackendAttributeSummary[];
};

type BackendItemAttributeValue = {
  id: string;
  attributeId: string;
  value: unknown;
  localizedValues?: { language: string; value: unknown }[];
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  lastCalculatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendItemAssociationSummary = {
  id: string;
  associationTypeId: string | null;
  associationTypeName: string | null;
  associationTypeKey: string | null;
  direction: 'source' | 'target';
  counterpartItemId: string | null;
  counterpartItemName: string | null;
  metadata?: Record<string, unknown> | null;
  orderIndex?: number | null;
  createdAt: string;
  updatedAt: string;
};

type BackendItemDetails = {
  item: BackendItem;
  itemType?: BackendItemTypeSummary | null;
  category?: BackendCategorySummary | null;
  family?: BackendFamilySummary | null;
  hierarchy: {
    categoryPath: ItemHierarchyNode[];
    familyPath: ItemHierarchyNode[];
  };
  attributeGroups: BackendItemAttributeGroup[];
  attributeValues: Record<string, BackendItemAttributeValue>;
  associations: {
    source: BackendItemAssociationSummary[];
    target: BackendItemAssociationSummary[];
  };
  statistics: Statistics;
  documentationSections: DocumentationSection[];
  apiEndpoints: APIEndpoint[];
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

const ensureString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === 'string' ? value : String(value);
};

const mapIdList = (values?: Array<unknown>): string[] =>
  (Array.isArray(values) ? values : [])
    .map((value) => ensureString(value))
    .filter((value): value is string => Boolean(value));

const ensureDateString = (value?: string | Date | null): string => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return value.toISOString();
};

const mapItemTypeSummary = (summary?: BackendItemTypeSummary | null): ItemType | null => {
  if (!summary) {
    return null;
  }
  const categoryIds = mapIdList(summary.categoryIds);
  const linkedFamilyIds = mapIdList(summary.linkedFamilyIds);
  const attributeGroupIds = mapIdList(summary.attributeGroupIds);
  const attributeGroupBindings = Array.isArray(summary.attributeGroupBindings)
    ? summary.attributeGroupBindings
    : [];

  return {
    id: summary.id,
    key: summary.key,
    name: summary.name ?? summary.key ?? summary.id,
    description: summary.description ?? null,
    nameLocalizationId: summary.nameLocalizationId ?? '',
    descriptionLocalizationId: summary.descriptionLocalizationId ?? null,
    categoryIds,
    linkedFamilyIds,
    lifecycleStatus: summary.lifecycleStatus ?? 'draft',
    isSystemItemType: Boolean(summary.isSystemItemType),
    showInNavbar: Boolean(summary.showInNavbar),
    version: summary.version ?? 1,
    attributeGroupIds,
    attributeGroupBindings,
    attributeGroupCount: summary.attributeGroupCount ?? attributeGroupIds.length,
    createdAt: ensureDateString(summary.createdAt),
    updatedAt: ensureDateString(summary.updatedAt),
    createdBy: mapUser(summary.createdBy),
    updatedBy: mapUser(summary.updatedBy),
  };
};

const mapCategorySummary = (summary?: BackendCategorySummary | null): Category | null => {
  if (!summary) {
    return null;
  }
  const hierarchyPath = mapIdList(summary.hierarchyPath);
  const attributeGroupIds = mapIdList(summary.attributeGroupIds);
  const attributeGroupBindings = Array.isArray(summary.attributeGroupBindings)
    ? summary.attributeGroupBindings
    : [];

  return {
    id: summary.id,
    key: summary.key,
    name: summary.name ?? summary.key ?? summary.id,
    description: summary.description ?? null,
    nameLocalizationId: summary.nameLocalizationId ?? '',
    descriptionLocalizationId: summary.descriptionLocalizationId ?? null,
    parentCategoryId: summary.parentCategoryId ?? null,
    hierarchyPath,
    defaultItemTypeId: summary.defaultItemTypeId ?? null,
    linkedItemTypeIds: mapIdList(summary.linkedItemTypeIds),
    linkedFamilyIds: mapIdList(summary.linkedFamilyIds),
    isSystemCategory: Boolean(summary.isSystemCategory),
    attributeGroupIds,
    attributeGroupBindings,
    attributeGroupCount: summary.attributeGroupCount ?? attributeGroupIds.length,
    createdAt: ensureDateString(summary.createdAt),
    updatedAt: ensureDateString(summary.updatedAt),
    createdBy: mapUser(summary.createdBy),
    updatedBy: mapUser(summary.updatedBy),
  };
};

const mapFamilySummary = (summary?: BackendFamilySummary | null): Family | null => {
  if (!summary) {
    return null;
  }
  const hierarchyPath = mapIdList(summary.hierarchyPath);
  const attributeGroupIds = mapIdList(summary.attributeGroupIds);
  const attributeGroupBindings = Array.isArray(summary.attributeGroupBindings)
    ? summary.attributeGroupBindings
    : [];

  return {
    id: summary.id,
    key: summary.key,
    name: summary.name ?? summary.key ?? summary.id,
    description: summary.description ?? null,
    nameLocalizationId: summary.nameLocalizationId ?? '',
    descriptionLocalizationId: summary.descriptionLocalizationId ?? null,
    parentFamilyId: summary.parentFamilyId ?? null,
    hierarchyPath,
    categoryId: summary.categoryId ?? null,
    isSystemFamily: Boolean(summary.isSystemFamily),
    attributeGroupIds,
    attributeGroupBindings,
    attributeGroupCount: summary.attributeGroupCount ?? attributeGroupIds.length,
    createdAt: ensureDateString(summary.createdAt),
    updatedAt: ensureDateString(summary.updatedAt),
    createdBy: mapUser(summary.createdBy),
    updatedBy: mapUser(summary.updatedBy),
  };
};

const mapItem = (item: BackendItem): Item => ({
  id: item.id,
  itemTypeId: item.itemTypeId,
  categoryId: item.categoryId ?? null,
  familyId: item.familyId ?? null,
  name: item.name,
  nameLocalizationId: item.nameLocalizationId ?? null,
  descriptionLocalizationId: item.descriptionLocalizationId ?? null,
  description: item.description ?? null,
  version: item.version,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  createdBy: mapUser(item.createdBy),
  updatedBy: mapUser(item.updatedBy),
});

const mapAttributeSummary = (attribute: BackendAttributeSummary): Attribute => ({
  id: attribute.id,
  key: attribute.key,
  name: attribute.name,
  type: (attribute.type as AttributeType) ?? AttributeType.TEXT,
  required: attribute.isRequired,
  unique: attribute.isUnique,
  defaultValue: attribute.defaultValue ?? undefined,
  validation: attribute.validationRules ?? undefined,
  description: attribute.description ?? undefined,
  helpText: attribute.helpText ?? undefined,
  tags: attribute.tags ?? [],
  uiSettings: attribute.uiSettings ?? undefined,
  createdAt: attribute.createdAt,
  updatedAt: attribute.updatedAt,
});

const mapAttributeGroup = (group: BackendItemAttributeGroup): ItemAttributeGroupSummary => ({
  id: group.id,
  key: group.key,
  name: group.name,
  description: group.description ?? undefined,
  note: group.note ?? undefined,
  required: group.required,
  inherited: group.inherited,
  attributeCount: group.attributeCount,
  displayOrder: group.displayOrder,
  tags: group.tags ?? [],
  attributes: group.attributes.map(mapAttributeSummary),
});

const mapAttributeValue = (value: BackendItemAttributeValue): ItemAttributeValue => ({
  id: value.id,
  attributeId: value.attributeId,
  value: value.value,
  localizedValues: value.localizedValues ?? [],
  effectiveFrom: value.effectiveFrom ?? undefined,
  effectiveTo: value.effectiveTo ?? undefined,
  lastCalculatedAt: value.lastCalculatedAt ?? undefined,
  createdAt: value.createdAt,
  updatedAt: value.updatedAt,
});

const mapAssociationSummary = (summary: BackendItemAssociationSummary): ItemAssociationSummary => ({
  id: summary.id,
  associationTypeId: summary.associationTypeId,
  associationTypeName: summary.associationTypeName,
  associationTypeKey: summary.associationTypeKey,
  direction: summary.direction,
  counterpartItemId: summary.counterpartItemId,
  counterpartItemName: summary.counterpartItemName,
  metadata: summary.metadata ?? undefined,
  orderIndex: summary.orderIndex ?? undefined,
  createdAt: summary.createdAt,
  updatedAt: summary.updatedAt,
});

const mapItemDetails = (payload: BackendItemDetails): ItemDetails => {
  const attributeValues: Record<string, ItemAttributeValue> = {};
  Object.entries(payload.attributeValues ?? {}).forEach(([attributeId, value]) => {
    attributeValues[attributeId] = mapAttributeValue(value);
  });

  return {
    item: mapItem(payload.item),
    itemType: mapItemTypeSummary(payload.itemType ?? undefined) ?? undefined,
    category: mapCategorySummary(payload.category ?? undefined) ?? undefined,
    family: mapFamilySummary(payload.family ?? undefined) ?? undefined,
    hierarchy: payload.hierarchy,
    attributeGroups: payload.attributeGroups.map(mapAttributeGroup),
    attributeValues,
    associations: {
      source: payload.associations.source.map(mapAssociationSummary),
      target: payload.associations.target.map(mapAssociationSummary),
    },
    statistics: payload.statistics,
    documentationSections: payload.documentationSections,
    apiEndpoints: payload.apiEndpoints,
  };
};

export interface ItemListParams {
  search?: string;
  itemTypeId?: string;
  limit?: number;
  skip?: number;
  categoryIds?: string[];
  familyIds?: string[];
}

const ITEM_LIST_MAX_LIMIT = 200;

const sanitizeItemListParams = (params?: ItemListParams): ItemListParams | undefined => {
  if (!params) {
    return undefined;
  }
  if (params.limit === undefined) {
    return params;
  }

  const next: ItemListParams = { ...params };
  const numericLimit = Number(params.limit);
  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    delete next.limit;
    return next;
  }

  next.limit = Math.min(Math.floor(numericLimit), ITEM_LIST_MAX_LIMIT);
  return next;
};

export const itemsService = {
  async list(params?: ItemListParams): Promise<{ items: Item[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: BackendItem[]; total: number }>
    >(API_ENDPOINTS.ITEMS.BASE, {
      params: sanitizeItemListParams(params),
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

  async getDetails(id: string): Promise<ItemDetails> {
    const response = await apiClient.get<ApiSuccessResponse<BackendItemDetails>>(
      API_ENDPOINTS.ITEMS.DETAILS(id),
    );
    return mapItemDetails(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ITEMS.BY_ID(id));
  },
};
