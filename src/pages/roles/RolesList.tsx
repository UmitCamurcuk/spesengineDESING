import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { rolesService } from '../../api/services/roles.service';
import type { RoleRecord } from '../../api/types/api.types';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { PermissionDenied } from '../../components/common/PermissionDenied';

export function RolesList() {
  const navigate = useNavigate();
  const { t, language, resolveLocalization } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canReadRoles = hasPermission(PERMISSIONS.SYSTEM.ROLES.LIST);
  const canCreateRole = hasPermission(PERMISSIONS.SYSTEM.ROLES.CREATE);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(!canReadRoles);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ isSystemRole?: string }>({});

  const loadRoles = useCallback(async (nextSearch: string, nextFilters: { isSystemRole?: string }) => {
    if (!canReadRoles) {
      setForbidden(true);
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await rolesService.list({
        language,
        search: nextSearch.trim() !== '' ? nextSearch.trim() : undefined,
        isSystemRole: nextFilters.isSystemRole ? nextFilters.isSystemRole === 'true' : undefined,
      });
      setRoles(result.items);
      setForbidden(false);
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      const status = error?.status ?? error?.response?.status;

      if (status === 403) {
        setForbidden(true);
        return;
      }

      showToast({ type: 'error', message: error?.message || 'Failed to load roles' });
    } finally {
      setLoading(false);
    }
  }, [canReadRoles, language, showToast]);

  useEffect(() => {
    void loadRoles(search, filters);
  }, [loadRoles, search, filters]);

  const handleRowClick = canReadRoles ? (role: RoleRecord) => navigate(`/roles/${role.id}`) : undefined;

  const columns = [
    {
      key: 'name',
      title: t('roles.list.column_role_name'),
      sortable: true,
      render: (_value: string, role: RoleRecord) => (
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-semibold text-foreground">
                {role.name?.trim() ||
                  resolveLocalization(role.nameLocalizationId) ||
                  role.nameLocalizationId}
              </div>
              {role.isSystemRole && (
                <Badge variant="primary" size="sm">{t('roles.list.system_role')}</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">ID: {role.id}</div>
          </div>
        </div>
      ),
      mobileRender: (role: RoleRecord) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-foreground">
                  {role.name?.trim() ||
                    resolveLocalization(role.nameLocalizationId) ||
                    role.nameLocalizationId}
                </div>
                {role.isSystemRole && <Badge variant="primary" size="sm">{t('roles.list.system_role')}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">ID: {role.id}</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('roles.list.column_description')}</div>
            <div className="text-sm text-gray-600">
              {role.description?.trim() ||
                resolveLocalization(role.descriptionLocalizationId) ||
                role.descriptionLocalizationId ||
                '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: t('roles.list.column_description'),
      render: (_value: string, role: RoleRecord) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {role.description?.trim() ||
            resolveLocalization(role.descriptionLocalizationId) ||
            role.descriptionLocalizationId ||
            '—'}
        </span>
      ),
    },
    {
      key: 'isSystemRole',
      title: t('roles.list.column_type'),
      render: (value: boolean) => (
        <Badge variant={value ? 'primary' : 'secondary'} size="sm">
          {value ? t('roles.list.system_role') : t('roles.list.custom_role')}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      title: t('roles.list.column_last_updated'),
      sortable: true,
      render: (value: string, role: RoleRecord) => (
        <UserInfoWithRole
          user={role.updatedBy ? {
            id: role.updatedBy.id,
            email: role.updatedBy.email,
            name: role.updatedBy.name,
            profilePhotoUrl: role.updatedBy.profilePhotoUrl,
            role: role.updatedBy.role?.name || t('common.unknown_role')
          } : undefined}
          date={value}
        />
      ),
    },
  ];

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const tableFilters = useMemo(() => [
    {
      key: 'isSystemRole',
      label: t('roles.list.filter_type_label'),
      type: 'select' as const,
      options: [
        { value: '', label: t('common.all') || 'Tümü' },
        { value: 'true', label: t('roles.list.system_role') },
        { value: 'false', label: t('roles.list.custom_role') },
      ],
    },
  ], [t]);

  if (forbidden) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader
          title={t('roles.list.title')}
          subtitle={t('roles.list.subtitle')}
        />
        <PermissionDenied />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('roles.list.title')}
        subtitle={t('roles.list.subtitle')}
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={roles}
          columns={columns}
          searchPlaceholder={t('roles.list.search_placeholder')}
          searchValue={search}
          onSearchChange={handleSearchChange}
          filters={tableFilters}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onRowClick={handleRowClick}
          loading={loading}
          emptyState={{
            icon: <Users className="h-12 w-12" />,
            title: t('roles.list.empty_state_title'),
            description: t('roles.list.empty_state_description'),
            action: canCreateRole
              ? (
                  <Button onClick={() => navigate('/roles/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('roles.list.create_button')}
                  </Button>
                )
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
