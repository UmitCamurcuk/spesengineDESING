import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  AlertTriangle,
  Trash2,
  Building2,
  Languages,
  Bell,
  Plug,
  Shield,
  Database,
  Search as SearchIcon,
  RefreshCw,
  History as HistoryIcon,
  HardDrive,
  Archive,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEditActionContext } from '../../contexts/EditActionContext';
import { PERMISSIONS } from '../../config/permissions';
import type {
  AppSettings,
  UpdateSettingsPayload,
  SettingsPatchPayload,
  SettingsIntegrations,
  LanguageOption,
  SettingsSearch,
  SearchStatus,
  SearchEntityType,
  SearchReindexStat,
} from '../../api/types/api.types';
import { HistoryTable } from '../../components/common/HistoryTable';
import { searchService } from '../../api/services/search.service';
import { StorageSettingsCard } from './components/StorageSettingsCard';
import { BackupSettingsCard } from './components/BackupSettingsCard';
import type { StorageSettings, BackupSettingsData } from '../../types';

interface LanguageDraft {
  code: string;
  label: string;
  required: boolean;
}

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

const searchEntityOptions: Array<{
  value: SearchEntityType;
  labelKey: string;
  descriptionKey: string;
  fallbackLabel: string;
  fallbackDescription: string;
}> = [
  {
    value: 'item',
    labelKey: 'settings.search.entities.item',
    descriptionKey: 'settings.search.entities.item_desc',
    fallbackLabel: 'Items',
    fallbackDescription: 'Catalog items and product records.',
  },
  {
    value: 'item_type',
    labelKey: 'settings.search.entities.item_type',
    descriptionKey: 'settings.search.entities.item_type_desc',
    fallbackLabel: 'Item Types',
    fallbackDescription: 'Templates and attribute sets.',
  },
  {
    value: 'category',
    labelKey: 'settings.search.entities.category',
    descriptionKey: 'settings.search.entities.category_desc',
    fallbackLabel: 'Categories',
    fallbackDescription: 'Hierarchical category structure.',
  },
  {
    value: 'family',
    labelKey: 'settings.search.entities.family',
    descriptionKey: 'settings.search.entities.family_desc',
    fallbackLabel: 'Families',
    fallbackDescription: 'Product families and variant groups.',
  },
  {
    value: 'attribute_group',
    labelKey: 'settings.search.entities.attribute_group',
    descriptionKey: 'settings.search.entities.attribute_group_desc',
    fallbackLabel: 'Attribute Groups',
    fallbackDescription: 'Organize attributes into logical groups.',
  },
  {
    value: 'attribute',
    labelKey: 'settings.search.entities.attribute',
    descriptionKey: 'settings.search.entities.attribute_desc',
    fallbackLabel: 'Attributes',
    fallbackDescription: 'Item properties and field definitions.',
  },
  {
    value: 'user',
    labelKey: 'settings.search.entities.user',
    descriptionKey: 'settings.search.entities.user_desc',
    fallbackLabel: 'Users',
    fallbackDescription: 'Platform users and their roles.',
  },
  {
    value: 'notification_rule',
    labelKey: 'settings.search.entities.notification_rule',
    descriptionKey: 'settings.search.entities.notification_rule_desc',
    fallbackLabel: 'Notification Rules',
    fallbackDescription: 'Event-driven alert definitions.',
  },
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

const sanitizeLanguageOption = (lang: Pick<LanguageOption, 'code' | 'label' | 'required'>): LanguageOption => ({
  code: normalizeLanguageCode(lang.code),
  label: lang.label.trim() || lang.code.trim(),
  required: Boolean(lang.required),
});

const prepareLanguageList = (languages: LanguageOption[]) => languages.map(sanitizeLanguageOption);

type ChangeSummary = {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
};

const formatChangeValue = (value: unknown): string | number | boolean => {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '—';
    }
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item === 'object' && item && 'code' in item && 'label' in item) {
          const option = item as LanguageOption;
          const requiredSuffix = 'required' in option && option.required ? ' [required]' : '';
          return `${option.label} (${option.code})${requiredSuffix}`;
        }
        return String(item);
      })
      .join(', ');
  }
  if (value === null || value === undefined) {
    return '—';
  }
  const text = String(value).trim();
  return text.length === 0 ? '—' : text;
};

const areStringArraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
};

