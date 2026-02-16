import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { PriorityBadge } from './PriorityBadge';
import type { BoardTask } from '../../../types';

interface TaskCardProps {
  task: BoardTask;
  onClick: (task: BoardTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeColors: Record<string, string> = {
    task: 'default',
    bug: 'destructive',
    story: 'success',
    epic: 'secondary',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2"
      onClick={() => onClick(task)}
    >
      {/* Task key + priority */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">{task.taskKey}</span>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground line-clamp-2">{task.title}</p>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{task.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: type, due date, assignee */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Badge variant={typeColors[task.type] as any} className="text-[10px] px-1.5 py-0">
            {task.type}
          </Badge>
          {task.dueDate && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {task.assigneeId && (
          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};
