import React, { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import type { BoardColumn, BoardTask } from '../../../types';

interface KanbanBoardProps {
  columns: BoardColumn[];
  tasks: BoardTask[];
  onTaskClick: (task: BoardTask) => void;
  onAddTask: (columnId: string) => void;
  onTaskMove: (taskId: string, targetColumnId: string, targetOrder: number) => void;
  onMoveColumn?: (colId: string, direction: 'left' | 'right') => void;
  onRemoveColumn?: (colId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasks,
  onTaskClick,
  onAddTask,
  onTaskMove,
  onMoveColumn,
  onRemoveColumn,
}) => {
  const [activeTask, setActiveTask] = React.useState<BoardTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, BoardTask[]>();
    columns.forEach((col) => map.set(col.id, []));
    tasks.forEach((task) => {
      const list = map.get(task.columnId);
      if (list) list.push(task);
    });
    // Sort each column by order
    map.forEach((list) => list.sort((a, b) => a.order - b.order));
    return map;
  }, [columns, tasks]);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback is handled by useDroppable in KanbanColumn
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine target column
    let targetColumnId: string;
    const overData = over.data.current;

    if (overData?.type === 'task') {
      // Dropped on another task
      const overTask = overData.task as BoardTask;
      targetColumnId = overTask.columnId;
    } else {
      // Dropped on a column (droppable area)
      targetColumnId = over.id as string;
    }

    // Calculate order
    const targetTasks = tasksByColumn.get(targetColumnId) ?? [];
    let targetOrder: number;

    if (overData?.type === 'task') {
      const overTask = overData.task as BoardTask;
      const overIndex = targetTasks.findIndex((t) => t.id === overTask.id);
      targetOrder = overIndex >= 0 ? overIndex : targetTasks.length;
    } else {
      targetOrder = targetTasks.length;
    }

    // Only move if something changed
    if (task.columnId !== targetColumnId || task.order !== targetOrder) {
      onTaskMove(taskId, targetColumnId, targetOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 pb-4 min-h-[300px]">
        {sortedColumns.map((column, index) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn.get(column.id) ?? []}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            isFirst={index === 0}
            isLast={index === sortedColumns.length - 1}
            onMoveColumn={onMoveColumn}
            onRemoveColumn={onRemoveColumn}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="rotate-3 opacity-90">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
