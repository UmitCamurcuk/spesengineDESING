import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { DataTable } from '../../../components/ui/DataTable';
import type { ReportExecution } from '../../../types';
import { reportsService } from '../../../api/services/reports.service';

interface Props {
  reportId: string;
  onView: (execution: ReportExecution) => void;
}

const STATUS_LABELS: Record<string, string> = {
  running: 'Çalışıyor',
  completed: 'Tamamlandı',
  failed: 'Başarısız',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'outline',
  completed: 'default',
  failed: 'destructive',
};

export const ReportExecutionHistory: React.FC<Props> = ({ reportId, onView }) => {
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        const result = await reportsService.listExecutions(reportId, { limit: 50 });
        if (!cancelled) setExecutions(result.items ?? []);
      } catch (err) {
        console.error('Çalıştırma geçmişi yüklenemedi', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [reportId]);

  const columns = [
    {
      key: 'createdAt',
      title: 'Tarih',
      render: (_val: unknown, exec: ReportExecution) => (
        <span className="text-sm">{new Date(exec.createdAt).toLocaleString('tr-TR')}</span>
      ),
    },
    {
      key: 'triggeredBy',
      title: 'Tetikleyen',
      render: (_val: unknown, exec: ReportExecution) => (
        <Badge variant="secondary">{exec.triggeredBy === 'manual' ? 'Manuel' : 'Zamanlanmış'}</Badge>
      ),
    },
    {
      key: 'status',
      title: 'Durum',
      render: (_val: unknown, exec: ReportExecution) => (
        <Badge variant={STATUS_VARIANTS[exec.status] ?? 'secondary'}>
          {STATUS_LABELS[exec.status] ?? exec.status}
        </Badge>
      ),
    },
    {
      key: 'rowCount',
      title: 'Kayıt',
      render: (_val: unknown, exec: ReportExecution) => (
        <span className="text-sm text-muted-foreground">
          {exec.result?.rowCount ?? '-'}
        </span>
      ),
    },
    {
      key: 'durationMs',
      title: 'Süre',
      render: (_val: unknown, exec: ReportExecution) => (
        <span className="text-sm text-muted-foreground">{exec.durationMs}ms</span>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (_val: unknown, exec: ReportExecution) => (
        exec.status === 'completed' ? (
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            onClick={() => onView(exec)}
            title="Sonuçları Görüntüle"
          >
            <Eye className="h-4 w-4" />
          </button>
        ) : null
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={executions}
      loading={loading}
      emptyState={{ title: 'Çalıştırma geçmişi yok' }}
    />
  );
};