const computeSettingsChanges = (
  base: UpdateSettingsPayload | null,
  current: UpdateSettingsPayload | null,
): { patch: SettingsPatchPayload; changes: ChangeSummary[] } => {
  if (!base || !current) {
    return { patch: {}, changes: [] };
  }

  const patch: SettingsPatchPayload = {};
  const changes: ChangeSummary[] = [];

  const ensureSection = <K extends keyof SettingsPatchPayload>(section: K): NonNullable<SettingsPatchPayload[K]> => {
    if (!patch[section]) {
      patch[section] = {} as NonNullable<SettingsPatchPayload[K]>;
    }
    return patch[section] as NonNullable<SettingsPatchPayload[K]>;
  };

  const pushChange = <K extends keyof SettingsPatchPayload, P extends keyof NonNullable<SettingsPatchPayload[K]>>(
    section: K,
    key: P,
    oldValue: unknown,
    newValue: unknown,
    display?: { old?: string | number | boolean; new?: string | number | boolean },
  ) => {
    const target = ensureSection(section);
    (target as Record<string, unknown>)[key as string] = newValue;
    changes.push({
      field: `${section as string}.${String(key)}`,
      oldValue: display?.old ?? formatChangeValue(oldValue),
      newValue: display?.new ?? formatChangeValue(newValue),
    });
  };

  const normalizeString = (value: string) => value.trim();

  // General
  const companyName = normalizeString(current.general.companyName);
  if (base.general.companyName !== companyName) {
    pushChange('general', 'companyName', base.general.companyName, companyName);
  }

  const timezone = normalizeString(current.general.timezone);
  if (base.general.timezone !== timezone) {
    pushChange('general', 'timezone', base.general.timezone, timezone);
  }

  const dateFormat = normalizeString(current.general.dateFormat);
  if (base.general.dateFormat !== dateFormat) {
    pushChange('general', 'dateFormat', base.general.dateFormat, dateFormat);
  }

  if (base.general.maintenanceMode !== current.general.maintenanceMode) {
    pushChange('general', 'maintenanceMode', base.general.maintenanceMode, current.general.maintenanceMode);
  }

  // Appearance
  if (base.appearance.themeMode !== current.appearance.themeMode) {
    pushChange('appearance', 'themeMode', base.appearance.themeMode, current.appearance.themeMode);
  }

  if (base.appearance.darkVariant !== current.appearance.darkVariant) {
    pushChange('appearance', 'darkVariant', base.appearance.darkVariant, current.appearance.darkVariant);
  }

  if (base.appearance.compactMode !== current.appearance.compactMode) {
    pushChange('appearance', 'compactMode', base.appearance.compactMode, current.appearance.compactMode);
  }

  if (base.appearance.showAvatars !== current.appearance.showAvatars) {
    pushChange('appearance', 'showAvatars', base.appearance.showAvatars, current.appearance.showAvatars);
  }

  // Localization
  const baseDefaultLanguage = normalizeLanguageCode(base.localization.defaultLanguage);
  const currentDefaultLanguage = normalizeLanguageCode(current.localization.defaultLanguage);
  if (baseDefaultLanguage !== currentDefaultLanguage) {
    pushChange('localization', 'defaultLanguage', baseDefaultLanguage, currentDefaultLanguage);
  }

  const baseFallbackLanguage = normalizeLanguageCode(base.localization.fallbackLanguage);
  const currentFallbackLanguage = normalizeLanguageCode(current.localization.fallbackLanguage);
  if (baseFallbackLanguage !== currentFallbackLanguage) {
    pushChange('localization', 'fallbackLanguage', baseFallbackLanguage, currentFallbackLanguage);
  }

  const baseSupportedLanguages = prepareLanguageList(base.localization.supportedLanguages);
  const currentSupportedLanguages = prepareLanguageList(current.localization.supportedLanguages);
  if (JSON.stringify(baseSupportedLanguages) !== JSON.stringify(currentSupportedLanguages)) {
    ensureSection('localization').supportedLanguages = currentSupportedLanguages;
    changes.push({
      field: 'localization.supportedLanguages',
      oldValue: formatChangeValue(baseSupportedLanguages),
      newValue: formatChangeValue(currentSupportedLanguages),
    });
  }

  if (base.localization.allowUserLanguageSwitch !== current.localization.allowUserLanguageSwitch) {
    pushChange(
      'localization',
      'allowUserLanguageSwitch',
      base.localization.allowUserLanguageSwitch,
      current.localization.allowUserLanguageSwitch,
    );
  }

  if (base.localization.autoTranslateNewContent !== current.localization.autoTranslateNewContent) {
    pushChange(
      'localization',
      'autoTranslateNewContent',
      base.localization.autoTranslateNewContent,
      current.localization.autoTranslateNewContent,
    );
  }

  // Notifications
  if (base.notifications.email !== current.notifications.email) {
    pushChange('notifications', 'email', base.notifications.email, current.notifications.email);
  }
  if (base.notifications.push !== current.notifications.push) {
    pushChange('notifications', 'push', base.notifications.push, current.notifications.push);
  }
  if (base.notifications.slack !== current.notifications.slack) {
    pushChange('notifications', 'slack', base.notifications.slack, current.notifications.slack);
  }
  if (base.notifications.sms !== current.notifications.sms) {
    pushChange('notifications', 'sms', base.notifications.sms, current.notifications.sms);
  }
  if (base.notifications.weeklyDigest !== current.notifications.weeklyDigest) {
    pushChange('notifications', 'weeklyDigest', base.notifications.weeklyDigest, current.notifications.weeklyDigest);
  }
  if (base.notifications.anomalyAlerts !== current.notifications.anomalyAlerts) {
    pushChange('notifications', 'anomalyAlerts', base.notifications.anomalyAlerts, current.notifications.anomalyAlerts);
  }

  // Integrations helpers
  const ensureIntegrationsSection = () => ensureSection('integrations');
  const ensureIntegration = <K extends keyof SettingsIntegrations>(key: K): NonNullable<SettingsIntegrations[K]> => {
    const integrationsSection = ensureIntegrationsSection();
    if (!integrationsSection[key]) {
      integrationsSection[key] = {} as NonNullable<SettingsIntegrations[K]>;
    }
    return integrationsSection[key] as NonNullable<SettingsIntegrations[K]>;
  };

  const pushIntegrationChange = <K extends keyof SettingsIntegrations, P extends keyof NonNullable<SettingsIntegrations[K]>>(
    integrationKey: K,
    property: P,
    oldValue: unknown,
    newValue: unknown,
  ) => {
    const integration = ensureIntegration(integrationKey);
    (integration as Record<string, unknown>)[property as string] = newValue;
    changes.push({
      field: `integrations.${String(integrationKey)}.${String(property)}`,
      oldValue: formatChangeValue(oldValue),
      newValue: formatChangeValue(newValue),
    });
  };

  // Integrations - Slack
  if (base.integrations.slack.enabled !== current.integrations.slack.enabled) {
    pushIntegrationChange('slack', 'enabled', base.integrations.slack.enabled, current.integrations.slack.enabled);
  }

  const slackChannel = normalizeString(current.integrations.slack.channel);
  if (base.integrations.slack.channel !== slackChannel) {
    pushIntegrationChange('slack', 'channel', base.integrations.slack.channel, slackChannel);
  }

  const slackDefaultChannel = normalizeString(current.integrations.slack.defaultChannel || '');
  if ((base.integrations.slack.defaultChannel || '') !== slackDefaultChannel) {
    pushIntegrationChange('slack', 'defaultChannel', base.integrations.slack.defaultChannel || '', slackDefaultChannel);
  }

  if (base.integrations.slack.useBotToken !== current.integrations.slack.useBotToken) {
    pushIntegrationChange('slack', 'useBotToken', base.integrations.slack.useBotToken ?? false, current.integrations.slack.useBotToken ?? false);
  }

  const slackBotToken = normalizeString(current.integrations.slack.botToken || '');
  if ((base.integrations.slack.botToken || '') !== slackBotToken) {
    pushIntegrationChange('slack', 'botToken', '***', slackBotToken ? '***' : '');
  }

  const slackWebhook = normalizeString(current.integrations.slack.webhookUrl || '');
  if ((base.integrations.slack.webhookUrl || '') !== slackWebhook) {
    pushIntegrationChange('slack', 'webhookUrl', base.integrations.slack.webhookUrl || '', slackWebhook);
  }

  if (base.integrations.slack.mentionAll !== current.integrations.slack.mentionAll) {
    pushIntegrationChange('slack', 'mentionAll', base.integrations.slack.mentionAll, current.integrations.slack.mentionAll);
  }

  if (base.integrations.slack.sendDigest !== current.integrations.slack.sendDigest) {
    pushIntegrationChange('slack', 'sendDigest', base.integrations.slack.sendDigest, current.integrations.slack.sendDigest);
  }

  // Integrations - Teams
  if (base.integrations.microsoftTeams.enabled !== current.integrations.microsoftTeams.enabled) {
    pushIntegrationChange('microsoftTeams', 'enabled', base.integrations.microsoftTeams.enabled, current.integrations.microsoftTeams.enabled);
  }

  const teamsChannel = normalizeString(current.integrations.microsoftTeams.channel);
  if (base.integrations.microsoftTeams.channel !== teamsChannel) {
    pushIntegrationChange('microsoftTeams', 'channel', base.integrations.microsoftTeams.channel, teamsChannel);
  }

  const teamsWebhook = normalizeString(current.integrations.microsoftTeams.webhookUrl);
  if (base.integrations.microsoftTeams.webhookUrl !== teamsWebhook) {
    pushIntegrationChange('microsoftTeams', 'webhookUrl', base.integrations.microsoftTeams.webhookUrl, teamsWebhook);
  }

  // Integrations - Webhook
  if (base.integrations.webhook.enabled !== current.integrations.webhook.enabled) {
    pushIntegrationChange('webhook', 'enabled', base.integrations.webhook.enabled, current.integrations.webhook.enabled);
  }

  const webhookEndpoint = normalizeString(current.integrations.webhook.endpoint);
  if (base.integrations.webhook.endpoint !== webhookEndpoint) {
    pushIntegrationChange('webhook', 'endpoint', base.integrations.webhook.endpoint, webhookEndpoint);
  }

  const webhookSecret = normalizeString(current.integrations.webhook.secret);
  if (base.integrations.webhook.secret !== webhookSecret) {
    pushIntegrationChange('webhook', 'secret', base.integrations.webhook.secret, webhookSecret);
  }

  // Security
  if (base.security.sessionTimeoutMinutes !== current.security.sessionTimeoutMinutes) {
    pushChange(
      'security',
      'sessionTimeoutMinutes',
      base.security.sessionTimeoutMinutes,
      current.security.sessionTimeoutMinutes,
    );
  }

  if (base.security.passwordExpiryDays !== current.security.passwordExpiryDays) {
    pushChange(
      'security',
      'passwordExpiryDays',
      base.security.passwordExpiryDays,
      current.security.passwordExpiryDays,
    );
  }

  if (base.security.enforceTwoFactor !== current.security.enforceTwoFactor) {
    pushChange('security', 'enforceTwoFactor', base.security.enforceTwoFactor, current.security.enforceTwoFactor);
  }

  if (base.security.requireTwoFactorForAdmins !== current.security.requireTwoFactorForAdmins) {
    pushChange(
      'security',
      'requireTwoFactorForAdmins',
      base.security.requireTwoFactorForAdmins,
      current.security.requireTwoFactorForAdmins,
    );
  }

  if (base.security.loginAlerts !== current.security.loginAlerts) {
    pushChange('security', 'loginAlerts', base.security.loginAlerts, current.security.loginAlerts);
  }

  if (base.security.allowRememberDevice !== current.security.allowRememberDevice) {
    pushChange(
      'security',
      'allowRememberDevice',
      base.security.allowRememberDevice,
      current.security.allowRememberDevice,
    );
  }

  // Search
  if (base.search.enabled !== current.search.enabled) {
    pushChange('search', 'enabled', base.search.enabled, current.search.enabled);
  }

  const baseEntities = Array.isArray(base.search.indexedEntities) ? base.search.indexedEntities : [];
  const nextEntities = Array.isArray(current.search.indexedEntities) ? current.search.indexedEntities : [];
  if (!areStringArraysEqual(baseEntities, nextEntities)) {
    pushChange('search', 'indexedEntities', baseEntities, nextEntities);
  }

  if (base.search.purgeBeforeReindex !== current.search.purgeBeforeReindex) {
    pushChange('search', 'purgeBeforeReindex', base.search.purgeBeforeReindex, current.search.purgeBeforeReindex);
  }

  if (base.search.reindexBatchSize !== current.search.reindexBatchSize) {
    pushChange('search', 'reindexBatchSize', base.search.reindexBatchSize, current.search.reindexBatchSize);
  }

  // Data
  if (base.data.autoBackup !== current.data.autoBackup) {
    pushChange('data', 'autoBackup', base.data.autoBackup, current.data.autoBackup);
  }

  if (base.data.retentionDays !== current.data.retentionDays) {
    pushChange('data', 'retentionDays', base.data.retentionDays, current.data.retentionDays);
  }

  if (base.data.allowExport !== current.data.allowExport) {
    pushChange('data', 'allowExport', base.data.allowExport, current.data.allowExport);
  }

  return {
    patch,
    changes,
  };
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

const formatDuration = (durationMs?: number | null) => {
  if (!durationMs || durationMs <= 0) {
    return '—';
  }
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1000);
  if (seconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
};

export const Settings: React.FC = () => {
  const { settings, isLoading, isSaving, error: apiError, save } = useSettings();
  const { success, error } = useToast();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { register } = useEditActionContext();
  const canEditSettings = hasPermission(PERMISSIONS.SYSTEM.SETTINGS.UPDATE);
  const canViewHistory = hasPermission(PERMISSIONS.SYSTEM.SETTINGS.HISTORY);

  const [form, setForm] = useState<UpdateSettingsPayload | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [languageDraft, setLanguageDraft] = useState<LanguageDraft>({ code: '', label: '', required: false });
  const [isLanguageModalOpen, setLanguageModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [secretTouched, setSecretTouched] = useState<{ slackBotToken: boolean; webhookSecret: boolean }>({
    slackBotToken: false,
    webhookSecret: false,
  });
  const [searchStatus, setSearchStatus] = useState<SearchStatus | null>(null);
  const [searchStatusLoading, setSearchStatusLoading] = useState<boolean>(false);
  const [searchStatusError, setSearchStatusError] = useState<string | null>(null);
  const [hasRequestedSearchStatus, setHasRequestedSearchStatus] = useState<boolean>(false);
  const [isReindexModalOpen, setReindexModalOpen] = useState<boolean>(false);
  const [reindexLoading, setReindexLoading] = useState<boolean>(false);
  const [reindexError, setReindexError] = useState<string | null>(null);

  const defaultStorage: StorageSettings = {
    provider: 'local',
    local: { uploadPath: 'uploads', maxFileSizeMB: 10 },
    minio: { endpoint: '', port: 9000, useSSL: false, accessKey: '', secretKey: '', bucket: 'spesengine', publicUrl: '' },
  };

  const defaultBackup: BackupSettingsData = {
    schedule: { enabled: false, cronExpression: '0 3 * * *' },
    targets: { database: true, uploadedFiles: true },
    destination: {
      local: { enabled: true, path: '/backups', keepLastN: 7 },
      minio: { enabled: false, bucket: 'backups', prefix: 'spesengine/' },
    },
  };

  const [storageSettings, setStorageSettings] = useState<StorageSettings>(settings?.storage ?? defaultStorage);
  const [backupSettings, setBackupSettings] = useState<BackupSettingsData>(settings?.backup ?? defaultBackup);

  useEffect(() => {
    if (settings?.storage) setStorageSettings(settings.storage);
    if (settings?.backup) setBackupSettings(settings.backup);
  }, [settings?.storage, settings?.backup]);

  useEffect(() => {
    if (settings) {
      setForm(stripMetadata(settings));
      setIsEditing(false);
      setSecretTouched({ slackBotToken: false, webhookSecret: false });
    }
  }, [settings]);

  const loadSearchStatus = useCallback(async () => {
    setHasRequestedSearchStatus(true);
    setSearchStatusLoading(true);
    setSearchStatusError(null);
    try {
      const status = await searchService.getStatus();
      setSearchStatus(status);
    } catch (err) {
      console.error('Failed to load search status', err);
      setSearchStatusError(
        err instanceof Error ? err.message : t('settings.search.status_error') || 'Unable to load search status',
      );
    } finally {
      setSearchStatusLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === 'search' && !hasRequestedSearchStatus) {
      loadSearchStatus().catch((err) => console.error('Search status fetch failed', err));
    }
  }, [activeTab, hasRequestedSearchStatus, loadSearchStatus]);

  useEffect(() => {
    if (activeTab !== 'search') {
      setHasRequestedSearchStatus(false);
    }
  }, [activeTab]);

  const baseline = useMemo(() => (settings ? stripMetadata(settings) : null), [settings]);

  const {
    patch: computedPatch,
    changes: computedChangeList,
  } = useMemo(() => computeSettingsChanges(baseline, form), [baseline, form]);

  const { patch, changeList } = useMemo(() => {
    if (!form) {
      return { patch: computedPatch, changeList: computedChangeList };
    }

    const nextPatch = clonePayload(computedPatch);
    const nextChanges = [...computedChangeList];

    const ensureChangeEntry = (field: string, oldValue: string | number | boolean, newValue: string | number | boolean) => {
      if (nextChanges.some((item) => item.field === field)) {
        return;
      }
      nextChanges.push({ field, oldValue, newValue });
    };

    if (
      secretTouched.slackBotToken &&
      form.integrations.slack?.useBotToken &&
      form.integrations.slack?.botToken !== undefined &&
      form.integrations.slack.botToken.trim().length > 0 &&
      !nextPatch.integrations?.slack?.botToken
    ) {
      const trimmed = form.integrations.slack.botToken.trim();
      nextPatch.integrations = nextPatch.integrations ?? {};
      nextPatch.integrations.slack = nextPatch.integrations.slack ?? {};
      nextPatch.integrations.slack.botToken = trimmed;
      ensureChangeEntry(
        t('settings.integrations.slack.bot_token') || 'Slack Bot Token',
        '—',
        '••••••',
      );
    }

    if (
      secretTouched.webhookSecret &&
      form.integrations.webhook?.secret !== undefined &&
      form.integrations.webhook.secret.trim().length > 0 &&
      !nextPatch.integrations?.webhook?.secret
    ) {
      const trimmed = form.integrations.webhook.secret.trim();
      nextPatch.integrations = nextPatch.integrations ?? {};
      nextPatch.integrations.webhook = nextPatch.integrations.webhook ?? {};
      nextPatch.integrations.webhook.secret = trimmed;
      ensureChangeEntry(
        t('settings.integrations.webhook.secret') || 'Webhook Secret',
        '—',
        '••••••',
      );
    }

    return { patch: nextPatch, changeList: nextChanges };
  }, [computedPatch, computedChangeList, form, secretTouched, t]);

  const hasChanges = changeList.length > 0;
  const isLocked = !canEditSettings || !isEditing || isSaving;
  const isLanguageDraftValid =
    languageDraft.code.trim().length > 0 && languageDraft.label.trim().length > 0;

  const updateForm = (updater: (draft: UpdateSettingsPayload) => UpdateSettingsPayload) => {
    setForm((prev) => {
      if (!prev) {
        return prev;
      }
      const draft = clonePayload(prev);
      return updater(draft);
    });
  };

  const ensureSearchConnection = (draft: UpdateSettingsPayload): SettingsSearch['connection'] => {
    if (!draft.search.connection) {
      draft.search.connection = {
        node: '',
        authType: 'none',
        username: '',
        password: '',
        apiKey: '',
      } as SettingsSearch['connection'];
    }
    return draft.search.connection;
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

  const handleSearchConnectionChange = (
    field: keyof SettingsSearch['connection'],
    value: string,
  ) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      const connection = ensureSearchConnection(draft);
      (connection as Record<string, string | null>)[field as string] = value;
      return draft;
    });
  };

  const handleSearchChange = <K extends keyof SettingsSearch>(field: K, value: SettingsSearch[K]) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      draft.search[field] = value;
      return draft;
    });
  };

  const handleSearchEntitySelection = (entity: SearchEntityType, checked: boolean) => {
    if (!isEditing) {
      return;
    }
    updateForm((draft) => {
      const current = new Set(draft.search.indexedEntities);
      if (checked) {
        current.add(entity);
      } else {
        current.delete(entity);
      }
      draft.search.indexedEntities = Array.from(current).sort() as SearchEntityType[];
      return draft;
    });
  };

  const resolveEntityLabel = useCallback(
    (entity: SearchEntityType) => {
      const option = searchEntityOptions.find((opt) => opt.value === entity);
      if (!option) {
        return entity;
      }
      return t(option.labelKey) || option.fallbackLabel;
    },
    [t],
  );

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
    if (field === 'botToken') {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      setSecretTouched((prev) => ({
        ...prev,
        slackBotToken: trimmed.length > 0,
      }));
    }
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
    if (field === 'secret') {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      setSecretTouched((prev) => ({
        ...prev,
        webhookSecret: trimmed.length > 0,
      }));
    }
  };

  const addLanguage = (language: LanguageDraft): boolean => {
    if (!form || !isEditing) {
      return false;
    }

    const draftCode = normalizeLanguageCode(language.code);
    const draftLabel = language.label.trim();

    if (!draftCode || !draftLabel) {
      error(t('settings.localization.messages.language_required'));
      return false;
    }

    if (form.localization.supportedLanguages.some((lang) => normalizeLanguageCode(lang.code) === draftCode)) {
      error(t('settings.localization.messages.language_exists'));
      return false;
    }

    updateForm((draft) => {
      draft.localization.supportedLanguages = [
        ...draft.localization.supportedLanguages,
        sanitizeLanguageOption({ code: draftCode, label: draftLabel, required: Boolean(language.required) }),
      ];
      return draft;
    });

    success(t('settings.localization.messages.language_added'));
    return true;
  };

  const handleOpenLanguageModal = () => {
    if (isLocked) {
      return;
    }
    setLanguageDraft({ code: '', label: '', required: false });
    setLanguageModalOpen(true);
  };

  const handleCloseLanguageModal = () => {
    setLanguageModalOpen(false);
    setLanguageDraft({ code: '', label: '', required: false });
  };

  const handleLanguageSubmit = () => {
    if (addLanguage(languageDraft)) {
      setLanguageModalOpen(false);
      setLanguageDraft({ code: '', label: '', required: false });
    }
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

    const targetLanguage = form.localization.supportedLanguages.find(
      (lang) => normalizeLanguageCode(lang.code) === normalized,
    );

    if (targetLanguage?.required) {
      const otherRequired = form.localization.supportedLanguages.some((lang) => {
        if (normalizeLanguageCode(lang.code) === normalized) {
          return false;
        }
        return Boolean(lang.required);
      });

      if (!otherRequired) {
        error(t('settings.localization.messages.required_minimum'));
        return;
      }
    }

    updateForm((draft) => {
      draft.localization.supportedLanguages = draft.localization.supportedLanguages.filter(
        (lang) => normalizeLanguageCode(lang.code) !== normalized,
      );
      return draft;
    });
    success(t('settings.localization.messages.language_removed'));
  };

  const handleToggleLanguageRequired = (code: string, required: boolean) => {
    if (!form || !isEditing) {
      return;
    }

    const normalized = normalizeLanguageCode(code);
    const defaultLanguage = normalizeLanguageCode(form.localization.defaultLanguage);

    // Only primary (default) language is required, secondary (fallback) is optional
    if (!required && normalized === defaultLanguage) {
      error(t('settings.localization.messages.required_core_language'));
      return;
    }

    if (!required) {
      const otherRequiredExists = form.localization.supportedLanguages.some((lang) => {
        if (normalizeLanguageCode(lang.code) === normalized) {
          return false;
        }
        return Boolean(lang.required);
      });

      if (!otherRequiredExists) {
        error(t('settings.localization.messages.required_minimum'));
        return;
      }
    }

    updateForm((draft) => {
      draft.localization.supportedLanguages = draft.localization.supportedLanguages.map((lang) => {
        if (normalizeLanguageCode(lang.code) !== normalized) {
          return lang;
        }
        return {
          ...lang,
          required,
        };
      });
      return draft;
    });
  };

  const handleReset = useCallback(() => {
    if (baseline) {
      setForm(clonePayload(baseline));
    }
    setSecretTouched({ slackBotToken: false, webhookSecret: false });
  }, [baseline]);

  const performSave = async (comment: string) => {
    if (!canEditSettings || !isEditing || !form || !baseline || !hasChanges) {
      setConfirmOpen(false);
      return;
    }

    try {
      setConfirmLoading(true);
      const requestPatch = clonePayload(patch);
      const result = await save(requestPatch, comment.trim());
      setForm(stripMetadata(result));
      setIsEditing(false);
      setLanguageDraft({ code: '', label: '', required: false });
      setSecretTouched({ slackBotToken: false, webhookSecret: false });
      setHasRequestedSearchStatus(false);
      setConfirmOpen(false);
      success(t('settings.messages.save_success'));
    } catch (err: any) {
      const message = err?.message ?? t('settings.messages.save_error');
      error(message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSaveClick = useCallback(() => {
    if (!canEditSettings || !hasChanges || confirmLoading) {
      return;
    }
    setConfirmOpen(true);
  }, [canEditSettings, hasChanges, confirmLoading]);

  const handleConfirmSave = (comment: string) => {
    void performSave(comment);
  };

  const handleCancelEdit = useCallback(() => {
    handleReset();
    setLanguageDraft({ code: '', label: '', required: false });
    setConfirmOpen(false);
    setConfirmLoading(false);
    setIsEditing(false);
    setSecretTouched({ slackBotToken: false, webhookSecret: false });
  }, [handleReset]);

  const handleStartEdit = useCallback(() => {
    if (!canEditSettings) {
      return;
    }
    if (settings) {
      setForm(stripMetadata(settings));
    }
    setLanguageDraft({ code: '', label: '', required: false });
    setConfirmOpen(false);
    setIsEditing(true);
    setSecretTouched({ slackBotToken: false, webhookSecret: false });
  }, [canEditSettings, settings]);

  const handleOpenReindexModal = useCallback(() => {
    setReindexError(null);
    setReindexModalOpen(true);
  }, []);

  const handleCloseReindexModal = useCallback(() => {
    if (reindexLoading) {
      return;
    }
    setReindexError(null);
    setReindexModalOpen(false);
  }, [reindexLoading]);

  const handleConfirmReindex = useCallback(async () => {
    if (!form) {
      return;
    }
    try {
      setReindexLoading(true);
      setReindexError(null);
      const response = await searchService.reindex({
        entityTypes: form.search.indexedEntities,
        purgeExisting: form.search.purgeBeforeReindex,
        batchSize: form.search.reindexBatchSize,
      });
      if (response.status === 'partial') {
        success(t('settings.search.reindex_partial'));
      } else {
        success(t('settings.search.reindex_success'));
      }
      setReindexModalOpen(false);
      await loadSearchStatus();
    } catch (err: any) {
      const message = err?.message ?? t('settings.search.reindex_failed');
      setReindexError(message);
      error(message);
    } finally {
      setReindexLoading(false);
    }
  }, [form, error, success, t, loadSearchStatus]);

  useEffect(() => {
    if (!canEditSettings) {
      register(null);
      return;
    }

    register({
      isEditing,
      canEdit: !isEditing,
      canSave: isEditing && hasChanges,
      onEdit: !isEditing ? handleStartEdit : undefined,
      onCancel: isEditing ? handleCancelEdit : undefined,
      onSave: isEditing ? handleSaveClick : undefined,
    });

    return () => {
      register(null);
    };
  }, [canEditSettings, handleCancelEdit, handleSaveClick, handleStartEdit, hasChanges, isEditing, register]);

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

    const defaultCode = normalizeLanguageCode(form.localization.defaultLanguage);
    const fallbackCode = normalizeLanguageCode(form.localization.fallbackLanguage);

    return (
      <div className="space-y-3">
        {form.localization.supportedLanguages.map((lang) => {
          const normalized = normalizeLanguageCode(lang.code);
          const isDefault = normalized === defaultCode;
          const isFallback = normalized === fallbackCode;
          const otherRequiredExists = form.localization.supportedLanguages.some((other) => {
            if (normalizeLanguageCode(other.code) === normalized) {
              return false;
            }
            return Boolean(other.required);
          });

          const disableToggle = isLocked || isDefault || (lang.required && !otherRequiredExists);
          const disableRemoval =
            isLocked
            || isDefault
            || isFallback
            || form.localization.supportedLanguages.length <= 1
            || (lang.required && !otherRequiredExists);

          return (
            <div
              key={lang.code}
              className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="sm">{lang.label}</Badge>
                <span className="text-xs font-mono text-muted-foreground">{normalized}</span>
                {isDefault && (
                  <Badge variant="success" size="sm">
                    {t('settings.localization.labels.default')}
                  </Badge>
                )}
                {isFallback && (
                  <Badge variant="secondary" size="sm">
                    {t('settings.localization.labels.fallback')}
                  </Badge>
                )}
                {lang.required && (
                  <Badge variant="warning" size="sm">
                    {t('settings.localization.labels.required_badge')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleLanguageRequired(lang.code, !lang.required)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full border transition-colors duration-200',
                    lang.required
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:text-primary hover:border-primary',
                    disableToggle && 'opacity-50 cursor-not-allowed hover:text-muted-foreground hover:border-border',
                  )}
                  disabled={disableToggle}
                >
                  {lang.required
                    ? t('settings.localization.actions.mark_optional')
                    : t('settings.localization.actions.mark_required')}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang.code)}
                  className={cn(
                    'p-1 rounded-full border border-transparent text-muted-foreground transition-colors duration-200 hover:text-error hover:border-error/40',
                    disableRemoval && 'opacity-50 cursor-not-allowed hover:text-muted-foreground hover:border-transparent',
                  )}
                  disabled={disableRemoval}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const tabs = useMemo(() => {
    const list = [
      { id: 'general', label: t('settings.tabs.general'), icon: <Building2 className="h-4 w-4" /> },
      { id: 'localization', label: t('settings.tabs.localization'), icon: <Languages className="h-4 w-4" /> },
      { id: 'notifications', label: t('settings.tabs.notifications'), icon: <Bell className="h-4 w-4" /> },
      { id: 'integrations', label: t('settings.tabs.integrations'), icon: <Plug className="h-4 w-4" /> },
      { id: 'search', label: t('settings.tabs.search'), icon: <SearchIcon className="h-4 w-4" /> },
      { id: 'security', label: t('settings.tabs.security'), icon: <Shield className="h-4 w-4" /> },
      { id: 'data', label: t('settings.tabs.data'), icon: <Database className="h-4 w-4" /> },
      { id: 'storage', label: t('settings.storage_title') || 'Storage', icon: <HardDrive className="h-4 w-4" /> },
      { id: 'backup', label: t('settings.backup_title') || 'Backup', icon: <Archive className="h-4 w-4" /> },
    ];

    if (canViewHistory) {
      list.push({
        id: 'history',
        label: t('settings.tabs.history') ?? t('settings.history.title'),
        icon: <HistoryIcon className="h-4 w-4" />,
      });
    }

    return list;
  }, [t, canViewHistory]);

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
  const lastReindexAtDisplay = searchStatus?.lastReindexAt
    ? formatTimestamp(searchStatus.lastReindexAt)
    : t('settings.search.last_reindex_never');
  const lastReindexDuration = formatDuration(searchStatus?.lastReindexDurationMs);
  const lastReindexEntities = searchStatus?.lastReindexEntities ?? [];
  const lastReindexStatus = searchStatus?.lastReindexStatus ?? null;
  const reindexStatusLabel = lastReindexStatus
    ? t(`settings.search.status.${lastReindexStatus}`) || lastReindexStatus
    : t('settings.search.last_reindex_never');
  const reindexBadgeVariant =
    lastReindexStatus === 'failed'
      ? 'error'
      : lastReindexStatus === 'partial'
      ? 'warning'
      : lastReindexStatus === 'success'
      ? 'success'
      : 'secondary';
  const lastReindexStats = searchStatus?.lastReindexStats ?? [];
  const searchConnection = form.search.connection;
  const configuredEntities =
    searchStatus?.configuredEntities && searchStatus.configuredEntities.length > 0
      ? searchStatus.configuredEntities
      : form.search.indexedEntities;
  const availableEntitiesList: SearchEntityType[] =
    searchStatus?.availableEntities && searchStatus.availableEntities.length > 0
      ? (Array.from(new Set(searchStatus.availableEntities)) as SearchEntityType[])
      : searchEntityOptions.map((option) => option.value);
  const connectionAuthType = searchConnection?.authType ?? 'none';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.page_title')}
        subtitle={t('settings.page_subtitle')}
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
                <Select
                  label={t('settings.appearance.font_scale') || 'Font Size'}
                  value={form.appearance.fontScale ?? 'normal'}
                  onChange={(e) => handleAppearanceChange('fontScale', e.target.value)}
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
              action={
                <Button
                  type="button"
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="w-full md:w-auto"
                  onClick={handleOpenLanguageModal}
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

              {renderSupportedLanguages()}
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
                
                <div className="pt-2 space-y-4">
                  <Checkbox
                    label={t('settings.integrations.slack.use_bot_token')}
                    checked={form.integrations.slack.useBotToken ?? false}
                    onChange={(e) => handleSlackChange('useBotToken', e.target.checked)}
                    disabled={isLocked || !form.integrations.slack.enabled}
                  />
                  
                  {form.integrations.slack.useBotToken ? (
                    <>
                      <Input
                        label={t('settings.integrations.slack.bot_token')}
                        value={form.integrations.slack.botToken || ''}
                        onChange={(e) => handleSlackChange('botToken', e.target.value)}
                        placeholder="xoxb-..."
                        helperText={t('settings.integrations.slack.bot_token_help')}
                        disabled={isLocked || !form.integrations.slack.enabled}
                        type="password"
                      />
                      <Input
                        label={t('settings.integrations.slack.default_channel')}
                        value={form.integrations.slack.defaultChannel || ''}
                        onChange={(e) => handleSlackChange('defaultChannel', e.target.value)}
                        placeholder="#general"
                        helperText={t('settings.integrations.slack.default_channel_help')}
                        disabled={isLocked || !form.integrations.slack.enabled}
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        label={t('settings.integrations.slack.channel')}
                        value={form.integrations.slack.channel}
                        onChange={(e) => handleSlackChange('channel', e.target.value)}
                        placeholder="#spes-alerts"
                        disabled={isLocked || !form.integrations.slack.enabled}
                      />
                      <Input
                        label={t('settings.integrations.slack.webhook')}
                        value={form.integrations.slack.webhookUrl || ''}
                        onChange={(e) => handleSlackChange('webhookUrl', e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                        helperText={t('settings.integrations.slack.webhook_help')}
                        disabled={isLocked || !form.integrations.slack.enabled}
                      />
                    </>
                  )}
                </div>

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

      {activeTab === 'search' && (
        <TabPanel>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title={t('settings.search.status_title')}
                subtitle={t('settings.search.status_description')}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void loadSearchStatus();
                    }}
                    disabled={searchStatusLoading}
                  >
                    <RefreshCw
                      className={cn(
                        'h-4 w-4 mr-2',
                        searchStatusLoading && 'animate-spin',
                      )}
                    />
                    {t('settings.search.status_refresh') || 'Refresh Status'}
                  </Button>
                }
                className="border-none mb-2"
              />
              <div className="space-y-4">
                {searchStatusLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : searchStatusError ? (
                  <div className="rounded-md border border-error/30 bg-error/5 p-4 text-sm text-error space-y-3">
                    <p>{searchStatusError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void loadSearchStatus();
                      }}
                    >
                      {t('common.retry') || 'Retry'}
                    </Button>
                  </div>
                ) : searchStatus ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={searchStatus.elasticsearch.connected ? 'success' : 'secondary'}
                        size="sm"
                      >
                        {searchStatus.elasticsearch.connected
                          ? t('settings.search.status_connected') || 'Connected'
                          : t('settings.search.status_disconnected') || 'Disconnected'}
                      </Badge>
                      <Badge variant={searchStatus.enabled ? 'primary' : 'secondary'} size="sm">
                        {searchStatus.enabled
                          ? t('common.active') || 'Active'
                          : t('common.inactive') || 'Inactive'}
                      </Badge>
                    </div>
                    {searchStatus.elasticsearch.message && (
                      <p className="text-xs text-muted-foreground">
                        {searchStatus.elasticsearch.message}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.search.status_last_checked') || 'Last Checked'}
                        </p>
                        <p className="font-medium text-foreground">
                          {searchStatus.lastCheckedAt ? formatTimestamp(searchStatus.lastCheckedAt) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.search.status_node') || 'Node'}
                        </p>
                        <p className="font-medium text-foreground">
                          {searchStatus.elasticsearch.node || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.search.status_cluster') || 'Cluster'}
                        </p>
                        <p className="font-medium text-foreground">
                          {searchStatus.elasticsearch.clusterName || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.search.status_version') || 'Version'}
                        </p>
                        <p className="font-medium text-foreground">
                          {searchStatus.elasticsearch.version || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.search.status_health') || 'Cluster Health'}
                        </p>
                        <p className="font-medium text-foreground">
                          {searchStatus.elasticsearch.status || '—'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.search.configured_entities') || 'Enabled Entities'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {configuredEntities.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          configuredEntities.map((entity) => (
                            <Badge key={entity} variant="primary" size="sm">
                              {resolveEntityLabel(entity)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.search.available_entities') || 'Available Entities'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {availableEntitiesList.map((entity) => (
                          <Badge key={`available-${entity}`} variant="secondary" size="sm">
                            {resolveEntityLabel(entity)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('settings.search.status_error') || 'Search status will load when available.'}
                  </p>
                )}
              </div>
              <div className="border-t border-border/60 mt-4 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {t('settings.search.last_reindex')}
                  </p>
                  <Badge variant={reindexBadgeVariant as any} size="sm">
                    {reindexStatusLabel}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <p className="uppercase tracking-wide text-[10px]">
                      {t('settings.search.status_last_checked') || 'Last Checked'}
                    </p>
                    <p className="text-foreground font-medium">{lastReindexAtDisplay}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-[10px]">
                      {t('settings.search.last_reindex_duration')}
                    </p>
                    <p className="text-foreground font-medium">{lastReindexDuration}</p>
                  </div>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-[10px] text-muted-foreground">
                    {t('settings.search.last_reindex_entities')}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {lastReindexEntities.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {t('settings.search.last_reindex_never')}
                      </span>
                    ) : (
                      lastReindexEntities.map((entity) => (
                        <Badge key={`last-reindex-${entity}`} variant="secondary" size="sm">
                          {resolveEntityLabel(entity)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                {lastReindexStats.length > 0 && (
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      {t('settings.search.last_reindex_stats')}
                    </p>
                    <div className="divide-y divide-border/60 rounded-md border border-border/60">
                      {lastReindexStats.map((stat) => (
                        <div
                          key={`stat-${stat.entityType}`}
                          className="grid grid-cols-2 md:grid-cols-5 gap-2 px-3 py-2 text-xs"
                        >
                          <div>
                            <p className="text-muted-foreground">
                              {t('settings.search.entities_label')}
                            </p>
                            <p className="font-medium text-foreground">{resolveEntityLabel(stat.entityType)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('settings.search.stat_indexed')}</p>
                            <p className="font-medium text-foreground">{stat.indexed}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('settings.search.stat_deleted')}</p>
                            <p className="font-medium text-foreground">{stat.deleted}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('settings.search.stat_duration')}</p>
                            <p className="font-medium text-foreground">{formatDuration(stat.durationMs)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('settings.search.stat_skipped')}</p>
                            <Badge variant={stat.skipped ? 'warning' : 'success'} size="sm">
                              {stat.skipped ? t('common.yes') : t('common.no')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader
                title={t('settings.search.config_title')}
                subtitle={t('settings.search.config_description')}
                className="border-none mb-2"
              />
              <div className="space-y-4">
                <Checkbox
                  label={t('settings.search.enabled_label')}
                  checked={form.search.enabled}
                  onChange={(e) => handleSearchChange('enabled', e.target.checked)}
                  disabled={isLocked}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('settings.search.entities_label') || 'Entities to index'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('settings.search.entities_help') ||
                      'Choose which entities should appear in search results.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchEntityOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={t(option.labelKey) || option.fallbackLabel}
                      helperText={t(option.descriptionKey) || option.fallbackDescription}
                      checked={form.search.indexedEntities.includes(option.value)}
                      onChange={(e) => handleSearchEntitySelection(option.value, e.target.checked)}
                      disabled={isLocked || !form.search.enabled}
                    />
                  ))}
                </div>
                <Checkbox
                  label={t('settings.search.purge_label')}
                  helperText={t('settings.search.purge_help')}
                  checked={form.search.purgeBeforeReindex}
                  onChange={(e) => handleSearchChange('purgeBeforeReindex', e.target.checked)}
                  disabled={isLocked}
                />
                <Input
                  type="number"
                  min={50}
                  max={5000}
                  label={t('settings.search.batch_size_label')}
                  helperText={t('settings.search.batch_size_help')}
                  value={form.search.reindexBatchSize}
                  onChange={(e) => handleSearchChange('reindexBatchSize', Number(e.target.value))}
                  disabled={isLocked}
                />
                <div className="border-t border-border/60 pt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('settings.search.connection_title')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.search.connection_description')}
                    </p>
                  </div>
                  <Input
                    label={t('settings.search.connection.node')}
                    value={searchConnection?.node ?? ''}
                    onChange={(e) => handleSearchConnectionChange('node', e.target.value)}
                    placeholder="http://localhost:9200"
                    disabled={isLocked}
                  />
                  <Select
                    label={t('settings.search.connection.auth_type')}
                    value={connectionAuthType}
                    onChange={(e) => handleSearchConnectionChange('authType', e.target.value)}
                    options={[
                      { value: 'none', label: t('settings.search.connection.auth_none') || 'None' },
                      { value: 'basic', label: t('settings.search.connection.auth_basic') || 'Username / Password' },
                      { value: 'apiKey', label: t('settings.search.connection.auth_apiKey') || 'API Key' },
                    ]}
                    disabled={isLocked}
                  />
                  {connectionAuthType === 'basic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label={t('settings.search.connection.username')}
                        value={searchConnection?.username ?? ''}
                        onChange={(e) => handleSearchConnectionChange('username', e.target.value)}
                        disabled={isLocked}
                      />
                      <Input
                        type="password"
                        label={t('settings.search.connection.password')}
                        value={searchConnection?.password ?? ''}
                        onChange={(e) => handleSearchConnectionChange('password', e.target.value)}
                        disabled={isLocked}
                      />
                    </div>
                  )}
                  {connectionAuthType === 'apiKey' && (
                    <Input
                      type="password"
                      label={t('settings.search.connection.api_key')}
                      value={searchConnection?.apiKey ?? ''}
                      onChange={(e) => handleSearchConnectionChange('apiKey', e.target.value)}
                      disabled={isLocked}
                    />
                  )}
                </div>
              </div>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader
              title={t('settings.search.reindex_title')}
              subtitle={t('settings.search.reindex_description')}
              className="border-none mb-2"
            />
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
                  {t('settings.search.entities_label')}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.search.indexedEntities.length === 0 ? (
                    <Badge variant="secondary" size="sm">
                      {t('common.none')}
                    </Badge>
                  ) : (
                    form.search.indexedEntities.map((entity) => (
                      <Badge key={`reindex-entity-${entity}`} variant="primary" size="sm">
                        {resolveEntityLabel(entity)}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t('settings.search.reindex_modal_warning')}</span>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleOpenReindexModal}
                  disabled={
                    !form.search.enabled ||
                    form.search.indexedEntities.length === 0 ||
                    !canEditSettings ||
                    reindexLoading
                  }
                >
                  {t('settings.search.reindex_button')}
                </Button>
              </div>
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

      {activeTab === 'storage' && (
        <TabPanel>
          <StorageSettingsCard
            storage={storageSettings}
            onSaved={setStorageSettings}
          />
        </TabPanel>
      )}

      {activeTab === 'backup' && (
        <TabPanel>
          <BackupSettingsCard
            settings={backupSettings}
            onSaved={setBackupSettings}
          />
        </TabPanel>
      )}

      {activeTab === 'history' && canViewHistory && (
        <TabPanel>
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

            <HistoryTable
              entityType="Settings"
              entityId={settings?.id ?? 'default'}
              title={t('settings.history.title')}
              description={t('settings.history.subtitle')}
            />
          </Card>
        </TabPanel>
      )}

      <ChangeConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (!confirmLoading) {
            setConfirmOpen(false);
          }
        }}
        onConfirm={handleConfirmSave}
        changes={changeList}
        loading={confirmLoading}
        entityName={t('settings.page_title')}
        title={t('settings.history.title')}
      />

      <Modal
        isOpen={isLanguageModalOpen}
        onClose={handleCloseLanguageModal}
        size="sm"
        title={t('settings.localization.modal_title')}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">{t('settings.localization.modal_description')}</p>

          <div className="space-y-4">
            <Input
              label={t('settings.localization.language_code')}
              value={languageDraft.code}
              onChange={(e) => setLanguageDraft((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="en"
              required
            />
            <Input
              label={t('settings.localization.custom_label')}
              value={languageDraft.label}
              onChange={(e) => setLanguageDraft((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Türkçe"
              required
            />
            <Checkbox
              label={t('settings.localization.mark_required')}
              checked={languageDraft.required}
              onChange={(e) => setLanguageDraft((prev) => ({ ...prev, required: e.target.checked }))}
              size="sm"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleCloseLanguageModal}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleLanguageSubmit}
              disabled={!isLanguageDraftValid}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {t('settings.localization.modal_submit')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReindexModalOpen}
        onClose={handleCloseReindexModal}
        size="md"
        title={t('settings.search.reindex_modal_title')}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {t('settings.search.reindex_modal_subtitle')}
          </p>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('settings.search.reindex_modal_entities')}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {form?.search.indexedEntities.length ? (
                form?.search.indexedEntities.map((entity) => (
                  <Badge key={`modal-entity-${entity}`} variant="primary" size="sm">
                    {resolveEntityLabel(entity)}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" size="sm">
                  {t('common.none')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{t('settings.search.reindex_modal_warning')}</span>
          </div>
          {reindexError && <p className="text-sm text-error">{reindexError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCloseReindexModal} disabled={reindexLoading}>
              {t('settings.search.reindex_modal_cancel')}
            </Button>
            <Button onClick={handleConfirmReindex} disabled={reindexLoading}>
              {reindexLoading ? t('common.loading') || 'Loading…' : t('settings.search.reindex_modal_confirm')}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
