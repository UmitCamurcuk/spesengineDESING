import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, Database, FileText, Globe, History as HistoryIcon, Tags } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Statistics } from '../../components/common/Statistics';
import { Documentation } from '../../components/common/Documentation';
import { APITester } from '../../components/common/APITester';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { HistoryTable } from '../../components/common/HistoryTable';
import { categoriesService } from '../../api/services/categories.service';
import { familiesService } from '../../api/services/families.service';
import { itemTypesService } from '../../api/services/item-types.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import type { AttributeGroup, Category, Family, ItemType, AttributeGroupBinding } from '../../types';
import type {
  APIEndpoint,
  DocumentationSection,
  Statistics as StatisticsType,
  TabConfig,
} from '../../types/common';
import { PERMISSIONS } from '../../config/permissions';

type AttributeGroupMap = Map<string, AttributeGroup>;
type EntityMap = Map<string, string>;

interface ItemTypeDetailsTabProps {
  itemType: ItemType;
  categoryNames: string[];
  familyNames: string[];
}

interface ItemTypeAttributeGroupsTabProps {
  bindings: AttributeGroupBinding[];
  attributeGroups: AttributeGroupMap;
}

const ItemTypeDetailsTab: React.FC<ItemTypeDetailsTabProps> = ({
  itemType,
  categoryNames,
  familyNames,
}) => {
  const { t } = useLanguage();

  const resolveUserDisplay = (user: ItemType['createdBy']) => {
    if (!user) {
      return t('common.unknown_user') || '—';
    }
    if (typeof user === 'string') {
      return t('common.unknown_user') || '—';
    }
    return user.name ?? user.email ?? (t('common.unknown_user') || '—');
  };

  const lifecycleVariant: 'default' | 'success' | 'warning' | 'secondary' =
    itemType.lifecycleStatus === 'active'
      ? 'success'
      : itemType.lifecycleStatus === 'deprecated'
        ? 'secondary'
        : 'warning';

  const lifecycleLabel =
    t(`item_types.lifecycle.${itemType.lifecycleStatus}`) ??
    itemType.lifecycleStatus.toUpperCase();

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.fields.key') || 'Key'}
            </span>
            <p className="mt-1 font-mono text-sm text-foreground">{itemType.key}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.fields.lifecycle_status') || 'Lifecycle Status'}
            </span>
            <Badge variant={lifecycleVariant}>{lifecycleLabel}</Badge>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.fields.version') || 'Version'}
            </span>
            <p className="mt-1 text-sm text-foreground">{itemType.version}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.fields.system_flag') || 'System Item Type'}
            </span>
            <Badge variant={itemType.isSystemItemType ? 'error' : 'secondary'}>
              {itemType.isSystemItemType
                ? t('item_types.labels.system') || 'System'
                : t('item_types.labels.standard') || 'Standard'}
            </Badge>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.fields.description') || 'Description'}
            </span>
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
              {itemType.description?.trim() || '—'}
            </p>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.fields.categories') || 'Categories'}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryNames.length > 0 ? (
                categoryNames.map((name) => (
                  <Badge key={name} variant="outline">
                    {name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('item_types.empty.categories') || 'No categories linked.'}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.fields.families') || 'Families'}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {familyNames.length > 0 ? (
                familyNames.map((name) => (
                  <Badge key={name} variant="outline">
                    {name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('item_types.empty.families') || 'No families linked.'}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.created_at') || 'Created At'}
            </span>
            <p className="mt-1">{new Date(itemType.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.updated_at') || 'Updated At'}
            </span>
            <p className="mt-1">{new Date(itemType.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.created_by') || 'Created By'}
            </span>
            <p className="mt-1">
              {resolveUserDisplay(itemType.createdBy)}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.updated_by') || 'Updated By'}
            </span>
            <p className="mt-1">
              {resolveUserDisplay(itemType.updatedBy)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ItemTypeAttributeGroupsTab: React.FC<ItemTypeAttributeGroupsTabProps> = ({
  bindings,
  attributeGroups,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!bindings || bindings.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-sm text-muted-foreground">
          {t('item_types.attribute_groups.empty') || 'No attribute groups linked.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bindings.map((binding) => {
        const group = attributeGroups.get(binding.attributeGroupId);
        return (
          <Card
            key={binding.id}
            padding="md"
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Tags className="h-4 w-4 text-primary" />
                {group?.name ?? binding.attributeGroupId}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <code>{binding.attributeGroupId}</code>
              </div>
              {group?.description ? (
                <p className="text-xs text-muted-foreground mt-2">{group.description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {binding.inherited ? (
                <Badge variant="secondary" size="sm">
                  {t('item_types.attribute_groups.inherited') || 'Inherited'}
                </Badge>
              ) : null}
              {binding.required ? (
                <Badge variant="outline" size="sm">
                  {t('item_types.attribute_groups.required') || 'Required'}
                </Badge>
              ) : null}
              <button
                type="button"
                onClick={() => navigate(`/attribute-groups/${binding.attributeGroupId}`)}
                className="text-xs text-primary hover:underline"
              >
                {t('common.view') || 'View'}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const buildItemTypeApiEndpoints = (itemType: ItemType): APIEndpoint[] => [
  {
    id: 'list-item-types',
    method: 'GET',
    path: '/api/item-types',
    description: 'Item type kayıtlarını listeleyin.',
    responseExample: {
      items: [
        {
          id: itemType.id,
          key: itemType.key,
          name: itemType.name,
          lifecycleStatus: itemType.lifecycleStatus,
        },
      ],
      total: 1,
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.ITEM_TYPES.LIST],
  },
  {
    id: 'get-item-type',
    method: 'GET',
    path: `/api/item-types/${itemType.id}`,
    description: 'Belirli item type kaydını getirin.',
    responseExample: {
      id: itemType.id,
      key: itemType.key,
      categoryIds: itemType.categoryIds,
      linkedFamilyIds: itemType.linkedFamilyIds,
      attributeGroupIds: itemType.attributeGroupIds,
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.ITEM_TYPES.VIEW],
  },
  {
    id: 'update-item-type',
    method: 'PUT',
    path: `/api/item-types/${itemType.id}`,
    description: 'Item type kaydını güncelleyin.',
    requestBody: {
      nameLocalizationId: itemType.nameLocalizationId,
      descriptionLocalizationId: itemType.descriptionLocalizationId,
      lifecycleStatus: itemType.lifecycleStatus,
      categoryIds: itemType.categoryIds,
      linkedFamilyIds: itemType.linkedFamilyIds,
      attributeGroupIds: itemType.attributeGroupIds,
      comment: 'Güncelleme notu',
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.ITEM_TYPES.UPDATE],
  },
];

const ItemTypesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canDelete = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.DELETE);
  const canViewStatistics = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.VIEW);
  const canViewDocumentation = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.VIEW);
  const canViewApi = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.VIEW);
  const canViewHistory = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.HISTORY);
  const canViewNotifications = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [itemTypeResponse, categoryResponse, familyResponse, attributeGroupResponse] =
          await Promise.all([
            itemTypesService.getById(id),
            categoriesService.list({ limit: 200 }),
            familiesService.list({ limit: 200 }),
            attributeGroupsService.list(),
          ]);

        if (cancelled) {
          return;
        }

        setItemType(itemTypeResponse);
        setCategories(categoryResponse.items ?? []);
        setFamilies(familyResponse.items ?? []);
        setAttributeGroups(attributeGroupResponse ?? []);
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load item type', err);
        setError(
          err?.response?.data?.error?.message ??
            t('item_types.failed_to_load') ??
            'Item type bilgisi yüklenemedi.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const categoryMap = useMemo<EntityMap>(() => {
    const next = new Map<string, string>();
    categories.forEach((category) =>
      next.set(category.id, category.name?.trim() || category.key || category.id),
    );
    return next;
  }, [categories]);

  const familyMap = useMemo<EntityMap>(() => {
    const next = new Map<string, string>();
    families.forEach((family) =>
      next.set(family.id, family.name?.trim() || family.key || family.id),
    );
    return next;
  }, [families]);

  const attributeGroupMap = useMemo<AttributeGroupMap>(() => {
    const next = new Map<string, AttributeGroup>();
    attributeGroups.forEach((group) => next.set(group.id, group));
    return next;
  }, [attributeGroups]);

  const statisticsData = useMemo<StatisticsType | undefined>(() => {
    if (!itemType) {
      return undefined;
    }
    const bindingCount = itemType.attributeGroupBindings?.length ?? 0;
    return {
      totalCount: bindingCount,
      activeCount: bindingCount,
      inactiveCount: 0,
      createdThisMonth: 0,
      updatedThisMonth: 0,
      usageCount: bindingCount,
      lastUsed: itemType.updatedAt,
      trends: [
        { period: 'Jan', value: bindingCount, change: 0 },
        { period: 'Feb', value: bindingCount, change: 0 },
      ],
      topUsers: itemType.updatedBy
        ? [
            {
              userId:
                typeof itemType.updatedBy === 'string'
                  ? itemType.updatedBy
                  : itemType.updatedBy?.id ?? 'user',
              userName:
                typeof itemType.updatedBy === 'string'
                  ? itemType.updatedBy
                  : itemType.updatedBy?.name ??
                    itemType.updatedBy?.email ??
                    'System',
              count: bindingCount,
            },
          ]
        : [],
    };
  }, [itemType]);

  const documentationSections = useMemo<DocumentationSection[]>(() => {
    if (!itemType) {
      return [];
    }
    const bindings = itemType.attributeGroupBindings ?? [];
    const list =
      bindings.length > 0
        ? bindings
            .map(
              (binding) =>
                `- **${binding.attributeGroupId}** ${binding.required ? '(required)' : ''} ${
                  binding.inherited ? '(inherited)' : ''
                }`,
            )
            .join('\n')
        : t('item_types.attribute_groups.empty_markdown') ||
          'No attribute groups linked.';

    return [
      {
        id: 'overview',
        title: t('item_types.docs.overview') || 'Overview',
        content: `# ${itemType.name}\n\n- **Key:** \`${itemType.key}\`\n- **Lifecycle:** ${itemType.lifecycleStatus}\n- **Attribute Groups:** ${
          bindings.length
        }\n\n## Linked Attribute Groups\n${list}`,
        order: 0,
        type: 'markdown',
        lastUpdated: itemType.updatedAt,
        author:
          typeof itemType.updatedBy === 'string'
            ? itemType.updatedBy
            : itemType.updatedBy?.name ?? itemType.updatedBy?.email ?? 'System',
      },
    ];
  }, [itemType, t]);

  const apiEndpoints = useMemo(() => {
    if (!itemType) {
      return [];
    }
    return buildItemTypeApiEndpoints(itemType);
  }, [itemType]);

  const handleDelete = async () => {
    if (!itemType || deleteLoading) {
      return;
    }
    try {
      setDeleteLoading(true);
      await itemTypesService.delete(itemType.id);
      showToast({
        type: 'success',
        message: t('item_types.delete_success') || 'Item type deleted successfully.',
      });
      navigate('/item-types');
    } catch (err: any) {
      console.error('Failed to delete item type', err);
      const message =
        err?.response?.data?.error?.message ??
        t('item_types.delete_failed') ??
        'Item type silinemedi.';
      showToast({ type: 'error', message });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <div className="px-6 py-12">
        <Card padding="lg">
          <div className="text-sm text-muted-foreground">
            {t('common.loading') || 'Yükleniyor...'}
          </div>
        </Card>
      </div>
    );
  }

  if (error || !itemType) {
    return (
      <div className="px-6 py-12">
        <Card padding="lg">
          <div className="text-sm text-error">
            {error ??
              t('item_types.failed_to_load') ??
              'Item type bilgisi yüklenemedi. Lütfen daha sonra tekrar deneyin.'}
          </div>
        </Card>
      </div>
    );
  }

  const categoryNames = itemType.categoryIds
    .map((categoryId) => categoryMap.get(categoryId) ?? categoryId)
    .filter(Boolean);

  const familyNames = itemType.linkedFamilyIds
    .map((familyId) => familyMap.get(familyId) ?? familyId)
    .filter(Boolean);

  const bindings = itemType.attributeGroupBindings ?? [];

  const tabs: TabConfig[] = [
    {
      id: 'details',
      label: t('item_types.details_tab') || 'Details',
      icon: FileText,
      component: ItemTypeDetailsTab,
      props: {
        itemType,
        categoryNames,
        familyNames,
      },
    },
    {
      id: 'attribute-groups',
      label: t('item_types.attribute_groups_tab') || 'Attribute Groups',
      icon: Tags,
      component: ItemTypeAttributeGroupsTab,
      props: {
        bindings,
        attributeGroups: attributeGroupMap,
      },
    },
    {
      id: 'statistics',
      label: t('item_types.statistics_tab') || 'Statistics',
      icon: BarChart3,
      component: Statistics,
      props: {
        entityType: 'itemType',
        entityId: itemType.id,
        statistics: statisticsData,
      },
      hidden: !canViewStatistics,
    },
    {
      id: 'documentation',
      label: t('item_types.documentation_tab') || 'Documentation',
      icon: BookOpen,
      component: Documentation,
      props: {
        entityType: 'itemType',
        entityId: itemType.id,
        sections: documentationSections,
        editMode: false,
      },
      hidden: !canViewDocumentation,
    },
    {
      id: 'api',
      label: t('item_types.api_tab') || 'API',
      icon: Globe,
      component: APITester,
      props: {
        entityType: 'itemType',
        entityId: itemType.id,
        endpoints: apiEndpoints,
        editMode: false,
      },
      hidden: !canViewApi,
    },
    {
      id: 'history',
      label: t('item_types.history_tab') || 'History',
      icon: HistoryIcon,
      component: HistoryTable,
      props: { entityType: 'ItemType', entityId: itemType.id },
      hidden: !canViewHistory,
    },
    {
      id: 'notifications',
      label: t('item_types.notifications_tab') || 'Notifications',
      icon: Activity,
      component: NotificationSettings,
      props: { entityType: 'itemType', entityId: itemType.id },
      hidden: !canViewNotifications,
    },
  ];

  const headerTitle = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xl font-bold text-foreground">{itemType.name ?? itemType.key}</span>
        <Badge variant="secondary">
          {bindings.length} {t('item_types.attribute_groups_short') || 'groups'}
        </Badge>
      </div>
      {itemType.description ? (
        <p className="text-sm text-muted-foreground">{itemType.description}</p>
      ) : null}
    </div>
  );

  return (
    <DetailsLayout
      title={headerTitle}
      subtitle={undefined}
      icon={<Database className="h-6 w-6 text-white" />}
      tabs={tabs}
      defaultTab="details"
      backUrl="/item-types"
      editMode={false}
      hasChanges={false}
      inlineActions={false}
      onDelete={canDelete ? handleDelete : undefined}
      deleteLoading={deleteLoading}
      deleteButtonLabel={t('item_types.delete_action') || 'Delete Item Type'}
      deleteDialogTitle={
        t('item_types.delete_title', { name: itemType.name ?? itemType.key }) ||
        'Delete this item type?'
      }
      deleteDialogDescription={
        t('item_types.delete_description', { name: itemType.name ?? itemType.key }) ||
        'This item type will be permanently removed. This action cannot be undone.'
      }
    />
  );
};

export { ItemTypesDetails };
export default ItemTypesDetails;
