import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ReportColumn } from '../../../types';

const uid = () => crypto.randomUUID();

interface AvailableField {
  alias: string;
  aliasLabel: string;
  attributeId: string;
  attributeCode: string;
  attributeLabel: string;
}

interface Props {
  availableFields: AvailableField[];
  columns: ReportColumn[];
  onChange: (columns: ReportColumn[]) => void;
}

const AGGREGATE_OPTIONS = [
  { value: 'none', label: 'Yok' },
  { value: 'count', label: 'Sayım' },
  { value: 'sum', label: 'Toplam' },
  { value: 'avg', label: 'Ortalama' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Maks' },
] as const;

export const ColumnSelector: React.FC<Props> = ({ availableFields, columns, onChange }) => {
  const addColumn = (field: AvailableField) => {
    const newCol: ReportColumn = {
      id: uid(),
      alias: field.alias,
      attributeId: field.attributeId,
      attributeCode: field.attributeCode,
      label: field.attributeLabel,
      aggregate: 'none',
    };
    onChange([...columns, newCol]);
  };

  const removeColumn = (id: string) => {
    onChange(columns.filter((c) => c.id !== id));
  };

  const updateColumn = (id: string, patch: Partial<ReportColumn>) => {
    onChange(columns.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const isSelected = (field: AvailableField) =>
    columns.some((c) => c.alias === field.alias && c.attributeCode === field.attributeCode);

  return (
    <div className="grid grid-cols-2 gap-4 min-h-[300px]">
      {/* Left: Available fields */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-muted border-b border-border">
          <span className="text-sm font-medium text-foreground">Mevcut Alanlar</span>
        </div>
        <div className="overflow-y-auto max-h-80">
          {availableFields.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">Önce veri kaynağı seçin.</p>
          )}
          {availableFields.map((field) => {
            const selected = isSelected(field);
            return (
              <div
                key={`${field.alias}.${field.attributeCode}`}
                className={`flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${selected ? 'opacity-40' : ''}`}
              >
                <div>
                  <span className="text-xs text-muted-foreground">{field.aliasLabel} · </span>
                  <span className="text-sm text-foreground">{field.attributeLabel}</span>
                </div>
                <button
                  disabled={selected}
                  onClick={() => addColumn(field)}
                  className="p-1 rounded hover:bg-primary/10 text-primary disabled:opacity-30 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Selected columns */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-muted border-b border-border">
          <span className="text-sm font-medium text-foreground">Seçili Kolonlar ({columns.length})</span>
        </div>
        <div className="overflow-y-auto max-h-80">
          {columns.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">Soldan alan ekleyin.</p>
          )}
          {columns.map((col) => (
            <div key={col.id} className="px-3 py-2 border-b border-border last:border-b-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{col.attributeCode}</span>
                  <span className="text-xs text-muted-foreground">({col.alias})</span>
                </div>
                <button
                  onClick={() => removeColumn(col.id)}
                  className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) => updateColumn(col.id, { label: e.target.value })}
                  placeholder="Başlık"
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <select
                  value={col.aggregate}
                  onChange={(e) => updateColumn(col.id, { aggregate: e.target.value as ReportColumn['aggregate'] })}
                  className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none"
                >
                  {AGGREGATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
