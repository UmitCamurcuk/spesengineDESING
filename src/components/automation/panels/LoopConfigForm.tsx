import React from 'react';
import { Input } from '../../ui/Input';
import type { WorkflowNodeConfig } from '../../../types';

interface LoopConfigFormProps {
  config: WorkflowNodeConfig;
  onChange: (config: WorkflowNodeConfig) => void;
}

export const LoopConfigForm: React.FC<LoopConfigFormProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Dizi Expression
        </label>
        <Input
          value={config.loopExpression ?? ''}
          onChange={(e) => onChange({ ...config, loopExpression: e.target.value })}
          placeholder='{{steps.find_items.items}}'
        />
        <p className="text-xs text-muted-foreground mt-1">
          JSON array veya virgülle ayrılmış değerler. Template destekler.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Eleman Değişken Adı
        </label>
        <Input
          value={config.loopItemVariable ?? 'item'}
          onChange={(e) => onChange({ ...config, loopItemVariable: e.target.value })}
          placeholder="item"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Her iterasyonda <code className="font-mono text-xs px-1 bg-muted rounded">{'{{vars.<ad>}}'}</code> ile erişilebilir.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          İndeks Değişken Adı
        </label>
        <Input
          value={config.loopIndexVariable ?? 'index'}
          onChange={(e) => onChange({ ...config, loopIndexVariable: e.target.value })}
          placeholder="index"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Maksimum İterasyon
        </label>
        <Input
          type="number"
          value={config.loopMaxIterations ?? 100}
          onChange={(e) =>
            onChange({ ...config, loopMaxIterations: parseInt(e.target.value, 10) || 100 })
          }
          min={1}
          max={1000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maksimum 1000. Sonsuz döngüyü önlemek için limit.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
        <p className="text-xs font-semibold text-foreground">Çıkışlar</p>
        <p className="text-xs text-muted-foreground">
          <span className="text-rose-600 dark:text-rose-400 font-medium">Gövde</span> — Her iterasyonda çalışacak node'ları bağlayın.
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400 font-medium">Bitti</span> — Döngü tamamlandıktan sonra devam edecek akış.
        </p>
      </div>
    </div>
  );
};
