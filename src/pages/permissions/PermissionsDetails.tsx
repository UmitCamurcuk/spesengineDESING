import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Key,
  FileText,
  FolderTree,
  Bell,
  BarChart3,
  Code,
  BookOpen,
  History as HistoryIcon,
  Loader2,
} from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { HistoryTable } from '../../components/common/HistoryTable';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { permissionsService } from '../../api/services/permissions.service';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import { PERMISSIONS } from '../../config/permissions';
import type {
  PermissionRecord,
  PermissionGroupRecord,
  LocalizationRecord,
  LanguageOption,
  PermissionUpdateRequest,
} from '../../api/types/api.types';
import type { TabConfig } from '../../types/common';

type PermissionForm = {
  code: string;
  permissionGroupId: string;
  displayOrder: number;
  logo: string;
  translations: {
    name: Record<string, string>;
    description: Record<string, string>;
  };
};

type ChangeItem = {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
};

const fallbackLanguages: LanguageOption[] = [
  { code: 'tr', label: 'Turkish', required: true },
  { code: 'en', label: 'English', required: false },
];

const normalizeLanguageCode = (code: string): string => {
  const trimmed = code.trim();
  if (!trimmed.includes('-')) {
    return trimmed.toLowerCase();
  }
  const [language, region] = trimmed.split('-', 2);
  return `${language.toLowerCase()}-${(region ?? '').toUpperCase()}`;
};

const getTranslationValue = (record: LocalizationRecord | null, languageCode: string): string => {
  if (!record) {
    return '';
  }
  const normalized = normalizeLanguageCode(languageCode);
  for (const [key, value] of Object.entries(record.translations ?? {})) {
    if (normalizeLanguageCode(key) === normalized) {
      return value;
    }
  }
  return '';
};

const buildTranslationState = (
  languages: LanguageOption[],
  record: LocalizationRecord | null,
): Record<string, string> => {
  const result: Record<string, string> = {};
  languages.forEach((language) => {
    const normalized = normalizeLanguageCode(language.code);
    result[normalized] = getTranslationValue(record, language.code);
  });
  return result;
};

const cloneForm = (form: PermissionForm): PermissionForm => ({
  code: form.code,
  permissionGroupId: form.permissionGroupId,
  displayOrder: form.displayOrder,
  logo: form.logo,
  translations: {
    name: { ...form.translations.name },
    description: { ...form.translations.description },
  },
});

const trimTranslationMap = (map: Record<string, string>): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [code, value] of Object.entries(map)) {
    result[code] = value.trim();
  }
  return result;
};

const translationMapsEqual = (a: Record<string, string>, b: Record<string, string>): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? '').trim() !== (b[key] ?? '').trim()) {
      return false;
    }
  }
  return true;
};

const normalizeForm = (form: PermissionForm): PermissionForm => ({
  code: form.code.trim(),
  permissionGroupId: form.permissionGroupId,
  displayOrder: form.displayOrder,
  logo: form.logo.trim(),
  translations: {
    name: trimTranslationMap(form.translations.name),
    description: trimTranslationMap(form.translations.description),
  },
});

const formsEqual = (a: PermissionForm, b: PermissionForm): boolean => {
  return JSON.stringify(normalizeForm(a)) === JSON.stringify(normalizeForm(b));
};

