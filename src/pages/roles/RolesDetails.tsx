import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Loader2, Shield } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { rolesService } from '../../api/services/roles.service';
import { permissionsService } from '../../api/services/permissions.service';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import type { 
  RoleWithPermissions, 
  PermissionRecord, 
  PermissionGroupRecord 
} from '../../api/types/api.types';

export function RolesDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [role, setRole] = useState<RoleWithPermissions | null>(null);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [groups, setGroups] = useState<PermissionGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roleResult, permResult, groupsResult] = await Promise.all([
        rolesService.getById(id!),
        permissionsService.list({ pageSize: 1000 }),
        permissionGroupsService.list({ pageSize: 1000 }),
      ]);
      setRole(roleResult);
      setPermissions(permResult.items);
      setGroups(groupsResult.items);
    } catch (error: any) {
      console.error('Failed to load role:', error);
      showToast({ type: 'error', message: 'Failed to load role' });
      navigate('/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      setDeleting(true);
      await rolesService.delete(id!);
      showToast({ type: 'success', message: 'Role deleted successfully' });
      navigate('/roles');
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      showToast({ type: 'error', message: error?.message || 'Failed to delete role' });
    } finally {
      setDeleting(false);
    }
  };

  const getGroupPermissions = (groupId: string) => {
    return permissions.filter(p => p.permissionGroupId === groupId);
  };

  const getEnabledPermissions = (groupId: string) => {
    const groupPerms = getGroupPermissions(groupId);
    return groupPerms.filter(p => role?.permissions.includes(p.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) return null;

  const totalEnabled = role.permissions.length;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/roles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Role Details</h1>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/roles/edit/${id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {!role.isSystemRole && (
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </CardHeader>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID</label>
              <p className="text-sm text-foreground font-mono">{role.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name Localization ID</label>
              <p className="text-sm text-foreground">{role.nameLocalizationId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description Localization ID</label>
              <p className="text-sm text-foreground">{role.descriptionLocalizationId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <Badge variant={role.isSystemRole ? 'primary' : 'secondary'}>
                {role.isSystemRole ? 'System Role' : 'Custom Role'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm text-foreground">{new Date(role.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Updated</label>
                <p className="text-sm text-foreground">{new Date(role.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Permissions</h2>
              <Badge variant="primary">
                {totalEnabled} / {permissions.length} Enabled
              </Badge>
            </div>
          </CardHeader>
          <div className="p-6 space-y-4">
            {groups.map((group) => {
              const groupPerms = getGroupPermissions(group.id);
              const enabledPerms = getEnabledPermissions(group.id);
              
              if (groupPerms.length === 0) return null;

              return (
                <div key={group.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold text-foreground">{group.nameLocalizationId}</div>
                        <div className="text-xs text-muted-foreground">{group.descriptionLocalizationId}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {enabledPerms.length} / {groupPerms.length}
                    </Badge>
                  </div>
                  
                  <div className="p-4 space-y-2 bg-background">
                    {groupPerms.map((permission) => {
                      const isEnabled = role.permissions.includes(permission.id);

                      return (
                        <div
                          key={permission.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isEnabled ? 'bg-green-50 dark:bg-green-900/10' : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div>
                              <code className="text-sm font-mono text-foreground">{permission.code}</code>
                              <div className="text-xs text-muted-foreground">{permission.nameLocalizationId}</div>
                            </div>
                          </div>
                          <Badge variant={isEnabled ? 'success' : 'secondary'} size="sm">
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
