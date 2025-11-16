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
  Layers,
  Plus,
  Tags as TagsIcon,
  X,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { AttributeGroupSelector } from '../../components/ui/AttributeGroupSelector';
import { Modal } from '../../components/ui/Modal';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { ATTRIBUTE_TYPE_META } from '../../components/ui/AttributeTypeCard';
import { TreeSelect } from '../../components/ui/TreeSelect';
import { HierarchyTreeView } from '../../components/ui/HierarchyTreeView';
import { HistoryTable } from '../../components/common/HistoryTable';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { familiesService } from '../../api/services/families.service';
import { categoriesService } from '../../api/services/categories.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { Attribute, AttributeGroup, Category, Family } from '../../types';
import type {
  APIEndpoint,
  DocumentationSection,
  Statistics as StatisticsType,
  TabConfig,
} from '../../types/common';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { PERMISSIONS } from '../../config/permissions';
import type { LocalizationRecord } from '../../api/types/api.types';
import type { TreeNode } from '../../components/ui';
import { buildHierarchyTree } from '../../utils/hierarchy';

type LocalizationState = Record<string, string>;
type RequiredLanguage = ReturnType<typeof useRequiredLanguages>[number];

interface FamilyDetailsTabProps {
  family: Family;
  editMode: boolean;
  requiredLanguages: RequiredLanguage[];
  nameDraft: LocalizationState;
  descriptionDraft: LocalizationState;
  onNameChange: (code: string, value: string) => void;
  onDescriptionChange: (code: string, value: string) => void;
  parentFamilyName?: string | null;
  categoryName?: string | null;
  familyTree: TreeNode[];
  familyHighlightIds: string[];
  familySelectionTree: TreeNode[];
  parentFamilyId: string | null;
  onParentFamilyChange: (id: string | null) => void;
  categoryTree: TreeNode[];
  categoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  localizationsLoading?: boolean;
  localizationsError?: string | null;
  isAbstract: boolean;
  onIsAbstractChange: (value: boolean) => void;
}

interface FamilyAttributeGroupsTabProps {
  family: Family;
  editMode: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  attributeGroups: AttributeGroup[];
  loading: boolean;
  error: string | null;
}

type ChangeSummary = {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
};

const resolveNameLabel = (
  code: string,
  label: string,
  t: ReturnType<typeof useLanguage>['t'],
): string => {
  if (code === 'tr') {
    return t('families.fields.name_tr') || `Name (${label})`;
  }
  if (code === 'en') {
    return t('families.fields.name_en') || `Name (${label})`;
  }
  return `${t('families.fields.name') || 'Name'} (${label})`;
};

const resolveDescriptionLabel = (
  code: string,
  label: string,
  t: ReturnType<typeof useLanguage>['t'],
): string => {
  if (code === 'tr') {
    return t('families.fields.description_tr') || `Description (${label})`;
  }
  if (code === 'en') {
    return t('families.fields.description_en') || `Description (${label})`;
  }
  return `${t('families.fields.description') || 'Description'} (${label})`;
};

