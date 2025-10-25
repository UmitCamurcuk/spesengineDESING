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

export function PermissionGroupsList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
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
    loadGroups();
  }, [pagination.page, pagination.pageSize]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await permissionGroupsService.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
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

  const columns = [
    {
      key: 'nameLocalizationId',
      title: 'Group Name',
      sortable: true,
      render: (value: string, group: PermissionGroupRecord) => (
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
              <Folder className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-semibold text-foreground">{value}</div>
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
              <div className="text-sm font-semibold text-foreground">{group.nameLocalizationId}</div>
              <div className="text-xs text-muted-foreground">ID: {group.id}</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{group.descriptionLocalizationId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'descriptionLocalizationId',
      title: 'Description',
      render: (value: string) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
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
      render: (value: string) => (
        <UserInfo
          name="System"
          email="system@app.com"
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
          emptyState={{
            icon: <Shield className="h-12 w-12" />,
            title: 'No permission groups',
            description: 'Create your first permission group to organize permissions',
            action: (
              <Button onClick={() => navigate('/permission-groups/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Permission Group
              </Button>
            )
          }}
        />
      </div>
    </div>
  );
}
