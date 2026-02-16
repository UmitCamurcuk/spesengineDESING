import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Trash2,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { BoardMembersPanel } from './components/BoardMembersPanel';
import { BoardSettingsPanel } from './components/BoardSettingsPanel';
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

  // Members panel
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  // Settings panel (task types management)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

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

  const handleRemoveColumn = async (colId: string) => {
    if (!board) return;
    const col = board.columns.find((c) => c.id === colId);
    if (!col) return;
    const colTasks = tasks.filter((t) => t.columnId === colId);
    if (colTasks.length > 0) {
      alert(tr('boards.column.has_tasks', 'Bu kolonda görevler var. Önce görevleri taşıyın.'));
      return;
    }
    if (!confirm(tr('boards.column.delete_confirm', `"${col.title}" kolonunu silmek istediğinizden emin misiniz?`))) return;
    try {
      const updated = await workflowBoardsService.removeColumn(board.id, colId);
      setBoard(updated);
    } catch (err) {
      console.error('Failed to remove column', err);
    }
  };

  const handleMoveColumn = async (colId: string, direction: 'left' | 'right') => {
    if (!board) return;
    const sorted = [...board.columns].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((c) => c.id === colId);
    if (idx < 0) return;
    if (direction === 'left' && idx === 0) return;
    if (direction === 'right' && idx === sorted.length - 1) return;

    const newOrder = [...sorted];
    const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    try {
      const updated = await workflowBoardsService.reorderColumns(
        board.id,
        newOrder.map((c) => c.id),
      );
      setBoard(updated);
    } catch (err) {
      console.error('Failed to reorder columns', err);
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

  const handleBoardUpdated = (updated: WorkflowBoard) => {
    setBoard(updated);
  };

  if (!id) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="space-y-4">
        <PageHeader title={tr('boards.board', 'Pano')} />
        <div className="text-error text-sm">{error ?? 'Pano bulunamadı'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={board.name}
        subtitle={board.description}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/automation/boards')}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {tr('common.back', 'Geri')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMembersPanel(true)}
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              {tr('boards.members', 'Üyeler')} ({board.members.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowColumnForm(!showColumnForm)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {tr('boards.column.add', 'Kolon Ekle')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSettingsPanel(true)}
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              {tr('common.settings', 'Ayarlar')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleArchiveBoard}
              className="text-error hover:text-error-hover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      {/* Add column form */}
      {showColumnForm && (
        <div className="flex items-center gap-2 max-w-md">
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

      {/* Quick add task inline */}
      {addingInColumn && (
        <div className="flex items-center gap-2 max-w-md p-3 bg-muted/50 rounded-lg border border-border">
          <Input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={tr('boards.task.title', 'Görev başlığı')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd();
              if (e.key === 'Escape') setAddingInColumn(null);
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleQuickAdd} disabled={!quickTitle.trim()}>
            {tr('common.add', 'Ekle')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAddingInColumn(null)}>
            {tr('common.cancel', 'İptal')}
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-2">
        <KanbanBoard
          columns={board.columns}
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          onTaskMove={handleTaskMove}
          onMoveColumn={handleMoveColumn}
          onRemoveColumn={handleRemoveColumn}
        />
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          boardId={board.id}
          columns={board.columns}
          taskTypes={board.taskTypes}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Members Panel */}
      {showMembersPanel && (
        <BoardMembersPanel
          board={board}
          onClose={() => setShowMembersPanel(false)}
          onBoardUpdated={handleBoardUpdated}
        />
      )}

      {/* Settings Panel */}
      {showSettingsPanel && (
        <BoardSettingsPanel
          board={board}
          onClose={() => setShowSettingsPanel(false)}
          onBoardUpdated={handleBoardUpdated}
        />
      )}
    </div>
  );
};
