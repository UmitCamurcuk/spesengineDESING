// API Services Export
export { authService } from './services/auth.service';
export { itemsService } from './services/items.service';
export { categoriesService } from './services/categories.service';
export { usersService } from './services/users.service';

// API Client Export
export { default as apiClient } from './client/axios';

// API Endpoints Export
export { API_ENDPOINTS, buildQueryParams, buildUrl } from './endpoints';

// API Types Export
export * from './types/api.types';

// Re-export commonly used types for convenience
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  SearchParams,
  PaginationParams,
  BaseEntity,
  User,
  Item,
  Category,
} from './types/api.types';

