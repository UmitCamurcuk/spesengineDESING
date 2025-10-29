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
  Camera,
  Upload,
  Trash2,
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
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { UserNotificationsTab } from '../../components/notifications/UserNotificationsTab';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { HistoryTable } from '../../components/common/HistoryTable';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { PERMISSIONS } from '../../config/permissions';
import { apiClient } from '../../api/client/axios';

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
  user: UserSummary;
  onPhotoUpdate: () => void;
}

const UserDetailsTab: React.FC<UserDetailsTabProps> = ({ form, editMode, onChange, user, onPhotoUpdate }) => {
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user.profilePhotoUrl 
    ? user.profilePhotoUrl.startsWith('/uploads') 
      ? user.profilePhotoUrl 
      : `/uploads${user.profilePhotoUrl}`
    : null;

  const handleFieldChange = (field: keyof GeneralForm, value: string | boolean) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError(t('profile.file_too_large'));
        return;
      }
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiClient.post(`/users/${user.id}/profile-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showSuccess(t('users.photo_upload_success'));
      setShowPhotoModal(false);
      setSelectedFile(null);
      setPhotoPreview(null);
      onPhotoUpdate();
    } catch (error: any) {
      showError(error?.message || t('users.photo_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPhotoUpload = () => {
    setShowPhotoModal(false);
    setSelectedFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo Section */}
      <Card padding="lg" className="bg-card">
        <div className="flex items-center space-x-6">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${form.firstName} ${form.lastName}`}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-primary/20">
                <UserIcon className="h-12 w-12 text-white" />
              </div>
            )}
            {editMode && (
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">
              {form.firstName} {form.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{form.email}</p>
            {editMode && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowPhotoModal(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                {t('users.change_photo')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Photo Upload Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={handleCancelPhotoUpload}
        title={t('users.upload_photo')}
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-48 h-48 rounded-full object-cover ring-4 ring-primary/20"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center">
                <Camera className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('users.select_file')}
            </Button>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancelPhotoUpload} disabled={uploading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handlePhotoUpload}
              disabled={!selectedFile || uploading}
              loading={uploading}
            >
              {t('common.upload')}
            </Button>
          </div>
        </div>
      </Modal>

      <Card padding="lg" className="bg-card">
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

      <Card padding="lg" className="bg-card">
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
  const { t, resolveLocalization } = useLanguage();
  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role.id,
        label:
          role.name?.trim() ||
          resolveLocalization(role.nameLocalizationId) ||
          role.nameLocalizationId ||
          role.id,
      })),
    [resolveLocalization, roles],
  );

  return (
    <div className="space-y-4">
      <Card padding="lg" className="bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('users.roles.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('users.roles.subtitle')}</p>
          </div>
        </div>

        <div className="overflow-hidden border border-border rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('users.roles.columns.tenant')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('users.roles.columns.role')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('users.roles.columns.status')}
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
                  <tr key={`${tenant.tenantId}-${tenant.roleId ?? 'none'}`} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.tenantId}</span>
                        {isCurrentTenant && (
                          <Badge variant="primary" size="sm">
                            {t('users.roles.current_tenant')}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {isCurrentTenant && roleEditMode ? (
                        <Select
                          value={currentRoleId ?? ''}
                          onChange={(event) => onRoleChange(event.target.value || null)}
                          options={[{ value: '', label: t('users.roles.unassigned') }, ...roleOptions]}
                          className="max-w-xs"
                        />
                      ) : (
                        <span className="font-medium">{currentRoleName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {isCurrentTenant ? (
                        canEditRole ? (
                          roleEditMode ? (
                            <Badge variant="warning" size="sm">{t('users.roles.editing')}</Badge>
                          ) : (
                            <Badge variant="default" size="sm">{t('users.roles.click_edit')}</Badge>
                          )
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
      </Card>
    </div>
  );
};

const NotificationsTab: React.FC<{ 
  entityId: string; 
  editMode: boolean;
  userEmail: string;
  roleId: string | null;
  roleName: string | null;
}> = ({ entityId, userEmail, roleId, roleName }) => (
  <UserNotificationsTab 
    userId={entityId} 
    userEmail={userEmail}
    roleId={roleId}
    roleName={roleName}
  />
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
  const [pendingAction, setPendingAction] = useState<'general' | 'role' | 'both' | null>(null);
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
    const changes: ChangeItem[] = [];
    
    // Check general form changes
    if (generalForm && generalBaselineRef.current) {
      const normalizedCurrent = normalizeGeneralForm(generalForm);
      const normalizedBaseline = normalizeGeneralForm(generalBaselineRef.current);

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
    }
    
    // Check role changes
    if (roleHasChanges && selectedRoleId !== roleBaselineRef.current) {
      const baselineRoleName = roles.find((role) => role.id === roleBaselineRef.current)?.name ?? roleBaselineRef.current ?? t('users.roles.unassigned');
      const newRoleName = roles.find((role) => role.id === selectedRoleId)?.name ?? selectedRoleId ?? t('users.roles.unassigned');
      changes.push({
        field: t('users.roles.field'),
        oldValue: baselineRoleName?.trim() || t('users.roles.unassigned'),
        newValue: newRoleName?.trim() || t('users.roles.unassigned'),
      });
    }

    if (changes.length === 0) {
      showToast({ type: 'info', message: t('users.messages.no_changes') });
      return;
    }

    const hasGeneralChanges = generalHasChanges;
    const hasRoleChanges = roleHasChanges;
    
    setPendingChanges(changes);
    setPendingAction(hasGeneralChanges && hasRoleChanges ? 'both' : hasGeneralChanges ? 'general' : 'role');
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
      
      if (pendingAction === 'general' || pendingAction === 'both') {
        if (generalForm) {
          const payload = {
            ...normalizeGeneralForm(generalForm),
            comment,
          };
          await usersService.update(id, payload, { language });
        }
      }
      
      if (pendingAction === 'role' || pendingAction === 'both') {
        const payload = { roleId: selectedRoleId, comment };
        await usersService.updateRole(id, payload, { language });
      }

      showToast({ type: 'success', message: t('users.messages.updated') });
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
          user: user,
          onPhotoUpdate: loadData,
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
          roleEditMode: isGeneralEditing, // Use general edit mode for inline editing
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
          userEmail: user.email,
          roleId: user.tenant?.roleId || null,
          roleName: user.tenant?.roleName || null,
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
        hasChanges={generalHasChanges || roleHasChanges}
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
