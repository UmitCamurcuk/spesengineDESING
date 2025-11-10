import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Layers, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Stepper } from '../../components/ui/Stepper';
import { TreeView, type TreeViewNode } from '../../components/ui/TreeView';
import type { TreeNode } from '../../components/ui/TreeSelect';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { buildHierarchyTree } from '../../utils/hierarchy';
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

type StepId = 'itemType' | 'category' | 'associations' | 'attributes' | 'review';

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
  associations: AssociationDraft[];
  attributeValues: Record<string, string>;
}

const defaultAssociationRow: AssociationDraft = {
  associationTypeId: '',
  targetItemId: '',
  orderIndex: '',
  metadata: '',
};

const cloneTreeNodes = (
  nodes: TreeNode[],
  mapper?: (node: TreeNode) => Partial<TreeViewNode>,
): TreeViewNode[] =>
  nodes.map((node) => {
    const overrides = mapper?.(node) ?? {};
    const baseChildren = node.children ? cloneTreeNodes(node.children as TreeNode[], mapper) : undefined;
    return {
      ...node,
      ...overrides,
      children: overrides.children ?? baseChildren,
    };
  });

export const ItemsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const steps = useMemo(
    () => [
      {
        id: 'itemType' as StepId,
        name: t('items.create.steps.item_type') || 'Öğe Tipi',
        description: t('items.create.steps.item_type_desc') || 'İşleyeceğiniz öğe tipini seçin.',
      },
      {
        id: 'category' as StepId,
        name: t('items.create.steps.category') || 'Kategori ve Aile Seçimi',
        description:
          t('items.create.steps.category_desc') || 'Kategori ve bağlı aile seçimini tamamlayın.',
      },
      {
        id: 'associations' as StepId,
        name: t('items.create.steps.associations') || 'İlişkiler',
        description:
          t('items.create.steps.associations_desc') || 'Diğer öğelerle zorunlu ilişkileri tanımlayın.',
      },
      {
        id: 'attributes' as StepId,
        name: t('items.create.steps.attributes') || 'Öznitelikler',
        description:
          t('items.create.steps.attributes_desc') ||
          'Zorunlu öznitelik değerlerini girin.',
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

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const familiesById = useMemo(
    () => new Map(families.map((family) => [family.id, family])),
    [families],
  );

  const categoryLineage = useMemo(() => {
  if (!selectedCategory) {
    return [] as Category[];
  }
  const lineage: Category[] = [];
  const seen = new Set<string>();
  const enqueue = (category: Category) => {
    if (seen.has(category.id)) {
      return;
    }
    seen.add(category.id);
    lineage.push(category);
  };

  enqueue(selectedCategory);
  (selectedCategory.hierarchyPath ?? []).forEach((ancestorId) => {
    const ancestor = categoriesById.get(ancestorId);
    if (ancestor) {
      enqueue(ancestor);
    }
  });

  let parentId = selectedCategory.parentCategoryId ?? null;
  while (parentId) {
    const parent = categoriesById.get(parentId);
    if (!parent) {
      break;
    }
    enqueue(parent);
    parentId = parent.parentCategoryId ?? null;
  }

  return lineage;
}, [selectedCategory, categoriesById]);

const familyLineage = useMemo(() => {
  if (!selectedFamily) {
    return [] as Family[];
  }
  const lineage: Family[] = [];
  const seen = new Set<string>();
  const enqueue = (family: Family) => {
    if (seen.has(family.id)) {
      return;
    }
    seen.add(family.id);
    lineage.push(family);
  };

  enqueue(selectedFamily);
  (selectedFamily.hierarchyPath ?? []).forEach((ancestorId) => {
    const ancestor = familiesById.get(ancestorId);
    if (ancestor) {
      enqueue(ancestor);
    }
  });

  let parentId = selectedFamily.parentFamilyId ?? null;
  while (parentId) {
    const parent = familiesById.get(parentId);
    if (!parent) {
      break;
    }
    enqueue(parent);
    parentId = parent.parentFamilyId ?? null;
  }

  return lineage;
}, [selectedFamily, familiesById]);

const familiesByCategory = useMemo(() => {
  const map = new Map<string, Family[]>();
  families.forEach((family) => {
      const categoryId = family.categoryId ?? null;
      if (!categoryId) {
        return;
      }
      const list = map.get(categoryId) ?? [];
      list.push(family);
      map.set(categoryId, list);
    });
    return map;
  }, [families]);

  const allowedCategoryIds = useMemo(
    () => new Set(availableCategories.map((category) => category.id)),
    [availableCategories],
  );

  const categoryTreeNodes = useMemo(() => {
    if (!allowedCategoryIds.size) {
      return [];
    }

    const extendedIds = new Set(allowedCategoryIds);
    allowedCategoryIds.forEach((categoryId) => {
      let currentParentId = categoriesById.get(categoryId)?.parentCategoryId ?? null;
      while (currentParentId) {
        if (extendedIds.has(currentParentId)) {
          break;
        }
        extendedIds.add(currentParentId);
        currentParentId = categoriesById.get(currentParentId)?.parentCategoryId ?? null;
      }
    });

    const filteredCategories = categories.filter((category) => extendedIds.has(category.id));
    if (!filteredCategories.length) {
      return [];
    }

    const tree = buildHierarchyTree(filteredCategories, {
      getId: (category) => category.id,
      getParentId: (category) => category.parentCategoryId ?? null,
      getLabel: (category) => category.name || category.key || category.id,
    });

    return cloneTreeNodes(tree, (node) => ({
      selectable: allowedCategoryIds.has(node.id),
    }));
  }, [allowedCategoryIds, categories, categoriesById]);

  const familyTreeNodes = useMemo(() => {
    if (!form.categoryId) {
      return [];
    }
    const familyList = familiesByCategory.get(form.categoryId) ?? [];
    if (familyList.length === 0) {
      return [];
    }
    const tree = buildHierarchyTree(familyList, {
      getId: (family) => family.id,
      getParentId: (family) => family.parentFamilyId ?? null,
      getLabel: (family) => family.name || family.key || family.id,
    });
    return cloneTreeNodes(tree, () => ({
      selectable: true,
      icon: <Layers className="h-3.5 w-3.5 text-muted-foreground" />,
    }));
  }, [familiesByCategory, form.categoryId]);

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

  const handleCategoryTreeSelection = useCallback(
    (ids: string[]) => {
      const nextId = ids[0] ?? '';
      handleSelectCategory(nextId);
    },
    [handleSelectCategory],
  );

  const handleFamilyTreeSelection = useCallback(
    (ids: string[]) => {
      const nextId = ids[0] ?? '';
      handleSelectFamily(nextId);
    },
    [handleSelectFamily],
  );

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
                'Hedef öğeler yüklenemedi. Lütfen daha sonra tekrar deneyin.',
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

  const { allowedAttributeGroupIds, requiredAttributeGroupIds } = useMemo(() => {
    const allowed = new Set<string>();
    const required = new Set<string>();
    const collect = (entity?: { attributeGroupIds?: string[]; attributeGroupBindings?: AttributeGroupBinding[] }) => {
      if (!entity) return;
      (entity.attributeGroupIds ?? []).forEach((id) => {
        if (id) allowed.add(id);
      });
      (entity.attributeGroupBindings ?? []).forEach((binding) => {
        if (binding.attributeGroupId) {
          allowed.add(binding.attributeGroupId);
          if (binding.required) {
            required.add(binding.attributeGroupId);
          }
        }
      });
    };
    collect(selectedItemType ?? undefined);
    categoryLineage.forEach((category) => collect(category));
    familyLineage.forEach((family) => collect(family));
    return {
      allowedAttributeGroupIds: allowed,
      requiredAttributeGroupIds: required,
    };
  }, [selectedItemType, categoryLineage, familyLineage]);

  const relevantAttributeGroups = useMemo(
    () => attributeGroups.filter((group) => allowedAttributeGroupIds.has(group.id)),
    [attributeGroups, allowedAttributeGroupIds],
  );

  const attributeDefinitions = useMemo(() => {
    const map = new Map<string, Attribute>();
    relevantAttributeGroups.forEach((group) => {
      const groupIsRequired = requiredAttributeGroupIds.has(group.id);
      (group.attributes ?? []).forEach((attribute) => {
        const existing = map.get(attribute.id);
        const effectiveRequired = Boolean(groupIsRequired || attribute.required);
        if (!existing) {
          map.set(attribute.id, { ...attribute, required: effectiveRequired });
        } else if (!existing.required && effectiveRequired) {
          map.set(attribute.id, { ...existing, required: true });
        }
      });
    });
    return Array.from(map.values());
  }, [relevantAttributeGroups, requiredAttributeGroupIds]);

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
    () => Boolean(form.itemTypeId) && Boolean(form.categoryId) && Boolean(form.familyId),
    [form.itemTypeId, form.categoryId, form.familyId],
  );

  const isAssociationsStepValid = useMemo(() => !hasAssociationGap, [hasAssociationGap]);

  const isAttributesStepValid = useMemo(() => true, []);

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
            message: t('items.create.validation.item_type') || 'Lütfen bir öğe tipi seçin.',
          });
          return false;
        }
        return true;
      case 'category':
        if (!form.itemTypeId) {
          showToast({
            type: 'error',
            message: t('items.create.validation.item_type_first') || 'Önce öğe tipini seçin.',
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
              'Association için hem association type hem de hedef öğe seçilmelidir.',
          });
          return false;
        }
        return true;
      case 'attributes':
        return true;
      case 'review':
      default:
        return true;
    }
  }, [currentStep, form.categoryId, form.familyId, form.itemTypeId, hasAssociationGap, loadingLookup, showToast, steps, t]);

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
        message: t('items.create.success') || 'Öğe başarıyla oluşturuldu.',
      });

      navigate(`/items/${created.id}`);
    } catch (error: any) {
      console.error('Failed to create item', error);
      showToast({
        type: 'error',
        message:
          error?.response?.data?.error?.message ??
          t('items.create.failed') ??
          'Öğe oluşturulamadı. Lütfen tekrar deneyin.',
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
          {t('items.create.no_item_types') || 'Henüz öğe tipi oluşturulmamış.'}
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
          {t('items.create.select_item_type_first') || 'Önce öğe tipini seçmelisiniz.'}
        </div>
      );
    }

    if (categoryTreeNodes.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('items.create.no_categories_for_type') ||
            'Bu öğe tipi için ilişkilendirilmiş kategori bulunamadı.'}
        </div>
      );
    }

    const categoryEmptyState = (
      <span className="text-xs text-muted-foreground">
        {t('items.create.no_categories_for_type') ||
          'Bu öğe tipi için ilişkilendirilmiş kategori bulunamadı.'}
      </span>
    );

    const familyEmptyState = (
      <span className="text-xs text-muted-foreground">
        {t('items.create.no_families_for_category') || 'Seçilen kategori için aile bulunamadı.'}
      </span>
    );

    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-foreground mb-2">
              {t('items.create.category_tree_title') || 'Kategori Ağacı'}
            </p>
            <TreeView
              nodes={categoryTreeNodes}
              mode="edit"
              selectionMode="single"
              selectedIds={form.categoryId ? [form.categoryId] : []}
              onSelectionChange={handleCategoryTreeSelection}
              className="border border-border rounded-xl p-2 max-h-80 overflow-y-auto"
              emptyState={categoryEmptyState}
              defaultExpandAll
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t('items.create.category_tree_hint') ||
                'Seçilen kategoriler hangi ailelerin listeleneceğini belirler.'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-2">
              {t('items.create.family_tree_title') || 'Aile Ağacı'}
            </p>
            {form.categoryId ? (
              familyTreeNodes.length > 0 ? (
                <TreeView
                  nodes={familyTreeNodes}
                  mode="edit"
                  selectionMode="single"
                  selectedIds={form.familyId ? [form.familyId] : []}
                  onSelectionChange={handleFamilyTreeSelection}
                  className="border border-border rounded-xl p-2 max-h-80 overflow-y-auto"
                  emptyState={familyEmptyState}
                  defaultExpandAll
                />
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                  {t('items.create.no_families_for_category') || 'Seçilen kategori için aile bulunamadı.'}
                </div>
              )
            ) : (
              <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                {t('items.create.select_category_first') || 'Önce kategori seçmelisiniz.'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t('items.create.family_tree_hint') || 'Kategori tercihinden sonra bağlı aileleri ağaçtan seçin.'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderAttributesBody = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {t('items.create.attribute_section_title') || 'Öznitelik Değerleri'}
          </h4>
          <p className="text-xs text-muted-foreground">
              {t('items.create.attribute_section_subtitle') ||
                'Seçilen öğe tipi, kategori ve aileye bağlı öznitelik değerlerini girin.'}
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
                  {attribute.required ? (
                    <span className="ml-1 text-[10px] font-semibold text-destructive" aria-label={t('common.required') || 'Required'}>
                      *
                    </span>
                  ) : null}
                </label>
                <Input
                  value={form.attributeValues[attribute.id] ?? ''}
                  onChange={(event) => handleAttributeValueChange(attribute.id, event.target.value)}
                  placeholder={attribute.description || attribute.key || attribute.id}
                  required={attribute.required}
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
          'Association kuralları doğrultusunda hedef öğe seçimlerini tamamlayın. Kurallar yoksa manuel satırlar ekleyebilirsiniz.'}
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
                        {t('items.create.select_rule_targets') || 'Hedef öğeleri seçin'}
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
                            {t('items.create.no_target_items') || 'Uygun hedef öğe bulunamadı'}
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
          {t('items.create.select_item_type_first') || 'Önce öğe tipini seçmelisiniz.'}
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
                      {t('items.fields.target_item') || 'Hedef Öğe'}
                    </label>
                    <select
                      value={assoc.targetItemId}
                      onChange={(event) =>
                        handleAssociationChange(index, { targetItemId: event.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('items.create.select_target_item') || 'Hedef öğe seçin'}</option>
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
              <span className="text-muted-foreground">{t('items.fields.item_type') || 'Öğe Tipi'}</span>
              <span className="font-medium text-foreground">
                {selectedItemType?.name || t('items.review.not_selected') || 'Seçilmedi'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.category') || 'Kategori'}</span>
              <span className="font-medium text-foreground">
                {selectedCategory?.name || t('items.review.not_selected') || 'Seçilmedi'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('items.fields.family') || 'Aile'}</span>
              <span className="font-medium text-foreground">
                {selectedFamily?.name || t('items.review.not_selected') || 'Seçilmedi'}
              </span>
            </div>
          </div>

          <div className="space-y-3 border border-border rounded-lg p-4 text-sm">
            <h4 className="text-sm font-semibold text-foreground">
              {t('items.review.attributes') || 'Öznitelikler'}
            </h4>
            {attributeDefinitions.length === 0 ? (
              <div className="text-muted-foreground">
                {t('items.review.no_attributes') || 'Bu seçim için öznitelik bulunmuyor.'}
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
                          <span className="text-muted-foreground">{t('items.fields.order_index') || 'Sıra'}: {targetIndex + 1}</span>
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
                      <span>{t('items.fields.target_item') || 'Hedef Öğe'}:</span>{' '}
                      <span className="text-foreground">
                        {targetItem
                          ? `${targetItem.code}${targetItem.name ? ` - ${targetItem.name}` : ''}`
                          : assoc.targetItemId}
                      </span>
                    </div>
                    {assoc.orderIndex && (
                      <div className="text-xs text-muted-foreground">
                        {t('items.fields.order_index') || 'Sıra'}: {assoc.orderIndex}
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
              title={t('items.create.item_type_title') || 'Öğe Tipi Seçimi'}
              subtitle={t('items.create.item_type_subtitle') || 'Öğe tipini seçerek başlayın.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderItemTypeBody()}</div>
          </Card>
        );
      case 'category':
        return (
          <Card>
            <CardHeader
              title={t('items.create.category_title') || 'Kategori Seçimi'}
              subtitle={t('items.create.category_subtitle') || 'Öğe için kullanılacak kategoriyi seçin.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderCategoryBody()}</div>
          </Card>
        );
      case 'associations':
        return (
          <Card>
            <CardHeader
              title={t('items.create.associations_title') || 'Associations'}
              subtitle={t('items.create.associations_subtitle') || 'Mevcut öğelerle bağlantılar oluşturun.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderAssociationsBody()}</div>
          </Card>
        );
      case 'attributes':
        return (
          <Card>
            <CardHeader
              title={t('items.create.attributes_title') || 'Öznitelik Değerleri'}
              subtitle={t('items.create.attributes_subtitle') || 'Kod ve öznitelik alanlarını doldurun.'}
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
