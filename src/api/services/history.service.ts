import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type {
  HistoryResponse,
  HistoryApiItem,
  HistoryResponseData,
  HistoryApiPagination,
} from '../types/api.types';
import type { HistoryEntry, HistoryChange, HistoryActor } from '../../types/common';

export interface HistoryRequestParams {
  entityType: string;
  entityId: string;
  page?: number;
  pageSize?: number;
  action?: string;
  actor?: string;
  search?: string;
  tags?: string[];
}

export interface HistoryListResult {
  items: HistoryEntry[];
  pagination: HistoryApiPagination;
}

const formatActorName = (actor?: HistoryActor): string | undefined => {
  if (!actor) {
    return undefined;
  }

  if (actor.name && actor.name.trim().length > 0) {
    return actor.name;
  }

  if (actor.email) {
    const [namePart] = actor.email.split('@');
    return namePart ?? actor.email;
  }

  if (actor.userId) {
    return actor.userId;
  }

  if (actor.ip) {
    return actor.ip;
  }

  return undefined;
};

const ensureActor = (item: HistoryApiItem): HistoryActor | undefined => {
  if (!item.actor && !item.request) {
    return undefined;
  }

  const actor: HistoryActor = {
    userId: item.actor?.userId,
    email: item.actor?.email,
    ip: item.actor?.ip,
    userAgent: item.actor?.userAgent,
    name: item.actor?.name,
    profilePhotoUrl: item.actor?.profilePhotoUrl,
  };

  if (item.actor?.role) {
    const rawRole = item.actor.role;
    if (typeof rawRole === 'string') {
      actor.role = { name: rawRole };
    } else {
      actor.role = {
        id: rawRole.id,
        name: rawRole.name ?? undefined,
        isSystemRole: rawRole.isSystemRole,
      };
    }
  }

  const name = formatActorName(actor);
  if (name) {
    actor.name = name;
  }

  return Object.values(actor).some((value) => value !== undefined && value !== '')
    ? actor
    : undefined;
};

const buildChanges = (item: HistoryApiItem): HistoryChange[] | undefined => {
  const before = item.diff?.before;
  const after = item.diff?.after;

  if ((!before || typeof before !== 'object') && (!after || typeof after !== 'object')) {
    return undefined;
  }

  const keys = new Set<string>();
  if (before && typeof before === 'object') {
    Object.keys(before as Record<string, unknown>).forEach((key) => keys.add(key));
  }
  if (after && typeof after === 'object') {
    Object.keys(after as Record<string, unknown>).forEach((key) => keys.add(key));
  }

  const changes: HistoryChange[] = [];

  keys.forEach((key) => {
    const oldValue =
      before && typeof before === 'object'
        ? (before as Record<string, unknown>)[key]
        : undefined;
    const newValue =
      after && typeof after === 'object'
        ? (after as Record<string, unknown>)[key]
        : undefined;

    if (oldValue !== undefined || newValue !== undefined) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      });
    }
  });

  return changes.length > 0 ? changes : undefined;
};

const toHistoryEntry = (item: HistoryApiItem): HistoryEntry => {
  const changes = buildChanges(item);
  const actor = ensureActor(item);
  const actorName = formatActorName(actor);
  const actorEmail = actor?.email ?? item.actor?.email ?? actor?.ip ?? undefined;

  return {
    id: item.id,
    tenantId: item.tenantId,
    entityType: item.entity.type,
    entityId: item.entity.id,
    entityLabel: item.entity.label ?? undefined,
    entityEmail: item.entity.email ?? undefined,
    entityProfilePhotoUrl: item.entity.profilePhotoUrl ?? undefined,
    action: item.action,
    summary: item.summary ?? `${item.entity.type} ${item.action}`,
    timestamp: item.at,
    actor,
    actorName: actorName ?? 'System',
    actorEmail,
    changes,
    diff: item.diff,
    tags: item.tags,
    metadata: item.meta ?? undefined,
    request: item.request,
    comment: typeof item.meta?.comment === 'string' ? item.meta.comment : undefined,
  };
};

export const historyService = {
  getHistory: async (params: HistoryRequestParams): Promise<HistoryListResult> => {
    const response = await apiClient.get<HistoryResponse>(API_ENDPOINTS.HISTORY, {
      params,
    });

    const payload: HistoryResponseData = response.data.data;
    const searchTerm = params.search?.toLowerCase().trim();

    const mappedItems = payload.items.map(toHistoryEntry);

    const filteredItems = searchTerm
      ? mappedItems.filter((entry) => {
          const matchesComment = entry.comment?.toLowerCase().includes(searchTerm) ?? false;
          const matchesChanges = entry.changes?.some((change) => {
            const values = [change.field, change.oldValue, change.newValue]
              .map((val) => (val === null || val === undefined ? '' : String(val).toLowerCase()));
            return values.some((val) => val.includes(searchTerm));
          }) ?? false;
          return matchesComment || matchesChanges;
        })
      : mappedItems;

    const adjustedPagination = searchTerm
      ? {
          ...payload.pagination,
          totalItems: filteredItems.length,
          totalPages: Math.max(1, Math.ceil(filteredItems.length / Math.max(payload.pagination.pageSize, 1))),
        }
      : payload.pagination;

    return {
      items: filteredItems,
      pagination: adjustedPagination,
    };
  },
};
