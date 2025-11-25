import apiClient from '../client/axios';
import { API_ENDPOINTS, buildUrl } from '../endpoints';
import type {
  ApiSuccessResponse,
  SearchResponse,
  SearchSuggestionsResponse,
  SearchEntityType,
  SearchStatus,
  SearchReindexResponse,
} from '../types/api.types';

interface UnifiedSearchParams {
  query: string;
  limit?: number;
  entityTypes?: SearchEntityType[];
}

interface EntitySearchParams {
  query: string;
  entityType: SearchEntityType;
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

interface SuggestionParams {
  query: string;
  limit?: number;
  entityTypes?: SearchEntityType[];
}

export const searchService = {
  unified: async ({ query, limit, entityTypes }: UnifiedSearchParams) => {
    const url = buildUrl(API_ENDPOINTS.SEARCH.BASE, {
      q: query,
      limit,
      entityTypes: entityTypes?.join(','),
    });
    const response = await apiClient.get<SearchResponse>(url);
    return response.data;
  },

  byEntity: async ({ query, entityType, page, pageSize, isActive }: EntitySearchParams) => {
    const url = buildUrl(API_ENDPOINTS.SEARCH.BY_ENTITY(entityType), {
      q: query,
      page,
      pageSize,
      isActive: typeof isActive === 'boolean' ? String(isActive) : undefined,
    });
    const response = await apiClient.get<SearchResponse>(url);
    return response.data;
  },

  suggestions: async ({ query, limit, entityTypes }: SuggestionParams) => {
    const url = buildUrl(API_ENDPOINTS.SEARCH.SUGGESTIONS, {
      q: query,
      limit,
      entityTypes: entityTypes?.join(','),
    });
    const response = await apiClient.get<SearchSuggestionsResponse>(url);
    return response.data;
  },

  getStatus: async () => {
    const response = await apiClient.get<ApiSuccessResponse<SearchStatus>>(API_ENDPOINTS.SEARCH.STATUS);
    return response.data.data;
  },

  reindex: async (payload: { entityTypes?: SearchEntityType[]; purgeExisting?: boolean; batchSize?: number }) => {
    const response = await apiClient.post<ApiSuccessResponse<SearchReindexResponse>>(
      API_ENDPOINTS.SEARCH.REINDEX,
      payload,
    );
    return response.data.data;
  },
};
