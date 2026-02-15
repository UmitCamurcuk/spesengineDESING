import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Package, Filter } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { Item, ItemType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { itemsService } from '../../api/services/items.service';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';
import { itemTypesService } from '../../api/services/item-types.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import type { AttributeGroup, ItemTypeColumnConfig, ItemTypeColumnDefinition } from '../../types';

export interface ItemsListProps {
  forcedItemTypeId?: string;
  titleOverride?: string;
  subtitleOverride?: string;
  alwaysShowFilterBadge?: boolean;
}

export const ItemsList: React.FC<ItemsListProps> = ({
  forcedItemTypeId,
  titleOverride,
  subtitleOverride,
  alwaysShowFilterBadge = false,
}) => {
  const navigate = useNavigate();
  const { t, resolveLocalization } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateItem = hasPermission(PERMISSIONS.CATALOG.ITEMS.CREATE);
  const [searchParams] = useSearchParams();
  const filterItemTypeId = forcedItemTypeId ?? searchParams.get('itemTypeId')?.trim() ?? '';

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterItemType, setFilterItemType] = useState<ItemType | null>(null);
  const [columnConfig, setColumnConfig] = useState<ItemTypeColumnConfig | null>(null);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);

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

  const formatAttributeValue = useCallback((value: unknown): string => {
    if (value === undefined || value === null) return '—';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : '—';
    }
    if (typeof value === 'number') return Number.isNaN(value) ? '—' : value.toString();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) {
      if (value.length === 0) return '—';
      const mapped = value.map((entry) => formatAttributeValue(entry)).filter((entry) => entry !== '—');
      return mapped.length ? mapped.join(', ') : '—';
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }, []);

  const formatPhoneValue = useCallback((value: unknown): { display: string; tel?: string } => {
    const fallback = { display: '—', tel: undefined };
    if (!value) return fallback;
    const normalize = (v: any) => {
      const cc = typeof v.countryCode === 'string' ? v.countryCode.trim() : '';
      const num = typeof v.number === 'string' ? v.number.trim() : '';
      return { cc, num };
    };
    let parsed = { cc: '', num: '' };
    if (typeof value === 'string') {
      try {
        parsed = normalize(JSON.parse(value));
      } catch {
        if (value.includes('|')) {
          const [cc, num] = value.split('|');
          parsed = normalize({ countryCode: cc, number: num });
        } else {
          parsed = normalize({ number: value });
        }
      }
    } else if (typeof value === 'object') {
      parsed = normalize(value as Record<string, unknown>);
    }
    const display = `${parsed.cc || ''} ${parsed.num}`.trim() || '—';
    const tel = parsed.num ? `tel:${(parsed.cc || '')}${parsed.num}`.replace(/\s+/g, '') : undefined;
    return { display, tel };
  }, []);


  useEffect(() => {
    let cancelled = false;

    const fetchDependencies = async () => {
      if (!filterItemTypeId) {
        setFilterItemType(null);
        setColumnConfig(null);
        setAttributeGroups([]);
        return;
      }
      try {
        const [itemTypeResp, columnResp, groupResp] = await Promise.all([
          itemTypesService.getById(filterItemTypeId),
          itemTypesService.getColumnConfig(filterItemTypeId, 'list'),
          attributeGroupsService.resolve({ itemTypeId: filterItemTypeId }),
        ]);
        if (cancelled) return;
        setFilterItemType(itemTypeResp);
        setColumnConfig(columnResp);
        setAttributeGroups(groupResp?.attributeGroups ?? groupResp ?? []);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load item type filter data', err);
        setFilterItemType(null);
        setColumnConfig(null);
        setAttributeGroups([]);
      }
    };

    void fetchDependencies();

    return () => {
      cancelled = true;
    };
  }, [filterItemTypeId]);

  useEffect(() => {
    let cancelled = false;

    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const itemsResponse = await itemsService.list({
          limit: 200,
          itemTypeId: filterItemTypeId || undefined,
          includeAttributes: Boolean(filterItemTypeId),
        });
        if (cancelled) {
          return;
        }
        setItems(itemsResponse.items ?? []);
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
  }, [filterItemTypeId, t]);

  const handleRowClick = useCallback(
    (item: Item) => {
      navigate(`/items/${item.id}`);
    },
    [navigate],
  );

  const attrMap = useMemo(() => {
    const map = new Map<string, { name: string; type?: string }>();
    attributeGroups.forEach((group) =>
      (group.attributes ?? []).forEach((attr) => {
        map.set(attr.id, { name: attr.name || attr.key || attr.id, type: attr.type });
      }),
    );
    return map;
  }, [attributeGroups]);

  const resolveColumnLabel = useCallback(
    (column: ItemTypeColumnDefinition): string => {
      if (column.labelLocalizationId) {
        const localized = resolveLocalization(column.labelLocalizationId);
        if (localized) return localized;
      }
      if (column.source === 'attribute') {
        const attributeId =
          (column.options?.attributeId as string | undefined) ||
          (column.key.startsWith('attribute.') ? column.key.split('.')[1] : undefined);
        const attr = attributeId ? attrMap.get(attributeId) : undefined;
        if (attr?.name) return attr.name;
      }
      if (column.key === 'meta.name') return t('item_types.column_labels.name') || 'Name';
      if (column.key === 'meta.code') return t('item_types.column_labels.code') || 'Code';
      if (column.key === 'meta.status') return t('item_types.column_labels.status') || 'Status';
      if (column.key === 'meta.createdAt') return t('item_types.column_labels.created_at') || 'Created At';
      if (column.key === 'meta.updatedAt') return t('item_types.column_labels.updated_at') || 'Updated At';
      if (column.key === 'meta.category') return t('item_types.column_labels.category') || 'Category';
      if (column.key === 'meta.family') return t('item_types.column_labels.family') || 'Family';
      return column.key;
    },
    [attrMap, resolveLocalization, t],
  );

  const dynamicColumns = useMemo(() => {
    if (!columnConfig || !columnConfig.columns?.length) {
      return null;
    }

    const attrMap = new Map<string, { name: string; type?: string }>();
    attributeGroups.forEach((group) =>
      (group.attributes ?? []).forEach((attr) => {
        attrMap.set(attr.id, { name: attr.name || attr.key || attr.id, type: attr.type });
      }),
    );

    return columnConfig.columns
      .filter((column) => column.visible !== false)
      .map((column) => ({
        key: column.key,
        title: resolveColumnLabel(column),
        render: (_: unknown, item: Item) => {
          if (column.source === 'meta') {
            switch (column.key) {
              case 'meta.name': {
                const localizedName =
                  (item.nameLocalizationId ? resolveLocalization(item.nameLocalizationId) : null) ||
                  (typeof item.name === 'string' && item.name.trim().length > 0
                    ? item.name.trim()
                    : item.id);
                return localizedName;
              }
              case 'meta.code':
                return item.id;
              case 'meta.status':
                return (item as any).status ?? '—';
              case 'meta.createdAt':
                return item.createdAt ? new Date(item.createdAt).toLocaleString() : '—';
              case 'meta.updatedAt':
                return item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—';
              case 'meta.category':
                return item.categorySummary?.name ?? '—';
              case 'meta.family':
                return item.familySummary?.name ?? '—';
              default:
                return '—';
            }
          }

          if (column.source === 'attribute') {
            const attributeId =
              (column.options?.attributeId as string | undefined) ??
              (column.key.startsWith('attribute.') ? column.key.split('.')[1] : undefined);
            if (!attributeId) return '—';
            const value =
              (item.attributeValueMap && item.attributeValueMap[attributeId]) ??
              item.attributeValues?.find((val) => val.attributeId === attributeId)?.value;
            const attrMeta = attrMap.get(attributeId);
            const type = attrMeta?.type?.toLowerCase?.() ?? '';

            // If value looks like a raw ObjectId but attribute is not reference, hide it as missing.
            const looksLikeObjectId =
              typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value.trim());
            let content: React.ReactNode =
              looksLikeObjectId && type !== 'reference' ? '—' : formatAttributeValue(value);
            if (type === 'phone') {
              const { display, tel } = formatPhoneValue(value);
              content = tel ? (
                <a href={tel} className="text-primary hover:underline">
                  {display}
                </a>
              ) : (
                display
              );
            }
            return (
              <div className="space-y-0.5">
                <div className="text-sm text-foreground">{content}</div>
                {attrMeta?.name ? (
                  <div className="text-[11px] text-muted-foreground">{attrMeta.name}</div>
                ) : null}
              </div>
            );
          }

          return '—';
        },
      }));
  }, [attributeGroups, columnConfig, formatAttributeValue, resolveColumnLabel, resolveLocalization]);

  const defaultColumns = useMemo(
    () => [
      {
        key: 'name',
        title: t('items.name'),
        sortable: true,
        render: (_: string, item: Item) => {
          const localizedName =
            (item.nameLocalizationId ? resolveLocalization(item.nameLocalizationId) : null) ||
            (typeof item.name === 'string' && item.name.trim().length > 0 ? item.name.trim() : item.id);
          return (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{localizedName}</div>
                <div className="text-xs text-muted-foreground">ID: {item.id}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'itemTypeId',
        title: t('items.type'),
        render: (_: string | null, item: Item) => {
          const label =
            item.itemTypeSummary?.name ??
            item.itemTypeSummary?.key ??
            item.itemTypeId ??
            t('common.not_available') ??
            '—';
          return (
            <Badge variant="primary" size="sm">
              {label}
            </Badge>
          );
        },
      },
      {
        key: 'categoryId',
        title: t('items.category') || 'Category',
        render: (_: string | null, item: Item) => {
          const label =
            (item.categorySummary?.nameLocalizationId
              ? resolveLocalization(item.categorySummary.nameLocalizationId)
              : null) ??
            item.categorySummary?.fullPath ??
            item.categorySummary?.name ??
            item.categorySummary?.key ??
            item.categoryId ??
            t('common.not_available') ??
            '—';
          return (
            <Badge variant="outline" size="sm">
              {label}
            </Badge>
          );
        },
      },
      {
        key: 'familyId',
        title: t('items.family') || 'Family',
        render: (_: string | null, item: Item) => {
          const label =
            (item.familySummary?.nameLocalizationId
              ? resolveLocalization(item.familySummary.nameLocalizationId)
              : null) ??
            item.familySummary?.fullPath ??
            item.familySummary?.name ??
            item.familySummary?.key ??
            item.familyId ??
            t('common.not_available') ??
            '—';
          return (
            <Badge variant="outline" size="sm">
              {label}
            </Badge>
          );
        },
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
    [resolveLocalization, t, toUserInfo],
  );

  const columns = useMemo(() => dynamicColumns ?? defaultColumns, [defaultColumns, dynamicColumns]);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('items.title')}
        subtitle={
          filterItemType
            ? `${t('items.subtitle') || 'Item listesi'} • ${filterItemType.name || filterItemType.key}`
            : t('items.subtitle')
        }
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
        {filterItemType ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>{t('items.filter_by_type') || 'Item type filter'}:</span>
            <Badge variant="secondary" size="sm">
              {filterItemType.name || filterItemType.key}
            </Badge>
          </div>
        ) : null}
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
