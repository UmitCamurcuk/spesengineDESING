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
import type {
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

const AssociationsTab: React.FC<AssociationsTabProps> = ({ associations }) => {
  const navigate = useNavigate();
  const { formatDateTime } = useDateFormatter();

  const renderAssociationCard = (itemAssoc: ItemAssociationSummary, roleLabel: string) => (
    <Card key={itemAssoc.id}>
      <div className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {itemAssoc.associationTypeName ?? itemAssoc.associationTypeKey ?? 'Unnamed association'}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Badge variant="secondary" size="sm">
              {roleLabel}
            </Badge>
            {typeof itemAssoc.orderIndex === 'number' && (
              <Badge variant="outline" size="sm">
                #{itemAssoc.orderIndex + 1}
              </Badge>
            )}
            <span>Updated {formatDateTime(itemAssoc.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm">
            {itemAssoc.counterpartItemName ?? itemAssoc.counterpartItemId ?? 'Unlinked'}
          </Badge>
          {itemAssoc.counterpartItemId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/items/${itemAssoc.counterpartItemId}`)}
            >
              View Item
            </Button>
          )}
        </div>
      </div>
      {itemAssoc.metadata && (
        <div className="px-6 pb-4">
          <p className="text-xs text-muted-foreground mb-2">Metadata</p>
          <pre className="bg-muted rounded-lg p-3 text-xs text-foreground overflow-auto">
            {JSON.stringify(itemAssoc.metadata, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );

  const hasAssociations = associations.source.length || associations.target.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Item Associations</h3>
          <p className="text-sm text-muted-foreground">Relationships where this item participates.</p>
        </div>
        <Badge variant="primary" size="sm">
          {associations.source.length + associations.target.length} total
        </Badge>
      </div>

      {hasAssociations ? (
        <div className="space-y-6">
          {associations.source.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">As Source (outgoing)</h4>
              {associations.source.map((assoc) => renderAssociationCard(assoc, 'Source → Target'))}
            </div>
          )}
          {associations.target.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">As Target (incoming)</h4>
              {associations.target.map((assoc) => renderAssociationCard(assoc, 'Target ← Source'))}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No associations are linked to this item yet.
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
