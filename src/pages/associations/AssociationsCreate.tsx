import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  nameTranslations: Record<'tr' | 'en', string>;
  descriptionTranslations: Record<'tr' | 'en', string>;
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
  nameTranslations: Record<'tr' | 'en', string>;
  descriptionTranslations: Record<'tr' | 'en', string>;
  appliesTo: RuleDirection;
  sourceCategoryIds: string[];
  sourceFamilyIds: string[];
  targetCategoryIds: string[];
  targetFamilyIds: string[];
  minTargets: number;
  maxTargets: number | null;
  metadataSchema: string;
}

const createEmptyRule = (defaults: DefaultSourceScope): RuleDraft => ({
  id:
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  nameTranslations: { tr: '', en: '' },
  descriptionTranslations: { tr: '', en: '' },
  appliesTo: 'source',
  sourceCategoryIds: [...defaults.categoryIds],
  sourceFamilyIds: [...defaults.familyIds],
  targetCategoryIds: [],
  targetFamilyIds: [],
  minTargets: 1,
  maxTargets: 1,
  metadataSchema: '',
});

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

const hasAnyTranslation = (translations: Record<'tr' | 'en', string>) =>
  Object.values(translations).some((value) => value.trim().length > 0);

export const AssociationsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

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

  const [details, setDetails] = useState<DetailsFormState>({
    key: '',
    nameTranslations: { tr: '', en: '' },
    descriptionTranslations: { tr: '', en: '' },
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

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const sortedFamilies = useMemo(
    () => [...families].sort((a, b) => a.name.localeCompare(b.name)),
    [families],
  );

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
    (field: 'nameTranslations' | 'descriptionTranslations', locale: 'tr' | 'en', value: string) => {
      setDetails((prev) => ({
        ...prev,
        [field]: { ...prev[field], [locale]: value },
      }));
    },
    [],
  );

  const handleDefaultScopeChange = useCallback(
    (field: keyof DefaultSourceScope, values: string[]) => {
      setDefaultScope((prev) => ({
        ...prev,
        [field]: values,
      }));
    },
    [],
  );

  const applyDefaultScopeToRules = useCallback(() => {
    setRules((prev) =>
      prev.map((rule) => ({
        ...rule,
        sourceCategoryIds: [...defaultScope.categoryIds],
        sourceFamilyIds: [...defaultScope.familyIds],
      })),
    );
  }, [defaultScope]);

  const addRule = useCallback(() => {
    setRules((prev) => [...prev, createEmptyRule(defaultScope)]);
  }, [defaultScope]);

  const removeRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }, []);

  const updateRule = useCallback(
    (ruleId: string, updater: (rule: RuleDraft) => RuleDraft) => {
      setRules((prev) => prev.map((rule) => (rule.id === ruleId ? updater(rule) : rule)));
    },
    [],
  );

  const handleRuleTranslationChange = useCallback(
    (ruleId: string, field: 'nameTranslations' | 'descriptionTranslations', locale: 'tr' | 'en', value: string) => {
      updateRule(ruleId, (rule) => ({
        ...rule,
        [field]: { ...rule[field], [locale]: value },
      }));
    },
    [updateRule],
  );

  const ensureAtLeastOneRule = useCallback(() => {
    setRules((prev) => {
      if (prev.length === 0) {
        return [createEmptyRule(defaultScope)];
      }
      return prev;
    });
  }, [defaultScope]);

  const getStepId = () => steps[currentStep]?.id;

  const validateCurrentStep = useCallback((): boolean => {
    const step = getStepId();
    switch (step) {
      case 'details': {
        if (!details.key.trim()) {
          showToast({ type: 'error', message: t('associations.create.validation.key') || 'Association key zorunludur.' });
          return false;
        }
        if (!details.nameTranslations.tr.trim() || !details.nameTranslations.en.trim()) {
          showToast({
            type: 'error',
            message:
              t('associations.create.validation.name_required') || 'Türkçe ve İngilizce ad alanları doldurulmalıdır.',
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

          if (rule.metadataSchema.trim()) {
            try {
              parseJsonMetadata(rule.metadataSchema);
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
  }, [details, ensureAtLeastOneRule, rules, showToast, steps, t]);

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
          translations: {
            tr: details.nameTranslations.tr.trim(),
            en: details.nameTranslations.en.trim(),
          },
        }),
        hasAnyTranslation(details.descriptionTranslations)
          ? localizationsService.create({
              namespace: 'association_types',
              key: `${details.key}.description`,
              description: `Association type description for ${details.key}`,
              translations: {
                tr: details.descriptionTranslations.tr.trim(),
                en: details.descriptionTranslations.en.trim(),
              },
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
              translations: {
                tr: rule.nameTranslations.tr.trim(),
                en: rule.nameTranslations.en.trim(),
              },
            });
            nameLocalizationId = localization.id;
          }

          if (hasAnyTranslation(rule.descriptionTranslations)) {
            const localization = await localizationsService.create({
              namespace: 'association_rules',
              key: `${details.key}.rule_${index + 1}.description`,
              description: `Association rule description for ${details.key} (rule ${index + 1})`,
              translations: {
                tr: rule.descriptionTranslations.tr.trim(),
                en: rule.descriptionTranslations.en.trim(),
              },
            });
            descriptionLocalizationId = localization.id;
          }

          const ruleMetadata = rule.metadataSchema.trim()
            ? parseJsonMetadata(rule.metadataSchema)
            : null;

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
            metadataSchema: ruleMetadata,
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
  }, [details, navigate, rules, showToast, t, validateCurrentStep]);

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title={t('associations.create.details_basic_title') || 'Temel Bilgiler'}
            subtitle={
              t('associations.create.details_basic_subtitle') ||
              'Anahtar ve isim çevirilerini tanımlayın.'
            }
          />
          <div className="px-6 pb-6 space-y-4">
            <Input
              label={t('associations.fields.key') || 'Association Anahtarı'}
              value={details.key}
              onChange={(event) => handleDetailsChange({ key: event.target.value })}
              placeholder="order_fabric"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={`${t('common.name') || 'Ad'} (${t('common.language_tr') || 'Türkçe'})`}
                value={details.nameTranslations.tr}
                onChange={(event) =>
                  handleDetailsTranslationChange('nameTranslations', 'tr', event.target.value)
                }
                required
              />
              <Input
                label={`${t('common.name') || 'Ad'} (${t('common.language_en') || 'İngilizce'})`}
                value={details.nameTranslations.en}
                onChange={(event) =>
                  handleDetailsTranslationChange('nameTranslations', 'en', event.target.value)
                }
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={`${t('common.description') || 'Açıklama'} (${t('common.language_tr') || 'Türkçe'})`}
                value={details.descriptionTranslations.tr}
                onChange={(event) =>
                  handleDetailsTranslationChange('descriptionTranslations', 'tr', event.target.value)
                }
              />
              <Input
                label={`${t('common.description') || 'Açıklama'} (${t('common.language_en') || 'İngilizce'})`}
                value={details.descriptionTranslations.en}
                onChange={(event) =>
                  handleDetailsTranslationChange('descriptionTranslations', 'en', event.target.value)
                }
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={t('associations.create.details_behavior_title') || 'İlişki Ayarları'}
            subtitle={
              t('associations.create.details_behavior_subtitle') ||
              'Kaynak/hedef item tiplerini ve cardinality ayarlarını seçin.'
            }
          />
          <div className="px-6 pb-6 space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.cardinality') || 'Kardinalite'}
                </label>
                <select
                  value={details.cardinality}
                  onChange={(event) =>
                    handleDetailsChange({ cardinality: event.target.value as CardinalityOption })
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="one-to-one">1:1</option>
                  <option value="one-to-many">1:N</option>
                  <option value="many-to-one">N:1</option>
                  <option value="many-to-many">N:N</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.direction') || 'Yön'}
                </label>
                <select
                  value={details.direction}
                  onChange={(event) =>
                    handleDetailsChange({ direction: event.target.value as DirectionOption })
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="directed">
                    {t('associations.fields.direction_directed') || 'Yönlü'}
                  </option>
                  <option value="undirected">
                    {t('associations.fields.direction_undirected') || 'Yönsüz'}
                  </option>
                </select>
              </div>
              <div className="flex items-center">
                <Checkbox
                  label={t('associations.fields.is_required') || 'Zorunlu Association'}
                  checked={details.isRequired}
                  onChange={(event) => handleDetailsChange({ isRequired: event.target.checked })}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('associations.create.details_metadata_title') || 'Metadata Şeması'}
          subtitle={
            t('associations.create.details_metadata_subtitle') ||
            'Opsiyonel JSON tanımı ile association metadata yapısını belirleyin.'
          }
        />
        <div className="px-6 pb-6">
          <Textarea
            label={t('associations.fields.metadata_schema') || 'Metadata Şeması (JSON)'}
            value={details.metadataSchema}
            onChange={(event) => handleDetailsChange({ metadataSchema: event.target.value })}
            placeholder='{"requiredFields": ["width", "height"]}'
            rows={5}
          />
        </div>
      </Card>
    </div>
  );

  const renderScopeStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title={t('associations.create.scope_categories_title') || 'Kaynak Kategoriler'}
            subtitle={
              t('associations.create.scope_subtitle') ||
              'Bu association tipinin hangi kaynak kategori ve ailelerde çalışacağını belirleyin.'
            }
          />
          <div className="px-6 pb-6 space-y-3">
            <select
              multiple
              value={defaultScope.categoryIds}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions, (option) => option.value);
                handleDefaultScopeChange('categoryIds', values);
              }}
              className="w-full px-3 py-2 h-48 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {t('associations.create.scope_categories_hint') ||
                'Boş bırakırsanız association tüm kategoriler için geçerli olur.'}
            </p>
          </div>
        </Card>
        <Card>
          <CardHeader
            title={t('associations.create.scope_families_title') || 'Kaynak Aileler'}
            subtitle={
              t('associations.create.scope_families_hint') ||
              'Boş bırakırsanız association tüm aileler için geçerli olur.'
            }
          />
          <div className="px-6 pb-6 space-y-3">
            <select
              multiple
              value={defaultScope.familyIds}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions, (option) => option.value);
                handleDefaultScopeChange('familyIds', values);
              }}
              className="w-full px-3 py-2 h-48 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sortedFamilies.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {t('associations.create.scope_families_hint') ||
                'Boş bırakırsanız association tüm aileler için geçerli olur.'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title={t('associations.create.scope_summary_title') || 'Kapsam Özeti'}
            subtitle={t('associations.create.scope_apply_hint') || 'Mevcut kurallara bu kapsamı uygulamak için butonu kullanın.'}
            action={
              <Button variant="outline" size="sm" onClick={applyDefaultScopeToRules}>
                {t('associations.create.scope_apply_button') || 'Kapsamı Kurallara Uygula'}
              </Button>
            }
          />
          <div className="px-6 pb-6 text-xs space-y-4">
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
        </Card>
      </div>
    </div>
  );

  const renderRuleFiltersStep = () => (
    <div className="space-y-6">
      {rules.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('associations.create.rules_empty') || 'Henüz tanımlanmış kural bulunmuyor.'}
        </div>
      ) : null}

      {rules.map((rule, index) => (
        <Card key={rule.id}>
          <CardHeader
            title={`${t('associations.create.rule_card_title') || 'Kural'} #${index + 1}`}
            subtitle={
              t('associations.create.rule_card_subtitle') ||
              'Kaynak ve hedef filtrelerini yapılandırın.'
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
          />
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.source_categories') || 'Kaynak Kategoriler'}
                </label>
                <select
                  multiple
                  value={rule.sourceCategoryIds}
                  onChange={(event) => {
                    const values = Array.from(event.target.selectedOptions, (option) => option.value);
                    updateRule(rule.id, (current) => ({
                      ...current,
                      sourceCategoryIds: values,
                    }));
                  }}
                  className="w-full px-3 py-2 h-36 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.source_families') || 'Kaynak Aileler'}
                </label>
                <select
                  multiple
                  value={rule.sourceFamilyIds}
                  onChange={(event) => {
                    const values = Array.from(event.target.selectedOptions, (option) => option.value);
                    updateRule(rule.id, (current) => ({
                      ...current,
                      sourceFamilyIds: values,
                    }));
                  }}
                  className="w-full px-3 py-2 h-36 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortedFamilies.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.target_categories') || 'Hedef Kategoriler'}
                </label>
                <select
                  multiple
                  value={rule.targetCategoryIds}
                  onChange={(event) => {
                    const values = Array.from(event.target.selectedOptions, (option) => option.value);
                    updateRule(rule.id, (current) => ({
                      ...current,
                      targetCategoryIds: values,
                    }));
                  }}
                  className="w-full px-3 py-2 h-36 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.target_families') || 'Hedef Aileler'}
                </label>
                <select
                  multiple
                  value={rule.targetFamilyIds}
                  onChange={(event) => {
                    const values = Array.from(event.target.selectedOptions, (option) => option.value);
                    updateRule(rule.id, (current) => ({
                      ...current,
                      targetFamilyIds: values,
                    }));
                  }}
                  className="w-full px-3 py-2 h-36 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortedFamilies.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      ))}

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
        <Card key={rule.id}>
          <CardHeader
            title={`${t('associations.create.rule_constraints_title') || 'Kural Detayları'} #${index + 1}`}
            subtitle={
              t('associations.create.rule_constraints_subtitle') ||
              'Minimum/maksimum hedef sayısı ve diğer ayarları düzenleyin.'
            }
          />
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('associations.create.rule_name_tr') || 'Kural Adı (TR)'}
                value={rule.nameTranslations.tr}
                onChange={(event) =>
                  handleRuleTranslationChange(rule.id, 'nameTranslations', 'tr', event.target.value)
                }
              />
              <Input
                label={t('associations.create.rule_name_en') || 'Kural Adı (EN)'}
                value={rule.nameTranslations.en}
                onChange={(event) =>
                  handleRuleTranslationChange(rule.id, 'nameTranslations', 'en', event.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('associations.create.rule_description_tr') || 'Açıklama (TR)'}
                value={rule.descriptionTranslations.tr}
                onChange={(event) =>
                  handleRuleTranslationChange(
                    rule.id,
                    'descriptionTranslations',
                    'tr',
                    event.target.value,
                  )
                }
              />
              <Input
                label={t('associations.create.rule_description_en') || 'Açıklama (EN)'}
                value={rule.descriptionTranslations.en}
                onChange={(event) =>
                  handleRuleTranslationChange(
                    rule.id,
                    'descriptionTranslations',
                    'en',
                    event.target.value,
                  )
                }
              />
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

            <Textarea
              label={t('associations.fields.rule_metadata') || 'Kural Metadata (JSON)'}
              value={rule.metadataSchema}
              onChange={(event) =>
                updateRule(rule.id, (current) => ({
                  ...current,
                  metadataSchema: event.target.value,
                }))
              }
              placeholder='{"mode": "optional"}'
              rows={4}
            />
          </div>
        </Card>
      ))}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('associations.create.review_overview') || 'Özet'}
          subtitle={t('associations.create.review_overview_subtitle') || 'Kaydedilecek association tipi ve kurallar'}
        />
        <div className="px-6 pb-6 space-y-4 text-sm text-muted-foreground">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{details.key}</Badge>
              <span className="font-medium text-foreground">{details.nameTranslations.tr || details.nameTranslations.en}</span>
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
                <span className="font-medium text-foreground">
                  {t('common.description') || 'Açıklama'}:
                </span>{' '}
                {details.descriptionTranslations.tr || details.descriptionTranslations.en}
              </div>
            ) : null}
            <div>
              <span className="font-medium text-foreground">
                {t('associations.review.is_required') || 'Zorunlu'}:
              </span>{' '}
              {details.isRequired
                ? t('common.yes') || 'Evet'
                : t('common.no') || 'Hayır'}
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-medium text-foreground">
              {t('associations.review.default_scope') || 'Varsayılan Kaynak Kapsamı'}
            </span>
            <div className="text-xs">
              <div>
                {t('associations.review.categories') || 'Kategoriler'}:{' '}
                {defaultScope.categoryIds.length === 0
                  ? t('common.all') || 'Tümü'
                  : defaultScope.categoryIds
                      .map((id) => categories.find((category) => category.id === id)?.name ?? id)
                      .join(', ')}
              </div>
              <div>
                {t('associations.review.families') || 'Aileler'}:{' '}
                {defaultScope.familyIds.length === 0
                  ? t('common.all') || 'Tümü'
                  : defaultScope.familyIds
                      .map((id) => families.find((family) => family.id === id)?.name ?? id)
                      .join(', ')}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-medium text-foreground">
              {t('associations.review.rules') || 'Kurallar'} ({rules.length})
            </div>
            {rules.map((rule, index) => (
              <div key={rule.id} className="rounded-lg border border-border p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium text-foreground">
                    {rule.nameTranslations.tr || rule.nameTranslations.en || t('associations.review.rule_unnamed') || 'İsimsiz Kural'}
                  </span>
                </div>
                {hasAnyTranslation(rule.descriptionTranslations) ? (
                  <div>
                    {t('common.description') || 'Açıklama'}:{' '}
                    {rule.descriptionTranslations.tr || rule.descriptionTranslations.en}
                  </div>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    {t('associations.review.rule_applies_to') || 'Yön'}:{' '}
                    {rule.appliesTo === 'source'
                      ? t('associations.fields.applies_to_source') || 'Kaynak Bazlı'
                      : t('associations.fields.applies_to_target') || 'Hedef Bazlı'}
                  </div>
                  <div>
                    {t('associations.review.rule_min_targets') || 'Minimum hedef'}: {rule.minTargets}
                  </div>
                    <div>
                      {t('associations.review.rule_max_targets') || 'Maksimum hedef'}:{' '}
                      {rule.maxTargets ?? (t('associations.review.unlimited') || 'Sınırsız')}
                    </div>
                </div>
                <div>
                  {t('associations.review.rule_source_categories') || 'Kaynak Kategoriler'}:{' '}
                  {rule.sourceCategoryIds.length === 0
                    ? t('common.all') || 'Tümü'
                    : rule.sourceCategoryIds
                        .map((id) => categories.find((category) => category.id === id)?.name ?? id)
                        .join(', ')}
                </div>
                <div>
                  {t('associations.review.rule_source_families') || 'Kaynak Aileler'}:{' '}
                  {rule.sourceFamilyIds.length === 0
                    ? t('common.all') || 'Tümü'
                    : rule.sourceFamilyIds
                        .map((id) => families.find((family) => family.id === id)?.name ?? id)
                        .join(', ')}
                </div>
                <div>
                  {t('associations.review.rule_target_categories') || 'Hedef Kategoriler'}:{' '}
                  {rule.targetCategoryIds.length === 0
                    ? t('common.all') || 'Tümü'
                    : rule.targetCategoryIds
                        .map((id) => categories.find((category) => category.id === id)?.name ?? id)
                        .join(', ')}
                </div>
                <div>
                  {t('associations.review.rule_target_families') || 'Hedef Aileler'}:{' '}
                  {rule.targetFamilyIds.length === 0
                    ? t('common.all') || 'Tümü'
                    : rule.targetFamilyIds
                        .map((id) => families.find((family) => family.id === id)?.name ?? id)
                        .join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderStepBody = () => {
    const step = getStepId();
    if (lookupsLoading) {
      return <div className="text-sm text-muted-foreground">{t('common.loading') || 'Yükleniyor...'}</div>;
    }
    if (lookupsError) {
      return (
        <div className="rounded-md border border-destructive bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {lookupsError}
        </div>
      );
    }
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
        <CardHeader
          title={t('associations.create.step_overview_title') || steps[currentStep]?.name || 'Aktif Adım'}
          subtitle={
            steps[currentStep]?.description ||
            t('associations.create.step_overview_subtitle') ||
            'Aşağıdaki kartları doldurarak ilerleyin.'
          }
        />
        <div className="px-6 pb-6">
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
