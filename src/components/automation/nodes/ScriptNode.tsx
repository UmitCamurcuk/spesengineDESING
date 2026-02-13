import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Code } from 'lucide-react';

interface ScriptNodeData {
  label: string;
  config?: {
    scriptCode?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const ScriptNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as ScriptNodeData;
  const hasCode = !!d.config?.scriptCode?.trim();

  return (
    <div
      className={`relative rounded-lg border-2 bg-card shadow-sm px-4 py-3 min-w-[180px] ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-emerald-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
          <Code className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            Script
          </p>
          <p className="text-sm font-semibold text-foreground">{d.label || 'Script'}</p>
          {hasCode && (
            <p className="text-[10px] text-muted-foreground">JS kodu mevcut</p>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800"
      />
    </div>
  );
};

export default memo(ScriptNode);
