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
  name: string;
  type: AttributeType;
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: any;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeGroup {
  id: string;
  name: string;
  description?: string;
  attributes: Attribute[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  parentFamilyId?: string;
  childFamilies: Family[];
  categoryId?: string;
  attributeGroups: AttributeGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  childCategories: Category[];
  familyIds: string[];
  itemTypeIds: string[];
  attributeGroups: AttributeGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface ItemType {
  id: string;
  name: string;
  description?: string;
  categoryIds: string[];
  attributeGroups: AttributeGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  name: string;
  itemTypeId: string;
  categoryId: string;
  familyId: string;
  attributeValues: Record<string, any>;
  associations: ItemAssociation[];
  status: 'draft' | 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Association {
  id: string;
  name: string;
  description?: string;
  sourceItemTypeId: string;
  targetItemTypeId: string;
  associationType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  isRequired: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  createdAt: string;
  updatedAt: string;
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