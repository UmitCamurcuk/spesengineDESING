export enum AttributeType {
  // Basic (Temel) Types
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',

  // Enum / Seçilebilir Değerler
  SELECT = 'select',
  MULTISELECT = 'multiselect',

  // Dosya / Medya Tipleri
  FILE = 'file',
  IMAGE = 'image',
  ATTACHMENT = 'attachment',

  // Kompozit / Gelişmiş Tipler
  OBJECT = 'object',
  ARRAY = 'array',
  JSON = 'json',
  FORMULA = 'formula',
  EXPRESSION = 'expression',
  TABLE = 'table',

  // UI / Görsel Bileşen Tipleri
  COLOR = 'color',
  RICH_TEXT = 'rich_text',
  RATING = 'rating',
  BARCODE = 'barcode',
  QR = 'qr',

  // Special Types
  READONLY = 'readonly',
}

export interface Attribute {
  id: string;
  key?: string;
  name: string;
  type: AttributeType;
  required: boolean;
  unique?: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: Record<string, any> | null;
  description?: string;
  helpText?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  attributeGroups?: AttributeGroupSummary[];
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
  localization?: {
    nameLocalizationId: string;
    descriptionLocalizationId?: string | null;
    helpTextLocalizationId?: string | null;
    nameTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
    helpTextTranslations?: Record<string, string>;
  };
  uiSettings?: Record<string, unknown> | null;
}

export interface AttributeGroup {
  id: string;
  key?: string;
  name: string;
  description?: string;
  note?: string | null;
  attributeIds?: string[];
  attributeCount?: number;
  attributes: Attribute[];
  order: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  localization?: {
    nameLocalizationId: string;
    descriptionLocalizationId?: string | null;
    noteLocalizationId?: string | null;
    nameTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
    noteTranslations?: Record<string, string>;
  };
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface AttributeGroupSummary {
  id: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
}

export interface UserReference {
  id: string;
  email: string;
  name: string;
  profilePhotoUrl?: string;
  role?: {
    id?: string;
    name?: string | null;
    isSystemRole?: boolean;
  };
}

export interface AttributeGroupBinding {
  id: string;
  attributeGroupId: string;
  inherited: boolean;
  required: boolean;
}

export interface Family {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  parentFamilyId?: string | null;
  hierarchyPath: string[];
  categoryId?: string | null;
  isSystemFamily: boolean;
  attributeGroupIds: string[];
  attributeGroupBindings: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface Category {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  parentCategoryId?: string | null;
  hierarchyPath: string[];
  defaultItemTypeId?: string | null;
  linkedItemTypeIds: string[];
  linkedFamilyIds: string[];
  isSystemCategory: boolean;
  attributeGroupIds: string[];
  attributeGroupBindings: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface ItemType {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  categoryIds: string[];
  linkedFamilyIds: string[];
  lifecycleStatus: 'draft' | 'active' | 'deprecated';
  isSystemItemType: boolean;
  showInNavbar: boolean;
  version: number;
  attributeGroupIds: string[];
  attributeGroupBindings: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export type ColumnAlignment = 'start' | 'center' | 'end';
export type ItemTypeColumnSource = 'attribute' | 'meta' | 'association' | 'computed';

export interface ItemTypeColumnDefinition {
  key: string;
  source: ItemTypeColumnSource;
  labelLocalizationId?: string;
  visible: boolean;
  order: number;
  width?: number;
  alignment?: ColumnAlignment;
  options?: Record<string, unknown>;
}

export interface ItemTypeColumnConfig {
  id?: string;
  itemTypeId?: string;
  context: 'list' | 'detail' | 'navbar';
  columns: ItemTypeColumnDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export type AssociationColumnSource = 'attribute' | 'meta' | 'relationship' | 'computed';

export interface AssociationColumnDefinition {
  key: string;
  source: AssociationColumnSource;
  labelLocalizationId?: string;
  visible: boolean;
  order: number;
  width?: number;
  alignment?: ColumnAlignment;
  options?: Record<string, unknown>;
}

export interface AssociationColumnConfig {
  id?: string;
  associationTypeId?: string;
  role: 'source' | 'target';
  columns: AssociationColumnDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssociationTypeItemRef {
  id: string;
  key: string;
  nameLocalizationId?: string | null;
  name?: string | null;
  nameLanguage?: string | null;
}

export interface Item {
  id: string;
  itemTypeId: string | null;
  categoryId?: string | null;
  familyId?: string | null;
  code: string;
  externalCode?: string | null;
  sku?: string | null;
  name: string;
  nameLocalizationId?: string | null;
  descriptionLocalizationId?: string | null;
  description?: string | null;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface Association {
  id: string;
  associationTypeId: string | null;
  sourceItemId: string | null;
  targetItemId: string | null;
  metadata?: Record<string, any> | null;
  orderIndex?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface AssociationType {
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
  sourceItemType?: AssociationTypeItemRef | null;
  targetItemType?: AssociationTypeItemRef | null;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  isRequired: boolean;
  direction: 'directed' | 'undirected';
  metadataSchema?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface AssociationRule {
  id: string;
  tenantId?: string;
  associationTypeId?: string | null;
  appliesTo: 'source' | 'target';
  nameLocalizationId?: string | null;
  descriptionLocalizationId?: string | null;
  name?: string | null;
  nameLanguage?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
  sourceCategoryIds: string[];
  sourceFamilyIds: string[];
  targetCategoryIds: string[];
  targetFamilyIds: string[];
  minTargets: number;
  maxTargets?: number | null;
  metadataSchema?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface ItemAssociation {
  id: string;
  associationId: string;
  sourceItemId: string;
  targetItemId: string;
  quantity?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissionGroups: string[];
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Localization {
  id: string;
  key: string;
  translations: Record<string, string>;
  namespace: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Re-export common types
export * from './common';
