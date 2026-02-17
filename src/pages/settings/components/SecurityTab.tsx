import React from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { UpdateSettingsPayload } from '../../../api/types/api.types';

interface SecurityTabProps {
  form: UpdateSettingsPayload;
  isLocked: boolean;
  onSecurityChange: (field: keyof UpdateSettingsPayload['security'], value: string | boolean) => void;
  onDataChange: (field: keyof UpdateSettingsPayload['data'], value: string | boolean) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  form,
  isLocked,
  onSecurityChange,
  onDataChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Authentication & Session */}
      <Card>
        <CardHeader
          title={t('settings.security.title')}
          subtitle={t('settings.security.subtitle')}
          className="border-none mb-2"
        />
        <div className="space-y-4">
          <Input
            type="number"
            min={5}
            max={720}
            label={t('settings.security.session_timeout')}
            value={form.security.sessionTimeoutMinutes}
            onChange={(e) => onSecurityChange('sessionTimeoutMinutes', e.target.value)}
            helperText={t('settings.security.session_timeout_help')}
            disabled={isLocked}
          />
          <Input
            type="number"
            min={0}
            max={365}
            label={t('settings.security.password_expiry')}
            value={form.security.passwordExpiryDays}
            onChange={(e) => onSecurityChange('passwordExpiryDays', e.target.value)}
            disabled={isLocked}
          />
          <Checkbox
            label={t('settings.security.enforce_two_factor')}
            checked={form.security.enforceTwoFactor}
            onChange={(e) => onSecurityChange('enforceTwoFactor', e.target.checked)}
            disabled={isLocked}
          />
          <Checkbox
            label={t('settings.security.require_two_factor_admins')}
            checked={form.security.requireTwoFactorForAdmins}
            onChange={(e) => onSecurityChange('requireTwoFactorForAdmins', e.target.checked)}
            disabled={isLocked}
          />
          <Checkbox
            label={t('settings.security.login_alerts')}
            checked={form.security.loginAlerts}
            onChange={(e) => onSecurityChange('loginAlerts', e.target.checked)}
            disabled={isLocked}
          />
          <Checkbox
            label={t('settings.security.allow_remember_device')}
            checked={form.security.allowRememberDevice}
            onChange={(e) => onSecurityChange('allowRememberDevice', e.target.checked)}
            disabled={isLocked}
          />
        </div>
      </Card>

      {/* Data Policy */}
      <Card>
        <CardHeader
          title={t('settings.data.title') || 'Data Policy'}
          subtitle={t('settings.data.subtitle') || 'Data retention and export settings'}
          className="border-none mb-2"
        />
        <div className="space-y-4">
          <Input
            type="number"
            min={30}
            max={1825}
            label={t('settings.data.retention_days') || 'Data Retention (days)'}
            value={form.data.retentionDays}
            onChange={(e) => onDataChange('retentionDays', e.target.value)}
            helperText={t('settings.data.retention_days_help') || 'How long to keep audit logs and historical data.'}
            disabled={isLocked}
          />
          <Checkbox
            label={t('settings.data.allow_export') || 'Allow data export'}
            checked={form.data.allowExport}
            onChange={(e) => onDataChange('allowExport', e.target.checked)}
            helperText={t('settings.data.allow_export_help') || 'Let users export data from the system.'}
            disabled={isLocked}
          />
        </div>
      </Card>
    </div>
  );
};
