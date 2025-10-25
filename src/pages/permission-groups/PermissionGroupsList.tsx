import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import type { PermissionGroupRecord } from '../../api/types/api.types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

export function PermissionGroupsList() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<PermissionGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await permissionGroupsService.list();
      setGroups(result.items);
    } catch (error) {
      console.error('Failed to load permission groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">İzin Grupları</h1>
          <p className="text-muted-foreground">İzin gruplarını yönetin</p>
        </div>
        <Button onClick={() => navigate('/permission-groups/create')}>
          Yeni İzin Grubu
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/permission-groups/${group.id}`)}
          >
            <CardHeader>
              <CardTitle>{group.nameLocalizationId}</CardTitle>
              <CardDescription>{group.descriptionLocalizationId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Sıralama: {group.displayOrder}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
