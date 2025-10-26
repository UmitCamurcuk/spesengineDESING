import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { permissionsService } from '../../api/services/permissions.service';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import type { PermissionRecord, PermissionGroupRecord } from '../../api/types/api.types';
import { useLanguage } from '../../contexts/LanguageContext';

export function PermissionsDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language } = useLanguage();
  
  const [permission, setPermission] = useState<PermissionRecord | null>(null);
  const [group, setGroup] = useState<PermissionGroupRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) loadPermission();
  }, [id, language]);

  const loadPermission = async () => {
    try {
      setLoading(true);
      const result = await permissionsService.getById(id!, { language });
      setPermission(result);
      
      // Load group
      const groupResult = await permissionGroupsService.getById(result.permissionGroupId, { language });
      setGroup(groupResult);
    } catch (error: any) {
      console.error('Failed to load permission:', error);
      showToast({ type: 'error', message: 'Failed to load permission' });
      navigate('/permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    try {
      setDeleting(true);
      await permissionsService.delete(id!);
      showToast({ type: 'success', message: 'Permission deleted successfully' });
      navigate('/permissions');
    } catch (error: any) {
      console.error('Failed to delete permission:', error);
      showToast({ type: 'error', message: error?.message || 'Failed to delete permission' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!permission) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/permissions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Permission Details</h1>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/permissions/edit/${id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </CardHeader>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Permission Code</label>
              <code className="text-sm text-foreground font-mono bg-muted px-2 py-1 rounded">{permission.code}</code>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm text-foreground">
                {permission.name?.trim() || permission.nameLocalizationId || '—'}
              </p>
              {permission.nameLocalizationId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Localization ID: {permission.nameLocalizationId}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm text-foreground">
                {permission.description?.trim() || permission.descriptionLocalizationId || '—'}
              </p>
              {permission.descriptionLocalizationId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Localization ID: {permission.descriptionLocalizationId}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Permission Group</label>
              <Badge variant="secondary">
                {group?.name?.trim() || group?.nameLocalizationId || 'Unknown'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Display Order</label>
              <Badge variant="secondary">{permission.displayOrder}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm text-foreground">{new Date(permission.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Updated</label>
                <p className="text-sm text-foreground">{new Date(permission.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
