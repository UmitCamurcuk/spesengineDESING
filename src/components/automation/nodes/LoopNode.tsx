import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Repeat } from 'lucide-react';

interface LoopNodeData {
  label: string;
  config?: {
    loopExpression?: string;
    loopMaxIterations?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const LoopNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as LoopNodeData;
  const maxIter = d.config?.loopMaxIterations;

  return (
    <div
      className={`relative rounded-lg border-2 bg-card shadow-sm px-4 py-3 min-w-[180px] ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-rose-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white dark:!border-gray-800"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/30">
          <Repeat className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">
            Döngü
          </p>
          <p className="text-sm font-semibold text-foreground">{d.label || 'Loop'}</p>
          {maxIter && (
            <p className="text-[10px] text-muted-foreground">Maks: {maxIter}</p>
          )}
        </div>
      </div>

      {/* Body handle (left-bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="body"
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white dark:!border-gray-800 !left-[30%]"
      />
      {/* Done handle (right-bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="done"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white dark:!border-gray-800 !left-[70%]"
      />
      {/* Labels */}
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Gövde</span>
        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Bitti</span>
      </div>
    </div>
  );
};

export default memo(LoopNode);
