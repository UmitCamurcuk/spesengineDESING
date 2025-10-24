import React, { useEffect, useMemo, useState } from 'react';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Building2,
  Languages,
  Bell,
  Plug,
  Shield,
  Database,
  Palette,
  History as HistoryIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { AppSettings, UpdateSettingsPayload, SettingsPatchPayload, LanguageOption } from '../../api/types/api.types';
import { HistoryTable } from '../../components/common/HistoryTable';

interface LanguageDraft extends LanguageOption {}

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

const suggestedLanguages: LanguageOption[] = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'fa', label: 'فارسی' },
  { code: 'zh-CN', label: '中文 (简体)' },
];

const clonePayload = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const stripMetadata = (settings: AppSettings): UpdateSettingsPayload => {
  const { id, tenantId, createdAt, updatedAt, ...rest } = settings;
  return clonePayload(rest);
};

const normalizeLanguageCode = (code: string) => {
  const trimmed = code.trim();
  if (!trimmed.includes('-')) {
    return trimmed.toLowerCase();
  }
  const [lang, region] = trimmed.split('-', 2);
  return `${lang.toLowerCase()}-${(region ?? '').toUpperCase()}`;
};

const sanitizeLanguageOption = (lang: LanguageOption): LanguageOption => ({
  code: normalizeLanguageCode(lang.code),
  label: lang.label.trim() || lang.code.trim(),
});

const prepareLanguageList = (languages: LanguageOption[]) => languages.map(sanitizeLanguageOption);

const languagesEqual = (a: LanguageOption[], b: LanguageOption[]) =>
  JSON.stringify(prepareLanguageList(a)) === JSON.stringify(prepareLanguageList(b));

