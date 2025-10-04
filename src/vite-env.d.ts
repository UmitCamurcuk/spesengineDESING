/// <reference types="vite/client" />

// Environment Variables Type Definitions
interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  
  // App Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENVIRONMENT: string;
  
  // Authentication
  readonly VITE_AUTH_TOKEN_KEY: string;
  readonly VITE_AUTH_REFRESH_TOKEN_KEY: string;
  readonly VITE_AUTH_TOKEN_EXPIRY: string;
  
  // Features
  readonly VITE_ENABLE_MOCK_API: string;
  readonly VITE_ENABLE_DARK_MODE: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_LOGGING: string;
  
  // Logging
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_LOG_CONSOLE: string;
  
  // Development Tools
  readonly VITE_ENABLE_DEVTOOLS: string;
  readonly VITE_ENABLE_HOT_RELOAD: string;
  
  // Database
  readonly VITE_MOCK_DB_URL: string;
  
  // File Upload
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
  
  // Pagination
  readonly VITE_DEFAULT_PAGE_SIZE: string;
  readonly VITE_MAX_PAGE_SIZE: string;
  
  // Search
  readonly VITE_SEARCH_DEBOUNCE: string;
  readonly VITE_MIN_SEARCH_LENGTH: string;
  
  // Performance
  readonly VITE_ENABLE_VIRTUAL_SCROLLING: string;
  readonly VITE_LAZY_LOAD_THRESHOLD: string;
  
  // Analytics (Optional)
  readonly VITE_ANALYTICS_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
