import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
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
  const { language } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canReadRoles = hasPermission(PERMISSIONS.SYSTEM.ROLES.LIST);
  const canCreateRole = hasPermission(PERMISSIONS.SYSTEM.ROLES.CREATE);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(!canReadRoles);

  const loadRoles = useCallback(async () => {
    if (!canReadRoles) {
      setForbidden(true);
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await rolesService.list({ language });
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
    const abortController = new AbortController();
    void loadRoles();
    
    return () => {
      abortController.abort();
    };
  }, [loadRoles]);

  const handleRowClick = canReadRoles ? (role: RoleRecord) => navigate(`/roles/${role.id}`) : undefined;

  const columns = [
    {
      key: 'name',
      title: 'Role Name',
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
                {role.name?.trim() || role.nameLocalizationId}
              </div>
              {role.isSystemRole && (
                <Badge variant="primary" size="sm">System</Badge>
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
                  {role.name?.trim() || role.nameLocalizationId}
                </div>
                {role.isSystemRole && <Badge variant="primary" size="sm">System</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">ID: {role.id}</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">
              {role.description?.trim() || role.descriptionLocalizationId || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (_value: string, role: RoleRecord) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {role.description?.trim() || role.descriptionLocalizationId || '—'}
        </span>
      ),
    },
    {
      key: 'isSystemRole',
      title: 'Type',
      render: (value: boolean) => (
        <Badge variant={value ? 'primary' : 'secondary'} size="sm">
          {value ? 'System Role' : 'Custom Role'}
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

  if (forbidden) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader
          title="Roles"
          subtitle="Manage user roles and their permissions"
        />
        <PermissionDenied />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Roles"
        subtitle="Manage user roles and their permissions"
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={roles}
          columns={columns}
          searchPlaceholder="Search roles..."
          onRowClick={handleRowClick}
          loading={loading}
          emptyState={{
            icon: <Users className="h-12 w-12" />,
            title: 'No roles',
            description: 'Create your first role to assign permissions to users',
            action: canCreateRole
              ? (
                  <Button onClick={() => navigate('/roles/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                )
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
