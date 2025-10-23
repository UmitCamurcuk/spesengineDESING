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
  };
};

export const historyService = {
  getHistory: async (params: HistoryRequestParams): Promise<HistoryListResult> => {
    const response = await apiClient.get<HistoryResponse>(API_ENDPOINTS.HISTORY, {
      params,
    });

    const payload: HistoryResponseData = response.data.data;

    return {
      items: payload.items.map(toHistoryEntry),
      pagination: payload.pagination,
    };
  },
};
