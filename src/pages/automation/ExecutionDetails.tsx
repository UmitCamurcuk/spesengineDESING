import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, XCircle, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { WorkflowExecution } from '../../types';
import { workflowExecutionsService } from '../../api/services/workflows.service';

const statusIcons: Record<string, React.ElementType> = {
  completed: CheckCircle,
  failed: AlertTriangle,
  running: Clock,
  cancelled: XCircle,
  pending: Clock,
  skipped: XCircle,
};

const statusColors: Record<string, string> = {
  running: 'default',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
  pending: 'default',
  skipped: 'secondary',
};

export const ExecutionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { hasPermission } = useAuth();
  const canCancel = hasPermission(PERMISSIONS.AUTOMATION.WORKFLOW_EXECUTIONS.CANCEL);

  const [loading, setLoading] = useState(true);
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchExecution = async () => {
      try {
        setLoading(true);
        const data = await workflowExecutionsService.getById(id);
        if (!cancelled) setExecution(data);
      } catch (err: any) {
        console.error('Failed to load execution', err);
        addToast({ type: 'error', message: 'Execution yüklenemedi' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchExecution();
    return () => { cancelled = true; };
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    try {
      const updated = await workflowExecutionsService.cancel(id);
      setExecution(updated);
      addToast({ type: 'success', message: 'Execution iptal edildi' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'İptal başarısız' });
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    try {
      const newExecution = await workflowExecutionsService.retry(id);
      addToast({ type: 'success', message: 'Yeniden çalıştırıldı' });
      navigate(`/automation/executions/${newExecution.id}`);
    } catch (err: any) {
      addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Yeniden deneme başarısız' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Execution bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Execution #${execution.id.slice(-8)}`}
        subtitle={`Workflow v${execution.workflowVersion}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            {canCancel && execution.status === 'running' && (
              <Button
                variant="outline"
                size="sm"
                className="border-error text-error hover:bg-error/5"
                onClick={handleCancel}
              >
                <XCircle className="h-4 w-4 mr-2" />
                İptal Et
              </Button>
            )}
            {(execution.status === 'failed' || execution.status === 'cancelled') && (
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Yeniden Dene
              </Button>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Durum</p>
          <Badge variant={statusColors[execution.status] as any} className="mt-1">
            {execution.status}
          </Badge>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Tetikleyici</p>
          <p className="text-sm font-medium text-foreground mt-1">{execution.triggerType}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Süre</p>
          <p className="text-sm font-medium text-foreground mt-1">
            {execution.durationMs != null ? `${execution.durationMs}ms` : 'Devam ediyor'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Başlangıç</p>
          <p className="text-sm font-medium text-foreground mt-1">
            {new Date(execution.startedAt).toLocaleString('tr-TR')}
          </p>
        </div>
      </div>

      {/* Error */}
      {execution.error && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <p className="text-sm font-medium text-error">Hata</p>
          <p className="text-sm text-error/80 mt-1">{execution.error}</p>
        </div>
      )}

      {/* Steps */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Adımlar ({execution.steps.length})</h3>
        </div>
        {execution.steps.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            Henüz adım yok
          </div>
        ) : (
          <div className="divide-y divide-border">
            {execution.steps.map((step, index) => {
              const Icon = statusIcons[step.status] ?? Clock;
              return (
                <div key={`${step.nodeId}-${index}`} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-shrink-0">
                    <Icon
                      className={`h-5 w-5 ${
                        step.status === 'completed'
                          ? 'text-success'
                          : step.status === 'failed'
                          ? 'text-error'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.nodeLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.nodeType} | {step.nodeId}
                    </p>
                  </div>
                  <Badge variant={statusColors[step.status] as any}>{step.status}</Badge>
                  {step.durationMs != null && (
                    <span className="text-xs text-muted-foreground">{step.durationMs}ms</span>
                  )}
                  {step.error && (
                    <span className="text-xs text-error truncate max-w-xs">{step.error}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
