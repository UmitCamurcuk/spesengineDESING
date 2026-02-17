import React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../contexts/LanguageContext';
import { cn } from '../../../utils/cn';
import type {
  UpdateSettingsPayload,
  SettingsSearch,
  SearchStatus,
  SearchEntityType,
  SearchReindexStat,
} from '../../../api/types/api.types';

const searchEntityOptions: Array<{
  value: SearchEntityType;
  labelKey: string;
  fallbackLabel: string;
}> = [
  { value: 'item', labelKey: 'settings.search.entities.item', fallbackLabel: 'Items' },
  { value: 'item_type', labelKey: 'settings.search.entities.item_type', fallbackLabel: 'Item Types' },
  { value: 'category', labelKey: 'settings.search.entities.category', fallbackLabel: 'Categories' },
  { value: 'family', labelKey: 'settings.search.entities.family', fallbackLabel: 'Families' },
  { value: 'attribute_group', labelKey: 'settings.search.entities.attribute_group', fallbackLabel: 'Attribute Groups' },
  { value: 'attribute', labelKey: 'settings.search.entities.attribute', fallbackLabel: 'Attributes' },
  { value: 'user', labelKey: 'settings.search.entities.user', fallbackLabel: 'Users' },
  { value: 'notification_rule', labelKey: 'settings.search.entities.notification_rule', fallbackLabel: 'Notification Rules' },
];

function formatDuration(durationMs?: number | null) {
  if (!durationMs || durationMs <= 0) return '—';
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60_000) return `${(durationMs / 1000).toFixed(1)}s`;
  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1000);
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

function formatTimestamp(ts: string | null | undefined) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

