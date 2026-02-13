import React from 'react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import type { WorkflowNodeConfig, TriggerType } from '../../../types';

interface TriggerConfigFormProps {
  triggerType: TriggerType;
  config: WorkflowNodeConfig;
  onChange: (config: WorkflowNodeConfig) => void;
  onTriggerTypeChange: (type: TriggerType) => void;
}

const TRIGGER_TYPE_OPTIONS = [
  { value: 'event', label: 'Olay Tabanlı' },
  { value: 'schedule', label: 'Zamanlı (Cron)' },
  { value: 'manual', label: 'Manuel' },
  { value: 'webhook', label: 'Webhook' },
];

const EVENT_KEY_OPTIONS = [
  { value: 'user.login', label: 'Kullanıcı Girişi' },
  { value: 'user.created', label: 'Kullanıcı Oluşturuldu' },
  { value: 'user.updated', label: 'Kullanıcı Güncellendi' },
  { value: 'user.role.changed', label: 'Kullanıcı Rolü Değişti' },
  { value: 'item.created', label: 'Item Oluşturuldu' },
  { value: 'item.updated', label: 'Item Güncellendi' },
  { value: 'item.deleted', label: 'Item Silindi' },
  { value: 'item.attributes.updated', label: 'Item Attribute Güncellendi' },
  { value: 'attribute.created', label: 'Attribute Oluşturuldu' },
  { value: 'attribute.updated', label: 'Attribute Güncellendi' },
  { value: 'attribute.deleted', label: 'Attribute Silindi' },
];

export const TriggerConfigForm: React.FC<TriggerConfigFormProps> = ({
  triggerType,
  config,
  onChange,
  onTriggerTypeChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Tetikleyici Tipi</label>
        <Select
          value={triggerType}
          onChange={(e) => onTriggerTypeChange(e.target.value as TriggerType)}
          options={TRIGGER_TYPE_OPTIONS}
        />
      </div>

      {triggerType === 'event' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Olay Anahtarı</label>
          <Select
            value={config.eventKey ?? ''}
            onChange={(e) => onChange({ ...config, eventKey: e.target.value })}
            options={[{ value: '', label: 'Seçiniz...' }, ...EVENT_KEY_OPTIONS]}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Bu olay tetiklendiğinde workflow çalışır.
          </p>
        </div>
      )}

      {triggerType === 'schedule' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Cron İfadesi</label>
          <Input
            value={config.cronExpression ?? ''}
            onChange={(e) => onChange({ ...config, cronExpression: e.target.value })}
            placeholder="*/5 * * * *"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Standart cron formatı. Örn: "*/5 * * * *" = Her 5 dakikada bir
          </p>
        </div>
      )}

      {triggerType === 'manual' && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">
            Manuel tetikleyici, workflow'u "Çalıştır" butonu ile başlatmanızı sağlar.
          </p>
        </div>
      )}

      {triggerType === 'webhook' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Webhook Secret (opsiyonel)</label>
            <Input
              value={config.webhookSecret ?? ''}
              onChange={(e) => onChange({ ...config, webhookSecret: e.target.value })}
              placeholder="İsteğe bağlı güvenlik anahtarı"
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Workflow kaydedildikten sonra bir webhook URL oluşturulacaktır.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
