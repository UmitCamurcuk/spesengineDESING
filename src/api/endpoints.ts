// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // User management
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: (id: string) => `/users/${id}/profile`,
    ROLES: (id: string) => `/users/${id}/roles`,
    PERMISSIONS: (id: string) => `/users/${id}/permissions`,
  },
  
  // Role management
  ROLES: {
    BASE: '/roles',
    BY_ID: (id: string) => `/roles/${id}`,
    PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
  },
  
  // Permission management
  PERMISSIONS: {
    BASE: '/permissions',
    BY_ID: (id: string) => `/permissions/${id}`,
  },
  
  // Permission groups
  PERMISSION_GROUPS: {
    BASE: '/permission-groups',
    BY_ID: (id: string) => `/permission-groups/${id}`,
    PERMISSIONS: (id: string) => `/permission-groups/${id}/permissions`,
  },
  
  // Items management
  ITEMS: {
    BASE: '/items',
    BY_ID: (id: string) => `/items/${id}`,
    ATTRIBUTES: (id: string) => `/items/${id}/attributes`,
    ASSOCIATIONS: (id: string) => `/items/${id}/associations`,
    HISTORY: (id: string) => `/items/${id}/history`,
    BULK_UPDATE: '/items/bulk-update',
    BULK_DELETE: '/items/bulk-delete',
    EXPORT: '/items/export',
    IMPORT: '/items/import',
  },
  
  // Item types management
  ITEM_TYPES: {
    BASE: '/item-types',
    BY_ID: (id: string) => `/item-types/${id}`,
    ATTRIBUTES: (id: string) => `/item-types/${id}/attributes`,
    ITEMS: (id: string) => `/item-types/${id}/items`,
  },
  
  // Categories management
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    CHILDREN: (id: string) => `/categories/${id}/children`,
    TREE: '/categories/tree',
    ITEMS: (id: string) => `/categories/${id}/items`,
    FAMILIES: (id: string) => `/categories/${id}/families`,
  },
  
  // Families management
  FAMILIES: {
    BASE: '/families',
    BY_ID: (id: string) => `/families/${id}`,
    ITEMS: (id: string) => `/families/${id}/items`,
    ATTRIBUTES: (id: string) => `/families/${id}/attributes`,
  },
  
  // Attributes management
  ATTRIBUTES: {
    BASE: '/attributes',
    BY_ID: (id: string) => `/attributes/${id}`,
    BY_TYPE: (type: string) => `/attributes/type/${type}`,
    VALIDATION: (id: string) => `/attributes/${id}/validation`,
  },
  
  // Attribute groups management
  ATTRIBUTE_GROUPS: {
    BASE: '/attribute-groups',
    BY_ID: (id: string) => `/attribute-groups/${id}`,
    ATTRIBUTES: (id: string) => `/attribute-groups/${id}/attributes`,
  },
  
  // Associations management
  ASSOCIATIONS: {
    BASE: '/associations',
    BY_ID: (id: string) => `/associations/${id}`,
    BY_SOURCE: (sourceId: string) => `/associations/source/${sourceId}`,
    BY_TARGET: (targetId: string) => `/associations/target/${targetId}`,
    BY_TYPE: (type: string) => `/associations/type/${type}`,
  },
  
  // Localizations management
  LOCALIZATIONS: {
    BASE: '/localizations',
    BY_ID: (id: string) => `/localizations/${id}`,
    BY_LANGUAGE: (language: string) => `/localizations/language/${language}`,
    BY_NAMESPACE: (namespace: string) => `/localizations/namespace/${namespace}`,
    EXPORT: '/localizations/export',
    IMPORT: '/localizations/import',
  },
  
  // System endpoints
  SYSTEM: {
    HEALTH: '/system/health',
    STATUS: '/system/status',
    VERSION: '/system/version',
    CONFIG: '/system/config',
    STATS: '/system/stats',
  },
  
  // File upload endpoints
  FILES: {
    UPLOAD: '/files/upload',
    BY_ID: (id: string) => `/files/${id}`,
    DOWNLOAD: (id: string) => `/files/${id}/download`,
    DELETE: (id: string) => `/files/${id}`,
  },
  
  // Search endpoints
  SEARCH: {
    GLOBAL: '/search',
    ITEMS: '/search/items',
    CATEGORIES: '/search/categories',
    USERS: '/search/users',
    SUGGESTIONS: '/search/suggestions',
  },
  
  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    ITEMS: '/analytics/items',
    USERS: '/analytics/users',
    ACTIVITY: '/analytics/activity',
    REPORTS: '/analytics/reports',
  },
} as const;

// Query parameter builders
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

// URL builders
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const baseUrl = endpoint;
  const queryString = params ? buildQueryParams(params) : '';
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
