import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Database } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { ItemType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { itemTypesService } from '../../api/services/item-types.service';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

export const ItemTypesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateItemType = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.CREATE);

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toUserInfo = useCallback((user: ItemType['updatedBy'] | ItemType['createdBy']) => {
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

    const fetchItemTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items } = await itemTypesService.list({ limit: 200 });
        if (!cancelled) {
          setItemTypes(items);
        }
      } catch (err) {
        console.error('Failed to load item types', err);
        if (!cancelled) {
          setError(
            t('item_types.failed_to_load') ||
              'Item type listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchItemTypes();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleRowClick = useCallback(
    (itemType: ItemType) => {
      navigate(`/item-types/${itemType.id}`);
    },
    [navigate],
  );

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: t('item_types.columns.name') || 'Name',
        sortable: true,
        render: (_: string, itemType: ItemType) => (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{itemType.name}</div>
              <div className="text-xs text-muted-foreground">ID: {itemType.id}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'key',
        title: t('item_types.columns.key') || 'Key',
        render: (_: string, itemType: ItemType) => (
          <code className="text-xs bg-muted px-2 py-1 rounded">{itemType.key}</code>
        ),
      },
      {
        key: 'lifecycleStatus',
        title: t('item_types.columns.lifecycle_status') || 'Lifecycle',
        render: (_: string, itemType: ItemType) => {
          const status = itemType.lifecycleStatus;
          const variant =
            status === 'active' ? 'success' : status === 'deprecated' ? 'error' : 'warning';
          return (
            <Badge variant={variant} size="sm">
              {t(`item_types.lifecycle.${status}`) || status}
            </Badge>
          );
        },
      },
      {
        key: 'categoryIds',
        title: t('item_types.columns.categories') || 'Categories',
        render: (_: string[], itemType: ItemType) => (
          <Badge variant="secondary" size="sm">
            {itemType.categoryIds.length}
          </Badge>
        ),
      },
      {
        key: 'attributeGroupCount',
        title: t('item_types.columns.attribute_groups') || 'Attribute Groups',
        render: (_: number | undefined, itemType: ItemType) => (
          <Badge variant="outline" size="sm">
            {itemType.attributeGroupCount ?? itemType.attributeGroupIds?.length ?? 0}
          </Badge>
        ),
      },
      {
        key: 'updatedAt',
        title: t('item_types.columns.updated_at') || 'Updated',
        sortable: true,
        render: (_: string, itemType: ItemType) => (
          <UserInfoWithRole user={toUserInfo(itemType.updatedBy)} date={itemType.updatedAt} />
        ),
      },
    ],
    [t, toUserInfo],
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('item_types.title')}
        subtitle={t('item_types.subtitle')}
        actions={
          canCreateItemType ? (
            <Button onClick={() => navigate('/item-types/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('item_types.create_title')}
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
        <DataTable
          data={itemTypes}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('item_types.search_placeholder') || 'Search item types...'}
          onRowClick={handleRowClick}
          emptyState={{
            icon: <Database className="h-12 w-12" />,
            title: t('item_types.empty_state') || 'Item type bulunamadı.',
            description:
              t('item_types.create_new') ||
              'Yeni bir item type oluşturarak katalog yapılandırmasına başlayın.',
            action: canCreateItemType
              ? (
                  <Button onClick={() => navigate('/item-types/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('item_types.create_title') || 'Create Item Type'}
                  </Button>
                )
              : undefined,
          }}
        />
      </div>
    </div>
  );
};
