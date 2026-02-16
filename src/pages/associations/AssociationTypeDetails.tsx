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
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  Database,
  FileText,
  Globe,
  GripVertical,
  History as HistoryIcon,
  Layers,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { HistoryTable } from '../../components/common/HistoryTable';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { associationTypesService } from '../../api/services/association-types.service';
import { associationRulesService } from '../../api/services/association-rules.service';
import { associationColumnConfigService } from '../../api/services/association-column-config.service';
import { categoriesService } from '../../api/services/categories.service';
import { familiesService } from '../../api/services/families.service';
import { historyService } from '../../api/services/history.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import type {
  APIEndpoint,
  DocumentationSection,
  HistoryEntry,
  Statistics as StatisticsType,
  TabConfig,
} from '../../types/common';
import type {
  AssociationColumnConfig,
  AssociationColumnDefinition,
  AssociationRule,
  AssociationType,
  Category,
  Family,
  AttributeGroup,
  CategoryFamilySummary,
} from '../../types';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';
import { PERMISSIONS } from '../../config/permissions';
import { cn } from '../../utils/cn';

interface OverviewTabProps {
  associationType: AssociationType;
  rules: AssociationRule[];
  editMode: boolean;
  formState: AssociationTypeEditFormState | null;
  onFormChange: <K extends keyof AssociationTypeEditFormState>(
    field: K,
    value: AssociationTypeEditFormState[K],
  ) => void;
}

interface ColumnSettingsTabProps {
  associationType: AssociationType;
  rules: AssociationRule[];
  categoryMap: Map<string, Category>;
  familyMap: Map<string, Family>;
  attributeGroups: Map<string, AttributeGroup>;
  editMode: boolean;
  activeRole: 'source' | 'target';
  onRoleChange: (role: 'source' | 'target') => void;
  columns: AssociationColumnDefinition[];
  onColumnsChange: (columns: AssociationColumnDefinition[]) => void;
  loading: boolean;
}

type AvailableColumn = {
  key: string;
  label: string;
  source: AssociationColumnDefinition['source'];
  helper?: string;
  options?: Record<string, unknown>;
};

interface SortableAssocColumnItemProps {
  column: AssociationColumnDefinition;
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

const SortableAssocColumnItem: React.FC<SortableAssocColumnItemProps> = ({
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

interface AssociationTypeEditFormState {
  cardinality: AssociationType['cardinality'];
  direction: AssociationType['direction'];
  isRequired: boolean;
  metadataSchema: string;
}

interface ChangeSummary {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

const formatSummaryList = (
  summaries: CategoryFamilySummary[] | undefined,
  fallbackIds: string[],
  fallback: string,
) => {
  if (summaries && summaries.length > 0) {
    return summaries
      .map((summary) => summary.fullPath || summary.name || summary.id)
      .join(', ');
  }
  if (fallbackIds.length > 0) {
    return fallbackIds.join(', ');
  }
  return fallback;
};

const serializeMetadataSchema = (
  schema?: Record<string, unknown> | null,
): string => (schema ? JSON.stringify(schema, null, 2) : '');

const parseMetadataSchema = (
  value: string,
): { data: Record<string, unknown> | null } | { error: string } => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { data: null };
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { data: parsed as Record<string, unknown> };
    }
    return { error: 'Metadata must be a JSON object' };
  } catch {
    return { error: 'Metadata must be valid JSON' };
  }
};

const buildStatisticsData = (
  associationType: AssociationType,
  rules: AssociationRule[],
  history: HistoryEntry[],
  locale: string,
): StatisticsType => {
  const createdEvents = history.filter((entry) => entry.action === 'created');
  const updatedEvents = history.filter((entry) => entry.action === 'updated');
  const now = new Date();

  const withinCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const createdThisMonth =
    createdEvents.length > 0
      ? createdEvents.filter((entry) => withinCurrentMonth(entry.timestamp)).length
      : withinCurrentMonth(associationType.createdAt)
        ? 1
        : 0;

  const updatedThisMonth = updatedEvents.filter((entry) =>
    withinCurrentMonth(entry.timestamp),
  ).length;

  const totalRules = rules.length;
  const requiredRules = rules.filter((rule) => rule.minTargets > 0).length;
  const inactiveRules = Math.max(totalRules - requiredRules, 0);

  const usageCount = history.length || Math.max(totalRules, 1);
  const lastEvent = history[0]?.timestamp ?? associationType.updatedAt;

  const monthBuckets = new Map<string, { value: number; change: number }>();
  history.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const label = date.toLocaleString(locale, { month: 'short' });
    const bucket = monthBuckets.get(key) ?? { value: 0, change: 0 };
    bucket.value += 1;
    monthBuckets.set(key, { ...bucket, label });
  });

  const sortedBuckets = Array.from(monthBuckets.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(-6);

  const trends = sortedBuckets.map(([key, bucket], index, arr) => {
    const previous = arr[index - 1]?.[1]?.value ?? bucket.value;
    const change = previous === 0 ? bucket.value : bucket.value - previous;
    const [, monthNumber] = key.split('-');
    const labelDate = new Date();
    labelDate.setMonth(Number(monthNumber) - 1);
    const period = labelDate.toLocaleString(locale, { month: 'short' });
    return { period, value: bucket.value, change };
  });

  const actorCounts = history.reduce<Map<string, { name: string; count: number }>>(
    (acc, entry) => {
      const key = entry.actor?.userId ?? entry.actorEmail ?? entry.actorName ?? 'system';
      const current = acc.get(key) ?? {
        name: entry.actorName ?? entry.actorEmail ?? 'System',
        count: 0,
      };
      current.count += 1;
      acc.set(key, current);
      return acc;
    },
    new Map(),
  );

  const topUsers = Array.from(actorCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([userId, info]) => ({
      userId,
      userName: info.name,
      count: info.count,
    }));

  return {
    totalCount: Math.max(totalRules, 1),
    activeCount: requiredRules,
    inactiveCount: inactiveRules,
    createdThisMonth,
    updatedThisMonth,
    usageCount,
    lastUsed: lastEvent,
    trends,
    topUsers,
  };
};

