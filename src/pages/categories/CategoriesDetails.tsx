import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  BookOpen,
  Clock,
  FileText,
  Globe,
  Hash,
  History as HistoryIcon,
  FolderTree,
  Tags as TagsIcon,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useEditActionContext } from '../../contexts/EditActionContext';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { AttributeGroupSelector } from '../../components/ui/AttributeGroupSelector';
import { TreeSelect } from '../../components/ui/TreeSelect';
import { HierarchyTreeView } from '../../components/ui/HierarchyTreeView';
import { HistoryTable } from '../../components/common/HistoryTable';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { categoriesService } from '../../api/services/categories.service';
import { familiesService } from '../../api/services/families.service';
import { itemTypesService } from '../../api/services/item-types.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { Category, Family, ItemType, AttributeGroup } from '../../types';
import type {
  APIEndpoint,
  DocumentationSection,
  Statistics as StatisticsType,
  TabConfig,
} from '../../types/common';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import type { LocalizationRecord } from '../../api/types/api.types';
import { PERMISSIONS } from '../../config/permissions';
import { buildHierarchyTree } from '../../utils/hierarchy';
import type { TreeNode } from '../../components/ui';

type LocalizationState = Record<string, string>;
type RequiredLanguage = ReturnType<typeof useRequiredLanguages>[number];

interface CategoryDetailsTabProps {
  category: Category;
  editMode: boolean;
  requiredLanguages: RequiredLanguage[];
  nameDraft: LocalizationState;
  descriptionDraft: LocalizationState;
  onNameChange: (code: string, value: string) => void;
  onDescriptionChange: (code: string, value: string) => void;
  categoryTree: TreeNode[];
  categoryHighlightIds: string[];
  parentCategoryId: string | null;
  onParentChange: (id: string | null) => void;
  defaultItemTypeId: string | null;
  onDefaultItemTypeChange: (id: string | null) => void;
  itemTypes: ItemType[];
  linkedItemTypeIds: string[];
  onLinkedItemTypesChange: (ids: string[]) => void;
  itemTypeDisplayMap: Map<string, string>;
  familyTree: TreeNode[];
  linkedFamilyIds: string[];
  onLinkedFamiliesChange: (ids: string[]) => void;
  familyDisplayMap: Map<string, string>;
  categoryMap: Map<string, Category>;
  localizationsLoading?: boolean;
  localizationsError?: string | null;
}

interface CategoryAttributeGroupsTabProps {
  category: Category;
  editMode: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  attributeGroups: AttributeGroup[];
  loading: boolean;
  error: string | null;
}

const resolveNameLabel = (
  code: string,
  label: string,
  t: ReturnType<typeof useLanguage>['t'],
): string => {
  if (code === 'tr') {
    return t('categories.fields.name_tr') || `Name (${label})`;
  }
  if (code === 'en') {
    return t('categories.fields.name_en') || `Name (${label})`;
  }
  const fallback =
    t('categories.fields.name') !== 'categories.fields.name'
      ? t('categories.fields.name')
      : t('categories.fields.name_en') !== 'categories.fields.name_en'
        ? t('categories.fields.name_en')
        : 'Name';
  return `${fallback} (${label})`;
};

const resolveDescriptionLabel = (
  code: string,
  label: string,
  t: ReturnType<typeof useLanguage>['t'],
): string => {
  if (code === 'tr') {
    return t('categories.fields.description_tr') || `Description (${label})`;
  }
  if (code === 'en') {
    return t('categories.fields.description_en') || `Description (${label})`;
  }
  const fallback =
    t('categories.fields.description') !== 'categories.fields.description'
      ? t('categories.fields.description')
      : t('categories.fields.description_en') !== 'categories.fields.description_en'
        ? t('categories.fields.description_en')
        : 'Description';
  return `${fallback} (${label})`;
};

