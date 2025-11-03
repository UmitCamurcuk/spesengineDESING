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
import { itemTypesService } from '../../api/services/item-types.service';
import { familiesService } from '../../api/services/families.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { AttributeGroup, Category, Family, ItemType } from '../../types';
import { buildHierarchyTree } from '../../utils/hierarchy';
import type { TreeNode } from '../../components/ui';

interface FormState {
  key: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  parentCategoryId: string;
  defaultItemTypeId: string;
  linkedItemTypeIds: string[];
  linkedFamilyIds: string[];
  isSystemCategory: boolean;
  attributeGroupIds: string[];
}

type StepId = 'basic' | 'relationships' | 'attributeGroups' | 'preview';

export const CategoriesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const requiredLanguages = useRequiredLanguages();

  const [form, setForm] = useState<FormState>({
    key: '',
    names: {},
    descriptions: {},
    parentCategoryId: '',
    defaultItemTypeId: '',
    linkedItemTypeIds: [],
    linkedFamilyIds: [],
    isSystemCategory: false,
    attributeGroupIds: [],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [attributeGroupSearch, setAttributeGroupSearch] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(
    () => [
      {
        id: 'basic',
        name: t('categories.steps.basic_information') || 'Temel Bilgiler',
        description: t('categories.steps.basic_information_desc') || 'Anahtar ve zorunlu alanlar',
      },
      {
        id: 'relationships',
        name: t('categories.steps.relationships') || 'İlişkiler',
        description: t('categories.steps.relationships_desc') || 'Hiyerarşi ve bağlantılar',
      },
      {
        id: 'attributeGroups',
        name: t('categories.steps.attribute_groups') || 'Attribute Grupları',
        description:
          t('categories.steps.attribute_groups_desc') || 'Bağlanacak attribute gruplarını seçin',
      },
      {
        id: 'preview',
        name: t('categories.steps.preview') || 'Önizleme',
        description: t('categories.steps.preview_desc') || 'Kaydetmeden önce kontrol edin',
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
        return t('categories.fields.name_tr') || `Name (${languageLabel})`;
      }
      if (code === 'en') {
        return t('categories.fields.name_en') || `Name (${languageLabel})`;
      }
      const fallback =
        t('categories.fields.name') !== 'categories.fields.name'
          ? t('categories.fields.name')
          : t('categories.fields.name_en') !== 'categories.fields.name_en'
          ? t('categories.fields.name_en')
          : 'Name';
      return `${fallback} (${languageLabel})`;
    },
    [t],
  );

  const resolveDescriptionLabel = useCallback(
    (code: string, languageLabel: string) => {
      if (code === 'tr') {
        return t('categories.fields.description_tr') || `Description (${languageLabel})`;
      }
      if (code === 'en') {
        return t('categories.fields.description_en') || `Description (${languageLabel})`;
      }
      const fallback =
        t('categories.fields.description') !== 'categories.fields.description'
          ? t('categories.fields.description')
          : t('categories.fields.description_en') !== 'categories.fields.description_en'
          ? t('categories.fields.description_en')
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
        const [categoriesResult, itemTypesResult, familiesResult, attributeGroupsResult] =
          await Promise.all([
            categoriesService.list({ limit: 200 }),
            itemTypesService.list({ limit: 200 }),
            familiesService.list({ limit: 200 }),
            attributeGroupsService.list(),
          ]);
        if (cancelled) {
          return;
        }
        setCategories(categoriesResult.items ?? []);
        setItemTypes(itemTypesResult.items ?? []);
        setFamilies(familiesResult.items ?? []);
        setAttributeGroups(attributeGroupsResult ?? []);
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load category dependencies', err);
        setError(
          err?.response?.data?.error?.message ??
            t('categories.lookup_failed') ??
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

  const sortedItemTypes = useMemo(() => {
    const items = [...itemTypes];
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [itemTypes]);

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

  const attributeGroupMap = useMemo(() => {
    const map = new Map<string, AttributeGroup>();
    attributeGroups.forEach((group) => map.set(group.id, group));
    return map;
  }, [attributeGroups]);

  const itemTypeMap = useMemo(() => {
    const map = new Map<string, ItemType>();
    itemTypes.forEach((itemType) => map.set(itemType.id, itemType));
    return map;
  }, [itemTypes]);

  const familyMap = useMemo(() => {
    const map = new Map<string, Family>();
    families.forEach((family) => map.set(family.id, family));
    return map;
  }, [families]);

  const selectedAttributeGroups = useMemo(
    () =>
      form.attributeGroupIds
        .map((id) => attributeGroupMap.get(id))
        .filter((group): group is AttributeGroup => Boolean(group)),
    [attributeGroupMap, form.attributeGroupIds],
  );

  const selectedItemTypes = useMemo(
    () =>
      form.linkedItemTypeIds
        .map((id) => itemTypeMap.get(id))
        .filter((itemType): itemType is ItemType => Boolean(itemType)),
    [form.linkedItemTypeIds, itemTypeMap],
  );

  const selectedFamilies = useMemo(
    () =>
      form.linkedFamilyIds
        .map((id) => familyMap.get(id))
        .filter((family): family is Family => Boolean(family)),
    [familyMap, form.linkedFamilyIds],
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

  const toggleLinkedItemType = useCallback((itemTypeId: string) => {
    setForm((prev) => {
      const exists = prev.linkedItemTypeIds.includes(itemTypeId);
      const nextLinked = exists
        ? prev.linkedItemTypeIds.filter((id) => id !== itemTypeId)
        : [...prev.linkedItemTypeIds, itemTypeId];
      const nextDefault =
        exists && prev.defaultItemTypeId === itemTypeId ? '' : prev.defaultItemTypeId;
      return {
        ...prev,
        linkedItemTypeIds: nextLinked,
        defaultItemTypeId: nextDefault,
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
        message: t('categories.validation.key') || 'Key zorunludur.',
      });
      return false;
    }

    if (missingLanguage) {
      showToast({
        type: 'error',
        message:
          t('categories.validation.name_language_required', { language: missingLanguage.label }) ||
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
      const namespace = 'categories';

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
        parentCategoryId: form.parentCategoryId ? form.parentCategoryId : null,
        defaultItemTypeId: form.defaultItemTypeId ? form.defaultItemTypeId : null,
        linkedItemTypeIds: form.linkedItemTypeIds,
        linkedFamilyIds: form.linkedFamilyIds,
        isSystemCategory: form.isSystemCategory,
        attributeGroupIds: form.attributeGroupIds,
      };

      const created = await categoriesService.create(payload);

      showToast({
        type: 'success',
        message: t('categories.create_success') || 'Kategori başarıyla oluşturuldu.',
      });

      navigate(`/categories/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create category', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        t('categories.create_failed') ??
        'Kategori oluşturulamadı.';
      showToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }, [
    buildTranslations,
    form.attributeGroupIds,
    form.defaultItemTypeId,
    form.descriptions,
    form.isSystemCategory,
    form.key,
    form.linkedFamilyIds,
    form.linkedItemTypeIds,
    form.names,
    form.parentCategoryId,
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
              title={t('categories.steps.basic_information') || 'Temel Bilgiler'}
              subtitle={t('categories.steps.basic_information_desc') || 'Anahtar ve zorunlu alanlar'}
            />
            <div className="px-6 pb-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('categories.fields.key') || 'Key'}
                      value={form.key}
                      onChange={(event) => updateForm({ key: event.target.value })}
                      placeholder="coffee_products"
                      required
                    />

                    <div className="flex items-center gap-2 mt-2 md:mt-6">
                      <input
                        id="isSystemCategory"
                        type="checkbox"
                        checked={form.isSystemCategory}
                        onChange={(event) => updateForm({ isSystemCategory: event.target.checked })}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <label htmlFor="isSystemCategory" className="text-sm text-foreground">
                        {t('categories.fields.is_system') || 'Sistem Kategorisi'}
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredLanguages.map(({ code, label }) => (
                      <Input
                        key={`category-name-${code}`}
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
                        key={`category-description-${code}`}
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
              title={t('categories.steps.relationships') || 'İlişkiler'}
              subtitle={t('categories.steps.relationships_desc') || 'Hiyerarşi ve bağlantılar'}
            />
            <div className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <TreeSelect
                    label={t('categories.fields.parent') || 'Parent Category'}
                    placeholder={t('categories.root_label') || 'Parent yok (kök kategori)'}
                    options={categoryTreeOptions}
                    value={form.parentCategoryId || null}
                    onChange={(next) => updateForm({ parentCategoryId: next ?? '' })}
                    emptyState={
                      <span className="text-xs text-muted-foreground">
                        {t('categories.relationships.no_parent') || 'Parent kategori bulunamadı.'}
                      </span>
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('categories.fields.default_item_type') || 'Varsayılan Item Type'}
                  </label>
                  <select
                    value={form.defaultItemTypeId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((prev) => {
                        const shouldAttach =
                          value && value.length > 0 && !prev.linkedItemTypeIds.includes(value);
                        return {
                          ...prev,
                          defaultItemTypeId: value,
                          linkedItemTypeIds: shouldAttach
                            ? [...prev.linkedItemTypeIds, value]
                            : prev.linkedItemTypeIds,
                        };
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('categories.select_default_item_type') || 'Seçilmedi'}</option>
                    {sortedItemTypes.map((itemType) => (
                      <option key={itemType.id} value={itemType.id}>
                        {itemType.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('categories.create.default_item_type_helper') ||
                      'Varsayılan item type, opsiyonel olarak kategoriye bağlanır.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {t('categories.fields.linked_item_types') || 'Bağlı Item Types'}
                    </h4>
                    <Badge variant="primary" size="sm">
                      {form.linkedItemTypeIds.length}
                    </Badge>
                  </div>
                  <div className="border border-border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 text-sm">
                    {sortedItemTypes.length === 0 ? (
                      <div className="text-muted-foreground">
                        {t('categories.create.no_item_types') || 'Tanımlı item type bulunamadı.'}
                      </div>
                    ) : (
                      sortedItemTypes.map((itemType) => (
                        <label key={itemType.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.linkedItemTypeIds.includes(itemType.id)}
                            onChange={() => toggleLinkedItemType(itemType.id)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span>{itemType.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {t('categories.fields.linked_families') || 'Bağlı Families'}
                    </h4>
                    <Badge variant="primary" size="sm">
                      {form.linkedFamilyIds.length}
                    </Badge>
                  </div>
                  <TreeSelect
                    options={familyTreeOptions}
                    multiple
                    selectedIds={form.linkedFamilyIds}
                    onSelectionChange={(ids) => updateForm({ linkedFamilyIds: ids })}
                    placeholder={t('categories.create.select_families') || 'Family seçin'}
                    emptyState={
                      <span className="text-xs text-muted-foreground">
                        {t('categories.create.no_families') || 'Tanımlı family bulunamadı.'}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      case 'attributeGroups':
        return (
          <Card>
            <CardHeader
              title={t('categories.steps.attribute_groups') || 'Attribute Grupları'}
              subtitle={
                t('categories.steps.attribute_groups_desc') ||
                'Bağlanacak attribute gruplarını seçin'
              }
            />
            <div className="px-6 pb-6 space-y-4">
              <Input
                label={t('categories.attribute_groups.search_label') || 'Attribute gruplarında ara'}
                placeholder={
                  t('categories.attribute_groups.search_placeholder') ||
                  'İsim, açıklama veya etikete göre filtrele'
                }
                value={attributeGroupSearch}
                onChange={(event) => setAttributeGroupSearch(event.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />

              {filteredAttributeGroups.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {attributeGroups.length === 0
                    ? t('categories.attribute_groups.empty') || 'Tanımlı attribute grubu bulunamadı.'
                    : t('categories.attribute_groups.no_results') || 'Eşleşen attribute grubu bulunamadı.'}
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
                              {t('categories.attribute_groups.attribute_short') || 'attr'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {group.description ||
                              t('categories.attribute_groups.no_description') ||
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
                    {t('categories.attribute_groups.selected_count', {
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
        const selectedParent = form.parentCategoryId
          ? categories.find((category) => category.id === form.parentCategoryId)
          : null;
        const defaultItemType = form.defaultItemTypeId
          ? itemTypeMap.get(form.defaultItemTypeId) ?? null
          : null;

        return (
          <Card>
            <CardHeader
              title={t('categories.steps.preview') || 'Önizleme'}
              subtitle={t('categories.steps.preview_desc') || 'Kaydetmeden önce kontrol edin'}
            />
            <div className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('categories.preview.general') || 'Genel Bilgiler'}
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('categories.fields.key') || 'Key'}</span>
                      <span className="font-medium">{form.key.trim() || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('categories.fields.parent') || 'Parent'}</span>
                      <span className="font-medium">
                        {selectedParent
                          ? selectedParent.name
                          : t('categories.root_label') || 'Parent yok'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('categories.fields.default_item_type') || 'Varsayılan Item Type'}
                      </span>
                      <span className="font-medium">
                        {defaultItemType
                          ? defaultItemType.name
                          : t('categories.select_default_item_type') || 'Seçilmedi'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('categories.fields.is_system') || 'Sistem Kategori'}
                      </span>
                      <span className="font-medium">
                        {form.isSystemCategory ? t('common.yes') || 'Evet' : t('common.no') || 'Hayır'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('categories.preview.translations') || 'Çeviriler'}
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
                    {requiredLanguages.map(({ code, label }) => (
                      <div key={`preview-name-${code}`} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {(t('categories.fields.name') !== 'categories.fields.name'
                              ? t('categories.fields.name')
                              : 'Name') + ` (${label})`}
                          </span>
                          <span className="font-medium">{form.names[code]?.trim() || '—'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(t('categories.fields.description') !== 'categories.fields.description'
                            ? t('categories.fields.description')
                            : 'Description') + ` (${label})`}
                          <span className="ml-1 text-foreground">
                            {form.descriptions[code]?.trim() ||
                              t('categories.preview.no_description') ||
                              '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('categories.preview.linked_item_types') || 'Bağlı Item Types'}
                  </h4>
                  {selectedItemTypes.length === 0 ? (
                    <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                      {t('categories.preview.no_item_types') || 'Item type seçilmedi.'}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedItemTypes.map((itemType) => (
                        <Badge key={itemType.id} variant="secondary" size="sm">
                          {itemType.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t('categories.preview.linked_families') || 'Bağlı Families'}
                  </h4>
                  {selectedFamilies.length === 0 ? (
                    <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                      {t('categories.preview.no_families') || 'Family seçilmedi.'}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedFamilies.map((family) => (
                        <Badge key={family.id} variant="secondary" size="sm">
                          {family.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {t('categories.attribute_groups.title') || 'Attribute Grupları'}
                </h4>
                {selectedAttributeGroups.length === 0 ? (
                  <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                    {t('categories.attribute_groups.none_selected') ||
                      'Bu kategori için attribute grubu seçilmedi.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAttributeGroups.map((group) => (
                      <div key={group.id} className="border border-border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground">{group.name}</span>
                          <Badge variant="primary" size="sm">
                            {group.attributeCount ?? group.attributeIds?.length ?? 0}{' '}
                            {t('categories.attribute_groups.attribute_short') || 'attr'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {group.description ||
                            t('categories.attribute_groups.no_description') ||
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

export default CategoriesCreate;
