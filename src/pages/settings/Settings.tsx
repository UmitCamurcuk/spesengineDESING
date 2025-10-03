import React, { useState } from 'react';
import { Save, Settings as SettingsIcon, Globe, Shield, Bell, Palette, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
];

const themeModeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const darkVariantOptions = [
  { value: 'slate', label: 'Slate (Default)' },
  { value: 'navy', label: 'Navy (Deep Blue)' },
  { value: 'true-black', label: 'True Black (OLED)' },
];

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const { showToast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  const { mode, darkVariant, setMode, setDarkVariant, effectiveTheme } = useTheme();

  const [settings, setSettings] = useState({
    // General
    companyName: 'SpesEngine',
    language: language,
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',

    // Appearance
    theme: 'light',
    compactMode: false,

    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,

    // Security
    sessionTimeout: '30',
    twoFactorAuth: false,
    passwordExpiry: '90',
  });

  const [originalSettings] = useState(settings);

  const handleSave = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleShowChangeDialog = () => {
    setChangeDialogOpen(true);
  };

  const handleSaveWithComment = (comment: string) => {
    showToast('Settings saved successfully with comment: ' + comment, 'success');
    setChangeDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    showToast('Item deleted successfully', 'success');
    setDeleteDialogOpen(false);
  };

  const getChanges = () => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (settings.companyName !== originalSettings.companyName) {
      changes.push({
        field: 'Company Name',
        oldValue: originalSettings.companyName,
        newValue: settings.companyName
      });
    }

    if (settings.language !== originalSettings.language) {
      changes.push({
        field: 'Language',
        oldValue: languageOptions.find(o => o.value === originalSettings.language)?.label,
        newValue: languageOptions.find(o => o.value === settings.language)?.label
      });
    }

    if (settings.theme !== originalSettings.theme) {
      changes.push({
        field: 'Theme',
        oldValue: themeOptions.find(o => o.value === originalSettings.theme)?.label,
        newValue: themeOptions.find(o => o.value === settings.theme)?.label
      });
    }

    return changes;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader 
            title="General Settings" 
            subtitle="Basic system configuration"
          />
          <div className="space-y-4">
            <Input
              label="Company Name"
              value={settings.companyName}
              onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Enter company name"
            />
            
            <Select
              label={t('settings.language')}
              value={settings.language}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, language: e.target.value }));
                setLanguage(e.target.value as 'tr' | 'en');
              }}
              options={languageOptions}
              leftIcon={<Globe className="h-4 w-4" />}
            />
            
            <Select
              label="Timezone"
              value={settings.timezone}
              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              options={timezoneOptions}
            />
            
            <Input
              label="Date Format"
              value={settings.dateFormat}
              onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
              placeholder="MM/DD/YYYY"
            />
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader 
            title={t('settings.appearance')} 
            subtitle="Customize the look and feel"
          />
          <div className="space-y-4">
            <Select
              label={t('settings.theme_settings')}
              value={mode}
              onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
              options={themeModeOptions}
              leftIcon={<Palette className="h-4 w-4" />}
            />
            
            {/* Dark Variant Selection (show only when dark mode is active) */}
            {effectiveTheme === 'dark' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Dark Theme Variant
                </label>
                <Select
                  value={darkVariant}
                  onChange={(e) => setDarkVariant(e.target.value as 'slate' | 'navy' | 'true-black')}
                  options={darkVariantOptions}
                />
                <p className="text-xs text-muted-foreground">
                  Choose the dark theme variant that best suits your preferences
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="compactMode"
                checked={settings.compactMode}
                onChange={(e) => setSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                className="rounded border-input text-primary focus:ring-ring"
              />
              <label htmlFor="compactMode" className="text-sm font-medium text-foreground">
                Enable compact mode
              </label>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader 
            title="Notifications" 
            subtitle="Manage notification preferences"
          />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="rounded border-input text-primary focus:ring-ring"
              />
              <label htmlFor="emailNotifications" className="text-sm font-medium text-foreground">
                Email notifications
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pushNotifications"
                checked={settings.pushNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                className="rounded border-input text-primary focus:ring-ring"
              />
              <label htmlFor="pushNotifications" className="text-sm font-medium text-foreground">
                Push notifications
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="weeklyReports"
                checked={settings.weeklyReports}
                onChange={(e) => setSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                className="rounded border-input text-primary focus:ring-ring"
              />
              <label htmlFor="weeklyReports" className="text-sm font-medium text-foreground">
                Weekly reports
              </label>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader 
            title="Security" 
            subtitle="Security and authentication settings"
          />
          <div className="space-y-4">
            <Input
              label="Session Timeout (minutes)"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
              placeholder="30"
              leftIcon={<Shield className="h-4 w-4" />}
            />
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onChange={(e) => setSettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                className="rounded border-input text-primary focus:ring-ring"
              />
              <label htmlFor="twoFactorAuth" className="text-sm font-medium text-foreground">
                Enable two-factor authentication
              </label>
            </div>
            
            <Input
              label="Password Expiry (days)"
              type="number"
              value={settings.passwordExpiry}
              onChange={(e) => setSettings(prev => ({ ...prev, passwordExpiry: e.target.value }))}
              placeholder="90"
            />
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={loading}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Save Settings
        </Button>
      </div>

      {/* UI Components Demo Section */}
      <Card>
        <CardHeader
          title="UI Components Demo"
          subtitle="Test all toast notifications and dialogs"
        />
        <div className="space-y-6">
          {/* Toast Notifications */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Toast Notifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CheckCircle className="h-4 w-4" />}
                onClick={() => showToast('Operation completed successfully!', 'success')}
              >
                Success Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<XCircle className="h-4 w-4" />}
                onClick={() => showToast('An error occurred. Please try again.', 'error')}
              >
                Error Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<AlertCircle className="h-4 w-4" />}
                onClick={() => showToast('This is a warning message.', 'warning')}
              >
                Warning Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Info className="h-4 w-4" />}
                onClick={() => showToast('Here is some useful information.', 'info')}
              >
                Info Toast
              </Button>
            </div>
          </div>

          {/* Dialogs */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Confirmation Dialogs</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Confirmation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowChangeDialog}
              >
                Change with Comment
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        type="danger"
        confirmText="Delete"
      />

      {/* Change Confirmation Dialog */}
      <ChangeConfirmDialog
        isOpen={changeDialogOpen}
        onClose={() => setChangeDialogOpen(false)}
        onConfirm={handleSaveWithComment}
        title="Save Changes"
        changes={getChanges()}
      />
    </div>
  );
};