import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { Item } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { itemsService } from '../../api/services/items.service';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

export const ItemsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateItem = hasPermission(PERMISSIONS.CATALOG.ITEMS.CREATE);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toUserInfo = useCallback((user: Item['updatedBy'] | Item['createdBy']) => {
    if (!user) {
      return undefined;
    }
    if (typeof user === 'string') {
      return {
        id: user,
        email: user,
        name: user,
      };
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePhotoUrl: user.profilePhotoUrl,
      role: user.role,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items: fetched } = await itemsService.list({ limit: 200 });
        if (!cancelled) {
          setItems(fetched);
        }
      } catch (err) {
        console.error('Failed to load items', err);
        if (!cancelled) {
          setError(
            t('items.failed_to_load') ||
              'Item listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchItems();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleRowClick = useCallback(
    (item: Item) => {
      navigate(`/items/${item.id}`);
    },
    [navigate],
  );

  const statusVariant = useCallback((status: Item['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'inactive':
      case 'archived':
      default:
        return 'default';
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: t('items.name'),
        sortable: true,
        render: (_: string, item: Item) => (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{item.name}</div>
              <div className="text-xs text-muted-foreground">ID: {item.id}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'code',
        title: t('items.code') || 'Code',
        render: (_: string, item: Item) => (
          <code className="text-xs bg-muted px-2 py-1 rounded">{item.code}</code>
        ),
      },
      {
        key: 'itemTypeId',
        title: t('items.type'),
        render: (_: string | null, item: Item) =>
          item.itemTypeId ? (
            <Badge variant="primary" size="sm">
              {item.itemTypeId}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: 'status',
        title: t('items.status'),
        sortable: true,
        render: (_: string, item: Item) => (
          <Badge variant={statusVariant(item.status)} size="sm">
            {t(`items.status_${item.status}`) || item.status}
          </Badge>
        ),
      },
      {
        key: 'updatedAt',
        title: t('items.updated_at') || 'Updated',
        sortable: true,
        render: (_: string, item: Item) => (
          <UserInfoWithRole user={toUserInfo(item.updatedBy)} date={item.updatedAt} />
        ),
      },
    ],
    [statusVariant, t, toUserInfo],
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('items.title')}
        subtitle={t('items.subtitle')}
        actions={
          canCreateItem ? (
            <Button onClick={() => navigate('/items/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('items.create_title')}
            </Button>
          ) : null
        }
      />

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 mt-6">
        <DataTable<Item>
          data={items}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('items.search_placeholder') || 'Search items...'}
          onRowClick={handleRowClick}
          emptyState={{
            icon: <Package className="h-12 w-12" />,
            title: t('items.empty_state_title'),
            description: t('items.empty_state_description'),
            action: canCreateItem ? (
              <Button onClick={() => navigate('/items/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('items.create_title')}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default ItemsList;
