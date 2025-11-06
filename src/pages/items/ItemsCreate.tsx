import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Stepper } from '../../components/ui/Stepper';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { itemsService } from '../../api/services/items.service';
import { itemTypesService } from '../../api/services/item-types.service';
import { categoriesService } from '../../api/services/categories.service';
import { familiesService } from '../../api/services/families.service';
import { associationsService } from '../../api/services/associations.service';
import { associationTypesService } from '../../api/services/association-types.service';
import { associationRulesService } from '../../api/services/association-rules.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import type {
  ItemType,
  Category,
  Family,
  Item,
  AttributeGroup,
  AttributeGroupBinding,
  AssociationType,
  AssociationRule,
} from '../../types';
import type { Attribute } from '../../types';

type StepId = 'itemType' | 'category' | 'family' | 'associations' | 'attributes' | 'review';

type AssociationDraft = {
  associationTypeId: string;
  targetItemId: string;
  orderIndex?: string;
  metadata?: string;
};

interface FormState {
  itemTypeId: string;
  categoryId: string;
  familyId: string;
  code: string;
  externalCode: string;
  sku: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  associations: AssociationDraft[];
  attributeValues: Record<string, string>;
}

const statusOptions: Array<{ value: FormState['status']; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const defaultAssociationRow: AssociationDraft = {
  associationTypeId: '',
  targetItemId: '',
  orderIndex: '',
  metadata: '',
};

export const ItemsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const steps = useMemo(
    () => [
      {
        id: 'itemType' as StepId,
        name: t('items.create.steps.item_type') || 'Ürün Tipi',
        description: t('items.create.steps.item_type_desc') || 'İşleyeceğiniz item tipini seçin.',
      },
      {
        id: 'category' as StepId,
        name: t('items.create.steps.category') || 'Kategori Seçimi',
        description:
          t('items.create.steps.category_desc') || 'Item için ilgili kategori seçimini yapın.',
      },
      {
        id: 'family' as StepId,
        name: t('items.create.steps.family') || 'Aile Seçimi',
        description:
          t('items.create.steps.family_desc') || 'Seçilen kategoriye bağlı ailelerden birini seçin.',
      },
      {
        id: 'associations' as StepId,
        name: t('items.create.steps.associations') || 'İlişkiler',
        description:
          t('items.create.steps.associations_desc') || 'Diğer itemlarla zorunlu ilişkileri tanımlayın.',
      },
      {
        id: 'attributes' as StepId,
        name: t('items.create.steps.attributes') || 'Öznitelikler',
        description:
          t('items.create.steps.attributes_desc') ||
          'Kod, durum ve zorunlu attribute değerlerini girin.',
      },
      {
        id: 'review' as StepId,
        name: t('items.create.steps.review') || 'Gözden Geçir',
        description: t('items.create.steps.review_desc') || 'Kaydetmeden önce detayları doğrulayın.',
      },
    ],
    [t],
  );

  const [form, setForm] = useState<FormState>({
    itemTypeId: '',
    categoryId: '',
    familyId: '',
    code: '',
    externalCode: '',
    sku: '',
    status: 'draft',
    associations: [],
    attributeValues: {},
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [associationTypes, setAssociationTypes] = useState<AssociationType[]>([]);
  const [associationRulesByType, setAssociationRulesByType] = useState<Record<string, AssociationRule[]>>({});
  const [ruleSelections, setRuleSelections] = useState<Record<string, string[]>>({});
  const [ruleTargetItems, setRuleTargetItems] = useState<Record<string, Item[]>>({});
  const [ruleLoadingState, setRuleLoadingState] = useState<Record<string, boolean>>({});
  const [ruleErrors, setRuleErrors] = useState<Record<string, string | null>>({});
  const [loadingLookup, setLoadingLookup] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      try {
        setLoadingLookup(true);
        setLookupError(null);
        const [
          itemTypeResult,
          categoryResult,
          familyResult,
          attributeGroupResult,
          itemsResult,
          associationTypeResult,
        ] = await Promise.all([
          itemTypesService.list({ limit: 200 }),
          categoriesService.list({ limit: 200 }),
          familiesService.list({ limit: 200 }),
          attributeGroupsService.list(),
          itemsService.list({ limit: 200 }),
          associationTypesService.list(),
        ]);

        if (cancelled) {
          return;
        }

        setItemTypes(itemTypeResult.items ?? []);
        setCategories(categoryResult.items ?? []);
        setFamilies(familyResult.items ?? []);
        setAvailableItems(itemsResult.items ?? []);
        setAttributeGroups(attributeGroupResult ?? []);
        setAssociationTypes(associationTypeResult.items ?? []);
      } catch (error: any) {
        if (!cancelled) {
          console.error('Failed to load item create lookups', error);
          setLookupError(
            error?.response?.data?.error?.message ??
              t('items.create.failed_to_load_dependencies') ??
              'Gerekli veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingLookup(false);
        }
      }
    };

    void fetchLookups();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const selectedItemType = useMemo(
    () => itemTypes.find((type) => type.id === form.itemTypeId) ?? null,
    [itemTypes, form.itemTypeId],
  );
  const availableCategories = useMemo(() => {
    if (!form.itemTypeId) {
      return categories;
    }
    return categories.filter((category) => {
      if (Array.isArray(category.linkedItemTypeIds) && category.linkedItemTypeIds.length > 0) {
        return category.linkedItemTypeIds.includes(form.itemTypeId);
      }
      return !category.defaultItemTypeId || category.defaultItemTypeId === form.itemTypeId;
    });
  }, [categories, form.itemTypeId]);

  const selectedCategory = useMemo(() => {
    if (!form.categoryId) {
      return null;
    }
    return availableCategories.find((category) => category.id === form.categoryId) ?? null;
  }, [availableCategories, form.categoryId]);

  const availableFamilies = useMemo(() => {
    if (!form.categoryId) {
      return [] as Family[];
    }
    return families.filter((family) => (family.categoryId ?? null) === form.categoryId);
  }, [families, form.categoryId]);

  const selectedFamily = useMemo(() => {
    if (!form.familyId) {
      return null;
    }
    return availableFamilies.find((family) => family.id === form.familyId) ?? null;
  }, [availableFamilies, form.familyId]);

  const relevantAssociationTypes = useMemo(() => {
    if (!form.itemTypeId) {
      return [] as AssociationType[];
    }
    return associationTypes.filter(
      (type) => (type.sourceItemTypeId ?? '') === form.itemTypeId,
    );
  }, [associationTypes, form.itemTypeId]);

  const applicableRules = useMemo(() => {
    const results: Array<{ type: AssociationType; rule: AssociationRule }> = [];
    if (!form.categoryId) {
      return results;
    }

    const matchesRule = (rule: AssociationRule) => {
      const categoryMatch =
        (rule.sourceCategoryIds ?? []).length === 0 ||
        (form.categoryId ? (rule.sourceCategoryIds ?? []).includes(form.categoryId) : false);
      const familyMatch =
        (rule.sourceFamilyIds ?? []).length === 0 ||
        (form.familyId ? (rule.sourceFamilyIds ?? []).includes(form.familyId) : false);
      return categoryMatch && familyMatch;
    };

    relevantAssociationTypes.forEach((type) => {
      const rules = associationRulesByType[type.id] ?? [];
      rules.forEach((rule) => {
        if (matchesRule(rule)) {
          results.push({ type, rule });
        }
      });
    });

    return results;
  }, [associationRulesByType, form.categoryId, form.familyId, relevantAssociationTypes]);

  const ruleMetaMap = useMemo(() => {
    const map = new Map<string, { type: AssociationType; rule: AssociationRule }>();
    applicableRules.forEach(({ type, rule }) => map.set(rule.id, { type, rule }));
    return map;
  }, [applicableRules]);

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSelectItemType = useCallback((itemTypeId: string) => {
    setForm((prev) => ({
      ...prev,
      itemTypeId,
      categoryId: '',
      familyId: '',
      associations: [],
      attributeValues: {},
    }));
    setRuleSelections({});
    setRuleTargetItems({});
    setRuleErrors({});
    setRuleLoadingState({});
  }, []);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categoryId,
      familyId: '',
    }));
  }, []);

  const handleSelectFamily = useCallback((familyId: string) => {
    setForm((prev) => ({
      ...prev,
      familyId,
    }));
  }, []);

  const handleAssociationChange = useCallback((index: number, patch: Partial<AssociationDraft>) => {
    setForm((prev) => {
      const next = [...prev.associations];
      next[index] = { ...next[index], ...patch };
      return { ...prev, associations: next };
    });
  }, []);

  const addAssociationRow = useCallback(() => {
    setForm((prev) => ({ ...prev, associations: [...prev.associations, { ...defaultAssociationRow }] }));
  }, []);

  const removeAssociationRow = useCallback((index: number) => {
    setForm((prev) => {
      const next = prev.associations.filter((_, idx) => idx !== index);
      return { ...prev, associations: next };
    });
  }, []);

  const ensureAssociationRules = useCallback(
    async (associationTypeId: string): Promise<AssociationRule[]> => {
      const cached = associationRulesByType[associationTypeId];
      if (cached) {
        return cached;
      }
      const response = await associationRulesService.list({ associationTypeId });
      const rules = response.items ?? [];
      setAssociationRulesByType((prev) => ({ ...prev, [associationTypeId]: rules }));
      return rules;
    },
    [associationRulesByType],
  );

  const hasAssociationGap = useMemo(
    () =>
      form.associations.some(
        (assoc) =>
          (assoc.associationTypeId && !assoc.targetItemId) || (!assoc.associationTypeId && assoc.targetItemId),
      ),
    [form.associations],
  );

  useEffect(() => {
    let cancelled = false;

    const loadRules = async () => {
      for (const type of relevantAssociationTypes) {
        if (cancelled) break;
        if (!associationRulesByType[type.id]) {
          try {
            await ensureAssociationRules(type.id);
          } catch (error) {
            console.error('Failed to load association rules', error);
          }
        }
      }
    };

    if (relevantAssociationTypes.length > 0) {
      void loadRules();
    } else {
      setRuleSelections({});
      setRuleTargetItems({});
      setRuleErrors({});
      setRuleLoadingState({});
    }

    return () => {
      cancelled = true;
    };
  }, [associationRulesByType, ensureAssociationRules, relevantAssociationTypes]);

  useEffect(() => {
    setRuleSelections((prev) => {
      const next: Record<string, string[]> = {};
      applicableRules.forEach(({ rule }) => {
        if (prev[rule.id]) {
          next[rule.id] = prev[rule.id];
        } else {
          next[rule.id] = [];
        }
      });

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }
      return next;
    });

    setRuleTargetItems((prev) => {
      const next: Record<string, Item[]> = {};
      applicableRules.forEach(({ rule }) => {
        if (prev[rule.id]) {
          next[rule.id] = prev[rule.id];
        }
      });
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }
      return next;
    });

    setRuleErrors((prev) => {
      const next: Record<string, string | null> = {};
      applicableRules.forEach(({ rule }) => {
        if (prev.hasOwnProperty(rule.id)) {
          next[rule.id] = prev[rule.id] ?? null;
        } else {
          next[rule.id] = null;
        }
      });
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }
      return next;
    });

    setRuleLoadingState((prev) => {
      const next: Record<string, boolean> = {};
      applicableRules.forEach(({ rule }) => {
        next[rule.id] = prev[rule.id] ?? false;
      });
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }
      return next;
    });
  }, [applicableRules]);

  useEffect(() => {
    let cancelled = false;

    const fetchTargetItems = async () => {
      for (const { type, rule } of applicableRules) {
        if (cancelled) break;
        if (!type.targetItemTypeId || ruleTargetItems[rule.id]) {
          continue;
        }

        setRuleLoadingState((prev) => ({ ...prev, [rule.id]: true }));
        setRuleErrors((prev) => ({ ...prev, [rule.id]: null }));

        try {
          const response = await itemsService.list({
            itemTypeId: type.targetItemTypeId,
            status: 'active',
            limit: 500,
            categoryIds: (rule.targetCategoryIds ?? []).length > 0 ? rule.targetCategoryIds : undefined,
            familyIds: (rule.targetFamilyIds ?? []).length > 0 ? rule.targetFamilyIds : undefined,
          });

          if (!cancelled) {
            const items = (response.items ?? []).filter((item) => {
              const categoryMatch =
                (rule.targetCategoryIds ?? []).length === 0 ||
                (item.categoryId ? (rule.targetCategoryIds ?? []).includes(item.categoryId) : false);
              const familyMatch =
                (rule.targetFamilyIds ?? []).length === 0 ||
                (item.familyId ? (rule.targetFamilyIds ?? []).includes(item.familyId) : false);
              return categoryMatch && familyMatch;
            });
            setRuleTargetItems((prev) => ({ ...prev, [rule.id]: items }));
          }
        } catch (error: any) {
          if (!cancelled) {
            console.error('Failed to load association target items', error);
            setRuleErrors((prev) => ({
              ...prev,
              [rule.id]:
                error?.response?.data?.error?.message ??
                t('items.create.association_targets_failed') ??
                'Hedef itemlar yüklenemedi. Lütfen daha sonra tekrar deneyin.',
            }));
            setRuleTargetItems((prev) => ({ ...prev, [rule.id]: [] }));
          }
        } finally {
          if (!cancelled) {
            setRuleLoadingState((prev) => ({ ...prev, [rule.id]: false }));
          }
        }
      }
    };

    if (applicableRules.length > 0) {
      void fetchTargetItems();
    }

    return () => {
      cancelled = true;
    };
  }, [applicableRules, ruleTargetItems, t]);

  const relevantAttributeGroupIds = useMemo(() => {
    const ids = new Set<string>();
    const collect = (entity?: { attributeGroupIds?: string[]; attributeGroupBindings?: AttributeGroupBinding[] }) => {
      if (!entity) return;
      (entity.attributeGroupIds ?? []).forEach((id) => {
        if (id) ids.add(id);
      });
      (entity.attributeGroupBindings ?? []).forEach((binding) => {
        if (binding.attributeGroupId) {
          ids.add(binding.attributeGroupId);
        }
      });
    };
    collect(selectedItemType ?? undefined);
    collect(selectedCategory ?? undefined);
    collect(selectedFamily ?? undefined);
    return ids;
  }, [selectedItemType, selectedCategory, selectedFamily]);

  const relevantAttributeGroups = useMemo(
    () => attributeGroups.filter((group) => relevantAttributeGroupIds.has(group.id)),
    [attributeGroups, relevantAttributeGroupIds],
  );

  const attributeDefinitions = useMemo(() => {
    const map = new Map<string, Attribute>();
    relevantAttributeGroups.forEach((group) => {
      (group.attributes ?? []).forEach((attribute) => {
        if (!map.has(attribute.id)) {
          map.set(attribute.id, attribute);
        }
      });
    });
    return Array.from(map.values());
  }, [relevantAttributeGroups]);

  useEffect(() => {
    setForm((prev) => {
      const validAttributeIds = new Set(attributeDefinitions.map((attribute) => attribute.id));
      const nextValues: Record<string, string> = {};
      let changed = false;
      Object.entries(prev.attributeValues).forEach(([key, value]) => {
        if (validAttributeIds.has(key)) {
          nextValues[key] = value;
        } else {
          changed = true;
        }
      });
      if (!changed) {
        return prev;
      }
      return {
        ...prev,
        attributeValues: nextValues,
      };
    });
  }, [attributeDefinitions]);

  const handleAttributeValueChange = useCallback((attributeId: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      attributeValues: { ...prev.attributeValues, [attributeId]: value },
    }));
  }, []);

  const isItemTypeStepValid = useMemo(
    () => !loadingLookup && Boolean(form.itemTypeId),
    [loadingLookup, form.itemTypeId],
  );

  const isCategoryStepValid = useMemo(
    () => Boolean(form.itemTypeId) && Boolean(form.categoryId),
    [form.itemTypeId, form.categoryId],
  );

  const isFamilyStepValid = useMemo(
    () => Boolean(form.categoryId) && Boolean(form.familyId),
    [form.categoryId, form.familyId],
  );

  const isAssociationsStepValid = useMemo(() => !hasAssociationGap, [hasAssociationGap]);

  const isAttributesStepValid = useMemo(
    () => form.code.trim().length > 0,
    [form.code],
  );

  const validateCurrentStep = useCallback(() => {
    const step = steps[currentStep];
    if (!step) {
      return false;
    }

    switch (step.id) {
      case 'itemType':
        if (loadingLookup) {
          showToast({ type: 'error', message: t('items.create.validation.loading') || 'Veriler yükleniyor.' });
          return false;
        }
        if (!form.itemTypeId) {
          showToast({
            type: 'error',
            message: t('items.create.validation.item_type') || 'Lütfen bir item type seçin.',
          });
          return false;
        }
        return true;
      case 'category':
        if (!form.itemTypeId) {
          showToast({
            type: 'error',
            message: t('items.create.validation.item_type_first') || 'Önce item tipini seçin.',
          });
          return false;
        }
        if (!form.categoryId) {
          showToast({
            type: 'error',
            message: t('items.create.validation.category_required') || 'Kategori seçimi zorunludur.',
          });
          return false;
        }
        return true;
      case 'family':
        if (!form.categoryId) {
          showToast({
            type: 'error',
            message: t('items.create.validation.category_first') || 'Önce kategori seçin.',
          });
          return false;
        }
        if (!form.familyId) {
          showToast({
            type: 'error',
            message: t('items.create.validation.family_required') || 'Family seçimi zorunludur.',
          });
          return false;
        }
        return true;
      case 'associations':
        for (const { type, rule } of applicableRules) {
          const selections = ruleSelections[rule.id] ?? [];
          if (rule.minTargets > 0 && selections.length < rule.minTargets) {
            const label = rule.name || type.name || type.key;
            showToast({
              type: 'error',
              message:
                t('items.create.validation.rule_min_targets', { rule: label, min: String(rule.minTargets) }) ||
                `"${label}" kuralı için en az ${rule.minTargets} hedef seçilmelidir.`,
            });
            return false;
          }
          if (rule.maxTargets && rule.maxTargets > 0 && selections.length > rule.maxTargets) {
            const label = rule.name || type.name || type.key;
            showToast({
              type: 'error',
              message:
                t('items.create.validation.rule_max_targets', {
                  rule: label,
                  max: String(rule.maxTargets),
                }) ||
                `"${label}" kuralı için en fazla ${rule.maxTargets} hedef seçilebilir.`,
            });
            return false;
          }
        }

        if (hasAssociationGap) {
          showToast({
            type: 'error',
            message:
              t('items.create.validation.association_incomplete') ||
              'Association için hem association type hem de hedef item seçilmelidir.',
          });
          return false;
        }
        return true;
      case 'attributes':
        if (!form.code.trim()) {
          showToast({
            type: 'error',
            message: t('items.create.validation.code_required') || 'Kod alanı zorunludur.',
          });
          return false;
        }
        return true;
      case 'review':
      default:
        return true;
    }
  }, [currentStep, form.categoryId, form.code, form.familyId, form.itemTypeId, hasAssociationGap, loadingLookup, showToast, steps, t]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [validateCurrentStep, steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) {
      return;
    }
    if (!validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev, steps.length - 1));
      return;
    }

    try {
      setSubmitting(true);

      const payload: Record<string, unknown> = {
        itemTypeId: form.itemTypeId,
        categoryId: form.categoryId ? form.categoryId : null,
        familyId: form.familyId ? form.familyId : null,
        code: form.code.trim(),
        externalCode: form.externalCode.trim() || null,
        sku: form.sku.trim() || null,
        status: form.status,
      };

      if (Object.keys(form.attributeValues).length > 0) {
        payload.attributes = form.attributeValues;
      }

      const created = await itemsService.create(payload);

      const ruleAssociations = applicableRules.flatMap(({ type, rule }) => {
        const selections = ruleSelections[rule.id] ?? [];
        return selections.map((targetId, index) => ({
          associationTypeId: type.id,
          targetItemId: targetId,
          orderIndex: index + 1,
        }));
      });

      const manualAssociations = form.associations.filter(
        (assoc) => assoc.associationTypeId.trim().length > 0 && assoc.targetItemId.trim().length > 0,
      );

      for (const assoc of [...ruleAssociations, ...manualAssociations]) {
        let metadataPayload: Record<string, unknown> | undefined;
        const trimmedMetadata = 'metadata' in assoc ? assoc.metadata?.trim() : undefined;
        if (trimmedMetadata) {
          try {
            metadataPayload = JSON.parse(trimmedMetadata);
          } catch (err) {
            metadataPayload = { note: trimmedMetadata };
          }
        }

        let orderIndex: number | undefined;
        if ('orderIndex' in assoc && typeof assoc.orderIndex === 'string') {
          const orderIndexValue = assoc.orderIndex?.trim();
          orderIndex = orderIndexValue ? Number(orderIndexValue) : undefined;
        } else if ('orderIndex' in assoc && typeof assoc.orderIndex === 'number') {
          orderIndex = assoc.orderIndex;
        }

        await associationsService.create({
          associationTypeId: assoc.associationTypeId.trim(),
          sourceItemId: created.id,
          targetItemId: assoc.targetItemId.trim(),
          orderIndex,
          metadata: metadataPayload,
        });
      }

      showToast({
        type: 'success',
        message: t('items.create.success') || 'Item başarıyla oluşturuldu.',
      });

      navigate(`/items/${created.id}`);
    } catch (error: any) {
      console.error('Failed to create item', error);
      showToast({
        type: 'error',
        message:
          error?.response?.data?.error?.message ??
          t('items.create.failed') ??
          'Item oluşturulamadı. Lütfen tekrar deneyin.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [applicableRules, form, navigate, ruleSelections, showToast, submitting, t, validateCurrentStep, steps.length]);

  const renderItemTypeBody = () => {
    if (loadingLookup) {
      return <div className="text-sm text-muted-foreground">{t('common.loading') || 'Yükleniyor...'}</div>;
    }

    if (itemTypes.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('items.create.no_item_types') || 'Henüz item type oluşturulmamış.'}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {itemTypes.map((itemType) => {
          const isSelected = form.itemTypeId === itemType.id;
          return (
            <button
              type="button"
              key={itemType.id}
              onClick={() => handleSelectItemType(itemType.id)}
              className={`relative text-left border-2 rounded-xl p-4 transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border hover:border-primary/60 hover:bg-muted/60'
              }`}
            >
              {isSelected ? (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                    <Check className="h-3 w-3" />
                  </div>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{itemType.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {itemType.description || t('items.create.no_description') || '—'}
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  {(itemType.attributeGroupCount ?? itemType.attributeGroupIds?.length ?? 0).toString()}{' '}
                  {t('items.create.attribute_group_short') || 'groups'}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderCategoryBody = () => {
    if (!form.itemTypeId) {
      return (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('items.create.select_item_type_first') || 'Önce item tipini seçmelisiniz.'}
        </div>
      );
    }

    if (availableCategories.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('items.create.no_categories_for_type') ||
            'Bu item tipi için ilişkilendirilmiş kategori bulunamadı.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableCategories.map((category) => {
            const isSelected = form.categoryId === category.id;
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => handleSelectCategory(category.id)}
                className={`relative text-left border-2 rounded-xl p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border hover:border-primary/60 hover:bg-muted/60'
                }`}
              >
                {isSelected ? (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.description || t('items.create.no_description') || '—'}
                    </p>
                  </div>
                  <Badge variant="secondary" size="sm">
                    {category.attributeGroupCount ?? category.attributeGroupIds?.length ?? 0}{' '}
                    {t('items.create.attribute_group_short') || 'groups'}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFamilyBody = () => {
    if (!form.itemTypeId) {
      return (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('items.create.select_item_type_first') || 'Önce item tipini seçmelisiniz.'}
        </div>
      );
    }

    if (!form.categoryId) {
      return (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('items.create.select_category_first') || 'Önce kategori seçmelisiniz.'}
        </div>
      );
    }

    if (availableFamilies.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('items.create.no_families_for_category') || 'Seçilen kategori için aile bulunamadı.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableFamilies.map((family) => {
            const isSelected = form.familyId === family.id;
            return (
              <button
                type="button"
                key={family.id}
                onClick={() => handleSelectFamily(family.id)}
                className={`relative text-left border-2 rounded-xl p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border hover:border-primary/60 hover:bg-muted/60'
                }`}
              >
                {isSelected ? (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                ) : null}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{family.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {family.description || t('items.create.no_description') || '—'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAttributesBody = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label={t('items.fields.code') || 'Kod'}
          value={form.code}
          onChange={(event) => updateForm({ code: event.target.value })}
          placeholder="ITEM-001"
          required
        />

        <Input
          label={t('items.fields.external_code') || 'Harici Kod'}
          value={form.externalCode}
          onChange={(event) => updateForm({ externalCode: event.target.value })}
          placeholder="ERP-12345"
        />

        <Input
          label={t('items.fields.sku') || 'SKU'}
          value={form.sku}
          onChange={(event) => updateForm({ sku: event.target.value })}
          placeholder="SKU-001"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            {t('items.fields.status') || 'Durum'}
          </label>
          <select
            value={form.status}
            onChange={(event) => updateForm({ status: event.target.value as FormState['status'] })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`items.status_${option.value}`) || option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {t('items.create.attribute_section_title') || 'Öznitelik Değerleri'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {t('items.create.attribute_section_subtitle') ||
              'Seçilen item tipi, kategori ve aileye bağlı attribute değerlerini girin.'}
          </p>
        </div>

        {attributeDefinitions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
            {t('items.create.no_attributes_available') || 'Bu seçim için öznitelik bulunmuyor.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attributeDefinitions.map((attribute) => (
              <div key={attribute.id} className="space-y-2">
                <label className="block text-xs font-medium text-foreground">
                  {attribute.name}
                </label>
                <Input
                  value={form.attributeValues[attribute.id] ?? ''}
                  onChange={(event) => handleAttributeValueChange(attribute.id, event.target.value)}
                  placeholder={attribute.description || attribute.key || attribute.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const handleRuleSelectionChange = useCallback((ruleId: string, values: string[]) => {
    setRuleSelections((prev) => ({ ...prev, [ruleId]: values }));
  }, []);

  const renderAssociationsBody = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t('items.create.associations_hint') ||
          'Association kuralları doğrultusunda hedef item seçimlerini tamamlayın. Kurallar yoksa manuel satırlar ekleyebilirsiniz.'}
      </p>

      {form.itemTypeId ? (
        <div className="space-y-4">
          {applicableRules.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
              {t('items.create.no_association_rules') ||
                'Seçili kategori ve aile için tanımlı association kuralı bulunamadı. Gerekiyorsa manuel satırlar ekleyin.'}
            </div>
          ) : (
            applicableRules.map(({ type, rule }, index) => {
              const selections = ruleSelections[rule.id] ?? [];
              const targetItems = ruleTargetItems[rule.id] ?? [];
              const loading = ruleLoadingState[rule.id];
              const error = ruleErrors[rule.id];
              const ruleLabel = rule.name || type.name || type.key;
              const maxTargets = rule.maxTargets && rule.maxTargets > 0 ? rule.maxTargets : null;

              return (
                <Card key={rule.id}>
                  <CardHeader
                    title={`${type.name || type.key} — ${ruleLabel}`}
                    subtitle={
                      t('items.create.rule_card_summary', {
                        min: String(rule.minTargets),
                        max: maxTargets ? String(maxTargets) : t('items.create.rule_unlimited') || 'Sınırsız',
                      }) || `Min ${rule.minTargets} / Max ${maxTargets ?? '∞'}`
                    }
                  />
                  <div className="px-6 pb-6 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <span>{t('items.create.rule_applies_to') || 'Yön'}: </span>
                      <span className="text-foreground">
                        {rule.appliesTo === 'source'
                          ? t('associations.fields.applies_to_source') || 'Kaynak Bazlı'
                          : t('associations.fields.applies_to_target') || 'Hedef Bazlı'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
                      <div>
                        {t('items.create.rule_source_scope') || 'Kaynak kapsamı'}:{' '}
                        {(rule.sourceCategoryIds ?? []).length === 0 && (rule.sourceFamilyIds ?? []).length === 0
                          ? t('common.all') || 'Tümü'
                          : [
                              ...(rule.sourceCategoryIds ?? []).map(
                                (id) => categories.find((category) => category.id === id)?.name ?? id,
                              ),
                              ...(rule.sourceFamilyIds ?? []).map(
                                (id) => families.find((family) => family.id === id)?.name ?? id,
                              ),
                            ].join(', ')}
                      </div>
                      <div>
                        {t('items.create.rule_target_scope') || 'Hedef kapsamı'}:{' '}
                        {(rule.targetCategoryIds ?? []).length === 0 && (rule.targetFamilyIds ?? []).length === 0
                          ? t('common.all') || 'Tümü'
                          : [
                              ...(rule.targetCategoryIds ?? []).map(
                                (id) => categories.find((category) => category.id === id)?.name ?? id,
                              ),
                              ...(rule.targetFamilyIds ?? []).map(
                                (id) => families.find((family) => family.id === id)?.name ?? id,
                              ),
                            ].join(', ')}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        {t('items.create.select_rule_targets') || 'Hedef itemları seçin'}
                      </label>
                      <select
                        multiple
                        value={selections}
                        onChange={(event) => {
                          let values = Array.from(event.target.selectedOptions, (option) => option.value);
                          if (maxTargets && values.length > maxTargets) {
                            values = values.slice(0, maxTargets);
                            showToast({
                              type: 'warning',
                              message:
                                t('items.create.validation.rule_max_targets', {
                                  rule: ruleLabel,
                                  max: String(maxTargets),
                                }) || `En fazla ${maxTargets} hedef seçebilirsiniz.`,
                            });
                          }
                          handleRuleSelectionChange(rule.id, values);
                        }}
                        className="w-full px-3 py-2 h-40 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {targetItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.code} {item.name ? `- ${item.name}` : ''}
                          </option>
                        ))}
                      </select>
                      <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                        <span>
                          {t('items.create.rule_selection_summary', {
                            selected: String(selections.length),
                            min: String(rule.minTargets),
                            max: maxTargets ? String(maxTargets) : '∞',
                          }) || `Seçilen: ${selections.length} / Min: ${rule.minTargets} / Max: ${maxTargets ?? '∞'}`}
                        </span>
                        {loading ? <Badge variant="outline">{t('common.loading') || 'Yükleniyor...'}</Badge> : null}
                        {!loading && targetItems.length === 0 ? (
                          <Badge variant="destructive">
                            {t('items.create.no_target_items') || 'Uygun hedef item bulunamadı'}
                          </Badge>
                        ) : null}
                      </div>
                      {error ? (
                        <div className="mt-2 rounded border border-destructive bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          {error}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
          {t('items.create.select_item_type_first') || 'Önce item tipini seçmelisiniz.'}
        </div>
      )}

      <Card>
        <CardHeader
          title={t('items.create.manual_associations_title') || 'Manuel Association Satırları'}
          subtitle={
            t('items.create.manual_associations_subtitle') ||
            'Kurallar dışında association eklemek isterseniz bu alanı kullanabilirsiniz.'
          }
          action={
            <Button variant="outline" size="sm" onClick={addAssociationRow}>
              <Plus className="h-4 w-4 mr-2" />
              {t('items.create.add_association') || 'Association Satırı Ekle'}
            </Button>
          }
        />
        <div className="px-6 pb-6 space-y-4">
          {form.associations.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
              {t('items.create.no_manual_associations') ||
                'Manuel association satırı eklemek için yukarıdaki butonu kullanın.'}
            </div>
          ) : null}

          {form.associations.map((assoc, index) => {
            const associationType = associationTypes.find((type) => type.id === assoc.associationTypeId);
            const manualTargets = associationType?.targetItemTypeId
              ? availableItems.filter((item) => item.itemTypeId === associationType.targetItemTypeId)
              : availableItems;

            return (
              <div key={`manual-association-${index}`} className="rounded-lg border border-border p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t('items.fields.association_type_id') || 'Association Tipi'}
                    </label>
                    <select
                      value={assoc.associationTypeId}
                      onChange={(event) =>
                        handleAssociationChange(index, { associationTypeId: event.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('items.create.select_association_type') || 'Association tipi seçin'}</option>
                      {associationTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name || type.key}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t('items.fields.target_item') || 'Hedef Item'}
                    </label>
                    <select
                      value={assoc.targetItemId}
                      onChange={(event) =>
                        handleAssociationChange(index, { targetItemId: event.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('items.create.select_target_item') || 'Hedef item seçin'}</option>
                      {manualTargets.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.code} {item.name ? `- ${item.name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label={t('items.fields.order_index') || 'Order Index'}
                    type="number"
                    value={assoc.orderIndex ?? ''}
                    onChange={(event) => handleAssociationChange(index, { orderIndex: event.target.value })}
                    placeholder="0"
                  />
                  <Textarea
                    label={t('items.fields.metadata') || 'Metadata (JSON veya metin)'}
                    value={assoc.metadata ?? ''}
                    onChange={(event) => handleAssociationChange(index, { metadata: event.target.value })}
                    placeholder='{"quantity": 1}'
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => removeAssociationRow(index)}>
                    {t('common.remove') || 'Kaldır'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const renderReviewBody = () => {
    const ruleReviewData = applicableRules.map(({ type, rule }) => {
      const selections = ruleSelections[rule.id] ?? [];
      const targets = ruleTargetItems[rule.id] ?? [];
      const targetMap = new Map(targets.map((item) => [item.id, item]));
      return {
        type,
        rule,
        selections,
        items: selections.map((id) => targetMap.get(id) ?? null),
      };
    });

    const totalRuleSelections = ruleReviewData.reduce((total, entry) => total + entry.selections.length, 0);
    const manualReviewData = form.associations.filter(
      (assoc) => assoc.associationTypeId && assoc.targetItemId,
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3 border border-border rounded-lg p-4 text-sm">
            <h4 className="text-sm font-semibold text-foreground">
              {t('items.review.summary') || 'Özet'}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.item_type') || 'Item Type'}</span>
              <span className="font-medium text-foreground">
                {selectedItemType?.name || t('items.review.not_selected') || 'Seçilmedi'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.category') || 'Category'}</span>
              <span className="font-medium text-foreground">
                {selectedCategory?.name || t('items.review.not_selected') || 'Seçilmedi'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.family') || 'Family'}</span>
              <span className="font-medium text-foreground">
                {selectedFamily?.name || t('items.review.not_selected') || 'Seçilmedi'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.code') || 'Code'}</span>
              <span className="font-medium text-foreground">{form.code.trim() || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.external_code') || 'External Code'}</span>
              <span className="font-medium text-foreground">{form.externalCode.trim() || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.sku') || 'SKU'}</span>
              <span className="font-medium text-foreground">{form.sku.trim() || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.status') || 'Status'}</span>
              <Badge variant="secondary" size="sm">
                {t(`items.status_${form.status}`) || form.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 border border-border rounded-lg p-4 text-sm">
            <h4 className="text-sm font-semibold text-foreground">
              {t('items.review.attributes') || 'Öznitelikler'}
            </h4>
            {attributeDefinitions.length === 0 ? (
              <div className="text-muted-foreground">
                {t('items.review.no_attributes') || 'Bu seçim için attribute bulunmuyor.'}
              </div>
            ) : (
              attributeDefinitions.map((attribute) => (
                <div key={`review-attr-${attribute.id}`} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{attribute.name}</span>
                  <span className="font-medium text-foreground">
                    {form.attributeValues[attribute.id]?.trim() || '—'}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border border-border rounded-lg p-4 text-sm">
            <h4 className="text-sm font-semibold text-foreground">
              {t('items.review.rule_associations') || 'Kural Bazlı Associations'}
            </h4>
            {totalRuleSelections === 0 ? (
              <div className="text-muted-foreground text-xs">
                {t('items.review.no_rule_associations') || 'Kurallardan doğan association seçimi yapılmadı.'}
              </div>
            ) : (
              ruleReviewData.map((entry, index) => (
                <div key={`review-rule-${entry.rule.id}`} className="border-b border-border pb-3 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {entry.type.name || entry.type.key} — {entry.rule.name || entry.rule.id}
                    </span>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground space-y-1">
                    {entry.selections.map((targetId, targetIndex) => {
                      const item = entry.items[targetIndex];
                      return (
                        <div key={`${entry.rule.id}-${targetId}`} className="flex items-center justify-between">
                          <span>
                            {item
                              ? `${item.code}${item.name ? ` - ${item.name}` : ''}`
                              : targetId}
                          </span>
                          <span className="text-muted-foreground">{t('items.fields.order_index') || 'Order'}: {targetIndex + 1}</span>
                        </div>
                      );
                    })}
                    <div>
                      {t('items.create.rule_selection_summary', {
                        selected: String(entry.selections.length),
                        min: String(entry.rule.minTargets),
                        max:
                          entry.rule.maxTargets && entry.rule.maxTargets > 0
                            ? String(entry.rule.maxTargets)
                            : t('items.create.rule_unlimited') || 'Sınırsız',
                      }) || `Seçilen: ${entry.selections.length} / Min: ${entry.rule.minTargets} / Max: ${entry.rule.maxTargets ?? '∞'}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border border-border rounded-lg p-4 text-sm">
            <h4 className="text-sm font-semibold text-foreground">
              {t('items.review.manual_associations') || 'Manuel Associations'}
            </h4>
            {manualReviewData.length === 0 ? (
              <div className="text-muted-foreground">
                {t('items.review.no_associations') || 'Association eklenmedi.'}
              </div>
            ) : (
              manualReviewData.map((assoc, index) => {
                const targetItem = availableItems.find((item) => item.id === assoc.targetItemId);
                const assocType = associationTypes.find((type) => type.id === assoc.associationTypeId);
                return (
                  <div key={`review-assoc-${index}`} className="border-b border-border pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{assocType?.name || assoc.associationTypeId}</span>
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span>{t('items.fields.target_item') || 'Target'}:</span>{' '}
                      <span className="text-foreground">
                        {targetItem
                          ? `${targetItem.code}${targetItem.name ? ` - ${targetItem.name}` : ''}`
                          : assoc.targetItemId}
                      </span>
                    </div>
                    {assoc.orderIndex && (
                      <div className="text-xs text-muted-foreground">
                        {t('items.fields.order_index') || 'Order'}: {assoc.orderIndex}
                      </div>
                    )}
                    {assoc.metadata && (
                      <div className="text-xs text-muted-foreground">
                        {t('items.fields.metadata') || 'Metadata'}: {assoc.metadata}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) {
      return null;
    }

    switch (step.id) {
      case 'itemType':
        return (
          <Card>
            <CardHeader
              title={t('items.create.item_type_title') || 'Item Type Seçimi'}
              subtitle={t('items.create.item_type_subtitle') || 'Item tipini seçerek başlayın.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderItemTypeBody()}</div>
          </Card>
        );
      case 'category':
        return (
          <Card>
            <CardHeader
              title={t('items.create.category_title') || 'Kategori Seçimi'}
              subtitle={t('items.create.category_subtitle') || 'Item için kullanılacak kategoriyi seçin.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderCategoryBody()}</div>
          </Card>
        );
      case 'family':
        return (
          <Card>
            <CardHeader
              title={t('items.create.family_title') || 'Aile Seçimi'}
              subtitle={t('items.create.family_subtitle') || 'Seçilen kategoriye bağlı ailelerden birini seçin.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderFamilyBody()}</div>
          </Card>
        );
      case 'associations':
        return (
          <Card>
            <CardHeader
              title={t('items.create.associations_title') || 'Associations'}
              subtitle={t('items.create.associations_subtitle') || 'Mevcut itemlarla bağlantılar oluşturun.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderAssociationsBody()}</div>
          </Card>
        );
      case 'attributes':
        return (
          <Card>
            <CardHeader
              title={t('items.create.attributes_title') || 'Öznitelik Değerleri'}
              subtitle={t('items.create.attributes_subtitle') || 'Kod ve attribute alanlarını doldurun.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderAttributesBody()}</div>
          </Card>
        );
      case 'review':
      default:
        return (
          <Card>
            <CardHeader
              title={t('items.create.review_title') || 'Önizleme'}
              subtitle={t('items.create.review_subtitle') || 'Kaydetmeden önce bilgileri doğrulayın.'}
            />
            <div className="px-6 pb-6">{renderReviewBody()}</div>
          </Card>
        );
    }
  };

  const currentStepId = steps[currentStep]?.id as StepId;

  const canProceed = useCallback((): boolean => {
    if (submitting) {
      return false;
    }
    if (currentStep === steps.length - 1) {
      return true;
    }
    switch (currentStepId) {
      case 'itemType':
        return isItemTypeStepValid;
      case 'category':
        return isCategoryStepValid;
      case 'family':
        return isFamilyStepValid;
      case 'associations':
        return isAssociationsStepValid;
      case 'attributes':
        return isAttributesStepValid;
      default:
        return true;
    }
  }, [
    submitting,
    currentStep,
    steps.length,
    currentStepId,
    isItemTypeStepValid,
    isCategoryStepValid,
    isFamilyStepValid,
    isAssociationsStepValid,
    isAttributesStepValid,
  ]);

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      <Card className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
        {loadingLookup ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              {t('common.loading') || 'Yükleniyor...'}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-4">
              {lookupError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {lookupError}
                </div>
              ) : null}
              {renderStepContent()}
            </div>
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
                disabled={!canProceed() || loadingLookup}
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

export default ItemsCreate;
