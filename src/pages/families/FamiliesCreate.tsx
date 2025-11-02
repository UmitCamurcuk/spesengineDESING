import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Hash, Search } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Stepper } from '../../components/ui/Stepper';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { familiesService } from '../../api/services/families.service';
import { categoriesService } from '../../api/services/categories.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { AttributeGroup, Category, Family } from '../../types';

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

  const sortedFamilies = useMemo(() => {
    const items = [...families];
    return items.sort((a, b) => {
      const depthDiff = (a.hierarchyPath?.length ?? 0) - (b.hierarchyPath?.length ?? 0);
      if (depthDiff !== 0) {
        return depthDiff;
      }
      return a.name.localeCompare(b.name);
    });
  }, [families]);

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

  const validateBasicStep = useCallback((): boolean => {
    if (!form.key.trim()) {
      showToast({
        type: 'error',
        message: t('families.validation.key') || 'Key zorunludur.',
      });
      return false;
    }

    const missingLanguage = requiredLanguages.find(({ code }) => !form.names[code]?.trim());
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
  }, [form.key, form.names, requiredLanguages, showToast, t]);

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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('families.fields.key') || 'Key'}
                value={form.key}
                onChange={(event) => updateForm({ key: event.target.value })}
                placeholder="coffee_products"
                required
              />

              <div className="flex items-center gap-2 mt-2 md:mt-6">
                <input
                  id="isSystemFamily"
                  type="checkbox"
                  checked={form.isSystemFamily}
                  onChange={(event) => updateForm({ isSystemFamily: event.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isSystemFamily" className="text-sm text-foreground">
                  {t('families.fields.is_system') || 'Sistem Family'}
                </label>
              </div>
            </div>

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
                <Textarea
                  key={`family-description-${code}`}
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
        );

      case 'relationships':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {t('families.fields.parent') || 'Parent Family'}
              </label>
              <select
                value={form.parentFamilyId}
                onChange={(event) => updateForm({ parentFamilyId: event.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  {t('families.root_label') || 'Parent yok (kök family)'}
                </option>
                {sortedFamilies.map((family) => {
                  const depth = family.hierarchyPath?.length ?? 0;
                  const prefix = depth > 0 ? `${'— '.repeat(depth)}${family.name}` : family.name;
                  return (
                    <option key={family.id} value={family.id}>
                      {prefix}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {t('families.create.parent_helper') ||
                  'Opsiyonel: Mevcut bir family altında konumlandırabilirsiniz.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {t('families.fields.category') || 'Kategori'}
              </label>
              <select
                value={form.categoryId}
                onChange={(event) => updateForm({ categoryId: event.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  {t('families.select_category') || 'Kategori seçin (opsiyonel)'}
                </option>
                {sortedCategories.map((category) => {
                  const depth = category.hierarchyPath?.length ?? 0;
                  const prefix =
                    depth > 0 ? `${'— '.repeat(depth)}${category.name}` : category.name;
                  return (
                    <option key={category.id} value={category.id}>
                      {prefix}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        );

      case 'attributeGroups':
        return (
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
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
                <h4 className="text-sm font-semibold text-foreground">
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
              <h4 className="text-sm font-semibold text-foreground">
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
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('families.create_title') || 'Family Oluştur'}
        subtitle={
          t('families.create_subtitle') ||
          'Hiyerarşi ve attribute gruplarıyla yeni bir family oluşturun.'
        }
      />

      <Card>
        <CardHeader
          title={t('families.create_form') || 'Family Bilgileri'}
          subtitle={t('families.create_form_subtitle') || 'Adımları takip ederek family kaydedin.'}
        />
        <div className="px-6 pb-6 space-y-6">
          <Stepper steps={steps} currentStep={currentStep} />

          {error ? <div className="text-sm text-error">{error}</div> : null}

          {initialLoading ? (
            <div className="text-sm text-muted-foreground">
              {t('common.loading') || 'Yükleniyor...'}
            </div>
          ) : (
            <>
              {renderStepContent()}

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0 || submitting}
                >
                  {t('common.back') || 'Geri'}
                </Button>

                <div className="flex items-center gap-2">
                  {currentStep < steps.length - 1 ? (
                    <Button onClick={handleNext} disabled={submitting}>
                      {t('common.next') || 'İleri'}
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting
                        ? t('common.saving') || 'Kaydediliyor...'
                        : t('common.create') || 'Oluştur'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FamiliesCreate;
