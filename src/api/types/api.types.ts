// API Response Types
export interface ApiMeta {
  requestId: string;
  [key: string]: unknown;
}

export interface ValidationFieldError {
  path: string;
  rule?: string;
  message: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  fields?: ValidationFieldError[];
}

export interface ApiSuccessResponse<T = any> {
  ok: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorDetail;
  meta: ApiMeta;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T = any> extends ApiSuccessResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {}

// Normalized API error used in the app after interceptor processing
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: unknown;
  fields?: ValidationFieldError[];
  meta?: ApiMeta;
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

export interface TenantMembership {
  tenantId: string;
  roles: string[];
}

export interface AuthUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  department?: string;
  about?: string;
  role?: string;
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  profilePhotoUrl?: string;
  twoFactorEnabled?: boolean;
  tenants: TenantMembership[];
  authzVersion: number;
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

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = ApiSuccessResponse<LoginResponseData>;

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

export type RefreshTokenResponse = ApiSuccessResponse<RefreshTokenResponseData>;

export interface TokenInfo {
  iat: number;
  exp: number;
  tenantId: string;
}

export interface MeResponseData {
  user: AuthUser;
  token: TokenInfo;
}

export type MeResponse = ApiSuccessResponse<MeResponseData>;

export interface ProfilePhotoResponseData {
  profilePhotoUrl: string;
}

export type ProfilePhotoResponse = ApiSuccessResponse<ProfilePhotoResponseData>;

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