interface SearchTabProps {
  form: UpdateSettingsPayload;
  isLocked: boolean;
  canEditSettings: boolean;
  searchStatus: SearchStatus | null;
  searchStatusLoading: boolean;
  searchStatusError: string | null;
  reindexLoading: boolean;
  resolveEntityLabel: (entity: SearchEntityType) => string;
  onSearchChange: <K extends keyof SettingsSearch>(field: K, value: SettingsSearch[K]) => void;
  onSearchConnectionChange: (field: keyof SettingsSearch['connection'], value: string) => void;
  onSearchEntitySelection: (entity: SearchEntityType, checked: boolean) => void;
  onRefreshStatus: () => void;
  onOpenReindexModal: () => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  form,
  isLocked,
  canEditSettings,
  searchStatus,
  searchStatusLoading,
  searchStatusError,
  reindexLoading,
  resolveEntityLabel,
  onSearchChange,
  onSearchConnectionChange,
  onSearchEntitySelection,
  onRefreshStatus,
  onOpenReindexModal,
}) => {
  const { t } = useLanguage();
  const searchConnection = form.search.connection;
  const connectionAuthType = searchConnection?.authType ?? 'none';

  const lastReindexStats: SearchReindexStat[] = searchStatus?.lastReindexStats ?? [];
  const lastReindexStatus = searchStatus?.lastReindexStatus ?? null;
  const lastReindexAt = searchStatus?.lastReindexAt ?? null;
  const skippedEntities = lastReindexStats.filter((s) => s.skipped).map((s) => resolveEntityLabel(s.entityType));

  const reindexBadgeVariant =
    lastReindexStatus === 'failed'
      ? 'error'
      : lastReindexStatus === 'partial'
      ? 'warning'
      : lastReindexStatus === 'success'
      ? 'success'
      : 'secondary';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Status card ──────────────────────────────── */}
        <Card>
          <CardHeader
            title={t('settings.search.status_title')}
            subtitle={t('settings.search.status_description')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshStatus}
                disabled={searchStatusLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', searchStatusLoading && 'animate-spin')} />
                {t('settings.search.status_refresh') || 'Refresh'}
              </Button>
            }
            className="border-none mb-2"
          />

          {searchStatusLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchStatusError ? (
            <div className="rounded-md border border-error/30 bg-error/5 p-4 text-sm text-error space-y-3">
              <p>{searchStatusError}</p>
              <Button variant="outline" size="sm" onClick={onRefreshStatus}>
                {t('common.retry') || 'Retry'}
              </Button>
            </div>
          ) : searchStatus ? (
            <div className="space-y-4">
              {/* Connection status */}
              <div className="flex items-center gap-2">
                {searchStatus.elasticsearch.connected ? (
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-error flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {searchStatus.elasticsearch.connected
                      ? t('settings.search.status_connected') || 'Connected'
                      : t('settings.search.status_disconnected') || 'Disconnected'}
                  </p>
                  {searchStatus.elasticsearch.message && (
                    <p className="text-xs text-muted-foreground">{searchStatus.elasticsearch.message}</p>
                  )}
                </div>
                <Badge variant={searchStatus.enabled ? 'primary' : 'secondary'} size="sm" className="ml-auto">
                  {searchStatus.enabled ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
                </Badge>
              </div>

              {/* Basic info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: t('settings.search.status_node') || 'Node', value: searchStatus.elasticsearch.node || '—' },
                  { label: t('settings.search.status_version') || 'Version', value: searchStatus.elasticsearch.version || '—' },
                  { label: t('settings.search.status_cluster') || 'Cluster', value: searchStatus.elasticsearch.clusterName || '—' },
                  { label: t('settings.search.status_health') || 'Health', value: searchStatus.elasticsearch.status || '—' },
                  { label: t('settings.search.status_last_checked') || 'Last Checked', value: searchStatus.lastCheckedAt ? formatTimestamp(searchStatus.lastCheckedAt) : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-medium text-foreground truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Last reindex summary */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{t('settings.search.last_reindex')}</p>
                  {lastReindexStatus && (
                    <Badge variant={reindexBadgeVariant as any} size="sm">
                      {t(`settings.search.status.${lastReindexStatus}`) || lastReindexStatus}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">{t('settings.search.status_last_checked') || 'Date'}</p>
                    <p className="font-medium text-foreground">
                      {lastReindexAt ? formatTimestamp(lastReindexAt) : t('settings.search.last_reindex_never')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('settings.search.last_reindex_duration')}</p>
                    <p className="font-medium text-foreground">
                      {formatDuration(searchStatus.lastReindexDurationMs)}
                    </p>
                  </div>
                </div>

                {/* Skipped entities warning */}
                {lastReindexStatus === 'partial' && skippedEntities.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{t('settings.search.reindex_partial_title') || 'Some entities were skipped'}</p>
                      <p className="mt-0.5">{skippedEntities.join(', ')}</p>
                    </div>
                  </div>
                )}

                {/* Per-entity stats */}
                {lastReindexStats.length > 0 && (
                  <div className="divide-y divide-border/60 rounded-md border border-border/60 text-xs">
                    {lastReindexStats.map((stat) => (
                      <div
                        key={stat.entityType}
                        className="grid grid-cols-4 gap-2 px-3 py-2"
                      >
                        <div className="col-span-1 font-medium text-foreground truncate">
                          {resolveEntityLabel(stat.entityType)}
                        </div>
                        <div className="text-muted-foreground">
                          <span className="text-foreground font-medium">{stat.indexed}</span> idx
                        </div>
                        <div className="text-muted-foreground">
                          {formatDuration(stat.durationMs)}
                        </div>
                        <div className="flex justify-end">
                          {stat.skipped ? (
                            <Badge variant="warning" size="sm">skip</Badge>
                          ) : (
                            <Badge variant="success" size="sm">ok</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('settings.search.status_error') || 'Click refresh to load status.'}
            </p>
          )}
        </Card>

        {/* ── Config card ──────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={t('settings.search.config_title')}
              subtitle={t('settings.search.config_description')}
              className="border-none mb-2"
            />
            <div className="space-y-4">
              <Checkbox
                label={t('settings.search.enabled_label')}
                checked={form.search.enabled}
                onChange={(e) => onSearchChange('enabled', e.target.checked)}
                disabled={isLocked}
              />

              {/* Indexed entities */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t('settings.search.entities_label') || 'Entities to index'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.search.entities_help') || 'Choose which entities appear in search results.'}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {searchEntityOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={t(option.labelKey) || option.fallbackLabel}
                      checked={form.search.indexedEntities.includes(option.value)}
                      onChange={(e) => onSearchEntitySelection(option.value, e.target.checked)}
                      disabled={isLocked || !form.search.enabled}
                    />
                  ))}
                </div>
              </div>

              <Input
                type="number"
                min={50}
                max={5000}
                label={t('settings.search.batch_size_label')}
                helperText={t('settings.search.batch_size_help')}
                value={form.search.reindexBatchSize}
                onChange={(e) => onSearchChange('reindexBatchSize', Number(e.target.value))}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.search.purge_label')}
                helperText={t('settings.search.purge_help')}
                checked={form.search.purgeBeforeReindex}
                onChange={(e) => onSearchChange('purgeBeforeReindex', e.target.checked)}
                disabled={isLocked}
              />
            </div>
          </Card>

          {/* Connection settings */}
          <Card>
            <CardHeader
              title={t('settings.search.connection_title')}
              subtitle={t('settings.search.connection_description')}
              className="border-none mb-2"
            />
            <div className="space-y-4">
              <Input
                label={t('settings.search.connection.node')}
                value={searchConnection?.node ?? ''}
                onChange={(e) => onSearchConnectionChange('node', e.target.value)}
                placeholder="http://localhost:9200"
                disabled={isLocked}
              />
              <Select
                label={t('settings.search.connection.auth_type')}
                value={connectionAuthType}
                onChange={(e) => onSearchConnectionChange('authType', e.target.value)}
                options={[
                  { value: 'none', label: t('settings.search.connection.auth_none') || 'None' },
                  { value: 'basic', label: t('settings.search.connection.auth_basic') || 'Username / Password' },
                  { value: 'apiKey', label: t('settings.search.connection.auth_apiKey') || 'API Key' },
                ]}
                disabled={isLocked}
              />
              {connectionAuthType === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('settings.search.connection.username')}
                    value={searchConnection?.username ?? ''}
                    onChange={(e) => onSearchConnectionChange('username', e.target.value)}
                    disabled={isLocked}
                  />
                  <Input
                    type="password"
                    label={t('settings.search.connection.password')}
                    value={searchConnection?.password ?? ''}
                    onChange={(e) => onSearchConnectionChange('password', e.target.value)}
                    disabled={isLocked}
                  />
                </div>
              )}
              {connectionAuthType === 'apiKey' && (
                <Input
                  type="password"
                  label={t('settings.search.connection.api_key')}
                  value={searchConnection?.apiKey ?? ''}
                  onChange={(e) => onSearchConnectionChange('apiKey', e.target.value)}
                  disabled={isLocked}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Reindex trigger ─────────────────────────── */}
      <Card>
        <CardHeader
          title={t('settings.search.reindex_title')}
          subtitle={t('settings.search.reindex_description')}
          className="border-none mb-2"
        />
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide mb-2">
              {t('settings.search.entities_label')}
            </p>
            <div className="flex flex-wrap gap-2">
              {form.search.indexedEntities.length === 0 ? (
                <Badge variant="secondary" size="sm">{t('common.none')}</Badge>
              ) : (
                form.search.indexedEntities.map((entity) => (
                  <Badge key={entity} variant="primary" size="sm">
                    {resolveEntityLabel(entity)}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{t('settings.search.reindex_modal_warning')}</span>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={onOpenReindexModal}
              disabled={
                !form.search.enabled ||
                form.search.indexedEntities.length === 0 ||
                !canEditSettings ||
                reindexLoading
              }
            >
              {t('settings.search.reindex_button')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
