import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { WorkflowBuilder } from '../../components/automation/WorkflowBuilder';
import { TemplateSelector, type WorkflowTemplate } from '../../components/automation/WorkflowTemplates';
import { workflowsService } from '../../api/services/workflows.service';
import type { TriggerType, WorkflowNode, WorkflowEdge } from '../../types';

const DEFAULT_NODES: WorkflowNode[] = [
  {
    id: 'trigger_1',
    type: 'trigger',
    label: 'Tetikleyici',
    position: { x: 250, y: 50 },
    config: {},
  },
];

export const WorkflowsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [step, setStep] = useState<'template' | 'builder'>('template');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    triggerType: 'manual' as TriggerType,
    triggerConfig: {} as Record<string, unknown>,
  });
  const [nodes, setNodes] = useState<WorkflowNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);

  const handleTemplateSelect = useCallback((template: WorkflowTemplate) => {
    setForm({
      name: template.name,
      description: template.description,
      triggerType: template.triggerType,
      triggerConfig: template.triggerConfig,
    });
    setNodes(template.nodes);
    setEdges(template.edges);
    setStep('builder');
  }, []);

  const handleStartBlank = useCallback(() => {
    setStep('builder');
  }, []);

  const handleBuilderChange = useCallback((newNodes: WorkflowNode[], newEdges: WorkflowEdge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const extractTriggerConfig = useCallback(
    (nodeList: WorkflowNode[], fallbackConfig: Record<string, unknown>) => {
      const trigger = nodeList.find((n) => n.type === 'trigger');
      return (trigger?.config as Record<string, unknown> | undefined) ?? fallbackConfig;
    },
    [],
  );

  const handleTriggerTypeChange = useCallback((type: TriggerType) => {
    setForm((prev) => ({ ...prev, triggerType: type }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSaving(true);
      const triggerConfig = extractTriggerConfig(nodes, form.triggerConfig);
      const created = await workflowsService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        triggerType: form.triggerType,
        triggerConfig,
        nodes,
        edges,
      });
      addToast({ type: 'success', message: 'İş akışı oluşturuldu' });
      navigate(`/automation/workflows/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create workflow', err);
      addToast({
        type: 'error',
        message: err?.response?.data?.error?.message ?? 'İş akışı oluşturulamadı',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni İş Akışı"
        subtitle={step === 'template' ? 'Bir şablon seçin veya sıfırdan başlayın' : 'İş akışınızı tasarlayın'}
        action={
          <div className="flex items-center gap-2">
            {step === 'builder' && (
              <Button variant="outline" size="sm" onClick={() => setStep('template')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Şablonlar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate('/automation/workflows')}>
              Geri
            </Button>
          </div>
        }
      />

      {step === 'template' ? (
        <div className="space-y-6">
          {/* Template selection */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Şablondan Başla</h3>
            <TemplateSelector onSelect={handleTemplateSelect} />
          </div>

          {/* Or start blank */}
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Şablon kullanmak istemiyor musunuz?
            </p>
            <Button variant="outline" onClick={handleStartBlank}>
              Sıfırdan Oluştur
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  İş Akışı Adı *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Örn: Yeni Ürün Bildirimi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="İş akışının amacını açıklayın..."
                />
              </div>
            </div>
          </div>

          {/* Workflow Builder */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground mb-3">Workflow Tasarımcı</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sol panelden node'ları sürükleyip bırakın veya tıklayarak ekleyin. Node'lara tıklayarak ayarlarını düzenleyebilirsiniz.
            </p>
            <WorkflowBuilder
              initialNodes={nodes}
              initialEdges={edges}
              triggerType={form.triggerType}
              onTriggerTypeChange={handleTriggerTypeChange}
              onChange={handleBuilderChange}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/automation/workflows')}
            >
              İptal
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
