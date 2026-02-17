import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ReportFilter, FilterOperator } from '../../../types';

const uid = () => crypto.randomUUID();

interface AvailableField {
  alias: string;
  aliasLabel: string;
  attributeId: string;
  attributeCode: string;
  attributeLabel: string;
  type?: string;
}

interface Props {
  availableFields: AvailableField[];
  filters: ReportFilter[];
  onChange: (filters: ReportFilter[]) => void;
}

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'eq', label: 'Eşittir' },
  { value: 'ne', label: 'Eşit Değil' },
  { value: 'gt', label: 'Büyüktür' },
  { value: 'gte', label: 'Büyük/Eşit' },
  { value: 'lt', label: 'Küçüktür' },
  { value: 'lte', label: 'Küçük/Eşit' },
  { value: 'contains', label: 'İçerir' },
  { value: 'startsWith', label: 'Başlar' },
  { value: 'in', label: 'Listede' },
  { value: 'notIn', label: 'Listede Değil' },
  { value: 'isNull', label: 'Boş' },
  { value: 'isNotNull', label: 'Dolu' },
];

const NO_VALUE_OPS: FilterOperator[] = ['isNull', 'isNotNull'];

export const FilterBuilder: React.FC<Props> = ({ availableFields, filters, onChange }) => {
  const addFilter = () => {
    const field = availableFields[0];
    if (!field) return;
    const newFilter: ReportFilter = {
      id: uid(),
      alias: field.alias,
      attributeId: field.attributeId,
      attributeCode: field.attributeCode,
      operator: 'eq',
      value: '',
    };
    onChange([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, patch: Partial<ReportFilter>) => {
    onChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const handleFieldChange = (filterId: string, fieldKey: string) => {
    const [alias, ...codeParts] = fieldKey.split('.');
    const code = codeParts.join('.');
    const field = availableFields.find((f) => f.alias === alias && f.attributeCode === code);
    if (!field) return;
    updateFilter(filterId, {
      alias: field.alias,
      attributeId: field.attributeId,
      attributeCode: field.attributeCode,
    });
  };

  return (
    <div className="space-y-3">
      {filters.length === 0 && (
        <p className="text-sm text-muted-foreground">Filtre eklenmemiş. Tüm kayıtlar getirilecek.</p>
      )}

      {filters.map((filter) => {
        const fieldKey = `${filter.alias}.${filter.attributeCode}`;
        const noValue = NO_VALUE_OPS.includes(filter.operator);

        return (
          <div key={filter.id} className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/30">
            {/* Field selector */}
            <select
              value={fieldKey}
              onChange={(e) => handleFieldChange(filter.id, e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {availableFields.map((f) => (
                <option key={`${f.alias}.${f.attributeCode}`} value={`${f.alias}.${f.attributeCode}`}>
                  {f.aliasLabel} · {f.attributeLabel}
                </option>
              ))}
            </select>

            {/* Operator selector */}
            <select
              value={filter.operator}
              onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
              className="w-36 px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            {/* Value input */}
            {!noValue && (
              <input
                type="text"
                value={filter.value !== undefined && filter.value !== null ? String(filter.value) : ''}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                placeholder="Değer"
                className="flex-1 px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}
            {noValue && <div className="flex-1" />}

            <button
              onClick={() => removeFilter(filter.id)}
              className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      <button
        onClick={addFilter}
        disabled={availableFields.length === 0}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        Filtre Ekle
      </button>
    </div>
  );
};
