import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';

interface DelayNodeData {
  label: string;
  config?: {
    delayMs?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function formatDelay(ms?: number): string {
  if (!ms || ms <= 0) return '';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}dk`;
  return `${Math.round(ms / 3_600_000)}sa`;
}

const DelayNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as DelayNodeData;
  const delayLabel = formatDelay(d.config?.delayMs);

  return (
    <div
      className={`relative rounded-lg border-2 bg-card shadow-sm px-4 py-3 min-w-[180px] ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-500 !border-2 !border-white dark:!border-gray-800"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-900/30">
          <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Bekleme
          </p>
          <p className="text-sm font-semibold text-foreground">{d.label || 'Delay'}</p>
          {delayLabel && (
            <p className="text-xs text-muted-foreground">{delayLabel}</p>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-500 !border-2 !border-white dark:!border-gray-800"
      />
    </div>
  );
};

export default memo(DelayNode);
