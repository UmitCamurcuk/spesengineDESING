import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Database,
  Edit,
  FolderTree,
  Globe,
  History as HistoryIcon,
  Layers,
  Loader2,
  Package,
  Trash2,
  Zap,
} from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { HistoryTable } from '../../components/common/HistoryTable';
import { itemsService } from '../../api/services/items.service';
import { associationColumnConfigService } from '../../api/services/association-column-config.service';
import { attributesService } from '../../api/services/attributes.service';
import type {
  AssociationColumnConfig,
  Item,
  ItemAttributeGroupSummary,
  ItemAssociationSummary,
  ItemDetails,
  ItemHierarchyNode,
  ItemType,
  ItemTypeSummaryRef,
} from '../../types';
import type { TabConfig } from '../../types/common';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';

const getPathLabel = (path: ItemHierarchyNode[]): string =>
  path.length ? path.map((node) => node.name ?? node.key ?? node.id).join(' / ') : '—';

const getLeafName = (path: ItemHierarchyNode[], fallback?: string | null): string =>
  path.length
    ? path[path.length - 1].name ?? path[path.length - 1].key ?? path[path.length - 1].id
    : fallback ?? '—';

const resolveItemTypeName = (
  itemType?: ItemType | null,
  summary?: ItemTypeSummaryRef | null,
  fallbackId?: string | null,
): string =>
  itemType?.name ??
  summary?.name ??
  itemType?.key ??
  summary?.key ??
  fallbackId ??
  '—';

interface ItemDetailsTabProps {
  details: ItemDetails;
  editMode?: boolean;
  attributeDrafts?: Record<string, unknown>;
  onAttributeChange?: (attributeId: string, value: unknown) => void;
}

