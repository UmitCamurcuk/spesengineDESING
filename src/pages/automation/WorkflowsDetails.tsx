import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Trash2, History, Settings, Save, Copy } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PERMISSIONS } from '../../config/permissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { WorkflowBuilder } from '../../components/automation/WorkflowBuilder';
import type { Workflow, WorkflowExecution, WorkflowNode, WorkflowEdge, TriggerType } from '../../types';
import { workflowsService } from '../../api/services/workflows.service';

const statusColors: Record<string, string> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  archived: 'secondary',
};

export const WorkflowsDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { addToast } = useToast();

  const canUpdate = hasPermission(PERMISSIONS.AUTOMATION.WORKFLOWS.UPDATE);
  const canDelete = hasPermission(PERMISSIONS.AUTOMATION.WORKFLOWS.DELETE);

  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'builder' | 'executions'>('overview');

  // Builder state
  const [builderNodes, setBuilderNodes] = useState<WorkflowNode[]>([]);
  const [builderEdges, setBuilderEdges] = useState<WorkflowEdge[]>([]);
  const [builderTriggerType, setBuilderTriggerType] = useState<TriggerType>('manual');
  const [builderDirty, setBuilderDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [wf, execs] = await Promise.all([
          workflowsService.getById(id),
          workflowsService.listExecutions(id, { limit: 20 }),
        ]);
        if (!cancelled) {
          setWorkflow(wf);
          setExecutions(execs.items);
          setBuilderNodes(wf.nodes);
          setBuilderEdges(wf.edges);
          setBuilderTriggerType(wf.triggerType);
        }
      } catch (err: any) {
        console.error('Failed to load workflow', err);
        addToast({ type: 'error', message: 'Workflow yüklenemedi' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const handleBuilderChange = useCallback((newNodes: WorkflowNode[], newEdges: WorkflowEdge[]) => {
    setBuilderNodes(newNodes);
    setBuilderEdges(newEdges);
    setBuilderDirty(true);
  }, []);

  const handleTriggerTypeChange = useCallback((type: TriggerType) => {
    setBuilderTriggerType(type);
    setBuilderDirty(true);
  }, []);

  const handleSaveBuilder = async () => {
    if (!id || !workflow) return;
    try {
      setSaving(true);
      const updated = await workflowsService.update(id, {
        nodes: builderNodes,
        edges: builderEdges,
        triggerType: builderTriggerType,
      });
      setWorkflow(updated);
      setBuilderDirty(false);
      addToast({ type: 'success', message: 'Workflow kaydedildi' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Kaydetme başarısız' });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!id) return;
    try {
      const updated = await workflowsService.activate(id);
      setWorkflow(updated);
      addToast({ type: 'success', message: 'Workflow aktifleştirildi' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Aktifleştirme başarısız' });
    }
  };

  const handlePause = async () => {
    if (!id) return;
    try {
      const updated = await workflowsService.pause(id);
      setWorkflow(updated);
      addToast({ type: 'success', message: 'Workflow duraklatıldı' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Duraklatma başarısız' });
    }
  };

  const handleTrigger = async () => {
    if (!id) return;
    try {
      await workflowsService.trigger(id);
      addToast({ type: 'success', message: 'Workflow tetiklendi' });
      const execs = await workflowsService.listExecutions(id, { limit: 20 });
      setExecutions(execs.items);
    } catch (err: any) {
      addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Tetikleme başarısız' });
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const duplicated = await workflowsService.duplicate(id);
      addToast({ type: 'success', message: 'Workflow kopyalandı' });
      navigate(`/automation/workflows/${duplicated.id}`);
    } catch (err: any) {
      addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Kopyalama başarısız' });
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Bu iş akışını silmek istediğinize emin misiniz?')) return;
    try {
      await workflowsService.delete(id);
      addToast({ type: 'success', message: 'Workflow silindi' });
      navigate('/automation/workflows');
    } catch (err: any) {
      addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Silme başarısız' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Workflow bulunamadı</p>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Genel Bilgiler', icon: Settings },
    { key: 'builder', label: 'Workflow Builder', icon: Settings },
    { key: 'executions', label: 'Çalışma Geçmişi', icon: History },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={workflow.name}
        subtitle={workflow.description || 'Workflow detayları'}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/automation/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            {canUpdate && workflow.status !== 'active' && (
              <Button size="sm" onClick={handleActivate}>
                <Play className="h-4 w-4 mr-2" />
                Aktifleştir
              </Button>
            )}
            {canUpdate && workflow.status === 'active' && (
              <>
                <Button size="sm" onClick={handleTrigger}>
                  <Play className="h-4 w-4 mr-2" />
                  Tetikle
                </Button>
                <Button variant="outline" size="sm" onClick={handlePause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Duraklat
                </Button>
              </>
            )}
            {canUpdate && (
              <Button variant="outline" size="sm" onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Kopyala
              </Button>
            )}
            {canDelete && workflow.status !== 'active' && (
              <Button
                variant="outline"
                size="sm"
                className="border-error text-error hover:bg-error/5"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            )}
          </div>
        }
      />

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <Badge variant={statusColors[workflow.status] as any}>{workflow.status}</Badge>
        <span className="text-sm text-muted-foreground">
          Tetikleyici: {workflow.triggerType} | v{workflow.version} | {workflow.nodes.length} node
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Detaylar</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">İsim</dt>
                <dd className="text-sm font-medium text-foreground">{workflow.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Açıklama</dt>
                <dd className="text-sm text-foreground">{workflow.description || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Tetikleyici</dt>
                <dd className="text-sm text-foreground">{workflow.triggerType}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Oluşturulma</dt>
                <dd className="text-sm text-foreground">
                  {new Date(workflow.createdAt).toLocaleString('tr-TR')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Son Güncelleme</dt>
                <dd className="text-sm text-foreground">
                  {new Date(workflow.updatedAt).toLocaleString('tr-TR')}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">İstatistikler</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Node Sayısı</dt>
                <dd className="text-sm font-medium text-foreground">{workflow.nodes.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Edge Sayısı</dt>
                <dd className="text-sm font-medium text-foreground">{workflow.edges.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Etiketler</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {(workflow.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                  {(!workflow.tags || workflow.tags.length === 0) && (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="space-y-4">
          {canUpdate && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sol panelden node'ları sürükleyip bırakın. Node'lara tıklayarak ayarlarını düzenleyebilirsiniz.
              </p>
              <Button onClick={handleSaveBuilder} disabled={saving || !builderDirty}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Kaydediliyor...' : builderDirty ? 'Değişiklikleri Kaydet' : 'Kaydedildi'}
              </Button>
            </div>
          )}
          <WorkflowBuilder
            initialNodes={builderNodes}
            initialEdges={builderEdges}
            triggerType={builderTriggerType}
            onTriggerTypeChange={handleTriggerTypeChange}
            onChange={handleBuilderChange}
            readOnly={!canUpdate}
          />
        </div>
      )}

      {activeTab === 'executions' && (
        <div className="rounded-lg border border-border bg-card">
          {executions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Henüz çalışma geçmişi yok
            </div>
          ) : (
            <div className="divide-y divide-border">
              {executions.map((exec) => (
                <div
                  key={exec.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/automation/executions/${exec.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        exec.status === 'completed'
                          ? 'success'
                          : exec.status === 'failed'
                          ? 'destructive'
                          : exec.status === 'running'
                          ? 'default'
                          : ('secondary' as any)
                      }
                    >
                      {exec.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {exec.steps.length} adım
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(exec.startedAt).toLocaleString('tr-TR')}
                    {exec.durationMs != null && (
                      <span className="ml-2">({exec.durationMs}ms)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