const buildDocumentationSections = (
  associationType: AssociationType,
  rules: AssociationRule[],
): DocumentationSection[] => {
  const now = new Date().toISOString();
  const sourceType = associationType.sourceItemType;
  const targetType = associationType.targetItemType;

  const overviewContent = [
    `**${associationType.name ?? associationType.key}**`,
    associationType.description ?? '',
    '',
    `- Kardinalite: \`${associationType.cardinality}\``,
    `- Yön: \`${associationType.direction}\``,
    `- Zorunlu: ${associationType.isRequired ? 'Evet' : 'Hayır'}`,
    `- Kaynak Tipi: ${sourceType?.name ?? sourceType?.key ?? associationType.sourceItemTypeId ?? '—'}`,
    `- Hedef Tipi: ${targetType?.name ?? targetType?.key ?? associationType.targetItemTypeId ?? '—'}`,
  ]
    .filter(Boolean)
    .join('\n');

  const ruleContent = rules
    .map((rule, index) => {
      const scopeSourceCategories = formatSummaryList(rule.sourceCategories, rule.sourceCategoryIds, 'Tümü');
      const scopeTargetCategories = formatSummaryList(rule.targetCategories, rule.targetCategoryIds, 'Tümü');
      const scopeSourceFamilies = formatSummaryList(rule.sourceFamilies, rule.sourceFamilyIds, 'Tümü');
      const scopeTargetFamilies = formatSummaryList(rule.targetFamilies, rule.targetFamilyIds, 'Tümü');

      return [
        `### ${index + 1}. ${rule.name ?? `Rule ${index + 1}`}`,
        rule.description ?? '',
        `- Kapsam: ${rule.appliesTo === 'source' ? 'Kaynak' : 'Hedef'}`,
        `- Minimum / Maksimum: ${rule.minTargets} / ${rule.maxTargets ?? '∞'}`,
        `- Kaynak Kategoriler: ${scopeSourceCategories}`,
        `- Kaynak Aileler: ${scopeSourceFamilies}`,
        `- Hedef Kategoriler: ${scopeTargetCategories}`,
        `- Hedef Aileler: ${scopeTargetFamilies}`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  return [
    {
      id: 'overview',
      title: 'Genel Bakış',
      content: overviewContent,
      type: 'markdown',
      order: 1,
      lastUpdated: now,
      author: 'System',
    },
    {
      id: 'rules',
      title: 'Kural Kapsamları',
      content: ruleContent || 'Bu association tipi için henüz kural tanımlanmadı.',
      type: 'markdown',
      order: 2,
      lastUpdated: now,
      author: 'System',
    },
  ];
};

const buildApiEndpoints = (associationType: AssociationType): APIEndpoint[] => [
  {
    id: 'list-association-types',
    method: 'GET',
    path: '/api/association-types',
    description: 'Tüm association tiplerini listeler.',
    requiresAuth: true,
    permissions: [PERMISSIONS.SYSTEM.ASSOCIATIONS.LIST],
    responseExample: {
      items: [
        {
          id: associationType.id,
          key: associationType.key,
          sourceItemTypeId: associationType.sourceItemTypeId,
          targetItemTypeId: associationType.targetItemTypeId,
          cardinality: associationType.cardinality,
          direction: associationType.direction,
        },
      ],
    },
  },
  {
    id: 'get-association-type',
    method: 'GET',
    path: `/api/association-types/${associationType.id}`,
    description: 'Belirli bir association tipinin detaylarını döner.',
    requiresAuth: true,
    permissions: [PERMISSIONS.SYSTEM.ASSOCIATIONS.VIEW],
  },
  {
    id: 'create-association-type',
    method: 'POST',
    path: '/api/association-types',
    description: 'Yeni bir association tipi oluşturur.',
    requiresAuth: true,
    permissions: [PERMISSIONS.SYSTEM.ASSOCIATIONS.CREATE],
    requestBody: {
      key: 'order_fabric',
      nameLocalizationId: 'loc_abc',
      descriptionLocalizationId: 'loc_def',
      sourceItemTypeId: associationType.sourceItemTypeId,
      targetItemTypeId: associationType.targetItemTypeId,
      cardinality: associationType.cardinality,
      direction: associationType.direction,
      isRequired: associationType.isRequired,
    },
  },
  {
    id: 'update-association-type',
    method: 'PUT',
    path: `/api/association-types/${associationType.id}`,
    description: 'Mevcut association tipinin ayarlarını günceller.',
    requiresAuth: true,
    permissions: [PERMISSIONS.SYSTEM.ASSOCIATIONS.UPDATE],
    requestBody: {
      direction: associationType.direction,
      isRequired: associationType.isRequired,
      metadataSchema: associationType.metadataSchema,
    },
  },
  {
    id: 'get-column-config',
    method: 'GET',
    path: `/api/association-types/${associationType.id}/column-config?role=source`,
    description: 'Kaynak görünümü için sütun konfigürasyonunu döner.',
    requiresAuth: true,
    permissions: [PERMISSIONS.SYSTEM.ASSOCIATIONS.VIEW],
  },
  {
    id: 'update-column-config',
    method: 'PUT',
    path: `/api/association-types/${associationType.id}/column-config`,
    description: 'Kaynak veya hedef görünümün sütun konfigürasyonunu günceller.',
    requiresAuth: true,
    permissions: [PERMISSIONS.SYSTEM.ASSOCIATIONS.UPDATE],
    requestBody: {
      role: 'source',
      columns: [
        { key: 'meta.code', source: 'meta', visible: true, order: 0 },
        { key: 'meta.name', source: 'meta', visible: true, order: 1 },
      ],
    },
  },
];

const AssociationTypeOverviewTab: React.FC<OverviewTabProps> = ({
  associationType,
  rules,
  editMode,
  formState,
  onFormChange,
}) => {
  const { t } = useLanguage();
  const { formatDateTime } = useDateFormatter();
  const sourceType = associationType.sourceItemType;
  const targetType = associationType.targetItemType;
  const cardinalityOptions = useMemo(
    () => [
      { value: 'one-to-one', label: t('association_types.cardinality.one_to_one') || 'One-to-One' },
      { value: 'one-to-many', label: t('association_types.cardinality.one_to_many') || 'One-to-Many' },
      { value: 'many-to-one', label: t('association_types.cardinality.many_to_one') || 'Many-to-One' },
      { value: 'many-to-many', label: t('association_types.cardinality.many_to_many') || 'Many-to-Many' },
    ],
    [t],
  );
  const directionOptions = useMemo(
    () => [
      { value: 'directed', label: t('association_types.direction.directed') || 'Directed' },
      { value: 'undirected', label: t('association_types.direction.undirected') || 'Undirected' },
    ],
    [t],
  );
  const currentCardinality = formState?.cardinality ?? associationType.cardinality;
  const currentDirection = formState?.direction ?? associationType.direction;
  const currentIsRequired = formState?.isRequired ?? associationType.isRequired;
  const metadataValue = formState?.metadataSchema ?? serializeMetadataSchema(associationType.metadataSchema);

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.fields.source_item_type') || 'Source Item Type'}
            </span>
            <p className="mt-1 text-sm text-foreground">
              {sourceType?.name ?? sourceType?.key ?? associationType.sourceItemTypeId ?? '—'}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.fields.target_item_type') || 'Target Item Type'}
            </span>
            <p className="mt-1 text-sm text-foreground">
              {targetType?.name ?? targetType?.key ?? associationType.targetItemTypeId ?? '—'}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.fields.cardinality') || 'Cardinality'}
            </span>
            <div className="mt-1">
              {editMode ? (
                <Select
                  value={currentCardinality}
                  onChange={(event) =>
                    onFormChange('cardinality', event.target.value as AssociationType['cardinality'])
                  }
                  options={cardinalityOptions}
                  className="text-sm"
                />
              ) : (
                <Badge variant="outline">{associationType.cardinality}</Badge>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.fields.direction') || 'Direction'}
            </span>
            <div className="mt-1">
              {editMode ? (
                <Select
                  value={currentDirection}
                  onChange={(event) =>
                    onFormChange('direction', event.target.value as AssociationType['direction'])
                  }
                  options={directionOptions}
                  className="text-sm"
                />
              ) : (
                <Badge variant="outline">
                  {associationType.direction === 'directed'
                    ? t('association_types.direction.directed') || 'Directed'
                    : t('association_types.direction.undirected') || 'Undirected'}
                </Badge>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.fields.required') || 'Required'}
            </span>
            <div className="mt-1">
              {editMode ? (
                <Checkbox
                  checked={currentIsRequired}
                  onChange={(event) => onFormChange('isRequired', event.target.checked)}
                  label={currentIsRequired ? t('common.yes') || 'Yes' : t('common.no') || 'No'}
                />
              ) : (
                <Badge variant={associationType.isRequired ? 'destructive' : 'secondary'}>
                  {associationType.isRequired ? t('common.yes') || 'Yes' : t('common.no') || 'No'}
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.fields.created') || 'Created'}
            </span>
            <UserInfoWithRole user={associationType.createdBy} date={associationType.createdAt} />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.fields.updated') || 'Updated'}
            </span>
            <UserInfoWithRole user={associationType.updatedBy} date={associationType.updatedAt} />
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.rules.source_categories') || 'Source Categories'}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatSummaryList(
                associationType.sourceCategories,
                sourceType?.categoryIds ?? [],
                t('common.all') || 'All',
              )}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.rules.target_categories') || 'Target Categories'}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatSummaryList(
                associationType.targetCategories,
                targetType?.categoryIds ?? [],
                t('common.all') || 'All',
              )}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.rules.source_families') || 'Source Families'}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatSummaryList(
                associationType.sourceFamilies,
                sourceType?.linkedFamilyIds ?? [],
                t('common.all') || 'All',
              )}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('association_types.rules.target_families') || 'Target Families'}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatSummaryList(
                associationType.targetFamilies,
                targetType?.linkedFamilyIds ?? [],
                t('common.all') || 'All',
              )}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <span className="text-xs font-medium text-muted-foreground">
            {t('association_types.metadata_title') || 'Metadata Schema'}
          </span>
          <div className="mt-1">
            {editMode ? (
              <Textarea
                rows={6}
                value={metadataValue}
                onChange={(event) => onFormChange('metadataSchema', event.target.value)}
                placeholder={t('association_types.metadata_placeholder') || 'Enter JSON metadata'}
              />
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap rounded-md border border-border bg-muted px-3 py-2">
                {metadataValue.trim() ? metadataValue : t('common.none') || 'None'}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t('common.description') || 'Description'}
          </span>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {associationType.description?.trim() || (t('common.none') || 'None')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('common.updated_at') || 'Updated'}:{' '}
            {formatDateTime(new Date(associationType.updatedAt))}
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={t('association_types.rules.title') || 'Rules'}
          subtitle={t('association_types.rules.subtitle') || 'Scope and constraints'}
          action={
            <Badge variant="outline" size="sm">
              {rules.length}
            </Badge>
          }
        />
        <div className="px-6 pb-6 space-y-4">
          {rules.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              {t('association_types.rules.empty') || 'No rules defined.'}
            </div>
          ) : (
            rules.map((rule, index) => (
              <div key={rule.id} className="rounded-lg border border-border px-4 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {rule.name ?? `${t('association_types.rules.title') || 'Rule'} #${index + 1}`}
                    </p>
                    {rule.description ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                    ) : null}
                  </div>
                  <Badge variant="secondary" size="sm">
                    {rule.appliesTo === 'source'
                      ? t('association_types.rules.applies_to_source') || 'Source Scope'
                      : t('association_types.rules.applies_to_target') || 'Target Scope'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      {t('association_types.rules.min_targets') || 'Min Targets'}:
                    </span>{' '}
                    {rule.minTargets}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {t('association_types.rules.max_targets') || 'Max Targets'}:
                    </span>{' '}
                    {rule.maxTargets ?? '∞'}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {t('association_types.rules.source_categories') || 'Source Categories'}:
                    </span>{' '}
                    {formatSummaryList(rule.sourceCategories, rule.sourceCategoryIds, t('common.all') || 'All')}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {t('association_types.rules.source_families') || 'Source Families'}:
                    </span>{' '}
                    {formatSummaryList(rule.sourceFamilies, rule.sourceFamilyIds, t('common.all') || 'All')}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {t('association_types.rules.target_categories') || 'Target Categories'}:
                    </span>{' '}
                    {formatSummaryList(rule.targetCategories, rule.targetCategoryIds, t('common.all') || 'All')}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {t('association_types.rules.target_families') || 'Target Families'}:
                    </span>{' '}
                    {formatSummaryList(rule.targetFamilies, rule.targetFamilyIds, t('common.all') || 'All')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

const AssociationTypeColumnSettingsTab: React.FC<ColumnSettingsTabProps> = ({
  associationType,
  rules,
  categoryMap,
  familyMap,
  attributeGroups,
  editMode,
  activeRole,
  onRoleChange,
  columns,
  onColumnsChange,
  loading,
}) => {
  const { t } = useLanguage();
  const [selectedColumnKey, setSelectedColumnKey] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const metaColumns = useMemo<AvailableColumn[]>(
    () => [
      { key: 'meta.itemType', label: t('association_types.column_labels.item_type') || 'Item Type', source: 'meta' },
      { key: 'meta.code', label: t('association_types.column_labels.code') || 'Item Code', source: 'meta' },
      { key: 'meta.name', label: t('association_types.column_labels.name') || 'Item Name', source: 'meta' },
      { key: 'meta.category', label: t('association_types.column_labels.category') || 'Category', source: 'meta' },
      { key: 'meta.family', label: t('association_types.column_labels.family') || 'Family', source: 'meta' },
      { key: 'relationship.orderIndex', label: t('association_types.column_labels.order') || 'Relation Order', source: 'relationship' },
      { key: 'meta.createdBy', label: t('association_types.column_labels.created_by') || 'Created By', source: 'meta' },
      { key: 'meta.updatedBy', label: t('association_types.column_labels.updated_by') || 'Updated By', source: 'meta' },
      { key: 'meta.createdAt', label: t('association_types.column_labels.created_at') || 'Created At', source: 'meta' },
      { key: 'meta.updatedAt', label: t('association_types.column_labels.updated_at') || 'Updated At', source: 'meta' },
    ],
    [t],
  );

  const collectAttributeColumns = useCallback(
    (role: 'source' | 'target'): AvailableColumn[] => {
      const groupIds = new Set<string>();
      const roleItemType = role === 'source' ? associationType.sourceItemType : associationType.targetItemType;
      if (roleItemType) {
        roleItemType.attributeGroupIds?.forEach((id) => groupIds.add(id));
        roleItemType.attributeGroupBindings?.forEach((b) => groupIds.add(b.attributeGroupId));
      }
      const appendFromCategories = (ids: string[]) => {
        ids.forEach((id) => {
          const cat = categoryMap.get(id);
          cat?.attributeGroupIds?.forEach((gid) => groupIds.add(gid));
          cat?.attributeGroupBindings?.forEach((b) => groupIds.add(b.attributeGroupId));
        });
      };
      const appendFromFamilies = (ids: string[]) => {
        ids.forEach((id) => {
          const fam = familyMap.get(id);
          fam?.attributeGroupIds?.forEach((gid) => groupIds.add(gid));
          fam?.attributeGroupBindings?.forEach((b) => groupIds.add(b.attributeGroupId));
        });
      };
      if (roleItemType?.categoryIds?.length) appendFromCategories(roleItemType.categoryIds);
      if (roleItemType?.linkedFamilyIds?.length) appendFromFamilies(roleItemType.linkedFamilyIds);
      rules.forEach((rule) => {
        appendFromCategories(role === 'source' ? rule.sourceCategoryIds : rule.targetCategoryIds);
        appendFromFamilies(role === 'source' ? rule.sourceFamilyIds : rule.targetFamilyIds);
      });
      const available: AvailableColumn[] = [];
      Array.from(groupIds).forEach((groupId) => {
        const group = attributeGroups.get(groupId);
        if (!group) return;
        (group.attributes ?? []).forEach((attr) => {
          available.push({
            key: `attribute.${attr.id}`,
            label: attr.name || attr.key || attr.id,
            helper: group.name,
            source: 'attribute',
            options: { attributeId: attr.id, attributeKey: attr.key, attributeName: attr.name, groupId },
          });
        });
      });
      return available.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    },
    [associationType.sourceItemType, associationType.targetItemType, attributeGroups, categoryMap, familyMap, rules],
  );

  const attributeColumns = useMemo(() => collectAttributeColumns(activeRole), [activeRole, collectAttributeColumns]);
  const availableColumns = useMemo<AvailableColumn[]>(() => [...metaColumns, ...attributeColumns], [attributeColumns, metaColumns]);

  const availableColumnMap = useMemo(() => {
    const map = new Map<string, AvailableColumn>();
    availableColumns.forEach((col) => map.set(col.key, col));
    return map;
  }, [availableColumns]);

  const unusedColumns = useMemo(() => {
    const existing = new Set(columns.map((c) => c.key));
    return availableColumns.filter((c) => !existing.has(c.key));
  }, [availableColumns, columns]);

  const assignOrder = useCallback(
    (list: AssociationColumnDefinition[]) => list.map((col, i) => ({ ...col, order: i })),
    [],
  );

  const resolveColumnLabel = useCallback(
    (column: AssociationColumnDefinition) => {
      const meta = availableColumnMap.get(column.key);
      return meta ? (meta.helper ? `${meta.label} · ${meta.helper}` : meta.label) : column.key;
    },
    [availableColumnMap],
  );

  const resolveSourceLabel = useCallback(
    (source: AssociationColumnDefinition['source']) => {
      switch (source) {
        case 'attribute': return t('association_types.column_source.attribute') || 'Attribute';
        case 'meta': return t('association_types.column_source.meta') || 'Meta';
        case 'relationship': return t('association_types.column_source.relationship') || 'Relationship';
        case 'computed': return t('association_types.column_source.computed') || 'Computed';
        default: return source;
      }
    },
    [t],
  );

  const handleToggleVisible = (index: number, value: boolean) => {
    const next = columns.slice();
    next[index] = { ...next[index], visible: value };
    onColumnsChange(next);
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const next = columns.slice();
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    onColumnsChange(assignOrder(next));
  };

  const handleRemoveColumn = (index: number) => {
    onColumnsChange(assignOrder(columns.filter((_, i) => i !== index)));
  };

  const handleAddColumn = () => {
    if (!selectedColumnKey) return;
    const option = availableColumnMap.get(selectedColumnKey);
    if (!option) return;
    onColumnsChange(assignOrder([
      ...columns,
      { key: option.key, source: option.source, visible: true, order: columns.length, options: option.options },
    ]));
    setSelectedColumnKey('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => c.key === active.id);
    const newIndex = columns.findIndex((c) => c.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onColumnsChange(assignOrder(arrayMove(columns, oldIndex, newIndex)));
  };

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('association_types.column_settings.title') || 'Column Settings'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('association_types.column_settings.subtitle') ||
                'Manage which columns appear for source and target association tables.'}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-border bg-muted p-1">
            {(['source', 'target'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => onRoleChange(role)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  activeRole === role
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {role === 'source'
                  ? t('association_types.column_settings.role_source') || 'Source'
                  : t('association_types.column_settings.role_target') || 'Target'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 max-w-xs">
            <Select
              value={selectedColumnKey}
              onChange={(event) => setSelectedColumnKey(event.target.value)}
              placeholder={
                unusedColumns.length === 0
                  ? t('association_types.column_settings.empty') || 'No columns available.'
                  : t('association_types.column_settings.add') || 'Add column'
              }
              options={unusedColumns.map((col) => ({
                value: col.key,
                label: col.helper ? `${col.label} · ${col.helper}` : col.label,
              }))}
              disabled={unusedColumns.length === 0 || !editMode}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddColumn}
            disabled={!editMode || !selectedColumnKey}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            {t('association_types.column_settings.add') || 'Add Column'}
          </Button>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">
            {t('common.loading') || 'Loading...'}
          </div>
        ) : columns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            {t('association_types.column_settings.empty') || 'No columns configured.'}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={columns.map((c) => c.key)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {columns.map((column, index) => {
                  const label = resolveColumnLabel(column);
                  const sourceLabel = resolveSourceLabel(column.source);
                  const helper = availableColumnMap.get(column.key)?.helper;
                  return (
                    <SortableAssocColumnItem
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

export const AssociationTypeDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [associationType, setAssociationType] = useState<AssociationType | null>(null);
  const [rules, setRules] = useState<AssociationRule[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, Category>>(new Map());
  const [familyMap, setFamilyMap] = useState<Map<string, Family>>(new Map());
  const [attributeGroupMap, setAttributeGroupMap] = useState<Map<string, AttributeGroup>>(new Map());
  const [statisticsData, setStatisticsData] = useState<StatisticsType | null>(null);
  const [documentationSections, setDocumentationSections] = useState<DocumentationSection[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<AssociationTypeEditFormState | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<ChangeSummary[]>([]);
  const [savingChanges, setSavingChanges] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Column settings page-level state
  const [activeColumnRole, setActiveColumnRole] = useState<'source' | 'target'>('source');
  const [sourceColumns, setSourceColumns] = useState<AssociationColumnDefinition[]>([]);
  const [targetColumns, setTargetColumns] = useState<AssociationColumnDefinition[]>([]);
  const [initialSourceColumns, setInitialSourceColumns] = useState<AssociationColumnDefinition[]>([]);
  const [initialTargetColumns, setInitialTargetColumns] = useState<AssociationColumnDefinition[]>([]);
  const [columnsLoading, setColumnsLoading] = useState<boolean>(false);

  const canUpdate = hasPermission(PERMISSIONS.SYSTEM.ASSOCIATIONS.UPDATE);
  const canViewHistory = hasPermission(PERMISSIONS.SYSTEM.ASSOCIATIONS.HISTORY);
  const canDelete = hasPermission(PERMISSIONS.SYSTEM.ASSOCIATIONS.DELETE);

  const fetchDetails = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [
        associationTypeResponse,
        rulesResponse,
        categoriesResponse,
        familiesResponse,
        attributeGroupsResponse,
      ] = await Promise.all([
        associationTypesService.getById(id),
        associationRulesService.list({ associationTypeId: id }),
        categoriesService.list({ limit: 200 }),
        familiesService.list({ limit: 200 }),
        attributeGroupsService.list({ includeAttributes: true }),
      ]);
      const categoryEntityMap = new Map(
        (categoriesResponse.items ?? []).map((category) => [category.id, category]),
      );
      const familyEntityMap = new Map(
        (familiesResponse.items ?? []).map((family) => [family.id, family]),
      );
      const attributeGroupEntityMap = new Map(
        (attributeGroupsResponse ?? []).map((group) => [group.id, group]),
      );

      setAssociationType(associationTypeResponse);
      setRules(rulesResponse.items ?? []);
      setCategoryMap(categoryEntityMap);
      setFamilyMap(familyEntityMap);
      setAttributeGroupMap(attributeGroupEntityMap);

      const historyResponse = await historyService.getHistory({
        entityType: 'AssociationType',
        entityId: associationTypeResponse.id,
        page: 1,
        pageSize: 200,
      });
      const historyItems = historyResponse.items;

      setStatisticsData(
        buildStatisticsData(associationTypeResponse, rulesResponse.items ?? [], historyItems, language),
      );
      setDocumentationSections(
        buildDocumentationSections(associationTypeResponse, rulesResponse.items ?? []),
      );
      setApiEndpoints(buildApiEndpoints(associationTypeResponse));
    } catch (err: any) {
      console.error('Failed to load association type details', err);
      setError(
        err?.response?.data?.error?.message ||
          t('association_types.details.failed_to_load') ||
          'Unable to load association type details.',
      );
    } finally {
      setLoading(false);
    }
  }, [id, language, t]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  // Load column configs when association type is available
  useEffect(() => {
    if (!associationType) return;
    let cancelled = false;
    const loadColumnConfigs = async () => {
      setColumnsLoading(true);
      try {
        const [sourceConfig, targetConfig] = await Promise.all([
          associationColumnConfigService.getConfig(associationType.id, 'source'),
          associationColumnConfigService.getConfig(associationType.id, 'target'),
        ]);
        if (cancelled) return;
        const src = sourceConfig.columns ?? [];
        const tgt = targetConfig.columns ?? [];
        setSourceColumns(src);
        setTargetColumns(tgt);
        setInitialSourceColumns(src);
        setInitialTargetColumns(tgt);
      } catch (err) {
        console.error('Failed to load column configs', err);
      } finally {
        if (!cancelled) setColumnsLoading(false);
      }
    };
    void loadColumnConfigs();
    return () => { cancelled = true; };
  }, [associationType]);

  const getPendingChanges = useCallback(
    (form: AssociationTypeEditFormState | null): ChangeSummary[] => {
      if (!associationType || !form) {
        return [];
      }
      const changes: ChangeSummary[] = [];
      if (associationType.cardinality !== form.cardinality) {
        changes.push({
          field: t('association_types.fields.cardinality') || 'Cardinality',
          oldValue: associationType.cardinality,
          newValue: form.cardinality,
        });
      }
      if (associationType.direction !== form.direction) {
        changes.push({
          field: t('association_types.fields.direction') || 'Direction',
          oldValue: associationType.direction,
          newValue: form.direction,
        });
      }
      if (associationType.isRequired !== form.isRequired) {
        changes.push({
          field: t('association_types.fields.required') || 'Required',
          oldValue: associationType.isRequired,
          newValue: form.isRequired,
        });
      }
      const currentMetadata = serializeMetadataSchema(associationType.metadataSchema).trim();
      if (currentMetadata !== form.metadataSchema.trim()) {
        changes.push({
          field: t('association_types.metadata_title') || 'Metadata Schema',
          oldValue: currentMetadata || '—',
          newValue: form.metadataSchema.trim() || '—',
        });
      }
      return changes;
    },
    [associationType, t],
  );

  const columnsEqual = useCallback(
    (a: AssociationColumnDefinition[], b: AssociationColumnDefinition[]) => {
      if (a.length !== b.length) return false;
      return a.every((col, i) =>
        col.key === b[i].key &&
        col.source === b[i].source &&
        col.visible === b[i].visible &&
        col.order === b[i].order,
      );
    },
    [],
  );

  const hasSourceColumnChanges = useMemo(
    () => !columnsEqual(sourceColumns, initialSourceColumns),
    [sourceColumns, initialSourceColumns, columnsEqual],
  );

  const hasTargetColumnChanges = useMemo(
    () => !columnsEqual(targetColumns, initialTargetColumns),
    [targetColumns, initialTargetColumns, columnsEqual],
  );

  const pendingFormChanges = useMemo(
    () => {
      const changes = getPendingChanges(editForm);
      if (hasSourceColumnChanges) {
        changes.push({
          field: t('association_types.column_settings.role_source') || 'Source Columns',
          oldValue: `${initialSourceColumns.length} columns`,
          newValue: `${sourceColumns.length} columns`,
        });
      }
      if (hasTargetColumnChanges) {
        changes.push({
          field: t('association_types.column_settings.role_target') || 'Target Columns',
          oldValue: `${initialTargetColumns.length} columns`,
          newValue: `${targetColumns.length} columns`,
        });
      }
      return changes;
    },
    [editForm, getPendingChanges, hasSourceColumnChanges, hasTargetColumnChanges, initialSourceColumns.length, initialTargetColumns.length, sourceColumns.length, targetColumns.length, t],
  );

  const handleEnterEdit = useCallback(() => {
    if (!associationType) {
      return;
    }
    setEditForm({
      cardinality: associationType.cardinality,
      direction: associationType.direction,
      isRequired: associationType.isRequired,
      metadataSchema: serializeMetadataSchema(associationType.metadataSchema),
    });
    // Snapshot current column state
    setInitialSourceColumns([...sourceColumns]);
    setInitialTargetColumns([...targetColumns]);
    setIsEditing(true);
    setPendingChanges([]);
  }, [associationType, sourceColumns, targetColumns]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditForm(null);
    setPendingChanges([]);
    setCommentDialogOpen(false);
    // Restore column state
    setSourceColumns([...initialSourceColumns]);
    setTargetColumns([...initialTargetColumns]);
  }, [initialSourceColumns, initialTargetColumns]);

  const handleFormFieldChange = useCallback(
    <K extends keyof AssociationTypeEditFormState>(
      field: K,
      value: AssociationTypeEditFormState[K],
    ) => {
      setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    [],
  );

  const handleSaveRequest = useCallback(() => {
    if (!associationType || !editForm) {
      return;
    }
    const changes = pendingFormChanges;
    if (changes.length === 0) {
      showToast(t('association_types.details.no_changes') || 'No changes to save.', 'info');
      setIsEditing(false);
      setEditForm(null);
      return;
    }
    setPendingChanges(changes);
    setCommentDialogOpen(true);
  }, [associationType, editForm, pendingFormChanges, showToast, t]);

  const handleCommentDialogClose = useCallback(() => {
    setCommentDialogOpen(false);
  }, []);

  const handleConfirmSave = useCallback(
    async (comment: string) => {
      if (!associationType || !editForm) {
        return;
      }
      const parsed = parseMetadataSchema(editForm.metadataSchema);
      if ('error' in parsed) {
        showToast(parsed.error, 'error');
        return;
      }
      setSavingChanges(true);
      try {
        // Save form changes
        const formChanges = getPendingChanges(editForm);
        if (formChanges.length > 0) {
          await associationTypesService.update(associationType.id, {
            cardinality: editForm.cardinality,
            direction: editForm.direction,
            isRequired: editForm.isRequired,
            metadataSchema: parsed.data,
            comment,
          });
        }

        // Save column config changes
        const columnSavePromises: Promise<AssociationColumnConfig>[] = [];
        if (hasSourceColumnChanges) {
          columnSavePromises.push(
            associationColumnConfigService.updateConfig(associationType.id, {
              role: 'source',
              columns: sourceColumns,
              comment,
            }),
          );
        }
        if (hasTargetColumnChanges) {
          columnSavePromises.push(
            associationColumnConfigService.updateConfig(associationType.id, {
              role: 'target',
              columns: targetColumns,
              comment,
            }),
          );
        }
        if (columnSavePromises.length > 0) {
          await Promise.all(columnSavePromises);
        }

        showToast(
          t('association_types.details.update_success') || 'Association type updated successfully.',
          'success',
        );
        setCommentDialogOpen(false);
        setPendingChanges([]);
        setIsEditing(false);
        setEditForm(null);
        // Update initial columns to reflect saved state
        setInitialSourceColumns([...sourceColumns]);
        setInitialTargetColumns([...targetColumns]);
        await fetchDetails();
      } catch (err: any) {
        console.error('Failed to update association type', err);
        showToast(
          err?.response?.data?.error?.message ||
            t('association_types.details.update_failed') ||
            'Failed to update association type.',
          'error',
        );
      } finally {
        setSavingChanges(false);
      }
    },
    [associationType, editForm, fetchDetails, getPendingChanges, hasSourceColumnChanges, hasTargetColumnChanges, showToast, sourceColumns, t, targetColumns],
  );

  const handleDelete = useCallback(async () => {
    if (!associationType) {
      return;
    }
    setDeleting(true);
    try {
      await associationTypesService.delete(associationType.id);
      showToast(
        t('association_types.details.delete_success') || 'Association type deleted.',
        'success',
      );
      navigate('/association-types');
    } catch (err: any) {
      console.error('Failed to delete association type', err);
      showToast(
        err?.response?.data?.error?.message ||
          t('association_types.details.delete_failed') ||
          'Failed to delete association type.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  }, [associationType, navigate, showToast, t]);

  // Handler for role change from tab
  const handleColumnRoleChange = useCallback((role: 'source' | 'target') => {
    setActiveColumnRole(role);
  }, []);

  // Handler for column changes from tab
  const handleColumnsChange = useCallback((cols: AssociationColumnDefinition[]) => {
    if (activeColumnRole === 'source') {
      setSourceColumns(cols);
    } else {
      setTargetColumns(cols);
    }
  }, [activeColumnRole]);

  // Get active columns for current role
  const activeColumns = activeColumnRole === 'source' ? sourceColumns : targetColumns;

  if (!id) {
    return (
      <div className="px-6 py-12">
        <Card padding="lg">
          <div className="text-sm text-muted-foreground">
            {t('association_types.details.invalid_id') ||
              'You must select a valid association type.'}
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-6 py-12">
        <Card padding="lg">
          <div className="text-sm text-muted-foreground">
            {t('common.loading') || 'Loading...'}
          </div>
        </Card>
      </div>
    );
  }

  if (error || !associationType) {
    return (
      <div className="px-6 py-12">
        <Card padding="lg">
          <div className="text-sm text-error">
            {error ||
              t('association_types.details.failed_to_load') ||
              'Association type details could not be loaded.'}
          </div>
        </Card>
      </div>
    );
  }

  const hasFormChanges = isEditing && pendingFormChanges.length > 0;

  const tabs: TabConfig[] = [
    {
      id: 'details',
      label: t('association_types.tabs.details') || 'Details',
      icon: FileText,
      component: AssociationTypeOverviewTab,
      props: {
        associationType,
        rules,
        editMode: isEditing,
        formState: editForm,
        onFormChange: handleFormFieldChange,
      },
    },
    {
      id: 'columns',
      label: t('association_types.tabs.columns') || 'Column Settings',
      icon: Database,
      component: AssociationTypeColumnSettingsTab,
      props: {
        associationType,
        rules,
        categoryMap,
        familyMap,
        attributeGroups: attributeGroupMap,
        editMode: isEditing,
        activeRole: activeColumnRole,
        onRoleChange: handleColumnRoleChange,
        columns: activeColumns,
        onColumnsChange: handleColumnsChange,
        loading: columnsLoading,
      },
      hidden: !canUpdate,
    },
    {
      id: 'statistics',
      label: t('association_types.tabs.statistics') || 'Statistics',
      icon: BarChart3,
      component: Statistics,
      props: {
        entityType: 'AssociationType',
        entityId: associationType.id,
        statistics: statisticsData ?? undefined,
      },
    },
    {
      id: 'documentation',
      label: t('association_types.tabs.documentation') || 'Documentation',
      icon: BookOpen,
      component: Documentation,
      props: {
        entityType: 'AssociationType',
        entityId: associationType.id,
        sections: documentationSections,
        editMode: false,
      },
    },
    {
      id: 'api',
      label: t('association_types.tabs.api') || 'API',
      icon: Globe,
      component: APITester,
      props: {
        entityType: 'AssociationType',
        entityId: associationType.id,
        endpoints: apiEndpoints,
        editMode: false,
      },
    },
    {
      id: 'history',
      label: t('association_types.tabs.history') || 'History',
      icon: HistoryIcon,
      component: HistoryTable,
      props: { entityType: 'AssociationType', entityId: associationType.id },
      hidden: !canViewHistory,
    },
  ];

  return (
    <>
      <DetailsLayout
      title={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold text-foreground">
              {associationType.name ?? associationType.key}
            </span>
            <Badge variant="secondary">
              {rules.length} {t('association_types.rules.title') || 'Rules'}
            </Badge>
          </div>
          {associationType.description ? (
            <p className="text-sm text-muted-foreground">{associationType.description}</p>
          ) : null}
        </div>
      }
      subtitle={t('association_types.details.subtitle') || 'Association type summary'}
      icon={<Zap className="h-6 w-6 text-white" />}
      tabs={tabs}
      backUrl="/association-types"
      editMode={isEditing}
      hasChanges={hasFormChanges}
      onEdit={canUpdate ? handleEnterEdit : undefined}
      onSave={canUpdate ? handleSaveRequest : undefined}
      onCancel={isEditing ? handleCancelEdit : undefined}
      inlineActions={false}
      onDelete={canDelete ? handleDelete : undefined}
      deleteButtonLabel={t('common.delete') || 'Delete'}
      deleteDialogTitle={t('association_types.details.delete_title') || 'Delete association type?'}
      deleteDialogDescription={
        t('association_types.details.delete_description') ||
        'This action cannot be undone. The association type will be permanently removed.'
      }
      deleteConfirmLabel={t('common.delete') || 'Delete'}
      deleteCancelLabel={t('common.cancel') || 'Cancel'}
      deleteLoading={deleting}
      canDelete={canDelete}
    />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={savingChanges}
        entityName={associationType.name ?? associationType.key}
        title={t('association_types.details.review_changes') || 'Review Changes'}
      />
    </>
  );
};

export default AssociationTypeDetails;
