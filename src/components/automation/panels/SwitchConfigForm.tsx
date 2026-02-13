import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import type { WorkflowNodeConfig, SwitchCase } from '../../../types';

interface SwitchConfigFormProps {
  config: WorkflowNodeConfig;
  onChange: (config: WorkflowNodeConfig) => void;
}

export const SwitchConfigForm: React.FC<SwitchConfigFormProps> = ({ config, onChange }) => {
  const cases = config.switchCases ?? [];

  const addCase = () => {
    const idx = cases.length;
    const newCase: SwitchCase = {
      label: `Case ${idx + 1}`,
      handleId: `case_${idx}`,
      value: '',
    };
    onChange({ ...config, switchCases: [...cases, newCase] });
  };

  const updateCase = (index: number, updates: Partial<SwitchCase>) => {
    const updated = cases.map((c, i) => (i === index ? { ...c, ...updates } : c));
    onChange({ ...config, switchCases: updated });
  };

  const removeCase = (index: number) => {
    onChange({ ...config, switchCases: cases.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Switch Expression
        </label>
        <Input
          value={config.switchExpression ?? ''}
          onChange={(e) => onChange({ ...config, switchExpression: e.target.value })}
          placeholder="{{vars.status}}"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Template ile resolve edilir ve case'lerle karşılaştırılır.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">Case'ler</label>
          <Button variant="outline" size="sm" onClick={addCase}>
            <Plus className="h-3 w-3 mr-1" />
            Ekle
          </Button>
        </div>

        {cases.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Henüz case eklenmemiş. Yukarıdaki butonu kullanarak ekleyin.
          </p>
        )}

        <div className="space-y-2">
          {cases.map((c, i) => (
            <div key={c.handleId} className="flex items-center gap-2 rounded-md border border-border p-2">
              <div className="flex-1 space-y-1">
                <Input
                  value={c.label}
                  onChange={(e) => updateCase(i, { label: e.target.value })}
                  placeholder="Etiket"
                  className="text-xs h-7"
                />
                <Input
                  value={c.value}
                  onChange={(e) => updateCase(i, { value: e.target.value })}
                  placeholder="Eşleşecek değer"
                  className="text-xs h-7"
                />
              </div>
              <button
                onClick={() => removeCase(i)}
                className="p-1 text-error hover:bg-error/10 rounded transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          Hiçbir case eşleşmezse <span className="font-medium">Default</span> dalı takip edilir.
          Her case için ayrı bir çıkış handle'ı oluşturulur.
        </p>
      </div>
    </div>
  );
};