const buildUpdatePayload = (
  current: PermissionForm,
  baseline: PermissionForm,
  activeLanguage: string,
): PermissionUpdateRequest => {
  const payload: PermissionUpdateRequest = {};
  const normalizedCurrent = normalizeForm(current);
  const normalizedBaseline = normalizeForm(baseline);
  const languageCode = normalizeLanguageCode(activeLanguage);

  if (normalizedCurrent.code !== normalizedBaseline.code) {
    payload.code = normalizedCurrent.code;
  }

  if (normalizedCurrent.permissionGroupId !== normalizedBaseline.permissionGroupId) {
    payload.permissionGroupId = normalizedCurrent.permissionGroupId;
  }

  if (normalizedCurrent.displayOrder !== normalizedBaseline.displayOrder) {
    payload.displayOrder = normalizedCurrent.displayOrder;
  }

  if (normalizedCurrent.logo !== normalizedBaseline.logo) {
    payload.logo = normalizedCurrent.logo.length > 0 ? normalizedCurrent.logo : null;
  }

  const currentName = normalizedCurrent.translations.name[languageCode] ?? '';
  const baselineName = normalizedBaseline.translations.name[languageCode] ?? '';
  if (currentName !== baselineName) {
    if (currentName.length > 0) {
      const merged = {
        ...normalizedBaseline.translations.name,
        [languageCode]: currentName,
      };
      payload.name = Object.fromEntries(
        Object.entries(merged).filter(([, value]) => value.trim().length > 0),
      );
    }
  }

  const currentDescription = normalizedCurrent.translations.description[languageCode] ?? '';
  const baselineDescription = normalizedBaseline.translations.description[languageCode] ?? '';
  if (currentDescription !== baselineDescription) {
    if (currentDescription.length > 0) {
      const merged = {
        ...normalizedBaseline.translations.description,
        [languageCode]: currentDescription,
      };
      payload.description = Object.fromEntries(
        Object.entries(merged).filter(([, value]) => value.trim().length > 0),
      );
    }
  }

  return payload;
};

interface PermissionDetailsTabProps {
  form: PermissionForm;
  editMode: boolean;
  onChange: (updater: (prev: PermissionForm) => PermissionForm) => void;
  metadata: {
    id: string;
    createdAt: string;
    updatedAt: string;
  };
}

