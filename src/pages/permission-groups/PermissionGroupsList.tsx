import React, { useState, useEffect } from 'react';
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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const loadGroups = async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const result = await permissionGroupsService.list({
        page,
        pageSize,
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
  };

  useEffect(() => {
    const abortController = new AbortController();
    loadGroups(1, pagination.pageSize);
    
    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const columns = [
    {
      key: 'name',
      title: 'Group Name',
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
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</div>
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
      title: 'Description',
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
      title: 'Display Order',
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
      render: (value: string, group: PermissionGroupRecord) => (
        <UserInfo
          name={group.updatedBy?.name || "Unknown User"}
          email={group.updatedBy?.email || "unknown@system.com"}
          avatarUrl={group.updatedBy?.profilePhotoUrl}
          date={value}
        />
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Permission Groups"
        subtitle="Manage permission groups to organize permissions"
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={groups}
          columns={columns}
          searchPlaceholder="Search permission groups..."
          onRowClick={(group) => navigate(`/permission-groups/${group.id}`)}
          loading={loading}
          mode="server"
          totalItems={pagination.totalItems}
          currentPage={pagination.page}
          currentPageSize={pagination.pageSize}
          onPageChange={(page) => loadGroups(page, pagination.pageSize)}
          onPageSizeChange={(size) => loadGroups(1, size)}
          emptyState={{
            icon: <Shield className="h-12 w-12" />,
            title: 'No permission groups',
            description: 'Create your first permission group to organize permissions',
            action: canCreatePermissionGroup
              ? (
                  <Button onClick={() => navigate('/permission-groups/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Permission Group
                  </Button>
                )
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
