import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { StickyNote } from 'lucide-react';

interface NoteNodeData {
  label: string;
  config?: {
    noteContent?: string;
    noteColor?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-800 dark:text-yellow-200' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-200' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-800 dark:text-green-200' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-800 dark:text-pink-200' },
};

const NoteNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as NoteNodeData;
  const color = colorMap[d.config?.noteColor ?? 'yellow'] ?? colorMap.yellow;
  const content = d.config?.noteContent ?? '';

  return (
    <div
      className={`relative rounded-lg border-2 shadow-sm px-4 py-3 min-w-[160px] max-w-[260px] ${color.bg} ${
        selected ? 'border-primary ring-2 ring-primary/20' : color.border
      }`}
    >
      <div className="flex items-start gap-2">
        <StickyNote className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color.text}`} />
        <div className="min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wide ${color.text}`}>
            Not
          </p>
          {content ? (
            <p className={`text-sm mt-1 whitespace-pre-wrap break-words ${color.text} opacity-80`}>
              {content.length > 120 ? content.slice(0, 120) + '...' : content}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic mt-1">Boş not</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(NoteNode);