const ItemDetailsTab: React.FC<ItemDetailsTabProps> = ({
  details,
  editMode = false,
  attributeDrafts,
  onAttributeChange,
}) => {
  const { formatDateTime } = useDateFormatter();
  const categoryName = useMemo(
    () =>
      getLeafName(
        details.hierarchy.categoryPath,
        details.category?.name ?? details.item.categoryId ?? null,
      ),
    [details.hierarchy.categoryPath, details.category?.name, details.item.categoryId],
  );
  const familyName = useMemo(
    () =>
      getLeafName(details.hierarchy.familyPath, details.family?.name ?? details.item.familyId ?? null),
    [details.hierarchy.familyPath, details.family?.name, details.item.familyId],
  );
  const attributeValues = details.attributeValues ?? {};
  const itemTypeName = useMemo(
    () =>
      resolveItemTypeName(details.itemType, details.item.itemTypeSummary, details.item.itemTypeId),
    [details.item.itemTypeSummary, details.item.itemTypeId, details.itemType],
  );

  const metadataRows = [
    { label: 'Item ID', value: details.item.id },
    { label: 'Version', value: details.item.version },
    { label: 'Created', value: formatDateTime(details.item.createdAt) },
    { label: 'Updated', value: formatDateTime(details.item.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Basic Information" subtitle="Core context and hierarchy" />
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Item Type</p>
              <Badge variant="primary" className="mt-2">
                {itemTypeName}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</p>
              <Badge variant="secondary" className="mt-2">
                {categoryName}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Family</p>
              <Badge variant="secondary" className="mt-2">
                {familyName}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hierarchy Depth</p>
              <span className="text-sm text-foreground">
                {details.hierarchy.categoryPath.length + details.hierarchy.familyPath.length}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Metadata" subtitle="Tracking information" />
          <div className="px-6 pb-6 grid grid-cols-1 gap-4">
            {metadataRows.map((row) => (
              <div key={row.label}>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{row.label}</p>
                <p className="text-sm text-foreground mt-1">{row.value ?? '—'}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {details.attributeGroups.length ? (
        details.attributeGroups.map((group: ItemAttributeGroupSummary) => {
          const groupAttributes = group.attributes ?? [];
          return (
            <Card key={group.id}>
              <CardHeader
                title={group.name}
                subtitle={
                  group.note ||
                  `${group.attributeCount} attribute${group.attributeCount === 1 ? '' : 's'}${
                    group.required ? ' • required' : ''
                  }${group.inherited ? ' • inherited' : ''}`
                }
              />
              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" size="sm">
                    {group.attributeCount} fields
                  </Badge>
                  {group.required && (
                    <Badge variant="error" size="sm">
                      Required
                    </Badge>
                  )}
                  {group.inherited && (
                    <Badge variant="secondary" size="sm">
                      Inherited
                    </Badge>
                  )}
                </div>
                {groupAttributes.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupAttributes.map((attribute) => (
                      <AttributeRenderer
                        key={attribute.id}
                        attribute={attribute}
                        value={
                          attributeDrafts && Object.prototype.hasOwnProperty.call(attributeDrafts, attribute.id)
                            ? attributeDrafts[attribute.id]
                            : attributeValues[attribute.id]?.value
                        }
                        mode={editMode ? 'edit' : 'view'}
                        onChange={
                          editMode && onAttributeChange
                            ? (value) => onAttributeChange(attribute.id, value)
                            : undefined
                        }
                        readonly={!editMode}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No attributes defined for this group.</div>
                )}
              </div>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardHeader title="Attributes" subtitle="This item does not have attribute groups." />
          <div className="px-6 pb-6 text-sm text-muted-foreground">
            Attribute groups will appear here once they are linked through the item type, category, or family.
          </div>
        </Card>
      )}
    </div>
  );
};

interface AssociationsTabProps {
  associations: ItemDetails['associations'];
  editMode?: boolean;
}

interface AssociationGroup {
  associationTypeId: string;
  typeName: string;
  typeNameLocalizationId?: string | null;
  direction: 'source' | 'target';
  items: ItemAssociationSummary[];
}

const AssociationsTab: React.FC<AssociationsTabProps> = ({ associations }) => {
  const navigate = useNavigate();
  const { resolveLocalization, t } = useLanguage();
  const [columnConfigs, setColumnConfigs] = useState<Record<string, AssociationColumnConfig>>({});
  const [attributeNameMap, setAttributeNameMap] = useState<Map<string, string>>(new Map());

  // Group associations by (associationTypeId + direction)
  const groups = useMemo(() => {
    const map = new Map<string, AssociationGroup>();
    const addToGroup = (assocList: ItemAssociationSummary[], direction: 'source' | 'target') => {
      assocList.forEach((assoc) => {
        const typeId = assoc.associationTypeId ?? 'unknown';
        const groupKey = `${typeId}__${direction}`;
        if (!map.has(groupKey)) {
          map.set(groupKey, {
            associationTypeId: typeId,
            typeName: assoc.associationTypeName ?? assoc.associationTypeKey ?? 'Unnamed',
            typeNameLocalizationId: assoc.associationTypeNameLocalizationId,
            direction,
            items: [],
          });
        }
        map.get(groupKey)!.items.push(assoc);
      });
    };
    addToGroup(associations.source, 'source');
    addToGroup(associations.target, 'target');
    return Array.from(map.values());
  }, [associations]);

  // Fetch column configs and attribute names for column headers
  useEffect(() => {
    const typeIds = new Set(groups.map((g) => g.associationTypeId).filter((id) => id !== 'unknown'));
    const roles = new Set(groups.map((g) => `${g.associationTypeId}__${g.direction}`));

    const fetchConfigs = async () => {
      const results: Record<string, AssociationColumnConfig> = {};
      const configPromises: Promise<void>[] = [];

      roles.forEach((key) => {
        const [typeId, direction] = key.split('__');
        if (typeId === 'unknown') return;
        const counterpartRole = direction === 'source' ? 'target' : 'source';
        configPromises.push(
          associationColumnConfigService
            .getConfig(typeId, counterpartRole as 'source' | 'target')
            .then((config) => {
              results[key] = config;
            })
            .catch(() => {}),
        );
      });

      await Promise.all(configPromises);
      setColumnConfigs(results);

      // Collect attribute IDs from all configs that need name resolution
      const attrIds = new Set<string>();
      Object.values(results).forEach((config) => {
        (config.columns ?? []).forEach((col) => {
          if (col.source === 'attribute' && !col.options?.attributeName) {
            const attrId = (col.options?.attributeId as string) ?? col.key.replace('attribute.', '');
            if (attrId) attrIds.add(attrId);
          }
        });
      });

      // Load attribute names if needed
      if (attrIds.size > 0) {
        try {
          const allAttributes = await attributesService.list();
          const nameMap = new Map<string, string>();
          allAttributes.forEach((attr) => {
            nameMap.set(attr.id, attr.name || attr.key || attr.id);
          });
          setAttributeNameMap(nameMap);
        } catch {
          // Attribute names will fall back to key or ID
        }
      }
    };

    if (typeIds.size > 0) {
      fetchConfigs();
    }
  }, [groups]);

  const resolveTypeName = (group: AssociationGroup): string => {
    if (group.typeNameLocalizationId) {
      const resolved = resolveLocalization(group.typeNameLocalizationId);
      if (resolved) return resolved;
    }
    return group.typeName;
  };

  const formatAttrValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? t('common.yes') || 'Yes' : t('common.no') || 'No';
    if (Array.isArray(value)) return value.map((v) => formatAttrValue(v)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Helper: returns fallback if translation key is not found (t returns the key itself)
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const resolveColumnHeader = (col: { key: string; source: string; labelLocalizationId?: string | null; options?: Record<string, unknown> | null }): string => {
    if (col.labelLocalizationId) {
      const resolved = resolveLocalization(col.labelLocalizationId);
      if (resolved) return resolved;
    }
    switch (col.key) {
      case 'meta.name': return tr('items.name', 'Name');
      case 'meta.code': return tr('items.code', 'Code');
      case 'meta.itemType': return tr('items.item_type', 'Item Type');
      case 'meta.category': return tr('items.category', 'Category');
      case 'meta.family': return tr('items.family', 'Family');
      case 'meta.createdAt': return tr('common.created_at', 'Created At');
      case 'meta.updatedAt': return tr('common.updated_at', 'Updated At');
      case 'meta.createdBy': return tr('common.created_by', 'Created By');
      case 'meta.updatedBy': return tr('common.updated_by', 'Updated By');
      case 'relationship.orderIndex': return tr('association_types.column_labels.order', 'Order');
      default: {
        // For attribute columns, resolve the name
        if (col.source === 'attribute') {
          if (col.options?.attributeName) return String(col.options.attributeName);
          const attrId = (col.options?.attributeId as string) ?? col.key.replace('attribute.', '');
          const resolvedName = attributeNameMap.get(attrId);
          if (resolvedName) return resolvedName;
          if (col.options?.attributeKey) return String(col.options.attributeKey);
        }
        return col.key.replace(/^(meta\.|attribute\.|relationship\.)/, '');
      }
    }
  };

  const hasAssociations = associations.source.length || associations.target.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {tr('items.details.associations_title', 'Item Associations')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {tr('items.details.associations_description', 'Relationships where this item participates.')}
          </p>
        </div>
        <Badge variant="primary" size="sm">
          {associations.source.length + associations.target.length} {tr('common.total', 'total')}
        </Badge>
      </div>

      {hasAssociations ? (
        <div className="space-y-6">
          {groups.map((group) => {
            const configKey = `${group.associationTypeId}__${group.direction}`;
            const config = columnConfigs[configKey];
            const visibleColumns = config?.columns?.filter((c) => c.visible !== false) ?? [];

            return (
              <Card key={configKey}>
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {resolveTypeName(group)}
                      </h4>
                      <Badge variant="secondary" size="sm">
                        {group.direction === 'source' ? 'Source → Target' : 'Target ← Source'}
                      </Badge>
                    </div>
                    <Badge variant="outline" size="sm">
                      {group.items.length} {tr('common.items', 'items')}
                    </Badge>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {visibleColumns.length === 0 ? (
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            {tr('items.name', 'Name')}
                          </th>
                        ) : (
                          visibleColumns.map((col) => (
                            <th
                              key={col.key}
                              className="px-4 py-2 text-left font-medium text-muted-foreground"
                            >
                              {resolveColumnHeader(col)}
                            </th>
                          ))
                        )}
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                          {tr('common.actions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((assoc) => (
                        <tr key={assoc.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          {visibleColumns.length === 0 ? (
                            <td className="px-4 py-3">
                              <span className="font-medium text-foreground">
                                {assoc.counterpartItemName ?? assoc.counterpartItemId ?? '—'}
                              </span>
                            </td>
                          ) : (
                            visibleColumns.map((col) => {
                              let cellValue: React.ReactNode = '—';

                              if (col.source === 'attribute') {
                                const attrId =
                                  (col.options?.attributeId as string | undefined) ??
                                  (col.key.startsWith('attribute.') ? col.key.split('.')[1] : undefined);
                                if (attrId && assoc.counterpartItemAttributeValues) {
                                  cellValue = formatAttrValue(assoc.counterpartItemAttributeValues[attrId]);
                                }
                              } else if (col.source === 'meta') {
                                switch (col.key) {
                                  case 'meta.name':
                                    cellValue = assoc.counterpartItemName ?? '—';
                                    break;
                                  case 'meta.code':
                                    cellValue = assoc.counterpartItemId ?? '—';
                                    break;
                                  case 'meta.itemType':
                                    cellValue = assoc.counterpartItemItemTypeName ?? '—';
                                    break;
                                  case 'meta.category':
                                    cellValue = assoc.counterpartItemCategoryName ?? '—';
                                    break;
                                  case 'meta.family':
                                    cellValue = assoc.counterpartItemFamilyName ?? '—';
                                    break;
                                  case 'meta.createdAt':
                                    cellValue = assoc.createdAt ? new Date(assoc.createdAt).toLocaleString() : '—';
                                    break;
                                  case 'meta.updatedAt':
                                    cellValue = assoc.updatedAt ? new Date(assoc.updatedAt).toLocaleString() : '—';
                                    break;
                                  case 'meta.createdBy':
                                  case 'meta.updatedBy':
                                    cellValue = '—';
                                    break;
                                  default:
                                    cellValue = '—';
                                }
                              } else if (col.source === 'relationship') {
                                if (col.key === 'relationship.orderIndex') {
                                  cellValue = typeof assoc.orderIndex === 'number' ? `#${assoc.orderIndex + 1}` : '—';
                                }
                              }

                              return (
                                <td key={col.key} className="px-4 py-3 text-foreground">
                                  {cellValue}
                                </td>
                              );
                            })
                          )}
                          <td className="px-4 py-3 text-right">
                            {assoc.counterpartItemId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/items/${assoc.counterpartItemId}`)}
                              >
                                {tr('common.view_details', 'View')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            {tr('items.details.no_associations', 'No associations are linked to this item yet.')}
          </div>
        </Card>
      )}
    </div>
  );
};

interface HierarchyTabProps {
  item: Item;
  itemType?: ItemType | null;
  hierarchy: ItemDetails['hierarchy'];
}

const HierarchyTab: React.FC<HierarchyTabProps> = ({ item, itemType, hierarchy }) => {
  const navigate = useNavigate();
  const categoryPathLabel = getPathLabel(hierarchy.categoryPath);
  const familyPathLabel = getPathLabel(hierarchy.familyPath);
  const itemTypeName = useMemo(
    () => resolveItemTypeName(itemType, item.itemTypeSummary, item.itemTypeId),
    [item.itemTypeId, item.itemTypeSummary, itemType],
  );

  const nodes = [
    {
      label: 'Item Type',
      value: itemTypeName,
      icon: Database,
      href: item.itemTypeId ? `/item-types/${item.itemTypeId}` : null,
    },
    {
      label: 'Category',
      value: getLeafName(hierarchy.categoryPath, item.categoryId ?? null),
      icon: FolderTree,
      href: item.categoryId ? `/categories/${item.categoryId}` : null,
    },
    {
      label: 'Family',
      value: getLeafName(hierarchy.familyPath, item.familyId ?? null),
      icon: Layers,
      href: item.familyId ? `/families/${item.familyId}` : null,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Hierarchy Path" subtitle="Resolved ancestry for this item" />
        <div className="px-6 pb-6 space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category Path</p>
            <p className="text-foreground mt-1">{categoryPathLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Family Path</p>
            <p className="text-foreground mt-1">{familyPathLabel}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {nodes.map((node) => (
          <Card key={node.label} padding="md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <node.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{node.label}</p>
                  <p className="text-sm font-semibold text-foreground">{node.value}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={!node.href}
                onClick={() => node.href && navigate(node.href)}
              >
                View
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const ItemsDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const [details, setDetails] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [attributeDrafts, setAttributeDrafts] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const canEdit = hasPermission(PERMISSIONS.CATALOG.ITEMS.UPDATE);
  const canDelete = hasPermission(PERMISSIONS.CATALOG.ITEMS.DELETE);

  const fetchDetails = useCallback(async () => {
    if (!id) {
      setError('Item ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await itemsService.getDetails(id);
      setDetails(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Item details could not be loaded.';
      setError(message);
      if (showToast) {
        showToast({
          variant: 'error',
          title: t('items.details.load_error_title') || 'Unable to load item',
          description: message,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id, showToast, t]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const associationCount = details
    ? details.associations.source.length + details.associations.target.length
    : 0;

  const itemTypeDisplayName = details
    ? resolveItemTypeName(details.itemType, details.item.itemTypeSummary, details.item.itemTypeId)
    : null;

  const subtitle = details ? `${details.item.id} • ${itemTypeDisplayName ?? 'Unknown type'}` : '';
  const deleteTitle =
    t('items.details.delete_title', { name: details?.item.name ?? '' }) ??
    (details ? `Delete ${details.item.name}?` : 'Delete Item?');
  const deleteDescription =
    t('items.details.delete_description') ??
    'This will permanently remove the item and its attribute values.';
  const deleteConfirm = t('items.details.delete_confirm') ?? 'Delete';


  const computeHasChanges = useCallback(
    (drafts: Record<string, unknown>, currentDetails: ItemDetails | null): boolean => {
      if (!currentDetails) return false;
      const seen = new Set<string>();
      for (const group of currentDetails.attributeGroups) {
        for (const attr of group.attributes ?? []) {
          if (seen.has(attr.id)) continue;
          seen.add(attr.id);
          const draftExists = Object.prototype.hasOwnProperty.call(drafts, attr.id);
          const draftValue = draftExists ? drafts[attr.id] : undefined;
          const originalValue = currentDetails.attributeValues[attr.id]?.value;
          if (draftExists) {
            try {
              if (JSON.stringify(draftValue) !== JSON.stringify(originalValue)) {
                return true;
              }
            } catch {
              if (draftValue !== originalValue) return true;
            }
          }
        }
      }
      return false;
    },
    [],
  );

  const handleAttributeChange = useCallback(
    (attributeId: string, value: unknown) => {
      setAttributeDrafts((prev) => {
        const next = { ...prev, [attributeId]: value };
        setHasChanges(computeHasChanges(next, details));
        return next;
      });
    },
    [computeHasChanges, details],
  );

  const handleEnterEdit = useCallback(() => {
    if (!details) return;
    const nextDrafts: Record<string, unknown> = {};
    Object.entries(details.attributeValues ?? {}).forEach(([attrId, value]) => {
      nextDrafts[attrId] = value.value;
    });
    setAttributeDrafts(nextDrafts);
    setHasChanges(false);
    setEditMode(true);
  }, [details]);

  const handleCancelEdit = useCallback(() => {
    setAttributeDrafts({});
    setHasChanges(false);
    setEditMode(false);
  }, []);

  const buildAttributePayload = useCallback(
    (currentDetails: ItemDetails, drafts: Record<string, unknown>): Record<string, unknown> => {
      const payload: Record<string, unknown> = {};
      const seen = new Set<string>();

      for (const group of currentDetails.attributeGroups) {
        for (const attr of group.attributes ?? []) {
          if (seen.has(attr.id)) continue;
          seen.add(attr.id);
          const type = (attr.type || '').toLowerCase();
          const draftExists = Object.prototype.hasOwnProperty.call(drafts, attr.id);
          const existingValue = currentDetails.attributeValues[attr.id]?.value;
          let value: unknown = draftExists ? drafts[attr.id] : existingValue;

          if ((type === 'formula' || type === 'expression') && !draftExists) {
            value = typeof attr.defaultValue !== 'undefined' ? attr.defaultValue : '';
          }

          if (typeof value === 'undefined') {
            if (typeof existingValue === 'undefined') {
              continue;
            }
            value = existingValue;
          }

          payload[attr.id] = value;
        }
      }

      return payload;
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!details) return;
    const attributesPayload = buildAttributePayload(details, attributeDrafts);

    try {
      await itemsService.update(details.item.id, {
        categoryId: details.item.categoryId ?? undefined,
        familyId: details.item.familyId ?? undefined,
        attributes: attributesPayload,
        bumpVersion: true,
      });
      await fetchDetails();
      setAttributeDrafts({});
      setEditMode(false);
      setHasChanges(false);
      showToast({
        type: 'success',
        message: t('items.details.update_success') ?? 'Item updated successfully.',
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ??
        t('items.details.update_failed') ??
        'Item could not be updated.';
      showToast({ type: 'error', message });
    }
  }, [attributeDrafts, buildAttributePayload, details, fetchDetails, showToast, t]);

  const tabs: TabConfig[] = useMemo(() => {
    if (!details) {
      return [];
    }
    return [
      {
        id: 'details',
        label: 'Details',
        icon: Package,
        component: ItemDetailsTab,
        props: {
          details,
          editMode,
          attributeDrafts,
          onAttributeChange: handleAttributeChange,
        },
      },
      {
        id: 'associations',
        label: 'Associations',
        icon: Zap,
        component: AssociationsTab,
        badge: associationCount ? associationCount.toString() : undefined,
        props: { associations: details.associations },
      },
      {
        id: 'hierarchy',
        label: 'Hierarchy',
        icon: Layers,
        component: HierarchyTab,
        props: { item: details.item, itemType: details.itemType, hierarchy: details.hierarchy },
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        component: NotificationSettings,
        props: { entityType: 'item', entityId: details.item.id },
      },
      {
        id: 'statistics',
        label: 'Statistics',
        icon: BarChart3,
        component: Statistics,
        props: { entityType: 'item', entityId: details.item.id, statistics: details.statistics },
      },
      {
        id: 'api',
        label: 'API',
        icon: Globe,
        component: APITester,
        props: { entityType: 'item', entityId: details.item.id, endpoints: details.apiEndpoints },
      },
      {
        id: 'documentation',
        label: 'Documentation',
        icon: BookOpen,
        component: Documentation,
        props: {
          entityType: 'item',
          entityId: details.item.id,
          sections: details.documentationSections,
        },
      },
      {
        id: 'history',
        label: 'History',
        icon: HistoryIcon,
        component: HistoryTable,
        props: { entityType: 'Item', entityId: details.item.id },
      },
    ];
  }, [associationCount, attributeDrafts, details, editMode, handleAttributeChange]);

  const handleDelete = useCallback(async () => {
    if (!details) {
      return;
    }
    setDeleteLoading(true);
    try {
      await itemsService.delete(details.item.id);
      showToast({
        type: 'success',
        message: t('items.details.delete_success') ?? 'Item deleted successfully.',
      });
      navigate('/items');
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ??
        t('items.details.delete_failed') ??
        'Item could not be deleted.';
      showToast({ type: 'error', message });
      throw error;
    } finally {
      setDeleteLoading(false);
    }
  }, [details, navigate, showToast, t]);

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t('items.details.loading') || 'Loading item details...'}
            </p>
          </>
        ) : (
          <Card className="max-w-lg w-full p-8 text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="text-sm text-muted-foreground">{error ?? 'Item not found.'}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/items')}>
                Back to list
              </Button>
              <Button onClick={fetchDetails}>Retry</Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={details.item.name}
        subtitle={subtitle}
        icon={<Package className="h-6 w-6 text-white" />}
        tabs={tabs}
        defaultTab="details"
        backUrl="/items"
        onSave={canEdit ? handleSave : undefined}
        onCancel={canEdit ? handleCancelEdit : undefined}
        onEdit={canEdit ? handleEnterEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        deleteButtonLabel={t('common.delete')}
        deleteDialogTitle={deleteTitle}
        deleteDialogDescription={deleteDescription}
        deleteConfirmLabel={deleteConfirm}
        deleteLoading={deleteLoading}
        canDelete={canDelete}
        editMode={editMode}
        hasChanges={hasChanges}
        inlineActions={false}
      />
    </>
  );
};
