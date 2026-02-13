import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';

interface TriggerNodeData {
  label: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

const TriggerNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as TriggerNodeData;
  return (
    <div
      className={`relative rounded-lg border-2 bg-card shadow-sm px-4 py-3 min-w-[180px] ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-amber-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
          <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            Tetikleyici
          </p>
          <p className="text-sm font-semibold text-foreground">{d.label || 'Trigger'}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-gray-800"
      />
    </div>
  );
};

export default memo(TriggerNode);
