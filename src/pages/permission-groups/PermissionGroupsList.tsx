import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Folder } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import type { PermissionGroupRecord } from '../../api/types/api.types';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';

export function PermissionGroupsList() {
  const navigate = useNavigate();
  const { t, language, resolveLocalization } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canCreatePermissionGroup = hasPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.CREATE);
  const [groups, setGroups] = useState<PermissionGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const loadGroups = useCallback(async (nextPage: number, nextPageSize: number, nextSearch: string) => {
    try {
      setLoading(true);
      const result = await permissionGroupsService.list({
        page: nextPage,
        pageSize: nextPageSize,
        search: nextSearch.trim() !== '' ? nextSearch.trim() : undefined,
        language,
      });
      setGroups(result.items);
      setPagination(result.pagination);
    } catch (error: any) {
      console.error('Failed to load permission groups:', error);
      showToast({
        type: 'error',
        message: error?.message || 'Failed to load permission groups',
      });
    } finally {
      setLoading(false);
    }
  }, [language, showToast]);

  useEffect(() => {
    void loadGroups(page, pageSize, search);
  }, [loadGroups, page, pageSize, search]);

  const columns = [
    {
      key: 'name',
      title: t('permissionGroups.list.column_group_name'),
      sortable: true,
      render: (_value: string, group: PermissionGroupRecord) => (
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
              <Folder className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-semibold text-foreground">
                {group.name?.trim() || resolveLocalization(group.nameLocalizationId) || group.nameLocalizationId}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">ID: {group.id}</div>
          </div>
        </div>
      ),
      mobileRender: (group: PermissionGroupRecord) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
              <Folder className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">
                {group.name?.trim() || resolveLocalization(group.nameLocalizationId) || group.nameLocalizationId}
              </div>
              <div className="text-xs text-muted-foreground">ID: {group.id}</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('permissionGroups.list.column_description')}</div>
            <div className="text-sm text-gray-600">
              {group.description?.trim() ||
                resolveLocalization(group.descriptionLocalizationId) ||
                group.descriptionLocalizationId ||
                '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: t('permissionGroups.list.column_description'),
      render: (_value: string, group: PermissionGroupRecord) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {group.description?.trim() ||
            resolveLocalization(group.descriptionLocalizationId) ||
            group.descriptionLocalizationId ||
            '—'}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      title: t('permissionGroups.list.column_display_order'),
      sortable: true,
      render: (value: number) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      title: t('permissionGroups.list.column_last_updated'),
      sortable: true,
      render: (value: string, group: PermissionGroupRecord) => (
        <UserInfo
          name={group.updatedBy?.name || t('common.unknown_user')}
          email={group.updatedBy?.email || t('common.unknown_user_email')}
          avatarUrl={group.updatedBy?.profilePhotoUrl}
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

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('permissionGroups.list.title')}
        subtitle={t('permissionGroups.list.subtitle')}
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={groups}
          columns={columns}
          searchPlaceholder={t('permissionGroups.list.search_placeholder')}
          searchValue={search}
          onSearchChange={handleSearchChange}
          onRowClick={(group) => navigate(`/permission-groups/${group.id}`)}
          loading={loading}
          mode="server"
          totalItems={pagination.totalItems}
          currentPage={page}
          currentPageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyState={{
            icon: <Shield className="h-12 w-12" />,
            title: t('permissionGroups.list.empty_state_title'),
            description: t('permissionGroups.list.empty_state_description'),
            action: canCreatePermissionGroup
              ? (
                  <Button onClick={() => navigate('/permission-groups/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('permissionGroups.list.create_button')}
                  </Button>
                )
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
