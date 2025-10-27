import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User as UserIcon,
  FileText,
  Shield,
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
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../api/services/users.service';
import { rolesService } from '../../api/services/roles.service';
import type { UserSummary, RoleRecord } from '../../api/types/api.types';
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
import { PERMISSIONS } from '../../config/permissions';

type GeneralForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  location: string;
  about: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  twoFactorEnabled: boolean;
};

type ChangeItem = {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
};

const cloneGeneralForm = (form: GeneralForm): GeneralForm => ({
  ...form,
});

const normalizeGeneralForm = (form: GeneralForm): GeneralForm => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  department: form.department.trim(),
  location: form.location.trim(),
  about: form.about.trim(),
  notificationsEnabled: form.notificationsEnabled,
  emailNotificationsEnabled: form.emailNotificationsEnabled,
  twoFactorEnabled: form.twoFactorEnabled,
});

const generalFormsEqual = (a: GeneralForm, b: GeneralForm): boolean => {
  const normalizedA = normalizeGeneralForm(a);
  const normalizedB = normalizeGeneralForm(b);
  return (
    normalizedA.firstName === normalizedB.firstName &&
    normalizedA.lastName === normalizedB.lastName &&
    normalizedA.email === normalizedB.email &&
    normalizedA.phone === normalizedB.phone &&
    normalizedA.department === normalizedB.department &&
    normalizedA.location === normalizedB.location &&
    normalizedA.about === normalizedB.about &&
    normalizedA.notificationsEnabled === normalizedB.notificationsEnabled &&
    normalizedA.emailNotificationsEnabled === normalizedB.emailNotificationsEnabled &&
    normalizedA.twoFactorEnabled === normalizedB.twoFactorEnabled
  );
};


interface UserDetailsTabProps {
  form: GeneralForm;
  editMode: boolean;
  onChange: (updater: (prev: GeneralForm) => GeneralForm) => void;
}

