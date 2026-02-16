import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
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

/* ------------------------------------------------------------------ */
/*  Event Catalog                                                       */
/* ------------------------------------------------------------------ */

interface EventDef {
  value: string;
  label: string;
  category: string;
  description: string;
  hasItemFilters?: boolean;
  hasAttributeFilter?: boolean;
  hasBoardFilters?: boolean;
  payloadPaths: string[];
}

const EVENT_CATALOG: EventDef[] = [
  // ─── Item ───────────────────────────────────────────────────────────
  {
    value: 'item.created',
    label: 'Item Oluşturuldu',
    category: 'item',
    description: 'Herhangi bir item oluşturulduğunda tetiklenir.',
    hasItemFilters: true,
    payloadPaths: [
      'trigger.item.id',
      'trigger.item.itemTypeId',
      'trigger.item.categoryId',
      'trigger.item.familyId',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'item.updated',
    label: 'Item Güncellendi',
    category: 'item',
    description: 'Herhangi bir item güncellendiğinde tetiklenir.',
    hasItemFilters: true,
    payloadPaths: [
      'trigger.item.id',
      'trigger.item.itemTypeId',
      'trigger.item.categoryId',
      'trigger.item.familyId',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'item.deleted',
    label: 'Item Silindi',
    category: 'item',
    description: 'Bir item silindiğinde tetiklenir.',
    hasItemFilters: true,
    payloadPaths: [
      'trigger.item.id',
      'trigger.item.itemTypeId',
      'trigger.item.categoryId',
      'trigger.item.familyId',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'item.attributes.updated',
    label: 'Item Attribute Güncellendi',
    category: 'item',
    description: 'Bir item\'ın herhangi bir attribute değeri değiştiğinde tetiklenir.',
    hasItemFilters: true,
    hasAttributeFilter: true,
    payloadPaths: [
      'trigger.item.id',
      'trigger.item.itemTypeId',
      'trigger.item.categoryId',
      'trigger.item.familyId',
      'trigger.attributeKey',
      'trigger.newValue',
      'trigger.previousValue',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  // ─── User ────────────────────────────────────────────────────────────
  {
    value: 'user.login',
    label: 'Kullanıcı Girişi',
    category: 'user',
    description: 'Bir kullanıcı sisteme giriş yaptığında tetiklenir.',
    payloadPaths: [
      'trigger.userId',
      'trigger.email',
      'trigger.timestamp',
    ],
  },
  {
    value: 'user.created',
    label: 'Kullanıcı Oluşturuldu',
    category: 'user',
    description: 'Yeni bir kullanıcı oluşturulduğunda tetiklenir.',
    payloadPaths: [
      'trigger.userId',
      'trigger.email',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'user.updated',
    label: 'Kullanıcı Güncellendi',
    category: 'user',
    description: 'Bir kullanıcı güncellendiğinde tetiklenir.',
    payloadPaths: [
      'trigger.userId',
      'trigger.email',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'user.role.changed',
    label: 'Kullanıcı Rolü Değişti',
    category: 'user',
    description: 'Bir kullanıcının rolü değiştiğinde tetiklenir.',
    payloadPaths: [
      'trigger.userId',
      'trigger.previousRole',
      'trigger.newRole',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  // ─── Board ────────────────────────────────────────────────────────────
  {
    value: 'board.task.created',
    label: 'Görev Oluşturuldu',
    category: 'board',
    description: 'Bir panoda yeni görev oluşturulduğunda tetiklenir.',
    hasBoardFilters: true,
    payloadPaths: [
      'trigger.task.id',
      'trigger.task.taskKey',
      'trigger.task.title',
      'trigger.task.boardId',
      'trigger.task.columnId',
      'trigger.task.columnTitle',
      'trigger.task.priority',
      'trigger.task.assigneeId',
      'trigger.boardId',
      'trigger.boardName',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'board.task.moved',
    label: 'Görev Sütun Değiştirdi',
    category: 'board',
    description: 'Bir görev farklı bir sütuna taşındığında tetiklenir.',
    hasBoardFilters: true,
    payloadPaths: [
      'trigger.task.id',
      'trigger.task.taskKey',
      'trigger.task.title',
      'trigger.task.boardId',
      'trigger.task.priority',
      'trigger.task.assigneeId',
      'trigger.from.columnId',
      'trigger.from.columnTitle',
      'trigger.to.columnId',
      'trigger.to.columnTitle',
      'trigger.boardId',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'board.task.updated',
    label: 'Görev Güncellendi',
    category: 'board',
    description: 'Bir görev güncellendiğinde tetiklenir.',
    hasBoardFilters: true,
    payloadPaths: [
      'trigger.task.id',
      'trigger.task.taskKey',
      'trigger.task.title',
      'trigger.task.boardId',
      'trigger.task.priority',
      'trigger.task.assigneeId',
      'trigger.boardId',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'board.task.assigned',
    label: 'Göreve Atama Yapıldı',
    category: 'board',
    description: 'Bir göreve kullanıcı atandığında tetiklenir.',
    hasBoardFilters: true,
    payloadPaths: [
      'trigger.task.id',
      'trigger.task.taskKey',
      'trigger.task.title',
      'trigger.task.boardId',
      'trigger.assigneeId',
      'trigger.previousAssigneeId',
      'trigger.boardId',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'board.task.archived',
    label: 'Görev Arşivlendi',
    category: 'board',
    description: 'Bir görev arşivlendiğinde tetiklenir.',
    hasBoardFilters: true,
    payloadPaths: [
      'trigger.task.id',
      'trigger.task.taskKey',
      'trigger.task.title',
      'trigger.task.boardId',
      'trigger.boardId',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'board.task.commented',
    label: 'Göreve Yorum Eklendi',
    category: 'board',
    description: 'Bir göreve yorum eklendiğinde tetiklenir.',
    hasBoardFilters: true,
    payloadPaths: [
      'trigger.task.id',
      'trigger.task.taskKey',
      'trigger.task.title',
      'trigger.comment',
      'trigger.boardId',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  // ─── Attribute ───────────────────────────────────────────────────────
  {
    value: 'attribute.created',
    label: 'Attribute Oluşturuldu',
    category: 'mdm',
    description: 'Yeni bir attribute tanımı oluşturulduğunda tetiklenir.',
    payloadPaths: [
      'trigger.attributeId',
      'trigger.key',
      'trigger.type',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  {
    value: 'attribute.updated',
    label: 'Attribute Güncellendi',
    category: 'mdm',
    description: 'Bir attribute tanımı güncellendiğinde tetiklenir.',
    payloadPaths: [
      'trigger.attributeId',
      'trigger.key',
      'trigger.actorId',
      'trigger.timestamp',
    ],
  },
  // ─── System ───────────────────────────────────────────────────────────
  {
    value: 'workflow.execution.completed',
    label: 'Workflow Tamamlandı',
    category: 'system',
    description: 'Bir workflow başarıyla tamamlandığında tetiklenir (zincir için).',
    payloadPaths: [
      'trigger.workflowId',
      'trigger.executionId',
      'trigger.durationMs',
      'trigger.timestamp',
    ],
  },
  {
    value: 'workflow.execution.failed',
    label: 'Workflow Başarısız Oldu',
    category: 'system',
    description: 'Bir workflow hata vererek durduğunda tetiklenir.',
    payloadPaths: [
      'trigger.workflowId',
      'trigger.executionId',
      'trigger.errorMessage',
      'trigger.timestamp',
    ],
  },
];

const EVENT_CATEGORY_LABELS: Record<string, string> = {
  item: '📦 Item',
  user: '👤 Kullanıcı',
  board: '📋 Pano Görevi',
  mdm: '🗂️ MDM / Attribute',
  system: '⚙️ Sistem',
};

const TRIGGER_TYPE_OPTIONS = [
  { value: 'event', label: 'Olay Tabanlı' },
  { value: 'schedule', label: 'Zamanlı (Cron)' },
  { value: 'manual', label: 'Manuel' },
  { value: 'webhook', label: 'Webhook' },
];

/* ------------------------------------------------------------------ */
/*  Payload Preview                                                     */
/* ------------------------------------------------------------------ */

function PayloadPreview({ eventDef }: { eventDef: EventDef }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(`{{${path}}}`).catch(() => {});
    setCopied(path);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Bu olayda kullanılabilir değişkenler</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2 space-y-1">
          <p className="text-[10px] text-muted-foreground mb-2">
            Template ifadelerinde kullanmak için tıklayın.
          </p>
          {eventDef.payloadPaths.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => handleCopy(path)}
              className="w-full flex items-center justify-between group text-left px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              <code className="text-[11px] font-mono text-primary">{`{{${path}}}`}</code>
              {copied === path ? (
                <Check className="h-3 w-3 text-success flex-shrink-0" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TriggerConfigForm                                                   */
/* ------------------------------------------------------------------ */

export const TriggerConfigForm: React.FC<TriggerConfigFormProps> = ({
  triggerType,
  config,
  onChange,
  onTriggerTypeChange,
}) => {
  const selectedEvent = EVENT_CATALOG.find((e) => e.value === config.eventKey);

  // Build grouped options
  const groupedOptions: Record<string, { value: string; label: string }[]> = {};
  for (const ev of EVENT_CATALOG) {
    if (!groupedOptions[ev.category]) groupedOptions[ev.category] = [];
    groupedOptions[ev.category].push({ value: ev.value, label: ev.label });
  }

  const flatOptions = [
    { value: '', label: 'Seçiniz...' },
    ...Object.entries(groupedOptions).flatMap(([cat, items]) => [
      { value: `__group_${cat}`, label: `── ${EVENT_CATEGORY_LABELS[cat] ?? cat} ──` },
      ...items,
    ]),
  ];

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

      {/* ─── Event ──────────────────────────────────────────────────── */}
      {triggerType === 'event' && (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Olay</label>
            <Select
              value={config.eventKey ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('__group_')) return;
                onChange({
                  ...config,
                  eventKey: val,
                  // Reset filters when event changes
                  itemCategoryKey: undefined,
                  itemFamilyKey: undefined,
                  itemTypeKey: undefined,
                  attributeKey: undefined,
                  attributeNewValue: undefined,
                  attributePreviousValue: undefined,
                  filterExpression: undefined,
                });
              }}
              options={flatOptions}
            />
            {selectedEvent && (
              <p className="text-xs text-muted-foreground mt-1">{selectedEvent.description}</p>
            )}
          </div>

          {/* Payload preview */}
          {selectedEvent && <PayloadPreview eventDef={selectedEvent} />}

          {/* Item filters */}
          {selectedEvent?.hasItemFilters && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-foreground">
                Item Filtresi <span className="text-muted-foreground font-normal">(opsiyonel)</span>
              </p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Kategori Key</label>
                  <Input
                    value={config.itemCategoryKey ?? ''}
                    onChange={(e) => onChange({ ...config, itemCategoryKey: e.target.value || undefined })}
                    placeholder="Örn: customers"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Aile Key</label>
                  <Input
                    value={config.itemFamilyKey ?? ''}
                    onChange={(e) => onChange({ ...config, itemFamilyKey: e.target.value || undefined })}
                    placeholder="Örn: individual"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Item Tipi Key</label>
                  <Input
                    value={config.itemTypeKey ?? ''}
                    onChange={(e) => onChange({ ...config, itemTypeKey: e.target.value || undefined })}
                    placeholder="Örn: customer"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Attribute filter */}
          {selectedEvent?.hasAttributeFilter && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-foreground">
                Attribute Filtresi <span className="text-muted-foreground font-normal">(opsiyonel)</span>
              </p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Attribute Key</label>
                  <Input
                    value={config.attributeKey ?? ''}
                    onChange={(e) => onChange({ ...config, attributeKey: e.target.value || undefined })}
                    placeholder="Örn: status"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Yeni Değer (boş = herhangi)</label>
                  <Input
                    value={config.attributeNewValue ?? ''}
                    onChange={(e) => onChange({ ...config, attributeNewValue: e.target.value || undefined })}
                    placeholder="Örn: approved"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Önceki Değer (boş = herhangi)</label>
                  <Input
                    value={config.attributePreviousValue ?? ''}
                    onChange={(e) => onChange({ ...config, attributePreviousValue: e.target.value || undefined })}
                    placeholder="Örn: pending"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Advanced JS filter expression */}
          {config.eventKey && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-foreground">
                  Gelişmiş JS Filtresi
                  <span className="text-muted-foreground font-normal ml-1">(opsiyonel)</span>
                </label>
              </div>
              <Textarea
                value={config.filterExpression ?? ''}
                onChange={(e) => onChange({ ...config, filterExpression: e.target.value || undefined })}
                rows={3}
                placeholder={`// Örnek:\ntrigger.item?.categoryId === 'abc' && Number(trigger.newValue) > 100`}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                JavaScript ifadesi. <code className="font-mono">trigger</code> = olay verisi.
                Tüm filtreler geçildikten sonra bu ifade de <code className="font-mono">true</code> döndürmelidir.
                Örnekler: <code className="font-mono">Number(trigger.newValue) &gt; 100</code>,{' '}
                <code className="font-mono">trigger.task?.priority === 'high'</code>
              </p>
            </div>
          )}
        </>
      )}

      {/* ─── Schedule ────────────────────────────────────────────────── */}
      {triggerType === 'schedule' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Cron İfadesi</label>
          <Input
            value={config.cronExpression ?? ''}
            onChange={(e) => onChange({ ...config, cronExpression: e.target.value })}
            placeholder="*/5 * * * *"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Standart cron formatı. Örn: <code className="font-mono">*/5 * * * *</code> = Her 5 dakikada bir
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {[
              { label: 'Her dakika', value: '* * * * *' },
              { label: 'Her 5 dk', value: '*/5 * * * *' },
              { label: 'Her saat', value: '0 * * * *' },
              { label: 'Her gün 09:00', value: '0 9 * * *' },
              { label: 'Her Pazartesi', value: '0 9 * * 1' },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange({ ...config, cronExpression: preset.value })}
                className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Manual ──────────────────────────────────────────────────── */}
      {triggerType === 'manual' && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">
            Manuel tetikleyici, workflow'u &quot;Tetikle&quot; butonu ile başlatmanızı sağlar.
          </p>
        </div>
      )}

      {/* ─── Webhook ──────────────────────────────────────────────────── */}
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
