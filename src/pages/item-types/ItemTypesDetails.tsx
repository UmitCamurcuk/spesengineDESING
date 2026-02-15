import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  Database,
  FileText,
  Globe,
  GripVertical,
  History as HistoryIcon,
  Plus,
  Tags,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Statistics } from '../../components/common/Statistics';
import { Documentation } from '../../components/common/Documentation';
import { APITester } from '../../components/common/APITester';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { HistoryTable } from '../../components/common/HistoryTable';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { AttributeGroupSelector } from '../../components/ui/AttributeGroupSelector';
import { categoriesService } from '../../api/services/categories.service';
import { familiesService } from '../../api/services/families.service';
import { itemTypesService } from '../../api/services/item-types.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import type {
  AttributeGroup,
  Category,
  Family,
  ItemType,
  AttributeGroupBinding,
  ItemTypeColumnDefinition,
} from '../../types';
import type {
  APIEndpoint,
  DocumentationSection,
  Statistics as StatisticsType,
  TabConfig,
} from '../../types/common';
import { PERMISSIONS } from '../../config/permissions';

type AttributeGroupMap = Map<string, AttributeGroup>;
type EntityMap = Map<string, string>;
type AvailableColumn = {
  key: string;
  label: string;
  source: ItemTypeColumnDefinition['source'];
  helper?: string;
  options?: Record<string, unknown>;
};

type ChangeSummary = {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
};

interface ItemTypeEditFormState {
  lifecycleStatus: ItemType['lifecycleStatus'];
  showInNavbar: boolean;
}

interface ItemTypeDetailsTabProps {
  itemType: ItemType;
  categoryNames: string[];
  familyNames: string[];
  editMode: boolean;
  formState: ItemTypeEditFormState | null;
  onFormChange: (patch: Partial<ItemTypeEditFormState>) => void;
}

interface ItemTypeAttributeGroupsTabProps {
  bindings: AttributeGroupBinding[];
  attributeGroups: AttributeGroupMap;
  availableGroups: AttributeGroup[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  editMode?: boolean;
}

interface ItemTypeColumnConfigTabProps {
  itemType: ItemType;
  attributeGroups: AttributeGroup[];
  categories: Category[];
  families: Family[];
  canEdit: boolean;
  editMode: boolean;
  columns: ItemTypeColumnDefinition[];
  initialColumns: ItemTypeColumnDefinition[];
  onColumnsChange: (columns: ItemTypeColumnDefinition[]) => void;
  activeContext: 'list' | 'navbar';
  onContextChange: (context: 'list' | 'navbar') => void;
  loading: boolean;
}

const ItemTypeDetailsTab: React.FC<ItemTypeDetailsTabProps> = ({
  itemType,
  categoryNames,
  familyNames,
  editMode,
  formState,
  onFormChange,
}) => {
  const { t } = useLanguage();
  const lifecycleOptions = useMemo(
    () => [
      { value: 'draft', label: t('item_types.lifecycle.draft') || 'Taslak' },
      { value: 'active', label: t('item_types.lifecycle.active') || 'Aktif' },
      { value: 'deprecated', label: t('item_types.lifecycle.deprecated') || 'Kaldırıldı' },
    ],
    [t],
  );

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

  const lifecycleValue = formState?.lifecycleStatus ?? itemType.lifecycleStatus;
  const lifecycleLabel =
    t(`item_types.lifecycle.${lifecycleValue}`) ?? lifecycleValue.toUpperCase();

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
            {editMode ? (
              <Select
                value={lifecycleValue}
                onChange={(event) =>
                  onFormChange({
                    lifecycleStatus: event.target.value as ItemType['lifecycleStatus'],
                  })
                }
                options={lifecycleOptions}
                className="mt-1 text-sm"
              />
            ) : (
              <Badge variant={lifecycleVariant}>{lifecycleLabel}</Badge>
            )}
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t('item_types.fields.show_in_navbar') || 'Show in Navbar'}
            </span>
            {editMode ? (
              <Checkbox
                checked={formState?.showInNavbar ?? itemType.showInNavbar ?? false}
                onChange={(event) => onFormChange({ showInNavbar: event.target.checked })}
                label={
                  (formState?.showInNavbar ?? itemType.showInNavbar)
                    ? t('common.active') || 'Active'
                    : t('common.inactive') || 'Inactive'
                }
              />
            ) : (
              <Badge variant={itemType.showInNavbar ? 'primary' : 'secondary'}>
                {itemType.showInNavbar
                  ? t('common.active') || 'Active'
                  : t('common.inactive') || 'Inactive'}
              </Badge>
            )}
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
  availableGroups,
  selectedIds = [],
  onSelectionChange,
  editMode = false,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const bindingMap = useMemo(
    () => new Map(bindings.map((binding) => [binding.attributeGroupId, binding])),
    [bindings],
  );