const UserDetailsTab: React.FC<UserDetailsTabProps> = ({ form, editMode, onChange }) => {
  const { t } = useLanguage();

  const handleFieldChange = (field: keyof GeneralForm, value: string | boolean) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t('users.details.personal_information')}
          subtitle={t('users.details.personal_information_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('users.fields.first_name')}
            value={form.firstName}
            onChange={(event) => handleFieldChange('firstName', event.target.value)}
            disabled={!editMode}
          />
          <Input
            label={t('users.fields.last_name')}
            value={form.lastName}
            onChange={(event) => handleFieldChange('lastName', event.target.value)}
            disabled={!editMode}
          />
          <Input
            label={t('users.fields.email')}
            value={form.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            disabled={!editMode}
            type="email"
          />
          <Input
            label={t('users.fields.phone')}
            value={form.phone}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
            disabled={!editMode}
          />
          <Input
            label={t('users.fields.department')}
            value={form.department}
            onChange={(event) => handleFieldChange('department', event.target.value)}
            disabled={!editMode}
          />
          <Input
            label={t('users.fields.location')}
            value={form.location}
            onChange={(event) => handleFieldChange('location', event.target.value)}
            disabled={!editMode}
          />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-foreground mb-2 block">
            {t('users.fields.about')}
          </label>
          <textarea
            value={form.about}
            onChange={(event) => handleFieldChange('about', event.target.value)}
            rows={editMode ? 4 : 3}
            className="w-full px-3 py-2 text-sm bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:bg-muted resize-none"
            placeholder={t('users.placeholders.about')}
            disabled={!editMode}
          />
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={t('users.details.preferences')}
          subtitle={t('users.details.preferences_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              key: 'notificationsEnabled' as const,
              label: t('users.fields.notifications'),
            },
            {
              key: 'emailNotificationsEnabled' as const,
              label: t('users.fields.email_notifications'),
            },
            {
              key: 'twoFactorEnabled' as const,
              label: t('users.fields.two_factor'),
            },
          ].map(({ key, label }) => (
            <div
              key={key}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                form[key] ? 'border-primary/40 bg-primary/5' : 'border-border'
              }`}
            >
              <span className="text-sm font-medium text-foreground">{label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form[key]}
                  onChange={(event) => handleFieldChange(key, event.target.checked)}
                  disabled={!editMode}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:bg-primary transition-colors peer-disabled:opacity-60" />
                <div className="absolute left-0 top-0 ml-0.5 mt-0.5 h-5 w-5 bg-white rounded-full border border-border shadow-sm transition-transform duration-200 peer-checked:translate-x-full peer-checked:border-transparent" />
              </label>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

interface UserRolesTabProps {
  user: UserSummary;
  roles: RoleRecord[];
  currentTenantId: string | null;
  selectedRoleId: string | null;
  roleEditMode: boolean;
  canEditRole: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRoleChange: (roleId: string | null) => void;
  onSave: () => void;
  hasChanges: boolean;
}

const UserRolesTab: React.FC<UserRolesTabProps> = ({
  user,
  roles,
  currentTenantId,
  selectedRoleId,
  roleEditMode,
  canEditRole,
  onStartEdit,
  onCancelEdit,
  onRoleChange,
  onSave,
  hasChanges,
}) => {
  const { t } = useLanguage();
  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role.id,
        label: role.name?.trim() || role.nameLocalizationId || role.id,
      })),
    [roles],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('users.roles.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('users.roles.subtitle')}</p>
        </div>
        {canEditRole && (
          <div className="flex items-center gap-2">
            {roleEditMode ? (
              <>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!hasChanges}
                  className="px-3 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-60"
                >
                  {t('common.save')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartEdit}
                className="px-3 py-2 text-sm bg-primary text-white rounded-lg"
              >
                {t('users.roles.edit_role')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden border border-border rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('users.roles.columns.tenant')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('users.roles.columns.role')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('users.roles.columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {user.tenants.map((tenant) => {
              const isCurrentTenant = tenant.tenantId === currentTenantId;
              const currentRoleId = isCurrentTenant ? selectedRoleId : tenant.roleId;
              const currentRoleName = isCurrentTenant
                ? roleOptions.find((option) => option.value === selectedRoleId)?.label ?? t('users.roles.unassigned')
                : tenant.roleName || tenant.roleId || t('users.roles.unassigned');

              return (
                <tr key={`${tenant.tenantId}-${tenant.roleId ?? 'none'}`}>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {tenant.tenantId}
                    {isCurrentTenant && (
                      <Badge variant="outline" size="sm" className="ml-2">
                        {t('users.roles.current_tenant')}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {isCurrentTenant && roleEditMode ? (
                      <Select
                        value={currentRoleId ?? ''}
                        onChange={(event) => onRoleChange(event.target.value || null)}
                        options={[{ value: '', label: t('users.roles.unassigned') }, ...roleOptions]}
                      />
                    ) : (
                      <span>{currentRoleName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {isCurrentTenant ? (
                      canEditRole ? (
                        roleEditMode ? t('users.roles.editing') : t('users.roles.click_edit')
                      ) : (
                        t('users.roles.read_only')
                      )
                    ) : (
                      t('users.roles.other_tenant_read_only')
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const NotificationsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <NotificationSettings entityType="user" entityId={entityId} editMode={editMode} />
);

const StatisticsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Statistics entityType="user" entityId={entityId} editMode={editMode} />
);

const ApiTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <APITester entityType="user" entityId={entityId} editMode={editMode} />
);

const DocumentationTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Documentation entityType="user" entityId={entityId} editMode={editMode} />
);

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="User" entityId={entityId} />
);

export function UsersDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { session, hasPermission } = useAuth();

  const canReadUser = hasPermission(PERMISSIONS.SYSTEM.USERS.VIEW);
  const canUpdateGeneral = hasPermission(PERMISSIONS.SYSTEM.USERS.UPDATE);
  const canUpdateRole = hasPermission(PERMISSIONS.SYSTEM.USERS.ROLE_ASSIGN);
  const canViewRoles = hasPermission(PERMISSIONS.SYSTEM.USERS.ROLE_VIEW);
  const canListRoles = hasPermission(PERMISSIONS.SYSTEM.ROLES.LIST);
  const canViewUserHistory = hasPermission(PERMISSIONS.SYSTEM.USERS.HISTORY);
  const currentTenantId = session?.tenantId ?? null;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [generalForm, setGeneralForm] = useState<GeneralForm | null>(null);
  const [isGeneralEditing, setIsGeneralEditing] = useState(false);
  const [generalHasChanges, setGeneralHasChanges] = useState(false);
  const generalBaselineRef = useRef<GeneralForm | null>(null);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isRoleEditing, setIsRoleEditing] = useState(false);
  const [roleHasChanges, setRoleHasChanges] = useState(false);
  const roleBaselineRef = useRef<string | null>(null);

  const [pendingChanges, setPendingChanges] = useState<ChangeItem[]>([]);
  const [pendingAction, setPendingAction] = useState<'general' | 'role' | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateGeneralForm = useCallback(
    (updater: (prev: GeneralForm) => GeneralForm) => {
      setGeneralForm((prev) => {
        if (!prev) {
          return prev;
        }
        const next = updater(prev);
        if (generalBaselineRef.current) {
          setGeneralHasChanges(!generalFormsEqual(next, generalBaselineRef.current));
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
      setIsGeneralEditing(false);
      setIsRoleEditing(false);

      const [userResponse, rolesResponse] = await Promise.all([
        usersService.getById(id, { language }),
        canListRoles
          ? rolesService.list({ language })
          : Promise.resolve<{ items: RoleRecord[] }>({ items: [] }),
      ]);

      const general: GeneralForm = {
        firstName: userResponse.firstName ?? '',
        lastName: userResponse.lastName ?? '',
        email: userResponse.email ?? '',
        phone: userResponse.phone ?? '',
        department: userResponse.department ?? '',
        location: userResponse.location ?? '',
        about: userResponse.about ?? '',
        notificationsEnabled: userResponse.notificationsEnabled,
        emailNotificationsEnabled: userResponse.emailNotificationsEnabled,
        twoFactorEnabled: userResponse.twoFactorEnabled,
      };

      generalBaselineRef.current = cloneGeneralForm(general);
      setGeneralForm(cloneGeneralForm(general));
      setGeneralHasChanges(false);

      const activeTenant = userResponse.tenants.find((tenant) => tenant.tenantId === currentTenantId);
      const baselineRole = activeTenant?.roleId ?? null;
      roleBaselineRef.current = baselineRole;
      setSelectedRoleId(baselineRole);
      setRoleHasChanges(false);

      setUser(userResponse);
      setRoles(rolesResponse.items);
    } catch (error: any) {
      console.error('Failed to load user details', error);
      showToast({
        type: 'error',
        message: error?.message || t('users.messages.load_failed'),
      });
      navigate('/users');
    } finally {
      setLoading(false);
    }
  }, [canListRoles, currentTenantId, id, language, navigate, showToast, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleEnterGeneralEdit = () => {
    if (!canUpdateGeneral) {
      return;
    }
    setIsGeneralEditing(true);
  };

  const handleCancelGeneralEdit = () => {
    if (!generalBaselineRef.current) {
      return;
    }
    setGeneralForm(cloneGeneralForm(generalBaselineRef.current));
    setGeneralHasChanges(false);
    setIsGeneralEditing(false);
  };

  const handleGeneralSave = () => {
    if (!generalForm || !generalBaselineRef.current) {
      return;
    }
    const normalizedCurrent = normalizeGeneralForm(generalForm);
    const normalizedBaseline = normalizeGeneralForm(generalBaselineRef.current);

    const changes: ChangeItem[] = [];
    (Object.keys(normalizedCurrent) as (keyof GeneralForm)[]).forEach((key) => {
      if (typeof normalizedCurrent[key] === 'boolean') {
        if (normalizedCurrent[key] !== normalizedBaseline[key]) {
          changes.push({
            field: t(`users.fields.${String(key)}`),
            oldValue: normalizedBaseline[key] as boolean,
            newValue: normalizedCurrent[key] as boolean,
          });
        }
      } else if ((normalizedCurrent[key] as string) !== (normalizedBaseline[key] as string)) {
        changes.push({
          field: t(`users.fields.${String(key)}`),
          oldValue: (normalizedBaseline[key] as string) || '—',
          newValue: (normalizedCurrent[key] as string) || '—',
        });
      }
    });

    if (changes.length === 0) {
      showToast({ type: 'info', message: t('users.messages.no_changes') });
      return;
    }

    setPendingChanges(changes);
    setPendingAction('general');
    setCommentDialogOpen(true);
  };

  const handleRoleEditToggle = () => {
    if (!canUpdateRole) {
      return;
    }
    setIsRoleEditing(true);
  };

  const handleRoleCancel = () => {
    if (!roleBaselineRef.current) {
      return;
    }
    setSelectedRoleId(roleBaselineRef.current);
    setRoleHasChanges(false);
    setIsRoleEditing(false);
  };

  const handleRoleChange = (roleId: string | null) => {
    const normalized = roleId && roleId.length > 0 ? roleId : null;
    setSelectedRoleId(normalized);
    if (roleBaselineRef.current !== undefined) {
      setRoleHasChanges(normalized !== roleBaselineRef.current);
    }
  };

  const handleRoleSave = () => {
    if (!roleBaselineRef.current) {
      return;
    }
    if (selectedRoleId === roleBaselineRef.current) {
      showToast({ type: 'info', message: t('users.messages.no_changes') });
      return;
    }
    const baselineRoleName = roles.find((role) => role.id === roleBaselineRef.current)?.name ?? roleBaselineRef.current ?? t('users.roles.unassigned');
    const newRoleName = roles.find((role) => role.id === selectedRoleId)?.name ?? selectedRoleId ?? t('users.roles.unassigned');

    const changes: ChangeItem[] = [
      {
        field: t('users.roles.field'),
        oldValue: baselineRoleName?.trim() || t('users.roles.unassigned'),
        newValue: newRoleName?.trim() || t('users.roles.unassigned'),
      },
    ];

    setPendingChanges(changes);
    setPendingAction('role');
    setCommentDialogOpen(true);
  };

  const handleConfirmSave = async (comment: string) => {
    if (!id || !pendingAction) {
      return;
    }

    try {
      setSaving(true);
      if (pendingAction === 'general') {
        if (!generalForm) {
          return;
        }
        const payload = {
          ...normalizeGeneralForm(generalForm),
          comment,
        };
        await usersService.update(id, payload, { language });
        showToast({ type: 'success', message: t('users.messages.updated') });
      } else if (pendingAction === 'role') {
        const payload = { roleId: selectedRoleId, comment };
        await usersService.updateRole(id, payload, { language });
        showToast({ type: 'success', message: t('users.messages.role_updated') });
      }

      setCommentDialogOpen(false);
      setPendingChanges([]);
      setPendingAction(null);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update user', error);
      showToast({
        type: 'error',
        message: error?.message || t('users.messages.update_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
    if (!saving) {
      setPendingChanges([]);
      setPendingAction(null);
    }
  };

  const tabs = useMemo<TabConfig[]>(() => {
    if (!generalForm || !user) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('users.tabs.details'),
        icon: FileText,
        component: UserDetailsTab,
        props: {
          form: generalForm,
          editMode: isGeneralEditing,
          onChange: updateGeneralForm,
        },
        hidden: !canViewRoles,
      },
      {
        id: 'roles',
        label: t('users.tabs.role'),
        icon: Shield,
        component: UserRolesTab,
        props: {
          user,
          roles,
          currentTenantId,
          selectedRoleId,
          roleEditMode: isRoleEditing,
          canEditRole: canUpdateRole,
          onStartEdit: handleRoleEditToggle,
          onCancelEdit: handleRoleCancel,
          onRoleChange: handleRoleChange,
          onSave: handleRoleSave,
          hasChanges: roleHasChanges,
        },
        hidden: !canReadUser,
      },
      {
        id: 'notifications',
        label: t('details.tabs.notifications'),
        icon: Bell,
        component: NotificationsTab,
        props: {
          entityId: user.id,
          editMode: isGeneralEditing,
        },
        hidden: !canReadUser,
      },
      {
        id: 'statistics',
        label: t('details.tabs.statistics'),
        icon: BarChart3,
        component: StatisticsTab,
        props: {
          entityId: user.id,
          editMode: isGeneralEditing,
        },
        hidden: !canReadUser,
      },
      {
        id: 'api',
        label: t('details.tabs.api'),
        icon: Code,
        component: ApiTab,
        props: {
          entityId: user.id,
          editMode: isGeneralEditing,
        },
        hidden: !canReadUser,
      },
      {
        id: 'documentation',
        label: t('details.tabs.documentation'),
        icon: BookOpen,
        component: DocumentationTab,
        props: {
          entityId: user.id,
          editMode: isGeneralEditing,
        },
        hidden: !canReadUser,
      },
      {
        id: 'history',
        label: t('details.tabs.history'),
        icon: HistoryIcon,
        component: HistoryTab,
        props: {
          entityId: user.id,
        },
        hidden: !canViewUserHistory,
      },
    ];
  }, [
    canReadUser,
    canViewUserHistory,
    canUpdateRole,
    currentTenantId,
    generalForm,
    handleRoleCancel,
    handleRoleChange,
    handleRoleEditToggle,
    handleRoleSave,
    isGeneralEditing,
    isRoleEditing,
    roleHasChanges,
    roles,
    selectedRoleId,
    t,
    updateGeneralForm,
    user,
  ]);

  if (loading || !user || !generalForm) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fullName = [generalForm.firstName, generalForm.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <>
      <DetailsLayout
        title={fullName || user.email}
        subtitle={user.email}
        icon={<UserIcon className="h-6 w-6 text-white" />}
        backUrl="/users"
        tabs={tabs}
        editMode={isGeneralEditing}
        hasChanges={generalHasChanges}
        onEdit={canUpdateGeneral ? handleEnterGeneralEdit : undefined}
        onSave={canUpdateGeneral ? handleGeneralSave : undefined}
        onCancel={handleCancelGeneralEdit}
        inlineActions={false}
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={fullName || user.email}
      />
    </>
  );
}