const PermissionDetailsTab: React.FC<PermissionDetailsTabProps> = ({
  form,
  editMode,
  onChange,
  metadata,
}) => {
  const { t } = useLanguage();

  const handleFieldChange = (field: keyof PermissionForm, value: string | number) => {
    onChange((prev) => ({
      ...prev,
      [field]: field === 'displayOrder' ? Number(value) : value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="lg">
          <CardHeader
            title={t('permissions.details.basic_information')}
            subtitle={t('permissions.details.basic_information_subtitle')}
          />
          <div className="space-y-4">
            <div>
              <Input
                label={t('permissions.fields.code')}
                value={form.code}
                onChange={(event) => handleFieldChange('code', event.target.value)}
                placeholder="users.read"
                disabled={!editMode}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('permissions.fields.display_order')}
                type="number"
                value={form.displayOrder}
                onChange={(event) => handleFieldChange('displayOrder', event.target.value)}
                disabled={!editMode}
              />
              <Input
                label={t('permissions.fields.logo_url')}
                value={form.logo}
                onChange={(event) => handleFieldChange('logo', event.target.value)}
                placeholder="https://example.com/logo.svg"
                disabled={!editMode}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground block">
                  {t('permissions.fields.identifier')}
                </span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded-lg mt-1 block">
                  {metadata.id}
                </code>
              </div>
              <div>
                <span className="font-medium text-foreground block">
                  {t('permissions.fields.last_updated')}
                </span>
                <span className="mt-1 block">
                  {new Date(metadata.updatedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground block">
                  {t('permissions.fields.created_at')}
                </span>
                <span className="mt-1 block">
                  {new Date(metadata.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

interface PermissionGroupTabProps {
  editMode: boolean;
  groups: PermissionGroupRecord[];
  selectedGroupId: string;
  onSelect: (groupId: string) => void;
  currentGroup: PermissionGroupRecord | null;
}

const PermissionGroupTab: React.FC<PermissionGroupTabProps> = ({
  editMode,
  groups,
  selectedGroupId,
  onSelect,
  currentGroup,
}) => {
  const { t, resolveLocalization } = useLanguage();

  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: group.id,
        label:
          group.name?.trim() ||
          resolveLocalization(group.nameLocalizationId) ||
          group.nameLocalizationId,
      })),
    [groups, resolveLocalization],
  );

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t('permissions.permission_group.title')}
          subtitle={t('permissions.permission_group.subtitle')}
        />
        <div className="space-y-4">
          {editMode ? (
            <Select
              label={t('permissions.permission_group.select')}
              value={selectedGroupId}
              onChange={(event) => onSelect(event.target.value)}
              options={groupOptions}
              placeholder={t('permissions.permission_group.select_placeholder')}
              required
            />
          ) : (
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                {t('permissions.permission_group.current')}
              </span>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {currentGroup?.name?.trim() ||
                    (currentGroup?.nameLocalizationId
                      ? resolveLocalization(currentGroup.nameLocalizationId)
                      : '') ||
                    currentGroup?.nameLocalizationId ||
                    '—'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {currentGroup?.description?.trim() ||
                    (currentGroup?.descriptionLocalizationId
                      ? resolveLocalization(currentGroup.descriptionLocalizationId)
                      : '') ||
                    currentGroup?.descriptionLocalizationId ||
                    t('common.no_description')}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {!editMode && (
        <Card padding="lg">
          <CardHeader
            title={t('permissions.permission_group.other_groups')}
            subtitle={t('permissions.permission_group.other_groups_subtitle')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`border rounded-lg p-4 space-y-2 ${
                  group.id === selectedGroupId ? 'border-primary/60 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {group.name?.trim() ||
                      resolveLocalization(group.nameLocalizationId) ||
                      group.nameLocalizationId ||
                      '—'}
                  </span>
                  {group.id === selectedGroupId && (
                    <Badge variant="primary" size="sm">
                      {t('permissions.permission_group.active')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {group.description?.trim() ||
                    resolveLocalization(group.descriptionLocalizationId) ||
                    group.descriptionLocalizationId ||
                    '—'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const NotificationsTab: React.FC<{ entityId: string; editMode: boolean }> = ({
  entityId,
  editMode,
}) => (
  <NotificationSettings entityType="permission" entityId={entityId} editMode={editMode} />
);

const StatisticsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Statistics entityType="permission" entityId={entityId} editMode={editMode} />
);

const ApiTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <APITester entityType="permission" entityId={entityId} editMode={editMode} />
);

const DocumentationTab: React.FC<{ entityId: string; editMode: boolean }> = ({
  entityId,
  editMode,
}) => <Documentation entityType="permission" entityId={entityId} editMode={editMode} />;

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="Permission" entityId={entityId} />
);

export function PermissionsDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    t,
    language,
    translationsReady,
    getLocalization,
    resolveLocalization,
  } = useLanguage();
  const { showToast } = useToast();
  const { settings } = useSettings();
  const { hasPermission } = useAuth();

  const canReadPermission = hasPermission(PERMISSIONS.SYSTEM.PERMISSIONS.VIEW);
  const canUpdatePermission = hasPermission(PERMISSIONS.SYSTEM.PERMISSIONS.UPDATE);
  const canViewPermissionHistory = hasPermission(PERMISSIONS.SYSTEM.PERMISSIONS.HISTORY);
  const canReadPermissionGroups = hasPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.VIEW);

  const supportedLanguages = useMemo<LanguageOption[]>(() => {
    const configured = settings?.localization?.supportedLanguages ?? [];
    if (configured.length === 0) {
      return fallbackLanguages;
    }
    return configured.map((item) => ({
      code: item.code,
      label: item.label,
      required: item.required,
    }));
  }, [settings?.localization?.supportedLanguages]);

  const normalizedCurrentLanguage = useMemo(
    () => normalizeLanguageCode(language),
    [language],
  );

  const currentLanguageOption = useMemo<LanguageOption>(() => {
    const match = supportedLanguages.find(
      (item) => normalizeLanguageCode(item.code) === normalizedCurrentLanguage,
    );
    if (match) {
      return match;
    }
    return {
      code: language,
      label: language.toUpperCase(),
      required: false,
    };
  }, [language, normalizedCurrentLanguage, supportedLanguages]);

  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<PermissionRecord | null>(null);
  const [groups, setGroups] = useState<PermissionGroupRecord[]>([]);
  const [formState, setFormState] = useState<PermissionForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ChangeItem[]>([]);
  const [saving, setSaving] = useState(false);

  const baselineRef = useRef<PermissionForm | null>(null);
  const translationFnRef = useRef(t);
  const warnedLocalizationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    warnedLocalizationIdsRef.current.clear();
  }, [id]);

  useEffect(() => {
    translationFnRef.current = t;
  }, [t]);

  const updateFormState = useCallback(
    (updater: (prev: PermissionForm) => PermissionForm) => {
      setFormState((prev) => {
        if (!prev) {
          return prev;
        }
        const next = updater(prev);
        if (baselineRef.current) {
          setHasChanges(!formsEqual(next, baselineRef.current));
        }
        return next;
      });
    },
    [],
  );

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      setIsEditing(false);

      const [permissionResponse, groupsResponse] = await Promise.all([
        permissionsService.getById(id, { language }),
        permissionGroupsService.list({ pageSize: 200, language }),
      ]);

      let nameLocalization: LocalizationRecord | null = permissionResponse.nameLocalizationId
        ? getLocalization(permissionResponse.nameLocalizationId) ?? null
        : null;
      let descriptionLocalization: LocalizationRecord | null =
        permissionResponse.descriptionLocalizationId
          ? getLocalization(permissionResponse.descriptionLocalizationId) ?? null
          : null;

      if (permissionResponse.nameLocalizationId && !nameLocalization) {
        try {
          nameLocalization = await localizationsService.getById(
            permissionResponse.nameLocalizationId,
          );
        } catch {
          if (!warnedLocalizationIdsRef.current.has(permissionResponse.nameLocalizationId)) {
            warnedLocalizationIdsRef.current.add(permissionResponse.nameLocalizationId);
            showToast({
              type: 'warning',
              message: translationFnRef.current('permissions.messages.localization_fetch_failed'),
            });
          }
        }
      }

      if (permissionResponse.descriptionLocalizationId && !descriptionLocalization) {
        try {
          descriptionLocalization = await localizationsService.getById(
            permissionResponse.descriptionLocalizationId,
          );
        } catch {
          if (!warnedLocalizationIdsRef.current.has(permissionResponse.descriptionLocalizationId)) {
            warnedLocalizationIdsRef.current.add(permissionResponse.descriptionLocalizationId);
            showToast({
              type: 'warning',
              message: translationFnRef.current('permissions.messages.localization_fetch_failed'),
            });
          }
        }
      }

      const form: PermissionForm = {
        code: permissionResponse.code,
        permissionGroupId: permissionResponse.permissionGroupId,
        displayOrder: permissionResponse.displayOrder ?? 0,
        logo: permissionResponse.logo ?? '',
        translations: {
          name: buildTranslationState(supportedLanguages, nameLocalization),
          description: buildTranslationState(supportedLanguages, descriptionLocalization),
        },
      };

      const currentLang = normalizedCurrentLanguage;
      if (!form.translations.name[currentLang]) {
        form.translations.name[currentLang] =
          permissionResponse.name?.trim() ||
          resolveLocalization(permissionResponse.nameLocalizationId) ||
          form.translations.name[currentLang] ||
          '';
      }
      if (!form.translations.description[currentLang]) {
        form.translations.description[currentLang] =
          permissionResponse.description?.trim() ||
          resolveLocalization(permissionResponse.descriptionLocalizationId) ||
          form.translations.description[currentLang] ||
          '';
      }

      baselineRef.current = cloneForm(form);
      setFormState(cloneForm(form));
      setHasChanges(false);
      setPermission(permissionResponse);
      setGroups(groupsResponse.items);
    } catch (error: any) {
      console.error('Failed to load permission details', error);
      showToast({
        type: 'error',
        message:
          error?.message || translationFnRef.current('permissions.messages.load_failed'),
      });
      navigate('/permissions');
    } finally {
      setLoading(false);
    }
  }, [
    getLocalization,
    id,
    language,
    normalizedCurrentLanguage,
    navigate,
    resolveLocalization,
    showToast,
    supportedLanguages,
  ]);

  useEffect(() => {
    if (!translationsReady) {
      return;
    }
    void loadData();
  }, [loadData, translationsReady]);

  const handleHeaderNameChange = useCallback(
    (value: string) => {
      updateFormState((prev) => {
        const next = cloneForm(prev);
        next.translations.name = {
          ...next.translations.name,
          [normalizedCurrentLanguage]: value,
        };
        return next;
      });
    },
    [normalizedCurrentLanguage, updateFormState],
  );

  const handleHeaderDescriptionChange = useCallback(
    (value: string) => {
      updateFormState((prev) => {
        const next = cloneForm(prev);
        next.translations.description = {
          ...next.translations.description,
          [normalizedCurrentLanguage]: value,
        };
        return next;
      });
    },
    [normalizedCurrentLanguage, updateFormState],
  );

  const handleEnterEdit = () => {
    if (!canUpdatePermission) {
      return;
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (!baselineRef.current) {
      return;
    }
    setFormState(cloneForm(baselineRef.current));
    setHasChanges(false);
    setIsEditing(false);
  };

  const buildChangesList = (): ChangeItem[] => {
    if (!formState || !baselineRef.current) {
      return [];
    }
    const changes: ChangeItem[] = [];
    const baseline = baselineRef.current;

    const normalizedCurrent = normalizeForm(formState);
    const normalizedBaseline = normalizeForm(baseline);

    if (normalizedCurrent.code !== normalizedBaseline.code) {
      changes.push({
        field: t('permissions.fields.code'),
        oldValue: normalizedBaseline.code || '—',
        newValue: normalizedCurrent.code || '—',
      });
    }

    if (normalizedCurrent.displayOrder !== normalizedBaseline.displayOrder) {
      changes.push({
        field: t('permissions.fields.display_order'),
        oldValue: normalizedBaseline.displayOrder,
        newValue: normalizedCurrent.displayOrder,
      });
    }

    if (normalizedCurrent.logo !== normalizedBaseline.logo) {
      changes.push({
        field: t('permissions.fields.logo_url'),
        oldValue: normalizedBaseline.logo || '—',
        newValue: normalizedCurrent.logo || '—',
      });
    }

    if (normalizedCurrent.permissionGroupId !== normalizedBaseline.permissionGroupId) {
      const previous = groups.find((group) => group.id === normalizedBaseline.permissionGroupId);
      const current = groups.find((group) => group.id === normalizedCurrent.permissionGroupId);
      changes.push({
        field: t('permissions.fields.permission_group'),
        oldValue:
          previous?.name?.trim() ||
          (previous?.nameLocalizationId
            ? resolveLocalization(previous.nameLocalizationId)
            : '') ||
          previous?.nameLocalizationId ||
          '—',
        newValue:
          current?.name?.trim() ||
          (current?.nameLocalizationId ? resolveLocalization(current.nameLocalizationId) : '') ||
          current?.nameLocalizationId ||
          '—',
      });
    }

    const nameCode = normalizedCurrentLanguage;
    const nameLabel = `${t('permissions.fields.name')} (${currentLanguageOption.label})`;
    const previousName = normalizedBaseline.translations.name[nameCode] ?? '';
    const nextName = normalizedCurrent.translations.name[nameCode] ?? '';
    if (previousName !== nextName) {
      changes.push({
        field: nameLabel,
        oldValue: previousName || '—',
        newValue: nextName || '—',
      });
    }

    const descriptionLabel = `${t('permissions.fields.description')} (${currentLanguageOption.label})`;
    const previousDescription =
      normalizedBaseline.translations.description[nameCode] ?? '';
    const nextDescription = normalizedCurrent.translations.description[nameCode] ?? '';
    if (previousDescription !== nextDescription) {
      changes.push({
        field: descriptionLabel,
        oldValue: previousDescription || '—',
        newValue: nextDescription || '—',
      });
    }

    return changes;
  };

  const handleSave = () => {
    if (!formState || !baselineRef.current) {
      return;
    }
    const changes = buildChangesList();
    if (changes.length === 0) {
      showToast({
        type: 'info',
        message: t('permissions.messages.no_changes'),
      });
      return;
    }
    setPendingChanges(changes);
    setCommentDialogOpen(true);
  };

  const handleConfirmSave = async (comment: string) => {
    if (!formState || !baselineRef.current || !permission || !id) {
      return;
    }
    try {
      setSaving(true);
      const payload = buildUpdatePayload(
        formState,
        baselineRef.current,
        normalizedCurrentLanguage,
      );
      if (Object.keys(payload).length === 0) {
        showToast({
          type: 'info',
          message: t('permissions.messages.no_changes'),
        });
        setCommentDialogOpen(false);
        setPendingChanges([]);
        return;
      }
      await permissionsService.update(id, payload, comment);
      showToast({
        type: 'success',
        message: t('permissions.messages.updated'),
      });
      setCommentDialogOpen(false);
      setPendingChanges([]);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update permission', error);
      showToast({
        type: 'error',
        message: error?.message || t('permissions.messages.update_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
    if (!saving) {
      setPendingChanges([]);
    }
  };

  const handleGroupSelect = useCallback((groupId: string) => {
    updateFormState((prev) => ({
      ...prev,
      permissionGroupId: groupId,
    }));
  }, [updateFormState]);

  const currentGroup = useMemo(() => {
    if (!formState) {
      return null;
    }
    return groups.find((group) => group.id === formState.permissionGroupId) ?? null;
  }, [formState, groups]);

  const tabs = useMemo<TabConfig[]>(() => {
    if (!formState || !permission) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('permissions.tabs.details'),
        icon: FileText,
        component: PermissionDetailsTab,
        props: {
          form: formState,
          editMode: isEditing,
          onChange: updateFormState,
          metadata: {
            id: permission.id,
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt,
          },
        },
        hidden: !canReadPermission,
      },
      {
        id: 'permission-group',
        label: t('permissions.tabs.permission_group'),
        icon: FolderTree,
        component: PermissionGroupTab,
        props: {
          editMode: isEditing,
          groups,
          selectedGroupId: formState.permissionGroupId,
          onSelect: handleGroupSelect,
          currentGroup,
        },
        hidden: !canReadPermissionGroups,
      },
      {
        id: 'notifications',
        label: t('details.tabs.notifications'),
        icon: Bell,
        component: NotificationsTab,
        props: {
          entityId: permission.id,
          editMode: isEditing,
        },
        hidden: !canReadPermission,
      },
      {
        id: 'statistics',
        label: t('details.tabs.statistics'),
        icon: BarChart3,
        component: StatisticsTab,
        props: {
          entityId: permission.id,
          editMode: isEditing,
        },
        hidden: !canReadPermission,
      },
      {
        id: 'api',
        label: t('details.tabs.api'),
        icon: Code,
        component: ApiTab,
        props: {
          entityId: permission.id,
          editMode: isEditing,
        },
        hidden: !canReadPermission,
      },
      {
        id: 'documentation',
        label: t('details.tabs.documentation'),
        icon: BookOpen,
        component: DocumentationTab,
        props: {
          entityId: permission.id,
          editMode: isEditing,
        },
        hidden: !canReadPermission,
      },
      {
        id: 'history',
        label: t('details.tabs.history'),
        icon: HistoryIcon,
        component: HistoryTab,
        props: {
          entityId: permission.id,
        },
        hidden: !canViewPermissionHistory,
      },
    ];
  }, [
    currentGroup,
    formState,
    groups,
    handleGroupSelect,
    isEditing,
    permission,
    canReadPermission,
    canReadPermissionGroups,
    canViewPermissionHistory,
    supportedLanguages,
    t,
    updateFormState,
  ]);

  if (loading || !permission || !formState) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentNameValue = formState.translations.name[normalizedCurrentLanguage] ?? '';
  const currentDescriptionValue =
    formState.translations.description[normalizedCurrentLanguage] ?? '';

  const displayName =
    permission.name?.trim() ||
    resolveLocalization(permission.nameLocalizationId) ||
    permission.nameLocalizationId ||
    t('permissions.details.title');

  const displayDescription =
    permission.description?.trim() ||
    resolveLocalization(permission.descriptionLocalizationId) ||
    permission.descriptionLocalizationId ||
    t('permissions.details.subtitle');

  const titleNode = isEditing ? (
    <Input
      value={currentNameValue}
      onChange={(event) => handleHeaderNameChange(event.target.value)}
      placeholder={t('permissions.placeholders.name', { language: currentLanguageOption.label })}
      className="max-w-xl"
      autoFocus
    />
  ) : (
    displayName
  );

  const subtitleNode = isEditing ? (
    <Textarea
      value={currentDescriptionValue}
      onChange={(event) => handleHeaderDescriptionChange(event.target.value)}
      placeholder={t('permissions.placeholders.description', {
        language: currentLanguageOption.label,
      })}
      rows={3}
      className="max-w-xl"
    />
  ) : (
    displayDescription
  );

  return (
    <>
      <DetailsLayout
        title={titleNode}
        subtitle={subtitleNode}
        icon={<Key className="h-6 w-6 text-white" />}
        backUrl="/permissions"
        tabs={tabs}
        editMode={isEditing}
        hasChanges={hasChanges}
        onEdit={canUpdatePermission ? handleEnterEdit : undefined}
        onSave={canUpdatePermission ? handleSave : undefined}
        onCancel={handleCancel}
        inlineActions={false}
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={permission.name?.trim() || permission.code}
      />
    </>
  );
}
