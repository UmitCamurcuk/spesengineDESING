import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { TriggerConfigForm } from './TriggerConfigForm';
import { ActionConfigForm } from './ActionConfigForm';
import { ConditionConfigForm } from './ConditionConfigForm';
import { ScriptConfigForm } from './ScriptConfigForm';
import { SwitchConfigForm } from './SwitchConfigForm';
import { LoopConfigForm } from './LoopConfigForm';
import type { WorkflowNodeType, WorkflowNodeConfig, TriggerType } from '../../../types';

interface NodeConfigPanelProps {
  nodeId: string;
  nodeType: WorkflowNodeType;
  label: string;
  config: WorkflowNodeConfig;
  triggerType: TriggerType;
  onLabelChange: (label: string) => void;
  onConfigChange: (config: WorkflowNodeConfig) => void;
  onTriggerTypeChange: (type: TriggerType) => void;
  onDelete: () => void;
  onClose: () => void;
}

const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  trigger: 'Tetikleyici',
  condition: 'Koşul',
  action: 'Aksiyon',
  delay: 'Bekleme',
  script: 'Script',
  note: 'Not',
  switch: 'Switch',
  loop: 'Döngü',
};

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  nodeId,
  nodeType,
  label,
  config,
  triggerType,
  onLabelChange,
  onConfigChange,
  onTriggerTypeChange,
  onDelete,
  onClose,
}) => {
  return (
    <div className="absolute top-0 right-0 h-full w-[360px] bg-card border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {NODE_TYPE_LABELS[nodeType]} Ayarları
          </p>
          <p className="text-sm font-semibold text-foreground">{label || nodeId}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Label */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Etiket</label>
          <Input
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="Node adı"
          />
        </div>

        {/* Type-specific config */}
        {nodeType === 'trigger' && (
          <TriggerConfigForm
            triggerType={triggerType}
            config={config}
            onChange={onConfigChange}
            onTriggerTypeChange={onTriggerTypeChange}
          />
        )}

        {nodeType === 'action' && (
          <ActionConfigForm config={config} onChange={onConfigChange} />
        )}

        {nodeType === 'condition' && (
          <ConditionConfigForm config={config} onChange={onConfigChange} />
        )}

        {nodeType === 'delay' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bekleme Süresi (ms)</label>
              <Input
                type="number"
                value={config.delayMs ?? 0}
                onChange={(e) =>
                  onConfigChange({ ...config, delayMs: parseInt(e.target.value, 10) || 0 })
                }
                min={0}
                max={300000}
                placeholder="5000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maksimum 300.000ms (5 dakika). 0 = bekleme yok.
              </p>
            </div>
            <div className="flex gap-2">
              {[1000, 5000, 10000, 30000, 60000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => onConfigChange({ ...config, delayMs: ms })}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
                >
                  {ms >= 60000 ? `${ms / 60000}dk` : `${ms / 1000}s`}
                </button>
              ))}
            </div>
          </div>
        )}

        {nodeType === 'script' && (
          <ScriptConfigForm config={config} onChange={onConfigChange} />
        )}

        {nodeType === 'switch' && (
          <SwitchConfigForm config={config} onChange={onConfigChange} />
        )}

        {nodeType === 'loop' && (
          <LoopConfigForm config={config} onChange={onConfigChange} />
        )}

        {nodeType === 'note' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Not İçeriği</label>
              <Textarea
                value={config.noteContent ?? ''}
                onChange={(e) => onConfigChange({ ...config, noteContent: e.target.value })}
                rows={5}
                placeholder="Canvas üzerine not yazın..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Renk</label>
              <div className="flex gap-2">
                {(['yellow', 'blue', 'green', 'pink'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => onConfigChange({ ...config, noteColor: color })}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      (config.noteColor ?? 'yellow') === color
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border'
                    } ${
                      color === 'yellow' ? 'bg-yellow-200 dark:bg-yellow-800' :
                      color === 'blue' ? 'bg-blue-200 dark:bg-blue-800' :
                      color === 'green' ? 'bg-green-200 dark:bg-green-800' :
                      'bg-pink-200 dark:bg-pink-800'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                Not node'ları çalıştırılmaz. Canvas üzerinde yorum bırakmak için kullanılır.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {nodeType !== 'trigger' && (
        <div className="px-4 py-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-error text-error hover:bg-error/5"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Node'u Sil
          </Button>
        </div>
      )}
    </div>
  );
};
