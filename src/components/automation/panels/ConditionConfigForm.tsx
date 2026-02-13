import React from 'react';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import type { WorkflowNodeConfig } from '../../../types';

interface ConditionConfigFormProps {
  config: WorkflowNodeConfig;
  onChange: (config: WorkflowNodeConfig) => void;
}

export const ConditionConfigForm: React.FC<ConditionConfigFormProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Koşul İfadesi</label>
        <Textarea
          value={config.conditionExpression ?? ''}
          onChange={(e) => onChange({ ...config, conditionExpression: e.target.value })}
          rows={3}
          placeholder="{{trigger.itemTypeId}} == ITEM_TYPE_DISPLAY"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Template değişkenleri kullanabilirsiniz. Desteklenen operatörler: ==, !=, &gt;, &lt;, &gt;=, &lt;=, contains, startsWith, endsWith
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
        <p className="text-xs font-semibold text-foreground">Kullanım Örnekleri</p>
        <div className="space-y-1">
          <code className="block text-xs text-muted-foreground font-mono">
            {'{{trigger.status}} == active'}
          </code>
          <code className="block text-xs text-muted-foreground font-mono">
            {'{{steps.action1.statusCode}} == 200'}
          </code>
          <code className="block text-xs text-muted-foreground font-mono">
            {'{{trigger.email}} contains @company.com'}
          </code>
          <code className="block text-xs text-muted-foreground font-mono">
            {'{{vars.retryCount}} < 3'}
          </code>
        </div>
      </div>
    </div>
  );
};
