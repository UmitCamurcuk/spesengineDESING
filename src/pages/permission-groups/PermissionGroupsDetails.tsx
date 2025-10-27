import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FolderTree,
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
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import { permissionsService } from '../../api/services/permissions.service';
import { localizationsService } from '../../api/services/localizations.service';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { PERMISSIONS } from '../../config/permissions';
import type {
  PermissionGroupRecord,
  PermissionRecord,
  LanguageOption,
  PermissionGroupUpdateRequest,
  LocalizationRecord,
} from '../../api/types/api.types';
import type { TabConfig } from '../../types/common';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { HistoryTable } from '../../components/common/HistoryTable';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';

type GroupForm = {
  translations: {
    name: Record<string, string>;
    description: Record<string, string>;
  };
  displayOrder: number;
  logo: string;
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

const cloneGroupForm = (form: GroupForm): GroupForm => ({
  translations: {
    name: { ...form.translations.name },
    description: { ...form.translations.description },
  },
  displayOrder: form.displayOrder,
  logo: form.logo,
});

const normalizeGroupForm = (form: GroupForm): GroupForm => ({
  translations: {
    name: Object.fromEntries(
      Object.entries(form.translations.name).map(([key, value]) => [key, value.trim()]),
    ),
    description: Object.fromEntries(
      Object.entries(form.translations.description).map(([key, value]) => [key, value.trim()]),
    ),
  },
  displayOrder: form.displayOrder,
  logo: form.logo.trim(),
});

const translationsEqual = (a: Record<string, string>, b: Record<string, string>): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? '').trim() !== (b[key] ?? '').trim()) {
      return false;
    }
  }
  return true;
};

const groupFormsEqual = (a: GroupForm, b: GroupForm): boolean => {
  const normalizedA = normalizeGroupForm(a);
  const normalizedB = normalizeGroupForm(b);
  return (
    normalizedA.displayOrder === normalizedB.displayOrder &&
    normalizedA.logo === normalizedB.logo &&
    translationsEqual(normalizedA.translations.name, normalizedB.translations.name) &&
    translationsEqual(normalizedA.translations.description, normalizedB.translations.description)
  );
};

interface GroupDetailsTabProps {
  form: GroupForm;
  editMode: boolean;
  onChange: (updater: (prev: GroupForm) => GroupForm) => void;
  languages: LanguageOption[];
  metadata: {
    id: string;
    createdAt: string;
    updatedAt: string;
  };
}

