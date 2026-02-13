import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pause, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import type { Workflow } from '../../types';
import { workflowsService } from '../../api/services/workflows.service';

const statusColors: Record<string, string> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  archived: 'secondary',
};

const triggerLabels: Record<string, string> = {
  event: 'Event',
  schedule: 'Zamanlama',
  manual: 'Manuel',
  webhook: 'Webhook',
};

export const WorkflowsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.AUTOMATION.WORKFLOWS.CREATE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items } = await workflowsService.list({ limit: 200 });
        if (!cancelled) setWorkflows(items);
      } catch (err: any) {
        console.error('Failed to load workflows', err);
        if (!cancelled) {
          setError(err?.response?.data?.error?.message ?? 'Workflow listesi yüklenemedi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWorkflows();
    return () => { cancelled = true; };
  }, []);

  const columns = [
    {
      key: 'name',
      title: t('common.name') ?? 'İsim',
      render: (_val: unknown, workflow: Workflow) => (
        <span className="font-medium text-foreground">{workflow.name}</span>
      ),
    },
    {
      key: 'status',
      title: t('common.status') ?? 'Durum',
      render: (_val: unknown, workflow: Workflow) => (
        <Badge variant={statusColors[workflow.status] as any}>
          {workflow.status}
        </Badge>
      ),
    },
    {
      key: 'triggerType',
      title: 'Tetikleyici',
      render: (_val: unknown, workflow: Workflow) => (
        <span className="text-muted-foreground">
          {triggerLabels[workflow.triggerType] ?? workflow.triggerType}
        </span>
      ),
    },
    {
      key: 'nodes',
      title: 'Node Sayısı',
      render: (_val: unknown, workflow: Workflow) => (
        <span className="text-muted-foreground">{workflow.nodes?.length ?? 0}</span>
      ),
    },
    {
      key: 'version',
      title: 'Versiyon',
      render: (_val: unknown, workflow: Workflow) => (
        <span className="text-muted-foreground">v{workflow.version}</span>
      ),
    },
    {
      key: 'updatedAt',
      title: t('common.updated_at') ?? 'Güncellenme',
      render: (_val: unknown, workflow: Workflow) => (
        <span className="text-muted-foreground text-sm">
          {new Date(workflow.updatedAt).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="İş Akışları"
        subtitle="Otomasyon iş akışlarını yönetin"
        action={
          canCreate ? (
            <Button onClick={() => navigate('/automation/workflows/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni İş Akışı
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <DataTable
        data={workflows}
        columns={columns}
        loading={loading}
        onRowClick={(workflow) => navigate(`/automation/workflows/${workflow.id}`)}
        emptyState={{ title: 'Henüz iş akışı oluşturulmamış.' }}
      />
    </div>
  );
};
