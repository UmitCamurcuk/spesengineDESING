import React from 'react';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import type { WorkflowNodeConfig } from '../../../types';

interface ScriptConfigFormProps {
  config: WorkflowNodeConfig;
  onChange: (config: WorkflowNodeConfig) => void;
}

export const ScriptConfigForm: React.FC<ScriptConfigFormProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">JavaScript Kodu</label>
        <Textarea
          value={config.scriptCode ?? ''}
          onChange={(e) => onChange({ ...config, scriptCode: e.target.value })}
          rows={12}
          placeholder={`// Trigger verisine erişim:\n// trigger.itemId, trigger.eventType\n\n// Önceki step çıktıları:\n// steps.nodeId.field\n\n// Değişkenler (okuma/yazma):\n// vars.myVar = "value";\n\n// Sonuç çıktısı:\n// output.result = "done";`}
          className="font-mono text-xs"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Zaman Aşımı (ms)</label>
        <Input
          type="number"
          value={config.scriptTimeout ?? 5000}
          onChange={(e) =>
            onChange({ ...config, scriptTimeout: parseInt(e.target.value, 10) || 5000 })
          }
          min={100}
          max={30000}
        />
        <p className="text-xs text-muted-foreground mt-1">Maksimum 30.000ms (30 saniye).</p>
      </div>

      {/* Quick reference */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
        <p className="text-xs font-semibold text-foreground">API Referansı</p>
        <div className="text-xs text-muted-foreground space-y-1 font-mono">
          <p><span className="text-emerald-600 dark:text-emerald-400">trigger</span> - Tetikleyici verisi</p>
          <p><span className="text-emerald-600 dark:text-emerald-400">steps</span>.nodeId - Step çıktıları</p>
          <p><span className="text-emerald-600 dark:text-emerald-400">vars</span>.name - Değişkenler (r/w)</p>
          <p><span className="text-emerald-600 dark:text-emerald-400">output</span>.key - Çıktı verisi</p>
          <p><span className="text-emerald-600 dark:text-emerald-400">console</span>.log() - Log yazdır</p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          JSON, Math, Date, Array, Object, String, Number, RegExp, Map, Set erişilebilir.
        </p>
      </div>
    </div>
  );
};
