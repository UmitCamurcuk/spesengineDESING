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
  Search as SearchIcon,
  History as HistoryIcon,
  HardDrive,
  Archive,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
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
import { useTheme } from '../../contexts/ThemeContext';
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
} from '../../api/types/api.types';
import { HistoryTable } from '../../components/common/HistoryTable';
import { searchService } from '../../api/services/search.service';
import { StorageSettingsCard } from './components/StorageSettingsCard';
import { BackupSettingsCard } from './components/BackupSettingsCard';
import { GeneralTab } from './components/GeneralTab';
import { LocalizationTab } from './components/LocalizationTab';
import { NotificationsTab } from './components/NotificationsTab';
import { IntegrationsTab } from './components/IntegrationsTab';
import { SearchTab } from './components/SearchTab';
import { SecurityTab } from './components/SecurityTab';
import type { StorageSettings, BackupSettingsData } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LanguageDraft {
  code: string;
  label: string;
  required: boolean;
}

type ChangeSummary = {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const clonePayload = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const stripMetadata = (settings: AppSettings): UpdateSettingsPayload => {
  const { id, tenantId, createdAt, updatedAt, ...rest } = settings;
  return clonePayload(rest);
};

const normalizeLanguageCode = (code: string) => {
  const trimmed = code.trim();
  if (!trimmed.includes('-')) return trimmed.toLowerCase();
  const [lang, region] = trimmed.split('-', 2);
  return `${lang.toLowerCase()}-${(region ?? '').toUpperCase()}`;
};

const sanitizeLanguageOption = (
  lang: Pick<LanguageOption, 'code' | 'label' | 'required'>,
): LanguageOption => ({
  code: normalizeLanguageCode(lang.code),
  label: lang.label.trim() || lang.code.trim(),
  required: Boolean(lang.required),
});

const prepareLanguageList = (languages: LanguageOption[]) =>
  languages.map(sanitizeLanguageOption);

const formatChangeValue = (value: unknown): string | number | boolean => {
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item && 'code' in item && 'label' in item) {
          const opt = item as LanguageOption;
          return `${opt.label} (${opt.code})${opt.required ? ' [required]' : ''}`;
        }
        return String(item);
      })
      .join(', ');
  }
  if (value === null || value === undefined) return '—';
  const text = String(value).trim();
  return text.length === 0 ? '—' : text;
};

const areStringArraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((v, i) => v === right[i]);
};

const formatTimestamp = (timestamp: string | null | undefined) => {
  if (!timestamp) return '—';
  try { return new Date(timestamp).toLocaleString(); } catch { return timestamp; }
};

// ─── Appearance helpers (mirror SettingsContext internals) ─────────────────────

const COMPACT_CLASS = 'ui-compact-mode';
const HIDE_AVATAR_CLASS = 'ui-hide-avatars';
const FONT_LARGE_CLASS = 'ui-font-large';

function applyCompactClass(compact: boolean) {
  document.documentElement.classList.toggle(COMPACT_CLASS, compact);
}
function applyAvatarVisibility(show: boolean) {
  document.documentElement.classList.toggle(HIDE_AVATAR_CLASS, !show);
}
function applyFontScaleClass(scale: 'normal' | 'large' | undefined) {
  document.documentElement.classList.toggle(FONT_LARGE_CLASS, scale === 'large');
}

// ─── computeSettingsChanges ────────────────────────────────────────────────────

