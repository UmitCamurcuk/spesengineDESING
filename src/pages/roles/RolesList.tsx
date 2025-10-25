import { useState, useEffect } from 'react';
import { rolesService } from '../../api/services/roles.service';
import type { RoleRecord } from '../../api/types/api.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

export function RolesList() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const result = await rolesService.list();
      setRoles(result);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Roller</h1>
      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle>{role.nameLocalizationId}</CardTitle>
              <CardDescription>
                {role.isSystemRole && <span className="text-primary font-semibold">[Sistem Rolü] </span>}
                {role.descriptionLocalizationId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Oluşturulma: {new Date(role.createdAt).toLocaleDateString('tr-TR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
