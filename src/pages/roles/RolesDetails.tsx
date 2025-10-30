import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Shield,
  FileText,
  Layers,
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
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { RoleNotificationsTab } from '../../components/notifications/RoleNotificationsTab';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { HistoryTable } from '../../components/common/HistoryTable';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { rolesService } from '../../api/services/roles.service';
import { permissionsService } from '../../api/services/permissions.service';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import { PERMISSIONS } from '../../config/permissions';
import { cn } from '../../utils/cn';
import type {
  RoleWithPermissions,
  PermissionRecord,
  PermissionGroupRecord,
  LanguageOption,
  RoleUpdateRequest,
  LocalizationRecord,
} from '../../api/types/api.types';
import type { TabConfig } from '../../types/common';

type RoleForm = {
  translations: {
    name: Record<string, string>;
    description: Record<string, string>;
  };
  permissions: string[];
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

const cloneForm = (form: RoleForm): RoleForm => ({
  translations: {
    name: { ...form.translations.name },
    description: { ...form.translations.description },
  },
  permissions: [...form.permissions],
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

const permissionsEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

const normalizeForm = (form: RoleForm): RoleForm => ({
  translations: {
    name: trimTranslationMap(form.translations.name),
    description: trimTranslationMap(form.translations.description),
  },
  permissions: [...form.permissions].sort(),
});

const formsEqual = (a: RoleForm, b: RoleForm): boolean => {
  const normalizedA = normalizeForm(a);
  const normalizedB = normalizeForm(b);
  return (
    translationMapsEqual(normalizedA.translations.name, normalizedB.translations.name) &&
    translationMapsEqual(
      normalizedA.translations.description,
      normalizedB.translations.description,
    ) &&
    permissionsEqual(normalizedA.permissions, normalizedB.permissions)
  );
};

const buildUpdatePayloadForLanguage = (
  current: RoleForm,
  baseline: RoleForm,
  languageCode: string,
): RoleUpdateRequest => {
  const payload: RoleUpdateRequest = {};
  const normalizedCurrent = normalizeForm(current);
  const normalizedBaseline = normalizeForm(baseline);
  const lang = normalizeLanguageCode(languageCode);

  // Only send changes for the active language
  const currentName = normalizedCurrent.translations.name[lang] ?? '';
  const baselineName = normalizedBaseline.translations.name[lang] ?? '';
  if (currentName !== baselineName) {
    payload.name = { [lang]: currentName } as any;
  }

  const currentDesc = normalizedCurrent.translations.description[lang] ?? '';
  const baselineDesc = normalizedBaseline.translations.description[lang] ?? '';
  if (currentDesc !== baselineDesc) {
    payload.description = { [lang]: currentDesc } as any;
  }

  if (!permissionsEqual(normalizedCurrent.permissions, normalizedBaseline.permissions)) {
    payload.permissions = normalizedCurrent.permissions;
  }

  return payload;
};

interface RoleDetailsTabProps {
  metadata: {
    id: string;
    createdAt: string;
    updatedAt: string;
    isSystemRole: boolean;
  };
  formatDateTime: (value: string | number | Date | null | undefined, options?: { includeTime?: boolean }) => string;
}

const RoleDetailsTab: React.FC<RoleDetailsTabProps> = ({
  metadata,
  formatDateTime,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Card padding="lg" className="bg-card">
        <CardHeader
          title={t('roles.details.metadata')}
          subtitle={t('roles.details.metadata_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground block">{t('roles.fields.identifier')}</span>
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded-lg mt-1 block">
              {metadata.id}
            </code>
          </div>
          <div>
            <span className="font-medium text-foreground block">
              {t('roles.fields.created_at')}
            </span>
            <span className="mt-1 block">{formatDateTime(metadata.createdAt, { includeTime: true })}</span>
          </div>
          <div>
            <span className="font-medium text-foreground block">
              {t('roles.fields.updated_at')}
            </span>
            <span className="mt-1 block">{formatDateTime(metadata.updatedAt, { includeTime: true })}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface RolePermissionsTabProps {
  editMode: boolean;
  groups: PermissionGroupRecord[];
  permissions: PermissionRecord[];
  assignedPermissions: string[];
  onToggle: (permissionId: string, enabled: boolean) => void;
}

const RolePermissionsTab: React.FC<RolePermissionsTabProps> = ({
  editMode,
  groups,
  permissions,
  assignedPermissions,
  onToggle,
}) => {
  const { t } = useLanguage();
  const assignedSet = useMemo(() => new Set(assignedPermissions), [assignedPermissions]);
  const permissionsByGroup = useMemo(() => {
    const map = new Map<string, PermissionRecord[]>();
    permissions.forEach((permission) => {
      const groupId = permission.permissionGroupId ?? 'ungrouped';
      if (!map.has(groupId)) {
        map.set(groupId, []);
      }
      map.get(groupId)!.push(permission);
    });
    return map;
  }, [permissions]);

  const groupList = useMemo(() => {
    return groups
      .map((group) => {
        const groupPermissions = permissionsByGroup.get(group.id) ?? [];
        return {
          group,
          permissions: groupPermissions,
          enabled: groupPermissions.filter((permission) => assignedSet.has(permission.id)).length,
        };
      })
      .filter((entry) => entry.permissions.length > 0)
      .sort(
        (a, b) =>
          (a.group.displayOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.group.displayOrder ?? Number.MAX_SAFE_INTEGER),
      );
  }, [assignedSet, groups, permissionsByGroup]);

  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => groupList[0]?.group.id ?? null);

  useEffect(() => {
    if (!activeGroupId && groupList.length > 0) {
      setActiveGroupId(groupList[0].group.id);
    }
  }, [activeGroupId, groupList]);

  const activeGroup = useMemo(
    () => groupList.find((entry) => entry.group.id === activeGroupId) ?? groupList[0] ?? null,
    [activeGroupId, groupList],
  );

  const handleToggleAll = useCallback(
    (enable: boolean) => {
      if (!activeGroup || !editMode) {
        return;
      }

      activeGroup.permissions.forEach((permission) => {
        const currentlyEnabled = assignedSet.has(permission.id);
        if (enable !== currentlyEnabled) {
          onToggle(permission.id, enable);
        }
      });
    },
    [activeGroup, assignedSet, editMode, onToggle],
  );

  if (groupList.length === 0) {
    return (
      <div className="p-6 border border-dashed border-border rounded-lg text-sm text-muted-foreground">
        {t('roles.messages.no_permissions')}
      </div>
    );
  }

  return (
    <div className="md:flex md:items-start gap-6">
      <div className="md:w-64 w-full">
        <Card className="bg-card">
          <CardHeader title={t('roles.permissions.groups_title')} subtitle={t('roles.permissions.groups_subtitle')} />
          <div className="divide-y divide-border">
            {groupList.map(({ group, permissions: groupPerms, enabled }) => {
              const isActive = activeGroup?.group.id === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 transition-colors',
                    isActive ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'hover:bg-muted/50 border-l-4 border-transparent',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {group.name?.trim() ||
                        resolveLocalization(group.nameLocalizationId) ||
                        group.nameLocalizationId ||
                        t('roles.labels.unknown_group')}
                    </span>
                    <Badge variant={isActive ? 'primary' : 'default'} size="sm">
                      {enabled}/{groupPerms.length}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {group.description?.trim() ||
                      resolveLocalization(group.descriptionLocalizationId) ||
                      group.descriptionLocalizationId ||
                      t('common.no_description')}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {activeGroup?.group.name?.trim() ||
                (activeGroup?.group.nameLocalizationId
                  ? resolveLocalization(activeGroup.group.nameLocalizationId)
                  : '') ||
                activeGroup?.group.nameLocalizationId ||
                t('roles.labels.unknown_group')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeGroup?.group.description?.trim() ||
                (activeGroup?.group.descriptionLocalizationId
                  ? resolveLocalization(activeGroup.group.descriptionLocalizationId)
                  : '') ||
                activeGroup?.group.descriptionLocalizationId ||
                t('common.no_description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(false)}
              disabled={!editMode || !activeGroup}
            >
              {t('roles.permissions.disable_all')}
            </Button>
            <Button
              size="sm"
              onClick={() => handleToggleAll(true)}
              disabled={!editMode || !activeGroup}
            >
              {t('roles.permissions.enable_all')}
            </Button>
          </div>
        </div>

        <Card className="bg-card">
          <div className="divide-y divide-border">
            {activeGroup?.permissions.map((permission) => {
              const enabled = assignedSet.has(permission.id);
              return (
                <label
                  key={permission.id}
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-4 transition-all cursor-pointer",
                    enabled ? "bg-primary/5" : "hover:bg-muted/30",
                    !editMode && "cursor-default"
                  )}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {permission.name?.trim() ||
                          resolveLocalization(permission.nameLocalizationId) ||
                          permission.nameLocalizationId ||
                          '—'}
                      </span>
                      <Badge 
                        variant={enabled ? 'primary' : 'outline'} 
                        size="sm"
                        className="text-xs"
                      >
                        {permission.code}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {permission.description?.trim() ||
                        resolveLocalization(permission.descriptionLocalizationId) ||
                        permission.descriptionLocalizationId ||
                        t('common.no_description')}
                    </p>
                  </div>
                  
                  {/* iPhone-style Toggle */}
                  <div className="flex-shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enabled}
                        onChange={(event) => onToggle(permission.id, event.target.checked)}
                        disabled={!editMode}
                      />
                      <div className={cn(
                        "w-11 h-6 rounded-full transition-colors duration-200",
                        enabled 
                          ? "bg-green-500" 
                          : "bg-gray-300 dark:bg-gray-600",
                        !editMode && "opacity-60"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm",
                          enabled && "translate-x-5"
                        )} />
                      </div>
                    </label>
                  </div>
                </label>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

const NotificationsTab: React.FC<{ 
  entityId: string; 
  editMode: boolean;
  roleName: string;
}> = ({ entityId, roleName }) => (
  <RoleNotificationsTab 
    roleId={entityId}
    roleName={roleName}
  />
);

const StatisticsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Statistics entityType="role" entityId={entityId} editMode={editMode} />
);

const ApiTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <APITester entityType="role" entityId={entityId} editMode={editMode} />
);

const DocumentationTab: React.FC<{ entityId: string; editMode: boolean }> = ({
  entityId,
  editMode,
}) => <Documentation entityType="role" entityId={entityId} editMode={editMode} />;

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="Role" entityId={entityId} />
);

export function RolesDetails() {
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
  const { formatDateTime } = useDateFormatter();

  const canReadRole = hasPermission(PERMISSIONS.SYSTEM.ROLES.VIEW);
  const canUpdateRole = hasPermission(PERMISSIONS.SYSTEM.ROLES.UPDATE);
  const canViewRoleHistory = hasPermission(PERMISSIONS.SYSTEM.ROLES.HISTORY);

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

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<RoleWithPermissions | null>(null);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroupRecord[]>([]);
  const [formState, setFormState] = useState<RoleForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ChangeItem[]>([]);
  const [saving, setSaving] = useState(false);

  const baselineRef = useRef<RoleForm | null>(null);
  const translationFnRef = useRef(t);

  useEffect(() => {
    translationFnRef.current = t;
  }, [t]);

  const updateFormState = useCallback(
    (updater: (prev: RoleForm) => RoleForm) => {
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

      const [roleResponse, permissionsResponse, permissionGroupsResponse] = await Promise.all([
        rolesService.getById(id, { language }),
        permissionsService.list({ pageSize: 1000, language }),
        permissionGroupsService.list({ pageSize: 200, language }),
      ]);

      // API'den direkt name ve description geliyor, aktif dildeki değerleri kullan
      const activeLang = normalizeLanguageCode(language);
      const form: RoleForm = {
        translations: {
          name: {
            [activeLang]: roleResponse.name || '',
          },
          description: {
            [activeLang]: roleResponse.description || '',
          },
        },
        permissions: [...roleResponse.permissions],
      };

      baselineRef.current = cloneForm(form);
      setFormState(cloneForm(form));
      setHasChanges(false);
      setRole(roleResponse);
      setPermissions(permissionsResponse.items);
      setPermissionGroups(permissionGroupsResponse.items);
    } catch (error: any) {
      console.error('Failed to load role details', error);
      showToast({
        type: 'error',
        message: error?.message || translationFnRef.current('roles.messages.load_failed'),
      });
      navigate('/roles');
    } finally {
      setLoading(false);
    }
  }, [
    id,
    language,
    navigate,
    showToast,
  ]);

  useEffect(() => {
    if (!translationsReady) {
      return;
    }
    void loadData();
  }, [loadData, translationsReady]);

  const handleEnterEdit = () => {
    if (!canUpdateRole) {
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

  const handleTogglePermission = useCallback((permissionId: string, enabled: boolean) => {
    updateFormState((prev) => {
      const set = new Set(prev.permissions);
      if (enabled) {
        set.add(permissionId);
      } else {
        set.delete(permissionId);
      }
      return {
        ...prev,
        permissions: Array.from(set),
      };
    });
  }, [updateFormState]);

  const buildChangesList = (): ChangeItem[] => {
    if (!formState || !baselineRef.current) {
      return [];
    }
    const changes: ChangeItem[] = [];
    const normalizedCurrent = normalizeForm(formState);
    const normalizedBaseline = normalizeForm(baselineRef.current);
    const activeLang = normalizeLanguageCode(language);
    const activeLangLabel = supportedLanguages.find(l => normalizeLanguageCode(l.code) === activeLang)?.label || activeLang.toUpperCase();

    // Sadece aktif dildeki değişiklikleri kontrol et
    const nameLabel = `${t('roles.fields.name')} (${activeLangLabel})`;
    const oldNameValue = normalizedBaseline.translations.name[activeLang] ?? '';
    const newNameValue = normalizedCurrent.translations.name[activeLang] ?? '';
    if (oldNameValue !== newNameValue) {
      changes.push({
        field: nameLabel,
        oldValue: oldNameValue || '—',
        newValue: newNameValue || '—',
      });
    }

    const descLabel = `${t('roles.fields.description')} (${activeLangLabel})`;
    const oldDescValue = normalizedBaseline.translations.description[activeLang] ?? '';
    const newDescValue = normalizedCurrent.translations.description[activeLang] ?? '';
    if (oldDescValue !== newDescValue) {
      changes.push({
        field: descLabel,
        oldValue: oldDescValue || '—',
        newValue: newDescValue || '—',
      });
    }

    if (!permissionsEqual(normalizedCurrent.permissions, normalizedBaseline.permissions)) {
      changes.push({
        field: t('roles.fields.permissions'),
        oldValue: normalizedBaseline.permissions.length,
        newValue: normalizedCurrent.permissions.length,
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
        message: t('roles.messages.no_changes'),
      });
      return;
    }
    setPendingChanges(changes);
    setCommentDialogOpen(true);
  };

  const handleConfirmSave = async (comment: string) => {
    if (!formState || !baselineRef.current || !role || !id) {
      return;
    }
    try {
      setSaving(true);
      const payload = buildUpdatePayloadForLanguage(formState, baselineRef.current, language);
      if (Object.keys(payload).length === 0) {
        showToast({
          type: 'info',
          message: t('roles.messages.no_changes'),
        });
        setCommentDialogOpen(false);
        setPendingChanges([]);
        return;
      }
      await rolesService.update(id, payload, comment);
      showToast({
        type: 'success',
        message: t('roles.messages.updated'),
      });
      setCommentDialogOpen(false);
      setPendingChanges([]);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update role', error);
      showToast({
        type: 'error',
        message: error?.message || t('roles.messages.update_failed'),
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

  const tabs = useMemo<TabConfig[]>(() => {
    if (!formState || !role) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('roles.tabs.details'),
        icon: FileText,
        component: RoleDetailsTab,
        props: {
          metadata: {
            id: role.id,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            isSystemRole: role.isSystemRole,
          },
          formatDateTime,
        },
        hidden: !canReadRole,
      },
      {
        id: 'permissions',
        label: t('roles.tabs.permissions'),
        icon: Layers,
        component: RolePermissionsTab,
        props: {
          editMode: isEditing,
          groups: permissionGroups,
          permissions,
          assignedPermissions: formState.permissions,
          onToggle: handleTogglePermission,
        },
        hidden: !canReadRole,
      },
      {
        id: 'notifications',
        label: t('details.tabs.notifications'),
        icon: Bell,
        component: NotificationsTab,
        props: {
          entityId: role.id,
          editMode: isEditing,
          roleName: role.name || 'Unknown Role',
        },
        hidden: !canReadRole,
      },
      {
        id: 'statistics',
        label: t('details.tabs.statistics'),
        icon: BarChart3,
        component: StatisticsTab,
        props: {
          entityId: role.id,
          editMode: isEditing,
        },
        hidden: !canReadRole,
      },
      {
        id: 'api',
        label: t('details.tabs.api'),
        icon: Code,
        component: ApiTab,
        props: {
          entityId: role.id,
          editMode: isEditing,
        },
        hidden: !canReadRole,
      },
      {
        id: 'documentation',
        label: t('details.tabs.documentation'),
        icon: BookOpen,
        component: DocumentationTab,
        props: {
          entityId: role.id,
          editMode: isEditing,
        },
        hidden: !canReadRole,
      },
      {
        id: 'history',
        label: t('details.tabs.history'),
        icon: HistoryIcon,
        component: HistoryTab,
        props: {
          entityId: role.id,
        },
        hidden: !canViewRoleHistory,
      },
    ];
  }, [
    canReadRole,
    canViewRoleHistory,
    formState,
    handleTogglePermission,
    isEditing,
    permissionGroups,
    permissions,
    role,
    supportedLanguages,
    t,
    updateFormState,
  ]);

  // Aktif dildeki name ve description değerlerini al
  const activeLang = normalizeLanguageCode(language);
  const displayTitle = formState?.translations.name[activeLang] || role?.name?.trim() || t('roles.details.title');
  const displaySubtitle = formState?.translations.description[activeLang] || role?.description?.trim() || '';

  const handleTitleChange = useCallback((value: string) => {
    if (!formState) return;
    updateFormState((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        name: {
          ...prev.translations.name,
          [activeLang]: value,
        },
      },
    }));
  }, [formState, activeLang, updateFormState]);

  const handleSubtitleChange = useCallback((value: string) => {
    if (!formState) return;
    updateFormState((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        description: {
          ...prev.translations.description,
          [activeLang]: value,
        },
      },
    }));
  }, [formState, activeLang, updateFormState]);

  if (loading || !role || !formState) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={displayTitle}
        subtitle={displaySubtitle}
        icon={<Shield className="h-6 w-6 text-white" />}
        backUrl="/roles"
        tabs={tabs}
        editMode={isEditing}
        hasChanges={hasChanges}
        onEdit={canUpdateRole ? handleEnterEdit : undefined}
        onSave={canUpdateRole ? handleSave : undefined}
        onCancel={handleCancel}
        inlineActions={false}
        editableTitle={true}
        editableSubtitle={true}
        onTitleChange={handleTitleChange}
        onSubtitleChange={handleSubtitleChange}
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={
          role.name?.trim() ||
          resolveLocalization(role.nameLocalizationId) ||
          role.nameLocalizationId ||
          role.id
        }
      />
    </>
  );
}
