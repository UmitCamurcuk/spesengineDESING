import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ListTree } from 'lucide-react';
import type { SwitchCase } from '../../../types';

interface SwitchNodeData {
  label: string;
  config?: {
    switchCases?: SwitchCase[];
    switchDefaultHandle?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const SwitchNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as SwitchNodeData;
  const cases = d.config?.switchCases ?? [];
  const handles = [
    ...cases.map((c) => ({ id: c.handleId, label: c.label })),
    { id: d.config?.switchDefaultHandle ?? 'default', label: 'Default' },
  ];

  const handleCount = handles.length;

  return (
    <div
      className={`relative rounded-lg border-2 bg-card shadow-sm px-4 py-3 min-w-[200px] ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-cyan-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white dark:!border-gray-800"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-100 dark:bg-cyan-900/30">
          <ListTree className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
            Switch
          </p>
          <p className="text-sm font-semibold text-foreground">{d.label || 'Switch'}</p>
        </div>
      </div>

      {/* Dynamic source handles */}
      {handles.map((h, i) => {
        const leftPercent = ((i + 1) / (handleCount + 1)) * 100;
        return (
          <Handle
            key={h.id}
            type="source"
            position={Position.Bottom}
            id={h.id}
            className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white dark:!border-gray-800"
            style={{ left: `${leftPercent}%` }}
          />
        );
      })}

      {/* Handle labels */}
      <div className="flex justify-between mt-1 px-0.5 gap-1">
        {handles.map((h) => (
          <span
            key={h.id}
            className="text-[9px] text-cyan-600 dark:text-cyan-400 font-medium truncate text-center flex-1"
          >
            {h.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default memo(SwitchNode);