const computeSettingsChanges = (
  base: UpdateSettingsPayload | null,
  current: UpdateSettingsPayload | null,
): { patch: SettingsPatchPayload; changes: ChangeSummary[] } => {
  if (!base || !current) return { patch: {}, changes: [] };

  const patch: SettingsPatchPayload = {};
  const changes: ChangeSummary[] = [];

  const ensureSection = <K extends keyof SettingsPatchPayload>(section: K): NonNullable<SettingsPatchPayload[K]> => {
    if (!patch[section]) patch[section] = {} as NonNullable<SettingsPatchPayload[K]>;
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

  const ns = (v: string) => v.trim();

  // General
  const cn1 = ns(current.general.companyName);
  if (base.general.companyName !== cn1) pushChange('general', 'companyName', base.general.companyName, cn1);
  const tz = ns(current.general.timezone);
  if (base.general.timezone !== tz) pushChange('general', 'timezone', base.general.timezone, tz);
  const df = ns(current.general.dateFormat);
  if (base.general.dateFormat !== df) pushChange('general', 'dateFormat', base.general.dateFormat, df);
  if (base.general.maintenanceMode !== current.general.maintenanceMode)
    pushChange('general', 'maintenanceMode', base.general.maintenanceMode, current.general.maintenanceMode);

  // Appearance
  if (base.appearance.themeMode !== current.appearance.themeMode)
    pushChange('appearance', 'themeMode', base.appearance.themeMode, current.appearance.themeMode);
  if (base.appearance.darkVariant !== current.appearance.darkVariant)
    pushChange('appearance', 'darkVariant', base.appearance.darkVariant, current.appearance.darkVariant);
  if (base.appearance.compactMode !== current.appearance.compactMode)
    pushChange('appearance', 'compactMode', base.appearance.compactMode, current.appearance.compactMode);
  if (base.appearance.showAvatars !== current.appearance.showAvatars)
    pushChange('appearance', 'showAvatars', base.appearance.showAvatars, current.appearance.showAvatars);
  if ((base.appearance.fontScale ?? 'normal') !== (current.appearance.fontScale ?? 'normal'))
    pushChange('appearance', 'fontScale', base.appearance.fontScale ?? 'normal', current.appearance.fontScale ?? 'normal');

  // Localization
  const bdl = normalizeLanguageCode(base.localization.defaultLanguage);
  const cdl = normalizeLanguageCode(current.localization.defaultLanguage);
  if (bdl !== cdl) pushChange('localization', 'defaultLanguage', bdl, cdl);
  const bfl = normalizeLanguageCode(base.localization.fallbackLanguage);
  const cfl = normalizeLanguageCode(current.localization.fallbackLanguage);
  if (bfl !== cfl) pushChange('localization', 'fallbackLanguage', bfl, cfl);
  const bsl = prepareLanguageList(base.localization.supportedLanguages);
  const csl = prepareLanguageList(current.localization.supportedLanguages);
  if (JSON.stringify(bsl) !== JSON.stringify(csl)) {
    ensureSection('localization').supportedLanguages = csl;
    changes.push({ field: 'localization.supportedLanguages', oldValue: formatChangeValue(bsl), newValue: formatChangeValue(csl) });
  }
  if (base.localization.allowUserLanguageSwitch !== current.localization.allowUserLanguageSwitch)
    pushChange('localization', 'allowUserLanguageSwitch', base.localization.allowUserLanguageSwitch, current.localization.allowUserLanguageSwitch);
  if (base.localization.autoTranslateNewContent !== current.localization.autoTranslateNewContent)
    pushChange('localization', 'autoTranslateNewContent', base.localization.autoTranslateNewContent, current.localization.autoTranslateNewContent);

  // Notifications
  ((['email', 'push', 'slack', 'sms', 'weeklyDigest', 'anomalyAlerts'] as const)).forEach((field) => {
    if (base.notifications[field] !== current.notifications[field])
      pushChange('notifications', field, base.notifications[field], current.notifications[field]);
  });

  // Integrations helpers
  const ensureIntegrationsSection = () => ensureSection('integrations');
  const ensureIntegration = <K extends keyof SettingsIntegrations>(key: K): NonNullable<SettingsIntegrations[K]> => {
    const intSection = ensureIntegrationsSection();
    if (!intSection[key]) intSection[key] = {} as NonNullable<SettingsIntegrations[K]>;
    return intSection[key] as NonNullable<SettingsIntegrations[K]>;
  };
  const pushIntChange = <K extends keyof SettingsIntegrations, P extends keyof NonNullable<SettingsIntegrations[K]>>(
    intKey: K, property: P, oldValue: unknown, newValue: unknown,
  ) => {
    const integration = ensureIntegration(intKey);
    (integration as Record<string, unknown>)[property as string] = newValue;
    changes.push({ field: `integrations.${String(intKey)}.${String(property)}`, oldValue: formatChangeValue(oldValue), newValue: formatChangeValue(newValue) });
  };

  // Slack
  if (base.integrations.slack.enabled !== current.integrations.slack.enabled)
    pushIntChange('slack', 'enabled', base.integrations.slack.enabled, current.integrations.slack.enabled);
  const sc = ns(current.integrations.slack.channel);
  if (base.integrations.slack.channel !== sc) pushIntChange('slack', 'channel', base.integrations.slack.channel, sc);
  const sdc = ns(current.integrations.slack.defaultChannel || '');
  if ((base.integrations.slack.defaultChannel || '') !== sdc) pushIntChange('slack', 'defaultChannel', base.integrations.slack.defaultChannel || '', sdc);
  if (base.integrations.slack.useBotToken !== current.integrations.slack.useBotToken)
    pushIntChange('slack', 'useBotToken', base.integrations.slack.useBotToken ?? false, current.integrations.slack.useBotToken ?? false);
  if (base.integrations.slack.mentionAll !== current.integrations.slack.mentionAll)
    pushIntChange('slack', 'mentionAll', base.integrations.slack.mentionAll, current.integrations.slack.mentionAll);
  if (base.integrations.slack.sendDigest !== current.integrations.slack.sendDigest)
    pushIntChange('slack', 'sendDigest', base.integrations.slack.sendDigest, current.integrations.slack.sendDigest);

  // Teams
  if (base.integrations.microsoftTeams.enabled !== current.integrations.microsoftTeams.enabled)
    pushIntChange('microsoftTeams', 'enabled', base.integrations.microsoftTeams.enabled, current.integrations.microsoftTeams.enabled);
  const tc = ns(current.integrations.microsoftTeams.channel);
  if (base.integrations.microsoftTeams.channel !== tc) pushIntChange('microsoftTeams', 'channel', base.integrations.microsoftTeams.channel, tc);
  const tw = ns(current.integrations.microsoftTeams.webhookUrl);
  if (base.integrations.microsoftTeams.webhookUrl !== tw) pushIntChange('microsoftTeams', 'webhookUrl', base.integrations.microsoftTeams.webhookUrl, tw);

  // Webhook
  if (base.integrations.webhook.enabled !== current.integrations.webhook.enabled)
    pushIntChange('webhook', 'enabled', base.integrations.webhook.enabled, current.integrations.webhook.enabled);
  const we = ns(current.integrations.webhook.endpoint);
  if (base.integrations.webhook.endpoint !== we) pushIntChange('webhook', 'endpoint', base.integrations.webhook.endpoint, we);
  const ws = ns(current.integrations.webhook.secret);
  if (base.integrations.webhook.secret !== ws) pushIntChange('webhook', 'secret', base.integrations.webhook.secret, ws);

  // Security
  if (base.security.sessionTimeoutMinutes !== current.security.sessionTimeoutMinutes)
    pushChange('security', 'sessionTimeoutMinutes', base.security.sessionTimeoutMinutes, current.security.sessionTimeoutMinutes);
  if (base.security.passwordExpiryDays !== current.security.passwordExpiryDays)
    pushChange('security', 'passwordExpiryDays', base.security.passwordExpiryDays, current.security.passwordExpiryDays);
  if (base.security.enforceTwoFactor !== current.security.enforceTwoFactor)
    pushChange('security', 'enforceTwoFactor', base.security.enforceTwoFactor, current.security.enforceTwoFactor);
  if (base.security.requireTwoFactorForAdmins !== current.security.requireTwoFactorForAdmins)
    pushChange('security', 'requireTwoFactorForAdmins', base.security.requireTwoFactorForAdmins, current.security.requireTwoFactorForAdmins);
  if (base.security.loginAlerts !== current.security.loginAlerts)
    pushChange('security', 'loginAlerts', base.security.loginAlerts, current.security.loginAlerts);
  if (base.security.allowRememberDevice !== current.security.allowRememberDevice)
    pushChange('security', 'allowRememberDevice', base.security.allowRememberDevice, current.security.allowRememberDevice);

  // Data policy
  if (base.data.retentionDays !== current.data.retentionDays)
    pushChange('data', 'retentionDays', base.data.retentionDays, current.data.retentionDays);
  if (base.data.allowExport !== current.data.allowExport)
    pushChange('data', 'allowExport', base.data.allowExport, current.data.allowExport);

  // Search
  if (base.search.enabled !== current.search.enabled)
    pushChange('search', 'enabled', base.search.enabled, current.search.enabled);
  const be = Array.isArray(base.search.indexedEntities) ? base.search.indexedEntities : [];
  const ce = Array.isArray(current.search.indexedEntities) ? current.search.indexedEntities : [];
  if (!areStringArraysEqual(be, ce)) pushChange('search', 'indexedEntities', be, ce);
  if (base.search.purgeBeforeReindex !== current.search.purgeBeforeReindex)
    pushChange('search', 'purgeBeforeReindex', base.search.purgeBeforeReindex, current.search.purgeBeforeReindex);
  if (base.search.reindexBatchSize !== current.search.reindexBatchSize)
    pushChange('search', 'reindexBatchSize', base.search.reindexBatchSize, current.search.reindexBatchSize);

  return { patch, changes };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Settings: React.FC = () => {
  const { settings, isLoading, isSaving, error: apiError, save, applyLocally } = useSettings();
  const { success, error } = useToast();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { register } = useEditActionContext();
  const { setMode, setDarkVariant } = useTheme();

  const canEditSettings = hasPermission(PERMISSIONS.SYSTEM.SETTINGS.UPDATE);
  const canViewHistory = hasPermission(PERMISSIONS.SYSTEM.SETTINGS.HISTORY);

  // ── State ──
  const [form, setForm] = useState<UpdateSettingsPayload | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [languageDraft, setLanguageDraft] = useState<LanguageDraft>({ code: '', label: '', required: false });
  const [isLanguageModalOpen, setLanguageModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [secretTouched, setSecretTouched] = useState({ slackBotToken: false, webhookSecret: false });
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

  // ── Search status ──
  const loadSearchStatus = useCallback(async () => {
    setHasRequestedSearchStatus(true);
    setSearchStatusLoading(true);
    setSearchStatusError(null);
    try {
      const status = await searchService.getStatus();
      setSearchStatus(status);
    } catch (err) {
      setSearchStatusError(err instanceof Error ? err.message : t('settings.search.status_error') || 'Unable to load');
    } finally {
      setSearchStatusLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === 'search' && !hasRequestedSearchStatus) {
      void loadSearchStatus();
    }
  }, [activeTab, hasRequestedSearchStatus, loadSearchStatus]);

  useEffect(() => {
    if (activeTab !== 'search') setHasRequestedSearchStatus(false);
  }, [activeTab]);

  // ── Change computation ──
  const baseline = useMemo(() => (settings ? stripMetadata(settings) : null), [settings]);
  const { patch: computedPatch, changes: computedChangeList } = useMemo(
    () => computeSettingsChanges(baseline, form),
    [baseline, form],
  );

  const { patch, changeList } = useMemo(() => {
    if (!form) return { patch: computedPatch, changeList: computedChangeList };
    const nextPatch = clonePayload(computedPatch);
    const nextChanges = [...computedChangeList];
    const ensureChangeEntry = (field: string, oldValue: string | number | boolean, newValue: string | number | boolean) => {
      if (nextChanges.some((item) => item.field === field)) return;
      nextChanges.push({ field, oldValue, newValue });
    };
    if (secretTouched.slackBotToken && form.integrations.slack?.useBotToken && form.integrations.slack?.botToken?.trim()) {
      const trimmed = form.integrations.slack.botToken.trim();
      nextPatch.integrations = nextPatch.integrations ?? {};
      nextPatch.integrations.slack = nextPatch.integrations.slack ?? {};
      nextPatch.integrations.slack.botToken = trimmed;
      ensureChangeEntry(t('settings.integrations.slack.bot_token') || 'Slack Bot Token', '—', '••••••');
    }
    if (secretTouched.webhookSecret && form.integrations.webhook?.secret?.trim()) {
      const trimmed = form.integrations.webhook.secret.trim();
      nextPatch.integrations = nextPatch.integrations ?? {};
      nextPatch.integrations.webhook = nextPatch.integrations.webhook ?? {};
      nextPatch.integrations.webhook.secret = trimmed;
      ensureChangeEntry(t('settings.integrations.webhook.secret') || 'Webhook Secret', '—', '••••••');
    }
    return { patch: nextPatch, changeList: nextChanges };
  }, [computedPatch, computedChangeList, form, secretTouched, t]);

  const hasChanges = changeList.length > 0;
  const isLocked = !canEditSettings || !isEditing || isSaving;
  const isLanguageDraftValid = languageDraft.code.trim().length > 0 && languageDraft.label.trim().length > 0;

  // ── Form updater ──
  const updateForm = (updater: (draft: UpdateSettingsPayload) => UpdateSettingsPayload) => {
    setForm((prev) => {
      if (!prev) return prev;
      return updater(clonePayload(prev));
    });
  };

  // ── Handlers ──
  const handleGeneralChange = (field: keyof UpdateSettingsPayload['general'], value: string | boolean) => {
    if (!isEditing) return;
    updateForm((draft) => { draft.general[field] = value as never; return draft; });
  };

  const handleAppearanceChange = (field: keyof UpdateSettingsPayload['appearance'], value: string | boolean) => {
    if (!isEditing) return;
    updateForm((draft) => { draft.appearance[field] = value as never; return draft; });
    // Live preview — apply immediately to the DOM / ThemeContext
    if (field === 'themeMode') setMode(value as 'light' | 'dark' | 'system');
    if (field === 'darkVariant') setDarkVariant(value as 'slate' | 'navy' | 'true-black');
    if (field === 'compactMode') applyCompactClass(Boolean(value));
    if (field === 'showAvatars') applyAvatarVisibility(Boolean(value));
    if (field === 'fontScale') applyFontScaleClass(value as 'normal' | 'large');
  };

  const handleLocalizationChange = (field: keyof UpdateSettingsPayload['localization'], value: string | boolean) => {
    if (!isEditing) return;
    updateForm((draft) => {
      if (field === 'defaultLanguage' || field === 'fallbackLanguage')
        draft.localization[field] = normalizeLanguageCode(String(value)) as never;
      else
        draft.localization[field] = value as never;
      return draft;
    });
  };

  const handleNotificationChange = (field: keyof UpdateSettingsPayload['notifications'], checked: boolean) => {
    if (!isEditing) return;
    updateForm((draft) => { draft.notifications[field] = checked; return draft; });
  };

  const handleSecurityChange = (field: keyof UpdateSettingsPayload['security'], value: string | boolean) => {
    if (!isEditing) return;
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
    if (!isEditing) return;
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

  const ensureSearchConnection = (draft: UpdateSettingsPayload): SettingsSearch['connection'] => {
    if (!draft.search.connection) {
      draft.search.connection = { node: '', authType: 'none', username: '', password: '', apiKey: '' } as SettingsSearch['connection'];
    }
    return draft.search.connection;
  };

  const handleSearchConnectionChange = (field: keyof SettingsSearch['connection'], value: string) => {
    if (!isEditing) return;
    updateForm((draft) => {
      const conn = ensureSearchConnection(draft);
      (conn as Record<string, string | null>)[field as string] = value;
      return draft;
    });
  };

  const handleSearchChange = <K extends keyof SettingsSearch>(field: K, value: SettingsSearch[K]) => {
    if (!isEditing) return;
    updateForm((draft) => { draft.search[field] = value; return draft; });
  };

  const handleSearchEntitySelection = (entity: SearchEntityType, checked: boolean) => {
    if (!isEditing) return;
    updateForm((draft) => {
      const current = new Set(draft.search.indexedEntities);
      if (checked) current.add(entity); else current.delete(entity);
      draft.search.indexedEntities = Array.from(current).sort() as SearchEntityType[];
      return draft;
    });
  };

  const resolveEntityLabel = useCallback(
    (entity: SearchEntityType) => {
      const labels: Record<string, string> = {
        item: t('settings.search.entities.item') || 'Items',
        item_type: t('settings.search.entities.item_type') || 'Item Types',
        category: t('settings.search.entities.category') || 'Categories',
        family: t('settings.search.entities.family') || 'Families',
        attribute_group: t('settings.search.entities.attribute_group') || 'Attribute Groups',
        attribute: t('settings.search.entities.attribute') || 'Attributes',
        user: t('settings.search.entities.user') || 'Users',
        notification_rule: t('settings.search.entities.notification_rule') || 'Notification Rules',
      };
      return labels[entity] ?? entity;
    },
    [t],
  );

  const handleSlackChange = (field: keyof UpdateSettingsPayload['integrations']['slack'], value: string | boolean) => {
    if (!isEditing) return;
    updateForm((draft) => {
      if (typeof draft.integrations.slack[field] === 'boolean')
        draft.integrations.slack[field] = Boolean(value) as never;
      else
        draft.integrations.slack[field] = String(value);
      return draft;
    });
    if (field === 'botToken') {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      setSecretTouched((prev) => ({ ...prev, slackBotToken: trimmed.length > 0 }));
    }
  };

  const handleTeamsChange = (field: keyof UpdateSettingsPayload['integrations']['microsoftTeams'], value: string | boolean) => {
    if (!isEditing) return;
    updateForm((draft) => {
      draft.integrations.microsoftTeams[field] = typeof draft.integrations.microsoftTeams[field] === 'boolean'
        ? Boolean(value) : String(value);
      return draft;
    });
  };

  const handleWebhookChange = (field: keyof UpdateSettingsPayload['integrations']['webhook'], value: string | boolean) => {
    if (!isEditing) return;
    updateForm((draft) => {
      draft.integrations.webhook[field] = typeof draft.integrations.webhook[field] === 'boolean'
        ? Boolean(value) : String(value);
      return draft;
    });
    if (field === 'secret') {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      setSecretTouched((prev) => ({ ...prev, webhookSecret: trimmed.length > 0 }));
    }
  };

  // ── Language management ──
  const addLanguage = (lang: LanguageDraft): boolean => {
    if (!form || !isEditing) return false;
    const code = normalizeLanguageCode(lang.code);
    const label = lang.label.trim();
    if (!code || !label) { error(t('settings.localization.messages.language_required')); return false; }
    if (form.localization.supportedLanguages.some((l) => normalizeLanguageCode(l.code) === code)) {
      error(t('settings.localization.messages.language_exists')); return false;
    }
    updateForm((draft) => {
      draft.localization.supportedLanguages = [...draft.localization.supportedLanguages, sanitizeLanguageOption({ code, label, required: Boolean(lang.required) })];
      return draft;
    });
    success(t('settings.localization.messages.language_added'));
    return true;
  };

  const handleRemoveLanguage = (code: string) => {
    if (!form || !isEditing) return;
    const normalized = normalizeLanguageCode(code);
    if (form.localization.supportedLanguages.length <= 1) { error(t('settings.localization.messages.language_minimum')); return; }
    if (normalizeLanguageCode(form.localization.defaultLanguage) === normalized) { error(t('settings.localization.messages.language_remove_default')); return; }
    if (normalizeLanguageCode(form.localization.fallbackLanguage) === normalized) { error(t('settings.localization.messages.language_remove_fallback')); return; }
    const target = form.localization.supportedLanguages.find((l) => normalizeLanguageCode(l.code) === normalized);
    if (target?.required) {
      const otherRequired = form.localization.supportedLanguages.some((l) => normalizeLanguageCode(l.code) !== normalized && Boolean(l.required));
      if (!otherRequired) { error(t('settings.localization.messages.required_minimum')); return; }
    }
    updateForm((draft) => {
      draft.localization.supportedLanguages = draft.localization.supportedLanguages.filter((l) => normalizeLanguageCode(l.code) !== normalized);
      return draft;
    });
    success(t('settings.localization.messages.language_removed'));
  };

  const handleToggleLanguageRequired = (code: string, required: boolean) => {
    if (!form || !isEditing) return;
    const normalized = normalizeLanguageCode(code);
    const defaultLang = normalizeLanguageCode(form.localization.defaultLanguage);
    if (!required && normalized === defaultLang) { error(t('settings.localization.messages.required_core_language')); return; }
    if (!required) {
      const otherRequired = form.localization.supportedLanguages.some((l) => normalizeLanguageCode(l.code) !== normalized && Boolean(l.required));
      if (!otherRequired) { error(t('settings.localization.messages.required_minimum')); return; }
    }
    updateForm((draft) => {
      draft.localization.supportedLanguages = draft.localization.supportedLanguages.map((l) =>
        normalizeLanguageCode(l.code) !== normalized ? l : { ...l, required },
      );
      return draft;
    });
  };

  const handleReset = useCallback(() => {
    if (baseline) setForm(clonePayload(baseline));
    setSecretTouched({ slackBotToken: false, webhookSecret: false });
  }, [baseline]);

  // ── Edit lifecycle ──
  const handleStartEdit = useCallback(() => {
    if (!canEditSettings) return;
    if (settings) setForm(stripMetadata(settings));
    setLanguageDraft({ code: '', label: '', required: false });
    setConfirmOpen(false);
    setIsEditing(true);
    setSecretTouched({ slackBotToken: false, webhookSecret: false });
  }, [canEditSettings, settings]);

  const handleCancelEdit = useCallback(() => {
    handleReset();
    // Revert live appearance preview to saved values
    if (settings) applyLocally(settings);
    setLanguageDraft({ code: '', label: '', required: false });
    setConfirmOpen(false);
    setConfirmLoading(false);
    setIsEditing(false);
    setSecretTouched({ slackBotToken: false, webhookSecret: false });
  }, [handleReset, settings, applyLocally]);

  // ── Save ──
  const performSave = async (comment: string) => {
    if (!canEditSettings || !isEditing || !form || !baseline || !hasChanges) {
      setConfirmOpen(false);
      return;
    }
    try {
      setConfirmLoading(true);
      const result = await save(clonePayload(patch), comment.trim());
      setForm(stripMetadata(result));
      setIsEditing(false);
      setLanguageDraft({ code: '', label: '', required: false });
      setSecretTouched({ slackBotToken: false, webhookSecret: false });
      setHasRequestedSearchStatus(false);
      setConfirmOpen(false);
      success(t('settings.messages.save_success'));
    } catch (err: any) {
      error(err?.message ?? t('settings.messages.save_error'));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSaveClick = useCallback(() => {
    if (!canEditSettings || !hasChanges || confirmLoading) return;
    setConfirmOpen(true);
  }, [canEditSettings, hasChanges, confirmLoading]);

  const handleConfirmSave = (comment: string) => { void performSave(comment); };

  // ── Reindex ──
  const handleOpenReindexModal = useCallback(() => { setReindexError(null); setReindexModalOpen(true); }, []);
  const handleCloseReindexModal = useCallback(() => {
    if (reindexLoading) return;
    setReindexError(null);
    setReindexModalOpen(false);
  }, [reindexLoading]);

  const handleConfirmReindex = useCallback(async () => {
    if (!form) return;
    try {
      setReindexLoading(true);
      setReindexError(null);
      const response = await searchService.reindex({
        entityTypes: form.search.indexedEntities,
        purgeExisting: form.search.purgeBeforeReindex,
        batchSize: form.search.reindexBatchSize,
      });
      if (response.status === 'partial') {
        const skipped = (response.stats ?? []).filter((s) => s.skipped).map((s) => resolveEntityLabel(s.entityType));
        const base = t('settings.search.reindex_partial') || 'Partially completed';
        success(skipped.length ? `${base}: ${skipped.join(', ')}` : base);
      } else {
        success(t('settings.search.reindex_success'));
      }
      setReindexModalOpen(false);
      await loadSearchStatus();
    } catch (err: any) {
      const msg = err?.message ?? t('settings.search.reindex_failed');
      setReindexError(msg);
      error(msg);
    } finally {
      setReindexLoading(false);
    }
  }, [form, error, success, t, loadSearchStatus, resolveEntityLabel]);

  // ── Edit action context ──
  useEffect(() => {
    if (!canEditSettings) { register(null); return; }
    register({
      isEditing,
      canEdit: !isEditing,
      canSave: isEditing && hasChanges,
      onEdit: !isEditing ? handleStartEdit : undefined,
      onCancel: isEditing ? handleCancelEdit : undefined,
      onSave: isEditing ? handleSaveClick : undefined,
    });
    return () => { register(null); };
  }, [canEditSettings, handleCancelEdit, handleSaveClick, handleStartEdit, hasChanges, isEditing, register]);

  // ── renderSupportedLanguages ──
  const renderSupportedLanguages = () => {
    if (!form) return null;
    if (form.localization.supportedLanguages.length === 0) {
      return <p className="text-sm text-muted-foreground">{t('settings.localization.empty_state')}</p>;
    }
    const defaultCode = normalizeLanguageCode(form.localization.defaultLanguage);
    const fallbackCode = normalizeLanguageCode(form.localization.fallbackLanguage);
    return (
      <div className="space-y-3">
        {form.localization.supportedLanguages.map((lang) => {
          const normalized = normalizeLanguageCode(lang.code);
          const isDefault = normalized === defaultCode;
          const isFallback = normalized === fallbackCode;
          const otherRequiredExists = form.localization.supportedLanguages.some(
            (other) => normalizeLanguageCode(other.code) !== normalized && Boolean(other.required),
          );
          const disableToggle = isLocked || isDefault || (lang.required && !otherRequiredExists);
          const disableRemoval = isLocked || isDefault || isFallback
            || form.localization.supportedLanguages.length <= 1
            || (lang.required && !otherRequiredExists);
          return (
            <div key={lang.code} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="sm">{lang.label}</Badge>
                <span className="text-xs font-mono text-muted-foreground">{normalized}</span>
                {isDefault && <Badge variant="success" size="sm">{t('settings.localization.labels.default')}</Badge>}
                {isFallback && <Badge variant="secondary" size="sm">{t('settings.localization.labels.fallback')}</Badge>}
                {lang.required && <Badge variant="warning" size="sm">{t('settings.localization.labels.required_badge')}</Badge>}
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
                  {lang.required ? t('settings.localization.actions.mark_optional') : t('settings.localization.actions.mark_required')}
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

  // ── Tabs ──
  const tabs = useMemo(() => {
    const list = [
      { id: 'general', label: t('settings.tabs.general'), icon: <Building2 className="h-4 w-4" /> },
      { id: 'localization', label: t('settings.tabs.localization'), icon: <Languages className="h-4 w-4" /> },
      { id: 'notifications', label: t('settings.tabs.notifications'), icon: <Bell className="h-4 w-4" /> },
      { id: 'integrations', label: t('settings.tabs.integrations'), icon: <Plug className="h-4 w-4" /> },
      { id: 'search', label: t('settings.tabs.search'), icon: <SearchIcon className="h-4 w-4" /> },
      { id: 'security', label: t('settings.tabs.security'), icon: <Shield className="h-4 w-4" /> },
      { id: 'storage', label: t('settings.storage_title') || 'Storage', icon: <HardDrive className="h-4 w-4" /> },
      { id: 'backup', label: t('settings.backup_title') || 'Backup', icon: <Archive className="h-4 w-4" /> },
    ];
    if (canViewHistory) list.push({ id: 'history', label: t('settings.tabs.history') ?? t('settings.history.title'), icon: <HistoryIcon className="h-4 w-4" /> });
    return list;
  }, [t, canViewHistory]);

  // ── Loading state ──
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

  // ── Render ──
  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.page_title')} subtitle={t('settings.page_subtitle')}>
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
          <GeneralTab
            form={form}
            isLocked={isLocked}
            isEditing={isEditing}
            onGeneralChange={handleGeneralChange}
            onAppearanceChange={handleAppearanceChange}
          />
        </TabPanel>
      )}

      {activeTab === 'localization' && (
        <TabPanel>
          <LocalizationTab
            form={form}
            isLocked={isLocked}
            onLocalizationChange={handleLocalizationChange}
            onOpenLanguageModal={() => {
              if (isLocked) return;
              setLanguageDraft({ code: '', label: '', required: false });
              setLanguageModalOpen(true);
            }}
            renderSupportedLanguages={renderSupportedLanguages}
          />
        </TabPanel>
      )}

      {activeTab === 'notifications' && (
        <TabPanel>
          <NotificationsTab
            form={form}
            isLocked={isLocked}
            onNotificationChange={handleNotificationChange}
          />
        </TabPanel>
      )}

      {activeTab === 'integrations' && (
        <TabPanel>
          <IntegrationsTab
            form={form}
            isLocked={isLocked}
            onSlackChange={handleSlackChange}
            onTeamsChange={handleTeamsChange}
            onWebhookChange={handleWebhookChange}
          />
        </TabPanel>
      )}

      {activeTab === 'search' && (
        <TabPanel>
          <SearchTab
            form={form}
            isLocked={isLocked}
            canEditSettings={canEditSettings}
            searchStatus={searchStatus}
            searchStatusLoading={searchStatusLoading}
            searchStatusError={searchStatusError}
            reindexLoading={reindexLoading}
            resolveEntityLabel={resolveEntityLabel}
            onSearchChange={handleSearchChange}
            onSearchConnectionChange={handleSearchConnectionChange}
            onSearchEntitySelection={handleSearchEntitySelection}
            onRefreshStatus={() => { void loadSearchStatus(); }}
            onOpenReindexModal={handleOpenReindexModal}
          />
        </TabPanel>
      )}

      {activeTab === 'security' && (
        <TabPanel>
          <SecurityTab
            form={form}
            isLocked={isLocked}
            onSecurityChange={handleSecurityChange}
            onDataChange={handleDataChange}
          />
        </TabPanel>
      )}

      {activeTab === 'storage' && (
        <TabPanel>
          <StorageSettingsCard storage={storageSettings} onSaved={setStorageSettings} />
        </TabPanel>
      )}

      {activeTab === 'backup' && (
        <TabPanel>
          <BackupSettingsCard settings={backupSettings} onSaved={setBackupSettings} />
        </TabPanel>
      )}

      {activeTab === 'history' && canViewHistory && (
        <TabPanel>
          <Card padding="lg">
            <CardHeader title={t('settings.history.title')} subtitle={t('settings.history.subtitle')}>
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

      {/* Change confirmation */}
      <ChangeConfirmDialog
        open={confirmOpen}
        onClose={() => { if (!confirmLoading) setConfirmOpen(false); }}
        onConfirm={handleConfirmSave}
        changes={changeList}
        loading={confirmLoading}
        entityName={t('settings.page_title')}
        title={t('settings.history.title')}
      />

      {/* Language modal */}
      <Modal isOpen={isLanguageModalOpen} onClose={() => setLanguageModalOpen(false)} size="sm" title={t('settings.localization.modal_title')}>
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
            <Button type="button" variant="outline" onClick={() => setLanguageModalOpen(false)}>{t('common.cancel')}</Button>
            <Button
              type="button"
              onClick={() => { if (addLanguage(languageDraft)) { setLanguageModalOpen(false); setLanguageDraft({ code: '', label: '', required: false }); } }}
              disabled={!isLanguageDraftValid}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {t('settings.localization.modal_submit')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reindex modal */}
      <Modal isOpen={isReindexModalOpen} onClose={handleCloseReindexModal} size="md" title={t('settings.search.reindex_modal_title')}>
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">{t('settings.search.reindex_modal_subtitle')}</p>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">{t('settings.search.reindex_modal_entities')}</p>
            <div className="flex flex-wrap gap-2">
              {form?.search.indexedEntities.length ? (
                form.search.indexedEntities.map((entity) => (
                  <Badge key={entity} variant="primary" size="sm">{resolveEntityLabel(entity)}</Badge>
                ))
              ) : (
                <Badge variant="secondary" size="sm">{t('common.none')}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{t('settings.search.reindex_modal_warning')}</span>
          </div>
          {reindexError && <p className="text-sm text-error">{reindexError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCloseReindexModal} disabled={reindexLoading}>{t('settings.search.reindex_modal_cancel')}</Button>
            <Button onClick={handleConfirmReindex} disabled={reindexLoading}>
              {reindexLoading ? t('common.loading') || 'Loading…' : t('settings.search.reindex_modal_confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
