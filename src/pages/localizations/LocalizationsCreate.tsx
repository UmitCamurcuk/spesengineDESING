import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Globe, Languages, Plus, X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';
import { localizationsService } from '../../api';
import type { CreateLocalizationRequest } from '../../api/types/api.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Key and namespace' },
  { id: 'translations', name: 'Translations', description: 'Add translations' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

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

interface LocalizationFormState {
  key: string;
  namespace: string;
  description: string;
  translations: Record<string, string>;
}

export const LocalizationsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const { success: showSuccess, error: showError } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LocalizationFormState>({
    key: '',
    namespace: namespaceOptions[0]?.value ?? 'common',
    description: '',
    translations: {},
  });

  const supportedLanguages = settings?.localization.supportedLanguages ?? [];

  const requiredLanguageCodes = useMemo(
    () =>
      supportedLanguages
        .filter((lang) => lang.required)
        .map((lang) => normalizeLanguageCode(lang.code)),
    [supportedLanguages],
  );

  useEffect(() => {
    if (!supportedLanguages.length) {
      return;
    }

    setFormData((prev) => {
      const nextTranslations = { ...prev.translations };
      let changed = false;

      for (const lang of requiredLanguageCodes) {
        if (!(lang in nextTranslations)) {
          nextTranslations[lang] = '';
          changed = true;
        }
      }

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        translations: nextTranslations,
      };
    });
  }, [requiredLanguageCodes, supportedLanguages.length]);

  const optionalLanguages = useMemo(
    () =>
      supportedLanguages.filter((lang) => !lang.required && !(normalizeLanguageCode(lang.code) in formData.translations)),
    [formData.translations, supportedLanguages],
  );

  const orderedLanguages = useMemo(() => {
    const codes = Object.keys(formData.translations);
    return codes
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
  }, [formData.translations, requiredLanguageCodes, supportedLanguages]);

  const updateTranslation = (languageCode: string, value: string) => {
    const normalized = normalizeLanguageCode(languageCode);
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [normalized]: value,
      },
    }));
  };

  const handleAddLanguage = (languageCode: string) => {
    const normalized = normalizeLanguageCode(languageCode);
    if (normalized in formData.translations) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [normalized]: '',
      },
    }));
  };

  const handleRemoveLanguage = (languageCode: string) => {
    const normalized = normalizeLanguageCode(languageCode);
    if (requiredLanguageCodes.includes(normalized)) {
      showError(t('settings.localization.messages.required_minimum'));
      return;
    }
    setFormData((prev) => {
      const next = { ...prev.translations };
      delete next[normalized];
      return {
        ...prev,
        translations: next,
      };
    });
  };

  const canProceed = (step: number) => {
    if (step === 0) {
      return formData.key.trim().length > 0 && formData.namespace.trim().length > 0;
    }

    if (step === 1) {
      return requiredLanguageCodes.every((code) => (formData.translations[code] ?? '').trim().length > 0);
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed(1)) {
      showError(t('settings.localization.messages.language_required'));
      return;
    }

    const preparedEntries = Object.entries(formData.translations)
      .map(([code, value]) => [code, value.trim()] as const)
      .filter(([code, value]) => (requiredLanguageCodes.includes(code) ? true : value.length > 0));

    const payload: CreateLocalizationRequest = {
      key: formData.key.trim(),
      namespace: formData.namespace.trim(),
      description: formData.description.trim() || undefined,
      translations: Object.fromEntries(preparedEntries),
    };

    try {
      setLoading(true);
      const created = await localizationsService.create(payload);
      showSuccess(t('localizations.messages.create_success'));
      navigate(`/localizations/${created.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedLanguages = useMemo(() => orderedLanguages.map((item) => item.code), [orderedLanguages]);

  const isReady = supportedLanguages.length > 0;

  const renderTranslationsStep = () => (
    <Card>
      <CardHeader
        title="Add Translations"
        subtitle="Provide translations for different languages"
      />
      <div className="space-y-6">
        <div className="space-y-4">
          {orderedLanguages.map((lang) => (
            <div key={lang.code} className="flex items-start gap-3">
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
                  placeholder={t('localizations.translation_text', { language: lang.label })}
                  required={lang.required}
                />
              </div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLanguage(lang.code)}
                  disabled={lang.required}
                  className="text-error hover:text-error"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {optionalLanguages.length > 0 && (
          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-medium text-foreground mb-3">{t('localizations.add_translation')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {optionalLanguages.map((lang) => {
                const code = normalizeLanguageCode(lang.code);
                return (
                  <button
                    key={code}
                    onClick={() => handleAddLanguage(code)}
                    className="flex items-center justify-between px-3 py-2 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition"
                    type="button"
                  >
                    <span className="text-sm font-medium text-foreground">{lang.label}</span>
                    <span className="text-xs text-muted-foreground">{code.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader
              title="Translation Information"
              subtitle="Define the basic properties of your translation"
            />
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Translation Key"
                    value={formData.key}
                    onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                    placeholder="e.g., common.save, items.create_title"
                    required
                    helperText="Use dot notation for nested keys (namespace.key)"
                  />
                  <Select
                    label="Namespace"
                    value={formData.namespace}
                    onChange={(e) => setFormData((prev) => ({ ...prev, namespace: e.target.value }))}
                    options={namespaceOptions}
                    required
                    helperText="Group related translations together"
                  />
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe where this translation is used"
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      case 1:
        return renderTranslationsStep();
      case 2:
        return (
          <Card>
            <CardHeader
              title="Review & Confirm"
              subtitle="Please review your translation details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Key:</span> <code className="font-mono">{formData.key}</code></p>
                    <p><span className="text-muted-foreground">Namespace:</span> {formData.namespace}</p>
                    {formData.description && (
                      <p><span className="text-muted-foreground">Description:</span> {formData.description}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Languages</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedLanguages.length} {selectedLanguages.length === 1 ? 'language' : 'languages'} selected
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {orderedLanguages.map((lang) => (
                      <Badge key={lang.code} variant={lang.required ? 'warning' : 'secondary'} size="sm">
                        {lang.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-medium text-foreground mb-3">Translations</h4>
                <div className="space-y-3">
                  {orderedLanguages.map((lang) => (
                    <div key={lang.code} className="p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground uppercase">{lang.label}</p>
                      <p className="text-sm text-foreground italic">
                        {formData.translations[lang.code]?.trim() ? `"${formData.translations[lang.code].trim()}"` : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  if (!isReady) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-6 text-center text-sm text-muted-foreground">
            {t('settings.loading')}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {renderStepContent()}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || loading}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>

        <div className="flex space-x-3">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!canProceed(1)}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Create Translation
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed(currentStep) || loading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
