import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Languages, FileText, RefreshCcw, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { localizationsService } from '../../api';
import type { ApiPagination, LocalizationRecord } from '../../api/types/api.types';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';

const normalizeLanguageCode = (code: string): string => {
  const trimmed = code.trim();
  if (!trimmed.includes('-')) {
    return trimmed.toLowerCase();
  }
  const [language, region] = trimmed.split('-', 2);
  return `${language.toLowerCase()}-${(region ?? '').toUpperCase()}`;
};

const formatDateTime = (value: string) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const createEmptyPagination = (): ApiPagination => ({
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
});

export const LocalizationsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const { hasPermission } = useAuth();
  const canCreateLocalization = hasPermission(PERMISSIONS.SYSTEM.LOCALIZATIONS.CREATE);

  const [localizations, setLocalizations] = useState<LocalizationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [pagination, setPagination] = useState<ApiPagination>(createEmptyPagination);

  const fetchLocalizations = useCallback(
    async (nextPage: number, nextPageSize: number, nextSearch: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await localizationsService.list({
          page: nextPage,
          pageSize: nextPageSize,
          search: nextSearch.trim() !== '' ? nextSearch.trim() : undefined,
        });
        setLocalizations(response.items);
        setPagination(response.pagination);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('common.error');
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void fetchLocalizations(page, pageSize, search);
  }, [fetchLocalizations, page, pageSize, search]);

  const defaultLanguageCode = useMemo(
    () => normalizeLanguageCode(settings?.localization.defaultLanguage ?? 'en'),
    [settings?.localization.defaultLanguage],
  );

  const defaultLanguageLabel = useMemo(() => {
    const match = settings?.localization.supportedLanguages.find(
      (lang) => normalizeLanguageCode(lang.code) === defaultLanguageCode,
    );
    return match?.label ?? defaultLanguageCode.toUpperCase();
  }, [defaultLanguageCode, settings?.localization.supportedLanguages]);

  const requiredLanguages = useMemo(
    () => settings?.localization.supportedLanguages.filter((lang) => lang.required) ?? [],
    [settings?.localization.supportedLanguages],
  );

  const optionalLanguages = useMemo(
    () => settings?.localization.supportedLanguages.filter((lang) => !lang.required) ?? [],
    [settings?.localization.supportedLanguages],
  );

  const columns = useMemo(() => [
    {
      key: 'key',
      title: t('localizations.key'),
      sortable: false,
      render: (value: string, localization: LocalizationRecord) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground font-mono">{value}</div>
            <div className="text-xs text-muted-foreground">ID: {localization.id}</div>
          </div>
        </div>
      ),
      mobileRender: (localization: LocalizationRecord) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground font-mono">{localization.key}</div>
              <div className="text-xs text-muted-foreground">ID: {localization.id}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t('localizations.namespace')}
              </div>
              <Badge variant="primary" size="sm">{localization.namespace}</Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t('localizations.translations')}
              </div>
              <div className="flex items-center space-x-1">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{Object.keys(localization.translations).length}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t('localizations.description')}
            </div>
            <div className="text-sm text-foreground line-clamp-3">{localization.description ?? '—'}</div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t('localizations.updated_at')}
            </div>
            <div className="text-sm text-muted-foreground">{formatDateTime(localization.updatedAt)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'namespace',
      title: t('localizations.namespace'),
      render: (value: string) => <Badge variant="primary" size="sm">{value}</Badge>,
    },
    {
      key: 'translations',
      title: t('localizations.translations'),
      render: (value: Record<string, string>) => (
        <div className="flex items-center space-x-1">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{Object.keys(value).length}</span>
        </div>
      ),
    },
    {
      key: 'description',
      title: t('localizations.description'),
      render: (value: string | null) => (
        <span className="text-sm text-muted-foreground line-clamp-2">{value ?? '—'}</span>
      ),
    },
    {
      key: `translations.${defaultLanguageCode}`,
      title: t('localizations.translation_text', { language: defaultLanguageLabel }),
      render: (_: unknown, localization: LocalizationRecord) => {
        const translation = localization.translations[defaultLanguageCode];
        return (
          <span className="text-sm text-foreground italic">
            {translation ? `"${translation}"` : t('localizations.no_translation')}
          </span>
        );
      },
    },
    {
      key: 'updatedAt',
      title: t('localizations.updated_at'),
      sortable: false,
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(value)}</span>
      ),
    },
  ], [defaultLanguageCode, defaultLanguageLabel, t]);

  const handleRefresh = () => {
    void fetchLocalizations(page, pageSize, search);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearch(value);
  };

  const renderLanguageBadges = (languages: typeof requiredLanguages) => {
    if (!languages.length) {
      return <span className="text-xs text-muted-foreground">{t('localizations.settings.none')}</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {languages.map((lang) => (
          <Badge key={lang.code} variant="secondary" size="sm">
            {lang.label} ({normalizeLanguageCode(lang.code)})
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <PageHeader
        title={t('localizations.title')}
        subtitle={t('localizations.subtitle')}
        action={(
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            {canCreateLocalization && (
              <Button type="button" onClick={() => navigate('/localizations/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('localizations.create_title')}
              </Button>
            )}
          </div>
        )}
      />

      {error && localizations.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={handleRefresh}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      <DataTable<LocalizationRecord>
        data={localizations}
        columns={columns}
        loading={loading}
        mode="server"
        totalItems={pagination.totalItems}
        currentPage={page}
        currentPageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        searchPlaceholder={t('localizations.search_placeholder')}
        searchValue={search}
        onSearchChange={handleSearchChange}
        onRowClick={(item) => navigate(`/localizations/${item.id}`)}
        emptyState={{
          icon: error ? <AlertCircle className="h-10 w-10 text-error" /> : <FileText className="h-10 w-10 text-muted-foreground" />,
          title: error ? t('localizations.list_title') : t('localizations.no_localizations'),
          description: error ?? t('localizations.create_new_localization'),
          action: (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleRefresh}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                {t('common.retry')}
              </Button>
              {canCreateLocalization && (
                <Button type="button" onClick={() => navigate('/localizations/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('localizations.create_title')}
                </Button>
              )}
            </div>
          ),
        }}
      />

      <Card>
        <CardHeader
          title={t('localizations.settings.title')}
          subtitle={t('localizations.settings.subtitle')}
          className="border-none mb-2"
        />
        {settings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('settings.localization.labels.default')}
              </p>
              <Badge variant="success" size="sm">
                {defaultLanguageLabel} ({defaultLanguageCode})
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('settings.localization.labels.fallback')}
              </p>
              <Badge variant="secondary" size="sm">
                {(() => {
                  const fallbackCode = normalizeLanguageCode(settings.localization.fallbackLanguage);
                  const fallbackLabel = settings.localization.supportedLanguages.find(
                    (lang) => normalizeLanguageCode(lang.code) === fallbackCode,
                  )?.label ?? fallbackCode.toUpperCase();
                  return `${fallbackLabel} (${fallbackCode})`;
                })()}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('settings.localization.labels.required_badge')}
              </p>
              {renderLanguageBadges(requiredLanguages)}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('localizations.settings.optional_languages')}
              </p>
              {renderLanguageBadges(optionalLanguages)}
            </div>
          </div>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">{t('common.loading')}</div>
        )}
      </Card>
    </div>
  );
};
