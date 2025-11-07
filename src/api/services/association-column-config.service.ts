import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type {
  AssociationColumnConfig,
  AssociationColumnDefinition,
  AssociationColumnSource,
} from '../../types';

type AssociationColumnRole = 'source' | 'target';

type BackendAssociationColumnDefinition = {
  key: string;
  source: AssociationColumnSource;
  labelLocalizationId?: string | null;
  visible?: boolean;
  order?: number;
  width?: number | null;
  alignment?: 'start' | 'center' | 'end';
  options?: Record<string, unknown> | null;
};

type BackendAssociationColumnConfig = {
  id?: string;
  associationTypeId?: string | null;
  role?: AssociationColumnRole;
  columns?: BackendAssociationColumnDefinition[];
  createdAt?: string;
  updatedAt?: string;
};

const normalizeColumns = (
  columns: BackendAssociationColumnDefinition[] | undefined,
): AssociationColumnDefinition[] => {
  const list = Array.isArray(columns) ? columns : [];
  return list
    .map((column, index) => ({
      key: column.key,
      source: column.source,
      labelLocalizationId: column.labelLocalizationId ?? undefined,
      visible: column.visible ?? true,
      order: column.order ?? index,
      width: column.width ?? undefined,
      alignment: column.alignment ?? undefined,
      options: column.options ?? undefined,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((column, index) => ({ ...column, order: index }));
};

const mapColumnConfig = (
  payload: BackendAssociationColumnConfig | null | undefined,
  fallbackRole: AssociationColumnRole,
): AssociationColumnConfig => ({
  id: payload?.id ?? undefined,
  associationTypeId: payload?.associationTypeId ?? undefined,
  role: (payload?.role ?? fallbackRole) as AssociationColumnRole,
  columns: normalizeColumns(payload?.columns),
  createdAt: payload?.createdAt,
  updatedAt: payload?.updatedAt,
});

export interface AssociationColumnConfigUpdateRequest {
  role: AssociationColumnRole;
  columns: AssociationColumnDefinition[];
  comment?: string;
}

export const associationColumnConfigService = {
  async getConfig(
    associationTypeId: string,
    role: AssociationColumnRole,
  ): Promise<AssociationColumnConfig> {
    const response = await apiClient.get<ApiSuccessResponse<BackendAssociationColumnConfig>>(
      API_ENDPOINTS.ASSOCIATION_TYPES.COLUMN_CONFIG(associationTypeId),
      { params: { role } },
    );
    return mapColumnConfig(response.data.data, role);
  },

  async updateConfig(
    associationTypeId: string,
    payload: AssociationColumnConfigUpdateRequest,
  ): Promise<AssociationColumnConfig> {
    const response = await apiClient.put<ApiSuccessResponse<BackendAssociationColumnConfig>>(
      API_ENDPOINTS.ASSOCIATION_TYPES.COLUMN_CONFIG(associationTypeId),
      payload,
    );
    return mapColumnConfig(response.data.data, payload.role);
  },
};
