import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Stepper } from '../../components/ui/Stepper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Card, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Checkbox } from '../../components/ui/Checkbox';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { cn } from '../../utils/cn';
import { itemTypesService } from '../../api/services/item-types.service';
import { categoriesService } from '../../api/services/categories.service';
import { familiesService } from '../../api/services/families.service';
import { localizationsService } from '../../api/services/localizations.service';
import {
  associationTypesService,
  type AssociationTypeCreateRequest,
} from '../../api/services/association-types.service';
import {
  associationRulesService,
  type AssociationRuleCreateRequest,
} from '../../api/services/association-rules.service';
import type { ItemType, Category, Family } from '../../types';

type StepId = 'details' | 'scope' | 'ruleFilters' | 'ruleConstraints' | 'review';

type CardinalityOption = AssociationTypeCreateRequest['cardinality'];
type DirectionOption = NonNullable<AssociationTypeCreateRequest['direction']>;
type RuleDirection = NonNullable<AssociationRuleCreateRequest['appliesTo']>;

interface DetailsFormState {
  key: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  sourceItemTypeId: string;
  targetItemTypeId: string;
  cardinality: CardinalityOption;
  direction: DirectionOption;
  isRequired: boolean;
  metadataSchema: string;
}

interface DefaultSourceScope {
  categoryIds: string[];
  familyIds: string[];
}

interface RuleDraft {
  id: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  appliesTo: RuleDirection;
  sourceCategoryIds: string[];
  sourceFamilyIds: string[];
  targetCategoryIds: string[];
  targetFamilyIds: string[];
  minTargets: number;
  maxTargets: number | null;
  attributeFilters: AttributeFilter[];
  metadataJson: string;
}

const parseJsonMetadata = (value: string): Record<string, unknown> | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error('Metadata must be a JSON object');
  } catch (error) {
    throw new Error('Metadata geçerli bir JSON objesi olmalıdır.');
  }
};

const hasAnyTranslation = (translations: Record<string, string>) =>
  Object.values(translations).some((value) => value.trim().length > 0);

const CARDINALITY_OPTIONS: Array<{
  value: CardinalityOption;
  label: string;
  description: { tr: string; en: string };
}> = [
  { value: 'one-to-one', label: '1:1', description: { tr: 'Her kaynak için tek hedef', en: 'Single target per source' } },
  { value: 'one-to-many', label: '1:N', description: { tr: 'Her kaynak için birden fazla hedef', en: 'Multiple targets per source' } },
  { value: 'many-to-one', label: 'N:1', description: { tr: 'Bir hedefe birden fazla kaynak', en: 'Multiple sources per target' } },
  { value: 'many-to-many', label: 'N:N', description: { tr: 'Birden fazla kaynak ve hedef', en: 'Multiple sources and targets' } },
];

type AttributeFilter = { key: string; value: string };

const DIRECTION_OPTIONS: Array<{
  value: DirectionOption;
  labelKey: string;
  fallbackLabel: string;
  descriptionKey: string;
  fallbackDescription: string;
}> = [
  {
    value: 'directed',
    labelKey: 'associations.fields.direction_directed',
    fallbackLabel: 'Yönlü',
    descriptionKey: 'associations.fields.direction_directed_hint',
    fallbackDescription: 'Kaynak > hedef yönünde değerlendirilir',
  },
  {
    value: 'undirected',
    labelKey: 'associations.fields.direction_undirected',
    fallbackLabel: 'Yönsüz',
    descriptionKey: 'associations.fields.direction_undirected_hint',
    fallbackDescription: 'Her iki yönde de aynı kurallar geçerlidir',
  },
];

const buildEmptyAttributeFilter = (): AttributeFilter => ({ key: '', value: '' });

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, action, children }) => (
  <div className="rounded-2xl border border-border bg-card/30 shadow-sm">
    <div className="flex flex-col gap-2 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle ? <p className="text-xs text-muted-foreground mt-1">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    <div className="px-5 py-5">{children}</div>
  </div>
);

