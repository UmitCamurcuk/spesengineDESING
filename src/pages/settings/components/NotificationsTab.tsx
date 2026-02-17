import React from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { UpdateSettingsPayload } from '../../../api/types/api.types';

interface NotificationsTabProps {
  form: UpdateSettingsPayload;
  isLocked: boolean;
  onNotificationChange: (field: keyof UpdateSettingsPayload['notifications'], checked: boolean) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  form,
  isLocked,
  onNotificationChange,
}) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader
        title={t('settings.notifications.title')}
        subtitle={t('settings.notifications.subtitle')}
        className="border-none mb-2"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Checkbox
          label={t('settings.notifications.email')}
          checked={form.notifications.email}
          onChange={(e) => onNotificationChange('email', e.target.checked)}
          disabled={isLocked}
        />
        <Checkbox
          label={t('settings.notifications.push')}
          checked={form.notifications.push}
          onChange={(e) => onNotificationChange('push', e.target.checked)}
          disabled={isLocked}
        />
        <Checkbox
          label={t('settings.notifications.slack')}
          checked={form.notifications.slack}
          onChange={(e) => onNotificationChange('slack', e.target.checked)}
          disabled={isLocked}
        />
        <Checkbox
          label={t('settings.notifications.sms')}
          checked={form.notifications.sms}
          onChange={(e) => onNotificationChange('sms', e.target.checked)}
          disabled={isLocked}
        />
        <Checkbox
          label={t('settings.notifications.weekly_digest')}
          checked={form.notifications.weeklyDigest}
          onChange={(e) => onNotificationChange('weeklyDigest', e.target.checked)}
          disabled={isLocked}
        />
        <Checkbox
          label={t('settings.notifications.anomaly_alerts')}
          checked={form.notifications.anomalyAlerts}
          onChange={(e) => onNotificationChange('anomalyAlerts', e.target.checked)}
          disabled={isLocked}
        />
      </div>
    </Card>
  );
};
