import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Mail, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersService } from '../../api/services/users.service';
import { rolesService } from '../../api/services/roles.service';
import type { UserSummary, UserListResponse, RoleRecord } from '../../api/types/api.types';

const deriveStatus = (user: UserSummary): { label: string; variant: 'success' | 'warning' | 'default' } => {
  if (user.notificationsEnabled && user.emailNotificationsEnabled) {
    return { label: 'active', variant: 'success' };
  }
  if (!user.notificationsEnabled && !user.emailNotificationsEnabled) {
    return { label: 'inactive', variant: 'default' };
  }
  return { label: 'partial', variant: 'warning' };
};

const formatFullName = (user: UserSummary): string => {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
};

export const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, resolveLocalization } = useLanguage();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ roleId?: string; status?: string }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const loadUsers = useCallback(async (
    nextPage: number,
    nextPageSize: number,
    nextSearch: string,
    nextFilters: { roleId?: string; status?: string }
  ) => {
    try {
      setLoading(true);
      const response: UserListResponse = await usersService.list({
        page: nextPage,
        pageSize: nextPageSize,
        search: nextSearch.trim() !== '' ? nextSearch.trim() : undefined,
        roleId: nextFilters.roleId || undefined,
        status: nextFilters.status as 'active' | 'inactive' | 'partial' | undefined,
        language,
      });
      setUsers(response.items);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [language]);

  const loadRoles = useCallback(async () => {
    try {
      const result = await rolesService.list({ language });
      setRoles(result.items);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  }, [language]);

  useEffect(() => {
    void loadUsers(page, pageSize, search, filters);
    void loadRoles();
  }, [loadUsers, loadRoles, page, pageSize, search, filters]);

  const columns = [
    {
      key: 'name',
      title: t('users.list.column_user'),
      sortable: true,
      render: (_value: string, user: UserSummary) => {
        const avatarUrl = user.profilePhotoUrl 
          ? user.profilePhotoUrl.startsWith('/uploads') 
            ? user.profilePhotoUrl 
            : `/uploads${user.profilePhotoUrl}`
          : null;
        return (
          <div className="flex items-center space-x-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={formatFullName(user)}
                className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-gray-200 dark:ring-gray-700"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm ${avatarUrl ? 'hidden' : ''}`}
            >
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{formatFullName(user)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Mail className="h-3 w-3 mr-1" />
                {user.email}
              </div>
            </div>
          </div>
        );
      },
      mobileRender: (user: UserSummary) => {
        const status = deriveStatus(user);
        const statusLabel = status.label === 'active' 
          ? t('users.list.status_active')
          : status.label === 'inactive'
          ? t('users.list.status_inactive')
          : t('users.list.status_partial');
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-semibold text-foreground">{formatFullName(user)}</div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Mail className="h-3 w-3 mr-1" />
                  {user.email}
                </div>
              </div>
              <Badge variant={status.variant} size="sm">
                {statusLabel}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('users.list.column_role')}</div>
                <Badge variant="secondary" size="sm">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.primaryRoleName || user.primaryRoleId || '—'}
                </Badge>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('users.list.column_last_login')}</div>
                <div className="text-sm text-gray-600">{formatDate(user.lastLoginAt)}</div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'primaryRoleName',
      title: t('users.list.column_role'),
      sortable: true,
      render: (_value: string, user: UserSummary) => (
        <Badge variant="secondary" size="sm">
          <Shield className="h-3 w-3 mr-1" />
          {user.primaryRoleName || user.primaryRoleId || '—'}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: t('users.list.column_status'),
      sortable: true,
      render: (_value: string, user: UserSummary) => {
        const status = deriveStatus(user);
        const statusLabel = status.label === 'active' 
          ? t('users.list.status_active')
          : status.label === 'inactive'
          ? t('users.list.status_inactive')
          : t('users.list.status_partial');
        return (
          <Badge variant={status.variant} size="sm">
            {statusLabel}
          </Badge>
        );
      },
    },
    {
      key: 'lastLoginAt',
      title: t('users.list.column_last_login'),
      sortable: true,
      render: (value: string | null | undefined) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          {formatDate(value ?? null)}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      title: t('users.list.column_updated'),
      sortable: true,
      render: (value: string | null | undefined) => (
        <UserInfoWithRole user={undefined} date={value ?? ''} />
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
      key: 'roleId',
      label: t('users.list.filter_role_label'),
      type: 'select' as const,
      options: [
        { value: '', label: t('common.all') || 'Tümü' },
        ...roles.map((role) => ({
          value: role.id,
          label:
            role.name?.trim() ||
            resolveLocalization(role.nameLocalizationId) ||
            role.nameLocalizationId ||
            role.id,
        })),
      ],
    },
    {
      key: 'status',
      label: t('users.list.filter_status_label'),
      type: 'select' as const,
      options: [
        { value: '', label: t('common.all') || 'Tümü' },
        { value: 'active', label: t('users.list.status_active') },
        { value: 'inactive', label: t('users.list.status_inactive') },
        { value: 'partial', label: t('users.list.status_partial') },
      ],
    },
  ], [roles, resolveLocalization, t]);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('users.list.title')}
        subtitle={t('users.list.subtitle')}
      />

      <div className="flex-1 mt-6">
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          mode="server"
          searchPlaceholder={t('users.list.search_placeholder')}
          searchValue={search}
          onSearchChange={handleSearchChange}
          filters={tableFilters}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onRowClick={(user) => navigate(`/users/${user.id}`)}
          totalItems={pagination.totalItems}
          currentPage={page}
          currentPageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyState={{
            icon: <Users className="h-12 w-12" />,
            title: t('users.list.empty_state_title'),
            description: t('users.list.empty_state_description'),
          }}
        />
      </div>
    </div>
  );
};
