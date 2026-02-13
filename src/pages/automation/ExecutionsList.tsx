import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import type { WorkflowExecution } from '../../types';
import { workflowExecutionsService } from '../../api/services/workflows.service';

const statusColors: Record<string, string> = {
  running: 'default',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
};

const STATUS_FILTERS = [
  { value: '', label: 'Tümü' },
  { value: 'running', label: 'Çalışıyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'failed', label: 'Başarısız' },
  { value: 'cancelled', label: 'İptal Edildi' },
];

export const ExecutionsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { limit: number; status?: string } = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const { items } = await workflowExecutionsService.list(params);
      setExecutions(items);
    } catch (err: any) {
      console.error('Failed to load executions', err);
      setError(err?.response?.data?.error?.message ?? 'Çalışma geçmişi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const columns = [
    {
      key: 'status',
      title: 'Durum',
      render: (_val: unknown, exec: WorkflowExecution) => (
        <Badge variant={statusColors[exec.status] as any}>{exec.status}</Badge>
      ),
    },
    {
      key: 'triggerType',
      title: 'Tetikleyici',
      render: (_val: unknown, exec: WorkflowExecution) => (
        <span className="text-muted-foreground">{exec.triggerType}</span>
      ),
    },
    {
      key: 'steps',
      title: 'Adım',
      render: (_val: unknown, exec: WorkflowExecution) => (
        <span className="text-muted-foreground">{exec.steps?.length ?? 0} adım</span>
      ),
    },
    {
      key: 'durationMs',
      title: 'Süre',
      render: (_val: unknown, exec: WorkflowExecution) => (
        <span className="text-muted-foreground">
          {exec.durationMs != null ? `${exec.durationMs}ms` : '-'}
        </span>
      ),
    },
    {
      key: 'startedAt',
      title: 'Başlangıç',
      render: (_val: unknown, exec: WorkflowExecution) => (
        <span className="text-muted-foreground text-sm">
          {new Date(exec.startedAt).toLocaleString('tr-TR')}
        </span>
      ),
    },
    {
      key: 'error',
      title: 'Hata',
      render: (_val: unknown, exec: WorkflowExecution) => (
        <span className="text-sm text-error truncate max-w-xs block">
          {exec.error || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Çalışma Geçmişi"
        subtitle="Tüm workflow çalışmalarının geçmişi"
        action={
          <Button variant="outline" size="sm" onClick={fetchExecutions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        }
      />

      {/* Status filter */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <DataTable
        data={executions}
        columns={columns}
        loading={loading}
        onRowClick={(exec) => navigate(`/automation/executions/${exec.id}`)}
        emptyState={{ title: 'Henüz çalışma geçmişi yok.' }}
      />
    </div>
  );
};
