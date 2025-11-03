import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText, Hash, Plus, Search } from 'lucide-react';
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
import type { ItemType, Category, Family, Item } from '../../types';

type StepId = 'itemType' | 'relationships' | 'associations' | 'review';

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
        name: t('items.create.steps.item_type') || 'Item Type',
        description: t('items.create.steps.item_type_desc') || 'Select the base item type',
      },
      {
        id: 'relationships' as StepId,
        name: t('items.create.steps.relationships') || 'Metadata',
        description:
          t('items.create.steps.relationships_desc') || 'Assign related taxonomy values and identifiers',
      },
      {
        id: 'associations' as StepId,
        name: t('items.create.steps.associations') || 'Associations',
        description:
          t('items.create.steps.associations_desc') || 'Link existing items via association types',
      },
      {
        id: 'review' as StepId,
        name: t('items.create.steps.review') || 'Review',
        description: t('items.create.steps.review_desc') || 'Verify before saving',
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
    associations: [{ ...defaultAssociationRow }],
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [loadingLookup, setLoadingLookup] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      try {
        setLoadingLookup(true);
        setLookupError(null);
        const [itemTypeResult, categoryResult, familyResult, itemsResult] = await Promise.all([
          itemTypesService.list({ limit: 200 }),
          categoriesService.list({ limit: 200 }),
          familiesService.list({ limit: 200 }),
          itemsService.list({ limit: 200 }),
        ]);

        if (cancelled) {
          return;
        }

        setItemTypes(itemTypeResult.items ?? []);
        setCategories(categoryResult.items ?? []);
        setFamilies(familyResult.items ?? []);
        setAvailableItems(itemsResult.items ?? []);
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
  const selectedCategories = useMemo(
    () =>
      form.categoryId
        ? [categories.find((category) => category.id === form.categoryId)].filter(
            (value): value is Category => Boolean(value),
          )
        : [],
    [categories, form.categoryId],
  );
  const selectedFamily = useMemo(
    () => families.find((family) => family.id === form.familyId) ?? null,
    [families, form.familyId],
  );

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleAssociationChange = useCallback(
    (index: number, patch: Partial<AssociationDraft>) => {
      setForm((prev) => {
        const next = [...prev.associations];
        next[index] = { ...next[index], ...patch };
        return { ...prev, associations: next };
      });
    },
  []);

  const addAssociationRow = useCallback(() => {
    setForm((prev) => ({ ...prev, associations: [...prev.associations, { ...defaultAssociationRow }] }));
  }, []);

  const removeAssociationRow = useCallback((index: number) => {
    setForm((prev) => {
      const next = prev.associations.filter((_, idx) => idx !== index);
      return { ...prev, associations: next.length > 0 ? next : [{ ...defaultAssociationRow }] };
    });
  }, []);

  const hasAssociationGap = useMemo(
    () =>
      form.associations.some(
        (assoc) =>
          (assoc.associationTypeId && !assoc.targetItemId) || (!assoc.associationTypeId && assoc.targetItemId),
      ),
    [form.associations],
  );

  const isItemTypeStepValid = useMemo(
    () => !loadingLookup && Boolean(form.itemTypeId),
    [loadingLookup, form.itemTypeId],
  );

  const isRelationshipsStepValid = useMemo(
    () => form.code.trim().length > 0,
    [form.code],
  );

  const isAssociationsStepValid = useMemo(() => !hasAssociationGap, [hasAssociationGap]);

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
      case 'relationships':
        if (!form.code.trim()) {
          showToast({
            type: 'error',
            message: t('items.create.validation.code_required') || 'Kod alanı zorunludur.',
          });
          return false;
        }
        return true;
      case 'associations': {
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
      }
      case 'review':
      default:
        return true;
    }
  }, [currentStep, form.code, form.itemTypeId, hasAssociationGap, loadingLookup, showToast, steps, t]);

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

      const payload = {
        itemTypeId: form.itemTypeId,
        categoryId: form.categoryId ? form.categoryId : null,
        familyId: form.familyId ? form.familyId : null,
        code: form.code.trim(),
        externalCode: form.externalCode.trim() || null,
        sku: form.sku.trim() || null,
        status: form.status,
      };

      const created = await itemsService.create(payload);

      const validAssociations = form.associations.filter(
        (assoc) => assoc.associationTypeId.trim().length > 0 && assoc.targetItemId.trim().length > 0,
      );

      for (const assoc of validAssociations) {
        let metadataPayload: Record<string, unknown> | undefined;
        const trimmedMetadata = assoc.metadata?.trim();
        if (trimmedMetadata) {
          try {
            metadataPayload = JSON.parse(trimmedMetadata);
          } catch (err) {
            metadataPayload = { note: trimmedMetadata };
          }
        }

        const orderIndexValue = assoc.orderIndex?.trim();
        const orderIndex = orderIndexValue ? Number(orderIndexValue) : undefined;

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
  }, [form, navigate, showToast, submitting, t, validateCurrentStep, steps.length]);

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
              onClick={() => updateForm({ itemTypeId: itemType.id })}
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

  const renderRelationshipsBody = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            {t('items.fields.category') || 'Category'}
          </label>
          <select
            value={form.categoryId}
            onChange={(event) => updateForm({ categoryId: event.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('items.create.select_category') || 'Kategori seçin (opsiyonel)'}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            {t('items.fields.family') || 'Family'}
          </label>
          <select
            value={form.familyId}
            onChange={(event) => updateForm({ familyId: event.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('items.create.select_family') || 'Family seçin (opsiyonel)'}</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label={t('items.fields.code') || 'Code'}
          value={form.code}
          onChange={(event) => updateForm({ code: event.target.value })}
          placeholder="ITEM-001"
          required
        />

        <Input
          label={t('items.fields.external_code') || 'External Code'}
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
            {t('items.fields.status') || 'Status'}
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
          <p className="text-xs text-muted-foreground mt-1">
            {t('items.create.status_helper') ||
              'Yayınlanma durumunu belirleyin. Taslak olarak kaydedebilirsiniz.'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderAssociationsBody = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t('items.create.associations_hint') ||
          'Yeni item oluşturulduktan sonra seçilen association tipe göre mevcut itemlarla bağlantılar kurulacaktır.'}
      </p>

      <div className="space-y-4">
        {form.associations.map((assoc, index) => {
          const targetItem = availableItems.find((item) => item.id === assoc.targetItemId);
          return (
            <Card key={`association-row-${index}`}>
              <CardHeader
                title={`${t('items.create.association_row') || 'Association'} #${index + 1}`}
                subtitle={
                  assoc.associationTypeId
                    ? t('items.create.association_row_selected') || 'Association yapılandırması'
                    : t('items.create.association_row_subtitle') || 'Association ayrıntılarını girin'
                }
              />
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('items.fields.association_type_id') || 'Association Type ID'}
                    value={assoc.associationTypeId}
                    onChange={(event) =>
                      handleAssociationChange(index, { associationTypeId: event.target.value })
                    }
                    placeholder="association-type-id"
                    required
                  />

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t('items.fields.target_item') || 'Target Item'}
                    </label>
                    <select
                      value={assoc.targetItemId}
                      onChange={(event) =>
                        handleAssociationChange(index, { targetItemId: event.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('items.create.select_target_item') || 'Hedef item seçin'}</option>
                      {availableItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.code} {item.name ? `- ${item.name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAssociationRow(index)}
                    disabled={form.associations.length === 1}
                  >
                    {t('common.remove') || 'Kaldır'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" onClick={addAssociationRow}>
        <Plus className="h-4 w-4 mr-2" />
        {t('items.create.add_association') || 'Association Satırı Ekle'}
      </Button>
    </div>
  );

  const renderReviewBody = () => (
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
              {selectedCategories.length
                ? selectedCategories[0].name
                : t('items.review.not_selected') || 'Seçilmedi'}
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
            {t('items.review.associations') || 'Associations'}
          </h4>
          {form.associations.filter((assoc) => assoc.associationTypeId && assoc.targetItemId).length === 0 ? (
            <div className="text-muted-foreground">
              {t('items.review.no_associations') || 'Association eklenmedi.'}
            </div>
          ) : (
            form.associations
              .filter((assoc) => assoc.associationTypeId && assoc.targetItemId)
              .map((assoc, index) => {
                const targetItem = availableItems.find((item) => item.id === assoc.targetItemId);
                return (
                  <div key={`review-assoc-${index}`} className="border-b border-border pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{assoc.associationTypeId}</span>
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
      case 'relationships':
        return (
          <Card>
            <CardHeader
              title={t('items.create.relationships_title') || 'Metadata Bilgileri'}
              subtitle={t('items.create.relationships_subtitle') || 'Kod ve temel alanları doldurun.'}
            />
            <div className="px-6 pb-6 space-y-6">{renderRelationshipsBody()}</div>
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
      case 'relationships':
        return isRelationshipsStepValid;
      case 'associations':
        return isAssociationsStepValid;
      default:
        return true;
    }
  }, [submitting, currentStep, steps.length, currentStepId, isItemTypeStepValid, isRelationshipsStepValid, isAssociationsStepValid]);

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
