import React, { useState, useEffect } from 'react';
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
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [groups, setGroups] = useState<PermissionGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    const abortController = new AbortController();
    loadData(1, pagination.pageSize);
    
    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const loadData = async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const [permResult, groupsResult] = await Promise.all([
        permissionsService.list({
          page,
          pageSize,
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
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group?.name?.trim() || group?.nameLocalizationId || 'Unknown Group';
  };

  const columns = [
    {
      key: 'code',
      title: 'Permission Code',
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
            <div className="text-xs text-muted-foreground mt-1">{permission.name || permission.nameLocalizationId}</div>
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
              <div className="text-xs text-muted-foreground">{permission.name || permission.nameLocalizationId}</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{permission.description || permission.descriptionLocalizationId}</div>
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
      title: 'Group',
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {getGroupName(value)}
        </Badge>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (_value: string, permission: PermissionRecord) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {permission.description || permission.descriptionLocalizationId || '—'}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      title: 'Order',
      sortable: true,
      render: (value: number) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <UserInfo
          name="Unknown User"
          email="unknown@system.com"
          date={value}
        />
      ),
    },
  ];

  const filters = [
    {
      key: 'permissionGroupId',
      label: 'Group',
      type: 'select' as const,
      options: groups.map(group => ({
        value: group.id,
        label: group.name?.trim() || group.nameLocalizationId
      }))
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Permissions"
        subtitle="Manage individual permissions across the system"
      />

      <div className="flex-1 mt-6">
        <DataTable
          data={permissions}
          columns={columns}
          loading={loading}
          mode="server"
          searchPlaceholder="Search permissions..."
          filters={filters}
          onRowClick={(permission) => navigate(`/permissions/${permission.id}`)}
          totalItems={pagination.totalItems}
          currentPage={pagination.page}
          currentPageSize={pagination.pageSize}
          onPageChange={(page) => loadData(page, pagination.pageSize)}
          onPageSizeChange={(size) => loadData(1, size)}
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
