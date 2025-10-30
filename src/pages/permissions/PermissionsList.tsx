import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Shield } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { permissionsService } from '../../api/services/permissions.service';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import type { PermissionRecord, PermissionGroupRecord } from '../../api/types/api.types';

export function PermissionsList() {
  const navigate = useNavigate();
  const { t, language, resolveLocalization } = useLanguage();
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [groups, setGroups] = useState<PermissionGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ permissionGroupId?: string }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const loadData = useCallback(async (
    nextPage: number,
    nextPageSize: number,
    nextSearch: string,
    nextFilters: { permissionGroupId?: string }
  ) => {
    try {
      setLoading(true);
      const [permResult, groupsResult] = await Promise.all([
        permissionsService.list({
          page: nextPage,
          pageSize: nextPageSize,
          search: nextSearch.trim() !== '' ? nextSearch.trim() : undefined,
          permissionGroupId: nextFilters.permissionGroupId || undefined,
          language,
        }),
        permissionGroupsService.list({ language }),
      ]);
      setPermissions(permResult.items);
      setPagination(permResult.pagination);
      setGroups(groupsResult.items);
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
      showToast({
        type: 'error',
        message: error?.message || 'Failed to load permissions',
      });
    } finally {
      setLoading(false);
    }
  }, [language, showToast]);

  useEffect(() => {
    void loadData(page, pageSize, search, filters);
  }, [loadData, page, pageSize, search, filters]);

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return (
      group?.name?.trim() ||
      (group?.nameLocalizationId ? resolveLocalization(group.nameLocalizationId) : '') ||
      group?.nameLocalizationId ||
      t('permissions.list.unknown_group')
    );
  };

  const columns = [
    {
      key: 'code',
      title: t('permissions.list.column_permission_code'),
      sortable: true,
      render: (value: string, permission: PermissionRecord) => (
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Key className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <code className="text-sm font-mono font-semibold text-foreground bg-muted px-2 py-1 rounded">{value}</code>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {permission.name?.trim() ||
                resolveLocalization(permission.nameLocalizationId) ||
                permission.nameLocalizationId}
            </div>
          </div>
        </div>
      ),
      mobileRender: (permission: PermissionRecord) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <code className="text-sm font-mono font-semibold text-foreground">{permission.code}</code>
              <div className="text-xs text-muted-foreground">
                {permission.name?.trim() ||
                  resolveLocalization(permission.nameLocalizationId) ||
                  permission.nameLocalizationId}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('permissions.list.column_description')}</div>
            <div className="text-sm text-gray-600">
              {permission.description?.trim() ||
                resolveLocalization(permission.descriptionLocalizationId) ||
                permission.descriptionLocalizationId ||
                '—'}
            </div>
          </div>
          <div>
            <Badge variant="secondary" size="sm">
              {getGroupName(permission.permissionGroupId)}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'permissionGroupId',
      title: t('permissions.list.column_group'),
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {getGroupName(value)}
        </Badge>
      ),
    },
    {
      key: 'description',
      title: t('permissions.list.column_description'),
      render: (_value: string, permission: PermissionRecord) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {permission.description?.trim() ||
            resolveLocalization(permission.descriptionLocalizationId) ||
            permission.descriptionLocalizationId ||
            '—'}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      title: t('permissions.list.column_order'),
      sortable: true,
      render: (value: number) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      title: t('permissions.list.column_last_updated'),
      sortable: true,
      render: (value: string, permission: PermissionRecord) => (
        <UserInfo
          name={permission.updatedBy?.name || t('common.unknown_user')}
          email={permission.updatedBy?.email || t('common.unknown_user_email')}
          avatarUrl={permission.updatedBy?.profilePhotoUrl}
          date={value}
        />
      ),
    },
  ];

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

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const tableFilters = useMemo(() => [
    {
      key: 'permissionGroupId',
      label: t('permissions.list.column_group'),
      type: 'select' as const,
      options: [
        { value: '', label: t('common.all') || 'Tümü' },
        ...groups.map((group) => ({
          value: group.id,
          label:
            group.name?.trim() ||
            resolveLocalization(group.nameLocalizationId) ||
            group.nameLocalizationId,
        })),
      ],
    },
  ], [groups, resolveLocalization, t]);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('permissions.list.title')}
        subtitle={t('permissions.list.subtitle')}
      />

      <div className="flex-1 mt-6">
        <DataTable
          data={permissions}
          columns={columns}
          loading={loading}
          mode="server"
          searchPlaceholder={t('permissions.list.search_placeholder')}
          searchValue={search}
          onSearchChange={handleSearchChange}
          filters={tableFilters}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onRowClick={(permission) => navigate(`/permissions/${permission.id}`)}
          totalItems={pagination.totalItems}
          currentPage={page}
          currentPageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyState={{
            icon: <Shield className="h-12 w-12" />,
            title: t('permissions.no_permissions'),
            description: t('permissions.create_new_permission'),
          }}
        />
      </div>
    </div>
  );
}