export const AssociationsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const requiredLanguages = useRequiredLanguages();

  const steps = useMemo(
    () => [
      {
        id: 'details' as StepId,
        name: t('associations.create.steps.details') || 'Temel Bilgiler',
        description:
          t('associations.create.steps.details_desc') ||
          'Association tipinin ana özelliklerini tanımlayın.',
      },
      {
        id: 'scope' as StepId,
        name: t('associations.create.steps.scope') || 'Kaynak Kapsamı',
        description:
          t('associations.create.steps.scope_desc') ||
          'Association’ın tetikleneceği kaynak kategori/aile kapsamını ayarlayın.',
      },
      {
        id: 'ruleFilters' as StepId,
        name: t('associations.create.steps.rule_filters') || 'Kural Filtreleri',
        description:
          t('associations.create.steps.rule_filters_desc') ||
          'Hedef seçimlerini filtreleyen kuralları yapılandırın.',
      },
      {
        id: 'ruleConstraints' as StepId,
        name: t('associations.create.steps.rule_constraints') || 'Kural Kısıtları',
        description:
          t('associations.create.steps.rule_constraints_desc') ||
          'Minimum/maksimum seçim ve diğer ayarları belirleyin.',
      },
      {
        id: 'review' as StepId,
        name: t('associations.create.steps.review') || 'Gözden Geçir',
        description:
          t('associations.create.steps.review_desc') ||
          'Kaydetmeden önce bilgileri doğrulayın.',
      },
    ],
    [t],
  );

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState<boolean>(true);
  const [lookupsError, setLookupsError] = useState<string | null>(null);

  const ensureTranslations = useCallback(
    (current: Record<string, string> = {}) => {
      let changed = false;
      const next: Record<string, string> = {};
      requiredLanguages.forEach(({ code }) => {
        if (!(code in current)) {
          changed = true;
        }
        next[code] = current[code] ?? '';
      });
      const extraKeys = Object.keys(current).filter(
        (key) => !requiredLanguages.some((lang) => lang.code === key),
      );
      if (extraKeys.length > 0) {
        changed = true;
      }
      return changed ? next : current;
    },
    [requiredLanguages],
  );

  const [details, setDetails] = useState<DetailsFormState>({
    key: '',
    nameTranslations: ensureTranslations({}),
    descriptionTranslations: ensureTranslations({}),
    sourceItemTypeId: '',
    targetItemTypeId: '',
    cardinality: 'one-to-one',
    direction: 'directed',
    isRequired: true,
    metadataSchema: '',
  });

  const [defaultScope, setDefaultScope] = useState<DefaultSourceScope>({
    categoryIds: [],
    familyIds: [],
  });

  const [rules, setRules] = useState<RuleDraft[]>([]);

  useEffect(() => {
    setDetails((prev) => {
      const nextNames = ensureTranslations(prev.nameTranslations);
      const nextDescriptions = ensureTranslations(prev.descriptionTranslations);
      if (nextNames === prev.nameTranslations && nextDescriptions === prev.descriptionTranslations) {
        return prev;
      }
      return {
        ...prev,
        nameTranslations: nextNames,
        descriptionTranslations: nextDescriptions,
      };
    });
    setRules((prev) =>
      prev.map((rule) => {
        const nextNames = ensureTranslations(rule.nameTranslations);
        const nextDescriptions = ensureTranslations(rule.descriptionTranslations);
        if (nextNames === rule.nameTranslations && nextDescriptions === rule.descriptionTranslations) {
          return rule;
        }
        return {
          ...rule,
          nameTranslations: nextNames,
          descriptionTranslations: nextDescriptions,
        };
      }),
    );
  }, [ensureTranslations]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const sortedFamilies = useMemo(
    () => [...families].sort((a, b) => a.name.localeCompare(b.name)),
    [families],
  );

  const sourceItemType = useMemo(
    () => itemTypes.find((type) => type.id === details.sourceItemTypeId) ?? null,
    [details.sourceItemTypeId, itemTypes],
  );

  const targetItemType = useMemo(
    () => itemTypes.find((type) => type.id === details.targetItemTypeId) ?? null,
    [details.targetItemTypeId, itemTypes],
  );

  const familiesByCategory = useMemo(() => {
    const map = new Map<string, Family[]>();
    sortedFamilies.forEach((family) => {
      if (!family.categoryId) return;
      const list = map.get(family.categoryId) ?? [];
      list.push(family);
      map.set(family.categoryId, list);
    });
    return map;
  }, [sortedFamilies]);

  const sourceCategoryOptions = useMemo(() => {
    const ids = sourceItemType?.categoryIds ?? [];
    if (!ids.length) {
      return sortedCategories;
    }
    const allowed = new Set(ids);
    return sortedCategories.filter((category) => allowed.has(category.id));
  }, [sortedCategories, sourceItemType]);

  const targetCategoryOptions = useMemo(() => {
    const ids = targetItemType?.categoryIds ?? [];
    if (!ids.length) {
      return sortedCategories;
    }
    const allowed = new Set(ids);
    return sortedCategories.filter((category) => allowed.has(category.id));
  }, [sortedCategories, targetItemType]);

  const getFamiliesForCategories = useCallback(
    (categoryIds: string[]) => {
      if (categoryIds.length === 0) {
        return sortedFamilies;
      }
      const allowedIds = new Set<string>();
      categoryIds.forEach((id) => {
        const list = familiesByCategory.get(id) ?? [];
        list.forEach((family) => allowedIds.add(family.id));
      });
      return sortedFamilies.filter((family) => allowedIds.has(family.id));
    },
    [familiesByCategory, sortedFamilies],
  );

  const clampFamilySelection = useCallback(
    (categoryIds: string[], familyIds: string[]) => {
      if (categoryIds.length === 0 || familyIds.length === 0) {
        return [];
      }
      const allowedIds = new Set(getFamiliesForCategories(categoryIds).map((family) => family.id));
      return familyIds.filter((id) => allowedIds.has(id));
    },
    [getFamiliesForCategories],
  );

  const buildEmptyRule = useCallback((): RuleDraft => {
    const baseId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const scopedFamilies = clampFamilySelection(defaultScope.categoryIds, defaultScope.familyIds);
    return {
      id: baseId,
      nameTranslations: ensureTranslations({}),
      descriptionTranslations: ensureTranslations({}),
      appliesTo: 'source',
      sourceCategoryIds: [...defaultScope.categoryIds],
      sourceFamilyIds: scopedFamilies,
      targetCategoryIds: [],
      targetFamilyIds: [],
      minTargets: 1,
      maxTargets: 1,
      attributeFilters: [],
      metadataJson: '',
    };
  }, [clampFamilySelection, defaultScope.categoryIds, defaultScope.familyIds, ensureTranslations]);

  useEffect(() => {
    setRules((prev) => {
      if (prev.length === 0) {
        return [buildEmptyRule()];
      }
      return prev;
    });
  }, [buildEmptyRule]);

  useEffect(() => {
    if (lookupsLoading) {
      return;
    }
    const allowedIds = new Set(sourceCategoryOptions.map((category) => category.id));
    setDefaultScope((prev) => {
      const filteredCategoryIds =
        allowedIds.size === 0 ? prev.categoryIds : prev.categoryIds.filter((id) => allowedIds.has(id));
      const filteredFamilyIds = clampFamilySelection(filteredCategoryIds, prev.familyIds);
      if (
        filteredCategoryIds.length === prev.categoryIds.length &&
        filteredFamilyIds.length === prev.familyIds.length
      ) {
        return prev;
      }
      return {
        categoryIds: filteredCategoryIds,
        familyIds: filteredFamilyIds,
      };
    });
    setRules((prev) =>
      prev.map((rule) => {
        const filteredSourceCategoryIds =
          allowedIds.size === 0 ? rule.sourceCategoryIds : rule.sourceCategoryIds.filter((id) => allowedIds.has(id));
        const filteredSourceFamilyIds = clampFamilySelection(filteredSourceCategoryIds, rule.sourceFamilyIds);
        if (
          filteredSourceCategoryIds.length === rule.sourceCategoryIds.length &&
          filteredSourceFamilyIds.length === rule.sourceFamilyIds.length
        ) {
          return rule;
        }
        return {
          ...rule,
          sourceCategoryIds: filteredSourceCategoryIds,
          sourceFamilyIds: filteredSourceFamilyIds,
        };
      }),
    );
  }, [clampFamilySelection, lookupsLoading, sourceCategoryOptions]);

  useEffect(() => {
    if (lookupsLoading) {
      return;
    }
    const allowedIds = new Set(targetCategoryOptions.map((category) => category.id));
    setRules((prev) =>
      prev.map((rule) => {
        const filteredTargetCategoryIds =
          allowedIds.size === 0 ? rule.targetCategoryIds : rule.targetCategoryIds.filter((id) => allowedIds.has(id));
        const filteredTargetFamilyIds = clampFamilySelection(filteredTargetCategoryIds, rule.targetFamilyIds);
        if (
          filteredTargetCategoryIds.length === rule.targetCategoryIds.length &&
          filteredTargetFamilyIds.length === rule.targetFamilyIds.length
        ) {
          return rule;
        }
        return {
          ...rule,
          targetCategoryIds: filteredTargetCategoryIds,
          targetFamilyIds: filteredTargetFamilyIds,
        };
      }),
    );
  }, [clampFamilySelection, lookupsLoading, targetCategoryOptions]);

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      try {
        setLookupsLoading(true);
        setLookupsError(null);

        const limit = 200;

        const fetchAllCategories = async () => {
          let results: Category[] = [];
          let skip = 0;
          while (true) {
            const response = await categoriesService.list({ limit, skip });
            const items = response.items ?? [];
            results = results.concat(items);
            if (items.length < limit || results.length >= (response.total ?? results.length)) {
              break;
            }
            skip += limit;
          }
          return results;
        };

        const fetchAllFamilies = async () => {
          let results: Family[] = [];
          let skip = 0;
          while (true) {
            const response = await familiesService.list({ limit, skip });
            const items = response.items ?? [];
            results = results.concat(items);
            if (items.length < limit || results.length >= (response.total ?? results.length)) {
              break;
            }
            skip += limit;
          }
          return results;
        };

        const [itemTypeResponse, allCategories, allFamilies] = await Promise.all([
          itemTypesService.list({ limit }),
          fetchAllCategories(),
          fetchAllFamilies(),
        ]);

        if (!cancelled) {
          setItemTypes(itemTypeResponse.items ?? []);
          setCategories(allCategories);
          setFamilies(allFamilies);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('Failed to load association create lookups', error);
          setLookupsError(
            error?.response?.data?.error?.message ??
              t('associations.create.lookups_failed') ??
              'Gerekli veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          );
        }
      } finally {
        if (!cancelled) {
          setLookupsLoading(false);
        }
      }
    };

    void loadLookups();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleDetailsChange = useCallback(
    (patch: Partial<DetailsFormState>) => {
      setDetails((prev) => ({ ...prev, ...patch }));
    },
    [setDetails],
  );

  const handleDetailsTranslationChange = useCallback(
    (field: 'nameTranslations' | 'descriptionTranslations', locale: string, value: string) => {
      setDetails((prev) => ({
        ...prev,
        [field]: { ...prev[field], [locale]: value },
      }));
    },
    [],
  );

  const handleDefaultScopeChange = useCallback(
    (field: keyof DefaultSourceScope, values: string[]) => {
      setDefaultScope((prev) => {
        const nextCategoryIds = field === 'categoryIds' ? values : prev.categoryIds;
        const rawFamilyIds = field === 'familyIds' ? values : prev.familyIds;
        return {
          categoryIds: nextCategoryIds,
          familyIds: clampFamilySelection(nextCategoryIds, rawFamilyIds),
        };
      });
    },
    [clampFamilySelection],
  );

  const applyDefaultScopeToRules = useCallback(() => {
    setRules((prev) =>
      prev.map((rule) => ({
        ...rule,
        sourceCategoryIds: [...defaultScope.categoryIds],
        sourceFamilyIds: clampFamilySelection(defaultScope.categoryIds, defaultScope.familyIds),
      })),
    );
  }, [clampFamilySelection, defaultScope]);

  const addRule = useCallback(() => {
    setRules((prev) => [...prev, buildEmptyRule()]);
  }, [buildEmptyRule]);

  const removeRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }, []);

  const updateRule = useCallback(
    (ruleId: string, updater: (rule: RuleDraft) => RuleDraft) => {
      setRules((prev) => prev.map((rule) => (rule.id === ruleId ? updater(rule) : rule)));
    },
    [],
  );

  const handleAttributeFilterChange = useCallback(
    (ruleId: string, index: number, field: keyof AttributeFilter, value: string) => {
      updateRule(ruleId, (rule) => {
        const nextFilters = [...rule.attributeFilters];
        nextFilters[index] = { ...nextFilters[index], [field]: value };
        return { ...rule, attributeFilters: nextFilters };
      });
    },
    [updateRule],
  );

  const handleAddAttributeFilter = useCallback(
    (ruleId: string) => {
      updateRule(ruleId, (rule) => ({
        ...rule,
        attributeFilters: [...rule.attributeFilters, buildEmptyAttributeFilter()],
      }));
    },
    [updateRule],
  );

  const handleRemoveAttributeFilter = useCallback(
    (ruleId: string, index: number) => {
      updateRule(ruleId, (rule) => ({
        ...rule,
        attributeFilters: rule.attributeFilters.filter((_, idx) => idx !== index),
      }));
    },
    [updateRule],
  );

  const handleRuleTranslationChange = useCallback(
    (ruleId: string, field: 'nameTranslations' | 'descriptionTranslations', locale: string, value: string) => {
      updateRule(ruleId, (rule) => ({
        ...rule,
        [field]: { ...rule[field], [locale]: value },
      }));
    },
    [updateRule],
  );

  const buildTranslationsPayload = useCallback(
    (translations: Record<string, string>) => {
      const payload: Record<string, string> = {};
      requiredLanguages.forEach(({ code }) => {
        payload[code] = translations[code]?.trim() ?? '';
      });
      return payload;
    },
    [requiredLanguages],
  );

  const buildRuleMetadataPayload = useCallback((rule: RuleDraft) => {
    const metadataFromJson = rule.metadataJson.trim() ? parseJsonMetadata(rule.metadataJson) : null;
    const cleanedFilters = rule.attributeFilters
      .map((filter) => ({
        key: filter.key.trim(),
        value: filter.value.trim(),
      }))
      .filter((filter) => filter.key || filter.value);

    if (!metadataFromJson && cleanedFilters.length === 0) {
      return null;
    }

    const payload: Record<string, unknown> = metadataFromJson ? { ...metadataFromJson } : {};
    if (cleanedFilters.length > 0) {
      payload.attributeFilters = cleanedFilters;
    }

    return payload;
  }, []);

  const resolveTranslationValue = useCallback(
    (translations: Record<string, string>) => {
      const normalizedLang = (language ?? '').toLowerCase();
      const normalizedShort = normalizedLang.split('-')[0];

      for (const [key, value] of Object.entries(translations)) {
        if (!value?.trim()) continue;
        const normalizedKey = key.toLowerCase();
        if (normalizedKey === normalizedLang || normalizedKey === normalizedShort) {
          return value;
        }
      }

      for (const lang of requiredLanguages) {
        const value = translations[lang.code];
        if (value?.trim()) {
          return value;
        }
      }

      const firstFilled = Object.values(translations).find((value) => value?.trim());
      return firstFilled ?? '';
    },
    [language, requiredLanguages],
  );

  const ensureAtLeastOneRule = useCallback(() => {
    setRules((prev) => {
      if (prev.length === 0) {
        return [buildEmptyRule()];
      }
      return prev;
    });
  }, [buildEmptyRule]);

  const getStepId = () => steps[currentStep]?.id;

  const validateCurrentStep = useCallback((): boolean => {
    const step = getStepId();
    switch (step) {
      case 'details': {
        if (!details.key.trim()) {
          showToast({ type: 'error', message: t('associations.create.validation.key') || 'Association key zorunludur.' });
          return false;
        }
        const missingLanguage = requiredLanguages.find(
          ({ code }) => !details.nameTranslations[code]?.trim(),
        );
        if (missingLanguage) {
          showToast({
            type: 'error',
            message:
              t('associations.create.validation.name_required') ||
              `${missingLanguage.label} ${t('common.name') || 'Ad'} alanı zorunludur.`,
          });
          return false;
        }
        if (!details.sourceItemTypeId || !details.targetItemTypeId) {
          showToast({
            type: 'error',
            message:
              t('associations.create.validation.item_types') ||
              'Kaynak ve hedef item tiplerini seçmelisiniz.',
          });
          return false;
        }
        if (hasAnyTranslation(details.descriptionTranslations)) {
          const missingDescriptionLang = requiredLanguages.find(
            ({ code }) => !details.descriptionTranslations[code]?.trim(),
          );
          if (missingDescriptionLang) {
            showToast({
              type: 'error',
              message:
                t('associations.create.validation.description_required') ||
                `${missingDescriptionLang.label} ${t('common.description') || 'Açıklama'} alanı zorunludur.`,
            });
            return false;
          }
        }
        return true;
      }
      case 'scope': {
        ensureAtLeastOneRule();
        return true;
      }
      case 'ruleFilters': {
        if (rules.length === 0) {
          showToast({
            type: 'error',
            message:
              t('associations.create.validation.rule_required') ||
              'En az bir kural tanımlamalısınız.',
          });
          return false;
        }
        return true;
      }
      case 'ruleConstraints': {
        if (rules.length === 0) {
          showToast({
            type: 'error',
            message:
              t('associations.create.validation.rule_required') ||
              'En az bir kural tanımlamalısınız.',
          });
          return false;
        }

        for (const rule of rules) {
          if (rule.minTargets < 0) {
            showToast({
              type: 'error',
              message:
                t('associations.create.validation.min_targets') ||
                'Minimum hedef sayısı 0 veya üzeri olmalıdır.',
            });
            return false;
          }
          if (rule.maxTargets !== null && rule.maxTargets !== undefined) {
            if (rule.maxTargets < 0) {
              showToast({
                type: 'error',
                message:
                  t('associations.create.validation.max_targets_non_negative') ||
                  'Maksimum hedef sayısı 0 veya üzeri olmalıdır.',
              });
              return false;
            }
            if (rule.maxTargets > 0 && rule.maxTargets < rule.minTargets) {
              showToast({
                type: 'error',
                message:
                  t('associations.create.validation.max_targets') ||
                  'Maksimum hedef sayısı minimum değerden küçük olamaz.',
              });
              return false;
            }
          }

          if (hasAnyTranslation(rule.nameTranslations)) {
            const missingRuleNameLang = requiredLanguages.find(
              ({ code }) => !rule.nameTranslations[code]?.trim(),
            );
            if (missingRuleNameLang) {
              showToast({
                type: 'error',
                message:
                  t('associations.create.validation.rule_name_required') ||
                  `${missingRuleNameLang.label} ${t('associations.create.rule_name_label') || 'Kural adı'} zorunludur.`,
              });
              return false;
            }
          }

          if (hasAnyTranslation(rule.descriptionTranslations)) {
            const missingRuleDescLang = requiredLanguages.find(
              ({ code }) => !rule.descriptionTranslations[code]?.trim(),
            );
            if (missingRuleDescLang) {
              showToast({
                type: 'error',
                message:
                  t('associations.create.validation.rule_description_required') ||
                  `${missingRuleDescLang.label} ${t('common.description') || 'Açıklama'} zorunludur.`,
              });
              return false;
            }
          }

          try {
            buildRuleMetadataPayload(rule);
          } catch (error: any) {
            showToast({
              type: 'error',
              message:
                error?.message ??
                t('associations.create.validation.rule_metadata') ??
                'Kural metadata JSON formatında olmalıdır.',
            });
            return false;
          }
        }

        if (details.metadataSchema.trim()) {
          try {
            parseJsonMetadata(details.metadataSchema);
          } catch (error: any) {
            showToast({
              type: 'error',
              message:
                error?.message ??
                t('associations.create.validation.metadata') ??
                'Association metadata JSON formatında olmalıdır.',
            });
            return false;
          }
        }

        return true;
      }
      case 'review':
      default:
        return true;
    }
  }, [buildRuleMetadataPayload, details, ensureAtLeastOneRule, requiredLanguages, rules, showToast, steps, t]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length, validateCurrentStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      setSubmitting(true);

      const typeTranslationsPromise = Promise.all([
        localizationsService.create({
          namespace: 'association_types',
          key: `${details.key}.name`,
          description: `Association type name for ${details.key}`,
          translations: buildTranslationsPayload(details.nameTranslations),
        }),
        hasAnyTranslation(details.descriptionTranslations)
          ? localizationsService.create({
              namespace: 'association_types',
              key: `${details.key}.description`,
              description: `Association type description for ${details.key}`,
              translations: buildTranslationsPayload(details.descriptionTranslations),
            })
          : Promise.resolve(null),
      ]);

      const [nameLocalization, descriptionLocalization] = await typeTranslationsPromise;

      const metadataPayload = details.metadataSchema.trim()
        ? parseJsonMetadata(details.metadataSchema)
        : null;

      const typePayload: AssociationTypeCreateRequest = {
        key: details.key.trim(),
        nameLocalizationId: nameLocalization.id,
        descriptionLocalizationId: descriptionLocalization?.id ?? null,
        sourceItemTypeId: details.sourceItemTypeId,
        targetItemTypeId: details.targetItemTypeId,
        cardinality: details.cardinality,
        direction: details.direction,
        isRequired: details.isRequired,
        metadataSchema: metadataPayload,
      };

      const createdType = await associationTypesService.create(typePayload);

      await Promise.all(
        rules.map(async (rule, index) => {
          let nameLocalizationId: string | null = null;
          let descriptionLocalizationId: string | null = null;

          if (hasAnyTranslation(rule.nameTranslations)) {
            const localization = await localizationsService.create({
              namespace: 'association_rules',
              key: `${details.key}.rule_${index + 1}.name`,
              description: `Association rule name for ${details.key} (rule ${index + 1})`,
              translations: buildTranslationsPayload(rule.nameTranslations),
            });
            nameLocalizationId = localization.id;
          }

          if (hasAnyTranslation(rule.descriptionTranslations)) {
            const localization = await localizationsService.create({
              namespace: 'association_rules',
              key: `${details.key}.rule_${index + 1}.description`,
              description: `Association rule description for ${details.key} (rule ${index + 1})`,
              translations: buildTranslationsPayload(rule.descriptionTranslations),
            });
            descriptionLocalizationId = localization.id;
          }

          const ruleMetadata = buildRuleMetadataPayload(rule);

          const rulePayload: AssociationRuleCreateRequest = {
            associationTypeId: createdType.id,
            appliesTo: rule.appliesTo,
            nameLocalizationId: nameLocalizationId ?? undefined,
            descriptionLocalizationId: descriptionLocalizationId ?? undefined,
            sourceCategoryIds: rule.sourceCategoryIds,
            sourceFamilyIds: rule.sourceFamilyIds,
            targetCategoryIds: rule.targetCategoryIds,
            targetFamilyIds: rule.targetFamilyIds,
            minTargets: rule.minTargets,
            maxTargets: rule.maxTargets ?? undefined,
            metadataSchema: ruleMetadata ?? undefined,
          };

          await associationRulesService.create(rulePayload);
        }),
      );

      showToast({
        type: 'success',
        message: t('associations.create.success') || 'Association type başarıyla oluşturuldu.',
      });

      navigate('/associations');
    } catch (error: any) {
      console.error('Failed to create association type', error);
      showToast({
        type: 'error',
        message:
          error?.response?.data?.error?.message ??
          t('associations.create.failed') ??
          'Association oluşturulamadı. Lütfen tekrar deneyin.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [buildRuleMetadataPayload, buildTranslationsPayload, details, navigate, rules, showToast, t, validateCurrentStep]);

  const renderDetailsStep = () => {
    const cardinalityLocale = language?.toLowerCase().startsWith('en') ? 'en' : 'tr';

    return (
      <div className="space-y-6">
        <SectionCard
          title={t('associations.create.details_basic_title') || 'Temel Bilgiler'}
          subtitle={
            t('associations.create.details_basic_subtitle') ||
            'Association anahtarını ve tüm zorunlu dil çevirilerini girin.'
          }
        >
          <div className="space-y-4">
            <Input
              label={t('associations.fields.key') || 'Association Anahtarı'}
              value={details.key}
              onChange={(event) => handleDetailsChange({ key: event.target.value })}
              placeholder="order_fabric"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredLanguages.map((lang) => (
                <Input
                  key={`name-${lang.code}`}
                  label={`${t('common.name') || 'Ad'} (${lang.label})`}
                  value={details.nameTranslations[lang.code] ?? ''}
                  onChange={(event) =>
                    handleDetailsTranslationChange('nameTranslations', lang.code, event.target.value)
                  }
                  required
                />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredLanguages.map((lang) => (
                <Textarea
                  key={`description-${lang.code}`}
                  label={`${t('common.description') || 'Açıklama'} (${lang.label})`}
                  value={details.descriptionTranslations[lang.code] ?? ''}
                  onChange={(event) =>
                    handleDetailsTranslationChange('descriptionTranslations', lang.code, event.target.value)
                  }
                  rows={3}
                />
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t('associations.create.details_behavior_title') || 'İlişki Ayarları'}
          subtitle={
            t('associations.create.details_behavior_subtitle') ||
            'Kaynak/hedef item tiplerini, kardinaliteyi ve yönü belirleyin.'
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.source_item_type') || 'Kaynak Item Tipi'}
                </label>
                <select
                  value={details.sourceItemTypeId}
                  onChange={(event) => handleDetailsChange({ sourceItemTypeId: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">
                    {t('associations.create.select_source_item_type') || 'Kaynak item tipi seçin'}
                  </option>
                  {itemTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.target_item_type') || 'Hedef Item Tipi'}
                </label>
                <select
                  value={details.targetItemTypeId}
                  onChange={(event) => handleDetailsChange({ targetItemTypeId: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">
                    {t('associations.create.select_target_item_type') || 'Hedef item tipi seçin'}
                  </option>
                  {itemTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                {t('associations.fields.cardinality') || 'Kardinalite'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {CARDINALITY_OPTIONS.map((option) => {
                  const active = details.cardinality === option.value;
                  const description =
                    option.description[cardinalityLocale === 'en' ? 'en' : 'tr'] ?? option.description.tr;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/40',
                        active
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-foreground/60',
                      )}
                      onClick={() => handleDetailsChange({ cardinality: option.value })}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{option.label}</span>
                        {active ? (
                          <Badge variant="secondary" className="text-xs">
                            {t('common.selected') || 'Seçili'}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">
                  {t('associations.fields.direction') || 'Yön'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {DIRECTION_OPTIONS.map((option) => {
                    const active = details.direction === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          'rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/40',
                          active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-foreground/60',
                        )}
                        onClick={() => handleDetailsChange({ direction: option.value as DirectionOption })}
                      >
                        <div className="text-sm font-semibold">
                          {t(option.labelKey) || option.fallbackLabel}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t(option.descriptionKey) || option.fallbackDescription}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-4">
                <div className="pr-4">
                  <p className="text-xs font-medium text-foreground">
                    {t('associations.fields.is_required') || 'Zorunlu Association'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('associations.create.details_required_hint') || 'Zorunlu olduğunda item oluştururken atlanamaz.'}
                  </p>
                </div>
                <Checkbox
                  label={t('common.active') || 'Aktif'}
                  checked={details.isRequired}
                  onChange={(event) => handleDetailsChange({ isRequired: event.target.checked })}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t('associations.create.details_metadata_title') || 'Metadata Şeması'}
          subtitle={
            t('associations.create.details_metadata_subtitle') ||
            'Opsiyonel JSON tanımı ile association metadata yapısını belirleyin.'
          }
        >
          <div className="space-y-3">
            <Textarea
              label={t('associations.fields.metadata_schema') || 'Metadata Şeması (JSON)'}
              value={details.metadataSchema}
              onChange={(event) => handleDetailsChange({ metadataSchema: event.target.value })}
              placeholder='{"requiredFields": ["width", "height"]}'
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              {t('associations.create.details_metadata_hint') ||
                'JSON şema ile association değerinde beklenen alanları tarif edin. Boş bırakabilirsiniz.'}
            </p>
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderScopeStep = () => {
    const scopedFamilies = getFamiliesForCategories(defaultScope.categoryIds);
    const scopeCategorySelectDisabled = !details.sourceItemTypeId && itemTypes.length > 0;
    const familySelectDisabled = scopeCategorySelectDisabled || defaultScope.categoryIds.length === 0;

    return (
      <div className="space-y-6">
        <SectionCard
          title={t('associations.create.scope_categories_title') || 'Kaynak Kapsamı'}
          subtitle={
            t('associations.create.scope_subtitle') ||
            'Association hangi kaynak kategori ve ailelerde tetiklenecek? (boş bırakılırsa tümü)'
          }
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {t('associations.fields.source_categories') || 'Kaynak Kategoriler'}
              </label>
              <select
                multiple
                disabled={scopeCategorySelectDisabled || sourceCategoryOptions.length === 0}
                value={defaultScope.categoryIds}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions, (option) => option.value);
                  handleDefaultScopeChange('categoryIds', values);
                }}
                className={cn(
                  'w-full px-3 py-2 h-48 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                  scopeCategorySelectDisabled || sourceCategoryOptions.length === 0
                    ? 'border-border/70 bg-muted/60 text-muted-foreground cursor-not-allowed'
                    : 'border-border',
                )}
              >
                {sourceCategoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                {scopeCategorySelectDisabled
                  ? t('associations.create.scope_categories_disabled') ||
                    'Önce kaynak item tipini seçin.'
                  : t('associations.create.scope_categories_hint') ||
                    'Seçilmezse tüm kategorilerde geçerli olur.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {t('associations.fields.source_families') || 'Kaynak Aileler'}
              </label>
              <select
                multiple
                disabled={familySelectDisabled}
                value={defaultScope.familyIds}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions, (option) => option.value);
                  handleDefaultScopeChange('familyIds', values);
                }}
                className={cn(
                  'w-full px-3 py-2 h-48 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                  familySelectDisabled ? 'bg-muted/60 text-muted-foreground cursor-not-allowed' : 'border-border',
                )}
              >
                {(familySelectDisabled ? sortedFamilies : scopedFamilies).map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                {familySelectDisabled
                  ? t('associations.create.scope_families_disabled') ||
                    (scopeCategorySelectDisabled
                      ? 'Önce kaynak item tipini ve kategori seçin.'
                      : 'Önce kategori seçerseniz ilgili aileler listelenir.')
                  : t('associations.create.scope_families_hint') ||
                    'Boş bırakırsanız seçilen kategorilerdeki tüm aileler geçerli olur.'}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t('associations.create.scope_summary_title') || 'Kapsam Özeti'}
          subtitle={
            t('associations.create.scope_apply_hint') ||
            'Varsayılan kapsamı mevcut kural taslaklarına uygulamak için butonu kullanın.'
          }
          action={
            <Button variant="outline" size="sm" onClick={applyDefaultScopeToRules}>
              {t('associations.create.scope_apply_button') || 'Kapsamı Kurallara Uygula'}
            </Button>
          }
        >
          <div className="text-sm space-y-3">
            <div>
              <span className="font-medium text-foreground">
                {t('associations.review.categories') || 'Kategoriler'}:
              </span>{' '}
              {defaultScope.categoryIds.length === 0
                ? t('common.all') || 'Tümü'
                : defaultScope.categoryIds
                    .map((id) => sortedCategories.find((category) => category.id === id)?.name ?? id)
                    .join(', ')}
            </div>
            <div>
              <span className="font-medium text-foreground">
                {t('associations.review.families') || 'Aileler'}:
              </span>{' '}
              {defaultScope.familyIds.length === 0
                ? t('common.all') || 'Tümü'
                : defaultScope.familyIds
                    .map((id) => sortedFamilies.find((family) => family.id === id)?.name ?? id)
                    .join(', ')}
            </div>
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderRuleFiltersStep = () => (
    <div className="space-y-6">
      {rules.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('associations.create.rules_empty') || 'Henüz tanımlanmış kural bulunmuyor.'}
        </div>
      ) : null}

      {rules.map((rule, index) => {
        const sourceFamilies = getFamiliesForCategories(rule.sourceCategoryIds);
        const targetFamilies = getFamiliesForCategories(rule.targetCategoryIds);
        const disableSourceCategories = !details.sourceItemTypeId && itemTypes.length > 0;
        const disableTargetCategories = !details.targetItemTypeId && itemTypes.length > 0;
        const disableSourceFamilies = disableSourceCategories || rule.sourceCategoryIds.length === 0;
        const disableTargetFamilies = disableTargetCategories || rule.targetCategoryIds.length === 0;

        return (
          <SectionCard
            key={rule.id}
            title={`${t('associations.create.rule_card_title') || 'Kural'} #${index + 1}`}
            subtitle={
              t('associations.create.rule_card_subtitle') ||
              'Kaynak ve hedef filtrelerini kategori → aile sırasıyla seçin.'
            }
            action={
              rules.length > 1 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRule(rule.id)}
                  title={t('common.remove') || 'Kaldır'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : undefined
            }
          >
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('associations.fields.source_categories') || 'Kaynak Kategoriler'}
                  </label>
                  <select
                    multiple
                    disabled={disableSourceCategories || sourceCategoryOptions.length === 0}
                    value={rule.sourceCategoryIds}
                    onChange={(event) => {
                      const values = Array.from(event.target.selectedOptions, (option) => option.value);
                      updateRule(rule.id, (current) => ({
                        ...current,
                        sourceCategoryIds: values,
                        sourceFamilyIds: clampFamilySelection(values, current.sourceFamilyIds),
                      }));
                    }}
                    className={cn(
                      'w-full px-3 py-2 h-36 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                      disableSourceCategories || sourceCategoryOptions.length === 0
                        ? 'border-border/70 bg-muted/60 text-muted-foreground cursor-not-allowed'
                        : 'border-border',
                    )}
                  >
                    {sourceCategoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {disableSourceCategories
                      ? t('associations.create.scope_categories_disabled') ||
                        'Önce kaynak item tipini seçin.'
                      : t('associations.create.rule_source_hint') ||
                        'Boş bırakırsanız tüm kategorilerde tetiklenir.'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('associations.fields.source_families') || 'Kaynak Aileler'}
                  </label>
                  <select
                    multiple
                    disabled={disableSourceFamilies}
                    value={rule.sourceFamilyIds}
                    onChange={(event) => {
                      const values = Array.from(event.target.selectedOptions, (option) => option.value);
                      updateRule(rule.id, (current) => ({
                        ...current,
                        sourceFamilyIds: clampFamilySelection(current.sourceCategoryIds, values),
                      }));
                    }}
                    className={cn(
                      'w-full px-3 py-2 h-36 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                      disableSourceFamilies ? 'bg-muted/60 text-muted-foreground cursor-not-allowed' : 'border-border',
                    )}
                  >
                    {(disableSourceFamilies ? sortedFamilies : sourceFamilies).map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {disableSourceFamilies
                      ? t('associations.create.scope_families_disabled') ||
                        'Önce kategori seçerseniz aile filtreleyebilirsiniz.'
                      : t('associations.create.scope_families_hint') ||
                        'Boş bırakırsanız seçilen kategorilerdeki tüm aileler geçerli olur.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('associations.fields.target_categories') || 'Hedef Kategoriler'}
                  </label>
                  <select
                    multiple
                    disabled={disableTargetCategories || targetCategoryOptions.length === 0}
                    value={rule.targetCategoryIds}
                    onChange={(event) => {
                      const values = Array.from(event.target.selectedOptions, (option) => option.value);
                      updateRule(rule.id, (current) => ({
                        ...current,
                        targetCategoryIds: values,
                        targetFamilyIds: clampFamilySelection(values, current.targetFamilyIds),
                      }));
                    }}
                    className={cn(
                      'w-full px-3 py-2 h-36 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                      disableTargetCategories || targetCategoryOptions.length === 0
                        ? 'border-border/70 bg-muted/60 text-muted-foreground cursor-not-allowed'
                        : 'border-border',
                    )}
                  >
                    {targetCategoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {disableTargetCategories
                      ? t('associations.create.rule_target_disabled') ||
                        'Önce hedef item tipini seçin.'
                      : t('associations.create.rule_target_hint') ||
                        'Boş bırakılırsa hedef tarafında tüm kategoriler listelenir.'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('associations.fields.target_families') || 'Hedef Aileler'}
                  </label>
                  <select
                    multiple
                    disabled={disableTargetFamilies}
                    value={rule.targetFamilyIds}
                    onChange={(event) => {
                      const values = Array.from(event.target.selectedOptions, (option) => option.value);
                      updateRule(rule.id, (current) => ({
                        ...current,
                        targetFamilyIds: clampFamilySelection(current.targetCategoryIds, values),
                      }));
                    }}
                    className={cn(
                      'w-full px-3 py-2 h-36 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                      disableTargetFamilies ? 'bg-muted/60 text-muted-foreground cursor-not-allowed' : 'border-border',
                    )}
                  >
                    {(disableTargetFamilies ? sortedFamilies : targetFamilies).map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {disableTargetFamilies
                      ? t('associations.create.rule_target_families_disabled') ||
                        'Önce hedef kategorileri seçin.'
                      : t('associations.create.scope_families_hint') ||
                        'Boş bırakırsanız seçilen kategorilerdeki tüm aileler gösterilir.'}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        );
      })}

      <div className="flex justify-end">
        <Button variant="outline" onClick={addRule}>
          <Plus className="h-4 w-4 mr-2" />
          {t('associations.create.add_rule') || 'Kural Ekle'}
        </Button>
      </div>
    </div>
  );

  const renderRuleConstraintsStep = () => (
    <div className="space-y-6">
      {rules.map((rule, index) => (
        <SectionCard
          key={rule.id}
          title={`${t('associations.create.rule_constraints_title') || 'Kural Detayları'} #${index + 1}`}
          subtitle={
            t('associations.create.rule_constraints_subtitle') ||
            'Çevirileri, yönlendirme hedeflerini ve attribute bazlı filtreleri tanımlayın.'
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredLanguages.map((lang) => (
                <Input
                  key={`rule-name-${rule.id}-${lang.code}`}
                  label={`${t('common.name') || 'Ad'} (${lang.label})`}
                  value={rule.nameTranslations[lang.code] ?? ''}
                  onChange={(event) =>
                    handleRuleTranslationChange(rule.id, 'nameTranslations', lang.code, event.target.value)
                  }
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredLanguages.map((lang) => (
                <Textarea
                  key={`rule-description-${rule.id}-${lang.code}`}
                  label={`${t('common.description') || 'Açıklama'} (${lang.label})`}
                  value={rule.descriptionTranslations[lang.code] ?? ''}
                  onChange={(event) =>
                    handleRuleTranslationChange(rule.id, 'descriptionTranslations', lang.code, event.target.value)
                  }
                  rows={3}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.applies_to') || 'Yönlendirme'}
                </label>
                <select
                  value={rule.appliesTo}
                  onChange={(event) =>
                    updateRule(rule.id, (current) => ({
                      ...current,
                      appliesTo: event.target.value as RuleDirection,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="source">
                    {t('associations.fields.applies_to_source') || 'Kaynak Bazlı'}
                  </option>
                  <option value="target">
                    {t('associations.fields.applies_to_target') || 'Hedef Bazlı'}
                  </option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('associations.create.rule_applies_hint') ||
                    'Kaynak seçimi mi yoksa hedef seçimi mi bu kuralı tetikleyecek?'}
                </p>
              </div>
              <Input
                label={t('associations.fields.min_targets') || 'Minimum Hedef'}
                type="number"
                min={0}
                value={rule.minTargets}
                onChange={(event) =>
                  updateRule(rule.id, (current) => ({
                    ...current,
                    minTargets: Number.isNaN(Number(event.target.value))
                      ? 0
                      : Number(event.target.value),
                  }))
                }
              />
              <Input
                label={t('associations.fields.max_targets') || 'Maksimum Hedef'}
                type="number"
                min={0}
                value={rule.maxTargets ?? ''}
                onChange={(event) => {
                  const value = event.target.value.trim();
                  updateRule(rule.id, (current) => ({
                    ...current,
                    maxTargets: value === '' ? null : Number(value),
                  }));
                }}
                placeholder={t('associations.fields.max_targets_placeholder') || 'Sınırsız için boş bırakın'}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">
                  {t('associations.fields.attribute_filters') || 'Attribute Filtreleri'}
                </p>
                <Button variant="outline" size="sm" onClick={() => handleAddAttributeFilter(rule.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('associations.create.add_attribute_filter') || 'Filtre Ekle'}
                </Button>
              </div>
              {rule.attributeFilters.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                  {t('associations.create.attribute_filters_empty') ||
                    'Henüz attribute bazlı filtre eklenmedi. İhtiyaç duyarsanız anahtar / değer çiftleri ekleyin.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {rule.attributeFilters.map((filter, filterIndex) => (
                    <div
                      key={`${rule.id}-filter-${filterIndex}`}
                      className="grid gap-3 md:grid-cols-[1fr,1fr,auto] items-end"
                    >
                      <Input
                        label={t('associations.fields.attribute_key') || 'Attribute Anahtarı'}
                        value={filter.key}
                        onChange={(event) =>
                          handleAttributeFilterChange(rule.id, filterIndex, 'key', event.target.value)
                        }
                        placeholder="texture"
                      />
                      <Input
                        label={t('associations.fields.attribute_value') || 'Beklenen Değer'}
                        value={filter.value}
                        onChange={(event) =>
                          handleAttributeFilterChange(rule.id, filterIndex, 'value', event.target.value)
                        }
                        placeholder="rose"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttributeFilter(rule.id, filterIndex)}
                        title={t('common.remove') || 'Kaldır'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t('associations.create.attribute_filters_hint') ||
                  'Örnek: source item attribute’unda kumaş_türü=rose ise bu kural tetiklensin.'}
              </p>
            </div>

            <div className="space-y-2">
              <Textarea
                label={t('associations.fields.rule_metadata') || 'Kural Metadata (JSON)'}
                value={rule.metadataJson}
                onChange={(event) =>
                  updateRule(rule.id, (current) => ({
                    ...current,
                    metadataJson: event.target.value,
                  }))
                }
                placeholder='{"mode": "optional"}'
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {t('associations.create.rule_metadata_hint') ||
                  'Attribute filtreleri JSON şemasına otomatik olarak eklenir. Ek alanlar için gelişmiş JSON kullanabilirsiniz.'}
              </p>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <SectionCard
        title={t('associations.create.review_overview') || 'Özet'}
        subtitle={t('associations.create.review_overview_subtitle') || 'Kaydedilecek association tipi ve kurallar'}
      >
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{details.key}</Badge>
            <span className="font-medium text-foreground">
              {resolveTranslationValue(details.nameTranslations) || details.key}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-foreground">
                {t('associations.review.source_item_type') || 'Kaynak Item Tipi'}:
              </span>{' '}
              {itemTypes.find((type) => type.id === details.sourceItemTypeId)?.name || '—'}
            </div>
            <div>
              <span className="font-medium text-foreground">
                {t('associations.review.target_item_type') || 'Hedef Item Tipi'}:
              </span>{' '}
              {itemTypes.find((type) => type.id === details.targetItemTypeId)?.name || '—'}
            </div>
            <div>
              <span className="font-medium text-foreground">
                {t('associations.review.cardinality') || 'Kardinalite'}:
              </span>{' '}
              {details.cardinality.toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-foreground">
                {t('associations.review.direction') || 'Yön'}:
              </span>{' '}
              {details.direction === 'directed'
                ? t('associations.fields.direction_directed') || 'Yönlü'
                : t('associations.fields.direction_undirected') || 'Yönsüz'}
            </div>
          </div>
          {hasAnyTranslation(details.descriptionTranslations) ? (
            <div>
              <span className="font-medium text-foreground">{t('common.description') || 'Açıklama'}:</span>{' '}
              {resolveTranslationValue(details.descriptionTranslations)}
            </div>
          ) : null}
          <div>
            <span className="font-medium text-foreground">
              {t('associations.review.is_required') || 'Zorunlu'}:
            </span>{' '}
            {details.isRequired ? t('common.yes') || 'Evet' : t('common.no') || 'Hayır'}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t('associations.review.default_scope') || 'Varsayılan Kaynak Kapsamı'}
        subtitle={t('associations.create.scope_summary_desc') || 'Bu kapsam kurallara varsayılan olarak uygulanabilir.'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-foreground">{t('associations.review.categories') || 'Kategoriler'}:</span>{' '}
            {defaultScope.categoryIds.length === 0
              ? t('common.all') || 'Tümü'
              : defaultScope.categoryIds
                  .map((id) => categories.find((category) => category.id === id)?.name ?? id)
                  .join(', ')}
          </div>
          <div>
            <span className="font-medium text-foreground">{t('associations.review.families') || 'Aileler'}:</span>{' '}
            {defaultScope.familyIds.length === 0
              ? t('common.all') || 'Tümü'
              : defaultScope.familyIds
                  .map((id) => families.find((family) => family.id === id)?.name ?? id)
                  .join(', ')}
          </div>
        </div>
      </SectionCard>

      {rules.map((rule, index) => (
        <SectionCard
          key={`review-rule-${rule.id}`}
          title={`${t('associations.create.rule_card_title') || 'Kural'} #${index + 1}`}
          subtitle={
            hasAnyTranslation(rule.nameTranslations)
              ? resolveTranslationValue(rule.nameTranslations)
              : undefined
          }
        >
          <div className="space-y-3 text-sm">
            {hasAnyTranslation(rule.descriptionTranslations) ? (
              <div>
                <span className="font-medium text-foreground">{t('common.description') || 'Açıklama'}:</span>{' '}
                {resolveTranslationValue(rule.descriptionTranslations)}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="font-medium text-foreground">
                  {t('associations.fields.applies_to') || 'Yönlendirme'}:
                </span>{' '}
                {rule.appliesTo === 'source'
                  ? t('associations.fields.applies_to_source') || 'Kaynak Bazlı'
                  : t('associations.fields.applies_to_target') || 'Hedef Bazlı'}
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {t('associations.fields.min_targets') || 'Minimum Hedef'} /{' '}
                  {t('associations.fields.max_targets') || 'Maksimum Hedef'}:
                </span>{' '}
                {rule.minTargets} / {rule.maxTargets ?? (t('common.unlimited') || 'Sınırsız')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="font-medium text-foreground">
                  {t('associations.review.rule_source_categories') || 'Kaynak Kategoriler'}:
                </span>{' '}
                {rule.sourceCategoryIds.length === 0
                  ? t('common.all') || 'Tümü'
                  : rule.sourceCategoryIds
                      .map((id) => categories.find((category) => category.id === id)?.name ?? id)
                      .join(', ')}
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {t('associations.review.rule_source_families') || 'Kaynak Aileler'}:
                </span>{' '}
                {rule.sourceFamilyIds.length === 0
                  ? t('common.all') || 'Tümü'
                  : rule.sourceFamilyIds
                      .map((id) => families.find((family) => family.id === id)?.name ?? id)
                      .join(', ')}
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {t('associations.review.rule_target_categories') || 'Hedef Kategoriler'}:
                </span>{' '}
                {rule.targetCategoryIds.length === 0
                  ? t('common.all') || 'Tümü'
                  : rule.targetCategoryIds
                      .map((id) => categories.find((category) => category.id === id)?.name ?? id)
                      .join(', ')}
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {t('associations.review.rule_target_families') || 'Hedef Aileler'}:
                </span>{' '}
                {rule.targetFamilyIds.length === 0
                  ? t('common.all') || 'Tümü'
                  : rule.targetFamilyIds
                      .map((id) => families.find((family) => family.id === id)?.name ?? id)
                      .join(', ')}
              </div>
            </div>

            <div>
              <span className="font-medium text-foreground">
                {t('associations.fields.attribute_filters') || 'Attribute Filtreleri'}:
              </span>{' '}
              {rule.attributeFilters.length === 0
                ? t('common.none') || 'Yok'
                : rule.attributeFilters
                    .map((filter) => `${filter.key || '—'}=${filter.value || '—'}`)
                    .join(', ')}
            </div>

            {rule.metadataJson.trim() ? (
              <div>
                <span className="font-medium text-foreground">
                  {t('associations.fields.rule_metadata') || 'Kural Metadata'}:
                </span>
                <pre className="mt-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
                  {rule.metadataJson}
                </pre>
              </div>
            ) : null}
          </div>
        </SectionCard>
      ))}
    </div>
  );

  const renderStepContent = () => {
    const step = getStepId();
    switch (step) {
      case 'details':
        return renderDetailsStep();
      case 'scope':
        return renderScopeStep();
      case 'ruleFilters':
        return renderRuleFiltersStep();
      case 'ruleConstraints':
        return renderRuleConstraintsStep();
      case 'review':
      default:
        return renderReviewStep();
    }
  };

  const renderStepBody = () => {
    if (lookupsLoading) {
      return (
        <Card>
          <CardHeader title={steps[currentStep]?.name || ''} subtitle={steps[currentStep]?.description || ''} />
          <div className="px-6 pb-6 text-sm text-muted-foreground">
            {t('common.loading') || 'Yükleniyor...'}
          </div>
        </Card>
      );
    }
    if (lookupsError) {
      return (
        <Card>
          <CardHeader title={steps[currentStep]?.name || ''} subtitle={steps[currentStep]?.description || ''} />
          <div className="px-6 pb-6">
            <div className="rounded-md border border-destructive bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {lookupsError}
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader title={steps[currentStep]?.name || ''} subtitle={steps[currentStep]?.description || ''} />
        <div className="px-6 pb-6">{renderStepContent()}</div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('associations.create_title') || 'Association Oluştur'}
        description={
          t('associations.create_subtitle') ||
          'Yeni association tipleri ve kuralları tanımlayarak sipariş akışlarını yönetin.'
        }
        breadcrumbs={[
          { label: t('navigation.associations') || 'Associations', href: '/associations' },
          { label: t('associations.create_title') || 'Association Oluştur' },
        ]}
      />

      <Card>
        <div className="px-6 py-6">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepChange={(stepIndex) => {
              if (stepIndex < currentStep) {
                setCurrentStep(stepIndex);
              } else if (stepIndex > currentStep && validateCurrentStep()) {
                setCurrentStep(stepIndex);
              }
            }}
          />
        </div>
      </Card>

      {renderStepBody()}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handlePrevious} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.previous') || 'Geri'}
        </Button>
        {currentStep === steps.length - 1 ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <span>{t('common.saving') || 'Kaydediliyor...'}</span>
            ) : (
              <>
                {t('common.save') || 'Kaydet'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {t('common.next') || 'İleri'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};
