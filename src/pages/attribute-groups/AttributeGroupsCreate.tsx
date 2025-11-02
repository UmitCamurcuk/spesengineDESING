import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Tags,
  Filter,
  Search,
  Hash,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { Attribute, AttributeGroup } from '../../types';
import { attributesService } from '../../api/services/attributes.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../../components/ui/Badge';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';

type FormErrors = Record<string, string>;

const steps = [
  { id: 'basic', name: 'Temel Bilgiler', description: 'Anahtar, isim ve sıralama' },
  { id: 'attributes', name: 'Attribute Seçimi', description: 'Gruba eklenecek attribute’ları seçin' },
  { id: 'preview', name: 'Önizleme', description: 'Kaydetmeden önce tüm bilgileri doğrulayın' },
] as const;

const parseTags = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const AttributeGroupsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributesLoading, setAttributesLoading] = useState(true);
  const [attributesError, setAttributesError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const requiredLanguages = useRequiredLanguages();

  type LocalizationState = Record<string, string>;

  const syncLocalizationState = useCallback(
    (current: LocalizationState): LocalizationState => {
      const next: LocalizationState = {};
      requiredLanguages.forEach(({ code }) => {
        next[code] = current?.[code] ?? '';
      });
      return next;
    },
    [requiredLanguages],
  );

  const [formData, setFormData] = useState<{
    key: string;
    names: LocalizationState;
    descriptions: LocalizationState;
    notes: LocalizationState;
    order: number;
    tagsRaw: string;
    tags: string[];
    attributeIds: string[];
  }>({
    key: '',
    names: {},
    descriptions: {},
    notes: {},
    order: 1,
    tagsRaw: '',
    tags: [],
    attributeIds: [],
  });

  useEffect(() => {
    let cancelled = false;

    const fetchAttributes = async () => {
      try {
        setAttributesLoading(true);
        setAttributesError(null);
        const response = await attributesService.list();
        if (!cancelled) {
          setAttributes(response);
        }
      } catch (error) {
        console.error('Failed to load attributes for group creation', error);
        if (!cancelled) {
          setAttributesError('Attribute listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.');
        }
      } finally {
        if (!cancelled) {
          setAttributesLoading(false);
        }
      }
    };

    fetchAttributes();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAttributes = useMemo(() => {
    if (!search.trim()) {
      return attributes;
    }
    const term = search.trim().toLowerCase();
    return attributes.filter((attribute) => {
      return (
        attribute.name.toLowerCase().includes(term) ||
        (attribute.key ?? '').toLowerCase().includes(term) ||
        (attribute.description ?? '').toLowerCase().includes(term)
      );
    });
  }, [attributes, search]);

  const updateForm = useCallback(
    (patch: Partial<typeof formData>) => {
      setFormData((prev) => ({ ...prev, ...patch }));
    },
    [setFormData],
  );

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      names: syncLocalizationState(prev.names),
      descriptions: syncLocalizationState(prev.descriptions),
      notes: syncLocalizationState(prev.notes),
    }));
  }, [syncLocalizationState]);

  const handleTagChange = (value: string) => {
    updateForm({ tagsRaw: value, tags: parseTags(value) });
  };

  const toggleAttributeSelection = (attributeId: string) => {
    updateForm({
      attributeIds: formData.attributeIds.includes(attributeId)
        ? formData.attributeIds.filter((id) => id !== attributeId)
        : [...formData.attributeIds, attributeId],
    });
  };

  const clearError = (field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const getStepErrors = useCallback(
    (stepIndex: number): FormErrors => {
      const errors: FormErrors = {};

      if (stepIndex === 0) {
        const key = formData.key.trim();
        if (!key) {
          errors.key = 'Grup anahtarı zorunludur.';
        } else if (!/^[a-z0-9_.-]+$/.test(key)) {
          errors.key = 'Sadece harf, sayı, nokta, tire ve altçizgi kullanılabilir.';
        }

        requiredLanguages.forEach(({ code, label }) => {
          const value = formData.names[code]?.trim();
          if (!value) {
            errors[`name.${code}`] =
              t('attributeGroups.validation.name_required', { language: label }) ||
              `${label} name is required.`;
          }
        });

        if (Number.isNaN(formData.order) || formData.order < 0) {
          errors.order = 'Sıra değeri 0 veya daha büyük olmalıdır.';
        }
      }

      return errors;
    },
    [formData, requiredLanguages, t],
  );

  const recomputeErrors = useCallback(() => {
    const combined: FormErrors = {};
    steps.forEach((_, index) => {
      Object.assign(combined, getStepErrors(index));
    });
    return combined;
  }, [getStepErrors]);

  const validateStep = (stepIndex: number): boolean => {
    const stepErrors = getStepErrors(stepIndex);
    const combined = recomputeErrors();
    setFormErrors(combined);
    return Object.keys(stepErrors).length === 0;
  };

  const validateBeforeSubmit = (): boolean => {
    const combined = recomputeErrors();
    setFormErrors(combined);
    return Object.keys(combined).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const canProceed = () => {
    if (saving) {
      return false;
    }
    if (currentStep === steps.length - 1) {
      return true;
    }
    return Object.keys(getStepErrors(currentStep)).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit()) {
      const firstErrorStep = steps.findIndex((_, index) => Object.keys(getStepErrors(index)).length > 0);
      if (firstErrorStep >= 0) {
        setCurrentStep(firstErrorStep);
      }
      return;
    }

    const payloadKey = formData.key.trim();
    const namespace = 'attribute_groups';

    try {
      setSaving(true);

      const buildTranslations = (
        values: LocalizationState,
        fallback?: LocalizationState,
      ): Record<string, string> => {
        const translations: Record<string, string> = {};
        requiredLanguages.forEach(({ code }) => {
          const primary = values[code]?.trim();
          if (primary) {
            translations[code] = primary;
            return;
          }
          const fallbackValue = fallback?.[code]?.trim();
          if (fallbackValue) {
            translations[code] = fallbackValue;
          }
        });
        return translations;
      };

      const nameTranslations = buildTranslations(formData.names);
      const descriptionTranslations = buildTranslations(formData.descriptions, formData.names);
      const noteTranslations = buildTranslations(formData.notes);

      const nameLocalization = await localizationsService.create({
        namespace,
        key: `${payloadKey}.name`,
        description: null,
        translations: nameTranslations,
      });

      let descriptionLocalizationId: string | undefined;
      if (Object.keys(descriptionTranslations).length > 0) {
        const descriptionLocalization = await localizationsService.create({
          namespace,
          key: `${payloadKey}.description`,
          description: null,
          translations: descriptionTranslations,
        });
        descriptionLocalizationId = descriptionLocalization.id;
      }

      let noteLocalizationId: string | undefined;
      if (Object.keys(noteTranslations).length > 0) {
        const noteLocalization = await localizationsService.create({
          namespace,
          key: `${payloadKey}.note`,
          description: null,
          translations: noteTranslations,
        });
        noteLocalizationId = noteLocalization.id;
      }

      const payload: Record<string, unknown> = {
        key: payloadKey,
        nameLocalizationId: nameLocalization.id,
        displayOrder: formData.order,
      };

      if (formData.attributeIds.length > 0) {
        payload.attributeIds = formData.attributeIds;
      }

      if (descriptionLocalizationId) {
        payload.descriptionLocalizationId = descriptionLocalizationId;
      }
      if (noteLocalizationId) {
        payload.noteLocalizationId = noteLocalizationId;
      }
      if (formData.tags.length > 0) {
        payload.tags = formData.tags;
      }

      const created = await attributeGroupsService.create(payload);

      showToast({
        type: 'success',
        message: 'Attribute grubu başarıyla oluşturuldu.',
      });
      navigate(`/attribute-groups/${created.id}`);
    } catch (error: any) {
      console.error('Failed to create attribute group', error);
      const message =
        error?.response?.data?.error?.message ??
        error?.message ??
        'Attribute grubu oluşturulamadı.';
      showToast({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader
              title="Temel Bilgiler"
              subtitle="Attribute grubunun anahtar bilgilerini tanımlayın"
            />
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
                  <Layers className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Grup Anahtarı"
                    value={formData.key}
                    onChange={(e) => {
                      clearError('key');
                      updateForm({ key: e.target.value.trim().toLowerCase() });
                    }}
                    placeholder="product_information"
                    helperText="Küçük harf, sayı, nokta ve tire kullanılabilir."
                    error={formErrors.key}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredLanguages.map(({ code, label }) => (
                      <Input
                        key={`name-${code}`}
                        label={`İsim (${label})`}
                        value={formData.names[code] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          clearError(`name.${code}`);
                          setFormData((prev) => ({
                            ...prev,
                            names: { ...prev.names, [code]: value },
                          }));
                        }}
                        placeholder={label}
                        required
                        error={formErrors[`name.${code}`]}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredLanguages.map(({ code, label }) => (
                      <div key={`description-${code}`}>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          {`Açıklama (${label})`}
                        </label>
                        <textarea
                          value={formData.descriptions[code] ?? ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              descriptions: { ...prev.descriptions, [code]: e.target.value },
                            }))
                          }
                          placeholder="Grubun ne için kullanılacağını açıklayın"
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredLanguages.map(({ code, label }) => (
                      <div key={`note-${code}`}>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          {`Not (${label})`}
                        </label>
                        <textarea
                          value={formData.notes[code] ?? ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              notes: { ...prev.notes, [code]: e.target.value },
                            }))
                          }
                          placeholder="Formlarda gösterilecek kısa not"
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <Input
                      label="Gösterim Sırası"
                      type="number"
                      value={formData.order}
                      onChange={(e) => {
                        clearError('order');
                        const value = Number(e.target.value);
                        updateForm({ order: Number.isNaN(value) ? 0 : value });
                      }}
                      min={0}
                      error={formErrors.order}
                      helperText="Daha düşük değerler önce gösterilir."
                    />

                    <Input
                      label="Etiketler"
                      value={formData.tagsRaw}
                      onChange={(e) => handleTagChange(e.target.value)}
                      placeholder="örn: basic, marketing, merchandising"
                      helperText="Virgülle ayrılmış değerler kullanın."
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader
              title="Attribute Seçimi"
              subtitle="Grubun içerisinde bulunacak attribute’ları belirleyin"
            />

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative md:w-72">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Attribute ara..."
                    leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Badge size="sm" variant="outline">
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    {formData.attributeIds.length} seçili
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateForm({ attributeIds: attributes.map((attr) => attr.id) })}
                  >
                    Tümünü seç
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateForm({ attributeIds: [] })}>
                    Seçimi temizle
                  </Button>
                </div>
              </div>

              {attributesError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {attributesError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {attributesLoading ? (
                  <div className="col-span-full text-sm text-muted-foreground">Attribute listesi yükleniyor...</div>
                ) : filteredAttributes.length === 0 ? (
                  <div className="col-span-full text-sm text-muted-foreground">Sonuç bulunamadı.</div>
                ) : (
                  filteredAttributes.map((attribute) => {
                    const selected = formData.attributeIds.includes(attribute.id);
                    return (
                      <button
                        key={attribute.id}
                        onClick={() => toggleAttributeSelection(attribute.id)}
                        type="button"
                        className={`p-4 border-2 rounded-xl text-left transition ${
                          selected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border hover:border-border hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${selected ? 'bg-primary/20' : 'bg-muted'}`}>
                            <Tags className={`h-4 w-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{attribute.name}</span>
                              {attribute.required ? (
                                <Badge size="xs" variant="error">
                                  Zorunlu
                                </Badge>
                              ) : null}
                            </div>
                            {attribute.description ? (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {attribute.description}
                              </p>
                            ) : null}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              <code>{attribute.key ?? attribute.id}</code>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {formErrors.attributeIds ? (
                <p className="text-xs text-error">{formErrors.attributeIds}</p>
              ) : null}
            </div>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader
              title="Önizleme"
              subtitle="Attribute grubunu kaydetmeden önce bilgileri doğrulayın"
            />
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Temel Bilgiler</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Anahtar:</span>{' '}
                    <code>{formData.key || '—'}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sıra:</span> {formData.order}
                  </div>
                  <div>
                    <span className="text-muted-foreground">İsimler:</span>
                    <div className="mt-1 space-y-1">
                      {requiredLanguages.map(({ code, label }) => (
                        <div key={`preview-name-${code}`}>
                          <span className="text-muted-foreground">{label}:</span>{' '}
                          {formData.names[code]?.trim() || '—'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Açıklamalar:</span>
                    <div className="mt-1 space-y-1">
                      {requiredLanguages.map(({ code, label }) => (
                        <div key={`preview-description-${code}`}>
                          <span className="text-muted-foreground">{label}:</span>{' '}
                          {formData.descriptions[code]?.trim() || '—'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notlar:</span>
                    <div className="mt-1 space-y-1">
                      {requiredLanguages.map(({ code, label }) => (
                        <div key={`preview-note-${code}`}>
                          <span className="text-muted-foreground">{label}:</span>{' '}
                          {formData.notes[code]?.trim() || '—'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Etiketler:</span>{' '}
                    {formData.tags.length > 0 ? formData.tags.join(', ') : '—'}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Seçilen Attribute’lar ({formData.attributeIds.length})
                </h3>
                <div className="space-y-2">
                  {formData.attributeIds.map((attributeId) => {
                    const attribute = attributes.find((item) => item.id === attributeId);
                    if (!attribute) {
                      return null;
                    }
                    return (
                      <div
                        key={attributeId}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted"
                      >
                        <div>
                          <p className="text-sm text-foreground font-medium">{attribute.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attribute.type} • {attribute.key ?? attribute.id}
                          </p>
                        </div>
                        {attribute.required ? (
                          <Badge size="xs" variant="error">
                            Zorunlu
                          </Badge>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      <Card className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto pr-1">{renderStepContent()}</div>

        <div className="flex justify-between items-center pt-6 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || saving}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            {t('common.back')}
          </Button>

          <div className="flex gap-3">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                loading={saving}
                disabled={!canProceed()}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Attribute Grubunu Oluştur
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {t('common.continue')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AttributeGroupsCreate;
