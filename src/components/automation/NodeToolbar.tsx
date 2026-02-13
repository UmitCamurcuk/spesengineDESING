import React from 'react';
import { Zap, GitBranch, Cog, Clock, Code, StickyNote, ListTree, Repeat } from 'lucide-react';
import type { WorkflowNodeType } from '../../types';

interface NodeTemplate {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'trigger',
    label: 'Tetikleyici',
    description: 'Workflow başlangıcı',
    icon: Zap,
    color: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20',
  },
  {
    type: 'condition',
    label: 'Koşul',
    description: 'Dallanma noktası',
    icon: GitBranch,
    color: 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20',
  },
  {
    type: 'action',
    label: 'Aksiyon',
    description: 'Bir işlem yap',
    icon: Cog,
    color: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
  {
    type: 'delay',
    label: 'Bekleme',
    description: 'Zamanlayıcı',
    icon: Clock,
    color: 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20',
  },
  {
    type: 'script',
    label: 'Script',
    description: 'JavaScript kodu çalıştır',
    icon: Code,
    color: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  },
  {
    type: 'switch',
    label: 'Switch',
    description: 'Çoklu dallanma',
    icon: ListTree,
    color: 'text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
  },
  {
    type: 'loop',
    label: 'Döngü',
    description: 'Dizi üzerinde iterasyon',
    icon: Repeat,
    color: 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20',
  },
  {
    type: 'note',
    label: 'Not',
    description: 'Canvas notu',
    icon: StickyNote,
    color: 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
  },
];

interface NodeToolbarProps {
  onAddNode: (type: WorkflowNodeType) => void;
  hasTrigger: boolean;
}

export const NodeToolbar: React.FC<NodeToolbarProps> = ({ onAddNode, hasTrigger }) => {
  const handleDragStart = (e: React.DragEvent, type: WorkflowNodeType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Node Ekle
      </p>
      {NODE_TEMPLATES.map((template) => {
        const Icon = template.icon;
        const disabled = template.type === 'trigger' && hasTrigger;

        return (
          <div
            key={template.type}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, template.type)}
            onClick={() => !disabled && onAddNode(template.type)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-grab active:cursor-grabbing transition-colors ${
              disabled
                ? 'opacity-40 cursor-not-allowed'
                : template.color
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium leading-none">{template.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{template.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
