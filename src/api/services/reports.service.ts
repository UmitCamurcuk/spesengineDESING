import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type {
  Report,
  ReportColumn,
  ReportFilter,
  ReportJoin,
  ReportSchedule,
  ReportVisualization,
  ReportVisibility,
  ReportExecution,
  ReportMetaItemType,
  ReportMetaAttribute,
  ReportMetaAssociation,
} from '../../types';

/* ------------------------------------------------------------------ */
/*  Payload interfaces                                                  */
/* ------------------------------------------------------------------ */

export interface ReportCreatePayload {
  name: string;
  description?: string;
  primaryItemTypeId: string;
  joins?: ReportJoin[];
  columns?: ReportColumn[];
  filters?: ReportFilter[];
  groupBy?: string[];
  sortBy?: { alias: string; attributeCode: string; direction: 'asc' | 'desc' } | null;
  visualization?: ReportVisualization;
  chartConfig?: { xAxis?: string; yAxis?: string; colorField?: string };
  visibility?: ReportVisibility;
  allowedRoles?: string[];
  allowedUsers?: string[];
  isTemplate?: boolean;
  schedule?: ReportSchedule | null;
}

export type ReportUpdatePayload = Partial<ReportCreatePayload>;

export interface ReportListParams {
  search?: string;
  primaryItemTypeId?: string;
  isTemplate?: boolean;
  skip?: number;
  limit?: number;
}

/* ------------------------------------------------------------------ */
/*  Service                                                             */
/* ------------------------------------------------------------------ */

export const reportsService = {
  /* ---- CRUD ---- */

  async list(params?: ReportListParams): Promise<{ items: Report[]; total: number }> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: Report[]; total: number }>>(
      API_ENDPOINTS.REPORTS.BASE,
      { params },
    );
    return response.data.data ?? { items: [], total: 0 };
  },

  async getById(id: string): Promise<Report> {
    const response = await apiClient.get<ApiSuccessResponse<Report>>(
      API_ENDPOINTS.REPORTS.BY_ID(id),
    );
    return response.data.data;
  },

  async create(payload: ReportCreatePayload): Promise<Report> {
    const response = await apiClient.post<ApiSuccessResponse<Report>>(
      API_ENDPOINTS.REPORTS.BASE,
      payload,
    );
    return response.data.data;
  },

  async update(id: string, payload: ReportUpdatePayload): Promise<Report> {
    const response = await apiClient.put<ApiSuccessResponse<Report>>(
      API_ENDPOINTS.REPORTS.BY_ID(id),
      payload,
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.REPORTS.BY_ID(id));
  },

  /* ---- Templates ---- */

  async listTemplates(): Promise<Report[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: Report[] }>>(
      API_ENDPOINTS.REPORTS.TEMPLATES,
    );
    return response.data.data?.items ?? [];
  },

  /* ---- Execution ---- */

  async execute(id: string, runtimeFilters?: ReportFilter[]): Promise<ReportExecution> {
    const response = await apiClient.post<ApiSuccessResponse<ReportExecution>>(
      API_ENDPOINTS.REPORTS.EXECUTE(id),
      { runtimeFilters: runtimeFilters ?? [] },
    );
    return response.data.data;
  },

  async listExecutions(id: string, params?: { skip?: number; limit?: number }): Promise<{ items: ReportExecution[]; total: number }> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: ReportExecution[]; total: number }>>(
      API_ENDPOINTS.REPORTS.EXECUTIONS(id),
      { params },
    );
    return response.data.data ?? { items: [], total: 0 };
  },

  async getExecution(id: string, execId: string): Promise<ReportExecution> {
    const response = await apiClient.get<ApiSuccessResponse<ReportExecution>>(
      API_ENDPOINTS.REPORTS.EXECUTION_BY_ID(id, execId),
    );
    return response.data.data;
  },

  /* ---- Favorite / Clone ---- */

  async toggleFavorite(id: string): Promise<Report> {
    const response = await apiClient.post<ApiSuccessResponse<Report>>(
      API_ENDPOINTS.REPORTS.FAVORITE(id),
    );
    return response.data.data;
  },

  async clone(id: string): Promise<Report> {
    const response = await apiClient.post<ApiSuccessResponse<Report>>(
      API_ENDPOINTS.REPORTS.CLONE(id),
    );
    return response.data.data;
  },

  /* ---- Meta (query builder) ---- */

  async getMetaItemTypes(): Promise<ReportMetaItemType[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: ReportMetaItemType[] }>>(
      API_ENDPOINTS.REPORTS.META_ITEM_TYPES,
    );
    return response.data.data?.items ?? [];
  },

  async getMetaAttributes(itemTypeId: string): Promise<ReportMetaAttribute[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: ReportMetaAttribute[] }>>(
      API_ENDPOINTS.REPORTS.META_ATTRIBUTES(itemTypeId),
    );
    return response.data.data?.items ?? [];
  },

  async getMetaAssociations(itemTypeId: string): Promise<ReportMetaAssociation[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: ReportMetaAssociation[] }>>(
      API_ENDPOINTS.REPORTS.META_ASSOCIATIONS(itemTypeId),
    );
    return response.data.data?.items ?? [];
  },
};
