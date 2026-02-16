import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { BoardColumn, BoardTask } from '../../../types';

interface KanbanColumnProps {
  column: BoardColumn;
  tasks: BoardTask[];
  onTaskClick: (task: BoardTask) => void;
  onAddTask: (columnId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onTaskClick,
  onAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={`flex flex-col w-72 min-w-[18rem] flex-shrink-0 rounded-lg bg-muted/50 ${
        isOver ? 'ring-2 ring-primary/50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          {column.color && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
          )}
          <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5">
            {tasks.length}
            {column.wipLimit ? `/${column.wipLimit}` : ''}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-0.5 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Tasks */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">
            Görev yok
          </div>
        )}
      </div>
    </div>
  );
};
