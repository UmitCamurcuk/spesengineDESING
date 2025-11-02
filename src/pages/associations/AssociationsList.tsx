import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { associationsService } from '../../api/services/associations.service';
import { itemsService } from '../../api/services/items.service';
import type { Association, Item } from '../../types';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

type ItemLookup = {
  id: string;
  code: string;
  name?: string | null;
};

export const AssociationsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();

  const canCreateAssociation = hasPermission(PERMISSIONS.SYSTEM.ASSOCIATIONS.CREATE);

  const [associations, setAssociations] = useState<Association[]>([]);
  const [itemsLookup, setItemsLookup] = useState<Map<string, ItemLookup>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [associationsResponse, itemsResponse] = await Promise.all([
        associationsService.list(),
        itemsService.list({ limit: 200 }),
      ]);

      setAssociations(associationsResponse.items ?? []);

      const lookup = new Map<string, ItemLookup>();
      (itemsResponse.items ?? []).forEach((item) => {
        lookup.set(item.id, {
          id: item.id,
          code: item.code,
          name: item.name,
        });
      });
      setItemsLookup(lookup);
    } catch (err: any) {
      console.error('Failed to load associations', err);
      setError(
        err?.response?.data?.error?.message ??
          t('associations.failed_to_load') ??
          'Association listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.',
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const resolveItemLabel = useCallback(
    (itemId: string | null | undefined) => {
      if (!itemId) return '—';
      const entry = itemsLookup.get(itemId);
      if (!entry) return itemId;
      return entry.name && entry.name !== entry.code ? `${entry.code} - ${entry.name}` : entry.code;
    },
    [itemsLookup],
  );

  const columns = useMemo(
    () => [
      {
        key: 'associationTypeId',
        title: t('associations.columns.type') || 'Association Type',
        render: (_: unknown, association: Association) => (
          <Badge variant="primary" size="sm">
            {association.associationTypeId ?? '—'}
          </Badge>
        ),
      },
      {
        key: 'sourceItemId',
        title: t('associations.columns.source_item') || 'Source Item',
        render: (_: unknown, association: Association) => (
          <span className="text-sm text-foreground">{resolveItemLabel(association.sourceItemId)}</span>
        ),
      },
      {
        key: 'targetItemId',
        title: t('associations.columns.target_item') || 'Target Item',
        render: (_: unknown, association: Association) => (
          <span className="text-sm text-foreground">{resolveItemLabel(association.targetItemId)}</span>
        ),
      },
      {
        key: 'orderIndex',
        title: t('associations.columns.order') || 'Order',
        render: (_: unknown, association: Association) => (
          <span className="text-sm text-muted-foreground">
            {association.orderIndex ?? '—'}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        title: t('associations.columns.updated_at') || 'Updated',
        render: (_: unknown, association: Association) => (
          <UserInfoWithRole user={association.updatedBy} date={association.updatedAt} />
        ),
      },
    ],
    [resolveItemLabel, t],
  );

  const handleRowClick = useCallback(
    (association: Association) => {
      navigate(`/associations/${association.id}`);
    },
    [navigate],
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('associations.title') || 'Associations'}
        subtitle={t('associations.subtitle') || 'Itemlar arasında ilişkileri yönetin'}
        actions={
          canCreateAssociation ? (
            <Button onClick={() => navigate('/associations/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('associations.create_title') || 'Create Association'}
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
        <DataTable<Association>
          data={associations}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('associations.search_placeholder') || 'Search associations...'}
          onRowClick={handleRowClick}
          emptyState={{
            icon: <Zap className="h-12 w-12" />,
            title: t('associations.empty_state') || 'Henüz association oluşturulmadı.',
            description:
              t('associations.empty_state_description') ||
              'Katalog öğeleri arasında ilişki oluşturmak için yeni association ekleyin.',
            action: canCreateAssociation ? (
              <Button onClick={() => navigate('/associations/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('associations.create_title') || 'Create Association'}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default AssociationsList;
