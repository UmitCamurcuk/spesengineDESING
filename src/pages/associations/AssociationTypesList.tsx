import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { associationTypesService } from '../../api/services/association-types.service';
import type { AssociationType } from '../../types';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

export const AssociationTypesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();

  const canCreateAssociationType = hasPermission(PERMISSIONS.SYSTEM.ASSOCIATIONS.CREATE);

  const [types, setTypes] = useState<AssociationType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const typesResponse = await associationTypesService.list();
      setTypes(typesResponse.items ?? []);
    } catch (err: any) {
      console.error('Failed to load association types', err);
      setError(
        err?.response?.data?.error?.message ??
          t('association_types.failed_to_load') ??
          'Association type listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.',
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const columns = useMemo(
    () => [
      {
        key: 'key',
        title: t('association_types.columns.key') || 'Key',
        render: (_: unknown, type: AssociationType) => (
          <span className="text-sm font-medium text-foreground">{type.key}</span>
        ),
      },
      {
        key: 'name',
        title: t('association_types.columns.name') || 'Name',
        render: (_: unknown, type: AssociationType) => (
          <span className="text-sm text-muted-foreground">{type.name}</span>
        ),
      },
      {
        key: 'itemTypes',
        title: t('association_types.columns.item_types') || 'Item Types',
        render: (_: unknown, type: AssociationType) => (
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">
              {type.sourceItemType?.name || type.sourceItemType?.key || type.sourceItemTypeId || '—'}
            </Badge>
            <span className="text-xs text-muted-foreground">→</span>
            <Badge variant="outline" size="sm">
              {type.targetItemType?.name || type.targetItemType?.key || type.targetItemTypeId || '—'}
            </Badge>
          </div>
        ),
      },
      {
        key: 'cardinality',
        title: t('association_types.columns.cardinality') || 'Cardinality',
        render: (_: unknown, type: AssociationType) => (
          <Badge variant="secondary" size="sm">
            {type.cardinality}
          </Badge>
        ),
      },
      {
        key: 'isRequired',
        title: t('association_types.columns.required') || 'Required',
        render: (_: unknown, type: AssociationType) => (
          <Badge variant={type.isRequired ? 'destructive' : 'outline'} size="sm">
            {type.isRequired ? t('common.yes') || 'Yes' : t('common.no') || 'No'}
          </Badge>
        ),
      },
      {
        key: 'updatedAt',
        title: t('association_types.columns.updated_at') || 'Updated',
        render: (_: unknown, type: AssociationType) => (
          <UserInfoWithRole user={type.updatedBy} date={type.updatedAt} />
        ),
      },
    ],
    [t],
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('association_types.title') || 'Association Types'}
        subtitle={
          t('association_types.subtitle') ||
          'Item türleri arasında kullanılacak ilişki şablonlarını yönetin.'
        }
        actions={
          canCreateAssociationType ? (
            <Button onClick={() => navigate('/association-types/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('association_types.create_title') || 'Create Association Type'}
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex-1 mt-6">
        <DataTable<AssociationType>
          data={types}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('association_types.search_placeholder') || 'Search association types...'}
          onRowClick={(type) => navigate(`/association-types/${type.id}`)}
          emptyState={{
            icon: <Layers className="h-12 w-12" />,
            title: t('association_types.empty_state') || 'Henüz association type oluşturulmadı.',
            description:
              t('association_types.empty_state_description') ||
              'Yeni ilişki şablonu oluşturarak itemler arasındaki bağları yapılandırabilirsiniz.',
            action: canCreateAssociationType ? (
              <Button onClick={() => navigate('/association-types/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('association_types.create_title') || 'Create Association Type'}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default AssociationTypesList;
