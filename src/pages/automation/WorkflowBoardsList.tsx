import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, ListTodo } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import type { WorkflowBoard } from '../../types';
import { workflowBoardsService } from '../../api/services/workflow-boards.service';

export const WorkflowBoardsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<WorkflowBoard[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchBoards = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await workflowBoardsService.list({ isArchived: false });
        if (!cancelled) setBoards(items);
      } catch (err: any) {
        console.error('Failed to load boards', err);
        if (!cancelled) setError(err?.response?.data?.error?.message ?? 'Panolar yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBoards();
    return () => { cancelled = true; };
  }, []);

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const columns = [
    {
      key: 'name',
      title: tr('boards.name', 'Pano Adı'),
      render: (_val: unknown, board: WorkflowBoard) => (
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{board.name}</span>
        </div>
      ),
    },
    {
      key: 'prefix',
      title: tr('boards.prefix', 'Önek'),
      render: (_val: unknown, board: WorkflowBoard) => (
        <Badge variant="secondary">{board.prefix}</Badge>
      ),
    },
    {
      key: 'columns',
      title: tr('boards.columns', 'Kolonlar'),
      render: (_val: unknown, board: WorkflowBoard) => (
        <div className="flex gap-1 flex-wrap">
          {board.columns.map((col) => (
            <span
              key={col.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
              style={col.color ? { borderLeft: `3px solid ${col.color}` } : undefined}
            >
              {col.title}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'members',
      title: tr('boards.member_count', 'Üyeler'),
      render: (_val: unknown, board: WorkflowBoard) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{board.members.length}</span>
        </div>
      ),
    },
    {
      key: 'taskCounter',
      title: tr('boards.task_count', 'Görevler'),
      render: (_val: unknown, board: WorkflowBoard) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <ListTodo className="h-3.5 w-3.5" />
          <span>{board.taskCounter}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: tr('common.created_at', 'Oluşturulma'),
      render: (_val: unknown, board: WorkflowBoard) => (
        <span className="text-muted-foreground text-sm">
          {new Date(board.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title={tr('boards.list_title', 'Panolar')} />
        <div className="mt-4 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title={tr('boards.list_title', 'Panolar')} />
      <DataTable
        columns={columns}
        data={boards}
        loading={loading}
        onRowClick={(board) => navigate(`/automation/boards/${board.id}`)}
        emptyState={{ title: tr('boards.no_boards', 'Henüz pano oluşturulmamış') }}
      />
    </div>
  );
};