const FamilyDetailsTab: React.FC<FamilyDetailsTabProps> = ({
  family,
  editMode,
  requiredLanguages,
  nameDraft,
  descriptionDraft,
  onNameChange,
  onDescriptionChange,
  parentFamilyName,
  categoryName,
  familyTree,
  familyHighlightIds,
  familySelectionTree,
  parentFamilyId,
  onParentFamilyChange,
  categoryTree,
  categoryId,
  onCategoryChange,
  localizationsLoading,
  localizationsError,
  isAbstract,
  onIsAbstractChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {localizationsError ? (
        <div className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-4 py-3">
          {localizationsError}
        </div>
      ) : null}

      <Card padding="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                {t('families.fields.key') || 'Key'}
              </span>
              <p className="mt-1 font-mono text-sm text-foreground">{family.key}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t('families.fields.system_flag') || 'System Type'}
              </span>
              <Badge variant={family.isSystemFamily ? 'error' : 'secondary'}>
                {family.isSystemFamily
                  ? t('families.labels.system') || 'System'
                  : t('families.labels.standard') || 'Standard'}
              </Badge>
            </div>
          </div>

          {localizationsLoading ? (
            <div className="text-xs text-muted-foreground">
              {t('families.loading_localizations') || 'Çeviri kayıtları yükleniyor...'}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredLanguages.map(({ code, label }) => (
              <div key={`family-name-${code}`}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredLanguages.map(({ code, label }) => (
              <div key={`family-description-${code}`}>
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
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={t('families.fields.is_abstract') || 'Soyut Aile'}
          subtitle="Bu aileden item oluşturulup oluşturulamayacağını belirler."
        />
        <div className="px-6 pb-6">
          {editMode ? (
            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isAbstract}
                onChange={(event) => onIsAbstractChange(event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>{isAbstract ? t('common.yes') || 'Evet' : t('common.no') || 'Hayır'}</span>
            </label>
          ) : (
            <p className="text-sm text-foreground">
              {isAbstract ? t('common.yes') || 'Evet' : t('common.no') || 'Hayır'}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Soyut aileler sadece hiyerarşi için kullanılır, item oluşturulamaz.
          </p>
        </div>
      </Card>

      <Card padding="lg">
        <div className="space-y-5 text-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t('families.relationships_title') || 'Relationships'}
              </span>
            </div>
            {editMode ? (
              <TreeSelect
                label={t('families.fields.parent') || 'Parent Family'}
                placeholder={t('families.root_label') || 'Parent yok (kök family)'}
                options={familySelectionTree}
                value={parentFamilyId}
                onChange={(next) => onParentFamilyChange(next)}
                emptyState={
                  <span className="text-xs text-muted-foreground">
                    {t('families.no_parent_candidates') || 'Parent family bulunamadı.'}
                  </span>
                }
              />
            ) : (
              <HierarchyTreeView
                nodes={familyTree}
                activeId={family.id}
                highlightIds={familyHighlightIds}
                emptyState={
                  <span className="text-sm text-muted-foreground">
                    {t('families.hierarchy_empty') || 'Hiyerarşi bilgisi bulunamadı.'}
                  </span>
                }
                className="border-none bg-transparent px-0 py-0 shadow-none"
              />
            )}
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('families.fields.category') || 'Category'}
            </span>
            {editMode ? (
              <TreeSelect
                placeholder={t('families.select_category') || 'Kategori seçin (opsiyonel)'}
                options={categoryTree}
                value={categoryId}
                onChange={(next) => onCategoryChange(next)}
                emptyState={
                  <span className="text-xs text-muted-foreground">
                    {t('families.categories_empty') || 'Kategori bulunamadı.'}
                  </span>
                }
                className="mt-2"
              />
            ) : (
              <div className="mt-2">
                {family.categoryId ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{categoryName ?? family.categoryId}</Badge>
                    <code className="text-xs text-muted-foreground">{family.categoryId}</code>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {t('families.no_category') || 'No category linked'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('families.created_at') || 'Created At'}
            </span>
            <p className="mt-1">{new Date(family.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('families.updated_at') || 'Updated At'}
            </span>
            <p className="mt-1">{new Date(family.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('families.created_by') || 'Created By'}
            </span>
            <p className="mt-1">
              {typeof family.createdBy === 'string'
                ? family.createdBy
                : family.createdBy?.name ??
                  family.createdBy?.email ??
                  (t('families.unknown_user') || 'Unknown')}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('families.updated_by') || 'Updated By'}
            </span>
            <p className="mt-1">
              {typeof family.updatedBy === 'string'
                ? family.updatedBy
                : family.updatedBy?.name ??
                  family.updatedBy?.email ??
                  (t('families.unknown_user') || 'Unknown')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const FamilyAttributeGroupsTab: React.FC<FamilyAttributeGroupsTabProps> = ({
  family,
  editMode,
  selectedIds,
  onSelectionChange,
  attributeGroups,
  loading,
  error,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const bindings = family.attributeGroupBindings ?? [];
  const attributeGroupMap = useMemo(
    () => new Map(attributeGroups.map((group) => [group.id, group])),
    [attributeGroups],
  );
  const bindingMap = useMemo(
    () =>
      new Map<string, (typeof bindings)[number]>(
        bindings.map((binding) => [binding.attributeGroupId, binding]),
      ),
    [bindings],
  );
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorSelection, setSelectorSelection] = useState<string[]>([]);

  useEffect(() => {
    if (selectorOpen) {
      setSelectorSelection(selectedIds);
    }
  }, [selectorOpen, selectedIds]);

  const resolvedItems = useMemo(() => {
    if (editMode) {
      const sourceIds =
        selectedIds.length > 0
          ? selectedIds
          : bindings.map((binding) => binding.attributeGroupId);

      return sourceIds.map((groupId) => ({
        groupId,
        group: attributeGroupMap.get(groupId),
        binding: bindingMap.get(groupId) ?? null,
      }));
    }

    return bindings.map((binding) => ({
      groupId: binding.attributeGroupId,
      group: attributeGroupMap.get(binding.attributeGroupId),
      binding,
    }));
  }, [attributeGroupMap, bindingMap, bindings, editMode, selectedIds]);

  const handleRemoveGroup = useCallback(
    (groupId: string) => {
      onSelectionChange(selectedIds.filter((id) => id !== groupId));
    },
    [onSelectionChange, selectedIds],
  );

  const handleOpenSelector = useCallback(() => {
    setSelectorOpen(true);
  }, []);

  const handleCloseSelector = useCallback(() => {
    setSelectorOpen(false);
  }, []);

  const handleApplySelection = useCallback(() => {
    onSelectionChange(selectorSelection);
    setSelectorOpen(false);
  }, [onSelectionChange, selectorSelection]);

  const handleSelectorChange = useCallback((ids: string[]) => {
    setSelectorSelection(ids);
  }, []);

  const renderAttributeTypeLabel = useCallback(
    (type: Attribute['type']) => {
      const meta = ATTRIBUTE_TYPE_META[type];
      const key = meta?.translation
        ? `attributes.types.${meta.translation}`
        : undefined;
      return (key ? t(key) : meta?.translation) || type;
    },
    [t],
  );

  const renderAttributeCard = useCallback(
    (attribute: Attribute) => {
      const typeLabel = renderAttributeTypeLabel(attribute.type);
      const attributeTags = attribute.tags ?? [];

      return (
        <div
          key={attribute.id}
          className="rounded-lg border border-border bg-muted/40 p-4 transition hover:border-primary/40 hover:bg-muted/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{attribute.name}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {attribute.key ?? attribute.id}
              </p>
            </div>
            <Badge variant="secondary" size="sm">
              {typeLabel}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {attribute.required ? (
              <Badge variant="primary" size="sm">
                {t('common.required') || 'Zorunlu'}
              </Badge>
            ) : null}
            {attribute.unique ? (
              <Badge variant="primary" size="sm">
                {t('attributes.unique') || 'Unique'}
              </Badge>
            ) : null}
            {attributeTags.map((tag) => (
              <Badge key={tag} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
          {attribute.description ? (
            <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">
              {attribute.description}
            </p>
          ) : null}
        </div>
      );
    },
    [renderAttributeTypeLabel, t],
  );

  const renderGroupCard = useCallback(
    (groupId: string, binding: (typeof bindings)[number] | null, group?: AttributeGroup) => {
      if (!group) {
        return (
          <Card key={groupId} padding="lg" className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TagsIcon className="h-4 w-4 text-primary" />
              {groupId}
            </div>
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              {t('families.attribute_groups.missing_details') ||
                'Attribute grubu bilgisi alınamadı.'}
            </div>
          </Card>
        );
      }

      const attributes = group.attributes ?? [];
      const attributeCount = attributes.length || group.attributeCount || 0;
      const groupTags = group.tags ?? [];

      return (
        <Card key={groupId} padding="lg" className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TagsIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {group.name ?? group.key ?? groupId}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <code>{group.key ?? groupId}</code>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {attributeCount}{' '}
                      {(t('families.attribute_groups.attribute_count_suffix') || 'attribute').toString()}
                    </span>
                  </div>
                </div>
              </div>
              {group.description ? (
                <p className="text-xs text-muted-foreground">{group.description}</p>
              ) : null}
              {groupTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {groupTags.map((tag) => (
                    <Badge key={tag} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {binding?.inherited ? (
                <Badge variant="secondary" size="sm">
                  {t('families.attribute_groups.inherited') || 'Inherited'}
                </Badge>
              ) : null}
              {binding?.required ? (
                <Badge variant="primary" size="sm">
                  {t('families.attribute_groups.required') || 'Required'}
                </Badge>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/attribute-groups/${groupId}`)}
              >
                {t('common.view') || 'Görüntüle'}
              </Button>
              {editMode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveGroup(groupId)}
                  className="text-error hover:text-error"
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('common.remove') || 'Kaldır'}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('families.attribute_groups.attributes_title') || 'Attribute Listesi'}
              </p>
              {attributeCount > 0 ? (
                <Badge variant="secondary" size="sm">
                  {attributeCount}
                </Badge>
              ) : null}
            </div>
            {attributes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                {t('families.attribute_groups.no_attributes') ||
                  'Bu attribute grubuna bağlı attribute bulunmuyor.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {attributes
                  .slice()
                  .sort((a, b) => (a.name || a.key || '').localeCompare(b.name || b.key || ''))
                  .map((attribute) => renderAttributeCard(attribute))}
              </div>
            )}
          </div>
        </Card>
      );
    },
    [
      bindings,
      editMode,
      handleRemoveGroup,
      navigate,
      renderAttributeCard,
      t,
    ],
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
            {t('families.attribute_groups.empty') || 'Tanımlı attribute grubu bulunamadı.'}
          </div>
        </Card>
      );
    }

    return (
      <>
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t('families.attribute_groups.title') || 'Attribute Grupları'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('families.attribute_groups.helper') ||
                  'Family kaydı ile ilişkilendirilecek attribute gruplarını yönetin.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="justify-center">
                {selectedIds.length} / {attributeGroups.length}{' '}
                {(t('families.attribute_groups.selected_suffix') || 'seçili').toString()}
              </Badge>
              <Button size="sm" onClick={handleOpenSelector}>
                <Plus className="mr-2 h-4 w-4" />
                {t('families.attribute_groups.add') || 'Attribute Grubu Ekle'}
              </Button>
            </div>
          </div>

          {resolvedItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-6 py-12 text-center text-sm text-muted-foreground">
              {t('families.attribute_groups.empty_selection') ||
                'Bu family için henüz attribute grubu seçilmedi. Yeni bir attribute grubu eklemek için butonu kullanın.'}
            </div>
          ) : (
            <div className="space-y-4">
              {resolvedItems.map(({ groupId, group, binding }) =>
                renderGroupCard(groupId, binding ?? null, group),
              )}
            </div>
          )}
        </Card>

        <Modal
          isOpen={selectorOpen}
          onClose={handleCloseSelector}
          size="xl"
          title={t('families.attribute_groups.selector_title') || 'Attribute Grubu Seç'}
        >
          <div className="space-y-6">
            <AttributeGroupSelector
              groups={attributeGroups.map((group) => ({
                id: group.id,
                name: group.name,
                description: group.description,
                attributeCount: group.attributeCount ?? group.attributeIds?.length ?? group.attributes?.length ?? 0,
              }))}
              selectedGroups={selectorSelection}
              onSelectionChange={handleSelectorChange}
            />

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleCloseSelector}>
                {t('common.cancel') || 'Vazgeç'}
              </Button>
              <Button onClick={handleApplySelection}>
                {t('common.apply') || 'Uygula'}
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

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

  if (bindings.length === 0 || resolvedItems.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-sm text-muted-foreground">
          {t('families.attribute_groups.empty') ||
            'Bu family için attribute grubu atanmadı.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {resolvedItems.map(({ groupId, binding, group }) =>
        renderGroupCard(groupId, binding, group),
      )}
    </div>
  );
};

const buildFamilyApiEndpoints = (family: Family): APIEndpoint[] => [
  {
    id: 'list-families',
    method: 'GET',
    path: '/api/families',
    description: 'Family kayıtlarını listeleyin.',
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
          id: family.id,
          key: family.key,
          name: family.name,
          attributeGroupIds: family.attributeGroupIds,
        },
      ],
      total: 1,
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.FAMILIES.LIST],
  },
  {
    id: 'get-family',
    method: 'GET',
    path: `/api/families/${family.id}`,
    description: 'Belirli family kaydını getirin.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Family kimliği' },
    ],
    responseExample: {
      id: family.id,
      key: family.key,
      attributeGroupIds: family.attributeGroupIds,
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.FAMILIES.VIEW],
  },
  {
    id: 'update-family',
    method: 'PUT',
    path: `/api/families/${family.id}`,
    description: 'Family kaydını güncelleyin.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Family kimliği' },
    ],
    requestBody: {
      nameLocalizationId: family.nameLocalizationId,
      descriptionLocalizationId: family.descriptionLocalizationId,
      attributeGroupIds: family.attributeGroupIds,
      comment: 'Güncelleme gerekçesi',
    },
    responseExample: {
      id: family.id,
      updatedAt: new Date().toISOString(),
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.FAMILIES.UPDATE],
  },
  {
    id: 'history-family',
    method: 'GET',
    path: '/api/history',
    description: 'Family geçmişini görüntüleyin.',
    parameters: [
      {
        name: 'entityType',
        type: 'string',
        required: true,
        description: 'Entity tipi',
        example: 'Family',
      },
      {
        name: 'entityId',
        type: 'string',
        required: true,
        description: 'Family kimliği',
        example: family.id,
      },
    ],
    responseExample: {
      items: [
        {
          id: 'history-1',
          action: 'updated',
          timestamp: new Date().toISOString(),
          summary: `${family.name} güncellendi`,
        },
      ],
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.FAMILIES.HISTORY],
  },
];

export const FamiliesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const requiredLanguages = useRequiredLanguages();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyDraft, setFamilyDraft] = useState<Family | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nameDraft, setNameDraft] = useState<LocalizationState>({});
  const [descriptionDraft, setDescriptionDraft] = useState<LocalizationState>({});
  const [initialNameState, setInitialNameState] = useState<LocalizationState>({});
  const [initialDescriptionState, setInitialDescriptionState] =
    useState<LocalizationState>({});

  const [selectedAttributeGroupIds, setSelectedAttributeGroupIds] = useState<string[]>([]);
  const [initialAttributeGroupIds, setInitialAttributeGroupIds] = useState<string[]>([]);

  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [attributeGroupsLoading, setAttributeGroupsLoading] = useState(false);
  const [attributeGroupsError, setAttributeGroupsError] = useState<string | null>(null);

  const [familyOptions, setFamilyOptions] = useState<Family[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);

  const [parentFamilyId, setParentFamilyId] = useState<string | null>(null);
  const [initialParentFamilyId, setInitialParentFamilyId] = useState<string | null>(null);
  const [categorySelectionId, setCategorySelectionId] = useState<string | null>(null);
  const [initialCategorySelectionId, setInitialCategorySelectionId] = useState<string | null>(null);
  const [isAbstract, setIsAbstract] = useState<boolean>(false);
  const [initialIsAbstract, setInitialIsAbstract] = useState<boolean>(false);

  const localizationCacheRef = useRef<Record<string, LocalizationRecord>>({});
  const [localizationsLoading, setLocalizationsLoading] = useState(false);
  const [localizationsError, setLocalizationsError] = useState<string | null>(null);

  const canUpdateFamily = hasPermission(PERMISSIONS.CATALOG.FAMILIES.UPDATE);
  const canDeleteFamily = hasPermission(PERMISSIONS.CATALOG.FAMILIES.DELETE);
  const canViewAttributeGroupsTab = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.VIEW);
  const canViewStatistics = hasPermission(PERMISSIONS.CATALOG.FAMILIES.VIEW);
  const canViewDocumentation = hasPermission(PERMISSIONS.CATALOG.FAMILIES.VIEW);
  const canViewApi = hasPermission(PERMISSIONS.CATALOG.FAMILIES.VIEW);
  const canViewHistory = hasPermission(PERMISSIONS.CATALOG.FAMILIES.HISTORY);
  const canViewNotifications = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);

  const [deleting, setDeleting] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ChangeSummary[]>([]);

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
            t('families.attribute_groups_failed') ??
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
    setNameDraft((prev) => buildLocalizationState(prev));
    setDescriptionDraft((prev) => buildLocalizationState(prev));
    setInitialNameState((prev) => buildLocalizationState(prev));
    setInitialDescriptionState((prev) => buildLocalizationState(prev));
  }, [buildLocalizationState]);

  const loadLocalizationDetails = useCallback(
    async (familyData: Family, resetInitial = false) => {
      const nameId = familyData.nameLocalizationId;
      const descriptionId = familyData.descriptionLocalizationId ?? null;

      const ids = [nameId, descriptionId].filter((value): value is string => Boolean(value));

      if (ids.length === 0) {
        const fallbackName = buildLocalizationState(null, familyData.name);
        const fallbackDescription = buildLocalizationState(
          null,
          familyData.description ?? '',
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
              t('families.failed_to_load_localizations') || 'Çeviri kayıtları yüklenemedi.',
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

      const nextNameState = buildLocalizationState(nameTranslations, familyData.name);
      const nextDescriptionState = buildLocalizationState(
        descriptionTranslations,
        familyData.description ?? '',
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

        const [familyResponse, familyListResponse, categoryListResponse] = await Promise.all([
          familiesService.getById(id),
          familiesService.list({ limit: 200 }),
          categoriesService.list({ limit: 200 }),
        ]);

        if (cancelled) {
          return;
        }

        setFamily(familyResponse);
        setFamilyDraft(familyResponse);
        setParentFamilyId(familyResponse.parentFamilyId ?? null);
        setInitialParentFamilyId(familyResponse.parentFamilyId ?? null);
        setCategorySelectionId(familyResponse.categoryId ?? null);
        setInitialCategorySelectionId(familyResponse.categoryId ?? null);

        const attributeIds = Array.isArray(familyResponse.attributeGroupIds)
          ? familyResponse.attributeGroupIds
          : [];

        setSelectedAttributeGroupIds(attributeIds);
        setInitialAttributeGroupIds(attributeIds);
        setFamilyOptions(familyListResponse?.items ?? []);
        setCategoryOptions(categoryListResponse?.items ?? []);
        const abstractFlag = Boolean(familyResponse.isAbstract);
        setIsAbstract(abstractFlag);
        setInitialIsAbstract(abstractFlag);

        await loadLocalizationDetails(familyResponse, true);
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load family', err);
        setError(
          err?.response?.data?.error?.message ??
            t('families.failed_to_load') ??
            'Family bilgisi yüklenemedi.',
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

  const parentFamilyName = useMemo(() => {
    if (!familyDraft?.parentFamilyId) {
      return null;
    }
    return (
      familyOptions.find((item) => item.id === familyDraft.parentFamilyId)?.name ?? null
    );
  }, [familyDraft?.parentFamilyId, familyOptions]);

  const categoryName = useMemo(() => {
    if (!familyDraft?.categoryId) {
      return null;
    }
    return (
      categoryOptions.find((item) => item.id === familyDraft.categoryId)?.name ?? null
    );
  }, [categoryOptions, familyDraft?.categoryId]);

  const extendedFamilyOptions = useMemo(() => {
    if (!familyDraft) {
      return familyOptions;
    }
    const exists = familyOptions.some((item) => item.id === familyDraft.id);
    return exists ? familyOptions : [...familyOptions, familyDraft];
  }, [familyDraft, familyOptions]);

  const resolveFamilyDisplay = useCallback(
    (familyId: string | null | undefined) => {
      if (!familyId) {
        return t('families.root_label') || 'Root';
      }
      const record = extendedFamilyOptions.find((item) => item.id === familyId);
      return record?.name ?? familyId;
    },
    [extendedFamilyOptions, t],
  );

  const resolveCategoryDisplay = useCallback(
    (categoryId: string | null | undefined) => {
      if (!categoryId) {
        return t('families.category_none') || '—';
      }
      return categoryOptions.find((item) => item.id === categoryId)?.name ?? categoryId;
    },
    [categoryOptions, t],
  );

  const resolveAttributeGroupDisplay = useCallback(
    (ids: string[]) => {
      if (!ids.length) {
        return t('families.attribute_groups.empty_short') || '—';
      }
      return ids
        .map(
          (id) => attributeGroups.find((group) => group.id === id)?.name || id,
        )
        .join(', ');
    },
    [attributeGroups, t],
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categoryOptions.forEach((category) => map.set(category.id, category));
    return map;
  }, [categoryOptions]);

  const familyHierarchyTree = useMemo<TreeNode[]>(() => {
    if (extendedFamilyOptions.length === 0) {
      return [];
    }
    return buildHierarchyTree(extendedFamilyOptions, {
      getId: (item) => item.id,
      getParentId: (item) => item.parentFamilyId ?? null,
      getLabel: (item) => item.name?.trim() || item.key,
      getDescription: (item) => {
        const parts = [`${t('families.fields.key') || 'Key'}: ${item.key}`];
        if (item.categoryId) {
          const relatedCategory = categoryMap.get(item.categoryId);
          if (relatedCategory) {
            parts.push(
              `${t('families.fields.category') || 'Category'}: ${
                relatedCategory.name || relatedCategory.key
              }`,
            );
          }
        }
        return parts.join(' • ');
      },
    });
  }, [extendedFamilyOptions, categoryMap, t]);

  const invalidParentIds = useMemo(() => {
    if (!familyDraft) {
      return new Set<string>();
    }
    const blocked = new Set<string>([familyDraft.id]);
    extendedFamilyOptions.forEach((item) => {
      if (item.id !== familyDraft.id && item.hierarchyPath?.includes(familyDraft.id)) {
        blocked.add(item.id);
      }
    });
    return blocked;
  }, [extendedFamilyOptions, familyDraft]);

  const familySelectionTree = useMemo<TreeNode[]>(() => {
    if (extendedFamilyOptions.length === 0) {
      return [];
    }
    return buildHierarchyTree(extendedFamilyOptions, {
      getId: (item) => item.id,
      getParentId: (item) => item.parentFamilyId ?? null,
      getLabel: (item) => item.name?.trim() || item.key,
      getDescription: (item) => `${t('families.fields.key') || 'Key'}: ${item.key}`,
      getDisabled: (item) => invalidParentIds.has(item.id),
    });
  }, [extendedFamilyOptions, invalidParentIds, t]);

  const familyHighlightIds = useMemo(() => {
    if (!familyDraft) {
      return [];
    }
    const base = Array.isArray(familyDraft.hierarchyPath)
      ? familyDraft.hierarchyPath.filter((value): value is string => Boolean(value))
      : [];
    const unique = new Set<string>([...base, familyDraft.id]);
    return Array.from(unique);
  }, [familyDraft]);

  const categoryTree = useMemo<TreeNode[]>(() => {
    if (categoryOptions.length === 0) {
      return [];
    }
    return buildHierarchyTree(categoryOptions, {
      getId: (item) => item.id,
      getParentId: (item) => item.parentCategoryId ?? null,
      getLabel: (item) => item.name?.trim() || item.key,
      getDescription: (item) => `${t('families.fields.key') || 'Key'}: ${item.key}`,
    });
  }, [categoryOptions, t]);

  const displayName = useMemo(() => {
    if (!familyDraft) {
      return '';
    }
    for (const { code } of requiredLanguages) {
      const value = nameDraft[code]?.trim();
      if (value) {
        return value;
      }
    }
    return familyDraft.name ?? familyDraft.key;
  }, [familyDraft, nameDraft, requiredLanguages]);

  const displayDescription = useMemo(() => {
    if (!familyDraft) {
      return '';
    }
    for (const { code } of requiredLanguages) {
      const value = descriptionDraft[code]?.trim();
      if (value) {
        return value;
      }
    }
    return familyDraft.description ?? '';
  }, [descriptionDraft, familyDraft, requiredLanguages]);

  const statisticsData = useMemo<StatisticsType | undefined>(() => {
    if (!familyDraft) {
      return undefined;
    }
    const bindingCount = familyDraft.attributeGroupBindings?.length ?? 0;
    return {
      totalCount: bindingCount,
      activeCount: bindingCount,
      inactiveCount: 0,
      createdThisMonth: 0,
      updatedThisMonth: 0,
      usageCount: bindingCount,
      lastUsed: familyDraft.updatedAt,
      trends: [
        { period: 'Jan', value: bindingCount, change: 0 },
        { period: 'Feb', value: bindingCount, change: 0 },
      ],
      topUsers: familyDraft.updatedBy
        ? [
            {
              userId:
                typeof familyDraft.updatedBy === 'string'
                  ? familyDraft.updatedBy
                  : familyDraft.updatedBy?.id ?? 'user',
              userName:
                typeof familyDraft.updatedBy === 'string'
                  ? familyDraft.updatedBy
                  : familyDraft.updatedBy?.name ??
                    familyDraft.updatedBy?.email ??
                    'System',
              count: bindingCount,
            },
          ]
        : [],
    };
  }, [familyDraft]);

  const documentationSections = useMemo<DocumentationSection[]>(() => {
    if (!familyDraft) {
      return [];
    }
    const bindings = familyDraft.attributeGroupBindings ?? [];
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
        : t('families.attribute_groups.empty_markdown') || 'Henüz attribute grubu bağlı değil.';

    return [
      {
        id: 'overview',
        title: t('families.docs.overview') || 'Genel Bakış',
        content: `# ${familyDraft.name}\n\n- **Key:** \`${familyDraft.key}\`\n- **Attribute Group Count:** ${
          bindings.length
        }\n\n## Attribute Groups\n${list}`,
        order: 0,
        type: 'markdown',
        lastUpdated: familyDraft.updatedAt,
        author:
          typeof familyDraft.updatedBy === 'string'
            ? familyDraft.updatedBy
            : familyDraft.updatedBy?.name ?? familyDraft.updatedBy?.email ?? 'System',
      },
      {
        id: 'usage',
        title: t('families.docs.usage') || 'Kullanım Notları',
        content:
          t('families.docs.usage_content') ||
          `- Family hiyerarşisini korumak için parent atayın.\n- Attribute gruplarını ItemType ve Category seviyelerinde miras alın.`,
        order: 1,
        type: 'markdown',
        lastUpdated: familyDraft.updatedAt,
        author:
          typeof familyDraft.createdBy === 'string'
            ? familyDraft.createdBy
            : familyDraft.createdBy?.name ?? familyDraft.createdBy?.email ?? 'System',
      },
    ];
  }, [familyDraft, t]);

  const apiEndpoints = useMemo<APIEndpoint[]>(() => {
    if (!familyDraft) {
      return [];
    }
    return buildFamilyApiEndpoints(familyDraft);
  }, [familyDraft]);

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
    () => (parentFamilyId ?? null) !== (initialParentFamilyId ?? null),
    [parentFamilyId, initialParentFamilyId],
  );

  const hasCategoryChanges = useMemo(
    () => (categorySelectionId ?? null) !== (initialCategorySelectionId ?? null),
    [categorySelectionId, initialCategorySelectionId],
  );

  const hasIsAbstractChange = useMemo(
    () => isAbstract !== initialIsAbstract,
    [isAbstract, initialIsAbstract],
  );

  const hasChanges =
    (hasNameChanges ||
      hasDescriptionChanges ||
      hasAttributeGroupChanges ||
      hasParentChanges ||
      hasCategoryChanges ||
      hasIsAbstractChange) &&
    !saving;

  const buildChangeSummary = useCallback((): ChangeSummary[] => {
    const summary: ChangeSummary[] = [];
    requiredLanguages.forEach(({ code, label }) => {
      const previous = (initialNameState[code] ?? '').trim();
      const current = (nameDraft[code] ?? '').trim();
      if (previous !== current) {
        summary.push({
          field: `${t('families.fields.name') || 'Name'} (${label})`,
          oldValue: previous || '—',
          newValue: current || '—',
        });
      }
    });
    requiredLanguages.forEach(({ code, label }) => {
      const previous = (initialDescriptionState[code] ?? '').trim();
      const current = (descriptionDraft[code] ?? '').trim();
      if (previous !== current) {
        summary.push({
          field: `${t('families.fields.description') || 'Description'} (${label})`,
          oldValue: previous || '—',
          newValue: current || '—',
        });
      }
    });
    if (hasAttributeGroupChanges) {
      summary.push({
        field: t('families.attribute_groups.title') || 'Attribute Groups',
        oldValue: resolveAttributeGroupDisplay(initialAttributeGroupIds),
        newValue: resolveAttributeGroupDisplay(selectedAttributeGroupIds),
      });
    }
    if (hasParentChanges) {
      summary.push({
        field: t('families.fields.parent') || 'Parent Family',
        oldValue: resolveFamilyDisplay(initialParentFamilyId),
        newValue: resolveFamilyDisplay(parentFamilyId),
      });
    }
    if (hasCategoryChanges) {
      summary.push({
        field: t('families.fields.category') || 'Category',
        oldValue: resolveCategoryDisplay(initialCategorySelectionId),
        newValue: resolveCategoryDisplay(categorySelectionId),
      });
    }
    if (hasIsAbstractChange) {
      const yesLabel = t('common.yes') || 'Evet';
      const noLabel = t('common.no') || 'Hayır';
      summary.push({
        field: t('families.fields.is_abstract') || 'Abstract Family',
        oldValue: initialIsAbstract ? yesLabel : noLabel,
        newValue: isAbstract ? yesLabel : noLabel,
      });
    }
    return summary;
  }, [
    descriptionDraft,
    hasAttributeGroupChanges,
    hasCategoryChanges,
    hasDescriptionChanges,
    hasIsAbstractChange,
    hasNameChanges,
    hasParentChanges,
    initialAttributeGroupIds,
    initialDescriptionState,
    initialNameState,
    initialParentFamilyId,
    initialCategorySelectionId,
    initialIsAbstract,
    nameDraft,
    parentFamilyId,
    categorySelectionId,
    isAbstract,
    requiredLanguages,
    resolveAttributeGroupDisplay,
    resolveCategoryDisplay,
    resolveFamilyDisplay,
    selectedAttributeGroupIds,
    t,
  ]);

  const handleEnterEdit = useCallback(() => {
    if (!family) {
      return;
    }
    setEditMode(true);
  }, [family]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setNameDraft(initialNameState);
    setDescriptionDraft(initialDescriptionState);
    setSelectedAttributeGroupIds(initialAttributeGroupIds);
    setParentFamilyId(initialParentFamilyId);
    setCategorySelectionId(initialCategorySelectionId);
    setIsAbstract(initialIsAbstract);
    if (family) {
      setFamilyDraft(family);
    }
    setLocalizationsError(null);
  }, [
    family,
    initialAttributeGroupIds,
    initialCategorySelectionId,
    initialDescriptionState,
    initialNameState,
    initialParentFamilyId,
    initialIsAbstract,
  ]);

  const handleNameDraftChange = useCallback((code: string, value: string) => {
    setNameDraft((prev) => ({ ...prev, [code]: value }));
  }, []);

  const handleDescriptionDraftChange = useCallback((code: string, value: string) => {
    setDescriptionDraft((prev) => ({ ...prev, [code]: value }));
  }, []);

  const handleParentFamilyChange = useCallback(
    (nextParentId: string | null) => {
      setParentFamilyId(nextParentId);
      setFamilyDraft((prev) => (prev ? { ...prev, parentFamilyId: nextParentId ?? null } : prev));
    },
    [],
  );

  const handleCategoryChange = useCallback(
    (nextCategoryId: string | null) => {
      setCategorySelectionId(nextCategoryId);
      setFamilyDraft((prev) => (prev ? { ...prev, categoryId: nextCategoryId ?? null } : prev));
    },
    [],
  );

  const performSave = useCallback(
    async (comment: string) => {
      if (!family || saving) {
        return;
      }

      try {
        setSaving(true);
        const namespace = 'families';
        const normalizedKey = family.key.toLowerCase();

        let nameLocalizationId = family.nameLocalizationId;
        let descriptionLocalizationId = family.descriptionLocalizationId ?? null;

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
              comment:
                t('families.localization_update_comment') || 'Family çevirisi güncellendi.',
            });
          }
        }

        if (hasDescriptionChanges) {
          const translations = buildTranslationPayload(descriptionDraft);
          if (Object.keys(translations).length === 0) {
            if (descriptionLocalizationId) {
              await localizationsService.update(descriptionLocalizationId, {
                translations: {},
                comment:
                  t('families.localization_update_comment') || 'Family çevirisi güncellendi.',
              });
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
              comment:
                t('families.localization_update_comment') || 'Family çevirisi güncellendi.',
            });
          }
        }

        const payload: Record<string, unknown> = {
          comment,
        };

        if (nameLocalizationId && nameLocalizationId !== family.nameLocalizationId) {
          payload.nameLocalizationId = nameLocalizationId;
        }

        if (
          (descriptionLocalizationId ?? null) !== (family.descriptionLocalizationId ?? null)
        ) {
          payload.descriptionLocalizationId = descriptionLocalizationId;
        }

        if (hasAttributeGroupChanges) {
          payload.attributeGroupIds = selectedAttributeGroupIds;
        }

        if (hasParentChanges) {
          payload.parentFamilyId = parentFamilyId ?? null;
        }

        if (hasCategoryChanges) {
          payload.categoryId = categorySelectionId ?? null;
        }

        if (hasIsAbstractChange) {
          payload.isAbstract = isAbstract;
        }

        let updatedFamily: Family | null = null;

        if (Object.keys(payload).length > 0) {
          updatedFamily = await familiesService.update(family.id, payload);
        } else if (hasNameChanges || hasDescriptionChanges) {
          updatedFamily = await familiesService.getById(family.id);
        } else {
          updatedFamily = family;
        }

        if (updatedFamily) {
          setFamily(updatedFamily);
          setFamilyDraft(updatedFamily);
          setSelectedAttributeGroupIds(updatedFamily.attributeGroupIds ?? []);
          setInitialAttributeGroupIds(updatedFamily.attributeGroupIds ?? []);
          setParentFamilyId(updatedFamily.parentFamilyId ?? null);
          setInitialParentFamilyId(updatedFamily.parentFamilyId ?? null);
          setCategorySelectionId(updatedFamily.categoryId ?? null);
          setInitialCategorySelectionId(updatedFamily.categoryId ?? null);
          const nextAbstract = Boolean(updatedFamily.isAbstract);
          setIsAbstract(nextAbstract);
          setInitialIsAbstract(nextAbstract);
          await loadLocalizationDetails(updatedFamily, true);
          setEditMode(false);
          showToast({
            type: 'success',
            message: t('families.update_success') || 'Family başarıyla güncellendi.',
          });
        }
      } catch (err: any) {
        console.error('Failed to update family', err);
        const message =
          err?.response?.data?.error?.message ??
          err?.message ??
          t('families.update_failed') ??
          'Family güncellenemedi.';
        showToast({ type: 'error', message });
      } finally {
        setSaving(false);
      }
    },
    [
      family,
      saving,
      hasNameChanges,
      hasDescriptionChanges,
      hasAttributeGroupChanges,
      hasIsAbstractChange,
      buildTranslationPayload,
      nameDraft,
      descriptionDraft,
      selectedAttributeGroupIds,
      parentFamilyId,
      categorySelectionId,
      isAbstract,
      loadLocalizationDetails,
      showToast,
      t,
      initialParentFamilyId,
      initialCategorySelectionId,
      hasParentChanges,
      hasCategoryChanges,
      initialIsAbstract,
    ],
  );

  const handleSaveRequest = useCallback(() => {
    if (!hasChanges) {
      showToast({
        type: 'info',
        message: t('families.no_changes') || 'Kaydedilecek değişiklik yok.',
      });
      return;
    }
    const summary = buildChangeSummary();
    if (summary.length === 0) {
      showToast({
        type: 'info',
        message: t('families.no_changes') || 'Kaydedilecek değişiklik yok.',
      });
      return;
    }
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

  const handleDelete = useCallback(async () => {
    if (!family || deleting) {
      return;
    }
    try {
      setDeleting(true);
      await familiesService.delete(family.id);
      showToast({
        type: 'success',
        message: t('families.delete_success') || 'Family başarıyla silindi.',
      });
      navigate('/families');
    } catch (err: any) {
      console.error('Failed to delete family', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        t('families.delete_failed') ??
        'Family silinemedi.';
      showToast({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  }, [deleting, family, navigate, showToast, t]);


  const tabs = useMemo<TabConfig[]>(() => {
    if (!familyDraft) {
      return [];
    }

    return [
      {
        id: 'details',
        label: t('families.details_tab') || 'Detaylar',
        icon: FileText,
        component: FamilyDetailsTab,
        props: {
          family: familyDraft,
          editMode,
          requiredLanguages,
          nameDraft,
          descriptionDraft,
          onNameChange: handleNameDraftChange,
          onDescriptionChange: handleDescriptionDraftChange,
          parentFamilyName,
          categoryName,
          familyTree: familyHierarchyTree,
          familyHighlightIds,
          familySelectionTree: familySelectionTree,
          parentFamilyId,
          onParentFamilyChange: handleParentFamilyChange,
          categoryTree,
          categoryId: categorySelectionId,
          onCategoryChange: handleCategoryChange,
          isAbstract,
          onIsAbstractChange: setIsAbstract,
          localizationsLoading,
          localizationsError,
        },
      },
      {
        id: 'attribute-groups',
        label: t('families.attribute_groups_tab') || 'Attribute Grupları',
        icon: TagsIcon,
        component: FamilyAttributeGroupsTab,
        props: {
          family: familyDraft,
          editMode,
          selectedIds: selectedAttributeGroupIds,
          onSelectionChange: setSelectedAttributeGroupIds,
          attributeGroups,
          loading: attributeGroupsLoading,
          error: attributeGroupsError,
        },
        badge: familyDraft.attributeGroupBindings?.length ?? 0,
        hidden: !canViewAttributeGroupsTab,
      },
      {
        id: 'statistics',
        label: t('families.statistics_tab') || 'İstatistikler',
        icon: BarChart3,
        component: Statistics,
        props: {
          entityType: 'family',
          entityId: familyDraft.id,
          statistics: statisticsData,
        },
        hidden: !canViewStatistics,
      },
      {
        id: 'documentation',
        label: t('families.documentation_tab') || 'Dokümantasyon',
        icon: BookOpen,
        component: Documentation,
        props: {
          entityType: 'family',
          entityId: familyDraft.id,
          sections: documentationSections,
          editMode,
        },
        hidden: !canViewDocumentation,
      },
      {
        id: 'api',
        label: t('families.api_tab') || 'API',
        icon: Globe,
        component: APITester,
        props: {
          entityType: 'family',
          entityId: familyDraft.id,
          endpoints: apiEndpoints,
          editMode,
        },
        hidden: !canViewApi,
      },
      {
        id: 'history',
        label: t('families.history_tab') || 'Geçmiş',
        icon: HistoryIcon,
        component: HistoryTable,
        props: { entityType: 'Family', entityId: familyDraft.id },
        hidden: !canViewHistory,
      },
      {
        id: 'notifications',
        label: t('families.notifications_tab') || 'Bildirimler',
        icon: Activity,
        component: NotificationSettings,
        props: { entityType: 'family', entityId: familyDraft.id },
        hidden: !canViewNotifications,
      },
    ];
  }, [
    familyDraft,
    t,
    editMode,
    requiredLanguages,
    nameDraft,
    descriptionDraft,
    handleNameDraftChange,
    handleDescriptionDraftChange,
    parentFamilyName,
    categoryName,
    familyHierarchyTree,
    familyHighlightIds,
    familySelectionTree,
    parentFamilyId,
    handleParentFamilyChange,
    categoryTree,
    categorySelectionId,
    handleCategoryChange,
    isAbstract,
    localizationsLoading,
    localizationsError,
    selectedAttributeGroupIds,
    attributeGroups,
    attributeGroupsLoading,
    attributeGroupsError,
    canViewAttributeGroupsTab,
    canViewStatistics,
    canViewDocumentation,
    canViewApi,
    canViewHistory,
    canViewNotifications,
    statisticsData,
    documentationSections,
    apiEndpoints,
  ]);

  const headerTitle = useMemo(() => {
    if (!familyDraft) {
      return '';
    }
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl font-bold text-foreground">
            {displayName || familyDraft.key}
          </span>
          <Badge variant="secondary">
            {familyDraft.attributeGroupBindings?.length ?? 0}{' '}
            {t('families.attribute_groups_short') || 'groups'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>
            <Clock className="inline h-3 w-3 mr-1" />
            {new Date(familyDraft.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }, [displayName, familyDraft, t]);

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

  if (error || !family || !familyDraft) {
    return (
      <div className="px-6 py-12">
        <Card padding="lg">
          <div className="text-sm text-error">
            {error ??
              t('families.failed_to_load') ??
              'Family bilgisi yüklenemedi. Lütfen daha sonra tekrar deneyin.'}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={headerTitle}
        subtitle={displayDescription || undefined}
        icon={<Layers className="h-6 w-6 text-white" />}
        tabs={tabs}
        defaultTab="details"
        backUrl="/families"
        editMode={editMode}
        hasChanges={hasChanges}
        onEdit={canUpdateFamily ? handleEnterEdit : undefined}
        onSave={canUpdateFamily ? handleSaveRequest : undefined}
        onCancel={canUpdateFamily ? handleCancelEdit : undefined}
        inlineActions={false}
        onDelete={canDeleteFamily ? handleDelete : undefined}
        deleteLoading={deleting}
        deleteButtonLabel={t('families.delete_action') || 'Family Sil'}
        deleteDialogTitle={
          t('families.delete_title', { name: displayName || familyDraft.key }) ||
          'Family Silinsin mi?'
        }
        deleteDialogDescription={
          t('families.delete_description', { name: displayName || familyDraft.key }) ||
          'Bu family kaydı silinecek. Bu işlem geri alınamaz.'
        }
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={displayName || familyDraft.key}
        title={t('families.review_changes_title') || 'Değişiklikleri Onayla'}
      />
    </>
  );
};

export default FamiliesDetails;
