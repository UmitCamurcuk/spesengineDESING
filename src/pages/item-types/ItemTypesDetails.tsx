import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
}

interface ItemTypeColumnConfigTabProps {
  itemType: ItemType;
  attributeGroups: AttributeGroupMap;
  canEdit: boolean;
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

const ItemTypeColumnConfigTab: React.FC<ItemTypeColumnConfigTabProps> = ({
  itemType,
  attributeGroups,
  canEdit,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [activeContext, setActiveContext] = useState<'list' | 'navbar'>('list');
  const [columns, setColumns] = useState<ItemTypeColumnDefinition[]>([]);
  const [initialColumns, setInitialColumns] = useState<ItemTypeColumnDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColumnKey, setSelectedColumnKey] = useState('');

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
    ],
    [t],
  );

  const attributeColumns = useMemo(() => {
    const map = new Map<string, AvailableColumn>();
    attributeGroups.forEach((group) => {
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
  }, [attributeGroups]);

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

  const loadColumns = useCallback(
    async (context: 'list' | 'navbar') => {
      if (!itemType?.id) {
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const config = await itemTypesService.getColumnConfig(itemType.id, context);
        if (config && config.columns.length > 0) {
          const normalized = normalizeColumns(config.columns);
          setColumns(normalized);
          setInitialColumns(normalized);
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
          setColumns(normalized);
          setInitialColumns(normalized);
        }
        setSelectedColumnKey('');
      } catch (err: any) {
        console.error('Failed to load column config', err);
        setError(
          err?.response?.data?.error?.message ||
            t('item_types.column_config.load_failed') ||
            'Kolon konfigürasyonu yüklenemedi.',
        );
      } finally {
        setLoading(false);
      }
    },
    [itemType?.id, normalizeColumns, t],
  );

  useEffect(() => {
    void loadColumns(activeContext);
  }, [activeContext, loadColumns]);

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

  const isDirty = useMemo(() => {
    const current = JSON.stringify(normalizeColumns(columns));
    const initial = JSON.stringify(normalizeColumns(initialColumns));
    return current !== initial;
  }, [columns, initialColumns, normalizeColumns]);

  const handleContextChange = (nextContext: 'list' | 'navbar') => {
    if (saving || loading) {
      return;
    }
    setActiveContext(nextContext);
  };

  const handleToggleVisible = (index: number, value: boolean) => {
    setColumns((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], visible: value };
      return next;
    });
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    setColumns((prev) => {
      const next = prev.slice();
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev;
      }
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return normalizeColumns(next);
    });
  };

  const handleRemoveColumn = (index: number) => {
    setColumns((prev) => normalizeColumns(prev.filter((_, i) => i !== index)));
  };

  const handleAddColumn = () => {
    if (!selectedColumnKey) {
      return;
    }
    const option = allColumns.find((column) => column.key === selectedColumnKey);
    if (!option) {
      return;
    }
    setColumns((prev) =>
      normalizeColumns([
        ...prev,
        {
          key: option.key,
          source: option.source,
          visible: true,
          order: prev.length,
          options: option.options,
        },
      ]),
    );
    setSelectedColumnKey('');
  };

  const handleReset = () => {
    setColumns(normalizeColumns(initialColumns));
    setSelectedColumnKey('');
  };

  const handleSave = async () => {
    if (!canEdit || saving || !isDirty) {
      return;
    }
    try {
      setSaving(true);
      const payload = {
        context: activeContext,
        columns: normalizeColumns(columns),
      };
      const updated = await itemTypesService.updateColumnConfig(itemType.id, payload);
      const normalized = normalizeColumns(updated.columns ?? []);
      setColumns(normalized);
      setInitialColumns(normalized);
      showToast({
        type: 'success',
        message:
          t('item_types.column_config.save_success') || 'Kolon konfigürasyonu kaydedildi.',
      });
    } catch (err: any) {
      console.error('Failed to save column config', err);
      const message =
        err?.response?.data?.error?.message ||
        t('item_types.column_config.save_failed') ||
        'Kolon konfigürasyonu kaydedilemedi.';
      showToast({ type: 'error', message });
    } finally {
      setSaving(false);
    }
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
                onClick={() => handleContextChange(option.value)}
                className={
                  option.value === activeContext
                    ? 'px-3 py-1.5 text-xs font-medium rounded-md bg-background shadow-sm'
                    : 'px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground'
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
              'Bu item type navbar’da gösterilmiyor. Navbar kolonları yalnızca showInNavbar etkinleştirildiğinde kullanılır.'}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
            {error}
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
              disabled={unusedColumns.length === 0 || !canEdit}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddColumn}
              disabled={!canEdit || !selectedColumnKey}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              {t('item_types.column_config.add_column') || 'Kolon Ekle'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!canEdit || !isDirty || saving}
            >
              {t('common.reset') || 'Sıfırla'}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!canEdit || !isDirty || saving}
              loading={saving}
            >
              {t('common.save') || 'Kaydet'}
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
          <div className="space-y-3">
            {columns.map((column, index) => {
              const label = resolveColumnLabel(column);
              const sourceLabel = resolveSourceLabel(column.source);
              const helper = columnLabelMap.get(column.key)
                ? allColumns.find((option) => option.key === column.key)?.helper
                : undefined;

              return (
                <div
                  key={`${column.key}-${index}`}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                    </span>
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
                      onChange={(event) => handleToggleVisible(index, event.target.checked)}
                      disabled={!canEdit}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveColumn(index, 'up')}
                      disabled={!canEdit || index === 0}
                      className="px-2"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveColumn(index, 'down')}
                      disabled={!canEdit || index === columns.length - 1}
                      className="px-2"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveColumn(index)}
                      disabled={!canEdit}
                      className="px-2 text-error hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<ItemTypeEditFormState | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ChangeSummary[]>([]);

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

  useEffect(() => {
    if (itemType) {
      setEditForm({
        lifecycleStatus: itemType.lifecycleStatus,
        showInNavbar: Boolean(itemType.showInNavbar),
      });
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
    return false;
  }, [editForm, itemType]);

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
    return summary;
  }, [editForm, itemType, t]);

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
    setEditMode(false);
  }, [itemType]);

  const performSave = useCallback(
    async (comment: string) => {
      if (!itemType || !editForm) {
        return;
      }
      try {
        setSaving(true);
        const payload: Record<string, unknown> = { comment };
        if (editForm.lifecycleStatus !== itemType.lifecycleStatus) {
          payload.lifecycleStatus = editForm.lifecycleStatus;
        }
        if (editForm.showInNavbar !== Boolean(itemType.showInNavbar)) {
          payload.showInNavbar = editForm.showInNavbar;
        }
        if (Object.keys(payload).length === 1) {
          // only comment, no actual change
          setSaving(false);
          showToast({
            type: 'info',
            message: t('item_types.no_changes') || 'Güncellenecek değişiklik yok.',
          });
          return;
        }
        const updated = await itemTypesService.update(itemType.id, payload);
        setItemType(updated);
        setEditForm({
          lifecycleStatus: updated.lifecycleStatus,
          showInNavbar: Boolean(updated.showInNavbar),
        });
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
    [editForm, itemType, showToast, t],
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
      },
    },
    {
      id: 'column-config',
      label: t('item_types.column_config_tab') || 'Column Settings',
      icon: Database,
      component: ItemTypeColumnConfigTab,
      props: {
        itemType,
        attributeGroups: attributeGroupMap,
        canEdit: canUpdate,
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
