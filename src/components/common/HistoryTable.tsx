import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Download,
  Upload,
  LogIn,
  LogOut,
  Clock,
  User,
  MessageSquare,
} from 'lucide-react';
import { DataTable, UserInfo } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ChangesModal } from '../ui/ChangesModal';
import { HistoryEntry, HistoryChange } from '../../types/common';
import { useServerTable } from '../../hooks';
import { historyService } from '../../api/services/history.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { resolveAssetUrl } from '../../utils/url';
import { formatHistoryFieldLabel, formatHistoryValue } from '../../utils/historyFormat';
import { useDateFormatter } from '../../hooks/useDateFormatter';

interface HistoryTableProps {
  entityType?: string;
  entityId?: string;
  records?: HistoryEntry[];
  loading?: boolean;
  title?: string;
  description?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
}

interface HistoryTableFilters {
  action?: string;
  actor?: string;
}

const defaultActionOrder = ['created', 'updated', 'deleted', 'viewed', 'login', 'logout'];

const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return <Plus className="h-4 w-4" />;
    case 'updated':
      return <Edit2 className="h-4 w-4" />;
    case 'deleted':
      return <Trash2 className="h-4 w-4" />;
    case 'viewed':
      return <Eye className="h-4 w-4" />;
    case 'exported':
      return <Download className="h-4 w-4" />;
    case 'imported':
      return <Upload className="h-4 w-4" />;
    case 'login':
      return <LogIn className="h-4 w-4" />;
    case 'logout':
      return <LogOut className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'created':
      return 'success';
    case 'updated':
      return 'warning';
    case 'deleted':
      return 'error';
    case 'viewed':
      return 'secondary';
    case 'exported':
    case 'imported':
      return 'primary';
    case 'login':
      return 'primary';
    case 'logout':
      return 'secondary';
    default:
      return 'default';
  }
};

const formatLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isImageValue = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('data:')) {
    return normalized.startsWith('data:image');
  }
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(normalized) || normalized.startsWith('/uploads/');
};

const renderChangeMedia = (value: unknown, label: string) => {
  if (!isImageValue(value)) {
    return null;
  }

  const apiBase = import.meta.env.VITE_ASSET_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  const src = resolveAssetUrl(value, apiBase);

  return (
    <img
      src={src}
      alt={label}
      className="h-12 w-12 rounded-md object-cover border border-border"
      referrerPolicy="no-referrer"
    />
  );
};

const getActorName = (entry: HistoryEntry): string =>
  entry.actorName ??
  entry.actor?.name ??
  entry.actor?.email ??
  entry.actor?.userId ??
  entry.actor?.ip ??
  'System';

