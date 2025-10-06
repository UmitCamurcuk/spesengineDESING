// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  success: boolean;
  timestamp: string;
}

// API Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Request Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

// Common Entity Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Item extends BaseEntity {
  name: string;
  description?: string;
  type: string;
  category: string;
  family: string;
  status: 'active' | 'draft' | 'inactive';
  attributes?: Record<string, any>;
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string;
  isActive: boolean;
}

export interface Family extends BaseEntity {
  name: string;
  description?: string;
  categoryId: string;
  isActive: boolean;
}

export interface ItemType extends BaseEntity {
  name: string;
  description?: string;
  categoryId: string;
  attributes: string[];
  isActive: boolean;
}

export interface Attribute extends BaseEntity {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'table' | 'file' | 'image';
  description?: string;
  isRequired: boolean;
  isUnique: boolean;
  options?: string[];
  validation?: Record<string, any>;
  groupId?: string;
  isActive: boolean;
}

export interface AttributeGroup extends BaseEntity {
  name: string;
  description?: string;
  attributes: string[];
  isActive: boolean;
}

export interface Association extends BaseEntity {
  sourceId: string;
  targetId: string;
  type: string;
  metadata?: Record<string, any>;
  isActive: boolean;
}

export interface Localization extends BaseEntity {
  key: string;
  value: string;
  language: string;
  namespace: string;
  isActive: boolean;
}

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
}

export interface Permission extends BaseEntity {
  name: string;
  description?: string;
  resource: string;
  action: string;
  isActive: boolean;
}

export interface PermissionGroup extends BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
}

// Service Response Types
export type ServiceResponse<T> = Promise<ApiResponse<T>>;
export type ServicePaginatedResponse<T> = Promise<PaginatedResponse<T>>;
export type ServiceError = ApiError;

