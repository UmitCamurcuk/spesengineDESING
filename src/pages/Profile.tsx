import React, { useEffect, useMemo, useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X, 
  Camera,
  Bell,
  Lock,
  Globe,
  Eye,
  EyeOff,
  History as HistoryIcon
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FileInput } from '../components/ui/FileInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ApiError } from '../api/types/api.types';
import { HistoryTable } from '../components/common/HistoryTable';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  location: string;
  bio: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    user: authUser,
    session,
    updateProfile,
    updateProfilePhoto,
    deleteProfilePhoto,
    changePassword,
    isLoading,
  } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  const [historyVisible, setHistoryVisible] = useState(false);
  const [formData, setFormData] = useState<ProfileFormState>({
    firstName: authUser?.firstName || '',
    lastName: authUser?.lastName || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    department: authUser?.department || '',
    location: authUser?.location || '',
    bio: authUser?.about || '',
    notificationsEnabled: authUser?.notificationsEnabled ?? true,
    emailNotificationsEnabled: authUser?.emailNotificationsEnabled ?? true,
  });

  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2FA form
  const [twoFactorData, setTwoFactorData] = useState({
    code: '',
    backupCode: '',
  });

  const handleShowHistory = () => {
    if (!authUser?.id) {
      showErrorToast(t('profile.history_no_id'));
      return;
    }

    setHistoryVisible(true);
  };


  // Track changes
  useEffect(() => {
    if (!authUser) {
      setHasChanges(false);
      return;
    }

    const { firstName, lastName, email, phone, department, location, about, notificationsEnabled, emailNotificationsEnabled } = authUser;

    setHasChanges(
      formData.firstName !== (firstName || '') ||
      formData.lastName !== (lastName || '') ||
      formData.email !== (email || '') ||
      formData.phone !== (phone || '') ||
      formData.department !== (department || '') ||
      formData.location !== (location || '') ||
      formData.bio !== (about || '') ||
      formData.notificationsEnabled !== (notificationsEnabled ?? true) ||
      formData.emailNotificationsEnabled !== (emailNotificationsEnabled ?? true)
    );
  }, [authUser, formData]);

  useEffect(() => {
    if (authUser) {
      setFormData({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        department: authUser.department || '',
        location: authUser.location || '',
        bio: authUser.about || '',
        notificationsEnabled: authUser.notificationsEnabled ?? true,
        emailNotificationsEnabled: authUser.emailNotificationsEnabled ?? true,
      });
    }
  }, [authUser]);

  const handleEdit = () => {
    if (!authUser) return;
    setIsEditing(true);
    setFormData({
      firstName: authUser.firstName || '',
      lastName: authUser.lastName || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
      department: authUser.department || '',
      location: authUser.location || '',
      bio: authUser.about || '',
      notificationsEnabled: authUser.notificationsEnabled ?? true,
      emailNotificationsEnabled: authUser.emailNotificationsEnabled ?? true,
    });
  };

  const handleSave = async () => {
    if (!authUser || !hasChanges) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        department: formData.department.trim() || undefined,
        location: formData.location.trim() || undefined,
        about: formData.bio.trim() || undefined,
        notificationsEnabled: formData.notificationsEnabled,
        emailNotificationsEnabled: formData.emailNotificationsEnabled,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (authUser) {
      setFormData({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        department: authUser.department || '',
        location: authUser.location || '',
        bio: authUser.about || '',
        notificationsEnabled: authUser.notificationsEnabled ?? true,
        emailNotificationsEnabled: authUser.emailNotificationsEnabled ?? true,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleChange = (
    field: 'notificationsEnabled' | 'emailNotificationsEnabled',
    value: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      setAvatarError(null);
      setShowAvatarModal(true);
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    if (file) {
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarError(null);
    } else {
      setSelectedFile(null);
      setAvatarPreview(null);
    }
  };

  const handleFileRemove = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setSelectedFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setAvatarError(null);
      await updateProfilePhoto(selectedFile);
      setShowAvatarModal(false);
      handleFileRemove();
      showSuccessToast(t('profile.photo_upload_success'));
    } catch (error: any) {
      const message = error?.message || t('profile.avatar_upload_failed');
      setAvatarError(message);
      showErrorToast(message);
    }
  };

  const handleAvatarCancel = () => {
    setShowAvatarModal(false);
    setShowRemoveConfirm(false);
    handleFileRemove();
  };

  const handleAvatarDelete = async () => {
    try {
      setAvatarError(null);
      await deleteProfilePhoto();
      handleFileRemove();
      setShowAvatarModal(false);
      setShowRemoveConfirm(false);
      showSuccessToast(t('profile.photo_delete_success'));
    } catch (error: any) {
      const message = error?.message || t('profile.avatar_delete_failed');
      setAvatarError(message);
      showErrorToast(message);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Password change handlers
  const handlePasswordChange = () => {
    setPasswordErrors({});
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    setPasswordErrors({});

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorToast(t('profile.password_mismatch'));
      setPasswordErrors((prev) => ({ ...prev, newPassword: t('profile.password_mismatch'), confirmPassword: t('profile.password_mismatch') }));
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showErrorToast(t('profile.password_min_length'));
      setPasswordErrors((prev) => ({ ...prev, newPassword: t('profile.password_min_length') }));
      return;
    }

    try {
      setIsPasswordSubmitting(true);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmPassword,
      });

      showSuccessToast(t('profile.password_changed'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const apiError = error as ApiError;
      const message = apiError?.message || t('profile.password_change_failed');
      const fieldErrors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};

      (apiError?.fields || []).forEach((field) => {
        const key = field.path as keyof typeof fieldErrors;
        if (key === 'currentPassword' || key === 'newPassword' || key === 'confirmPassword') {
          fieldErrors[key] = field.message;
        }
      });

      if (Object.keys(fieldErrors).length > 0) {
        setPasswordErrors(fieldErrors);
      }

      showErrorToast(message);
      // Modal açık kalmalı; state'i değiştirmiyoruz
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
  };

  // 2FA handlers
  const handle2FAManage = () => {
    setShow2FAModal(true);
  };

  const handle2FASubmit = () => {
    if (twoFactorData.code.length !== 6) {
      alert('Doğrulama kodu 6 haneli olmalıdır!');
      return;
    }
    
    // Simulate 2FA setup
    console.log('2FA setup completed');
    setShow2FAModal(false);
    setTwoFactorData({
      code: '',
      backupCode: '',
    });
    alert('İki faktörlü doğrulama başarıyla ayarlandı!');
  };

  const handle2FACancel = () => {
    setShow2FAModal(false);
    setTwoFactorData({
      code: '',
      backupCode: '',
    });
  };

  const profileUser = authUser;

  const fullName = useMemo(() => {
    if (!profileUser) return '';
    const combined = `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim();
    return combined || profileUser.email;
  }, [profileUser]);

  const joinDate = useMemo(() => {
    if (!session?.iat) return '-';
    return new Date(session.iat * 1000).toLocaleDateString();
  }, [session?.iat]);

  const lastLogin = useMemo(() => {
    if (!session?.iat) return '-';
    return new Date(session.iat * 1000).toLocaleString();
  }, [session?.iat]);

  const twoFactorActive = profileUser?.twoFactorEnabled ?? false;
  const primaryTenant = profileUser?.tenants?.[0];
  const tenantId = primaryTenant?.tenantId ?? '-';
  const tenantRoles = primaryTenant?.roles?.length
    ? primaryTenant.roles.join(', ')
    : '-';

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-[240px] text-muted-foreground">
        {isLoading ? t('common.loading') : t('profile.no_data_available')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
          {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} size="sm" disabled={isLoading}>
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button onClick={handleSave} size="sm" loading={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel} size="sm" disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              {t('common.cancel')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader 
              title={t('profile.basic_info')} 
              subtitle={t('profile.basic_info_subtitle')}
            />
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('profile.first_name')}
                  value={isEditing ? formData.firstName : (profileUser.firstName || '')}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<User className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.last_name')}
                  value={isEditing ? formData.lastName : (profileUser.lastName || '')}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<User className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.email')}
                  type="email"
                  value={isEditing ? formData.email : (profileUser.email || '')}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<Mail className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.phone')}
                  value={isEditing ? formData.phone : (profileUser.phone || '')}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<Phone className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.department')}
                  value={isEditing ? formData.department : (profileUser.department || '')}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<Shield className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.location')}
                  value={isEditing ? formData.location : (profileUser.location || '')}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t('profile.bio')}
                </label>
                <textarea
                  value={isEditing ? formData.bio : (profileUser.about || '')}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-background text-foreground border border-input rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring disabled:bg-muted disabled:text-muted-foreground"
                  placeholder={t('profile.bio_placeholder')}
                />
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader 
              title={t('profile.security_settings')} 
              subtitle={t('profile.security_settings_subtitle')}
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{t('profile.change_password')}</h4>
                    <p className="text-xs text-muted-foreground">{t('profile.last_updated')}: 2 ay önce</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handlePasswordChange}>
                  {t('profile.change')}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Shield className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{t('profile.two_factor_auth')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorActive ? t('profile.active') : t('profile.inactive')}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handle2FAManage}>
                {twoFactorActive ? t('profile.manage') : t('profile.enable')}
              </Button>
            </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <div className="text-center p-6">
              <div className="relative inline-block">
                <div 
                  className={`w-20 h-20 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isEditing ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                  }`}
                  onClick={handleAvatarClick}
                >
                  {profileUser.profilePhotoUrl ? (
                    <img 
                      src={profileUser.profilePhotoUrl}
                      alt={fullName}
                      className="w-20 h-20 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                {isEditing && (
                  <button 
                    className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full hover:bg-primary-hover transition-colors"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{fullName}</h3>
              <p className="text-sm text-muted-foreground">{profileUser.role || t('profile.role_unknown')}</p>
              <Badge variant="success" size="sm" className="mt-2">
                {t('profile.active')}
              </Badge>
            </div>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader title={t('profile.account_info')} />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.membership_date')}</span>
                <span className="text-foreground">{joinDate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.last_login')}</span>
                <span className="text-foreground">{lastLogin}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.role')}</span>
                <Badge variant="default" size="sm">{profileUser.role || '-'}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.tenant')}</span>
                <span className="text-foreground uppercase">{tenantId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.tenant_roles')}</span>
                <span className="text-foreground text-right max-w-[160px] truncate" title={tenantRoles}>
                  {tenantRoles}
                </span>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader title={t('profile.preferences')} />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('profile.language')}</span>
                </div>
                <span className="text-sm text-foreground uppercase">{language}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('profile.notifications')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.notificationsEnabled}
                    disabled={!isEditing}
                    onChange={(e) => handleToggleChange('notificationsEnabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('profile.email_notifications')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.emailNotificationsEnabled}
                    disabled={!isEditing}
                    onChange={(e) => handleToggleChange('emailNotificationsEnabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
      </Card>
    </div>
  </div>

      <Card padding="lg">
        <CardHeader
          title={t('profile.history_title')}
          subtitle={t('profile.history_description')}
        >
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <HistoryIcon className="h-3.5 w-3.5" />
            <span>{t('profile.history_hint')}</span>
          </div>
        </CardHeader>

        {!historyVisible ? (
          <Button
            type="button"
            onClick={handleShowHistory}
            disabled={!authUser?.id}
          >
            {t('profile.history_show')}
          </Button>
        ) : (
          <HistoryTable
            entityType="User"
            entityId={authUser?.id}
            title={t('profile.history_table_title')}
            description={t('profile.history_table_description')}
            currentUserId={authUser?.id}
            currentUserName={fullName}
            currentUserEmail={authUser?.email}
          />
        )}
      </Card>

      {/* Avatar Upload Modal */}
      <Modal
        isOpen={showAvatarModal}
        onClose={handleAvatarCancel}
        title={t('profile.upload_avatar')}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center mx-auto mb-4">
              {avatarPreview || profileUser.profilePhotoUrl ? (
                <img 
                  src={avatarPreview || profileUser.profilePhotoUrl || ''}
                  alt={fullName}
                  className="w-24 h-24 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedFile
                ? t('profile.photo_preview')
                : profileUser.profilePhotoUrl
                  ? t('profile.photo_current')
                  : t('profile.photo_placeholder')}
            </p>
          </div>

          <FileInput
            key={selectedFile ? 'has-file' : 'no-file'}
            label={t('profile.select_photo')}
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            maxSize={5 * 1024 * 1024} // 5MB
            value={selectedFile}
            onChange={handleFileSelect}
            variant="drag"
            helperText={t('profile.photo_formats')}
          />

          {avatarError && (
            <p className="text-sm text-error">{avatarError}</p>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            {profileUser.profilePhotoUrl && (
              <Button
                variant="outline"
                onClick={() => setShowRemoveConfirm(true)}
                disabled={isLoading}
              >
                {t('profile.remove_photo')}
              </Button>
            )}
            <Button variant="outline" onClick={handleAvatarCancel} disabled={isLoading}>
              {t('profile.cancel')}
            </Button>
            <Button 
              onClick={handleAvatarUpload}
              disabled={!selectedFile}
              loading={isLoading}
            >
              {t('profile.upload')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleAvatarDelete}
        title={t('profile.remove_photo_title')}
        description={t('profile.remove_photo_description')}
        confirmText={t('profile.remove_photo_confirm')}
        cancelText={t('common.cancel')}
        type="danger"
        loading={isLoading}
      />

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={handlePasswordCancel}
        title={t('profile.change_password_title')}
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-4">
            <Input
              label={t('profile.current_password')}
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => {
                const value = e.target.value;
                setPasswordData(prev => ({
                  ...prev,
                  currentPassword: value,
                }));
                if (passwordErrors.currentPassword) {
                  setPasswordErrors(prev => ({ ...prev, currentPassword: undefined }));
                }
              }}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder={t('profile.current_password')}
              error={passwordErrors.currentPassword}
            />
            
            <Input
              label={t('profile.new_password')}
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => {
                const value = e.target.value;
                setPasswordData(prev => ({
                  ...prev,
                  newPassword: value,
                }));
                if (passwordErrors.newPassword) {
                  setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
                }
              }}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder={t('profile.new_password')}
              helperText={t('profile.password_help')}
              error={passwordErrors.newPassword}
            />
            
            <Input
              label={t('profile.confirm_password')}
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => {
                const value = e.target.value;
                setPasswordData(prev => ({
                  ...prev,
                  confirmPassword: value,
                }));
                if (passwordErrors.confirmPassword) {
                  setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder={t('profile.confirm_password')}
              error={passwordErrors.confirmPassword}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handlePasswordCancel}>
              {t('profile.cancel')}
            </Button>
            <Button 
              onClick={handlePasswordSubmit}
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || isPasswordSubmitting}
              loading={isPasswordSubmitting}
            >
              {t('profile.change_password')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={handle2FACancel}
        title={t('profile.two_factor_setup')}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Shield className="h-12 w-12 text-primary mx-auto mb-2" />
            <h3 className="text-sm font-medium text-foreground mb-1">{t('profile.authenticator_app')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('profile.authenticator_description')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-center p-4 border-2 border-dashed border-border rounded-lg">
              <div className="w-32 h-32 bg-muted mx-auto mb-2 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">{t('profile.qr_code')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('profile.qr_description')}
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                JBSWY3DPEHPK3PXP
              </code>
            </div>

            <Input
              label={t('profile.verification_code')}
              value={twoFactorData.code}
              onChange={(e) => setTwoFactorData(prev => ({
                ...prev,
                code: e.target.value
              }))}
              placeholder={t('profile.verification_code_placeholder')}
              maxLength={6}
              helperText={t('profile.verification_code_help')}
            />

            <Input
              label={t('profile.backup_code')}
              value={twoFactorData.backupCode}
              onChange={(e) => setTwoFactorData(prev => ({
                ...prev,
                backupCode: e.target.value
              }))}
              placeholder={t('profile.backup_code_placeholder')}
              helperText={t('profile.backup_code_help')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handle2FACancel}>
              {t('profile.cancel')}
            </Button>
            <Button 
              onClick={handle2FASubmit}
              disabled={!twoFactorData.code}
            >
              {t('profile.enable_verification')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
