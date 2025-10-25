import { useState, useEffect } from 'react';
import { permissionsService } from '../../api/services/permissions.service';
import type { PermissionRecord } from '../../api/types/api.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

export function PermissionsList() {
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const result = await permissionsService.list();
      setPermissions(result.items);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">İzinler</h1>
      <div className="grid gap-4">
        {permissions.map((perm) => (
          <Card key={perm.id}>
            <CardHeader>
              <CardTitle>{perm.code}</CardTitle>
              <CardDescription>{perm.nameLocalizationId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{perm.descriptionLocalizationId}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