const CategoryDetailsTab: React.FC<CategoryDetailsTabProps> = ({
  category,
  editMode,
  requiredLanguages,
  nameDraft,
  descriptionDraft,
  onNameChange,
  onDescriptionChange,
  categoryTree,
  categoryHighlightIds,
  parentCategoryId,
  onParentChange,
  defaultItemTypeId,
  onDefaultItemTypeChange,
  itemTypes,
  linkedItemTypeIds,
  onLinkedItemTypesChange,
  itemTypeDisplayMap,
  familyTree,
  linkedFamilyIds,
  onLinkedFamiliesChange,
  familyDisplayMap,
  categoryMap,
  localizationsLoading,
  localizationsError,
}) => {
  const { t } = useLanguage();

  const linkedItemTypeSet = useMemo(() => new Set(linkedItemTypeIds), [linkedItemTypeIds]);
  const linkedFamilySet = useMemo(() => new Set(linkedFamilyIds), [linkedFamilyIds]);

  const toggleItemType = useCallback(
    (itemTypeId: string) => {
      const next = new Set(linkedItemTypeSet);
      if (next.has(itemTypeId)) {
        next.delete(itemTypeId);
      } else {
        next.add(itemTypeId);
      }
      onLinkedItemTypesChange(Array.from(next));
    },
    [linkedItemTypeSet, onLinkedItemTypesChange],
  );

  const defaultItemTypeLabel = defaultItemTypeId
    ? itemTypeDisplayMap.get(defaultItemTypeId) ?? defaultItemTypeId
    : null;

  const linkedItemTypeBadges = linkedItemTypeIds.map(
    (id) => itemTypeDisplayMap.get(id) ?? id,
  );

  const linkedFamilyBadges = linkedFamilyIds.map(
    (id) => familyDisplayMap.get(id) ?? id,
  );

  return (
    <div className="space-y-6">
      {localizationsError ? (
        <div className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-4 py-3">
          {localizationsError}
        </div>
      ) : null}

      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('categories.fields.key') || 'Key'}
            </span>
            <p className="mt-1 font-mono text-sm text-foreground">{category.key}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t('categories.fields.system_flag') || 'System Type'}
            </span>
            <Badge variant={category.isSystemCategory ? 'error' : 'secondary'}>
              {category.isSystemCategory
                ? t('categories.labels.system') || 'System'
                : t('categories.labels.standard') || 'Standard'}
            </Badge>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        {localizationsLoading ? (
          <div className="mb-4 text-xs text-muted-foreground">
            {t('categories.loading_localizations') || 'Çeviri kayıtları yükleniyor...'}
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredLanguages.map(({ code, label }) => (
            <div key={`category-name-${code}`}>
              <label className="block text-xs font-medium text-foreground mb-1">
                {resolveNameLabel(code, label, t)}
              </label>
              {editMode ? (
                <Input
                  value={nameDraft[code] ?? ''}
                  onChange={(event) => onNameChange(code, event.target.value)}
                  required
                />
              ) : (
                <p className="text-sm text-foreground">{nameDraft[code]?.trim() || '—'}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredLanguages.map(({ code, label }) => (
            <div key={`category-description-${code}`}>
              <label className="block text-xs font-medium text-foreground mb-1">
                {resolveDescriptionLabel(code, label, t)}
              </label>
              {editMode ? (
                <Textarea
                  value={descriptionDraft[code] ?? ''}
                  onChange={(event) => onDescriptionChange(code, event.target.value)}
                  rows={3}
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {descriptionDraft[code]?.trim() || '—'}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('categories.relationships.title') || 'Relationships'}
            </span>
            <div className="mt-3 space-y-4">
              {editMode ? (
                <>
                  <TreeSelect
                    label={t('categories.fields.parent') || 'Parent Category'}
                    placeholder={t('categories.root_label') || 'Parent yok (kök kategori)'}
                    options={categoryTree}
                    value={parentCategoryId}
                    onChange={onParentChange}
                    emptyState={
                      <span className="text-xs text-muted-foreground">
                        {t('categories.relationships.no_parent') || 'Parent kategori bulunamadı.'}
                      </span>
                    }
                  />

                  <Select
                    label={t('categories.fields.default_item_type') || 'Varsayılan Item Type'}
                    value={defaultItemTypeId ?? ''}
                    onChange={(event) =>
                      onDefaultItemTypeChange(event.target.value ? event.target.value : null)
                    }
                    placeholder={t('categories.select_default_item_type') || 'Seçilmedi'}
                    options={itemTypes.map((itemType) => ({
                      value: itemType.id,
                      label: itemType.name,
                    }))}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-foreground">
                        {t('categories.fields.linked_item_types') || 'Bağlı Item Types'}
                      </h4>
                      <Badge variant="primary" size="sm">
                        {linkedItemTypeIds.length}
                      </Badge>
                    </div>
                    <div className="border border-border rounded-lg p-3 max-h-56 overflow-y-auto space-y-2 text-sm">
                      {itemTypes.length === 0 ? (
                        <div className="text-muted-foreground">
                          {t('categories.create.no_item_types') ||
                            'Tanımlı item type bulunamadı.'}
                        </div>
                      ) : (
                        itemTypes.map((itemType) => (
                          <label key={itemType.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={linkedItemTypeSet.has(itemType.id)}
                              onChange={() => toggleItemType(itemType.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm">
                              {itemType.name || itemType.key || itemType.id}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <TreeSelect
                    label={t('categories.fields.linked_families') || 'Bağlı Families'}
                    multiple
                    selectedIds={linkedFamilyIds}
                    onSelectionChange={onLinkedFamiliesChange}
                    options={familyTree}
                    emptyState={
                      <span className="text-xs text-muted-foreground">
                        {t('categories.create.no_families') || 'Tanımlı family bulunamadı.'}
                      </span>
                    }
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <HierarchyTreeView
                    nodes={categoryTree}
                    activeId={category.id}
                    highlightIds={categoryHighlightIds}
                    emptyState={
                      <span className="text-sm text-muted-foreground">
                        {t('categories.hierarchy_empty') || 'Hiyerarşi bilgisi bulunamadı.'}
                      </span>
                    }
                    className="border-none bg-transparent px-0 py-0 shadow-none"
                  />

                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('categories.fields.parent') || 'Parent Category'}
                    </span>
                    <div className="mt-1">
                      {category.parentCategoryId ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">
                            {categoryMap.get(category.parentCategoryId)?.name ??
                              category.parentCategoryId}
                          </Badge>
                          <code className="text-xs text-muted-foreground">
                            {category.parentCategoryId}
                          </code>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('categories.root_label') || 'Root Category'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('categories.fields.default_item_type') || 'Varsayılan Item Type'}
                    </span>
                    <div className="mt-1">
                      {defaultItemTypeLabel ? (
                        <Badge variant="outline">{defaultItemTypeLabel}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('categories.select_default_item_type') || 'Seçilmedi'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('categories.fields.linked_item_types') || 'Bağlı Item Types'}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {linkedItemTypeBadges.length > 0 ? (
                        linkedItemTypeBadges.map((label) => (
                          <Badge key={label} variant="secondary">
                            {label}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('categories.preview.no_item_types') || 'Item type seçilmedi.'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('categories.fields.linked_families') || 'Bağlı Families'}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {linkedFamilyBadges.length > 0 ? (
                        linkedFamilyBadges.map((label) => (
                          <Badge key={label} variant="secondary">
                            {label}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('categories.preview.no_families') || 'Family seçilmedi.'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('categories.created_at') || 'Created At'}
            </span>
            <p className="mt-1">{new Date(category.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('categories.updated_at') || 'Updated At'}
            </span>
            <p className="mt-1">{new Date(category.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('categories.created_by') || 'Created By'}
            </span>
            <p className="mt-1">
              {typeof category.createdBy === 'string'
                ? category.createdBy
                : category.createdBy?.name ??
                    category.createdBy?.email ??
                    t('common.unknown_user') ??
                    '—'}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('categories.updated_by') || 'Updated By'}
            </span>
            <p className="mt-1">
              {typeof category.updatedBy === 'string'
                ? category.updatedBy
                : category.updatedBy?.name ??
                    category.updatedBy?.email ??
                    t('common.unknown_user') ??
                    '—'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const CategoryAttributeGroupsTab: React.FC<CategoryAttributeGroupsTabProps> = ({
  category,
  editMode,
  selectedIds,
  onSelectionChange,
  attributeGroups,
  loading,
  error,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const bindings = category.attributeGroupBindings ?? [];
  const attributeGroupMap = useMemo(
    () => new Map(attributeGroups.map((group) => [group.id, group])),
    [attributeGroups],
  );

  if (editMode) {
    if (loading) {
      return (
        <Card padding="lg">
          <div className="text-sm text-muted-foreground">
            {t('common.loading') || 'Loading...'}
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card padding="lg">
          <div className="text-sm text-error">{error}</div>
        </Card>
      );
    }

    if (attributeGroups.length === 0) {
      return (
        <Card padding="lg">
          <div className="text-sm text-muted-foreground">
            {t('categories.attribute_groups.empty') || 'Tanımlı attribute grubu bulunamadı.'}
          </div>
        </Card>
      );
    }

    return (
      <AttributeGroupSelector
        groups={attributeGroups.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          attributeCount: group.attributeCount ?? group.attributeIds?.length ?? 0,
        }))}
        selectedGroups={selectedIds}
        onSelectionChange={onSelectionChange}
      />
    );
  }

  if (bindings.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-sm text-muted-foreground">
          {t('categories.attribute_groups.empty') || 'Bu kategori için attribute grubu atanmadı.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bindings.map((binding) => {
        const group = attributeGroupMap.get(binding.attributeGroupId);
        return (
          <Card
            key={binding.id}
            padding="md"
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TagsIcon className="h-4 w-4 text-primary" />
                {group?.name ?? binding.attributeGroupId}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <Hash className="h-3 w-3" />
                <code>{binding.attributeGroupId}</code>
              </div>
              {group?.description ? (
                <p className="text-xs text-muted-foreground mt-2">{group.description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {binding.inherited ? (
                <Badge variant="secondary" size="sm">
                  {t('categories.attribute_groups.inherited') || 'Inherited'}
                </Badge>
              ) : null}
              {binding.required ? (
                <Badge variant="outline" size="sm">
                  {t('categories.attribute_groups.required') || 'Required'}
                </Badge>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/attribute-groups/${binding.attributeGroupId}`)}
              >
                {t('common.view') || 'Görüntüle'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const buildCategoryApiEndpoints = (category: Category): APIEndpoint[] => [
  {
    id: 'list-categories',
    method: 'GET',
    path: '/api/categories',
    description: 'Kategori kayıtlarını listeleyin.',
    parameters: [
      {
        name: 'search',
        type: 'string',
        required: false,
        description: 'Key veya isim ile arama',
      },
    ],
    responseExample: {
      items: [
        {
          id: category.id,
          key: category.key,
          name: category.name,
          parentCategoryId: category.parentCategoryId,
        },
      ],
      total: 1,
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.CATEGORIES.LIST],
  },
  {
    id: 'get-category',
    method: 'GET',
    path: `/api/categories/${category.id}`,
    description: 'Belirli kategori kaydını getirin.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Kategori kimliği' },
    ],
    responseExample: {
      id: category.id,
      key: category.key,
      parentCategoryId: category.parentCategoryId,
      attributeGroupIds: category.attributeGroupIds,
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.CATEGORIES.VIEW],
  },
  {
    id: 'update-category',
    method: 'PUT',
    path: `/api/categories/${category.id}`,
    description: 'Kategori kaydını güncelleyin.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Kategori kimliği' },
    ],
    requestBody: {
      nameLocalizationId: category.nameLocalizationId,
      descriptionLocalizationId: category.descriptionLocalizationId,
      parentCategoryId: category.parentCategoryId,
      defaultItemTypeId: category.defaultItemTypeId,
      linkedFamilyIds: category.linkedFamilyIds,
      linkedItemTypeIds: category.linkedItemTypeIds,
      attributeGroupIds: category.attributeGroupIds,
      comment: 'Güncelleme gerekçesi',
    },
    responseExample: {
      id: category.id,
      updatedAt: new Date().toISOString(),
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.CATEGORIES.UPDATE],
  },
];

const CategoriesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const requiredLanguages = useRequiredLanguages();
  const { register: registerEditActions } = useEditActionContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<Category | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [nameDraft, setNameDraft] = useState<LocalizationState>({});
  const [descriptionDraft, setDescriptionDraft] = useState<LocalizationState>({});
  const [initialNameState, setInitialNameState] = useState<LocalizationState>({});
  const [initialDescriptionState, setInitialDescriptionState] = useState<LocalizationState>({});

  const [selectedAttributeGroupIds, setSelectedAttributeGroupIds] = useState<string[]>([]);
  const [initialAttributeGroupIds, setInitialAttributeGroupIds] = useState<string[]>([]);

  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [attributeGroupsLoading, setAttributeGroupsLoading] = useState(false);
  const [attributeGroupsError, setAttributeGroupsError] = useState<string | null>(null);

  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [familyOptions, setFamilyOptions] = useState<Family[]>([]);
  const [itemTypeOptions, setItemTypeOptions] = useState<ItemType[]>([]);

  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [initialParentCategoryId, setInitialParentCategoryId] = useState<string | null>(null);
  const [defaultItemTypeId, setDefaultItemTypeId] = useState<string | null>(null);
  const [initialDefaultItemTypeId, setInitialDefaultItemTypeId] = useState<string | null>(null);
  const [linkedFamilyIds, setLinkedFamilyIds] = useState<string[]>([]);
  const [initialLinkedFamilyIds, setInitialLinkedFamilyIds] = useState<string[]>([]);
  const [linkedItemTypeIds, setLinkedItemTypeIds] = useState<string[]>([]);
  const [initialLinkedItemTypeIds, setInitialLinkedItemTypeIds] = useState<string[]>([]);

  const localizationCacheRef = useRef<Record<string, LocalizationRecord>>({});
  const [localizationsLoading, setLocalizationsLoading] = useState(false);
  const [localizationsError, setLocalizationsError] = useState<string | null>(null);

  const canUpdateCategory = hasPermission(PERMISSIONS.CATALOG.CATEGORIES.UPDATE);
  const canDeleteCategory = hasPermission(PERMISSIONS.CATALOG.CATEGORIES.DELETE);
  const canViewAttributeGroupsTab = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.VIEW);
  const canViewStatistics = hasPermission(PERMISSIONS.CATALOG.CATEGORIES.VIEW);
  const canViewDocumentation = hasPermission(PERMISSIONS.CATALOG.CATEGORIES.VIEW);
  const canViewApi = hasPermission(PERMISSIONS.CATALOG.CATEGORIES.VIEW);
  const canViewHistory = hasPermission(PERMISSIONS.CATALOG.CATEGORIES.HISTORY);
  const canViewNotifications = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);

  const buildLocalizationState = useCallback(
    (translations?: Record<string, string> | null, fallback?: string): LocalizationState => {
      const normalized = new Map<string, string>();
      if (translations) {
        Object.entries(translations).forEach(([code, value]) => {
          if (typeof value === 'string') {
            normalized.set(code.toLowerCase(), value);
          }
        });
      }

      const next: LocalizationState = {};
      requiredLanguages.forEach(({ code }) => {
        const normalizedCode = code.toLowerCase();
        const translatedValue = normalized.get(normalizedCode);
        if (typeof translatedValue === 'string') {
          next[code] = translatedValue;
        } else if (
          fallback &&
          requiredLanguages[0] &&
          normalizedCode === requiredLanguages[0].code.toLowerCase()
        ) {
          next[code] = fallback;
        } else {
          next[code] = '';
        }
      });
      return next;
    },
    [requiredLanguages],
  );

  const buildTranslationPayload = useCallback(
    (values: LocalizationState): Record<string, string> => {
      const payload: Record<string, string> = {};
      requiredLanguages.forEach(({ code }) => {
        const value = values[code]?.trim();
        if (value) {
          payload[code] = value;
        }
      });
      return payload;
    },
    [requiredLanguages],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchAttributeGroups = async () => {
      try {
        setAttributeGroupsLoading(true);
        const groups = await attributeGroupsService.list();
        if (cancelled) return;
        setAttributeGroups(groups);
        setAttributeGroupsError(null);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load attribute groups', err);
        setAttributeGroupsError(
          err?.response?.data?.error?.message ??
            t('categories.attribute_groups_failed') ??
            'Attribute grupları yüklenemedi.',
        );
      } finally {
        if (!cancelled) {
          setAttributeGroupsLoading(false);
        }
      }
    };

    void fetchAttributeGroups();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const loadLocalizationDetails = useCallback(
    async (categoryData: Category, resetInitial = false) => {
      const nameId = categoryData.nameLocalizationId;
      const descriptionId = categoryData.descriptionLocalizationId ?? null;

      const ids = [nameId, descriptionId].filter((value): value is string => Boolean(value));

      if (ids.length === 0) {
        const fallbackName = buildLocalizationState(null, categoryData.name);
        const fallbackDescription = buildLocalizationState(
          null,
          categoryData.description ?? '',
        );
        setNameDraft(fallbackName);
        setDescriptionDraft(fallbackDescription);
        if (resetInitial) {
          setInitialNameState(fallbackName);
          setInitialDescriptionState(fallbackDescription);
        }
        setLocalizationsLoading(false);
        setLocalizationsError(null);
        return;
      }

      setLocalizationsLoading(true);
      setLocalizationsError(null);
      const fetched: Record<string, LocalizationRecord> = {};
      const cacheSnapshot = localizationCacheRef.current;

      await Promise.all(
        ids.map(async (localizationId) => {
          try {
            if (cacheSnapshot[localizationId]) {
              fetched[localizationId] = cacheSnapshot[localizationId];
              return;
            }
            const record = await localizationsService.getById(localizationId);
            fetched[localizationId] = record;
          } catch (err) {
            console.error('Failed to load localization record', localizationId, err);
            setLocalizationsError(
              t('categories.failed_to_load_localizations') || 'Çeviri kayıtları yüklenemedi.',
            );
          }
        }),
      );

      setLocalizationsLoading(false);

      if (Object.keys(fetched).length > 0) {
        localizationCacheRef.current = {
          ...localizationCacheRef.current,
          ...fetched,
        };
      }

      const cache = localizationCacheRef.current;

      const nameTranslations = nameId ? cache[nameId]?.translations ?? null : null;
      const descriptionTranslations = descriptionId
        ? cache[descriptionId]?.translations ?? null
        : null;

      const nextNameState = buildLocalizationState(nameTranslations, categoryData.name);
      const nextDescriptionState = buildLocalizationState(
        descriptionTranslations,
        categoryData.description ?? '',
      );

      setNameDraft(nextNameState);
      setDescriptionDraft(nextDescriptionState);

      if (resetInitial) {
        setInitialNameState(nextNameState);
        setInitialDescriptionState(nextDescriptionState);
      }
    },
    [buildLocalizationState, t],
  );

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [categoryResponse, categoryListResponse, familyListResponse, itemTypeListResponse] =
          await Promise.all([
            categoriesService.getById(id),
            categoriesService.list({ limit: 200 }),
            familiesService.list({ limit: 200 }),
            itemTypesService.list({ limit: 200 }),
          ]);

        if (cancelled) {
          return;
        }

        setCategory(categoryResponse);
        setCategoryDraft(categoryResponse);

        const attributeIds = Array.isArray(categoryResponse.attributeGroupIds)
          ? categoryResponse.attributeGroupIds
          : [];

        setSelectedAttributeGroupIds(attributeIds);
        setInitialAttributeGroupIds(attributeIds);
        setCategoryOptions(categoryListResponse.items ?? []);
        setFamilyOptions(familyListResponse.items ?? []);
        setItemTypeOptions(itemTypeListResponse.items ?? []);

        const parentId = categoryResponse.parentCategoryId ?? null;
        setParentCategoryId(parentId);
        setInitialParentCategoryId(parentId);

        const defaultType = categoryResponse.defaultItemTypeId ?? null;
        setDefaultItemTypeId(defaultType);
        setInitialDefaultItemTypeId(defaultType);

        const linkedFamilies = Array.isArray(categoryResponse.linkedFamilyIds)
          ? categoryResponse.linkedFamilyIds
          : [];
        setLinkedFamilyIds(linkedFamilies);
        setInitialLinkedFamilyIds(linkedFamilies);

        const linkedItemTypes = Array.isArray(categoryResponse.linkedItemTypeIds)
          ? categoryResponse.linkedItemTypeIds
          : [];
        setLinkedItemTypeIds(linkedItemTypes);
        setInitialLinkedItemTypeIds(linkedItemTypes);

        await loadLocalizationDetails(categoryResponse, true);
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load category', err);
        setError(
          err?.response?.data?.error?.message ??
            t('categories.failed_to_load') ??
            'Kategori bilgisi yüklenemedi.',
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
  }, [id, loadLocalizationDetails, t]);

  const extendedCategoryOptions = useMemo(() => {
    if (!categoryDraft) {
      return categoryOptions;
    }
    const exists = categoryOptions.some((item) => item.id === categoryDraft.id);
    return exists ? categoryOptions : [...categoryOptions, categoryDraft];
  }, [categoryDraft, categoryOptions]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    extendedCategoryOptions.forEach((item) => map.set(item.id, item));
    return map;
  }, [extendedCategoryOptions]);

  const familyDisplayMap = useMemo(() => {
    const map = new Map<string, string>();
    familyOptions.forEach((family) =>
      map.set(family.id, family.name?.trim() || family.key || family.id),
    );
    return map;
  }, [familyOptions]);

  const itemTypeDisplayMap = useMemo(() => {
    const map = new Map<string, string>();
    itemTypeOptions.forEach((itemType) =>
      map.set(itemType.id, itemType.name?.trim() || itemType.key || itemType.id),
    );
    return map;
  }, [itemTypeOptions]);

  const invalidParentIds = useMemo(() => {
    if (!categoryDraft) {
      return new Set<string>();
    }
    const blocked = new Set<string>([categoryDraft.id]);
    extendedCategoryOptions.forEach((item) => {
      if (item.id !== categoryDraft.id && item.hierarchyPath?.includes(categoryDraft.id)) {
        blocked.add(item.id);
      }
    });
    return blocked;
  }, [extendedCategoryOptions, categoryDraft]);

  const categoryTree = useMemo<TreeNode[]>(() => {
    if (extendedCategoryOptions.length === 0) {
      return [];
    }
    return buildHierarchyTree(extendedCategoryOptions, {
      getId: (item) => item.id,
      getParentId: (item) => item.parentCategoryId ?? null,
      getLabel: (item) => item.name?.trim() || item.key,
      getDescription: (item) => `${t('categories.fields.key') || 'Key'}: ${item.key}`,
      getDisabled: (item) => invalidParentIds.has(item.id),
    });
  }, [extendedCategoryOptions, invalidParentIds, t]);

  const categoryHighlightIds = useMemo(() => {
    if (!categoryDraft) {
      return [];
    }
    const base = Array.isArray(categoryDraft.hierarchyPath)
      ? categoryDraft.hierarchyPath.filter((value): value is string => Boolean(value))
      : [];
    const unique = new Set<string>([...base, categoryDraft.id]);
    return Array.from(unique);
  }, [categoryDraft]);

  const familyTree = useMemo<TreeNode[]>(() => {
    if (familyOptions.length === 0) {
      return [];
    }
    return buildHierarchyTree(familyOptions, {
      getId: (item) => item.id,
      getParentId: (item) => item.parentFamilyId ?? null,
      getLabel: (item) => item.name?.trim() || item.key,
      getDescription: (item) => `${t('families.fields.key') || 'Key'}: ${item.key}`,
    });
  }, [familyOptions, t]);

  const categoryName = useMemo(() => {
    if (!categoryDraft) {
      return '';
    }
    for (const { code } of requiredLanguages) {
      const value = nameDraft[code]?.trim();
      if (value) {
        return value;
      }
    }
    return categoryDraft.name ?? categoryDraft.key;
  }, [categoryDraft, nameDraft, requiredLanguages]);

  const categoryDescription = useMemo(() => {
    if (!categoryDraft) {
      return '';
    }
    for (const { code } of requiredLanguages) {
      const value = descriptionDraft[code]?.trim();
      if (value) {
        return value;
      }
    }
    return categoryDraft.description ?? '';
  }, [categoryDraft, descriptionDraft, requiredLanguages]);

  const statisticsData = useMemo<StatisticsType | undefined>(() => {
    if (!categoryDraft) {
      return undefined;
    }
    const groupCount = categoryDraft.attributeGroupBindings?.length ?? 0;
    return {
      totalCount: groupCount,
      activeCount: groupCount,
      inactiveCount: 0,
      createdThisMonth: 0,
      updatedThisMonth: 0,
      usageCount: groupCount,
      lastUsed: categoryDraft.updatedAt,
      trends: [
        { period: 'Jan', value: groupCount, change: 0 },
        { period: 'Feb', value: groupCount, change: 0 },
      ],
      topUsers: categoryDraft.updatedBy
        ? [
            {
              userId:
                typeof categoryDraft.updatedBy === 'string'
                  ? categoryDraft.updatedBy
                  : categoryDraft.updatedBy?.id ?? 'user',
              userName:
                typeof categoryDraft.updatedBy === 'string'
                  ? categoryDraft.updatedBy
                  : categoryDraft.updatedBy?.name ??
                    categoryDraft.updatedBy?.email ??
                    'System',
              count: groupCount,
            },
          ]
        : [],
    };
  }, [categoryDraft]);

  const documentationSections = useMemo<DocumentationSection[]>(() => {
    if (!categoryDraft) {
      return [];
    }
    const bindings = categoryDraft.attributeGroupBindings ?? [];
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
        : t('categories.attribute_groups.empty_markdown') ||
          'Henüz attribute grubu bağlı değil.';

    return [
      {
        id: 'overview',
        title: t('categories.docs.overview') || 'Genel Bakış',
        content: `# ${categoryDraft.name}\n\n- **Key:** \`${categoryDraft.key}\`\n- **Attribute Group Count:** ${
          bindings.length
        }\n\n## Attribute Groups\n${list}`,
        order: 0,
        type: 'markdown',
        lastUpdated: categoryDraft.updatedAt,
        author:
          typeof categoryDraft.updatedBy === 'string'
            ? categoryDraft.updatedBy
            : categoryDraft.updatedBy?.name ?? categoryDraft.updatedBy?.email ?? 'System',
      },
    ];
  }, [categoryDraft, t]);

  const apiEndpoints = useMemo(() => {
    if (!categoryDraft) {
      return [];
    }
    return buildCategoryApiEndpoints(categoryDraft);
  }, [categoryDraft]);

  const hasNameChanges = useMemo(
    () =>
      requiredLanguages.some(
        ({ code }) => (nameDraft[code] ?? '').trim() !== (initialNameState[code] ?? '').trim(),
      ),
    [nameDraft, initialNameState, requiredLanguages],
  );

  const hasDescriptionChanges = useMemo(
    () =>
      requiredLanguages.some(
        ({ code }) =>
          (descriptionDraft[code] ?? '').trim() !==
          (initialDescriptionState[code] ?? '').trim(),
      ),
    [descriptionDraft, initialDescriptionState, requiredLanguages],
  );

  const hasAttributeGroupChanges = useMemo(() => {
    const current = [...selectedAttributeGroupIds].sort();
    const initial = [...initialAttributeGroupIds].sort();
    if (current.length !== initial.length) {
      return true;
    }
    return current.some((value, index) => value !== initial[index]);
  }, [initialAttributeGroupIds, selectedAttributeGroupIds]);

  const hasParentChanges = useMemo(
    () => (parentCategoryId ?? null) !== (initialParentCategoryId ?? null),
    [parentCategoryId, initialParentCategoryId],
  );

  const hasDefaultItemTypeChange = useMemo(
    () => (defaultItemTypeId ?? null) !== (initialDefaultItemTypeId ?? null),
    [defaultItemTypeId, initialDefaultItemTypeId],
  );

  const hasLinkedFamilyChanges = useMemo(() => {
    const current = [...linkedFamilyIds].sort();
    const initial = [...initialLinkedFamilyIds].sort();
    if (current.length !== initial.length) {
      return true;
    }
    return current.some((value, index) => value !== initial[index]);
  }, [linkedFamilyIds, initialLinkedFamilyIds]);

  const hasLinkedItemTypeChanges = useMemo(() => {
    const current = [...linkedItemTypeIds].sort();
    const initial = [...initialLinkedItemTypeIds].sort();
    if (current.length !== initial.length) {
      return true;
    }
    return current.some((value, index) => value !== initial[index]);
  }, [linkedItemTypeIds, initialLinkedItemTypeIds]);

  const hasChanges =
    (hasNameChanges ||
      hasDescriptionChanges ||
      hasAttributeGroupChanges ||
      hasParentChanges ||
      hasDefaultItemTypeChange ||
      hasLinkedFamilyChanges ||
      hasLinkedItemTypeChanges) &&
    !saving;

  const handleEnterEdit = useCallback(() => {
    if (!category) {
      return;
    }
    setEditMode(true);
  }, [category]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setNameDraft(initialNameState);
    setDescriptionDraft(initialDescriptionState);
    setSelectedAttributeGroupIds(initialAttributeGroupIds);
    setParentCategoryId(initialParentCategoryId);
    setDefaultItemTypeId(initialDefaultItemTypeId);
    setLinkedFamilyIds(initialLinkedFamilyIds);
    setLinkedItemTypeIds(initialLinkedItemTypeIds);
    setLocalizationsError(null);
    if (category) {
      setCategoryDraft(category);
    }
  }, [
    category,
    initialAttributeGroupIds,
    initialDefaultItemTypeId,
    initialDescriptionState,
    initialLinkedFamilyIds,
    initialLinkedItemTypeIds,
    initialNameState,
    initialParentCategoryId,
  ]);

  const handleNameDraftChange = useCallback((code: string, value: string) => {
    setNameDraft((prev) => ({ ...prev, [code]: value }));
  }, []);

  const handleDescriptionDraftChange = useCallback((code: string, value: string) => {
    setDescriptionDraft((prev) => ({ ...prev, [code]: value }));
  }, []);

  const handleLinkedFamiliesChange = useCallback((ids: string[]) => {
    setLinkedFamilyIds(ids);
  }, []);

  const handleLinkedItemTypesChange = useCallback((ids: string[]) => {
    setLinkedItemTypeIds(ids);
  }, []);

  const handleSave = useCallback(async () => {
    if (!category || saving) {
      return;
    }

    try {
      setSaving(true);
      const namespace = 'categories';
      const normalizedKey = category.key.toLowerCase();

      let nameLocalizationId = category.nameLocalizationId;
      let descriptionLocalizationId = category.descriptionLocalizationId ?? null;

      if (hasNameChanges) {
        const translations = buildTranslationPayload(nameDraft);
        if (!nameLocalizationId) {
          const created = await localizationsService.create({
            namespace,
            key: `${normalizedKey}.name`,
            description: null,
            translations,
          });
          nameLocalizationId = created.id;
        } else {
          await localizationsService.update(nameLocalizationId, {
            translations,
            comment: t('categories.localization_update_comment') || 'Kategori çevirisi güncellendi.',
          });
        }
      }

      if (hasDescriptionChanges) {
        const translations = buildTranslationPayload(descriptionDraft);
        if (Object.keys(translations).length === 0) {
          if (descriptionLocalizationId) {
            await localizationsService.update(descriptionLocalizationId, {
              translations: {},
              comment: t('categories.localization_update_comment') || 'Kategori çevirisi güncellendi.',
            });
            descriptionLocalizationId = null;
          }
        } else if (!descriptionLocalizationId) {
          const created = await localizationsService.create({
            namespace,
            key: `${normalizedKey}.description`,
            description: null,
            translations,
          });
          descriptionLocalizationId = created.id;
        } else {
          await localizationsService.update(descriptionLocalizationId, {
            translations,
            comment: t('categories.localization_update_comment') || 'Kategori çevirisi güncellendi.',
          });
        }
      }

      const payload: Record<string, unknown> = {};

      if (nameLocalizationId && nameLocalizationId !== category.nameLocalizationId) {
        payload.nameLocalizationId = nameLocalizationId;
      }

      if ((descriptionLocalizationId ?? null) !== (category.descriptionLocalizationId ?? null)) {
        payload.descriptionLocalizationId = descriptionLocalizationId;
      }

      if (hasAttributeGroupChanges) {
        payload.attributeGroupIds = selectedAttributeGroupIds;
      }

      if (hasParentChanges) {
        payload.parentCategoryId = parentCategoryId ?? null;
      }

      if (hasDefaultItemTypeChange) {
        payload.defaultItemTypeId = defaultItemTypeId ?? null;
      }

      if (hasLinkedFamilyChanges) {
        payload.linkedFamilyIds = linkedFamilyIds;
      }

      if (hasLinkedItemTypeChanges) {
        payload.linkedItemTypeIds = linkedItemTypeIds;
      }

      let updatedCategory: Category | null = null;

      if (Object.keys(payload).length > 0) {
        updatedCategory = await categoriesService.update(category.id, payload);
      } else if (hasNameChanges || hasDescriptionChanges) {
        updatedCategory = await categoriesService.getById(category.id);
      } else {
        updatedCategory = category;
      }

      if (updatedCategory) {
        setCategory(updatedCategory);
        setCategoryDraft(updatedCategory);
        setSelectedAttributeGroupIds(updatedCategory.attributeGroupIds ?? []);
        setInitialAttributeGroupIds(updatedCategory.attributeGroupIds ?? []);
        const parentId = updatedCategory.parentCategoryId ?? null;
        setParentCategoryId(parentId);
        setInitialParentCategoryId(parentId);
        const defaultType = updatedCategory.defaultItemTypeId ?? null;
        setDefaultItemTypeId(defaultType);
        setInitialDefaultItemTypeId(defaultType);
        const nextFamilies = updatedCategory.linkedFamilyIds ?? [];
        setLinkedFamilyIds(nextFamilies);
        setInitialLinkedFamilyIds(nextFamilies);
        const nextItemTypes = updatedCategory.linkedItemTypeIds ?? [];
        setLinkedItemTypeIds(nextItemTypes);
        setInitialLinkedItemTypeIds(nextItemTypes);
        await loadLocalizationDetails(updatedCategory, true);
        setEditMode(false);
        showToast({
          type: 'success',
          message: t('categories.update_success') || 'Kategori başarıyla güncellendi.',
        });
      }
    } catch (err: any) {
      console.error('Failed to update category', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        t('categories.update_failed') ??
        'Kategori güncellenemedi.';
      showToast({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  }, [
    category,
    saving,
    hasNameChanges,
    hasDescriptionChanges,
    hasAttributeGroupChanges,
    hasParentChanges,
    hasDefaultItemTypeChange,
    hasLinkedFamilyChanges,
    hasLinkedItemTypeChanges,
    buildTranslationPayload,
    nameDraft,
    descriptionDraft,
    selectedAttributeGroupIds,
    parentCategoryId,
    defaultItemTypeId,
    linkedFamilyIds,
    linkedItemTypeIds,
    loadLocalizationDetails,
    showToast,
    t,
  ]);

  useEffect(() => {
    if (!canUpdateCategory) {
      registerEditActions(null);
      return;
    }

    registerEditActions({
      isEditing: editMode,
      canEdit: !editMode && !loading && !error,
      canSave: editMode && hasChanges,
      onEdit: handleEnterEdit,
      onCancel: handleCancelEdit,
      onSave: handleSave,
    });

    return () => {
      registerEditActions(null);
    };
  }, [
    registerEditActions,
    canUpdateCategory,
    editMode,
    loading,
    error,
    hasChanges,
    handleEnterEdit,
    handleCancelEdit,
    handleSave,
  ]);

  const handleDelete = useCallback(async () => {
    if (!category || deleting) {
      return;
    }
    try {
      setDeleting(true);
      await categoriesService.delete(category.id);
      showToast({
        type: 'success',
        message: t('categories.delete_success') || 'Kategori başarıyla silindi.',
      });
      navigate('/categories');
    } catch (err: any) {
      console.error('Failed to delete category', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        t('categories.delete_failed') ??
        'Kategori silinemedi.';
      showToast({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  }, [category, deleting, navigate, showToast, t]);

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

  if (error || !category || !categoryDraft) {
    return (
      <div className="px-6 py-12">
        <Card padding="lg">
          <div className="text-sm text-error">
            {error ??
              t('categories.failed_to_load') ??
              'Kategori bilgisi yüklenemedi. Lütfen daha sonra tekrar deneyin.'}
          </div>
        </Card>
      </div>
    );
  }

  const displayName =
    categoryName || categoryDraft.name || categoryDraft.key;

  const tabs: TabConfig[] = [
    {
      id: 'details',
      label: t('categories.details_tab') || 'Detaylar',
      icon: FileText,
      component: CategoryDetailsTab,
      props: {
        category: categoryDraft,
        editMode,
        requiredLanguages,
        nameDraft,
        descriptionDraft,
        onNameChange: handleNameDraftChange,
        onDescriptionChange: handleDescriptionDraftChange,
        categoryTree,
        categoryHighlightIds,
        parentCategoryId,
        onParentChange: setParentCategoryId,
        defaultItemTypeId,
        onDefaultItemTypeChange: setDefaultItemTypeId,
        itemTypes: itemTypeOptions,
        linkedItemTypeIds,
        onLinkedItemTypesChange: handleLinkedItemTypesChange,
        itemTypeDisplayMap,
        familyTree,
        linkedFamilyIds,
        onLinkedFamiliesChange: handleLinkedFamiliesChange,
        familyDisplayMap,
        categoryMap,
        localizationsLoading,
        localizationsError,
      },
    },
    {
      id: 'attribute-groups',
      label: t('categories.attribute_groups_tab') || 'Attribute Grupları',
      icon: TagsIcon,
      component: CategoryAttributeGroupsTab,
      props: {
        category: categoryDraft,
        editMode,
        selectedIds: selectedAttributeGroupIds,
        onSelectionChange: setSelectedAttributeGroupIds,
        attributeGroups,
        loading: attributeGroupsLoading,
        error: attributeGroupsError,
      },
      badge: categoryDraft.attributeGroupBindings?.length ?? 0,
      hidden: !canViewAttributeGroupsTab,
    },
    {
      id: 'statistics',
      label: t('categories.statistics_tab') || 'İstatistikler',
      icon: BarChart3,
      component: Statistics,
      props: {
        entityType: 'category',
        entityId: categoryDraft.id,
        statistics: statisticsData,
      },
      hidden: !canViewStatistics,
    },
    {
      id: 'documentation',
      label: t('categories.documentation_tab') || 'Dokümantasyon',
      icon: BookOpen,
      component: Documentation,
      props: {
        entityType: 'category',
        entityId: categoryDraft.id,
        sections: documentationSections,
        editMode,
      },
      hidden: !canViewDocumentation,
    },
    {
      id: 'api',
      label: t('categories.api_tab') || 'API',
      icon: Globe,
      component: APITester,
      props: {
        entityType: 'category',
        entityId: categoryDraft.id,
        endpoints: apiEndpoints,
        editMode,
      },
      hidden: !canViewApi,
    },
    {
      id: 'history',
      label: t('categories.history_tab') || 'Geçmiş',
      icon: HistoryIcon,
      component: HistoryTable,
      props: { entityType: 'Category', entityId: categoryDraft.id },
      hidden: !canViewHistory,
    },
    {
      id: 'notifications',
      label: t('categories.notifications_tab') || 'Bildirimler',
      icon: Activity,
      component: NotificationSettings,
      props: { entityType: 'category', entityId: categoryDraft.id },
      hidden: !canViewNotifications,
    },
  ];

  const headerTitle = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xl font-bold text-foreground">
          {displayName || categoryDraft.key}
        </span>
        <Badge variant="secondary">
          {categoryDraft.attributeGroupBindings?.length ?? 0}{' '}
          {t('categories.attribute_groups_short') || 'groups'}
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span>
          <Clock className="inline h-3 w-3 mr-1" />
          {new Date(categoryDraft.updatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );

  return (
    <DetailsLayout
      title={headerTitle}
      subtitle={categoryDescription || undefined}
      icon={<FolderTree className="h-6 w-6 text-white" />}
      tabs={tabs}
      defaultTab="details"
      backUrl="/categories"
      editMode={editMode}
      hasChanges={hasChanges}
      onEdit={canUpdateCategory ? handleEnterEdit : undefined}
      onSave={canUpdateCategory ? handleSave : undefined}
      onCancel={canUpdateCategory ? handleCancelEdit : undefined}
      inlineActions={false}
      onDelete={canDeleteCategory ? handleDelete : undefined}
      deleteLoading={deleting}
      deleteButtonLabel={t('categories.delete_action') || 'Kategori Sil'}
      deleteDialogTitle={
        t('categories.delete_title', { name: displayName || categoryDraft.key }) ||
        'Kategori silinsin mi?'
      }
      deleteDialogDescription={
        t('categories.delete_description', { name: displayName || categoryDraft.key }) ||
        'Bu kategori kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.'
      }
    />
  );
};

export { CategoriesDetails };
export default CategoriesDetails;
