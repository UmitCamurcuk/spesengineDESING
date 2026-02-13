import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface ConditionNodeData {
  label: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

const ConditionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as ConditionNodeData;
  return (
    <div
      className={`relative rounded-lg border-2 bg-card shadow-sm px-4 py-3 min-w-[180px] ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-purple-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-gray-800"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
          <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
            Koşul
          </p>
          <p className="text-sm font-semibold text-foreground">{d.label || 'Condition'}</p>
        </div>
      </div>
      {/* True handle (left-bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white dark:!border-gray-800 !left-[30%]"
      />
      {/* False handle (right-bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white dark:!border-gray-800 !left-[70%]"
      />
      {/* Labels for handles */}
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Evet</span>
        <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Hayır</span>
      </div>
    </div>
  );
};

export default memo(ConditionNode);