  if (editMode) {
    if (!availableGroups || availableGroups.length === 0) {
      return (
        <Card padding="lg">
          <div className="text-sm text-muted-foreground">
            {t('item_types.attribute_groups.empty') || 'No attribute groups linked.'}
          </div>
        </Card>
      );
    }

    const resolvedSelection = selectedIds.length
      ? selectedIds.map((groupId) => ({
          groupId,
          group: attributeGroups.get(groupId),
          binding: bindingMap.get(groupId) ?? null,
        }))
      : [];

    return (
      <div className="space-y-6">
        <Card padding="lg" className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('item_types.attribute_groups.title') || 'Attribute Groups'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('item_types.attribute_groups.helper') ||
                'Select attribute groups that belong to this item type.'}
            </p>
          </div>
          <AttributeGroupSelector
            groups={availableGroups.map((group) => ({
              id: group.id,
              code: group.key ?? group.id,
              name: group.name,
              description: group.description,
              attributeCount:
                group.attributeCount ??
                group.attributeIds?.length ??
                group.attributes?.length ??
                0,
            }))}
            selectedGroups={selectedIds}
            onSelectionChange={onSelectionChange}
          />
        </Card>

        <Card padding="lg">
          {resolvedSelection.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t('item_types.attribute_groups.empty_selection') ||
                'No attribute groups selected yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {resolvedSelection.map(({ groupId, group, binding }) => (
                <Card
                  key={groupId}
                  padding="md"
                  className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Tags className="h-4 w-4 text-primary" />
                      {group?.name ?? groupId}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <code>{groupId}</code>
                    </div>
                    {group?.description ? (
                      <p className="text-xs text-muted-foreground mt-2">{group.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {binding?.required ? (
                      <Badge variant="outline" size="sm">
                        {t('item_types.attribute_groups.required') || 'Required'}
                      </Badge>
                    ) : null}
                    {binding?.inherited ? (
                      <Badge variant="secondary" size="sm">
                        {t('item_types.attribute_groups.inherited') || 'Inherited'}
                      </Badge>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/attribute-groups/${groupId}`)}
                    >
                      {t('common.view') || 'View'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

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

interface SortableColumnItemProps {
  column: ItemTypeColumnDefinition;
  index: number;
  editMode: boolean;
  label: string;
  sourceLabel: string;
  helper?: string;
  isFirst: boolean;
  isLast: boolean;
  onToggleVisible: (index: number, value: boolean) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (index: number) => void;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  index,
  editMode,
  label,
  sourceLabel,
  helper,
  isFirst,
  isLast,
  onToggleVisible,
  onMove,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-3 rounded-lg border border-border bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`mt-1 text-muted-foreground ${editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          disabled={!editMode}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {sourceLabel} • {column.key}
          </p>
          {helper ? (
            <p className="text-xs text-muted-foreground mt-1">{helper}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          size="sm"
          checked={column.visible}
          onChange={(event) => onToggleVisible(index, event.target.checked)}
          disabled={!editMode}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMove(index, 'up')}
          disabled={!editMode || isFirst}
          className="px-2"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMove(index, 'down')}
          disabled={!editMode || isLast}
          className="px-2"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={!editMode}
          className="px-2 text-error hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ItemTypeColumnConfigTab: React.FC<ItemTypeColumnConfigTabProps> = ({
  itemType,
  attributeGroups,
  categories,
  families,
  canEdit,
  editMode,
  columns,
  initialColumns,
  onColumnsChange,
  activeContext,
  onContextChange,
  loading,
}) => {
  const { t } = useLanguage();
  const [selectedColumnKey, setSelectedColumnKey] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const metaColumns = useMemo(
    () => [
      {
        key: 'meta.code',
        label: t('item_types.column_labels.code') || 'Item Code',
        source: 'meta' as const,
        helper: t('item_types.column_descriptions.code') || 'Internal item code',
      },
      {
        key: 'meta.name',
        label: t('item_types.column_labels.name') || 'Item Name',
        source: 'meta' as const,
        helper: t('item_types.column_descriptions.name') || 'Primary display name',
      },
      {
        key: 'meta.status',
        label: t('item_types.column_labels.status') || 'Status',
        source: 'meta' as const,
      },
      {
        key: 'meta.createdAt',
        label: t('item_types.column_labels.created_at') || 'Created At',
        source: 'meta' as const,
      },
      {
        key: 'meta.updatedAt',
        label: t('item_types.column_labels.updated_at') || 'Updated At',
        source: 'meta' as const,
      },
      {
        key: 'meta.category',
        label: t('item_types.column_labels.category') || 'Category',
        source: 'meta' as const,
        helper: t('item_types.column_descriptions.category') || 'Item category name',
      },
      {
        key: 'meta.family',
        label: t('item_types.column_labels.family') || 'Family',
        source: 'meta' as const,
        helper: t('item_types.column_descriptions.family') || 'Item family name',
      },
    ],
    [t],
  );

  const columnAttributeGroups = useMemo(() => {
    if (!itemType) return [];

    const groupIds = new Set<string>();

    const addAttributeGroupIds = (ids?: string[] | null, bindings?: AttributeGroupBinding[]) => {
      ids?.forEach((id) => id && groupIds.add(id));
      bindings?.forEach((binding) => binding.attributeGroupId && groupIds.add(binding.attributeGroupId));
    };

    addAttributeGroupIds(itemType.attributeGroupIds, itemType.attributeGroupBindings);

    const categoryIdSet = new Set<string>();
    itemType.categoryIds?.forEach((id) => id && categoryIdSet.add(id));
    categories
      .filter((category) => category.linkedItemTypeIds?.includes(itemType.id))
      .forEach((category) => categoryIdSet.add(category.id));

    const categoryByParent = new Map<string | null | undefined, string[]>();
    categories.forEach((category) => {
      const parent = category.parentCategoryId ?? null;
      const list = categoryByParent.get(parent) ?? [];
      list.push(category.id);
      categoryByParent.set(parent, list);
    });

    const expandCategoryDescendants = (ids: Set<string>) => {
      const queue = [...ids];
      while (queue.length) {
        const current = queue.shift()!;
        const children = categoryByParent.get(current) ?? [];
        children.forEach((childId) => {
          if (!ids.has(childId)) {
            ids.add(childId);
            queue.push(childId);
          }
        });
      }
    };
    expandCategoryDescendants(categoryIdSet);

    categories
      .filter((category) => categoryIdSet.has(category.id))
      .forEach((category) => addAttributeGroupIds(category.attributeGroupIds, category.attributeGroupBindings));

    const familyByParent = new Map<string | null | undefined, string[]>();
    families.forEach((family) => {
      const parent = family.parentFamilyId ?? null;
      const list = familyByParent.get(parent) ?? [];
      list.push(family.id);
      familyByParent.set(parent, list);
    });

    const familyIdSet = new Set<string>();
    itemType.linkedFamilyIds?.forEach((id) => id && familyIdSet.add(id));
    families
      .filter((family) => family.categoryId && categoryIdSet.has(family.categoryId))
      .forEach((family) => familyIdSet.add(family.id));

    const expandFamilyDescendants = (ids: Set<string>) => {
      const queue = [...ids];
      while (queue.length) {
        const current = queue.shift()!;
        const children = familyByParent.get(current) ?? [];
        children.forEach((childId) => {
          if (!ids.has(childId)) {
            ids.add(childId);
            queue.push(childId);
          }
        });
      }
    };
    expandFamilyDescendants(familyIdSet);

    families
      .filter((family) => familyIdSet.has(family.id))
      .forEach((family) => addAttributeGroupIds(family.attributeGroupIds, family.attributeGroupBindings));

    return attributeGroups.filter((group) => groupIds.has(group.id));
  }, [attributeGroups, categories, families, itemType]);

  const attributeColumns = useMemo(() => {
    const map = new Map<string, AvailableColumn>();
    columnAttributeGroups.forEach((group) => {
      group.attributes?.forEach((attribute) => {
        if (!map.has(attribute.id)) {
          map.set(attribute.id, {
            key: `attribute.${attribute.id}`,
            label: attribute.name || attribute.key || attribute.id,
            source: 'attribute' as const,
            helper: group.name ? `${group.name}` : undefined,
            options: { attributeId: attribute.id },
          });
        }
      });
    });
    return Array.from(map.values());
  }, [columnAttributeGroups]);

  const allColumns: AvailableColumn[] = useMemo(() => [...metaColumns, ...attributeColumns], [metaColumns, attributeColumns]);

  const columnLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    allColumns.forEach((column) => map.set(column.key, column.label));
    return map;
  }, [allColumns]);

  const normalizeColumns = useCallback((list: ItemTypeColumnDefinition[]) =>
    list
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((column, index) => ({ ...column, order: index })),
  []);

  const unusedColumns = useMemo(() => {
    const existingKeys = new Set(columns.map((column) => column.key));
    return allColumns.filter((column) => !existingKeys.has(column.key));
  }, [allColumns, columns]);

  const resolveColumnLabel = useCallback(
    (column: ItemTypeColumnDefinition) =>
      columnLabelMap.get(column.key) || column.key,
    [columnLabelMap],
  );

  const resolveSourceLabel = useCallback(
    (source: ItemTypeColumnDefinition['source']) => {
      switch (source) {
        case 'attribute':
          return t('item_types.column_source.attribute') || 'Attribute';
        case 'meta':
          return t('item_types.column_source.meta') || 'Meta';
        case 'association':
          return t('item_types.column_source.association') || 'Association';
        case 'computed':
          return t('item_types.column_source.computed') || 'Computed';
        default:
          return source;
      }
    },
    [t],
  );

  const handleToggleVisible = (index: number, value: boolean) => {
    const next = columns.slice();
    next[index] = { ...next[index], visible: value };
    onColumnsChange(next);
  };

  const assignOrder = useCallback((list: ItemTypeColumnDefinition[]) =>
    list.map((column, index) => ({ ...column, order: index })),
  []);

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const next = columns.slice();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) {
      return;
    }
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onColumnsChange(assignOrder(next));
  };

  const handleRemoveColumn = (index: number) => {
    const filtered = columns.filter((_, i) => i !== index);
    onColumnsChange(assignOrder(filtered));
  };

  const handleAddColumn = () => {
    if (!selectedColumnKey) {
      return;
    }
    const option = allColumns.find((column) => column.key === selectedColumnKey);
    if (!option) {
      return;
    }
    const newColumns = [
      ...columns,
      {
        key: option.key,
        source: option.source,
        visible: true,
        order: columns.length,
        options: option.options,
      },
    ];
    onColumnsChange(assignOrder(newColumns));
    setSelectedColumnKey('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = columns.findIndex((col) => col.key === active.id);
    const newIndex = columns.findIndex((col) => col.key === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedColumns = arrayMove(columns, oldIndex, newIndex);
    onColumnsChange(assignOrder(reorderedColumns));
  };

  const contextOptions: Array<{ value: 'list' | 'navbar'; label: string }> = [
    { value: 'list', label: t('item_types.column_context.list') || 'Item List' },
    { value: 'navbar', label: t('item_types.column_context.navbar') || 'Navbar' },
  ];

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('item_types.column_config.title') || 'Column Configuration'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('item_types.column_config.subtitle') ||
                'Liste ve navbar görünümlerinde hangi sütunların gösterileceğini seçin.'}
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            {contextOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onContextChange(option.value)}
                disabled={!editMode}
                className={
                  option.value === activeContext
                    ? 'px-3 py-1.5 text-xs font-medium rounded-md bg-background shadow-sm disabled:opacity-50'
                    : 'px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed'
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {activeContext === 'navbar' && !itemType.showInNavbar ? (
          <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            {t('item_types.column_config.navbar_inactive') ||
              'Bu item type navbar\'da gösterilmiyor. Navbar kolonları yalnızca showInNavbar etkinleştirildiğinde kullanılır.'}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 max-w-xs">
            <Select
              value={selectedColumnKey}
              onChange={(event) => setSelectedColumnKey(event.target.value)}
              placeholder={
                unusedColumns.length === 0
                  ? t('item_types.column_config.no_more_columns') || 'Eklenebilir başka kolon yok'
                  : t('item_types.column_config.select_column_placeholder') ||
                    'Eklenecek kolonu seçin'
              }
              options={unusedColumns.map((column) => ({
                value: column.key,
                label: column.label,
              }))}
              disabled={unusedColumns.length === 0 || !editMode}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddColumn}
              disabled={!editMode || !selectedColumnKey}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              {t('item_types.column_config.add_column') || 'Kolon Ekle'}
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">
            {t('common.loading') || 'Yükleniyor...'}
          </div>
        ) : columns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            {t('item_types.column_config.no_columns') || 'Henüz bir kolon seçilmedi.'}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((col) => col.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {columns.map((column, index) => {
                  const label = resolveColumnLabel(column);
                  const sourceLabel = resolveSourceLabel(column.source);
                  const helper = columnLabelMap.get(column.key)
                    ? allColumns.find((option) => option.key === column.key)?.helper
                    : undefined;

                  return (
                    <SortableColumnItem
                      key={column.key}
                      column={column}
                      index={index}
                      editMode={editMode}
                      label={label}
                      sourceLabel={sourceLabel}
                      helper={helper}
                      isFirst={index === 0}
                      isLast={index === columns.length - 1}
                      onToggleVisible={handleToggleVisible}
                      onMove={handleMoveColumn}
                      onRemove={handleRemoveColumn}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Card>
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
  const [selectedAttributeGroupIds, setSelectedAttributeGroupIds] = useState<string[]>([]);
  const [initialAttributeGroupIds, setInitialAttributeGroupIds] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<ItemTypeEditFormState | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ChangeSummary[]>([]);

  const [activeColumnContext, setActiveColumnContext] = useState<'list' | 'navbar'>('list');
  const [listColumns, setListColumns] = useState<ItemTypeColumnDefinition[]>([]);
  const [navbarColumns, setNavbarColumns] = useState<ItemTypeColumnDefinition[]>([]);
  const [initialListColumns, setInitialListColumns] = useState<ItemTypeColumnDefinition[]>([]);
  const [initialNavbarColumns, setInitialNavbarColumns] = useState<ItemTypeColumnDefinition[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);

  const canDelete = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.DELETE);
  const canUpdate = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.UPDATE);
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
            attributeGroupsService.resolve({ itemTypeId: id }),
          ]);

        if (cancelled) {
          return;
        }

        setItemType(itemTypeResponse);
        setCategories(categoryResponse.items ?? []);
        setFamilies(familyResponse.items ?? []);
        setAttributeGroups(attributeGroupResponse?.attributeGroups ?? attributeGroupResponse ?? []);
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

  useEffect(() => {
    if (itemType) {
      setEditForm({
        lifecycleStatus: itemType.lifecycleStatus,
        showInNavbar: Boolean(itemType.showInNavbar),
      });
      setSelectedAttributeGroupIds(itemType.attributeGroupIds ?? []);
      setInitialAttributeGroupIds(itemType.attributeGroupIds ?? []);
    }
  }, [itemType]);

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

  const hasAttributeGroupChanges = useMemo(() => {
    const current = [...selectedAttributeGroupIds].sort();
    const initial = [...initialAttributeGroupIds].sort();
    if (current.length !== initial.length) {
      return true;
    }
    return current.some((value, index) => value !== initial[index]);
  }, [initialAttributeGroupIds, selectedAttributeGroupIds]);

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

  const handleFormChange = useCallback((patch: Partial<ItemTypeEditFormState>) => {
    setEditForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const normalizeColumns = useCallback((list: ItemTypeColumnDefinition[]) =>
    list
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((column, index) => ({ ...column, order: index })),
  []);

  const loadColumns = useCallback(
    async (context: 'list' | 'navbar') => {
      if (!itemType?.id) {
        return;
      }
      try {
        setColumnsLoading(true);
        const config = await itemTypesService.getColumnConfig(itemType.id, context);
        if (config && config.columns.length > 0) {
          const normalized = normalizeColumns(config.columns);
          if (context === 'list') {
            setListColumns(normalized);
            setInitialListColumns(normalized);
          } else {
            setNavbarColumns(normalized);
            setInitialNavbarColumns(normalized);
          }
        } else {
          const defaults: ItemTypeColumnDefinition[] =
            context === 'navbar'
              ? [
                  {
                    key: 'meta.name',
                    source: 'meta',
                    visible: true,
                    order: 0,
                  },
                ]
              : [
                  { key: 'meta.code', source: 'meta', visible: true, order: 0 },
                  { key: 'meta.name', source: 'meta', visible: true, order: 1 },
                  { key: 'meta.status', source: 'meta', visible: true, order: 2 },
                ];
          const normalized = normalizeColumns(defaults);
          if (context === 'list') {
            setListColumns(normalized);
            setInitialListColumns(normalized);
          } else {
            setNavbarColumns(normalized);
            setInitialNavbarColumns(normalized);
          }
        }
      } catch (err: any) {
        console.error('Failed to load column config', err);
      } finally {
        setColumnsLoading(false);
      }
    },
    [itemType?.id, normalizeColumns],
  );

  useEffect(() => {
    if (itemType?.id) {
      void loadColumns('list');
      void loadColumns('navbar');
    }
  }, [itemType?.id, loadColumns]);

  const handleColumnContextChange = useCallback((context: 'list' | 'navbar') => {
    setActiveColumnContext(context);
  }, []);

  const handleListColumnsChange = useCallback((columns: ItemTypeColumnDefinition[]) => {
    setListColumns(columns);
  }, []);

  const handleNavbarColumnsChange = useCallback((columns: ItemTypeColumnDefinition[]) => {
    setNavbarColumns(columns);
  }, []);

  const hasListColumnChanges = useMemo(() => {
    if (listColumns.length !== initialListColumns.length) return true;

    // Önce sıralamayı kontrol et
    const currentOrder = listColumns.map((col) => col.key).join(',');
    const initialOrder = initialListColumns.map((col) => col.key).join(',');
    if (currentOrder !== initialOrder) return true;

    // Sıralama aynıysa, diğer özellikleri kontrol et (visible vb.)
    return JSON.stringify(listColumns) !== JSON.stringify(initialListColumns);
  }, [listColumns, initialListColumns]);

  const hasNavbarColumnChanges = useMemo(() => {
    if (navbarColumns.length !== initialNavbarColumns.length) return true;

    // Önce sıralamayı kontrol et
    const currentOrder = navbarColumns.map((col) => col.key).join(',');
    const initialOrder = initialNavbarColumns.map((col) => col.key).join(',');
    if (currentOrder !== initialOrder) return true;

    // Sıralama aynıysa, diğer özellikleri kontrol et (visible vb.)
    return JSON.stringify(navbarColumns) !== JSON.stringify(initialNavbarColumns);
  }, [navbarColumns, initialNavbarColumns]);

  const hasChanges = useMemo(() => {
    if (!itemType || !editForm) {
      return false;
    }
    if (editForm.lifecycleStatus !== itemType.lifecycleStatus) {
      return true;
    }
    if (editForm.showInNavbar !== Boolean(itemType.showInNavbar)) {
      return true;
    }
    if (hasAttributeGroupChanges) {
      return true;
    }
    if (hasListColumnChanges || hasNavbarColumnChanges) {
      return true;
    }
    return false;
  }, [editForm, hasAttributeGroupChanges, itemType, hasListColumnChanges, hasNavbarColumnChanges]);

  const buildChangeSummary = useCallback((): ChangeSummary[] => {
    if (!itemType || !editForm) {
      return [];
    }
    const summary: ChangeSummary[] = [];
    if (editForm.lifecycleStatus !== itemType.lifecycleStatus) {
      summary.push({
        field: t('item_types.fields.lifecycle_status') || 'Lifecycle Status',
        oldValue:
          t(`item_types.lifecycle.${itemType.lifecycleStatus}`) ??
          itemType.lifecycleStatus.toUpperCase(),
        newValue:
          t(`item_types.lifecycle.${editForm.lifecycleStatus}`) ??
          editForm.lifecycleStatus.toUpperCase(),
      });
    }
    if (editForm.showInNavbar !== Boolean(itemType.showInNavbar)) {
      summary.push({
        field: t('item_types.fields.show_in_navbar') || 'Show in Navbar',
        oldValue: itemType.showInNavbar
          ? t('common.yes') || 'Yes'
          : t('common.no') || 'No',
        newValue: editForm.showInNavbar
          ? t('common.yes') || 'Yes'
          : t('common.no') || 'No',
      });
    }
    if (hasAttributeGroupChanges) {
      summary.push({
        field: t('item_types.attribute_groups_tab') || 'Attribute Groups',
        oldValue: attributeGroupMap
          ? initialAttributeGroupIds
              .map((id) => attributeGroupMap.get(id)?.name ?? id)
              .join(', ') || '—'
          : initialAttributeGroupIds.length,
        newValue: attributeGroupMap
          ? selectedAttributeGroupIds
              .map((id) => attributeGroupMap.get(id)?.name ?? id)
              .join(', ') || '—'
          : selectedAttributeGroupIds.length,
      });
    }
    if (hasListColumnChanges) {
      summary.push({
        field: t('item_types.column_config.list_columns') || 'List Columns',
        oldValue: `${initialListColumns.length} ${t('item_types.column_config.columns') || 'columns'}`,
        newValue: `${listColumns.length} ${t('item_types.column_config.columns') || 'columns'}`,
      });
    }
    if (hasNavbarColumnChanges) {
      summary.push({
        field: t('item_types.column_config.navbar_columns') || 'Navbar Columns',
        oldValue: `${initialNavbarColumns.length} ${t('item_types.column_config.columns') || 'columns'}`,
        newValue: `${navbarColumns.length} ${t('item_types.column_config.columns') || 'columns'}`,
      });
    }
    return summary;
  }, [
    attributeGroupMap,
    editForm,
    hasAttributeGroupChanges,
    hasListColumnChanges,
    hasNavbarColumnChanges,
    initialAttributeGroupIds,
    initialListColumns,
    initialNavbarColumns,
    itemType,
    listColumns,
    navbarColumns,
    selectedAttributeGroupIds,
    t,
  ]);

  const handleEnterEdit = useCallback(() => {
    if (!itemType) {
      return;
    }
    setEditMode(true);
  }, [itemType]);

  const handleCancelEdit = useCallback(() => {
    if (!itemType) {
      return;
    }
    setEditForm({
      lifecycleStatus: itemType.lifecycleStatus,
      showInNavbar: Boolean(itemType.showInNavbar),
    });
    setSelectedAttributeGroupIds(initialAttributeGroupIds);
    setListColumns(initialListColumns);
    setNavbarColumns(initialNavbarColumns);
    setEditMode(false);
  }, [initialAttributeGroupIds, initialListColumns, initialNavbarColumns, itemType]);

  const performSave = useCallback(
    async (comment: string) => {
      if (!itemType || !editForm) {
        return;
      }
      try {
        setSaving(true);

        // Item type güncellemesi
        const payload: Record<string, unknown> = { comment };
        if (editForm.lifecycleStatus !== itemType.lifecycleStatus) {
          payload.lifecycleStatus = editForm.lifecycleStatus;
        }
        if (editForm.showInNavbar !== Boolean(itemType.showInNavbar)) {
          payload.showInNavbar = editForm.showInNavbar;
        }
        if (hasAttributeGroupChanges) {
          payload.attributeGroupIds = selectedAttributeGroupIds;
        }

        let updated = itemType;
        if (Object.keys(payload).length > 1) {
          updated = await itemTypesService.update(itemType.id, payload);
          setItemType(updated);
          setEditForm({
            lifecycleStatus: updated.lifecycleStatus,
            showInNavbar: Boolean(updated.showInNavbar),
          });
          setSelectedAttributeGroupIds(updated.attributeGroupIds ?? []);
          setInitialAttributeGroupIds(updated.attributeGroupIds ?? []);
        }

        // Kolon konfigürasyonlarını kaydet
        if (hasListColumnChanges) {
          const listPayload = {
            context: 'list' as const,
            columns: normalizeColumns(listColumns),
            comment,
          };
          const updatedListConfig = await itemTypesService.updateColumnConfig(itemType.id, listPayload);
          const normalized = normalizeColumns(updatedListConfig.columns ?? []);
          setListColumns(normalized);
          setInitialListColumns(normalized);
        }

        if (hasNavbarColumnChanges) {
          const navbarPayload = {
            context: 'navbar' as const,
            columns: normalizeColumns(navbarColumns),
            comment,
          };
          const updatedNavbarConfig = await itemTypesService.updateColumnConfig(itemType.id, navbarPayload);
          const normalized = normalizeColumns(updatedNavbarConfig.columns ?? []);
          setNavbarColumns(normalized);
          setInitialNavbarColumns(normalized);
        }

        setEditMode(false);
        showToast({
          type: 'success',
          message: t('item_types.update_success') || 'Item type başarıyla güncellendi.',
        });
      } catch (err: any) {
        console.error('Failed to update item type', err);
        const message =
          (err?.response?.data?.error?.message ??
          err?.message ??
          t('item_types.update_failed')) || 'Item type güncellenemedi.';
        showToast({ type: 'error', message });
      } finally {
        setSaving(false);
      }
    },
    [
      editForm,
      hasAttributeGroupChanges,
      hasListColumnChanges,
      hasNavbarColumnChanges,
      itemType,
      listColumns,
      navbarColumns,
      normalizeColumns,
      selectedAttributeGroupIds,
      showToast,
      t,
    ],
  );

  const handleSaveRequest = useCallback(() => {
    if (!hasChanges) {
      showToast({
        type: 'info',
        message: t('item_types.no_changes') || 'Güncellenecek değişiklik yok.',
      });
      return;
    }
    const summary = buildChangeSummary();
    setPendingChanges(summary);
    setCommentDialogOpen(true);
  }, [buildChangeSummary, hasChanges, showToast, t]);

  const handleCommentDialogClose = useCallback(() => {
    setCommentDialogOpen(false);
  }, []);

  const handleConfirmSave = useCallback(
    async (comment: string) => {
      setCommentDialogOpen(false);
      await performSave(comment);
    },
    [performSave],
  );

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
          editMode,
          formState: editForm,
          onFormChange: handleFormChange,
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
        availableGroups: attributeGroups,
        selectedIds: selectedAttributeGroupIds,
        onSelectionChange: setSelectedAttributeGroupIds,
        editMode,
      },
    },
    {
      id: 'column-config',
      label: t('item_types.column_config_tab') || 'Column Settings',
      icon: Database,
      component: ItemTypeColumnConfigTab,
      props: {
        itemType,
        attributeGroups,
        categories,
        families,
        canEdit: canUpdate,
        editMode,
        columns: activeColumnContext === 'list' ? listColumns : navbarColumns,
        initialColumns: activeColumnContext === 'list' ? initialListColumns : initialNavbarColumns,
        onColumnsChange: activeColumnContext === 'list' ? handleListColumnsChange : handleNavbarColumnsChange,
        activeContext: activeColumnContext,
        onContextChange: handleColumnContextChange,
        loading: columnsLoading,
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
    <>
      <DetailsLayout
        title={headerTitle}
        subtitle={undefined}
        icon={<Database className="h-6 w-6 text-white" />}
        tabs={tabs}
        defaultTab="details"
        backUrl="/item-types"
        editMode={editMode}
        hasChanges={hasChanges && !saving}
        onEdit={canUpdate ? handleEnterEdit : undefined}
        onSave={canUpdate ? handleSaveRequest : undefined}
        onCancel={canUpdate ? handleCancelEdit : undefined}
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

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={itemType.name ?? itemType.key}
        title={t('item_types.review_changes_title') || 'Review Changes'}
      />
    </>
  );
};

export { ItemTypesDetails };
export default ItemTypesDetails;
