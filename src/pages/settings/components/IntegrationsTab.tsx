import React from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { UpdateSettingsPayload } from '../../../api/types/api.types';

interface IntegrationsTabProps {
  form: UpdateSettingsPayload;
  isLocked: boolean;
  onSlackChange: (field: keyof UpdateSettingsPayload['integrations']['slack'], value: string | boolean) => void;
  onTeamsChange: (field: keyof UpdateSettingsPayload['integrations']['microsoftTeams'], value: string | boolean) => void;
  onWebhookChange: (field: keyof UpdateSettingsPayload['integrations']['webhook'], value: string | boolean) => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  form,
  isLocked,
  onSlackChange,
  onTeamsChange,
  onWebhookChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Slack */}
        <Card>
          <CardHeader
            title={t('settings.integrations.slack.title')}
            subtitle={t('settings.integrations.slack.subtitle')}
            className="border-none mb-2"
          />
          <div className="space-y-4">
            <Checkbox
              label={t('settings.integrations.slack.enable')}
              checked={form.integrations.slack.enabled}
              onChange={(e) => onSlackChange('enabled', e.target.checked)}
              disabled={isLocked}
            />

            <div className="pt-2 space-y-4">
              <Checkbox
                label={t('settings.integrations.slack.use_bot_token')}
                checked={form.integrations.slack.useBotToken ?? false}
                onChange={(e) => onSlackChange('useBotToken', e.target.checked)}
                disabled={isLocked || !form.integrations.slack.enabled}
              />

              {form.integrations.slack.useBotToken ? (
                <>
                  <Input
                    label={t('settings.integrations.slack.bot_token')}
                    value={form.integrations.slack.botToken || ''}
                    onChange={(e) => onSlackChange('botToken', e.target.value)}
                    placeholder="xoxb-..."
                    helperText={t('settings.integrations.slack.bot_token_help')}
                    disabled={isLocked || !form.integrations.slack.enabled}
                    type="password"
                  />
                  <Input
                    label={t('settings.integrations.slack.default_channel')}
                    value={form.integrations.slack.defaultChannel || ''}
                    onChange={(e) => onSlackChange('defaultChannel', e.target.value)}
                    placeholder="#general"
                    helperText={t('settings.integrations.slack.default_channel_help')}
                    disabled={isLocked || !form.integrations.slack.enabled}
                  />
                </>
              ) : (
                <>
                  <Input
                    label={t('settings.integrations.slack.channel')}
                    value={form.integrations.slack.channel}
                    onChange={(e) => onSlackChange('channel', e.target.value)}
                    placeholder="#spes-alerts"
                    disabled={isLocked || !form.integrations.slack.enabled}
                  />
                  <Input
                    label={t('settings.integrations.slack.webhook')}
                    value={form.integrations.slack.webhookUrl || ''}
                    onChange={(e) => onSlackChange('webhookUrl', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    helperText={t('settings.integrations.slack.webhook_help')}
                    disabled={isLocked || !form.integrations.slack.enabled}
                  />
                </>
              )}
            </div>

            <Checkbox
              label={t('settings.integrations.slack.mention_all')}
              checked={form.integrations.slack.mentionAll}
              onChange={(e) => onSlackChange('mentionAll', e.target.checked)}
              disabled={isLocked || !form.integrations.slack.enabled}
            />
            <Checkbox
              label={t('settings.integrations.slack.send_digest')}
              checked={form.integrations.slack.sendDigest}
              onChange={(e) => onSlackChange('sendDigest', e.target.checked)}
              disabled={isLocked || !form.integrations.slack.enabled}
            />
          </div>
        </Card>

        {/* Microsoft Teams */}
        <Card>
          <CardHeader
            title={t('settings.integrations.teams.title')}
            subtitle={t('settings.integrations.teams.subtitle')}
            className="border-none mb-2"
          />
          <div className="space-y-4">
            <Checkbox
              label={t('settings.integrations.teams.enable')}
              checked={form.integrations.microsoftTeams.enabled}
              onChange={(e) => onTeamsChange('enabled', e.target.checked)}
              disabled={isLocked}
            />
            <Input
              label={t('settings.integrations.teams.channel')}
              value={form.integrations.microsoftTeams.channel}
              onChange={(e) => onTeamsChange('channel', e.target.value)}
              placeholder="Operations"
              disabled={isLocked || !form.integrations.microsoftTeams.enabled}
            />
            <Input
              label={t('settings.integrations.teams.webhook')}
              value={form.integrations.microsoftTeams.webhookUrl}
              onChange={(e) => onTeamsChange('webhookUrl', e.target.value)}
              placeholder="https://"
              helperText={t('settings.integrations.teams.webhook_help')}
              disabled={isLocked || !form.integrations.microsoftTeams.enabled}
            />
          </div>
        </Card>
      </div>

      {/* Webhook */}
      <Card>
        <CardHeader
          title={t('settings.integrations.webhook.title')}
          subtitle={t('settings.integrations.webhook.subtitle')}
          className="border-none mb-2"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Checkbox
            label={t('settings.integrations.webhook.enable')}
            checked={form.integrations.webhook.enabled}
            onChange={(e) => onWebhookChange('enabled', e.target.checked)}
            disabled={isLocked}
          />
          <Input
            label={t('settings.integrations.webhook.endpoint')}
            value={form.integrations.webhook.endpoint}
            onChange={(e) => onWebhookChange('endpoint', e.target.value)}
            placeholder="https://api.mycompany.com/hooks/settings"
            disabled={isLocked || !form.integrations.webhook.enabled}
          />
          <Input
            label={t('settings.integrations.webhook.secret')}
            value={form.integrations.webhook.secret}
            onChange={(e) => onWebhookChange('secret', e.target.value)}
            placeholder="••••••"
            disabled={isLocked || !form.integrations.webhook.enabled}
          />
        </div>
      </Card>
    </div>
  );
};
