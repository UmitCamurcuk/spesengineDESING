import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Hash, Search, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
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
import { familiesService } from '../../api/services/families.service';
import { categoriesService } from '../../api/services/categories.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { AttributeGroup, Category, Family } from '../../types';
import { buildHierarchyTree } from '../../utils/hierarchy';
import type { TreeNode } from '../../components/ui';

interface FormState {
  key: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  parentFamilyId: string;
  categoryId: string;
  isSystemFamily: boolean;
  attributeGroupIds: string[];
}

type StepId = 'basic' | 'relationships' | 'attributeGroups' | 'preview';

export const FamiliesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const requiredLanguages = useRequiredLanguages();

  const [form, setForm] = useState<FormState>({
    key: '',
    names: {},
    descriptions: {},
    parentFamilyId: '',
    categoryId: '',
    isSystemFamily: false,
    attributeGroupIds: [],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [attributeGroupSearch, setAttributeGroupSearch] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(
    () => [
      {
        id: 'basic',
        name: t('families.steps.basic_information') || 'Temel Bilgiler',
        description: t('families.steps.basic_information_desc') || 'Anahtar ve zorunlu alanlar',
      },
      {
        id: 'relationships',
        name: t('families.steps.relationships') || 'İlişkiler',
        description: t('families.steps.relationships_desc') || 'Parent ve kategori seçimi',
      },
      {
        id: 'attributeGroups',
        name: t('families.steps.attribute_groups') || 'Attribute Grupları',
        description: t('families.steps.attribute_groups_desc') || 'Bağlanacak attribute grupları',
      },
      {
        id: 'preview',
        name: t('families.steps.preview') || 'Önizleme',
        description: t('families.steps.preview_desc') || 'Kaydetmeden önce kontrol edin',
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
        return t('families.fields.name_tr') || `Name (${languageLabel})`;
      }
      if (code === 'en') {
        return t('families.fields.name_en') || `Name (${languageLabel})`;
      }
      const fallback =
        t('families.fields.name') !== 'families.fields.name'
          ? t('families.fields.name')
          : t('families.fields.name_en') !== 'families.fields.name_en'
          ? t('families.fields.name_en')
          : 'Name';
      return `${fallback} (${languageLabel})`;
    },
    [t],
  );

  const resolveDescriptionLabel = useCallback(
    (code: string, languageLabel: string) => {
      if (code === 'tr') {
        return t('families.fields.description_tr') || `Description (${languageLabel})`;
      }
      if (code === 'en') {
        return t('families.fields.description_en') || `Description (${languageLabel})`;
      }
      const fallback =
        t('families.fields.description') !== 'families.fields.description'
          ? t('families.fields.description')
          : t('families.fields.description_en') !== 'families.fields.description_en'
          ? t('families.fields.description_en')
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
        const [familiesResult, categoriesResult, attributeGroupsResult] = await Promise.all([
          familiesService.list({ limit: 200 }),
          categoriesService.list({ limit: 200 }),
          attributeGroupsService.list(),
        ]);
        if (cancelled) {
          return;
        }
        setFamilies(familiesResult.items ?? []);
        setCategories(categoriesResult.items ?? []);
        setAttributeGroups(attributeGroupsResult ?? []);
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load family dependencies', err);
        setError(
          err?.response?.data?.error?.message ??
            t('families.lookup_failed') ??
            'Gerekli veriler yüklenemedi.',
        );
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    };

    fetchLookups();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const familyTreeOptions = useMemo<TreeNode[]>(() => {
    if (families.length === 0) {
      return [];
    }
    return buildHierarchyTree(families, {
      getId: (item) => item.id,
      getParentId: (item) => item.parentFamilyId ?? null,
      getLabel: (item) => item.name?.trim() || item.key,
      getDescription: (item) => `${t('families.fields.key') || 'Key'}: ${item.key}`,
    });
  }, [families, t]);

  const categoryTreeOptions = useMemo<TreeNode[]>(() => {
    if (categories.length === 0) {
      return [];
    }
    return buildHierarchyTree(categories, {
      getId: (item) => item.id,
      getParentId: (item) => item.parentCategoryId ?? null,
      getLabel: (item) => item.name?.trim() || item.key,
      getDescription: (item) => `${t('families.fields.key') || 'Key'}: ${item.key}`,
    });
  }, [categories, t]);

  const attributeGroupMap = useMemo(() => {
    const map = new Map<string, AttributeGroup>();
    attributeGroups.forEach((group) => {
      map.set(group.id, group);
    });
    return map;
  }, [attributeGroups]);

  const selectedAttributeGroups = useMemo(
    () =>
      form.attributeGroupIds
        .map((id) => attributeGroupMap.get(id))
        .filter((group): group is AttributeGroup => Boolean(group)),
    [attributeGroupMap, form.attributeGroupIds],
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
        message: t('families.validation.key') || 'Key zorunludur.',
      });
      return false;
    }

    if (missingLanguage) {
      showToast({
        type: 'error',
        message:
          t('families.validation.name_language_required', { language: missingLanguage.label }) ||
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
      const namespace = 'families';

      const nameTranslations = buildTranslations(form.names);
      const nameLocalization = await localizationsService.create({
        namespace,
        key: `${normalizedKey}.name`,
        description: null,
        translations: nameTranslations,
      });

      const descriptionTranslations = buildTranslations(form.descriptions, form.names);
      const effectiveDescriptionTranslations =
        Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : nameTranslations;
      const descriptionLocalization = await localizationsService.create({
        namespace,
        key: `${normalizedKey}.description`,
        description: null,
        translations: effectiveDescriptionTranslations,
      });
      const descriptionLocalizationId = descriptionLocalization.id;

      const payload = {
        key: normalizedKey,
        nameLocalizationId: nameLocalization.id,
        descriptionLocalizationId,
        parentFamilyId: form.parentFamilyId ? form.parentFamilyId : null,
        categoryId: form.categoryId ? form.categoryId : null,
        isSystemFamily: form.isSystemFamily,
        attributeGroupIds: form.attributeGroupIds,
      };

      const created = await familiesService.create(payload);

      showToast({
        type: 'success',
        message: t('families.create_success') || 'Family başarıyla oluşturuldu.',
      });

      navigate(`/families/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create family', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        t('families.create_failed') ??
        'Family oluşturulamadı.';
      showToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }, [
    buildTranslations,
    form.attributeGroupIds,
    form.categoryId,
    form.descriptions,
    form.isSystemFamily,
    form.key,
    form.names,
    form.parentFamilyId,
    navigate,
    showToast,
    submitting,
    t,
    validateBasicStep,
  ]);

  const currentStepId = steps[currentStep]?.id as StepId;

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'basic':
        return (
          <Card>
            <CardHeader
              title={t('families.create_form') || 'Family Bilgileri'}
              subtitle={t('families.create_form_subtitle') || 'Adımları takip ederek family kaydedin.'}
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label={t('families.fields.key') || 'Key'}
                    value={form.key}
                    onChange={(event) => updateForm({ key: event.target.value })}
                    placeholder="coffee_products"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredLanguages.map(({ code, label }) => (
                      <Input
                        key={`family-name-${code}`}
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
                      <div key={`family-description-${code}`}>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          {resolveDescriptionLabel(code, label)}
                        </label>
                        <textarea
                          value={form.descriptions[code] ?? ''}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              descriptions: { ...prev.descriptions, [code]: event.target.value },
                            }))
                          }
                          placeholder={t('families.fields.description_placeholder') || 'Description'}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-foreground">
                    <input
                      id="isSystemFamily"
                      type="checkbox"
                      checked={form.isSystemFamily}
                      onChange={(event) => updateForm({ isSystemFamily: event.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="isSystemFamily">
                      {t('families.fields.is_system') || 'Sistem Family'}
                    </label>
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
              title={t('families.steps.relationships') || 'İlişkiler'}
              subtitle={t('families.steps.relationships_desc') || 'Parent ve kategori seçimi'}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <TreeSelect
                  label={t('families.fields.parent') || 'Parent Family'}
                  placeholder={t('families.root_label') || 'Parent yok (kök family)'}
                  options={familyTreeOptions}
                  value={form.parentFamilyId || null}
                  onChange={(next) => updateForm({ parentFamilyId: next ?? '' })}
                  emptyState={
                    <span className="text-xs text-muted-foreground">
                      {t('families.no_parent_candidates') || 'Parent family bulunamadı.'}
                    </span>
                  }
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t('families.create.parent_helper') ||
                    'Opsiyonel: Mevcut bir family altında konumlandırabilirsiniz.'}
                </p>
              </div>

              <div>
                <TreeSelect
                  label={t('families.fields.category') || 'Kategori'}
                  placeholder={t('families.select_category') || 'Kategori seçin (opsiyonel)'}
                  options={categoryTreeOptions}
                  value={form.categoryId || null}
                  onChange={(next) => updateForm({ categoryId: next ?? '' })}
                  emptyState={
                    <span className="text-xs text-muted-foreground">
                      {t('families.categories_empty') || 'Kategori bulunamadı.'}
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
              title={t('families.steps.attribute_groups') || 'Attribute Grupları'}
              subtitle={t('families.steps.attribute_groups_desc') || 'Bağlanacak attribute grupları'}
            />
            <div className="space-y-4">
              <Input
                label={t('families.attribute_groups.search_label') || 'Attribute gruplarında ara'}
                placeholder={
                  t('families.attribute_groups.search_placeholder') || 'İsim, açıklama veya etikete göre filtrele'
                }
                value={attributeGroupSearch}
                onChange={(event) => setAttributeGroupSearch(event.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />

              {filteredAttributeGroups.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {attributeGroups.length === 0
                    ? t('families.attribute_groups.empty') || 'Tanımlı attribute grubu bulunamadı.'
                    : t('families.attribute_groups.no_results') ||
                      'Eşleşen attribute grubu bulunamadı.'}
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
                              {t('families.attribute_groups.attribute_short') || 'attr'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {group.description ||
                              t('families.attribute_groups.no_description') ||
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
                    {t('families.attribute_groups.selected_count', {
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
      default: {
        const selectedParent = form.parentFamilyId
          ? families.find((family) => family.id === form.parentFamilyId)
          : null;
        const selectedCategory = form.categoryId
          ? categories.find((category) => category.id === form.categoryId)
          : null;

        return (
          <Card>
            <CardHeader
              title={t('families.steps.preview') || 'Önizleme'}
              subtitle={t('families.steps.preview_desc') || 'Kaydetmeden önce kontrol edin'}
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {t('families.preview.general') || 'Genel Bilgiler'}
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('families.fields.key') || 'Key'}
                      </span>
                      <span className="font-medium">{form.key.trim() || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('families.fields.parent') || 'Parent'}
                      </span>
                      <span className="font-medium">
                        {selectedParent
                          ? selectedParent.name
                          : t('families.root_label') || 'Parent yok'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('families.fields.category') || 'Kategori'}
                      </span>
                      <span className="font-medium">
                        {selectedCategory
                          ? selectedCategory.name
                          : t('families.select_category_placeholder') || 'Seçilmedi'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('families.fields.is_system') || 'Sistem Family'}
                      </span>
                      <span className="font-medium">
                        {form.isSystemFamily
                          ? t('common.yes') || 'Evet'
                          : t('common.no') || 'Hayır'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {t('families.preview.translations') || 'Çeviriler'}
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
                    {requiredLanguages.map(({ code, label }) => (
                      <div key={`preview-name-${code}`} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {(t('families.fields.name') !== 'families.fields.name'
                              ? t('families.fields.name')
                              : 'Name') + ` (${label})`}
                          </span>
                          <span className="font-medium">{form.names[code]?.trim() || '—'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(t('families.fields.description') !== 'families.fields.description'
                            ? t('families.fields.description')
                            : 'Description') + ` (${label})`}
                          <span className="ml-1 text-foreground">
                            {form.descriptions[code]?.trim() ||
                              t('families.preview.no_description') ||
                              '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  {t('families.attribute_groups.title') || 'Attribute Grupları'}
                </h4>
                {selectedAttributeGroups.length === 0 ? (
                  <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                    {t('families.attribute_groups.none_selected') ||
                      'Bu family için attribute grubu seçilmedi.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAttributeGroups.map((group) => (
                      <div key={group.id} className="border border-border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground">{group.name}</span>
                          <Badge variant="primary" size="sm">
                            {group.attributeCount ?? group.attributeIds?.length ?? 0}{' '}
                            {t('families.attribute_groups.attribute_short') || 'attr'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {group.description ||
                            t('families.attribute_groups.no_description') ||
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

      {error ? (
        <Card>
          <div className="text-sm text-error">{error}</div>
        </Card>
      ) : null}

      {initialLoading ? (
        <Card>
          <div className="text-sm text-muted-foreground">
            {t('common.loading') || 'Yükleniyor...'}
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">{renderStepContent()}</div>

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
      )}
    </div>
  );
};

export default FamiliesCreate;