export const HistoryTable: React.FC<HistoryTableProps> = ({
  entityType,
  entityId,
  records,
  loading: externalLoading = false,
  title = 'Activity History',
  description = 'Complete audit trail of all changes and activities',
  currentUserId,
  currentUserName,
  currentUserEmail,
}) => {
  const { t, language } = useLanguage();
  const { formatDateTime } = useDateFormatter();
  const useServer = !records;
  const scrollPositionRef = useRef(0);
  const [selectedChanges, setSelectedChanges] = useState<HistoryChange[] | null>(null);
  const [changesModalOpen, setChangesModalOpen] = useState(false);

  const handleShowChanges = useCallback((changes: HistoryChange[]) => {
    setSelectedChanges(changes);
    setChangesModalOpen(true);
  }, []);

  const handleCloseChangesModal = useCallback(() => {
    setChangesModalOpen(false);
    setSelectedChanges(null);
  }, []);

  const renderChanges = useCallback(
    (changes: HistoryChange[] | undefined) => {
      if (!changes || changes.length === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }

      if (changes.length > 1) {
        const summaryLabel = t('profile.history_changes_label');
        return (
          <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {`${changes.length} ${summaryLabel}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShowChanges(changes)}
              className="h-6 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              {t('profile.history_view_details')}
            </Button>
          </div>
        );
      }

      const change = changes[0];
      const fieldLabel = formatHistoryFieldLabel(change.field, t);
      const oldValue = formatHistoryValue(change.field, change.oldValue, t);
      const newValue = formatHistoryValue(change.field, change.newValue, t);
      const oldMedia = renderChangeMedia(change.oldValue, `${change.field}-before`);
      const newMedia = renderChangeMedia(change.newValue, `${change.field}-after`);

      return (
        <div className="space-y-2 text-xs text-left">
          <div className="font-medium text-foreground flex items-center gap-2">
            <span className="truncate">{fieldLabel}</span>
            {newMedia}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {change.oldValue !== undefined ? t('profile.history_before_label') : ''}
              </div>
              <div className="text-error line-through text-xs whitespace-pre-wrap break-words">
                {oldMedia ?? oldValue}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {change.newValue !== undefined ? t('profile.history_after_label') : ''}
              </div>
              <div className="text-success text-xs whitespace-pre-wrap break-words">
                {newMedia ?? newValue}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShowChanges(changes)}
              className="h-6 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              {t('profile.history_view_details')}
            </Button>
          </div>
        </div>
      );
    },
    [t, handleShowChanges],
  );

  const fetchHistory = useCallback(
    async ({ page, pageSize, filters, search }: { page: number; pageSize: number; filters: HistoryTableFilters; search?: string }) => {
      if (!useServer || !entityType || !entityId) {
        const dataset = records ?? [];
        return {
          items: dataset,
          totalItems: dataset.length,
        };
      }

      const response = await historyService.getHistory({
        entityType,
        entityId,
        page,
        pageSize,
        action: filters.action && filters.action.length > 0 ? filters.action : undefined,
        actor: filters.actor && filters.actor.length > 0 ? filters.actor : undefined,
        search,
      });

      return {
        items: response.items,
        totalItems: response.pagination.totalItems,
      };
    },
    [entityId, entityType, records, useServer],
  );

  const {
    items,
    loading,
    error,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
    search,
    setSearch,
    filters: serverFilters,
    setFilters,
    refresh,
  } = useServerTable<HistoryEntry, HistoryTableFilters>({
    fetcher: fetchHistory,
    initialPageSize: 5,
    initialFilters: { action: '', actor: '' },
  });

  const dataset = useServer ? items : records ?? [];
  const isLoading = externalLoading || (useServer ? loading : false);

  const formatTimestamp = useCallback(
    (value?: string | null) => formatDateTime(value ?? undefined, { includeTime: true }),
    [formatDateTime],
  );

  const translateAction = useCallback(
    (action: string) => t(`profile.history_action_${action}`) || formatLabel(action),
    [t],
  );

  const translateTag = useCallback(
    (tag: string) => t(`profile.history_tag_${tag}`) || formatLabel(tag),
    [t],
  );

  const actionOptions = useMemo(() => {
    const actions = Array.from(
      new Set([...defaultActionOrder, ...dataset.map((entry) => entry.action)]),
    );
    return actions.map((action) => ({
      value: action,
      label: translateAction(action),
    }));
  }, [dataset, translateAction]);

  const actorOptions = useMemo(() => {
    const actorMap = new Map<string, string>();
    dataset.forEach((entry) => {
      const value = entry.actorEmail ?? entry.actor?.email ?? entry.actor?.userId ?? '';
      if (!value) {
        return;
      }
      if (!actorMap.has(value)) {
        actorMap.set(value, getActorName(entry));
      }
    });

    return Array.from(actorMap.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [dataset]);

  const filterValues = useServer
    ? {
        action: serverFilters.action ?? '',
        actor: serverFilters.actor ?? '',
      }
    : undefined;

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if (!useServer) {
        return;
      }
      scrollPositionRef.current = window.scrollY;

      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }) as HistoryTableFilters);
    },
    [setFilters, useServer],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      if (!useServer) {
        return;
      }
      scrollPositionRef.current = window.scrollY;
      setSearch(value);
    },
    [setSearch, useServer],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (!useServer) {
        return;
      }
      scrollPositionRef.current = window.scrollY;
      setPage(nextPage);
    },
    [setPage, useServer],
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      if (!useServer) {
        return;
      }
      scrollPositionRef.current = window.scrollY;
      setPageSize(nextSize);
    },
    [setPageSize, useServer],
  );

  const handleRefresh = useCallback(() => {
    if (!useServer) {
      return;
    }
    scrollPositionRef.current = window.scrollY;
    void refresh();
  }, [refresh, useServer]);

  const serverError = useServer ? error : null;

  useEffect(() => {
    if (!useServer) {
      return;
    }
    if (!isLoading) {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
    }
  }, [isLoading, useServer]);

  const resolveSummary = useCallback(
    (entry: HistoryEntry) => {
      const entityKey = entry.entityType?.toLowerCase() ?? 'generic';
      let summaryKey = `profile.history_summary_${entityKey}_${entry.action}`;

      if (
        currentUserId &&
        entry.entityType === 'User' &&
        entry.action === 'viewed' &&
        entry.actor?.userId === currentUserId
      ) {
        summaryKey = `profile.history_summary_${entityKey}_${entry.action}_self`;
      }

      return t(summaryKey) || entry.summary || translateAction(entry.action);
    },
    [currentUserId, t, translateAction],
  );

  const resolveSourceLabel = useCallback(
    (source?: string | null) => {
      if (!source) {
        return undefined;
      }
      return t(`profile.history_source_${source}`) || formatLabel(source);
    },
    [t],
  );

  const resolveActorInfo = useCallback(
    (entry: HistoryEntry) => {
      const baseName =
        entry.actor?.name ??
        entry.actorName ??
        entry.actor?.email ??
        entry.actor?.userId ??
        entry.actor?.ip ??
        t('profile.history_actor_unknown');

      const email = entry.actor?.email ?? entry.actorEmail ?? undefined;
      const identifier =
        email ??
        entry.actor?.userId ??
        entry.actor?.ip ??
        '—';

      const assetBase = import.meta.env.VITE_ASSET_BASE_URL || import.meta.env.VITE_API_BASE_URL;
      const rawAvatar = entry.actor?.profilePhotoUrl ?? entry.entityProfilePhotoUrl;
      const avatarUrl = resolveAssetUrl(rawAvatar, assetBase);

      let displayName = baseName;
      if (currentUserId && entry.actor?.userId === currentUserId) {
        const youLabel = t('profile.history_actor_you');
        displayName = baseName && baseName !== youLabel ? `${baseName} (${youLabel})` : youLabel;
      } else if (baseName === 'System') {
        displayName = t('profile.history_actor_system');
      }

      return {
        name: displayName,
        email,
        identifier,
        avatarUrl,
      };
    },
    [currentUserId, t],
  );

  const getEntityInfo = useCallback(
    (entry: HistoryEntry) => {
      const typeKey = entry.entityType?.toLowerCase();
      const typeLabel = t(`profile.history_entity_${typeKey}`) || entry.entityType;
      const label = entry.entityLabel ?? entry.entityId;
      const email = entry.entityEmail;
      return { typeLabel, label, email };
    },
    [t],
  );

  const columns = useMemo(
    () => [
      {
        key: 'action',
        title: t('profile.history_column_action'),
        width: '10%',
        render: (_: string, entry: HistoryEntry) => (
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-full bg-${getActionColor(entry.action)}-100`}>
              {getActionIcon(entry.action)}
            </div>
            <Badge variant={getActionColor(entry.action) as any} size="sm">
              {translateAction(entry.action)}
            </Badge>
          </div>
        ),
        mobileRender: (entry: HistoryEntry) => (
          (() => {
            const actorInfo = resolveActorInfo(entry);
            const entityInfo = getEntityInfo(entry);
            return (
              <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-full bg-${getActionColor(entry.action)}-100`}>
                  {getActionIcon(entry.action)}
                </div>
                <Badge variant={getActionColor(entry.action) as any} size="sm">
                  {translateAction(entry.action)}
                </Badge>
              </div>
              <div className="flex items-center text-xs text-muted-foreground space-x-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTimestamp(entry.timestamp)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">
                {resolveSummary(entry)}
              </div>
              <div className="text-xs text-muted-foreground">
                {entityInfo.typeLabel}
                {' · '}
                {entityInfo.label}
              </div>
              {entityInfo.email && (
                <div className="text-xs text-muted-foreground">
                  {entityInfo.email}
                </div>
              )}
              {entry.request?.source && (
                <div className="text-xs text-muted-foreground">
                  {t('profile.history_source_label')}: {resolveSourceLabel(entry.request.source)}
                </div>
              )}
            </div>

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm">
                    {translateTag(tag)}
                  </Badge>
                ))}
              </div>
            )}

            <div>{renderChanges(entry.changes)}</div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                {actorInfo.avatarUrl ? (
                  <img
                    src={actorInfo.avatarUrl}
                    alt={actorInfo.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="h-3.5 w-3.5 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{actorInfo.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {actorInfo.email ?? actorInfo.identifier}
                </span>
              </div>
            </div>

            {entry.comment && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5 mt-0.5" />
                <span className="text-foreground whitespace-pre-wrap break-words">{entry.comment}</span>
              </div>
            )}
          </div>
            );
          })()
        ),
      },
      {
        key: 'summary',
        title: t('profile.history_column_details'),
        width: '20%',
        render: (_: string, entry: HistoryEntry) => (
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              {resolveSummary(entry)}
            </div>
            {(() => {
              const entityInfo = getEntityInfo(entry);
              return (
                <>
                  <div className="text-xs text-muted-foreground">
                    {entityInfo.typeLabel}
                    {' · '}
                    {entityInfo.label}
                  </div>
                  {entityInfo.email && (
                    <div className="text-xs text-muted-foreground">{entityInfo.email}</div>
                  )}
                </>
              );
            })()}
            {entry.request?.source && (
              <div className="text-xs text-muted-foreground">
                {t('profile.history_source_label')}: {resolveSourceLabel(entry.request.source)}
              </div>
            )}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm">
                    {translateTag(tag)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'changes',
        title: t('profile.history_column_changes'),
        align: 'left' as const,
        width: '40%',
        render: (_: HistoryChange[] | undefined, entry: HistoryEntry) => (
          <div className="max-w-[360px] text-left">
            {renderChanges(entry.changes)}
          </div>
        ),
      },
      {
        key: 'comment',
        title: t('profile.history_column_comment'),
        width: '20%',
        render: (_: string | undefined, entry: HistoryEntry) =>
          entry.comment ? (
            <div className="flex items-start gap-2 text-sm text-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div className="text-left whitespace-normal break-words">{entry.comment}</div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
       key: 'timestamp',
        title: t('profile.history_column_performed'),
        sortable: true,
        align: 'center' as const,
        width: '10%',
        render: (_: string, entry: HistoryEntry) => (
          (() => {
            const actorInfo = resolveActorInfo(entry);
            return (
              <div className="flex justify-center w-full">
                <UserInfo
                  name={actorInfo.name}
                  email={actorInfo.email ?? actorInfo.identifier}
                  avatarUrl={actorInfo.avatarUrl}
                  date={formatTimestamp(entry.timestamp)}
                />
              </div>
            );
          })()
        ),
      },
    ],
    [getEntityInfo, formatTimestamp, resolveActorInfo, resolveSourceLabel, resolveSummary, t, translateAction, translateTag],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {useServer && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? t('common.loading') : t('profile.history_reload')}
            </Button>
          </div>
        )}
      </div>

      {serverError && (
        <div className="rounded-md border border-error/30 bg-error-background/40 px-3 py-2 text-sm text-error">
          {serverError}
        </div>
      )}

      <DataTable
        data={dataset}
        columns={columns}
        loading={isLoading}
        searchable
        searchPlaceholder={t('profile.history_search_placeholder') || 'Search history...'}
        filters={[
          {
            key: 'action',
            label: t('profile.history_filter_all_actions'),
            type: 'select',
            options: actionOptions,
          },
          {
            key: 'actor',
            label: t('profile.history_filter_all_users'),
            type: 'select',
            options: actorOptions,
          },
        ]}
        mode={useServer ? 'server' : 'client'}
        totalItems={useServer ? totalItems : undefined}
        currentPage={useServer ? page : undefined}
        currentPageSize={useServer ? pageSize : undefined}
        onPageChange={useServer ? handlePageChange : undefined}
        onPageSizeChange={useServer ? handlePageSizeChange : undefined}
        searchValue={useServer ? search : undefined}
        onSearchChange={useServer ? handleSearchChange : undefined}
        filterValues={filterValues}
        onFilterChange={useServer ? handleFilterChange : undefined}
        pageSize={useServer ? pageSize : 5}
        emptyState={{
          icon: <Activity className="h-12 w-12" />,
          title: t('profile.history_empty'),
          description: t('profile.history_empty_description') || 'No activities have been recorded yet.',
        }}
      />

      <ChangesModal
        isOpen={changesModalOpen}
        onClose={handleCloseChangesModal}
        changes={selectedChanges || []}
        title={t('profile.history_modal_title')}
      />
    </div>
  );
};
