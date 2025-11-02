import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Zap } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { associationsService } from '../../api/services/associations.service';
import { itemsService } from '../../api/services/items.service';
import type { Item } from '../../types';

type StepId = 'associationType' | 'items' | 'configuration' | 'review';

interface FormState {
  associationTypeId: string;
  sourceItemId: string;
  targetItemId: string;
  orderIndex: string;
  metadata: string;
}

const defaultFormState: FormState = {
  associationTypeId: '',
  sourceItemId: '',
  targetItemId: '',
  orderIndex: '',
  metadata: '',
};

export const AssociationsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const steps = useMemo(
    () => [
      {
        id: 'associationType' as StepId,
        name: t('associations.create.steps.type') || 'Association Type',
        description: t('associations.create.steps.type_desc') || 'Association tipini tanımlayın',
      },
      {
        id: 'items' as StepId,
        name: t('associations.create.steps.items') || 'Items',
        description: t('associations.create.steps.items_desc') || 'Kaynak ve hedef item seçin',
      },
      {
        id: 'configuration' as StepId,
        name: t('associations.create.steps.configuration') || 'Configuration',
        description: t('associations.create.steps.configuration_desc') || 'Opsiyonel ayarlar',
      },
      {
        id: 'review' as StepId,
        name: t('associations.create.steps.review') || 'Review',
        description: t('associations.create.steps.review_desc') || 'Kaydetmeden önce kontrol edin',
      },
    ],
    [t],
  );

  const [form, setForm] = useState<FormState>({ ...defaultFormState });
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        setItemsError(null);
        const response = await itemsService.list({ limit: 200 });
        if (!cancelled) {
          setItems(response.items ?? []);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('Failed to load items for associations create', error);
          setItemsError(
            error?.response?.data?.error?.message ??
              t('associations.create.items_failed') ??
              'Item listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingItems(false);
        }
      }
    };

    void fetchItems();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const validateCurrentStep = useCallback(() => {
    const step = steps[currentStep];
    if (!step) {
      return false;
    }

    switch (step.id) {
      case 'associationType':
        if (!form.associationTypeId.trim()) {
          showToast({
            type: 'error',
            message:
              t('associations.create.validation.type') || 'Association type ID alanı zorunludur.',
          });
          return false;
        }
        return true;
      case 'items':
        if (!form.sourceItemId || !form.targetItemId) {
          showToast({
            type: 'error',
            message:
              t('associations.create.validation.items') || 'Kaynak ve hedef item seçilmelidir.',
          });
          return false;
        }
        if (form.sourceItemId === form.targetItemId) {
          showToast({
            type: 'error',
            message:
              t('associations.create.validation.items_same') ||
              'Kaynak ve hedef farklı itemlar olmalıdır.',
          });
          return false;
        }
        return true;
      case 'configuration':
        return true;
      case 'review':
      default:
        return true;
    }
  }, [currentStep, form.associationTypeId, form.sourceItemId, form.targetItemId, showToast, steps, t]);

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

    try {
      setSubmitting(true);
      const metadata = form.metadata.trim();
      let metadataPayload: Record<string, unknown> | undefined;
      if (metadata) {
        try {
          metadataPayload = JSON.parse(metadata);
        } catch (err) {
          metadataPayload = { note: metadata };
        }
      }

      const orderIndexValue = form.orderIndex.trim();
      const orderIndex = orderIndexValue ? Number(orderIndexValue) : undefined;

      const payload = {
        associationTypeId: form.associationTypeId.trim(),
        sourceItemId: form.sourceItemId,
        targetItemId: form.targetItemId,
        orderIndex,
        metadata: metadataPayload,
      };

      await associationsService.create(payload);

      showToast({
        type: 'success',
        message: t('associations.create.success') || 'Association başarıyla oluşturuldu.',
      });

      navigate('/associations');
    } catch (error: any) {
      console.error('Failed to create association', error);
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
  }, [form.associationTypeId, form.metadata, form.orderIndex, form.sourceItemId, form.targetItemId, navigate, showToast, submitting, t]);

  const renderAssociationTypeStep = () => (
    <Card>
      <CardHeader
        title={t('associations.create.type_title') || 'Association Type'}
        subtitle={
          t('associations.create.type_subtitle') ||
          'Association kaydı hangi association type altında oluşturulacak?'
        }
      />
      <div className="px-6 pb-6 space-y-4">
        <Input
          label={t('associations.fields.association_type_id') || 'Association Type ID'}
          value={form.associationTypeId}
          onChange={(event) => updateForm({ associationTypeId: event.target.value })}
          placeholder="association-type-id"
          required
        />
        <p className="text-xs text-muted-foreground">
          {t('associations.create.type_hint') ||
            'Mevcut association type kaydının ID değerini kullanın. Gerekirse association type modülünden yeni bir type oluşturabilirsiniz.'}
        </p>
      </div>
    </Card>
  );

  const renderItemsStep = () => (
    <Card>
      <CardHeader
        title={t('associations.create.items_title') || 'Select Items'}
        subtitle={t('associations.create.items_subtitle') || 'Kaynak ve hedef itemları seçin'}
      />
      <div className="px-6 pb-6 space-y-4">
        {itemsError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {itemsError}
          </div>
        ) : null}

        {loadingItems ? (
          <div className="text-sm text-muted-foreground">
            {t('common.loading') || 'Yükleniyor...'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.source_item') || 'Source Item'}
                </label>
                <select
                  value={form.sourceItemId}
                  onChange={(event) => updateForm({ sourceItemId: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('associations.create.select_source_item') || 'Kaynak item seçin'}</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} {item.name ? `- ${item.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('associations.fields.target_item') || 'Target Item'}
                </label>
                <select
                  value={form.targetItemId}
                  onChange={(event) => updateForm({ targetItemId: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('associations.create.select_target_item') || 'Hedef item seçin'}</option>
                  {items
                    .filter((item) => item.id !== form.sourceItemId)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} {item.name ? `- ${item.name}` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );

  const renderConfigurationStep = () => (
    <Card>
      <CardHeader
        title={t('associations.create.configuration_title') || 'Configuration'}
        subtitle={t('associations.create.configuration_subtitle') || 'Opsiyonel metadata alanları'}
      />
      <div className="px-6 pb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('associations.fields.order_index') || 'Order Index'}
            type="number"
            value={form.orderIndex}
            onChange={(event) => updateForm({ orderIndex: event.target.value })}
            placeholder="0"
          />

          <Input
            label={t('associations.fields.metadata') || 'Metadata (JSON veya metin)'}
            value={form.metadata}
            onChange={(event) => updateForm({ metadata: event.target.value })}
            placeholder='{"note": "optional"}'
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {t('associations.create.configuration_hint') ||
            'Metadata alanı isteğe bağlıdır. JSON formatında veri girebilir veya basit bir not yazabilirsiniz.'}
        </p>
      </div>
    </Card>
  );

  const renderReviewStep = () => {
    const sourceItem = items.find((item) => item.id === form.sourceItemId);
    const targetItem = items.find((item) => item.id === form.targetItemId);
    const orderIndexValue = form.orderIndex.trim();

    return (
      <Card>
        <CardHeader
          title={t('associations.review.title') || 'Review'}
          subtitle={t('associations.review.subtitle') || 'Association kaydını doğrulayın'}
        />
        <div className="px-6 pb-6 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t('associations.fields.association_type_id') || 'Association Type'}
            </span>
            <Badge variant="primary" size="sm">
              {form.associationTypeId.trim() || '—'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t('associations.fields.source_item') || 'Source Item'}
            </span>
            <span className="font-medium text-foreground">
              {sourceItem
                ? `${sourceItem.code}${sourceItem.name ? ` - ${sourceItem.name}` : ''}`
                : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t('associations.fields.target_item') || 'Target Item'}
            </span>
            <span className="font-medium text-foreground">
              {targetItem
                ? `${targetItem.code}${targetItem.name ? ` - ${targetItem.name}` : ''}`
                : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t('associations.fields.order_index') || 'Order Index'}
            </span>
            <span className="font-medium text-foreground">
              {orderIndexValue || '—'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block">
              {t('associations.fields.metadata') || 'Metadata'}
            </span>
            <span className="text-sm text-foreground">
              {form.metadata.trim() || t('associations.review.no_metadata') || 'Ek metadata bulunmuyor.'}
            </span>
          </div>
        </div>
      </Card>
    );
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) {
      return null;
    }

    switch (step.id) {
      case 'associationType':
        return renderAssociationTypeStep();
      case 'items':
        return renderItemsStep();
      case 'configuration':
        return renderConfigurationStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('associations.create_title') || 'Create Association'}
        subtitle={
          t('associations.create_subtitle') ||
          'Mevcut itemlar arasında association oluşturun ve isteğe bağlı olarak metadata ekleyin.'
        }
      />

      <Card>
        <CardHeader
          title={t('associations.create.form_title') || 'Association Bilgileri'}
          subtitle={t('associations.create.form_subtitle') || 'Adımları takip ederek association kaydedin.'}
        />
        <div className="px-6 pb-6 space-y-6">
          <Stepper steps={steps} currentStep={currentStep} />

          {renderStepContent()}

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || submitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back') || 'Geri'}
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={submitting}>
                  {t('common.next') || 'İleri'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? t('common.saving') || 'Kaydediliyor...' : t('common.create') || 'Oluştur'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AssociationsCreate;
