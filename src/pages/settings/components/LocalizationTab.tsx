import React, { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { UpdateSettingsPayload } from '../../../api/types/api.types';

interface LocalizationTabProps {
  form: UpdateSettingsPayload;
  isLocked: boolean;
  onLocalizationChange: (field: keyof UpdateSettingsPayload['localization'], value: string | boolean) => void;
  onOpenLanguageModal: () => void;
  renderSupportedLanguages: () => ReactNode;
}

export const LocalizationTab: React.FC<LocalizationTabProps> = ({
  form,
  isLocked,
  onLocalizationChange,
  onOpenLanguageModal,
  renderSupportedLanguages,
}) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader
        title={t('settings.localization.title')}
        subtitle={t('settings.localization.subtitle')}
        className="border-none mb-2"
        action={
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            className="w-full md:w-auto"
            onClick={onOpenLanguageModal}
            disabled={isLocked}
          >
            {t('settings.localization.add_language')}
          </Button>
        }
      />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('settings.localization.default_language')}
            value={form.localization.defaultLanguage}
            onChange={(e) => onLocalizationChange('defaultLanguage', e.target.value)}
            options={form.localization.supportedLanguages.map((lang) => ({
              value: lang.code,
              label: `${lang.label} (${lang.code})`,
            }))}
            disabled={isLocked}
          />
          <Select
            label={t('settings.localization.fallback_language')}
            value={form.localization.fallbackLanguage}
            onChange={(e) => onLocalizationChange('fallbackLanguage', e.target.value)}
            options={form.localization.supportedLanguages.map((lang) => ({
              value: lang.code,
              label: `${lang.label} (${lang.code})`,
            }))}
            disabled={isLocked}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label={t('settings.localization.allow_user_switch')}
            checked={form.localization.allowUserLanguageSwitch}
            onChange={(e) => onLocalizationChange('allowUserLanguageSwitch', e.target.checked)}
            disabled={isLocked}
          />
          <Checkbox
            label={t('settings.localization.auto_translate')}
            checked={form.localization.autoTranslateNewContent}
            onChange={(e) => onLocalizationChange('autoTranslateNewContent', e.target.checked)}
            helperText={t('settings.localization.auto_translate_help')}
            disabled={isLocked}
          />
        </div>

        {renderSupportedLanguages()}
      </div>
    </Card>
  );
};
