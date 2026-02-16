import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, ChevronLeft, ChevronRight, Trash2, MoreHorizontal } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { BoardColumn, BoardTask } from '../../../types';

interface KanbanColumnProps {
  column: BoardColumn;
  tasks: BoardTask[];
  onTaskClick: (task: BoardTask) => void;
  onAddTask: (columnId: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveColumn?: (colId: string, direction: 'left' | 'right') => void;
  onRemoveColumn?: (colId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  isFirst = false,
  isLast = false,
  onMoveColumn,
  onRemoveColumn,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`flex flex-col w-64 min-w-[16rem] flex-shrink-0 rounded-lg bg-muted/50 ${
        isOver ? 'ring-2 ring-primary/50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 min-w-0">
          {column.color && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
          )}
          <h3 className="text-xs font-semibold text-foreground truncate">{column.title}</h3>
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 flex-shrink-0">
            {tasks.length}
            {column.wipLimit ? `/${column.wipLimit}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Column management toggle */}
          {(onMoveColumn || onRemoveColumn) && (
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-0.5 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onAddTask(column.id)}
            className="p-0.5 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Column actions bar */}
      {showActions && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-muted/80 border-b border-border">
          <div className="flex items-center gap-1">
            {onMoveColumn && !isFirst && (
              <button
                onClick={() => onMoveColumn(column.id, 'left')}
                className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="Sola taşı"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
            )}
            {onMoveColumn && !isLast && (
              <button
                onClick={() => onMoveColumn(column.id, 'right')}
                className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="Sağa taşı"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
          {onRemoveColumn && (
            <button
              onClick={() => onRemoveColumn(column.id)}
              className="p-1 rounded hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
              title="Kolonu sil"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Tasks */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-1.5 space-y-1.5 min-h-[80px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center text-[10px] text-muted-foreground py-6">
            Görev yok
          </div>
        )}
      </div>
    </div>
  );
};
