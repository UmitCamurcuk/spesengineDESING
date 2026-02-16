import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Tag,
  User,
  Clock,
  MessageSquare,
  Activity as ActivityIcon,
  ListTodo,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { PriorityBadge } from './PriorityBadge';
import type {
  BoardTask,
  BoardColumn,
  BoardActivity,
  TaskPriority,
  TaskType,
} from '../../../types';
import { workflowBoardsService } from '../../../api/services/workflow-boards.service';

interface TaskDetailModalProps {
  task: BoardTask;
  boardId: string;
  columns: BoardColumn[];
  open: boolean;
  onClose: () => void;
  onTaskUpdated: (task: BoardTask) => void;
}

const priorityOptions = [
  { value: 'lowest', label: 'En Düşük' },
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
  { value: 'highest', label: 'En Yüksek' },
];

const typeOptions = [
  { value: 'task', label: 'Görev' },
  { value: 'bug', label: 'Hata' },
  { value: 'story', label: 'Hikaye' },
  { value: 'epic', label: 'Epik' },
];

type ActiveTab = 'comments' | 'activity';

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task: initialTask,
  boardId,
  columns,
  open,
  onClose,
  onTaskUpdated,
}) => {
  const [task, setTask] = useState(initialTask);
  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask.priority);
  const [taskType, setTaskType] = useState<TaskType>(initialTask.type);
  const [columnId, setColumnId] = useState(initialTask.columnId);
  const [dueDate, setDueDate] = useState(initialTask.dueDate ?? '');
  const [saving, setSaving] = useState(false);

  // Comments & Activity
  const [activeTab, setActiveTab] = useState<ActiveTab>('comments');
  const [comments, setComments] = useState<BoardActivity[]>([]);
  const [activities, setActivities] = useState<BoardActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    setTask(initialTask);
    setTitle(initialTask.title);
    setDescription(initialTask.description ?? '');
    setPriority(initialTask.priority);
    setTaskType(initialTask.type);
    setColumnId(initialTask.columnId);
    setDueDate(initialTask.dueDate ?? '');
  }, [initialTask]);

  useEffect(() => {
    if (!open) return;
    loadCommentsAndActivity();
  }, [open, initialTask.id]);

  const loadCommentsAndActivity = async () => {
    setLoadingComments(true);
    try {
      const [cmts, acts] = await Promise.all([
        workflowBoardsService.listComments(boardId, task.id),
        workflowBoardsService.getTaskActivity(boardId, task.id),
      ]);
      setComments(cmts);
      setActivities(acts);
    } catch (err) {
      console.error('Failed to load comments/activity', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSave = async () => {
    const changes: Record<string, unknown> = {};
    if (title !== task.title) changes.title = title;
    if (description !== (task.description ?? '')) changes.description = description;
    if (priority !== task.priority) changes.priority = priority;
    if (taskType !== task.type) changes.type = taskType;
    if (dueDate !== (task.dueDate ?? '')) changes.dueDate = dueDate || null;

    if (Object.keys(changes).length === 0 && columnId === task.columnId) return;

    setSaving(true);
    try {
      let updated: BoardTask;
      if (columnId !== task.columnId) {
        // Move task to new column
        updated = await workflowBoardsService.moveTask(boardId, task.id, columnId, task.order);
        if (Object.keys(changes).length > 0) {
          updated = await workflowBoardsService.updateTask(boardId, task.id, changes);
        }
      } else {
        updated = await workflowBoardsService.updateTask(boardId, task.id, changes);
      }
      setTask(updated);
      onTaskUpdated(updated);
    } catch (err) {
      console.error('Failed to update task', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = await workflowBoardsService.addComment(boardId, task.id, newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-2xl bg-background shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground">{task.taskKey}</span>
            <PriorityBadge priority={priority} showLabel />
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold border-0 p-0 focus:ring-0 bg-transparent"
                onBlur={handleSave}
              />
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status / Column */}
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <ListTodo className="h-3 w-3" /> Durum
                </label>
                <Select
                  value={columnId}
                  onChange={(e) => { setColumnId(e.target.value); }}
                  options={columns.map((c) => ({ value: c.id, label: c.title }))}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  Öncelik
                </label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  options={priorityOptions}
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Tag className="h-3 w-3" /> Tip
                </label>
                <Select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  options={typeOptions}
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3" /> Bitiş Tarihi
                </label>
                <Input
                  type="date"
                  value={dueDate ? dueDate.split('T')[0] : ''}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Save button */}
            <div>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Açıklama</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Görev açıklaması..."
                onBlur={handleSave}
              />
            </div>

            {/* Labels */}
            {task.labels.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Etiketler</label>
                <div className="flex flex-wrap gap-1">
                  {task.labels.map((label) => (
                    <Badge key={label} variant="secondary">{label}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs: Comments / Activity */}
            <div className="border-t border-border pt-4">
              <div className="flex gap-4 mb-4">
                <button
                  className={`flex items-center gap-1 text-sm pb-1 ${
                    activeTab === 'comments'
                      ? 'text-primary border-b-2 border-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('comments')}
                >
                  <MessageSquare className="h-4 w-4" />
                  Yorumlar ({comments.length})
                </button>
                <button
                  className={`flex items-center gap-1 text-sm pb-1 ${
                    activeTab === 'activity'
                      ? 'text-primary border-b-2 border-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('activity')}
                >
                  <ActivityIcon className="h-4 w-4" />
                  Aktivite ({activities.length})
                </button>
              </div>

              {activeTab === 'comments' && (
                <div className="space-y-3">
                  {/* New comment */}
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Yorum yazın..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="self-end"
                    >
                      Gönder
                    </Button>
                  </div>
                  {/* Comment list */}
                  {loadingComments ? (
                    <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">Henüz yorum yok</div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{comment.actorId}</span>
                          <span>&middot;</span>
                          <span>{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-foreground">
                          {(comment.detail as Record<string, unknown>)?.content as string}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-2">
                  {loadingComments ? (
                    <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                  ) : activities.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">Henüz aktivite yok</div>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
                        <div className="mt-0.5">
                          <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{act.action.replace('task.', '').replace('board.', '')}</span>
                            {act.detail && Object.keys(act.detail).length > 0 && (
                              <span className="text-muted-foreground">
                                {' '}{formatActivityDetail(act)}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(act.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatActivityDetail(act: BoardActivity): string {
  const d = act.detail;
  if (act.action === 'task.moved') {
    return `${d.fromColumnTitle ?? ''} → ${d.toColumnTitle ?? ''}`;
  }
  if (act.action === 'task.assigned') {
    return `→ ${d.to ?? 'atandı'}`;
  }
  if (act.action === 'task.commented') {
    const content = (d.content as string) ?? '';
    return content.length > 60 ? content.slice(0, 60) + '...' : content;
  }
  return '';
}
