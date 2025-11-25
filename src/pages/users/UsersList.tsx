import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Mail, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';
import { RelativeTime } from '../../components/common/RelativeTime';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersService } from '../../api/services/users.service';
import type { UserSummary, UserListResponse } from '../../api/types/api.types';

const formatFullName = (user: UserSummary): string => {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const deriveStatus = useCallback(
    (user: UserSummary): { label: string; variant: 'success' | 'warning' | 'default' } => {
      if (user.isOnline) {
        return { label: t('common.online') || 'Online', variant: 'success' };
      }
      if (user.notificationsEnabled && user.emailNotificationsEnabled) {
        return { label: t('users.status.active') || 'active', variant: 'success' };
      }
      if (!user.notificationsEnabled && !user.emailNotificationsEnabled) {
        return { label: t('users.status.inactive') || 'inactive', variant: 'default' };
      }
      return { label: t('users.status.partial') || 'partial', variant: 'warning' };
    },
    [t],
  );

  const loadUsers = async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const response: UserListResponse = await usersService.list({
        page,
        pageSize,
        language,
      });
      setUsers(response.items);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    loadUsers(1, pagination.pageSize);
    
    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const columns = [
    {
      key: 'name',
      title: 'User',
      sortable: true,
      render: (_value: string, user: UserSummary) => {
        const avatarUrl = user.profilePhotoUrl 
          ? user.profilePhotoUrl.startsWith('/uploads') 
            ? user.profilePhotoUrl 
            : `/uploads${user.profilePhotoUrl}`
          : null;
        const initials = getInitials(formatFullName(user));
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={formatFullName(user)}
                  className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-gray-200 dark:ring-gray-700"
                  data-avatar="true"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : (
                <span data-avatar="true" className="hidden" />
              )}
              <div
                data-avatar-placeholder="true"
                className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm absolute inset-0 ${avatarUrl ? 'hidden' : 'flex'}`}
              >
                <span className="text-sm font-semibold text-white">{initials}</span>
              </div>
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
        const avatarUrl = user.profilePhotoUrl 
          ? user.profilePhotoUrl.startsWith('/uploads') 
            ? user.profilePhotoUrl 
            : `/uploads${user.profilePhotoUrl}`
          : null;
        const initials = getInitials(formatFullName(user));
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={formatFullName(user)}
                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                    data-avatar="true"
                  />
                ) : (
                  <span data-avatar="true" className="hidden" />
                )}
                <div
                  data-avatar-placeholder="true"
                  className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm absolute inset-0 ${avatarUrl ? 'hidden' : 'flex'}`}
                >
                  <span className="text-sm font-semibold text-white">{initials}</span>
                </div>
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
                {status.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Role</div>
                <Badge variant="secondary" size="sm">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.primaryRoleName || user.primaryRoleId || '—'}
                </Badge>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Last Login</div>
                <div className="text-sm text-gray-600">
                  {user.isOnline ? (
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                      {t('common.online') || 'Online'}
                    </span>
                  ) : (
                    <RelativeTime date={user.lastLoginAt} includeTime={true} />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'primaryRoleName',
      title: 'Role',
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
      title: 'Status',
      sortable: true,
      render: (_value: string, user: UserSummary) => {
        const status = deriveStatus(user);
        return (
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: 'lastLoginAt',
      title: 'Last Login',
      sortable: true,
        render: (_value: string | null | undefined, user: UserSummary) => (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {user.isOnline ? (
              <span className="inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                {t('common.online') || 'Online'}
              </span>
            ) : (
              <RelativeTime date={user.lastLoginAt} includeTime={true} />
            )}
          </div>
        ),
    },
    {
      key: 'updatedAt',
      title: 'Updated',
      sortable: true,
      render: (_value: string | null | undefined, user: UserSummary) => {
        if (!user.updatedAt) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <UserInfoWithRole
            user={user.updatedBy ? {
              id: user.updatedBy.id,
              email: user.updatedBy.email,
              name: user.updatedBy.name,
              profilePhotoUrl: user.updatedBy.profilePhotoUrl,
              role: user.updatedBy.role,
            } : undefined}
            date={user.updatedAt}
          />
        );
      },
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Users"
        subtitle="Manage platform users"
      />

      <div className="flex-1 mt-6">
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          mode="server"
          onRowClick={(user) => navigate(`/users/${user.id}`)}
          totalItems={pagination.totalItems}
          currentPage={pagination.page}
          currentPageSize={pagination.pageSize}
          onPageChange={(page) => loadUsers(page, pagination.pageSize)}
          onPageSizeChange={(size) => loadUsers(1, size)}
          emptyState={{
            icon: <Users className="h-12 w-12" />,
            title: 'No users',
            description: 'Users will appear here once created',
          }}
        />
      </div>
    </div>
  );
};
