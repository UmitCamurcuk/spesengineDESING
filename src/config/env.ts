// Environment Configuration
// Type-safe environment variables wrapper

interface EnvConfig {
  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT: number;
  
  // App Configuration
  APP_NAME: string;
  APP_VERSION: string;
  APP_ENVIRONMENT: 'development' | 'production' | 'test';
  
  // Authentication
  AUTH_TOKEN_KEY: string;
  AUTH_REFRESH_TOKEN_KEY: string;
  AUTH_TOKEN_EXPIRY: number;
  
  // Features
  ENABLE_MOCK_API: boolean;
  ENABLE_DARK_MODE: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_LOGGING: boolean;
  
  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  LOG_CONSOLE: boolean;
  
  // Development Tools
  ENABLE_DEVTOOLS: boolean;
  ENABLE_HOT_RELOAD: boolean;
  
  // Database
  MOCK_DB_URL: string;
  
  // File Upload
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  
  // Pagination
  DEFAULT_PAGE_SIZE: number;
  MAX_PAGE_SIZE: number;
  
  // Search
  SEARCH_DEBOUNCE: number;
  MIN_SEARCH_LENGTH: number;
  
  // Performance
  ENABLE_VIRTUAL_SCROLLING: boolean;
  LAZY_LOAD_THRESHOLD: number;
  
  // Analytics (Optional)
  ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
}

// Helper function to get environment variable with default value
const getEnvVar = <T>(key: string, defaultValue: T, transform?: (value: string) => T): T => {
  const value = import.meta.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  if (transform) {
    return transform(value);
  }
  
  return value as T;
};

// Helper function to parse boolean values
const parseBoolean = (value: string): boolean => {
  return value.toLowerCase() === 'true';
};

// Helper function to parse number values
const parseNumber = (value: string): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to parse array values (comma-separated)
const parseArray = (value: string): string[] => {
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

// Environment configuration
export const env: EnvConfig = {
  // API Configuration
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000/api'),
  API_TIMEOUT: getEnvVar('VITE_API_TIMEOUT', 30000, parseNumber),
  
  // App Configuration
  APP_NAME: getEnvVar('VITE_APP_NAME', 'SpesEngine'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  APP_ENVIRONMENT: getEnvVar('VITE_APP_ENVIRONMENT', 'development') as 'development' | 'production' | 'test',
  
  // Authentication
  AUTH_TOKEN_KEY: getEnvVar('VITE_AUTH_TOKEN_KEY', 'spes_auth_token'),
  AUTH_REFRESH_TOKEN_KEY: getEnvVar('VITE_AUTH_REFRESH_TOKEN_KEY', 'spes_refresh_token'),
  AUTH_TOKEN_EXPIRY: getEnvVar('VITE_AUTH_TOKEN_EXPIRY', 3600, parseNumber),
  
  // Features
  ENABLE_MOCK_API: getEnvVar('VITE_ENABLE_MOCK_API', true, parseBoolean),
  ENABLE_DARK_MODE: getEnvVar('VITE_ENABLE_DARK_MODE', true, parseBoolean),
  ENABLE_ANALYTICS: getEnvVar('VITE_ENABLE_ANALYTICS', false, parseBoolean),
  ENABLE_LOGGING: getEnvVar('VITE_ENABLE_LOGGING', true, parseBoolean),
  
  // Logging
  LOG_LEVEL: getEnvVar('VITE_LOG_LEVEL', 'debug') as 'debug' | 'info' | 'warn' | 'error',
  LOG_CONSOLE: getEnvVar('VITE_LOG_CONSOLE', true, parseBoolean),
  
  // Development Tools
  ENABLE_DEVTOOLS: getEnvVar('VITE_ENABLE_DEVTOOLS', true, parseBoolean),
  ENABLE_HOT_RELOAD: getEnvVar('VITE_ENABLE_HOT_RELOAD', true, parseBoolean),
  
  // Database
  MOCK_DB_URL: getEnvVar('VITE_MOCK_DB_URL', './mock-data/db.json'),
  
  // File Upload
  MAX_FILE_SIZE: getEnvVar('VITE_MAX_FILE_SIZE', 10485760, parseNumber), // 10MB
  ALLOWED_FILE_TYPES: getEnvVar('VITE_ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/gif,application/pdf', parseArray),
  
  // Pagination
  DEFAULT_PAGE_SIZE: getEnvVar('VITE_DEFAULT_PAGE_SIZE', 20, parseNumber),
  MAX_PAGE_SIZE: getEnvVar('VITE_MAX_PAGE_SIZE', 100, parseNumber),
  
  // Search
  SEARCH_DEBOUNCE: getEnvVar('VITE_SEARCH_DEBOUNCE', 300, parseNumber),
  MIN_SEARCH_LENGTH: getEnvVar('VITE_MIN_SEARCH_LENGTH', 2, parseNumber),
  
  // Performance
  ENABLE_VIRTUAL_SCROLLING: getEnvVar('VITE_ENABLE_VIRTUAL_SCROLLING', true, parseBoolean),
  LAZY_LOAD_THRESHOLD: getEnvVar('VITE_LAZY_LOAD_THRESHOLD', 100, parseNumber),
  
  // Analytics (Optional)
  ANALYTICS_ID: getEnvVar('VITE_ANALYTICS_ID', undefined),
  SENTRY_DSN: getEnvVar('VITE_SENTRY_DSN', undefined),
};

// Development helpers
export const isDevelopment = env.APP_ENVIRONMENT === 'development';
export const isProduction = env.APP_ENVIRONMENT === 'production';
export const isTest = env.APP_ENVIRONMENT === 'test';

// Feature flags
export const features = {
  mockApi: env.ENABLE_MOCK_API,
  darkMode: env.ENABLE_DARK_MODE,
  analytics: env.ENABLE_ANALYTICS,
  logging: env.ENABLE_LOGGING,
  devtools: env.ENABLE_DEVTOOLS && isDevelopment,
  hotReload: env.ENABLE_HOT_RELOAD && isDevelopment,
  virtualScrolling: env.ENABLE_VIRTUAL_SCROLLING,
};

// Export default
export default env;
