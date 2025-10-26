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

export interface ApiPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

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
  roleId: string | null;
  roleName?: string | null;
}

export interface AuthUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  department?: string;
  about?: string;
  primaryRoleId?: string | null;
  primaryRoleName?: string | null;
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  profilePhotoUrl?: string;
  twoFactorEnabled?: boolean;
  tenants: TenantMembership[];
  authzVersion: number;
  permissions: string[];
  activeRoleId?: string | null;
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

export interface LanguageOption {
  code: string;
  label: string;
  required: boolean;
}

export interface SettingsGeneral {
  companyName: string;
  timezone: string;
  dateFormat: string;
  maintenanceMode: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type DarkVariant = 'slate' | 'navy' | 'true-black';

export interface SettingsAppearance {
  themeMode: ThemeMode;
  darkVariant: DarkVariant;
  compactMode: boolean;
  showAvatars: boolean;
}

export interface SettingsLocalization {
  defaultLanguage: string;
  fallbackLanguage: string;
  supportedLanguages: LanguageOption[];
  allowUserLanguageSwitch: boolean;
  autoTranslateNewContent: boolean;
}

export interface SettingsNotifications {
  email: boolean;
  push: boolean;
  slack: boolean;
  sms: boolean;
  weeklyDigest: boolean;
  anomalyAlerts: boolean;
}

export interface SettingsSlackIntegration {
  enabled: boolean;
  channel: string;
  webhookUrl: string;
  mentionAll: boolean;
  sendDigest: boolean;
}

export interface SettingsTeamsIntegration {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
}

export interface SettingsWebhookIntegration {
  enabled: boolean;
  endpoint: string;
  secret: string;
}

export interface SettingsIntegrations {
  slack: SettingsSlackIntegration;
  microsoftTeams: SettingsTeamsIntegration;
  webhook: SettingsWebhookIntegration;
}

export interface SettingsSecurity {
  sessionTimeoutMinutes: number;
  passwordExpiryDays: number;
  enforceTwoFactor: boolean;
  requireTwoFactorForAdmins: boolean;
  loginAlerts: boolean;
  allowRememberDevice: boolean;
}

export interface SettingsData {
  autoBackup: boolean;
  retentionDays: number;
  allowExport: boolean;
}

export interface AppSettings {
  id: string | null;
  tenantId: string;
  general: SettingsGeneral;
  appearance: SettingsAppearance;
  localization: SettingsLocalization;
  notifications: SettingsNotifications;
  integrations: SettingsIntegrations;
  security: SettingsSecurity;
  data: SettingsData;
  createdAt: string | null;
  updatedAt: string | null;
}

export type UpdateSettingsPayload = Omit<AppSettings, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>;

export type SettingsPatchPayload = Partial<{
  general: Partial<SettingsGeneral>;
  appearance: Partial<SettingsAppearance>;
  localization: Partial<Omit<SettingsLocalization, 'supportedLanguages'>> & {
    supportedLanguages?: LanguageOption[];
  };
  notifications: Partial<SettingsNotifications>;
  integrations: Partial<{
    slack: Partial<SettingsIntegrations['slack']>;
    microsoftTeams: Partial<SettingsIntegrations['microsoftTeams']>;
    webhook: Partial<SettingsIntegrations['webhook']>;
  }>;
  security: Partial<SettingsSecurity>;
  data: Partial<SettingsData>;
}>;

export type SettingsPatchRequest = SettingsPatchPayload & {
  comment: string;
};

export interface LocalizationRecord {
  id: string;
  tenantId: string;
  namespace: string;
  key: string;
  description: string | null;
  translations: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalizationListResponse {
  items: LocalizationRecord[];
  pagination: ApiPagination;
}

export interface LocalizationListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  namespace?: string;
  language?: string;
}

export interface CreateLocalizationRequest {
  namespace: string;
  key: string;
  description?: string | null;
  translations: Record<string, string>;
}

export interface UpdateLocalizationRequest {
  namespace?: string;
  key?: string;
  description?: string | null;
  translations?: Record<string, string>;
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

export interface HistoryApiActor {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  name?: string;
  profilePhotoUrl?: string;
}

export interface HistoryApiEntity {
  type: string;
  id: string;
  label?: string;
  email?: string;
  profilePhotoUrl?: string;
}

export interface HistoryApiRequestInfo {
  requestId?: string;
  source?: string;
  correlationId?: string;
}

export interface HistoryApiDiff {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface HistoryApiItem {
  id: string;
  tenantId: string;
  entity: HistoryApiEntity;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'login' | 'logout';
  at: string;
  actor?: HistoryApiActor;
  request?: HistoryApiRequestInfo;
  summary?: string;
  diff?: HistoryApiDiff;
  tags?: string[];
  meta?: Record<string, unknown> | null;
}

export type HistoryApiPagination = ApiPagination;

export interface HistoryResponseData {
  items: HistoryApiItem[];
  pagination: HistoryApiPagination;
}

export type HistoryResponse = ApiSuccessResponse<HistoryResponseData>;

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

// ========================================
// Permission System Types
// ========================================

export interface PermissionGroupRecord {
  id: string;
  tenantId: string;
  nameLocalizationId: string;
  descriptionLocalizationId: string;
  name: string;
  nameLanguage: string | null;
  description: string;
  descriptionLanguage: string | null;
  logo: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionRecord {
  id: string;
  tenantId: string;
  code: string;
  nameLocalizationId: string;
  descriptionLocalizationId: string;
  name: string;
  nameLanguage: string | null;
  description: string;
  descriptionLanguage: string | null;
  permissionGroupId: string;
  logo: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRecord {
  id: string;
  tenantId: string;
  nameLocalizationId: string;
  descriptionLocalizationId: string;
  name: string;
  nameLanguage: string | null;
  description: string;
  descriptionLanguage: string | null;
  isSystemRole: boolean;
  permissions: string[]; // Array of enabled permission IDs
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithPermissions extends RoleRecord {
  // permissions already in RoleRecord
}

export interface UserTenantSummary {
  tenantId: string;
  roleId: string | null;
  roleName: string | null;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  department: string;
  primaryRoleId: string | null;
  primaryRoleName: string | null;
  activeRoleId: string | null;
  tenants: UserTenantSummary[];
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  profilePhotoUrl: string;
  twoFactorEnabled: boolean;
  authzVersion: number;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserListResponse {
  items: UserSummary[];
  pagination: ApiPagination;
}

export interface PermissionGroupCreateRequest {
  name: Record<string, string>;
  description: Record<string, string>;
  logo?: string | null;
  displayOrder?: number;
}

export interface PermissionGroupUpdateRequest {
  name?: Record<string, string>;
  description?: Record<string, string>;
  logo?: string | null;
  displayOrder?: number;
}

export interface PermissionCreateRequest {
  code: string;
  name: Record<string, string>;
  description: Record<string, string>;
  permissionGroupId: string;
  logo?: string | null;
  displayOrder?: number;
}

export interface PermissionUpdateRequest {
  code?: string;
  name?: Record<string, string>;
  description?: Record<string, string>;
  permissionGroupId?: string;
  logo?: string | null;
  displayOrder?: number;
}

export interface RoleCreateRequest {
  name: Record<string, string>;
  description: Record<string, string>;
  permissions?: string[]; // Array of enabled permission IDs
}

export interface RoleUpdateRequest {
  name?: Record<string, string>;
  description?: Record<string, string>;
  permissions?: string[]; // Array of enabled permission IDs
}

export interface PermissionGroupListResponse {
  items: PermissionGroupRecord[];
  pagination: ApiPagination;
}

export interface PermissionListResponse {
  items: PermissionRecord[];
  pagination: ApiPagination;
}

export interface RoleListResponse {
  items: RoleRecord[];
}
