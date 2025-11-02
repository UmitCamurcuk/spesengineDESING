import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { AttributeGroupSelector } from '../../components/ui/AttributeGroupSelector';
import { HistoryTable } from '../../components/common/HistoryTable';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { familiesService } from '../../api/services/families.service';
import { categoriesService } from '../../api/services/categories.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { Family, Category, AttributeGroup } from '../../types';
import type {
  TabConfig,
  DocumentationSection,
  APIEndpoint,
  Statistics as StatisticsType,
} from '../../types/common';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { PERMISSIONS } from '../../config/permissions';
import type { LocalizationRecord } from '../../api/types/api.types';

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
  localizationsLoading?: boolean;
  localizationsError?: string | null;
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
  localizationsLoading,
  localizationsError,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {localizationsError ? (
        <div className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-4 py-3">
          {localizationsError}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title={t('families.basic_information') || 'Basic Information'}
          subtitle={t('families.basic_information_subtitle') || 'Family için temel alanlar'}
        />
        <div className="px-6 pb-6 space-y-6">
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
                  <p className="text-sm text-foreground">
                    {nameDraft[code]?.trim() || '—'}
                  </p>
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

      <Card>
        <CardHeader
          title={t('families.relationships_title') || 'Relationships'}
          subtitle={
            t('families.relationships_subtitle') ||
            'Hierarşi ve kategori bağlantılarını görüntüleyin'
          }
        />
        <div className="px-6 pb-6 space-y-4 text-sm">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('families.fields.parent') || 'Parent Family'}
            </span>
            <div className="mt-1">
              {family.parentFamilyId ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {parentFamilyName ?? family.parentFamilyId}
                  </Badge>
                  <code className="text-xs text-muted-foreground">
                    {family.parentFamilyId}
                  </code>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {t('families.root_label') || 'Root Family'}
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('families.fields.category') || 'Category'}
            </span>
            <div className="mt-1">
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
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('families.fields.hierarchy_path') || 'Hierarchy Path'}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {family.hierarchyPath.length > 0 ? (
                family.hierarchyPath.map((nodeId) => (
                  <Badge key={nodeId} variant="outline">
                    {nodeId}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('families.root_label') || 'Root Family'}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title={t('families.metadata') || 'Metadata'} />
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                  t('families.unknown_user') ??
                    'Unknown'}
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
                  (t('families.unknown_user') !== 'families.unknown_user' ? t('families.unknown_user') : 'Unknown')}
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

  const attributeGroupMap = useMemo(
    () => new Map(attributeGroups.map((group) => [group.id, group])),
    [attributeGroups],
  );

  const bindings = family.attributeGroupBindings ?? [];

  if (editMode) {
    if (loading) {
      return (
        <Card>
          <div className="px-6 py-8 text-sm text-muted-foreground">
            {t('common.loading') || 'Loading...'}
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <div className="px-6 py-8 text-sm text-error">{error}</div>
        </Card>
      );
    }

    if (attributeGroups.length === 0) {
      return (
        <Card>
          <div className="px-6 py-8 text-sm text-muted-foreground">
            {t('families.attribute_groups.empty') ||
              'Henüz attribute grubu tanımlı değil.'}
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
          attributeCount:
            group.attributeCount ?? group.attributeIds?.length ?? 0,
        }))}
        selectedGroups={selectedIds}
        onSelectionChange={onSelectionChange}
      />
    );
  }

  if (bindings.length === 0) {
    return (
      <Card>
        <div className="px-6 py-8 text-sm text-muted-foreground">
          {t('families.attribute_groups.empty') ||
            'Bu family için attribute grubu atanmadı.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bindings.map((binding) => {
        const group = attributeGroupMap.get(binding.attributeGroupId);
        return (
          <Card key={binding.id} padding="md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                  <p className="text-xs text-muted-foreground mt-2">
                    {group.description}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {binding.inherited ? (
                  <Badge variant="secondary" size="sm">
                    {t('families.attribute_groups.inherited') || 'Inherited'}
                  </Badge>
                ) : null}
                {binding.required ? (
                  <Badge variant="outline" size="sm">
                    {t('families.attribute_groups.required') || 'Required'}
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
            </div>
          </Card>
        );
      })}
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
    description: 'Belirli family kaydını görüntüleyin.',
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
  const requiredLanguages = useRequiredLanguages();
  const { register: registerEditActions } = useEditActionContext();

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

  const [localizationCache, setLocalizationCache] = useState<Record<string, LocalizationRecord>>(
    {},
  );
  const [localizationsLoading, setLocalizationsLoading] = useState(false);
  const [localizationsError, setLocalizationsError] = useState<string | null>(null);

  const canUpdateFamily = hasPermission(PERMISSIONS.CATALOG.FAMILIES.UPDATE);
  const canViewAttributeGroupsTab = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.VIEW);
  const canViewStatistics = hasPermission(PERMISSIONS.CATALOG.FAMILIES.VIEW);
  const canViewDocumentation = hasPermission(PERMISSIONS.CATALOG.FAMILIES.VIEW);
  const canViewApi = hasPermission(PERMISSIONS.CATALOG.FAMILIES.VIEW);
  const canViewHistory = hasPermission(PERMISSIONS.CATALOG.FAMILIES.HISTORY);
  const canViewNotifications = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);

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

  const getPrimaryValue = useCallback(
    (values: LocalizationState, fallback?: string | null): string => {
      for (const { code } of requiredLanguages) {
        const value = values[code]?.trim();
        if (value) {
          return value;
        }
      }
      if (fallback && fallback.trim()) {
        return fallback.trim();
      }
      return (
        Object.values(values)
          .map((value) => value?.trim())
          .find((value) => value && value.length > 0) ?? ''
      );
    },
    [requiredLanguages],
  );

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

      await Promise.all(
        ids.map(async (localizationId) => {
          try {
            if (localizationCache[localizationId]) {
              fetched[localizationId] = localizationCache[localizationId];
              return;
            }
            const record = await localizationsService.getById(localizationId);
            fetched[localizationId] = record;
          } catch (err) {
            console.error('Failed to load localization record', localizationId, err);
            setLocalizationsError(
              t('families.failed_to_load_localizations') ||
                'Çeviri kayıtları yüklenemedi.',
            );
          }
        }),
      );

      setLocalizationsLoading(false);

      const nextCache = { ...localizationCache, ...fetched };
      setLocalizationCache(nextCache);

      const nameTranslations = nameId ? nextCache[nameId]?.translations ?? null : null;
      const descriptionTranslations = descriptionId
        ? nextCache[descriptionId]?.translations ?? null
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
    [buildLocalizationState, localizationCache, t],
  );

  useEffect(() => {
    setNameDraft((prev) => buildLocalizationState(prev));
    setDescriptionDraft((prev) => buildLocalizationState(prev));
    setInitialNameState((prev) => buildLocalizationState(prev));
    setInitialDescriptionState((prev) => buildLocalizationState(prev));
  }, [buildLocalizationState]);

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

        const attributeIds = Array.isArray(familyResponse.attributeGroupIds)
          ? familyResponse.attributeGroupIds
          : [];
        setSelectedAttributeGroupIds(attributeIds);
        setInitialAttributeGroupIds(attributeIds);
        setFamilyOptions(familyListResponse?.items ?? []);
        setCategoryOptions(categoryListResponse?.items ?? []);

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

  const displayName = useMemo(
    () => (familyDraft ? getPrimaryValue(nameDraft, familyDraft.name) : ''),
    [familyDraft, getPrimaryValue, nameDraft],
  );

  const displayDescription = useMemo(
    () =>
      familyDraft
        ? getPrimaryValue(descriptionDraft, familyDraft.description ?? '')
        : '',
    [familyDraft, descriptionDraft, getPrimaryValue],
  );

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

  const hasNameChanges = useMemo(
    () =>
      requiredLanguages.some(
        ({ code }) =>
          (nameDraft[code] ?? '').trim() !== (initialNameState[code] ?? '').trim(),
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
    return current.some((idValue, index) => idValue !== initial[index]);
  }, [initialAttributeGroupIds, selectedAttributeGroupIds]);

  const hasChanges = (hasNameChanges || hasDescriptionChanges || hasAttributeGroupChanges) && !saving;

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
    setLocalizationsError(null);
  }, [initialAttributeGroupIds, initialDescriptionState, initialNameState]);

  const handleSave = useCallback(async () => {
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
                t('families.localization_update_comment') ||
                'Family çevirisi güncellendi.',
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
              t('families.localization_update_comment') ||
              'Family çevirisi güncellendi.',
          });
        }
      }

      const payload: Record<string, unknown> = {};

      if (nameLocalizationId && nameLocalizationId !== family.nameLocalizationId) {
        payload.nameLocalizationId = nameLocalizationId;
      }

      if (
        (descriptionLocalizationId ?? null) !==
        (family.descriptionLocalizationId ?? null)
      ) {
        payload.descriptionLocalizationId = descriptionLocalizationId;
      }

      if (hasAttributeGroupChanges) {
        payload.attributeGroupIds = selectedAttributeGroupIds;
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
  }, [
    family,
    saving,
    hasNameChanges,
    hasDescriptionChanges,
    hasAttributeGroupChanges,
    buildTranslationPayload,
    nameDraft,
    descriptionDraft,
    selectedAttributeGroupIds,
    loadLocalizationDetails,
    showToast,
    t,
  ]);

  useEffect(() => {
    if (!canUpdateFamily) {
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
    canUpdateFamily,
    editMode,
    loading,
    error,
    hasChanges,
    handleEnterEdit,
    handleCancelEdit,
    handleSave,
  ]);

  return (
    <DetailsLayout
      entityId={familyId}
      loading={loading}
      error={error}
      entity={family}
      tabs={tabs}
      title={displayName}
      subtitle={displayDescription}
      onTabChange={setActiveTab}
      activeTab={activeTab}
      tabsConfig={tabsConfig}
    />
  );
};
