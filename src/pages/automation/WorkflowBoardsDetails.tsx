import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings,
  Plus,
  Users,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskDetailModal } from './components/TaskDetailModal';
import type { WorkflowBoard, BoardTask } from '../../types';
import { workflowBoardsService } from '../../api/services/workflow-boards.service';

export const WorkflowBoardsDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [board, setBoard] = useState<WorkflowBoard | null>(null);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task detail modal
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);

  // Quick add task
  const [addingInColumn, setAddingInColumn] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  // Column management
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      return value && value !== key ? value : fallback;
    },
    [t],
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadBoard = async () => {
      try {
        setLoading(true);
        setError(null);
        const [boardData, tasksData] = await Promise.all([
          workflowBoardsService.getById(id),
          workflowBoardsService.listTasks(id, { isArchived: false }),
        ]);
        if (cancelled) return;
        setBoard(boardData);
        setTasks(tasksData);
      } catch (err: any) {
        console.error('Failed to load board', err);
        if (!cancelled) setError(err?.response?.data?.error?.message ?? 'Pano yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBoard();
    return () => { cancelled = true; };
  }, [id]);

  const handleTaskClick = (task: BoardTask) => {
    setSelectedTask(task);
  };

  const handleAddTask = (columnId: string) => {
    setAddingInColumn(columnId);
    setQuickTitle('');
  };

  const handleQuickAdd = async () => {
    if (!board || !addingInColumn || !quickTitle.trim()) return;
    try {
      const newTask = await workflowBoardsService.createTask(board.id, {
        title: quickTitle.trim(),
        columnId: addingInColumn,
      });
      setTasks((prev) => [...prev, newTask]);
      // Update board task counter
      setBoard((prev) => prev ? { ...prev, taskCounter: prev.taskCounter + 1 } : prev);
      setAddingInColumn(null);
      setQuickTitle('');
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleTaskMove = async (taskId: string, targetColumnId: string, targetOrder: number) => {
    if (!board) return;
    try {
      const updated = await workflowBoardsService.moveTask(board.id, taskId, targetColumnId, targetOrder);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Failed to move task', err);
    }
  };

  const handleTaskUpdated = (updated: BoardTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  const handleAddColumn = async () => {
    if (!board || !newColumnTitle.trim()) return;
    try {
      const updated = await workflowBoardsService.addColumn(board.id, {
        title: newColumnTitle.trim(),
      });
      setBoard(updated);
      setNewColumnTitle('');
      setShowColumnForm(false);
    } catch (err) {
      console.error('Failed to add column', err);
    }
  };

  const handleArchiveBoard = async () => {
    if (!board) return;
    if (!confirm(tr('boards.archive_confirm', 'Bu panoyu arşivlemek istediğinizden emin misiniz?'))) return;
    try {
      await workflowBoardsService.archive(board.id);
      navigate('/automation/boards');
    } catch (err) {
      console.error('Failed to archive board', err);
    }
  };

  if (!id) return null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-6">
        <PageHeader title="Pano" />
        <div className="mt-4 text-red-500">{error ?? 'Pano bulunamadı'}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/automation/boards')}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{board.name}</h1>
              {board.description && (
                <p className="text-sm text-muted-foreground">{board.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{board.members.length}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowColumnForm(!showColumnForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {tr('boards.column.add', 'Kolon Ekle')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleArchiveBoard}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add column form */}
        {showColumnForm && (
          <div className="mt-3 flex items-center gap-2 max-w-md">
            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder={tr('boards.column.title', 'Kolon Adı')}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              autoFocus
            />
            <Button size="sm" onClick={handleAddColumn} disabled={!newColumnTitle.trim()}>
              {tr('common.add', 'Ekle')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowColumnForm(false)}>
              {tr('common.cancel', 'İptal')}
            </Button>
          </div>
        )}
      </div>

      {/* Quick add task inline */}
      {addingInColumn && (
        <div className="px-6 py-2 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2 max-w-md">
            <Input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder={tr('boards.task.title', 'Görev başlığı')}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              autoFocus
            />
            <Button size="sm" onClick={handleQuickAdd} disabled={!quickTitle.trim()}>
              {tr('common.add', 'Ekle')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAddingInColumn(null)}>
              {tr('common.cancel', 'İptal')}
            </Button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard
          columns={board.columns}
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          onTaskMove={handleTaskMove}
        />
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          boardId={board.id}
          columns={board.columns}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
};
