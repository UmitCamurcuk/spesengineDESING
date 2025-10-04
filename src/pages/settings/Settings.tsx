import React, { useState } from 'react';
import { Save, Shield, AlertCircle, CheckCircle, Info, XCircle, Eye } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Checkbox } from '../../components/ui/Checkbox';
import { Radio } from '../../components/ui/Radio';
import { Textarea } from '../../components/ui/Textarea';
import { FileInput } from '../../components/ui/FileInput';
import { DatePicker } from '../../components/ui/DatePicker';
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
  const [uiDemoOpen, setUiDemoOpen] = useState(false);
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
        field: t('settings.company_name'),
        oldValue: originalSettings.companyName,
        newValue: settings.companyName
      });
    }

    if (settings.language !== originalSettings.language) {
      changes.push({
        field: t('settings.language'),
        oldValue: languageOptions.find(o => o.value === originalSettings.language)?.label,
        newValue: languageOptions.find(o => o.value === settings.language)?.label
      });
    }

    if (settings.theme !== originalSettings.theme) {
      changes.push({
        field: t('settings.theme_settings'),
        oldValue: themeModeOptions.find(o => o.value === originalSettings.theme)?.label,
        newValue: themeModeOptions.find(o => o.value === settings.theme)?.label
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
            title={t('settings.general_settings')} 
            subtitle={t('settings.basic_system_configuration')}
          />
          <div className="space-y-4">
            <Input
              label={t('settings.company_name')}
              value={settings.companyName}
              onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder={t('settings.enter_company_name')}
            />
            
            <Select
              label={t('settings.language')}
              value={settings.language}
              onChange={(e) => {
                const newLanguage = e.target.value as 'tr' | 'en';
                setSettings(prev => ({ ...prev, language: newLanguage }));
                setLanguage(newLanguage);
              }}
              options={languageOptions}
            />
            
            <Select
              label={t('settings.timezone')}
              value={settings.timezone}
              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              options={timezoneOptions}
            />
            
            <Input
              label={t('settings.date_format')}
              value={settings.dateFormat}
              onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
              placeholder="MM/DD/YYYY"
            />
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader 
            title={t('settings.appearance_settings')} 
            subtitle={t('settings.theme_settings')}
          />
          <div className="space-y-4">
            <Select
              label={t('settings.theme_settings')}
              value={mode}
              onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
              options={themeModeOptions}
            />
            
            {/* Dark Variant Selection (show only when dark mode is active) */}
            {effectiveTheme === 'dark' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('settings.dark_variant')}
                </label>
                <Select
                  value={darkVariant}
                  onChange={(e) => setDarkVariant(e.target.value as 'slate' | 'navy' | 'true-black')}
                  options={darkVariantOptions}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.dark_variant_description')}
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
                {t('settings.compact_mode')}
              </label>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader 
            title={t('settings.notifications')} 
            subtitle={t('settings.notification_settings')}
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
                {t('settings.email_notifications_label')}
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
                {t('settings.push_notifications_label')}
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
                {t('settings.weekly_reports_label')}
              </label>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader 
            title={t('settings.security')} 
            subtitle={t('settings.security_settings_title')}
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

          {/* UI Components Demo */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('settings.ui_components_demo')}</h3>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye className="h-4 w-4" />}
              onClick={() => setUiDemoOpen(true)}
            >
              {t('settings.view_ui_components')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('settings.delete_confirmation')}
        description={t('settings.delete_confirmation_description')}
        type="danger"
        confirmText={t('common.delete')}
      />

      {/* Change Confirmation Dialog */}
      <ChangeConfirmDialog
        open={changeDialogOpen}
        onClose={() => setChangeDialogOpen(false)}
        onConfirm={handleSaveWithComment}
        title={t('settings.save_changes')}
        changes={getChanges()}
      />

      {/* UI Components Demo Modal */}
      <Modal
        isOpen={uiDemoOpen}
        onClose={() => setUiDemoOpen(false)}
        title={t('settings.ui_components_demo')}
        size="xl"
      >
        <div className="space-y-6">
          {/* Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('settings.buttons')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="primary">{t('settings.primary')}</Button>
              <Button variant="secondary">{t('settings.secondary')}</Button>
              <Button variant="outline">{t('settings.outline')}</Button>
              <Button variant="ghost">{t('settings.ghost')}</Button>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">{t('settings.destructive')}</Button>
              <Button size="sm">{t('settings.small')}</Button>
              <Button size="lg">{t('settings.large')}</Button>
              <Button loading>{t('settings.loading')}</Button>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('settings.inputs')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t('settings.text_input')} placeholder="Enter text..." />
              <Input label={t('settings.email_input')} type="email" placeholder="Enter email..." />
              <Input label={t('settings.password_input')} type="password" placeholder="Enter password..." />
              <Input label={t('settings.number_input')} type="number" placeholder="Enter number..." />
              <Textarea label={t('settings.textarea')} placeholder="Enter long text..." />
              <FileInput label={t('settings.file_input')} accept="image/*" />
            </div>
          </div>

          {/* Form Controls */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('settings.form_controls')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Checkbox label={t('settings.checkbox_option_1')} />
                <Checkbox label={t('settings.checkbox_option_2')} defaultChecked />
                <Checkbox label={t('settings.disabled_checkbox')} disabled />
              </div>
              <div className="space-y-3">
                <Radio name="radio-group" label={t('settings.radio_option_1')} options={[]} />
                <Radio name="radio-group" label={t('settings.radio_option_2')} defaultChecked options={[]} />
                <Radio name="radio-group" label={t('settings.disabled_radio')} disabled options={[]} />
              </div>
            </div>
          </div>

          {/* Selects */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('settings.selects')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t('settings.single_select')}
                placeholder={t('settings.choose_option')}
                options={[
                  { value: 'option1', label: t('settings.option_1') },
                  { value: 'option2', label: t('settings.option_2') },
                  { value: 'option3', label: t('settings.option_3') },
                ]}
              />
              <DatePicker label={t('settings.date_picker')} />
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('settings.badges')}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{t('settings.default')}</Badge>
              <Badge variant="success">{t('settings.success')}</Badge>
              <Badge variant="error">{t('settings.error')}</Badge>
              <Badge variant="warning">{t('settings.warning')}</Badge>
              <Badge variant="default">{t('settings.info')}</Badge>
              <Badge size="sm">{t('settings.small')}</Badge>
              <Badge size="lg">{t('settings.large')}</Badge>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('settings.cards')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <h4 className="font-semibold">{t('settings.default_card')}</h4>
                  <p className="text-sm text-muted-foreground">{t('settings.this_is_default_card')}</p>
                </CardHeader>
                <div className="p-4">
                  <p>{t('settings.card_content_goes_here')}</p>
                </div>
              </Card>
              <Card variant="outlined">
                <CardHeader>
                  <h4 className="font-semibold">{t('settings.outline_card')}</h4>
                  <p className="text-sm text-muted-foreground">{t('settings.this_is_outline_card')}</p>
                </CardHeader>
                <div className="p-4">
                  <p>{t('settings.card_content_goes_here')}</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};