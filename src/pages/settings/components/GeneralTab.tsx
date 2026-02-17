import React from 'react';
import { Monitor, Sun, Moon, Type, Layout } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Badge } from '../../../components/ui/Badge';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { UpdateSettingsPayload } from '../../../api/types/api.types';

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai' },
];

const dateFormatOptions = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
];

const themeModeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const darkVariantOptions = [
  { value: 'slate', label: 'Slate' },
  { value: 'navy', label: 'Navy' },
  { value: 'true-black', label: 'True Black' },
];

const fontScaleOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
];

interface GeneralTabProps {
  form: UpdateSettingsPayload;
  isLocked: boolean;
  isEditing: boolean;
  onGeneralChange: (field: keyof UpdateSettingsPayload['general'], value: string | boolean) => void;
  onAppearanceChange: (field: keyof UpdateSettingsPayload['appearance'], value: string | boolean) => void;
}

const ThemeModeIcon = ({ mode }: { mode: string }) => {
  if (mode === 'dark') return <Moon className="h-4 w-4" />;
  if (mode === 'light') return <Sun className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
};

export const GeneralTab: React.FC<GeneralTabProps> = ({
  form,
  isLocked,
  isEditing,
  onGeneralChange,
  onAppearanceChange,
}) => {
  const { t } = useLanguage();

  const themeMode = form.appearance.themeMode;
  const darkVariant = form.appearance.darkVariant;
  const fontScale = form.appearance.fontScale ?? 'normal';
  const compactMode = form.appearance.compactMode;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* General settings */}
      <Card>
        <CardHeader
          title={t('settings.general.title')}
          subtitle={t('settings.general.subtitle')}
          className="border-none mb-2"
        />
        <div className="space-y-4">
          <Input
            label={t('settings.general.company_name')}
            value={form.general.companyName}
            onChange={(e) => onGeneralChange('companyName', e.target.value)}
            placeholder="Spes Engine"
            required
            disabled={isLocked}
          />
          <Select
            label={t('settings.general.timezone')}
            value={form.general.timezone}
            onChange={(e) => onGeneralChange('timezone', e.target.value)}
            options={timezoneOptions}
            disabled={isLocked}
          />
          <Select
            label={t('settings.general.date_format')}
            value={form.general.dateFormat}
            onChange={(e) => onGeneralChange('dateFormat', e.target.value)}
            options={dateFormatOptions}
            disabled={isLocked}
          />
          <Checkbox
            label={t('settings.general.maintenance_mode')}
            checked={form.general.maintenanceMode}
            onChange={(e) => onGeneralChange('maintenanceMode', e.target.checked)}
            helperText={t('settings.general.maintenance_mode_help')}
            disabled={isLocked}
          />
        </div>
      </Card>

      {/* Appearance settings + live preview */}
      <div className="space-y-4">
        <Card>
          <CardHeader
            title={t('settings.appearance.title')}
            subtitle={t('settings.appearance.subtitle')}
            className="border-none mb-2"
          />
          <div className="space-y-4">
            <Select
              label={t('settings.appearance.theme_mode')}
              value={themeMode}
              onChange={(e) => onAppearanceChange('themeMode', e.target.value)}
              options={themeModeOptions}
              disabled={isLocked}
            />
            {themeMode !== 'light' && (
              <Select
                label={t('settings.appearance.dark_variant')}
                value={darkVariant}
                onChange={(e) => onAppearanceChange('darkVariant', e.target.value)}
                options={darkVariantOptions}
                disabled={isLocked}
              />
            )}
            <Checkbox
              label={t('settings.appearance.compact_mode')}
              checked={compactMode}
              onChange={(e) => onAppearanceChange('compactMode', e.target.checked)}
              helperText={t('settings.appearance.compact_mode_help')}
              disabled={isLocked}
            />
            <Checkbox
              label={t('settings.appearance.show_avatars')}
              checked={form.appearance.showAvatars}
              onChange={(e) => onAppearanceChange('showAvatars', e.target.checked)}
              disabled={isLocked}
            />
            <Select
              label={t('settings.appearance.font_scale') || 'Font Size'}
              value={fontScale}
              onChange={(e) => onAppearanceChange('fontScale', e.target.value)}
              options={fontScaleOptions.map((option) => ({
                value: option.value,
                label:
                  option.value === 'large'
                    ? t('settings.appearance.font_scale_large') || option.label
                    : t('settings.appearance.font_scale_normal') || option.label,
              }))}
              disabled={isLocked}
            />
          </div>
        </Card>

        {/* Live preview card — shown only while editing */}
        {isEditing && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-xs font-medium text-primary uppercase tracking-wide">
              {t('settings.appearance.preview') || 'Preview — live'}
            </p>

            {/* Theme preview row */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-foreground">
                <ThemeModeIcon mode={themeMode} />
                <span className="font-medium capitalize">{themeMode}</span>
              </div>
              {themeMode !== 'light' && (
                <Badge variant="secondary" size="sm">
                  {darkVariant}
                </Badge>
              )}
            </div>

            {/* Font size preview */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Type className="h-3.5 w-3.5" />
                <span>{t('settings.appearance.font_scale') || 'Font Size'}</span>
              </div>
              <p
                className="text-foreground"
                style={{ fontSize: fontScale === 'large' ? '16px' : '14px', lineHeight: '1.5' }}
              >
                {fontScale === 'large'
                  ? (t('settings.appearance.font_scale_large') || 'Large') + ' — Aa Bb Cc'
                  : (t('settings.appearance.font_scale_normal') || 'Normal') + ' — Aa Bb Cc'}
              </p>
            </div>

            {/* Compact preview */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layout className="h-3.5 w-3.5" />
              <span>
                {compactMode
                  ? t('settings.appearance.compact_mode') || 'Compact mode on'
                  : t('settings.appearance.compact_mode_off') || 'Normal density'}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {t('settings.appearance.preview_hint') || 'Changes apply live. Cancel to revert.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