const GroupDetailsTab: React.FC<GroupDetailsTabProps> = ({ form, editMode, onChange, languages, metadata }) => {
  const { t } = useLanguage();

  const handleTranslationChange = (
    field: 'name' | 'description',
    languageCode: string,
    value: string,
  ) => {
    const normalized = normalizeLanguageCode(languageCode);
    onChange((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [field]: {
          ...prev.translations[field],
          [normalized]: value,
        },
      },
    }));
  };

  const handleFieldChange = (field: keyof GroupForm, value: string | number) => {
    onChange((prev) => ({
      ...prev,
      [field]: field === 'displayOrder' ? Number(value) : value,
    }));
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t('permissionGroups.details.basic_information')}
          subtitle={t('permissionGroups.details.basic_information_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('permissionGroups.fields.display_order')}
            type="number"
            value={form.displayOrder}
            onChange={(event) => handleFieldChange('displayOrder', event.target.value)}
            disabled={!editMode}
          />
          <Input
            label={t('permissionGroups.fields.logo_url')}
            value={form.logo}
            onChange={(event) => handleFieldChange('logo', event.target.value)}
            placeholder="https://example.com/logo.svg"
            disabled={!editMode}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mt-4">
          <div>
            <span className="font-medium text-foreground block">
              {t('permissionGroups.fields.identifier')}
            </span>
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded-lg mt-1 block">
              {metadata.id}
            </code>
          </div>
          <div>
            <span className="font-medium text-foreground block">
              {t('permissionGroups.fields.created_at')}
            </span>
            <span className="mt-1 block">{new Date(metadata.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="font-medium text-foreground block">
              {t('permissionGroups.fields.updated_at')}
            </span>
            <span className="mt-1 block">{new Date(metadata.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={t('permissionGroups.fields.name_translations')}
          subtitle={t('permissionGroups.fields.name_translations_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((language) => {
            const normalized = normalizeLanguageCode(language.code);
            return (
              <Input
                key={`name-${normalized}`}
                label={`${t('permissionGroups.fields.name')} (${language.label})`}
                value={form.translations.name[normalized] ?? ''}
                onChange={(event) => handleTranslationChange('name', language.code, event.target.value)}
                disabled={!editMode}
              />
            );
          })}
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={t('permissionGroups.fields.description_translations')}
          subtitle={t('permissionGroups.fields.description_translations_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((language) => {
            const normalized = normalizeLanguageCode(language.code);
            return (
              <div key={`description-${normalized}`}>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('permissionGroups.fields.description')} ({language.label})
                </label>
                <textarea
                  value={form.translations.description[normalized] ?? ''}
                  onChange={(event) => handleTranslationChange('description', language.code, event.target.value)}
                  rows={editMode ? 4 : 3}
                  className="w-full px-3 py-2 text-sm bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:bg-muted resize-none"
                  disabled={!editMode}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

interface GroupPermissionsTabProps {
  editMode: boolean;
  permissions: PermissionRecord[];
  assignedIds: string[];
  baselineAssigned: Set<string>;
  reassignmentTargets: Record<string, string>;
  onToggle: (permission: PermissionRecord, enabled: boolean) => void;
  onReassign: (permissionId: string, groupId: string) => void;
  groups: PermissionGroupRecord[];
  currentGroupId: string;
}

const GroupPermissionsTab: React.FC<GroupPermissionsTabProps> = ({
  editMode,
  permissions,
  assignedIds,
  baselineAssigned,
  reassignmentTargets,
  onToggle,
  onReassign,
  groups,
  currentGroupId,
}) => {
  const { t } = useLanguage();
  const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds]);
  const otherGroups = useMemo(
    () => groups.filter((group) => group.id !== currentGroupId),
    [groups, currentGroupId],
  );

  const permissionsSorted = useMemo(
    () => permissions.slice().sort((a, b) => a.code.localeCompare(b.code)),
    [permissions],
  );

  if (permissionsSorted.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t('permissionGroups.permissions.empty_state')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {permissionsSorted.map((permission) => {
        const enabled = assignedSet.has(permission.id);
        const wasInitiallyAssigned = baselineAssigned.has(permission.id);
        const reassignmentTarget = reassignmentTargets[permission.id] ?? '';

        return (
          <div
            key={permission.id}
            className={`border rounded-lg p-4 space-y-3 ${
              enabled ? 'border-primary/40 bg-primary/5' : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{permission.code}</span>
                <span className="text-xs text-muted-foreground">
                  {permission.name?.trim() || permission.nameLocalizationId || '—'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enabled}
                  onChange={(event) => onToggle(permission, event.target.checked)}
                  disabled={!editMode}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:bg-primary transition-colors peer-disabled:opacity-60" />
                <div className="absolute left-0 top-0 ml-0.5 mt-0.5 h-5 w-5 bg-white rounded-full border border-border shadow-sm transition-transform duration-200 peer-checked:translate-x-full peer-checked:border-transparent" />
              </label>
            </div>

            {!enabled && wasInitiallyAssigned && editMode && otherGroups.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  label={t('permissionGroups.permissions.reassign_to')}
                  value={reassignmentTarget}
                  onChange={(event) => onReassign(permission.id, event.target.value)}
                  options={otherGroups.map((group) => ({
                    value: group.id,
                    label: group.name?.trim() || group.nameLocalizationId || group.id,
                  }))}
                />
                <Badge variant="secondary" className="self-center">
                  {t('permissionGroups.permissions.will_be_moved')}
                </Badge>
              </div>
            )}

            {!enabled && wasInitiallyAssigned && editMode && otherGroups.length === 0 && (
              <p className="text-xs text-error">
                {t('permissionGroups.permissions.no_other_groups')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const NotificationsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <NotificationSettings entityType="permission-group" entityId={entityId} editMode={editMode} />
);

const StatisticsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Statistics entityType="permission-group" entityId={entityId} editMode={editMode} />
);

const ApiTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <APITester entityType="permission-group" entityId={entityId} editMode={editMode} />
);

const DocumentationTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Documentation entityType="permission-group" entityId={entityId} editMode={editMode} />
);

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="PermissionGroup" entityId={entityId} />
);

export function PermissionGroupsDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const { hasPermission } = useAuth();
  const { settings } = useSettings();

  const supportedLanguages = useMemo<LanguageOption[]>(() => {
    const configured = settings?.localization?.supportedLanguages ?? [];
    if (configured.length === 0) {
      return fallbackLanguages;
    }
    return configured.map((language) => ({
      code: language.code,
      label: language.label,
      required: Boolean(language.required),
    }));
  }, [settings?.localization?.supportedLanguages]);

  const canReadGroup = hasPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.VIEW);
  const canUpdateGroup = hasPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.UPDATE);
  const canViewGroupHistory = hasPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.HISTORY);
  const canReadPermissions = hasPermission(PERMISSIONS.SYSTEM.PERMISSIONS.VIEW);

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<PermissionGroupRecord | null>(null);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [allGroups, setAllGroups] = useState<PermissionGroupRecord[]>([]);

  const [formState, setFormState] = useState<GroupForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const groupBaselineRef = useRef<GroupForm | null>(null);
  const [hasFieldChanges, setHasFieldChanges] = useState(false);

  const [assignedPermissions, setAssignedPermissions] = useState<string[]>([]);
  const assignedBaselineRef = useRef<Set<string>>(new Set());
  const [reassignmentTargets, setReassignmentTargets] = useState<Record<string, string>>({});
  const [permissionsChanged, setPermissionsChanged] = useState(false);

  const [pendingChanges, setPendingChanges] = useState<ChangeItem[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateFormState = useCallback(
    (updater: (prev: GroupForm) => GroupForm) => {
      setFormState((prev) => {
        if (!prev) {
          return prev;
        }
        const next = updater(prev);
        if (groupBaselineRef.current) {
          setHasFieldChanges(!groupFormsEqual(next, groupBaselineRef.current));
        }
        return next;
      });
    },
    [],
  );

  const evaluatePermissionsChanged = useCallback(
    (currentAssigned: string[], reassignment: Record<string, string>) => {
      if (!assignedBaselineRef.current) {
        return false;
      }
      const baselineArray = Array.from(assignedBaselineRef.current).sort();
      const currentArray = [...currentAssigned].sort();
      if (baselineArray.length !== currentArray.length) {
        return true;
      }
      for (let i = 0; i < baselineArray.length; i += 1) {
        if (baselineArray[i] !== currentArray[i]) {
          return true;
        }
      }
      return Object.keys(reassignment).length > 0;
    },
    [],
  );

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      const groupResponse = await permissionGroupsService.getById(id, { language });
      const [permissionsResponse, groupsResponse, nameLocalization, descriptionLocalization] =
        await Promise.all([
          permissionsService.list({ pageSize: 1000, language }),
          permissionGroupsService.list({ pageSize: 200, language }),
          localizationsService
            .getById(groupResponse.nameLocalizationId)
            .catch(() => null),
          localizationsService
            .getById(groupResponse.descriptionLocalizationId)
            .catch(() => null),
        ]);

      const form: GroupForm = {
        translations: {
          name: buildTranslationState(supportedLanguages, nameLocalization as LocalizationRecord | null),
          description: buildTranslationState(
            supportedLanguages,
            descriptionLocalization as LocalizationRecord | null,
          ),
        },
        displayOrder: groupResponse.displayOrder ?? 0,
        logo: groupResponse.logo ?? '',
      };

      groupBaselineRef.current = cloneGroupForm(form);
      setFormState(cloneGroupForm(form));
      setHasFieldChanges(false);
      setIsEditing(false);

      const assigned = permissionsResponse.items
        .filter((permission) => permission.permissionGroupId === groupResponse.id)
        .map((permission) => permission.id);
      assignedBaselineRef.current = new Set(assigned);
      setAssignedPermissions(assigned);
      setReassignmentTargets({});
      setPermissionsChanged(false);

      setGroup(groupResponse);
      setPermissions(permissionsResponse.items);
      setAllGroups(groupsResponse.items);
    } catch (error: any) {
      console.error('Failed to load permission group details', error);
      showToast({
        type: 'error',
        message: error?.message || t('permissionGroups.messages.load_failed'),
      });
      navigate('/permission-groups');
    } finally {
      setLoading(false);
    }
  }, [id, language, navigate, showToast, supportedLanguages, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleTogglePermission = useCallback((permission: PermissionRecord, enabled: boolean) => {
    setAssignedPermissions((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(permission.id);
        const nextArray = Array.from(next);
        const { [permission.id]: _removed, ...rest } = reassignmentTargets;
        setReassignmentTargets(rest);
        setPermissionsChanged(evaluatePermissionsChanged(nextArray, rest));
        return nextArray;
      }

      const otherGroups = allGroups.filter((groupRecord) => groupRecord.id !== permission.permissionGroupId);
      if (otherGroups.length === 0) {
        showToast({
          type: 'warning',
          message: t('permissionGroups.messages.no_available_groups'),
        });
        return prev;
      }

      next.delete(permission.id);
      const nextArray = Array.from(next);
      setReassignmentTargets((prevMap) => {
        const updated = {
          ...prevMap,
          [permission.id]: prevMap[permission.id] ?? otherGroups[0].id,
        };
        setPermissionsChanged(evaluatePermissionsChanged(nextArray, updated));
        return updated;
      });

      return nextArray;
    });
  }, [allGroups, evaluatePermissionsChanged, reassignmentTargets, showToast, t]);

  const handleReassignmentChange = useCallback((permissionId: string, groupId: string) => {
    setReassignmentTargets((prev) => {
      const next = {
        ...prev,
        [permissionId]: groupId,
      };
      setPermissionsChanged(evaluatePermissionsChanged(assignedPermissions, next));
      return next;
    });
  }, [assignedPermissions, evaluatePermissionsChanged]);

  const handleEnterEdit = () => {
    if (!canUpdateGroup) {
      return;
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (!groupBaselineRef.current) {
      return;
    }
    setFormState(cloneGroupForm(groupBaselineRef.current));
    setHasFieldChanges(false);
    const baselineArray = Array.from(assignedBaselineRef.current ?? new Set<string>());
    setAssignedPermissions(baselineArray);
    setReassignmentTargets({});
    setPermissionsChanged(false);
    setIsEditing(false);
  };

  const buildChangesList = (): ChangeItem[] => {
    if (!formState || !groupBaselineRef.current) {
      return [];
    }
    const changes: ChangeItem[] = [];
    const normalizedCurrent = normalizeGroupForm(formState);
    const normalizedBaseline = normalizeGroupForm(groupBaselineRef.current);

    if (normalizedCurrent.displayOrder !== normalizedBaseline.displayOrder) {
      changes.push({
        field: t('permissionGroups.fields.display_order'),
        oldValue: normalizedBaseline.displayOrder,
        newValue: normalizedCurrent.displayOrder,
      });
    }

    if (normalizedCurrent.logo !== normalizedBaseline.logo) {
      changes.push({
        field: t('permissionGroups.fields.logo_url'),
        oldValue: normalizedBaseline.logo || '—',
        newValue: normalizedCurrent.logo || '—',
      });
    }

    supportedLanguages.forEach((languageOption) => {
      const code = normalizeLanguageCode(languageOption.code);
      const nameKey = `${t('permissionGroups.fields.name')} (${languageOption.label})`;
      const oldName = normalizedBaseline.translations.name[code] ?? '';
      const newName = normalizedCurrent.translations.name[code] ?? '';
      if (oldName !== newName) {
        changes.push({
          field: nameKey,
          oldValue: oldName || '—',
          newValue: newName || '—',
        });
      }

      const descriptionKey = `${t('permissionGroups.fields.description')} (${languageOption.label})`;
      const oldDescription = normalizedBaseline.translations.description[code] ?? '';
      const newDescription = normalizedCurrent.translations.description[code] ?? '';
      if (oldDescription !== newDescription) {
        changes.push({
          field: descriptionKey,
          oldValue: oldDescription || '—',
          newValue: newDescription || '—',
        });
      }
    });

    if (permissionsChanged) {
      const baselineAssigned = Array.from(assignedBaselineRef.current);
      changes.push({
        field: t('permissionGroups.fields.permissions'),
        oldValue: baselineAssigned.length,
        newValue: assignedPermissions.length,
      });
    }

    return changes;
  };

  const handleSave = () => {
    if (!formState || !groupBaselineRef.current || !group) {
      return;
    }
    const changes = buildChangesList();
    if (changes.length === 0) {
      showToast({ type: 'info', message: t('permissionGroups.messages.no_changes') });
      return;
    }

    if (permissionsChanged) {
      const baseline = assignedBaselineRef.current ?? new Set<string>();
      const assignedSet = new Set(assignedPermissions);
      const removed = Array.from(baseline).filter((id) => !assignedSet.has(id));
      for (const permissionId of removed) {
        if (!reassignmentTargets[permissionId]) {
          showToast({
            type: 'warning',
            message: t('permissionGroups.messages.select_target_group'),
          });
          return;
        }
      }
    }

    setPendingChanges(changes);
    setCommentDialogOpen(true);
  };

  const handleConfirmSave = async (comment: string) => {
    if (!formState || !group || !id) {
      return;
    }

    try {
      setSaving(true);
      const operations: Array<Promise<unknown>> = [];

      const normalizedCurrent = normalizeGroupForm(formState);
      const normalizedBaseline = groupBaselineRef.current
        ? normalizeGroupForm(groupBaselineRef.current)
        : normalizedCurrent;

      const updatePayload: PermissionGroupUpdateRequest = {};
      if (normalizedCurrent.displayOrder !== normalizedBaseline.displayOrder) {
        updatePayload.displayOrder = normalizedCurrent.displayOrder;
      }
      if (normalizedCurrent.logo !== normalizedBaseline.logo) {
        updatePayload.logo = normalizedCurrent.logo || null;
      }
      if (!translationsEqual(normalizedCurrent.translations.name, normalizedBaseline.translations.name)) {
        updatePayload.name = normalizedCurrent.translations.name;
      }
      if (!translationsEqual(normalizedCurrent.translations.description, normalizedBaseline.translations.description)) {
        updatePayload.description = normalizedCurrent.translations.description;
      }

      if (Object.keys(updatePayload).length > 0) {
        operations.push(permissionGroupsService.update(id, updatePayload, comment));
      }

      if (permissionsChanged) {
        const baseline = assignedBaselineRef.current ?? new Set<string>();
        const assignedSet = new Set(assignedPermissions);
        const added = assignedPermissions.filter((permissionId) => !baseline.has(permissionId));
        const removed = Array.from(baseline).filter((permissionId) => !assignedSet.has(permissionId));

        for (const permissionId of added) {
          operations.push(
            permissionsService.update(permissionId, { permissionGroupId: group.id }, comment),
          );
        }

        for (const permissionId of removed) {
          const targetGroupId = reassignmentTargets[permissionId];
          if (!targetGroupId) {
            continue;
          }
          operations.push(
            permissionsService.update(permissionId, { permissionGroupId: targetGroupId }, comment),
          );
        }
      }

      await Promise.all(operations);
      showToast({ type: 'success', message: t('permissionGroups.messages.updated') });

      setCommentDialogOpen(false);
      setPendingChanges([]);
      setIsEditing(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update permission group', error);
      showToast({
        type: 'error',
        message: error?.message || t('permissionGroups.messages.update_failed'),
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
    if (!formState || !group) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('permissionGroups.tabs.details'),
        icon: FileText,
        component: GroupDetailsTab,
        props: {
          form: formState,
          editMode: isEditing,
          onChange: updateFormState,
          languages: supportedLanguages,
          metadata: {
            id: group.id,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          },
        },
        hidden: !canReadGroup,
      },
      {
        id: 'permissions',
        label: t('permissionGroups.tabs.permissions'),
        icon: Layers,
        component: GroupPermissionsTab,
        props: {
          editMode: isEditing,
          permissions,
          assignedIds: assignedPermissions,
          baselineAssigned: assignedBaselineRef.current ?? new Set<string>(),
          reassignmentTargets,
          onToggle: handleTogglePermission,
          onReassign: handleReassignmentChange,
          groups: allGroups,
          currentGroupId: group.id,
        },
        hidden: !canReadPermissions,
      },
      {
        id: 'notifications',
        label: t('details.tabs.notifications'),
        icon: Bell,
        component: NotificationsTab,
        props: {
          entityId: group.id,
          editMode: isEditing,
        },
        hidden: !canReadGroup,
      },
      {
        id: 'statistics',
        label: t('details.tabs.statistics'),
        icon: BarChart3,
        component: StatisticsTab,
        props: {
          entityId: group.id,
          editMode: isEditing,
        },
        hidden: !canReadGroup,
      },
      {
        id: 'api',
        label: t('details.tabs.api'),
        icon: Code,
        component: ApiTab,
        props: {
          entityId: group.id,
          editMode: isEditing,
        },
        hidden: !canReadGroup,
      },
      {
        id: 'documentation',
        label: t('details.tabs.documentation'),
        icon: BookOpen,
        component: DocumentationTab,
        props: {
          entityId: group.id,
          editMode: isEditing,
        },
        hidden: !canReadGroup,
      },
      {
        id: 'history',
        label: t('details.tabs.history'),
        icon: HistoryIcon,
        component: HistoryTab,
        props: {
          entityId: group.id,
        },
        hidden: !canViewGroupHistory,
      },
    ];
  }, [
    allGroups,
    assignedPermissions,
    canReadGroup,
    canReadPermissions,
    canViewGroupHistory,
    formState,
    group,
    handleReassignmentChange,
    handleTogglePermission,
    isEditing,
    permissions,
    permissionsChanged,
    reassignmentTargets,
    supportedLanguages,
    t,
    updateFormState,
  ]);

  if (loading || !group || !formState) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={group.name?.trim() || group.nameLocalizationId || t('permissionGroups.details.title')}
        subtitle={group.description?.trim() || group.descriptionLocalizationId || t('permissionGroups.details.subtitle')}
        icon={<FolderTree className="h-6 w-6 text-white" />}
        backUrl="/permission-groups"
        tabs={tabs}
        editMode={isEditing}
        hasChanges={hasFieldChanges || permissionsChanged}
        onEdit={canUpdateGroup ? handleEnterEdit : undefined}
        onSave={canUpdateGroup ? handleSave : undefined}
        onCancel={handleCancel}
        inlineActions={false}
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={group.name?.trim() || group.id}
      />
    </>
  );
}