const buildSettingsPatch = (
  base: UpdateSettingsPayload,
  current: UpdateSettingsPayload,
): SettingsPatchPayload => {
  const patch: SettingsPatchPayload = {};

  const general: Partial<typeof base.general> = {};
  if (base.general.companyName !== current.general.companyName) {
    general.companyName = current.general.companyName.trim();
  }
  if (base.general.timezone !== current.general.timezone) {
    general.timezone = current.general.timezone.trim();
  }
  if (base.general.dateFormat !== current.general.dateFormat) {
    general.dateFormat = current.general.dateFormat.trim();
  }
  if (base.general.maintenanceMode !== current.general.maintenanceMode) {
    general.maintenanceMode = current.general.maintenanceMode;
  }
  if (Object.keys(general).length > 0) {
    patch.general = general;
  }

  const appearance: Partial<typeof base.appearance> = {};
  if (base.appearance.themeMode !== current.appearance.themeMode) {
    appearance.themeMode = current.appearance.themeMode;
  }
  if (base.appearance.darkVariant !== current.appearance.darkVariant) {
    appearance.darkVariant = current.appearance.darkVariant;
  }
  if (base.appearance.compactMode !== current.appearance.compactMode) {
    appearance.compactMode = current.appearance.compactMode;
  }
  if (base.appearance.showAvatars !== current.appearance.showAvatars) {
    appearance.showAvatars = current.appearance.showAvatars;
  }
  if (Object.keys(appearance).length > 0) {
    patch.appearance = appearance;
  }

  const localization: Partial<Omit<typeof base.localization, 'supportedLanguages'>> & {
    supportedLanguages?: LanguageOption[];
  } = {};
  if (base.localization.defaultLanguage !== current.localization.defaultLanguage) {
    localization.defaultLanguage = normalizeLanguageCode(current.localization.defaultLanguage);
  }
  if (base.localization.fallbackLanguage !== current.localization.fallbackLanguage) {
    localization.fallbackLanguage = normalizeLanguageCode(current.localization.fallbackLanguage);
  }
  if (!languagesEqual(base.localization.supportedLanguages, current.localization.supportedLanguages)) {
    localization.supportedLanguages = prepareLanguageList(current.localization.supportedLanguages);
  }
  if (base.localization.allowUserLanguageSwitch !== current.localization.allowUserLanguageSwitch) {
    localization.allowUserLanguageSwitch = current.localization.allowUserLanguageSwitch;
  }
  if (base.localization.autoTranslateNewContent !== current.localization.autoTranslateNewContent) {
    localization.autoTranslateNewContent = current.localization.autoTranslateNewContent;
  }
  if (Object.keys(localization).length > 0) {
    patch.localization = localization;
  }

  const notifications: Partial<typeof base.notifications> = {};
  if (base.notifications.email !== current.notifications.email) {
    notifications.email = current.notifications.email;
  }
  if (base.notifications.push !== current.notifications.push) {
    notifications.push = current.notifications.push;
  }
  if (base.notifications.slack !== current.notifications.slack) {
    notifications.slack = current.notifications.slack;
  }
  if (base.notifications.sms !== current.notifications.sms) {
    notifications.sms = current.notifications.sms;
  }
  if (base.notifications.weeklyDigest !== current.notifications.weeklyDigest) {
    notifications.weeklyDigest = current.notifications.weeklyDigest;
  }
  if (base.notifications.anomalyAlerts !== current.notifications.anomalyAlerts) {
    notifications.anomalyAlerts = current.notifications.anomalyAlerts;
  }
  if (Object.keys(notifications).length > 0) {
    patch.notifications = notifications;
  }

  const integrations: NonNullable<SettingsPatchPayload['integrations']> = {};
  const slackChanges: Partial<typeof base.integrations.slack> = {};
  if (base.integrations.slack.enabled !== current.integrations.slack.enabled) {
    slackChanges.enabled = current.integrations.slack.enabled;
  }
  if (base.integrations.slack.channel !== current.integrations.slack.channel) {
    slackChanges.channel = current.integrations.slack.channel.trim();
  }
  if (base.integrations.slack.webhookUrl !== current.integrations.slack.webhookUrl) {
    slackChanges.webhookUrl = current.integrations.slack.webhookUrl.trim();
  }
  if (base.integrations.slack.mentionAll !== current.integrations.slack.mentionAll) {
    slackChanges.mentionAll = current.integrations.slack.mentionAll;
  }
  if (base.integrations.slack.sendDigest !== current.integrations.slack.sendDigest) {
    slackChanges.sendDigest = current.integrations.slack.sendDigest;
  }
  if (Object.keys(slackChanges).length > 0) {
    integrations.slack = slackChanges;
  }

  const teamsChanges: Partial<typeof base.integrations.microsoftTeams> = {};
  if (base.integrations.microsoftTeams.enabled !== current.integrations.microsoftTeams.enabled) {
    teamsChanges.enabled = current.integrations.microsoftTeams.enabled;
  }
  if (base.integrations.microsoftTeams.channel !== current.integrations.microsoftTeams.channel) {
    teamsChanges.channel = current.integrations.microsoftTeams.channel.trim();
  }
  if (base.integrations.microsoftTeams.webhookUrl !== current.integrations.microsoftTeams.webhookUrl) {
    teamsChanges.webhookUrl = current.integrations.microsoftTeams.webhookUrl.trim();
  }
  if (Object.keys(teamsChanges).length > 0) {
    integrations.microsoftTeams = teamsChanges;
  }

  const webhookChanges: Partial<typeof base.integrations.webhook> = {};
  if (base.integrations.webhook.enabled !== current.integrations.webhook.enabled) {
    webhookChanges.enabled = current.integrations.webhook.enabled;
  }
  if (base.integrations.webhook.endpoint !== current.integrations.webhook.endpoint) {
    webhookChanges.endpoint = current.integrations.webhook.endpoint.trim();
  }
  if (base.integrations.webhook.secret !== current.integrations.webhook.secret) {
    webhookChanges.secret = current.integrations.webhook.secret.trim();
  }
  if (Object.keys(webhookChanges).length > 0) {
    integrations.webhook = webhookChanges;
  }
  if (Object.keys(integrations).length > 0) {
    patch.integrations = integrations;
  }

  const security: Partial<typeof base.security> = {};
  if (base.security.sessionTimeoutMinutes !== current.security.sessionTimeoutMinutes) {
    security.sessionTimeoutMinutes = current.security.sessionTimeoutMinutes;
  }
  if (base.security.passwordExpiryDays !== current.security.passwordExpiryDays) {
    security.passwordExpiryDays = current.security.passwordExpiryDays;
  }
  if (base.security.enforceTwoFactor !== current.security.enforceTwoFactor) {
    security.enforceTwoFactor = current.security.enforceTwoFactor;
  }
  if (base.security.requireTwoFactorForAdmins !== current.security.requireTwoFactorForAdmins) {
    security.requireTwoFactorForAdmins = current.security.requireTwoFactorForAdmins;
  }
  if (base.security.loginAlerts !== current.security.loginAlerts) {
    security.loginAlerts = current.security.loginAlerts;
  }
  if (base.security.allowRememberDevice !== current.security.allowRememberDevice) {
    security.allowRememberDevice = current.security.allowRememberDevice;
  }
  if (Object.keys(security).length > 0) {
    patch.security = security;
  }

  const data: Partial<typeof base.data> = {};
  if (base.data.autoBackup !== current.data.autoBackup) {
    data.autoBackup = current.data.autoBackup;
  }
  if (base.data.retentionDays !== current.data.retentionDays) {
    data.retentionDays = current.data.retentionDays;
  }
  if (base.data.allowExport !== current.data.allowExport) {
    data.allowExport = current.data.allowExport;
  }
  if (Object.keys(data).length > 0) {
    patch.data = data;
  }

  return patch;
};

