import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Globe, Languages, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { localizationsService } from '../../api';
import type { LocalizationRecord, UpdateLocalizationRequest } from '../../api/types/api.types';

const namespaceOptions = [
  { value: 'common', label: 'Common' },
  { value: 'items', label: 'Items' },
  { value: 'categories', label: 'Categories' },
  { value: 'attributes', label: 'Attributes' },
  { value: 'validation', label: 'Validation' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'forms', label: 'Forms' },
  { value: 'messages', label: 'Messages' },
];

const normalizeLanguageCode = (code: string): string => {
  const trimmed = code.trim();
  if (!trimmed.includes('-')) {
    return trimmed.toLowerCase();
  }
  const [language, region] = trimmed.split('-', 2);
  return `${language.toLowerCase()}-${(region ?? '').toUpperCase()}`;
};

export const LocalizationsDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const { success: showSuccess, error: showError } = useToast();

  const [localization, setLocalization] = useState<LocalizationRecord | null>(null);
  const [formData, setFormData] = useState<LocalizationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    const fetchLocalization = async () => {
      try {
        setLoading(true);
        const response = await localizationsService.getById(id);
        setLocalization(response);
        setFormData(response);
        setFetchError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('common.error');
        setFetchError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchLocalization();
  }, [id, t]);

  const supportedLanguages = settings?.localization.supportedLanguages ?? [];

  const requiredLanguageCodes = useMemo(
    () =>
      supportedLanguages
        .filter((lang) => lang.required)
        .map((lang) => normalizeLanguageCode(lang.code)),
    [supportedLanguages],
  );

  useEffect(() => {
    if (!formData) {
      return;
    }

    setFormData((prev) => {
      if (!prev) {
        return prev;
      }
      const nextTranslations = { ...prev.translations };
      let changed = false;
      for (const code of requiredLanguageCodes) {
        if (!(code in nextTranslations)) {
          nextTranslations[code] = '';
          changed = true;
        }
      }
      return changed ? { ...prev, translations: nextTranslations } : prev;
    });
  }, [requiredLanguageCodes, formData?.translations]);

  const optionalLanguages = useMemo(
    () =>
      supportedLanguages.filter(
        (lang) => !lang.required && !(normalizeLanguageCode(lang.code) in (formData?.translations ?? {})),
      ),
    [formData?.translations, supportedLanguages],
  );

  const orderedLanguages = useMemo(() => {
    if (!formData) {
      return [] as { code: string; label: string; required: boolean }[];
    }
    return Object.keys(formData.translations)
      .map((code) => ({
        code,
        label:
          supportedLanguages.find((lang) => normalizeLanguageCode(lang.code) === code)?.label ?? code.toUpperCase(),
        required: requiredLanguageCodes.includes(code),
      }))
      .sort((a, b) => {
        if (a.required && !b.required) return -1;
        if (!a.required && b.required) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [formData, requiredLanguageCodes, supportedLanguages]);

  const updateTranslation = (languageCode: string, value: string) => {
    if (!formData) {
      return;
    }
    const normalized = normalizeLanguageCode(languageCode);
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [normalized]: value,
        },
      };
    });
  };

  const handleAddLanguage = (languageCode: string) => {
    const normalized = normalizeLanguageCode(languageCode);
    setFormData((prev) => {
      if (!prev || normalized in prev.translations) {
        return prev;
      }
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [normalized]: '',
        },
      };
    });
  };

  const handleRemoveLanguage = (languageCode: string) => {
    const normalized = normalizeLanguageCode(languageCode);
    if (requiredLanguageCodes.includes(normalized)) {
      showError(t('settings.localization.messages.required_minimum'));
      return;
    }
    setFormData((prev) => {
      if (!prev) return prev;
      const next = { ...prev.translations };
      delete next[normalized];
      return {
        ...prev,
        translations: next,
      };
    });
  };

  const handleStartEdit = () => {
    if (localization) {
      setFormData(localization);
    }
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    if (localization) {
      setFormData(localization);
    }
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!formData || !localization || !id) {
      return;
    }

    const requiredFilled = requiredLanguageCodes.every((code) => (formData.translations[code] ?? '').trim().length > 0);
    if (!requiredFilled) {
      showError(t('settings.localization.messages.language_required'));
      return;
    }

    const preparedEntries = Object.entries(formData.translations)
      .map(([code, value]) => [code, value.trim()] as const)
      .filter(([code, value]) => (requiredLanguageCodes.includes(code) ? true : value.length > 0));

    const payload: UpdateLocalizationRequest = {
      namespace: formData.namespace.trim(),
      key: formData.key.trim(),
      description: formData.description?.trim() ?? null,
      translations: Object.fromEntries(preparedEntries),
    };

    try {
      setSaving(true);
      const updated = await localizationsService.update(id, payload);
      setLocalization(updated);
      setFormData(updated);
      setEditMode(false);
      showSuccess(t('localizations.messages.update_success'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const defaultLanguageCode = useMemo(
    () => normalizeLanguageCode(settings?.localization.defaultLanguage ?? 'en'),
    [settings?.localization.defaultLanguage],
  );

  const defaultLanguageLabel = useMemo(() => {
    const match = settings?.localization.supportedLanguages.find(
      (lang) => normalizeLanguageCode(lang.code) === defaultLanguageCode,
    );
    return match?.label ?? defaultLanguageCode.toUpperCase();
  }, [defaultLanguageCode, settings?.localization.supportedLanguages]);

  const fallbackLanguageInfo = useMemo(() => {
    const fallbackCode = normalizeLanguageCode(settings?.localization.fallbackLanguage ?? defaultLanguageCode);
    const match = settings?.localization.supportedLanguages.find(
      (lang) => normalizeLanguageCode(lang.code) === fallbackCode,
    );
    return {
      code: fallbackCode,
      label: match?.label ?? fallbackCode.toUpperCase(),
    };
  }, [defaultLanguageCode, settings?.localization.fallbackLanguage, settings?.localization.supportedLanguages]);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-6 text-center text-sm text-muted-foreground">{t('settings.loading')}</div>
        </Card>
      </div>
    );
  }

  if (fetchError || !localization || !formData) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-error">{fetchError ?? t('localizations.no_localizations')}</p>
            <Button variant="outline" onClick={() => navigate('/localizations')}>
              {t('common.back')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Translation Information" />
            <div className="space-y-4 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground font-mono">{localization.key}</h3>
                  <p className="text-xs text-muted-foreground">ID: {localization.id}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Namespace</p>
                  <Badge variant="primary" size="sm">{localization.namespace}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Default</p>
                  <Badge variant="success" size="sm">
                    {defaultLanguageLabel} ({defaultLanguageCode})
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Fallback</p>
                  <Badge variant="secondary" size="sm">
                    {fallbackLanguageInfo.label} ({fallbackLanguageInfo.code})
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Updated</p>
                  <p className="text-sm text-foreground">{new Date(localization.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Translation Details" subtitle="Manage translation information" />
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Translation Key"
                    value={formData.key}
                    onChange={(e) => setFormData((prev) => prev && ({ ...prev, key: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Select
                    label="Namespace"
                    value={formData.namespace}
                    onChange={(e) => setFormData((prev) => prev && ({ ...prev, namespace: e.target.value }))}
                    options={namespaceOptions}
                    disabled={!editMode}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    value={formData.description ?? ''}
                    onChange={(e) => setFormData((prev) => prev && ({ ...prev, description: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {!editMode ? (
                  <Button onClick={handleStartEdit} leftIcon={<Edit2 className="h-4 w-4" />}>
                    {t('common.edit')}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSave} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
                      {t('common.save')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Translations" subtitle="Manage translations for different languages" />
            <div className="space-y-4 p-4">
              {orderedLanguages.map((lang) => (
                <div key={lang.code} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{lang.label}</p>
                      <p className="text-xs text-muted-foreground">{lang.code.toUpperCase()}</p>
                    </div>
                    {lang.required && (
                      <Badge variant="warning" size="sm">
                        {t('settings.localization.labels.required_badge')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      value={formData.translations[lang.code] ?? ''}
                      onChange={(e) => updateTranslation(lang.code, e.target.value)}
                      disabled={!editMode}
                      placeholder={t('localizations.translation_text', { language: lang.label })}
                      required={lang.required}
                    />
                  </div>
                  {editMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLanguage(lang.code)}
                      disabled={lang.required || saving}
                      className="text-error hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {editMode && optionalLanguages.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">{t('localizations.add_translation')}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {optionalLanguages.map((lang) => {
                      const code = normalizeLanguageCode(lang.code);
                      return (
                        <button
                          key={code}
                          onClick={() => handleAddLanguage(code)}
                          type="button"
                          className="flex items-center justify-between px-3 py-2 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition"
                          disabled={saving}
                        >
                          <span className="text-sm font-medium text-foreground">{lang.label}</span>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
