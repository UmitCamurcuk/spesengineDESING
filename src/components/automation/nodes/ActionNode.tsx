import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Bell,
  Pencil,
  Globe,
  Plus,
  RefreshCw,
  Variable,
  FileText,
  Trash2,
  Mail,
  Globe2,
  Shuffle,
  Search,
  ListChecks,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import type { ActionType } from '../../../types';

interface ActionNodeData {
  label: string;
  config?: {
    actionType?: ActionType;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const actionMeta: Record<string, { icon: LucideIcon; color: string; bgColor: string; label: string }> = {
  send_notification: { icon: Bell, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Bildirim' },
  update_field: { icon: Pencil, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', label: 'Alan Güncelle' },
  webhook: { icon: Globe, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: 'Webhook' },
  create_item: { icon: Plus, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Item Oluştur' },
  update_item: { icon: RefreshCw, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', label: 'Item Güncelle' },
  set_variable: { icon: Variable, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Değişken Ata' },
  log: { icon: FileText, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-900/30', label: 'Log' },
  delete_item: { icon: Trash2, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Item Sil' },
  send_email: { icon: Mail, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100 dark:bg-violet-900/30', label: 'E-posta' },
  http_request: { icon: Globe2, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: 'HTTP İstek' },
  transform_data: { icon: Shuffle, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-900/30', label: 'Veri Dönüştür' },
  find_items: { icon: Search, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-900/30', label: 'Item Ara' },
  bulk_update_items: { icon: ListChecks, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Toplu Güncelle' },
  assign_attribute: { icon: Tag, color: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', label: 'Attribute Ata' },
};

const defaultMeta = { icon: Bell, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Aksiyon' };

const ActionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as ActionNodeData;
  const actionType = d.config?.actionType ?? '';
  const meta = actionMeta[actionType] ?? defaultMeta;
  const Icon = meta.icon;

  return (
    <div
      className={`relative rounded-lg border-2 bg-card shadow-sm px-4 py-3 min-w-[180px] ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-blue-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800"
      />
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${meta.bgColor}`}>
          <Icon className={`h-4 w-4 ${meta.color}`} />
        </div>
        <div>
          <p className={`text-xs font-medium ${meta.color} uppercase tracking-wide`}>
            {meta.label}
          </p>
          <p className="text-sm font-semibold text-foreground">{d.label || 'Action'}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800"
      />
    </div>
  );
};

export default memo(ActionNode);
