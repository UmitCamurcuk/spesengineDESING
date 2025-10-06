import React, { useState } from 'react';
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
  EyeOff
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FileInput } from '../components/ui/FileInput';
import { useLanguage } from '../contexts/LanguageContext';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  location?: string;
  joinDate: string;
  lastLogin: string;
  avatar?: string;
  bio?: string;
  preferences: {
    language: string;
    theme: string;
    notifications: boolean;
    emailNotifications: boolean;
  };
}

const mockUser: UserProfile = {
  id: '1',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@spesengine.com',
  phone: '+90 555 123 45 67',
  role: 'System Administrator',
  department: 'IT Department',
  location: 'Istanbul, Turkey',
  joinDate: '2024-01-15',
  lastLogin: '2024-12-19 14:30',
  avatar: '',
  bio: 'Sistem yöneticisi olarak SpesEngine platformunun tüm modüllerini yönetiyorum.',
  preferences: {
    language: 'tr',
    theme: 'light',
    notifications: true,
    emailNotifications: true,
  }
};

export const Profile: React.FC = () => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<UserProfile>(mockUser);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    department: user.department || '',
    location: user.location || '',
    bio: user.bio || '',
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


  // Track changes
  React.useEffect(() => {
    if (isEditing) {
      const hasFormChanges = 
        formData.firstName !== user.firstName ||
        formData.lastName !== user.lastName ||
        formData.email !== user.email ||
        formData.phone !== (user.phone || '') ||
        formData.department !== (user.department || '') ||
        formData.location !== (user.location || '') ||
        formData.bio !== (user.bio || '');

      setHasChanges(hasFormChanges);
    }
  }, [isEditing, formData, user]);

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      location: user.location || '',
      bio: user.bio || '',
    });
  };

  const handleSave = () => {
    setUser(prev => ({
      ...prev,
      ...formData,
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      location: user.location || '',
      bio: user.bio || '',
    });
  };

  const handleInputChange = (field: string, value: string) => {
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
      setShowAvatarModal(true);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleAvatarUpload = () => {
    if (selectedFile) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setUser(prev => ({
        ...prev,
        avatar: previewUrl
      }));
      setShowAvatarModal(false);
      setSelectedFile(null);
    }
  };

  const handleAvatarCancel = () => {
    setShowAvatarModal(false);
    setSelectedFile(null);
  };

  // Password change handlers
  const handlePasswordChange = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Yeni şifreler eşleşmiyor!');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Yeni şifre en az 8 karakter olmalıdır!');
      return;
    }
    
    // Simulate password change
    console.log('Password changed successfully');
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    alert('Şifreniz başarıyla değiştirildi!');
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
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

  return (
    <div className="space-y-6">
          {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel} size="sm">
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
                  value={isEditing ? formData.firstName : user.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<User className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.last_name')}
                  value={isEditing ? formData.lastName : user.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<User className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.email')}
                  type="email"
                  value={isEditing ? formData.email : user.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<Mail className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.phone')}
                  value={isEditing ? formData.phone : user.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<Phone className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.department')}
                  value={isEditing ? formData.department : user.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  disabled={!isEditing}
                  leftIcon={<Shield className="h-4 w-4" />}
                />
                <Input
                  label={t('profile.location')}
                  value={isEditing ? formData.location : user.location || ''}
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
                  value={isEditing ? formData.bio : user.bio || ''}
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
                    <p className="text-xs text-muted-foreground">{t('profile.active')}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handle2FAManage}>
                  {t('profile.manage')}
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
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover"
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
              <h3 className="text-lg font-semibold text-foreground">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-muted-foreground">{user.role}</p>
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
                <span className="text-foreground">{user.joinDate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.last_login')}</span>
                <span className="text-foreground">{user.lastLogin}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.role')}</span>
                <Badge variant="default" size="sm">{user.role}</Badge>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader title={t('profile.preferences')} />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('profile.notifications')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={user.preferences.notifications}
                    onChange={(e) => setUser(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        notifications: e.target.checked
                      }
                    }))}
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
                    checked={user.preferences.emailNotifications}
                    onChange={(e) => setUser(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        emailNotifications: e.target.checked
                      }
                    }))}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>

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
              {selectedFile ? (
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedFile ? t('profile.photo_preview') : t('profile.photo_placeholder')}
            </p>
          </div>

          <FileInput
            key={selectedFile ? 'has-file' : 'no-file'}
            label={t('profile.select_photo')}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            maxSize={5 * 1024 * 1024} // 5MB
            value={selectedFile}
            onChange={handleFileSelect}
            variant="drag"
            helperText={t('profile.photo_formats')}
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleAvatarCancel}>
              {t('profile.cancel')}
            </Button>
            <Button 
              onClick={handleAvatarUpload}
              disabled={!selectedFile}
            >
              {t('profile.upload')}
            </Button>
          </div>
        </div>
      </Modal>

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
              onChange={(e) => setPasswordData(prev => ({
                ...prev,
                currentPassword: e.target.value
              }))}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder={t('profile.current_password')}
            />
            
            <Input
              label={t('profile.new_password')}
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({
                ...prev,
                newPassword: e.target.value
              }))}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder={t('profile.new_password')}
              helperText={t('profile.password_help')}
            />
            
            <Input
              label={t('profile.confirm_password')}
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({
                ...prev,
                confirmPassword: e.target.value
              }))}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder={t('profile.confirm_password')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handlePasswordCancel}>
              {t('profile.cancel')}
            </Button>
            <Button 
              onClick={handlePasswordSubmit}
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
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
