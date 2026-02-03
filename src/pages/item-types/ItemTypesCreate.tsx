import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText, Hash, Search } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Stepper } from '../../components/ui/Stepper';
import { TreeSelect } from '../../components/ui/TreeSelect';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { categoriesService } from '../../api/services/categories.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { itemTypesService } from '../../api/services/item-types.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { AttributeGroup, Category } from '../../types';
import { buildHierarchyTree } from '../../utils/hierarchy';
import type { TreeNode } from '../../components/ui';

type LifecycleStatus = 'draft' | 'active' | 'deprecated';

interface FormState {
  key: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  lifecycleStatus: LifecycleStatus;
  isSystemItemType: boolean;
  showInNavbar: boolean;
  categoryIds: string[];
  attributeGroupIds: string[];
}

type StepId = 'basic' | 'relationships' | 'attributeGroups' | 'preview';

export const ItemTypesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const requiredLanguages = useRequiredLanguages();

  const [form, setForm] = useState<FormState>({
    key: '',
    names: {},
    descriptions: {},
    lifecycleStatus: 'draft',
    isSystemItemType: false,
    showInNavbar: false,
    categoryIds: [],
    attributeGroupIds: [],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [attributeGroupSearch, setAttributeGroupSearch] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const categoryTreeOptions = useMemo<TreeNode[]>(() => {
    return buildHierarchyTree(categories, {
      getId: (item) => item.id,
      getParentId: (item) => item.parentCategoryId ?? null,
      getLabel: (item) => item.name,
      getDescription: (item) => item.key,
    });
  }, [categories]);

  const steps = useMemo(
    () => [
      {
        id: 'basic',
        name: t('itemTypes.steps.basic_information') || 'Temel Bilgiler',
        description: t('itemTypes.steps.basic_information_desc') || 'Anahtar, çeviri ve durum seçimi',
      },
      {
        id: 'relationships',
        name: t('itemTypes.steps.relationships') || 'İlişkiler',
        description: t('itemTypes.steps.relationships_desc') || 'Kategori bağlantıları ve durumlar',
      },
      {
        id: 'attributeGroups',
        name: t('itemTypes.steps.attribute_groups') || 'Attribute Grupları',
        description: t('itemTypes.steps.attribute_groups_desc') || 'Bağlanacak attribute gruplarını seçin',
      },
      {
        id: 'preview',
        name: t('itemTypes.steps.preview') || 'Önizleme',
        description: t('itemTypes.steps.preview_desc') || 'Kaydetmeden önce kontrol edin',
      },
    ],
    [t],
  );

  const syncLocalizationState = useCallback(
    (current: Record<string, string>): Record<string, string> => {
      const next: Record<string, string> = {};
      requiredLanguages.forEach(({ code }) => {
        next[code] = current?.[code] ?? '';
      });
      return next;
    },
    [requiredLanguages],
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      names: syncLocalizationState(prev.names),
      descriptions: syncLocalizationState(prev.descriptions),
    }));
  }, [syncLocalizationState]);

  const resolveNameLabel = useCallback(
    (code: string, languageLabel: string) => {
      if (code === 'tr') {
        return t('itemTypes.fields.name_tr') || `Name (${languageLabel})`;
      }
      if (code === 'en') {
        return t('itemTypes.fields.name_en') || `Name (${languageLabel})`;
      }
      const fallback =
        t('itemTypes.fields.name') !== 'itemTypes.fields.name'
          ? t('itemTypes.fields.name')
          : t('itemTypes.fields.name_en') !== 'itemTypes.fields.name_en'
          ? t('itemTypes.fields.name_en')
          : 'Name';
      return `${fallback} (${languageLabel})`;
    },
    [t],
  );

  const resolveDescriptionLabel = useCallback(
    (code: string, languageLabel: string) => {
      if (code === 'tr') {
        return t('itemTypes.fields.description_tr') || `Description (${languageLabel})`;
      }
      if (code === 'en') {
        return t('itemTypes.fields.description_en') || `Description (${languageLabel})`;
      }
      const fallback =
        t('itemTypes.fields.description') !== 'itemTypes.fields.description'
          ? t('itemTypes.fields.description')
          : t('itemTypes.fields.description_en') !== 'itemTypes.fields.description_en'
          ? t('itemTypes.fields.description_en')
          : 'Description';
      return `${fallback} (${languageLabel})`;
    },
    [t],
  );

  const buildTranslations = useCallback(
    (values: Record<string, string>, fallback?: Record<string, string>): Record<string, string> => {
      const result: Record<string, string> = {};
      requiredLanguages.forEach(({ code }) => {
        const primary = values[code]?.trim();
        if (primary) {
          result[code] = primary;
          return;
        }
        const fallbackValue = fallback?.[code]?.trim();
        if (fallbackValue) {
          result[code] = fallbackValue;
        }
      });
      return result;
    },
    [requiredLanguages],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        const [categoriesResult, attributeGroupsResult] = await Promise.all([
          categoriesService.list({ limit: 200 }),
          attributeGroupsService.list(),
        ]);
        if (cancelled) {
          return;
        }
        setCategories(categoriesResult.items ?? []);
        setAttributeGroups(attributeGroupsResult ?? []);
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load item type dependencies', err);
        setError(
          err?.response?.data?.error?.message ??
            t('itemTypes.lookup_failed') ??
            'Gerekli veriler yüklenemedi.',
        );
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    };

    void fetchLookups();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const sortedCategories = useMemo(() => {
    const items = [...categories];
    return items.sort((a, b) => {
      const depthDiff = (a.hierarchyPath?.length ?? 0) - (b.hierarchyPath?.length ?? 0);
      if (depthDiff !== 0) {
        return depthDiff;
      }
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  const attributeGroupMap = useMemo(() => {
    const map = new Map<string, AttributeGroup>();
    attributeGroups.forEach((group) => map.set(group.id, group));
    return map;
  }, [attributeGroups]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);

  const selectedAttributeGroups = useMemo(
    () =>
      form.attributeGroupIds
        .map((id) => attributeGroupMap.get(id))
        .filter((group): group is AttributeGroup => Boolean(group)),
    [attributeGroupMap, form.attributeGroupIds],
  );

  const selectedCategories = useMemo(
    () =>
      form.categoryIds
        .map((id) => categoryMap.get(id))
        .filter((category): category is Category => Boolean(category)),
    [categoryMap, form.categoryIds],
  );

  const filteredAttributeGroups = useMemo(() => {
    const term = attributeGroupSearch.trim().toLowerCase();
    if (!term) {
      return attributeGroups;
    }
    return attributeGroups.filter((group) => {
      const haystack = [
        group.name ?? '',
        group.key ?? '',
        group.description ?? '',
        ...(group.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [attributeGroupSearch, attributeGroups]);

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleAttributeGroup = useCallback((attributeGroupId: string) => {
    setForm((prev) => {
      const exists = prev.attributeGroupIds.includes(attributeGroupId);
      return {
        ...prev,
        attributeGroupIds: exists
          ? prev.attributeGroupIds.filter((id) => id !== attributeGroupId)
          : [...prev.attributeGroupIds, attributeGroupId],
      };
    });
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setForm((prev) => {
      const exists = prev.categoryIds.includes(categoryId);
      return {
        ...prev,
        categoryIds: exists
          ? prev.categoryIds.filter((id) => id !== categoryId)
          : [...prev.categoryIds, categoryId],
      };
    });
  }, []);

  const isKeyMissing = useMemo(() => form.key.trim().length === 0, [form.key]);

  const missingLanguage = useMemo(
    () => requiredLanguages.find(({ code }) => !form.names[code]?.trim()),
    [form.names, requiredLanguages],
  );

  const isBasicStepValid = useMemo(
    () => !isKeyMissing && !missingLanguage,
    [isKeyMissing, missingLanguage],
  );

  const validateBasicStep = useCallback((): boolean => {
    if (isKeyMissing) {
      showToast({
        type: 'error',
        message: t('itemTypes.validation.key') || 'Key zorunludur.',
      });
      return false;
    }

    if (missingLanguage) {
      showToast({
        type: 'error',
        message:
          t('itemTypes.validation.name_language_required', { language: missingLanguage.label }) ||
          `${missingLanguage.label} adı zorunludur.`,
      });
      return false;
    }

    return true;
  }, [isKeyMissing, missingLanguage, showToast, t]);

  const handleNext = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      return;
    }
    const currentStepId = steps[currentStep]?.id as StepId;
    if (currentStepId === 'basic' && !validateBasicStep()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [currentStep, steps, validateBasicStep]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (submitting) {
      return;
    }
    if (!validateBasicStep()) {
      setCurrentStep(0);
      return;
    }

    try {
      setSubmitting(true);
      const normalizedKey = form.key.trim().toLowerCase();
      const namespace = 'item_types';

      const nameTranslations = buildTranslations(form.names);
      const nameLocalization = await localizationsService.create({
        namespace,
        key: `${normalizedKey}.name`,
        description: null,
        translations: nameTranslations,
      });

      let descriptionLocalizationId: string | undefined;
      const descriptionTranslations = buildTranslations(form.descriptions, form.names);
      if (Object.keys(descriptionTranslations).length > 0) {
        const descriptionLocalization = await localizationsService.create({
          namespace,
          key: `${normalizedKey}.description`,
          description: null,
          translations: descriptionTranslations,
        });
        descriptionLocalizationId = descriptionLocalization.id;
      }

      const payload = {
        key: normalizedKey,
        nameLocalizationId: nameLocalization.id,
        descriptionLocalizationId,
        categoryIds: form.categoryIds,
        lifecycleStatus: form.lifecycleStatus,
        isSystemItemType: form.isSystemItemType,
        showInNavbar: form.showInNavbar,
        attributeGroupIds: form.attributeGroupIds,
      };

      const created = await itemTypesService.create(payload);

      showToast({
        type: 'success',
        message: t('itemTypes.create_success') || 'Item type başarıyla oluşturuldu.',
      });

      navigate(`/item-types/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create item type', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        t('itemTypes.create_failed') ??
        'Item type oluşturulamadı.';
      showToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }, [
    buildTranslations,
    form.attributeGroupIds,
    form.categoryIds,
    form.descriptions,
    form.isSystemItemType,
    form.key,
    form.lifecycleStatus,
    form.showInNavbar,
    form.names,
    navigate,
    showToast,
    submitting,
    t,
    validateBasicStep,
  ]);

  const lifecycleLabels = useMemo<Record<LifecycleStatus, string>>(
    () => ({
      draft: t('itemTypes.lifecycle.draft') || 'Taslak',
      active: t('itemTypes.lifecycle.active') || 'Aktif',
      deprecated: t('itemTypes.lifecycle.deprecated') || 'Kullanımdan Kalkan',
    }),
    [t],
  );

  const currentStepId = steps[currentStep]?.id as StepId;

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'basic':
        return (
          <Card>
            <CardHeader
              title={t('itemTypes.steps.basic_information') || 'Temel Bilgiler'}
              subtitle={t('itemTypes.steps.basic_information_desc') || 'Anahtar, çeviri ve durum seçimi'}
            />
            <div className="px-6 pb-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('itemTypes.fields.key') || 'Key'}
                      value={form.key}
                      onChange={(event) => updateForm({ key: event.target.value })}
                      placeholder="coffee_product_type"
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          {t('itemTypes.fields.lifecycle_status') || 'Lifecycle Durumu'}
                        </label>
                        <select
                          value={form.lifecycleStatus}
                          onChange={(event) =>
                            updateForm({ lifecycleStatus: event.target.value as LifecycleStatus })
                          }
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="draft">{lifecycleLabels.draft}</option>
                          <option value="active">{lifecycleLabels.active}</option>
                          <option value="deprecated">{lifecycleLabels.deprecated}</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-3 mt-2 md:mt-6">
                        <label htmlFor="isSystemItemType" className="inline-flex items-center gap-2 text-sm text-foreground">
                          <input
                            id="isSystemItemType"
                            type="checkbox"
                            checked={form.isSystemItemType}
                            onChange={(event) => updateForm({ isSystemItemType: event.target.checked })}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span>{t('itemTypes.fields.is_system') || 'Sistem Item Type'}</span>
                        </label>
                        <label htmlFor="showInNavbar" className="inline-flex items-center gap-2 text-sm text-foreground">
                          <input
                            id="showInNavbar"
                            type="checkbox"
                            checked={form.showInNavbar}
                            onChange={(event) => updateForm({ showInNavbar: event.target.checked })}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span>{t('itemTypes.fields.show_in_navbar') || 'Navbar’da Göster'}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredLanguages.map(({ code, label }) => (
                      <Input
                        key={`item-type-name-${code}`}
                        label={resolveNameLabel(code, label)}
                        value={form.names[code] ?? ''}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            names: { ...prev.names, [code]: event.target.value },
                          }))
                        }
                        required
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredLanguages.map(({ code, label }) => (
                      <Textarea
                        key={`item-type-description-${code}`}
                        label={resolveDescriptionLabel(code, label)}
                        value={form.descriptions[code] ?? ''}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            descriptions: { ...prev.descriptions, [code]: event.target.value },
                          }))
                        }
                        rows={3}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      case 'relationships':
        return (
          <Card>
            <CardHeader
              title={t('itemTypes.steps.relationships') || 'İlişkiler'}
              subtitle={t('itemTypes.steps.relationships_desc') || 'Kategori bağlantıları ve durumlar'}
            />
            <div className="px-6 pb-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('itemTypes.fields.categories') || 'Kategoriler'}
                  </h4>
                  <Badge variant="primary" size="sm">
                    {form.categoryIds.length}
                  </Badge>
                </div>
                <TreeSelect
                  options={categoryTreeOptions}
                  multiple
                  selectedIds={form.categoryIds}
                  onSelectionChange={(ids) => setForm((prev) => ({ ...prev, categoryIds: ids }))}
                  placeholder={t('itemTypes.create.select_categories') || 'Kategori seçin'}
                  emptyState={
                    <span className="text-xs text-muted-foreground">
                      {t('itemTypes.create.no_categories') || 'Tanımlı kategori bulunamadı.'}
                    </span>
                  }
                />
              </div>
            </div>
          </Card>
        );

      case 'attributeGroups':
        return (
          <Card>
            <CardHeader
              title={t('itemTypes.steps.attribute_groups') || 'Attribute Grupları'}
              subtitle={
                t('itemTypes.steps.attribute_groups_desc') ||
                'Bağlanacak attribute gruplarını seçin'
              }
            />
            <div className="px-6 pb-6 space-y-4">
              <Input
                label={t('itemTypes.attribute_groups.search_label') || 'Attribute gruplarında ara'}
                placeholder={
                  t('itemTypes.attribute_groups.search_placeholder') ||
                  'İsim, açıklama veya etikete göre filtrele'
                }
                value={attributeGroupSearch}
                onChange={(event) => setAttributeGroupSearch(event.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />

              {filteredAttributeGroups.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {attributeGroups.length === 0
                    ? t('itemTypes.attribute_groups.empty') || 'Tanımlı attribute grubu bulunamadı.'
                    : t('itemTypes.attribute_groups.no_results') || 'Eşleşen attribute grubu bulunamadı.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAttributeGroups.map((group) => {
                    const isSelected = form.attributeGroupIds.includes(group.id);
                    return (
                      <button
                        type="button"
                        key={group.id}
                        onClick={() => toggleAttributeGroup(group.id)}
                        className={`relative text-left border-2 rounded-xl p-4 transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border hover:border-primary/60 hover:bg-muted/60'
                        }`}
                      >
                        {isSelected ? (
                          <div className="absolute top-3 right-3">
                            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">{group.name}</h4>
                            <Badge variant="primary" size="sm">
                              {group.attributeCount ?? group.attributeIds?.length ?? 0}{' '}
                              {t('itemTypes.attribute_groups.attribute_short') || 'attr'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {group.description ||
                              t('itemTypes.attribute_groups.no_description') ||
                              'Açıklama bulunmuyor.'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            <span>{group.key ?? group.id}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedAttributeGroups.length > 0 ? (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {t('itemTypes.attribute_groups.selected_count', {
                      count: selectedAttributeGroups.length,
                    }) || `Seçilen attribute grubu: ${selectedAttributeGroups.length}`}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAttributeGroups.map((group) => (
                      <Badge key={group.id} variant="secondary" size="sm">
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        );

      case 'preview':
      default:
        return (
          <Card>
            <CardHeader
              title={t('itemTypes.steps.preview') || 'Önizleme'}
              subtitle={t('itemTypes.steps.preview_desc') || 'Kaydetmeden önce kontrol edin'}
            />
            <div className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('itemTypes.preview.general') || 'Genel Bilgiler'}
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('itemTypes.fields.key') || 'Key'}</span>
                      <span className="font-medium">{form.key.trim() || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('itemTypes.fields.lifecycle_status') || 'Lifecycle Durumu'}
                      </span>
                      <span className="font-medium">{lifecycleLabels[form.lifecycleStatus]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('itemTypes.fields.is_system') || 'Sistem Item Type'}
                      </span>
                      <span className="font-medium">
                        {form.isSystemItemType ? t('common.yes') || 'Evet' : t('common.no') || 'Hayır'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('itemTypes.fields.show_in_navbar') || 'Navbar’da Göster'}
                      </span>
                      <span className="font-medium">
                        {form.showInNavbar ? t('common.yes') || 'Evet' : t('common.no') || 'Hayır'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('itemTypes.preview.translations') || 'Çeviriler'}
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
                    {requiredLanguages.map(({ code, label }) => (
                      <div key={`preview-name-${code}`} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {(t('itemTypes.fields.name') !== 'itemTypes.fields.name'
                              ? t('itemTypes.fields.name')
                              : 'Name') + ` (${label})`}
                          </span>
                          <span className="font-medium">{form.names[code]?.trim() || '—'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(t('itemTypes.fields.description') !== 'itemTypes.fields.description'
                            ? t('itemTypes.fields.description')
                            : 'Description') + ` (${label})`}
                          <span className="ml-1 text-foreground">
                            {form.descriptions[code]?.trim() ||
                              t('itemTypes.preview.no_description') ||
                              '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {t('itemTypes.fields.categories') || 'Kategoriler'}
                </h4>
                {selectedCategories.length === 0 ? (
                  <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                    {t('itemTypes.preview.no_categories') || 'Kategori seçilmedi.'}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <Badge key={category.id} variant="secondary" size="sm">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {t('itemTypes.attribute_groups.title') || 'Attribute Grupları'}
                </h4>
                {selectedAttributeGroups.length === 0 ? (
                  <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                    {t('itemTypes.attribute_groups.none_selected') ||
                      'Bu item type için attribute grubu seçilmedi.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAttributeGroups.map((group) => (
                      <div key={group.id} className="border border-border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground">{group.name}</span>
                          <Badge variant="primary" size="sm">
                            {group.attributeCount ?? group.attributeIds?.length ?? 0}{' '}
                            {t('itemTypes.attribute_groups.attribute_short') || 'attr'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {group.description ||
                            t('itemTypes.attribute_groups.no_description') ||
                            'Açıklama bulunmuyor.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
    }
  };

  const canProceed = useCallback((): boolean => {
    if (submitting) {
      return false;
    }
    if (currentStep === steps.length - 1) {
      return true;
    }
    if (currentStepId === 'basic') {
      return isBasicStepValid;
    }
    return true;
  }, [submitting, currentStep, steps.length, currentStepId, isBasicStepValid]);

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      <Card className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          {initialLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              {t('common.loading') || 'Yükleniyor...'}
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-sm text-error">{error}</div>
          ) : (
            <div className="flex-1 overflow-y-auto px-2 pb-6">{renderStepContent()}</div>
          )}
        </div>

        <div className="flex justify-between pt-6 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || submitting}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            {t('common.back') || 'Geri'}
          </Button>

          <div className="flex space-x-3">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!canProceed()}
                leftIcon={<Check className="h-4 w-4" />}
              >
                {t('common.create') || 'Oluştur'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {t('common.continue') || 'Devam'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ItemTypesCreate;
