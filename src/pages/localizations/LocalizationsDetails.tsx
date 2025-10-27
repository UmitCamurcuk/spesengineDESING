import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Globe, Languages, Plus, Edit2, Save, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { localizationsService } from '../../api';
import type { LocalizationRecord, UpdateLocalizationRequest } from '../../api/types/api.types';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { HistoryTable } from '../../components/common/HistoryTable';
import { PERMISSIONS } from '../../config/permissions';

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
  const { formatDateTime } = useDateFormatter();
  const { success: showSuccess, error: showError } = useToast();
  const { hasPermission } = useAuth();
  const canUpdateLocalization = hasPermission(PERMISSIONS.SYSTEM.LOCALIZATIONS.UPDATE);

  const [activeTab, setActiveTab] = useState<string>('general');
  const [localization, setLocalization] = useState<LocalizationRecord | null>(null);
  const [formData, setFormData] = useState<LocalizationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const supportedLanguages = settings?.localization.supportedLanguages ?? [];

  const requiredLanguageCodes = useMemo(
    () =>
      supportedLanguages
        .filter((lang) => lang.required)
        .map((lang) => normalizeLanguageCode(lang.code)),
    [supportedLanguages],
  );

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

  const optionalLanguages = useMemo(
    () =>
      supportedLanguages.filter(
        (lang) => !lang.required && !(normalizeLanguageCode(lang.code) in (formData?.translations ?? {})),
      ),
    [formData?.translations, supportedLanguages],
  );

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
    if (!canUpdateLocalization) {
      return;
    }
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
    if (!canUpdateLocalization) {
      return;
    }

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

  const fallbackLanguageCode = useMemo(
    () => normalizeLanguageCode(settings?.localization.fallbackLanguage ?? defaultLanguageCode),
    [settings?.localization.fallbackLanguage, defaultLanguageCode],
  );

  const resolveLanguageLabel = useCallback(
    (code: string) => {
      const normalized = normalizeLanguageCode(code);
      return (
        supportedLanguages.find((lang) => normalizeLanguageCode(lang.code) === normalized)?.label ?? normalized.toUpperCase()
      );
    },
    [supportedLanguages],
  );

  const renderTranslationsList = () => {
    if (!formData) {
      return null;
    }

    return (
      <div className="space-y-4">
        {orderedLanguages.map((lang) => (
          <div key={lang.code} className="border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant={lang.required ? 'warning' : 'secondary'} size="sm">
                  {resolveLanguageLabel(lang.code)}
                </Badge>
                <span className="text-xs text-muted-foreground">{lang.code}</span>
                {lang.required && (
                  <Badge variant="warning" size="sm">
                    {t('settings.localization.labels.required_badge')}
                  </Badge>
                )}
              </div>
              {editMode && !lang.required && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLanguage(lang.code)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-3">
              {editMode ? (
                <Input
                  value={formData.translations[lang.code] ?? ''}
                  onChange={(e) => updateTranslation(lang.code, e.target.value)}
                  placeholder={t('localizations.translation_text', { language: resolveLanguageLabel(lang.code) })}
                  required={lang.required}
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {formData.translations[lang.code] ?? '—'}
                </p>
              )}
            </div>
          </div>
        ))}

        {editMode && optionalLanguages.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">
              {t('localizations.add_translation')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {optionalLanguages.map((lang) => {
                const normalized = normalizeLanguageCode(lang.code);
                return (
                  <Button
                    key={lang.code}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddLanguage(normalized)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {lang.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-6 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
        </Card>
      </div>
    );
  }

  if (fetchError || !localization || !formData) {
    return (
      <div className="p-6 space-y-4">
        <Card>
          <div className="p-6 space-y-3 text-center">
            <p className="text-sm text-error">{fetchError ?? t('localizations.no_localizations')}</p>
            <Button type="button" variant="outline" onClick={() => navigate('/localizations')}>
              {t('common.back')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: t('localizations.details_tabs.general'), icon: <Globe className="h-4 w-4" /> },
    { id: 'history', label: t('localizations.details_tabs.history'), icon: <Languages className="h-4 w-4" /> },
  ];

  const headerAction = canUpdateLocalization
    ? (!editMode
        ? (
          <Button type="button" onClick={handleStartEdit} leftIcon={<Edit2 className="h-4 w-4" />}>
            {t('common.edit')}
          </Button>
        )
        : (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleSave} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
              {t('common.save')}
            </Button>
          </div>
        ))
    : null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`${localization.namespace}.${localization.key}`}
        subtitle={t('localizations.details_subtitle')}
        action={headerAction}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'general' && (
        <TabPanel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader
                  title={t('localizations.details_sections.info_title')}
                  subtitle={t('localizations.details_sections.info_subtitle')}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label={t('localizations.namespace')}
                    value={formData.namespace}
                    onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                    options={namespaceOptions}
                    disabled={!editMode}
                  />
                  <Input
                    label={t('localizations.key')}
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    disabled={!editMode}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label={t('localizations.description')}
                      value={formData.description ?? ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title={t('localizations.details_sections.translations_title')}
                  subtitle={t('localizations.details_sections.translations_subtitle')}
                />
                {renderTranslationsList()}
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader title={t('localizations.details_sections.metadata_title')} />
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">{t('settings.localization.labels.default')}</span>
                    <span className="font-medium text-foreground">
                      {resolveLanguageLabel(defaultLanguageCode)} ({defaultLanguageCode})
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">{t('settings.localization.labels.fallback')}</span>
                    <span className="font-medium text-foreground">
                      {resolveLanguageLabel(fallbackLanguageCode)} ({fallbackLanguageCode})
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">{t('localizations.created_at')}</span>
                    <span className="font-medium text-foreground">
                      {formatDateTime(localization.createdAt, { includeTime: true })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">{t('localizations.updated_at')}</span>
                    <span className="font-medium text-foreground">
                      {formatDateTime(localization.updatedAt, { includeTime: true })}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title={t('localizations.details_sections.selected_languages_title')}
                  subtitle={t('localizations.details_sections.selected_languages_subtitle')}
                />
                <div className="flex flex-wrap gap-2">
                  {orderedLanguages.map((lang) => (
                    <Badge key={lang.code} variant={lang.required ? 'warning' : 'secondary'} size="sm">
                      {resolveLanguageLabel(lang.code)} ({lang.code})
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>
      )}

      {activeTab === 'history' && (
        <TabPanel>
          <Card>
            <CardHeader
              title={t('settings.history.title')}
              subtitle={t('settings.history.subtitle')}
              className="border-none mb-2"
            />
            <div className="p-4">
              <HistoryTable
                entityType="Localization"
                entityId={localization.id}
                title={t('settings.history.title')}
                description={t('settings.history.subtitle')}
              />
            </div>
          </Card>
        </TabPanel>
      )}
    </div>
  );
};