const hasPatchChanges = (patch?: SettingsPatchPayload | null): boolean => {
  if (!patch) {
    return false;
  }
  return Object.values(patch).some((section) => {
    if (!section) {
      return false;
    }
    if (typeof section !== 'object') {
      return true;
    }
    return Object.keys(section as Record<string, unknown>).length > 0;
  });
};

const formatTimestamp = (timestamp: string | null | undefined) => {
  if (!timestamp) {
    return '—';
  }
  try {
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    console.warn('Invalid timestamp', error);
    return timestamp;
  }
};

export const Settings: React.FC = () => {
  const { settings, isLoading, isSaving, error: apiError, save } = useSettings();
  const { success, error } = useToast();
  const { t } = useLanguage();

  const [form, setForm] = useState<UpdateSettingsPayload | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [languageDraft, setLanguageDraft] = useState<LanguageDraft>({ code: '', label: '' });
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (settings) {
      setForm(stripMetadata(settings));
      setIsEditing(false);
    }
  }, [settings]);

  const baseline = useMemo(() => (settings ? stripMetadata(settings) : null), [settings]);

  const changes = useMemo<SettingsPatchPayload | null>(() => {
    if (!form || !baseline) {
      return null;
    }
    return buildSettingsPatch(baseline, form);
  }, [baseline, form]);

  const hasChanges = useMemo(() => hasPatchChanges(changes), [changes]);
  const isLocked = !isEditing || isSaving;

  const updateForm = (updater: (draft: UpdateSettingsPayload) => UpdateSettingsPayload) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      const draft = clonePayload(prev);
      return updater(draft);
    });
  };

  const handleGeneralChange = (field: keyof UpdateSettingsPayload['general'], value: string | boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      draft.general[field] = value as never;
      return draft;
    });
  };

  const handleAppearanceChange = (field: keyof UpdateSettingsPayload['appearance'], value: string | boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      draft.appearance[field] = value as never;
      return draft;
    });
  };

  const handleLocalizationChange = (field: keyof UpdateSettingsPayload['localization'], value: string | boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      if (field === 'defaultLanguage' || field === 'fallbackLanguage') {
        draft.localization[field] = normalizeLanguageCode(String(value)) as never;
      } else {
        draft.localization[field] = value as never;
      }
      return draft;
    });
  };

  const handleNotificationChange = (field: keyof UpdateSettingsPayload['notifications'], checked: boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      draft.notifications[field] = checked;
      return draft;
    });
  };

  const handleSecurityChange = (field: keyof UpdateSettingsPayload['security'], value: string | boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      if (typeof draft.security[field] === 'number') {
        const parsed = Number(value);
        draft.security[field] = Number.isNaN(parsed) ? (draft.security[field] as number) : (parsed as never);
      } else {
        draft.security[field] = value as never;
      }
      return draft;
    });
  };

  const handleDataChange = (field: keyof UpdateSettingsPayload['data'], value: string | boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      if (typeof draft.data[field] === 'number') {
        const parsed = Number(value);
        draft.data[field] = Number.isNaN(parsed) ? (draft.data[field] as number) : (parsed as never);
      } else {
        draft.data[field] = value as never;
      }
      return draft;
    });
  };

  const handleSlackChange = (field: keyof UpdateSettingsPayload['integrations']['slack'], value: string | boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      if (typeof draft.integrations.slack[field] === 'boolean') {
        draft.integrations.slack[field] = Boolean(value) as never;
      } else {
        draft.integrations.slack[field] = String(value);
      }
      return draft;
    });
  };

  const handleTeamsChange = (field: keyof UpdateSettingsPayload['integrations']['microsoftTeams'], value: string | boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      draft.integrations.microsoftTeams[field] = typeof draft.integrations.microsoftTeams[field] === 'boolean'
        ? Boolean(value)
        : String(value);
      return draft;
    });
  };

  const handleWebhookChange = (field: keyof UpdateSettingsPayload['integrations']['webhook'], value: string | boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      draft.integrations.webhook[field] = typeof draft.integrations.webhook[field] === 'boolean'
        ? Boolean(value)
        : String(value);
      return draft;
    });
  };

  const handleAddLanguage = () => {
    if (!form || !isEditing) {
      return;
    }

    const draftCode = normalizeLanguageCode(languageDraft.code);
    const draftLabel = languageDraft.label.trim();

    if (!draftCode || !draftLabel) {
      error(t('settings.localization.messages.language_required'));
      return;
    }

    if (form.localization.supportedLanguages.some((lang) => normalizeLanguageCode(lang.code) === draftCode)) {
      error(t('settings.localization.messages.language_exists'));
      return;
    }

    updateForm((draft) => {
      draft.localization.supportedLanguages = [
        ...draft.localization.supportedLanguages,
        sanitizeLanguageOption({ code: draftCode, label: draftLabel }),
      ];
      return draft;
    });

    setLanguageDraft({ code: '', label: '' });
    success(t('settings.localization.messages.language_added'));
  };

  const handleRemoveLanguage = (code: string) => {
    if (!form || !isEditing) {
      return;
    }

    const normalized = normalizeLanguageCode(code);

    if (form.localization.supportedLanguages.length <= 1) {
      error(t('settings.localization.messages.language_minimum'));
      return;
    }

    if (normalizeLanguageCode(form.localization.defaultLanguage) === normalized) {
      error(t('settings.localization.messages.language_remove_default'));
      return;
    }

    if (normalizeLanguageCode(form.localization.fallbackLanguage) === normalized) {
      error(t('settings.localization.messages.language_remove_fallback'));
      return;
    }

    updateForm((draft) => {
      draft.localization.supportedLanguages = draft.localization.supportedLanguages.filter(
        (lang) => normalizeLanguageCode(lang.code) !== normalized,
      );
      return draft;
    });
    success(t('settings.localization.messages.language_removed'));
  };

  const handleSave = async () => {
    if (!isEditing || !form || !baseline || !changes || !hasPatchChanges(changes)) {
      return;
    }
    try {
      const patch = clonePayload<SettingsPatchPayload>(changes);
      const result = await save(patch);
      setForm(stripMetadata(result));
      setIsEditing(false);
      success(t('settings.messages.save_success'));
    } catch (err: any) {
      const message = err?.message ?? t('settings.messages.save_error');
      error(message);
    }
  };

  const handleReset = () => {
    if (baseline) {
      setForm(clonePayload(baseline));
    }
  };

  const handleCancelEdit = () => {
    handleReset();
    setLanguageDraft({ code: '', label: '' });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (settings) {
      setForm(stripMetadata(settings));
    }
    setLanguageDraft({ code: '', label: '' });
    setIsEditing(true);
  };

  const renderSupportedLanguages = () => {
    if (!form) {
      return null;
    }

    if (form.localization.supportedLanguages.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          {t('settings.localization.empty_state')}
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {form.localization.supportedLanguages.map((lang) => (
          <Badge key={lang.code} className="flex items-center space-x-2 py-1 pl-2 pr-1">
            <span className="text-xs font-medium">{lang.label} ({lang.code})</span>
            <button
              type="button"
              onClick={() => handleRemoveLanguage(lang.code)}
              className="rounded-full p-1 hover:bg-muted transition disabled:opacity-50 disabled:hover:bg-transparent"
              disabled={isLocked}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'general', label: t('settings.tabs.general'), icon: <Building2 className="h-4 w-4" /> },
    { id: 'localization', label: t('settings.tabs.localization'), icon: <Languages className="h-4 w-4" /> },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: <Bell className="h-4 w-4" /> },
    { id: 'integrations', label: t('settings.tabs.integrations'), icon: <Plug className="h-4 w-4" /> },
    { id: 'security', label: t('settings.tabs.security'), icon: <Shield className="h-4 w-4" /> },
    { id: 'data', label: t('settings.tabs.data'), icon: <Database className="h-4 w-4" /> },
  ];

  if ((isLoading && !form) || !form) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{t('settings.loading')}</p>
          {apiError && <p className="text-xs text-error">{apiError}</p>}
        </div>
      </div>
    );
  }

  const lastUpdated = settings ? formatTimestamp(settings.updatedAt) : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.page_title')}
        subtitle={t('settings.page_subtitle')}
        action={
          !isEditing ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleStartEdit}
              disabled={isLoading}
            >
              {t('settings.actions.edit')}
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                {t('settings.actions.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleSave}
                disabled={!hasChanges}
                loading={isSaving}
              >
                {t('settings.actions.save')}
              </Button>
            </div>
          )
        }
      >
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{t('settings.meta.last_updated')}</span>
          <span className="font-medium text-foreground">{lastUpdated}</span>
          {isEditing && hasChanges && (
            <Badge variant="warning" size="sm" className="uppercase tracking-wide">
              {t('settings.meta.pending_changes')}
            </Badge>
          )}
        </div>
      </PageHeader>

      {apiError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {apiError}
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="underline" />

      {activeTab === 'general' && (
        <TabPanel>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                  onChange={(e) => handleGeneralChange('companyName', e.target.value)}
                  placeholder="Spes Engine"
                  required
                  disabled={isLocked}
                />
                <Select
                  label={t('settings.general.timezone')}
                  value={form.general.timezone}
                  onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                  options={timezoneOptions}
                  disabled={isLocked}
                />
                <Select
                  label={t('settings.general.date_format')}
                  value={form.general.dateFormat}
                  onChange={(e) => handleGeneralChange('dateFormat', e.target.value)}
                  options={dateFormatOptions}
                  disabled={isLocked}
                />
                <Checkbox
                  label={t('settings.general.maintenance_mode')}
                  checked={form.general.maintenanceMode}
                  onChange={(e) => handleGeneralChange('maintenanceMode', e.target.checked)}
                  helperText={t('settings.general.maintenance_mode_help')}
                  disabled={isLocked}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                title={t('settings.appearance.title')}
                subtitle={t('settings.appearance.subtitle')}
                className="border-none mb-2"
                action={<Palette className="h-4 w-4 text-muted-foreground" />}
              />
              <div className="space-y-4">
                <Select
                  label={t('settings.appearance.theme_mode')}
                  value={form.appearance.themeMode}
                  onChange={(e) => handleAppearanceChange('themeMode', e.target.value)}
                  options={themeModeOptions}
                  disabled={isLocked}
                />
                {form.appearance.themeMode !== 'light' && (
                  <Select
                    label={t('settings.appearance.dark_variant')}
                    value={form.appearance.darkVariant}
                    onChange={(e) => handleAppearanceChange('darkVariant', e.target.value)}
                    options={darkVariantOptions}
                    disabled={isLocked}
                  />
                )}
                <Checkbox
                  label={t('settings.appearance.compact_mode')}
                  checked={form.appearance.compactMode}
                  onChange={(e) => handleAppearanceChange('compactMode', e.target.checked)}
                  helperText={t('settings.appearance.compact_mode_help')}
                  disabled={isLocked}
                />
                <Checkbox
                  label={t('settings.appearance.show_avatars')}
                  checked={form.appearance.showAvatars}
                  onChange={(e) => handleAppearanceChange('showAvatars', e.target.checked)}
                  disabled={isLocked}
                />
              </div>
            </Card>
          </div>
        </TabPanel>
      )}

      {activeTab === 'localization' && (
        <TabPanel>
          <Card>
            <CardHeader
              title={t('settings.localization.title')}
              subtitle={t('settings.localization.subtitle')}
              className="border-none mb-2"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t('settings.localization.default_language')}
                  value={form.localization.defaultLanguage}
                  onChange={(e) => handleLocalizationChange('defaultLanguage', e.target.value)}
                  options={form.localization.supportedLanguages.map((lang) => ({
                    value: lang.code,
                    label: `${lang.label} (${lang.code})`,
                  }))}
                  disabled={isLocked}
                />
                <Select
                  label={t('settings.localization.fallback_language')}
                  value={form.localization.fallbackLanguage}
                  onChange={(e) => handleLocalizationChange('fallbackLanguage', e.target.value)}
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
                  onChange={(e) => handleLocalizationChange('allowUserLanguageSwitch', e.target.checked)}
                  disabled={isLocked}
                />
                <Checkbox
                  label={t('settings.localization.auto_translate')}
                  checked={form.localization.autoTranslateNewContent}
                  onChange={(e) => handleLocalizationChange('autoTranslateNewContent', e.target.checked)}
                  helperText={t('settings.localization.auto_translate_help')}
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label={t('settings.localization.language_code')}
                      value={languageDraft.code}
                      onChange={(e) => setLanguageDraft((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="en"
                      disabled={isLocked}
                    />
                    <Input
                      label={t('settings.localization.custom_label')}
                      value={languageDraft.label}
                      onChange={(e) => setLanguageDraft((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Türkçe"
                      disabled={isLocked}
                    />
                  </div>
                  <div className="md:w-40 flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={handleAddLanguage}
                      className="w-full"
                      disabled={isLocked}
                    >
                      {t('settings.localization.add_language')}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t('settings.localization.quick_add')}</span>
                  {suggestedLanguages.map((lang) => (
                    <Button
                      key={lang.code}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2 py-1"
                      onClick={() => setLanguageDraft({ code: lang.code, label: lang.label })}
                      disabled={isLocked}
                    >
                      {lang.label}
                    </Button>
                  ))}
                </div>

                {renderSupportedLanguages()}
              </div>
            </div>
          </Card>
        </TabPanel>
      )}

      {activeTab === 'notifications' && (
        <TabPanel>
          <Card>
            <CardHeader
              title={t('settings.notifications.title')}
              subtitle={t('settings.notifications.subtitle')}
              className="border-none mb-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Checkbox
                label={t('settings.notifications.email')}
                checked={form.notifications.email}
                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.notifications.push')}
                checked={form.notifications.push}
                onChange={(e) => handleNotificationChange('push', e.target.checked)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.notifications.slack')}
                checked={form.notifications.slack}
                onChange={(e) => handleNotificationChange('slack', e.target.checked)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.notifications.sms')}
                checked={form.notifications.sms}
                onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.notifications.weekly_digest')}
                checked={form.notifications.weeklyDigest}
                onChange={(e) => handleNotificationChange('weeklyDigest', e.target.checked)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.notifications.anomaly_alerts')}
                checked={form.notifications.anomalyAlerts}
                onChange={(e) => handleNotificationChange('anomalyAlerts', e.target.checked)}
                disabled={isLocked}
              />
            </div>
          </Card>
        </TabPanel>
      )}

      {activeTab === 'integrations' && (
        <TabPanel>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title={t('settings.integrations.slack.title')}
                subtitle={t('settings.integrations.slack.subtitle')}
                className="border-none mb-2"
              />
              <div className="space-y-4">
                <Checkbox
                  label={t('settings.integrations.slack.enable')}
                  checked={form.integrations.slack.enabled}
                  onChange={(e) => handleSlackChange('enabled', e.target.checked)}
                  disabled={isLocked}
                />
                <Input
                  label={t('settings.integrations.slack.channel')}
                  value={form.integrations.slack.channel}
                  onChange={(e) => handleSlackChange('channel', e.target.value)}
                  placeholder="#spes-alerts"
                  disabled={isLocked || !form.integrations.slack.enabled}
                />
                <Input
                  label={t('settings.integrations.slack.webhook')}
                  value={form.integrations.slack.webhookUrl}
                  onChange={(e) => handleSlackChange('webhookUrl', e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  helperText={t('settings.integrations.slack.webhook_help')}
                  disabled={isLocked || !form.integrations.slack.enabled}
                />
                <Checkbox
                  label={t('settings.integrations.slack.mention_all')}
                  checked={form.integrations.slack.mentionAll}
                  onChange={(e) => handleSlackChange('mentionAll', e.target.checked)}
                  disabled={isLocked || !form.integrations.slack.enabled}
                />
                <Checkbox
                  label={t('settings.integrations.slack.send_digest')}
                  checked={form.integrations.slack.sendDigest}
                  onChange={(e) => handleSlackChange('sendDigest', e.target.checked)}
                  disabled={isLocked || !form.integrations.slack.enabled}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                title={t('settings.integrations.teams.title')}
                subtitle={t('settings.integrations.teams.subtitle')}
                className="border-none mb-2"
              />
              <div className="space-y-4">
                <Checkbox
                  label={t('settings.integrations.teams.enable')}
                  checked={form.integrations.microsoftTeams.enabled}
                  onChange={(e) => handleTeamsChange('enabled', e.target.checked)}
                  disabled={isLocked}
                />
                <Input
                  label={t('settings.integrations.teams.channel')}
                  value={form.integrations.microsoftTeams.channel}
                  onChange={(e) => handleTeamsChange('channel', e.target.value)}
                  placeholder="Operations"
                  disabled={isLocked || !form.integrations.microsoftTeams.enabled}
                />
                <Input
                  label={t('settings.integrations.teams.webhook')}
                  value={form.integrations.microsoftTeams.webhookUrl}
                  onChange={(e) => handleTeamsChange('webhookUrl', e.target.value)}
                  placeholder="https://"
                  helperText={t('settings.integrations.teams.webhook_help')}
                  disabled={isLocked || !form.integrations.microsoftTeams.enabled}
                />
              </div>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader
              title={t('settings.integrations.webhook.title')}
              subtitle={t('settings.integrations.webhook.subtitle')}
              className="border-none mb-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Checkbox
                label={t('settings.integrations.webhook.enable')}
                checked={form.integrations.webhook.enabled}
                onChange={(e) => handleWebhookChange('enabled', e.target.checked)}
                disabled={isLocked}
              />
              <Input
                label={t('settings.integrations.webhook.endpoint')}
                value={form.integrations.webhook.endpoint}
                onChange={(e) => handleWebhookChange('endpoint', e.target.value)}
                placeholder="https://api.mycompany.com/hooks/settings"
                disabled={isLocked || !form.integrations.webhook.enabled}
              />
              <Input
                label={t('settings.integrations.webhook.secret')}
                value={form.integrations.webhook.secret}
                onChange={(e) => handleWebhookChange('secret', e.target.value)}
                placeholder="••••••"
                disabled={isLocked || !form.integrations.webhook.enabled}
              />
            </div>
          </Card>
        </TabPanel>
      )}

      {activeTab === 'security' && (
        <TabPanel>
          <Card>
            <CardHeader
              title={t('settings.security.title')}
              subtitle={t('settings.security.subtitle')}
              className="border-none mb-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                min={5}
                max={720}
                label={t('settings.security.session_timeout')}
                value={form.security.sessionTimeoutMinutes}
                onChange={(e) => handleSecurityChange('sessionTimeoutMinutes', e.target.value)}
                helperText={t('settings.security.session_timeout_help')}
                disabled={isLocked}
              />
              <Input
                type="number"
                min={0}
                max={365}
                label={t('settings.security.password_expiry')}
                value={form.security.passwordExpiryDays}
                onChange={(e) => handleSecurityChange('passwordExpiryDays', e.target.value)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.security.enforce_two_factor')}
                checked={form.security.enforceTwoFactor}
                onChange={(e) => handleSecurityChange('enforceTwoFactor', e.target.checked)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.security.require_two_factor_admins')}
                checked={form.security.requireTwoFactorForAdmins}
                onChange={(e) => handleSecurityChange('requireTwoFactorForAdmins', e.target.checked)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.security.login_alerts')}
                checked={form.security.loginAlerts}
                onChange={(e) => handleSecurityChange('loginAlerts', e.target.checked)}
                disabled={isLocked}
              />
              <Checkbox
                label={t('settings.security.allow_remember_device')}
                checked={form.security.allowRememberDevice}
                onChange={(e) => handleSecurityChange('allowRememberDevice', e.target.checked)}
                disabled={isLocked}
              />
            </div>
          </Card>
        </TabPanel>
      )}

      {activeTab === 'data' && (
        <TabPanel>
      <Card>
        <CardHeader
          title={t('settings.data.title')}
          subtitle={t('settings.data.subtitle')}
          className="border-none mb-2"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label={t('settings.data.auto_backup')}
            checked={form.data.autoBackup}
            onChange={(e) => handleDataChange('autoBackup', e.target.checked)}
            helperText={t('settings.data.auto_backup_help')}
            disabled={isLocked}
          />
          <Input
            type="number"
            min={30}
            max={1825}
            label={t('settings.data.retention_days')}
            value={form.data.retentionDays}
            onChange={(e) => handleDataChange('retentionDays', e.target.value)}
            disabled={isLocked}
          />
          <Checkbox
            label={t('settings.data.allow_export')}
            checked={form.data.allowExport}
            onChange={(e) => handleDataChange('allowExport', e.target.checked)}
            disabled={isLocked}
          />
        </div>
      </Card>
    </TabPanel>
  )}

      <Card padding="lg">
        <CardHeader
          title={t('settings.history.title')}
          subtitle={t('settings.history.subtitle')}
        >
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <HistoryIcon className="h-3.5 w-3.5" />
            <span>{t('settings.history.hint')}</span>
          </div>
        </CardHeader>

        {settings?.id ? (
          <HistoryTable
            entityType="Settings"
            entityId={settings.id ?? 'default'}
            title={t('settings.history.title')}
            description={t('settings.history.subtitle')}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t('settings.history.empty')}</p>
        )}
      </Card>

    </div>
  );
};
