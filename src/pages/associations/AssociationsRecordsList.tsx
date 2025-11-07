import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { associationsService } from '../../api/services/associations.service';
import { itemsService } from '../../api/services/items.service';
import type { Association, Item } from '../../types';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

type ItemLookup = {
  id: string;
  code: string;
  name?: string | null;
};

export const AssociationsRecordsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
          t('associations.records.failed_to_load') ??
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
        title: t('associations.records.columns.type') || 'Association Type',
        render: (_: unknown, association: Association) => (
          <Badge variant="primary" size="sm">
            {association.associationTypeId ?? '—'}
          </Badge>
        ),
      },
      {
        key: 'sourceItemId',
        title: t('associations.records.columns.source_item') || 'Source Item',
        render: (_: unknown, association: Association) => (
          <span className="text-sm text-foreground">{resolveItemLabel(association.sourceItemId)}</span>
        ),
      },
      {
        key: 'targetItemId',
        title: t('associations.records.columns.target_item') || 'Target Item',
        render: (_: unknown, association: Association) => (
          <span className="text-sm text-foreground">{resolveItemLabel(association.targetItemId)}</span>
        ),
      },
      {
        key: 'orderIndex',
        title: t('associations.records.columns.order') || 'Order',
        render: (_: unknown, association: Association) => (
          <span className="text-sm text-muted-foreground">
            {association.orderIndex ?? '—'}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        title: t('associations.records.columns.updated_at') || 'Updated',
        render: (_: unknown, association: Association) => (
          <UserInfoWithRole user={association.updatedBy} date={association.updatedAt} />
        ),
      },
    ],
    [resolveItemLabel, t],
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('associations.records.title') || 'Associations'}
        subtitle={
          t('associations.records.subtitle') ||
          'Oluşturulmuş item ilişkilerini ve bağlantıları görüntüleyin.'
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
          searchPlaceholder={t('associations.records.search_placeholder') || 'Search associations...'}
          emptyState={{
            icon: <Zap className="h-12 w-12" />,
            title: t('associations.records.empty_state') || 'Henüz association kaydı yok.',
            description:
              t('associations.records.empty_state_description') ||
              'Item oluştururken ilişkiler otomatik olarak burada listelenir.',
            action: undefined,
          }}
        />
      </div>
    </div>
  );
};

export default AssociationsRecordsList;
