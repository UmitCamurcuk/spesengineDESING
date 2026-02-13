import React from 'react';
import {
  Bell,
  Globe,
  FileEdit,
  PackagePlus,
  Clock,
  Zap,
} from 'lucide-react';
import type {
  WorkflowNode as WfNode,
  WorkflowEdge as WfEdge,
  TriggerType,
} from '../../types';

/* ------------------------------------------------------------------ */
/*  Template definition                                                */
/* ------------------------------------------------------------------ */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  nodes: WfNode[];
  edges: WfEdge[];
}

/* ------------------------------------------------------------------ */
/*  Built-in templates                                                 */
/* ------------------------------------------------------------------ */

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'notification_on_create',
    name: 'Oluşturma Bildirimi',
    description: 'Yeni item oluşturulduğunda bildirim gönderir.',
    icon: Bell,
    color: 'text-blue-500',
    triggerType: 'event',
    triggerConfig: { eventKey: 'item.created' },
    nodes: [
      {
        id: 'trigger_1',
        type: 'trigger',
        label: 'Item Oluşturuldu',
        position: { x: 250, y: 50 },
        config: {},
        metadata: {},
      },
      {
        id: 'action_1',
        type: 'action',
        label: 'Bildirim Gönder',
        position: { x: 250, y: 200 },
        config: {
          actionType: 'send_notification',
          eventKey: 'item.created',
          title: 'Yeni item oluşturuldu',
          message: 'Bir item oluşturuldu: {{trigger.itemId}}',
        },
        metadata: {},
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'action_1',
        sourceHandle: null,
        label: null,
      },
    ],
  },
  {
    id: 'webhook_relay',
    name: 'Webhook Tetikleme',
    description: 'Bir olay gerçekleştiğinde harici bir servisi webhook ile bilgilendirir.',
    icon: Globe,
    color: 'text-green-500',
    triggerType: 'event',
    triggerConfig: { eventKey: '' },
    nodes: [
      {
        id: 'trigger_1',
        type: 'trigger',
        label: 'Olay Tetikleyici',
        position: { x: 250, y: 50 },
        config: {},
        metadata: {},
      },
      {
        id: 'action_1',
        type: 'action',
        label: 'Webhook Gönder',
        position: { x: 250, y: 200 },
        config: {
          actionType: 'webhook',
          url: 'https://example.com/webhook',
          method: 'POST',
        },
        metadata: {},
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'action_1',
        sourceHandle: null,
        label: null,
      },
    ],
  },
  {
    id: 'conditional_update',
    name: 'Koşullu Güncelleme',
    description: 'Bir koşul sağlandığında item alanını günceller, aksi halde bildirim gönderir.',
    icon: FileEdit,
    color: 'text-purple-500',
    triggerType: 'event',
    triggerConfig: { eventKey: 'item.updated' },
    nodes: [
      {
        id: 'trigger_1',
        type: 'trigger',
        label: 'Item Güncellendi',
        position: { x: 300, y: 50 },
        config: {},
        metadata: {},
      },
      {
        id: 'condition_1',
        type: 'condition',
        label: 'Koşul Kontrolü',
        position: { x: 300, y: 180 },
        config: { expression: 'trigger.status == "active"' },
        metadata: {},
      },
      {
        id: 'action_1',
        type: 'action',
        label: 'Alan Güncelle',
        position: { x: 150, y: 330 },
        config: { actionType: 'update_field' },
        metadata: {},
      },
      {
        id: 'action_2',
        type: 'action',
        label: 'Bildirim Gönder',
        position: { x: 450, y: 330 },
        config: { actionType: 'send_notification' },
        metadata: {},
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'condition_1',
        sourceHandle: null,
        label: null,
      },
      {
        id: 'edge_2',
        source: 'condition_1',
        target: 'action_1',
        sourceHandle: 'true',
        label: 'Evet',
      },
      {
        id: 'edge_3',
        source: 'condition_1',
        target: 'action_2',
        sourceHandle: 'false',
        label: 'Hayır',
      },
    ],
  },
  {
    id: 'scheduled_sync',
    name: 'Zamanlanmış İşlem',
    description: 'Belirli aralıklarla çalışan zamanlanmış bir iş akışı.',
    icon: Clock,
    color: 'text-amber-500',
    triggerType: 'schedule',
    triggerConfig: { cronExpression: '0 9 * * *' },
    nodes: [
      {
        id: 'trigger_1',
        type: 'trigger',
        label: 'Her Gün 09:00',
        position: { x: 250, y: 50 },
        config: {},
        metadata: {},
      },
      {
        id: 'action_1',
        type: 'action',
        label: 'Webhook Çağır',
        position: { x: 250, y: 200 },
        config: {
          actionType: 'webhook',
          url: 'https://example.com/sync',
          method: 'POST',
        },
        metadata: {},
      },
      {
        id: 'action_2',
        type: 'action',
        label: 'Log Kaydet',
        position: { x: 250, y: 350 },
        config: {
          actionType: 'log',
          message: 'Zamanlanmış senkronizasyon tamamlandı',
          level: 'info',
        },
        metadata: {},
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'action_1',
        sourceHandle: null,
        label: null,
      },
      {
        id: 'edge_2',
        source: 'action_1',
        target: 'action_2',
        sourceHandle: null,
        label: null,
      },
    ],
  },
  {
    id: 'delayed_notification',
    name: 'Gecikmeli Bildirim',
    description: 'Bir olay sonrası belirli süre bekleyip bildirim gönderir.',
    icon: Zap,
    color: 'text-red-500',
    triggerType: 'event',
    triggerConfig: { eventKey: '' },
    nodes: [
      {
        id: 'trigger_1',
        type: 'trigger',
        label: 'Olay Tetikleyici',
        position: { x: 250, y: 50 },
        config: {},
        metadata: {},
      },
      {
        id: 'delay_1',
        type: 'delay',
        label: '5 Saniye Bekle',
        position: { x: 250, y: 180 },
        config: { delayMs: 5000 },
        metadata: {},
      },
      {
        id: 'action_1',
        type: 'action',
        label: 'Bildirim Gönder',
        position: { x: 250, y: 330 },
        config: { actionType: 'send_notification' },
        metadata: {},
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'delay_1',
        sourceHandle: null,
        label: null,
      },
      {
        id: 'edge_2',
        source: 'delay_1',
        target: 'action_1',
        sourceHandle: null,
        label: null,
      },
    ],
  },
  {
    id: 'item_create_flow',
    name: 'Item Oluşturma Akışı',
    description: 'Manuel tetikleme ile yeni item oluşturur ve bildirim gönderir.',
    icon: PackagePlus,
    color: 'text-teal-500',
    triggerType: 'manual',
    triggerConfig: {},
    nodes: [
      {
        id: 'trigger_1',
        type: 'trigger',
        label: 'Manuel Tetikleme',
        position: { x: 250, y: 50 },
        config: {},
        metadata: {},
      },
      {
        id: 'action_1',
        type: 'action',
        label: 'Item Oluştur',
        position: { x: 250, y: 200 },
        config: { actionType: 'create_item' },
        metadata: {},
      },
      {
        id: 'action_2',
        type: 'action',
        label: 'Bildirim Gönder',
        position: { x: 250, y: 350 },
        config: {
          actionType: 'send_notification',
          title: 'Yeni item oluşturuldu',
        },
        metadata: {},
      },
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'action_1',
        sourceHandle: null,
        label: null,
      },
      {
        id: 'edge_2',
        source: 'action_1',
        target: 'action_2',
        sourceHandle: null,
        label: null,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  TemplateSelector component                                         */
/* ------------------------------------------------------------------ */

interface TemplateSelectorProps {
  onSelect: (template: WorkflowTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Hazır bir şablonla başlayın veya sıfırdan oluşturun.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {WORKFLOW_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="text-left rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-muted ${template.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {template.name}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
