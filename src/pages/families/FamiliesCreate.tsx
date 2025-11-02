import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { familiesService } from '../../api/services/families.service';
import { categoriesService } from '../../api/services/categories.service';
import { localizationsService } from '../../api/services/localizations.service';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import type { Family, Category } from '../../types';

interface FormState {
  key: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  parentFamilyId: string;
  categoryId: string;
  isSystemFamily: boolean;
}

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
  });
  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const enLabel = t('families.fields.name_en');
      const trLabel = t('families.fields.name_tr');
      const fallbackBase =
        enLabel !== 'families.fields.name_en'
          ? enLabel.replace(/\s*\(.*\)/, '')
          : trLabel !== 'families.fields.name_tr'
          ? trLabel.replace(/\s*\(.*\)/, '')
          : 'Name';

      return `${fallbackBase} (${languageLabel})`;
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

      const enLabel = t('families.fields.description_en');
      const trLabel = t('families.fields.description_tr');
      const fallbackBase =
        enLabel !== 'families.fields.description_en'
          ? enLabel.replace(/\s*\(.*\)/, '')
          : trLabel !== 'families.fields.description_tr'
          ? trLabel.replace(/\s*\(.*\)/, '')
          : 'Description';

      return `${fallbackBase} (${languageLabel})`;
    },
    [t],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      try {
        setInitialLoading(true);
        const [familyResult, categoryResult] = await Promise.all([
          familiesService.list({ limit: 200 }),
          categoriesService.list({ limit: 200 }),
        ]);
        if (!cancelled) {
          setFamilies(familyResult.items);
          setCategories(categoryResult.items);
        }
      } catch (err: any) {
        console.error('Failed to load lookup data', err);
        if (!cancelled) {
          setError(
            err?.response?.data?.error?.message ??
              t('families.lookup_failed') ??
              'Gerekli veriler yüklenemedi.',
          );
        }
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

  const updateForm = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.key.trim()) {
      showToast({ type: 'error', message: t('families.validation.key') || 'Key zorunlu.' });
      return;
    }

    const missingLanguage = requiredLanguages.find(({ code }) => !form.names[code]?.trim());
    if (missingLanguage) {
      const message =
        t('families.validation.name_language_required', { language: missingLanguage.label }) ||
        `${missingLanguage.label} adı zorunludur.`;
      showToast({ type: 'error', message });
      return;
    }

    try {
      setLoading(true);
      const normalizedKey = form.key.trim().toLowerCase();
      const namespace = 'families';

      const buildTranslations = (
        values: Record<string, string>,
        fallback?: Record<string, string>,
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

      const nameTranslations = buildTranslations(form.names);
      const descriptionTranslations = buildTranslations(form.descriptions, form.names);

      const nameLocalization = await localizationsService.create({
        namespace,
        key: `${normalizedKey}.name`,
        description: null,
        translations: nameTranslations,
      });

      let descriptionLocalizationId: string | undefined;
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
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('families.create_title') || 'Create Family'}
        description={
          t('families.create_subtitle') ||
          'Family hiyerarşisinde kullanılacak yeni bir kayıt oluşturun'
        }
      />

      <Card>
        <CardHeader title={t('families.create_form') || 'Family Information'} />
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          {error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : null}

          {initialLoading ? (
            <div className="text-sm text-muted-foreground">
              {t('common.loading') || 'Loading...'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('families.fields.key') || 'Key'}
                  value={form.key}
                  onChange={(e) => updateForm({ key: e.target.value })}
                  placeholder="coffee_products"
                  required
                />
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="isSystemFamily"
                    type="checkbox"
                    checked={form.isSystemFamily}
                    onChange={(e) => updateForm({ isSystemFamily: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isSystemFamily" className="text-sm text-foreground">
                    {t('families.fields.is_system') || 'System family'}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredLanguages.map(({ code, label }) => (
                  <Input
                    key={`family-name-${code}`}
                    label={resolveNameLabel(code, label)}
                    value={form.names[code] ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        names: { ...prev.names, [code]: value },
                      }));
                    }}
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
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          descriptions: { ...prev.descriptions, [code]: value },
                        }));
                      }}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('families.fields.parent') || 'Parent Family'}
                  </label>
                  <select
                    value={form.parentFamilyId}
                    onChange={(e) => updateForm({ parentFamilyId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">
                      {t('families.root_label') || 'No parent (root family)'}
                    </option>
                    {families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('families.fields.category') || 'Category'}
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => updateForm({ categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">
                      {t('families.select_category') || 'Select category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? t('common.saving') || 'Saving...' : t('common.save') || 'Save'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  );
};
