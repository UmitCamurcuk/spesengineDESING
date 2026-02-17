import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ReportJoin, ReportMetaAssociation, ReportMetaItemType } from '../../../types';

interface Props {
  primaryItemTypeId: string;
  itemTypes: ReportMetaItemType[];
  associations: ReportMetaAssociation[];
  joins: ReportJoin[];
  onChange: (joins: ReportJoin[]) => void;
}

export const JoinConfigurator: React.FC<Props> = ({
  primaryItemTypeId,
  itemTypes,
  associations,
  joins,
  onChange,
}) => {
  const addJoin = () => {
    const assoc = associations[0];
    if (!assoc) return;
    const direction = assoc.sourceItemTypeId === primaryItemTypeId ? 'source' : 'target';
    const targetId = direction === 'source' ? assoc.targetItemTypeId : assoc.sourceItemTypeId;
    const targetType = itemTypes.find((it) => it.id === targetId);
    const newJoin: ReportJoin = {
      alias: `join${joins.length + 1}`,
      associationTypeId: assoc.id,
      targetItemTypeId: targetId,
      targetItemTypeName: targetType?.name ?? targetId,
      direction,
    };
    onChange([...joins, newJoin]);
  };

  const removeJoin = (index: number) => {
    onChange(joins.filter((_, i) => i !== index));
  };

  const updateJoin = (index: number, patch: Partial<ReportJoin>) => {
    onChange(joins.map((j, i) => (i === index ? { ...j, ...patch } : j)));
  };

  const handleAssocChange = (index: number, assocId: string) => {
    const assoc = associations.find((a) => a.id === assocId);
    if (!assoc) return;
    const direction = assoc.sourceItemTypeId === primaryItemTypeId ? 'source' : 'target';
    const targetId = direction === 'source' ? assoc.targetItemTypeId : assoc.sourceItemTypeId;
    const targetType = itemTypes.find((it) => it.id === targetId);
    updateJoin(index, {
      associationTypeId: assocId,
      targetItemTypeId: targetId,
      targetItemTypeName: targetType?.name ?? targetId,
      direction,
    });
  };

  return (
    <div className="space-y-3">
      {joins.length === 0 && (
        <p className="text-sm text-muted-foreground">İlişki eklenmemiş. Yalnızca ana veri kaynağından raporlanacak.</p>
      )}

      {joins.map((join, index) => (
        <div key={index} className="p-3 border border-border rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            {/* Association selector */}
            <select
              value={join.associationTypeId}
              onChange={(e) => handleAssocChange(index, e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {associations.length === 0 && <option value="">İlişki bulunamadı</option>}
              {associations.map((assoc) => (
                <option key={assoc.id} value={assoc.id}>{assoc.name || assoc.key}</option>
              ))}
            </select>

            {/* Alias */}
            <input
              type="text"
              value={join.alias}
              onChange={(e) => updateJoin(index, { alias: e.target.value.replace(/\s/g, '_') })}
              placeholder="Takma ad"
              className="w-28 px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />

            <button
              onClick={() => removeJoin(index)}
              className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Hedef: <span className="font-medium text-foreground">{join.targetItemTypeName}</span>
            </span>
            <span>
              Yön: <span className="font-medium text-foreground">{join.direction === 'source' ? 'Kaynak' : 'Hedef'}</span>
            </span>
          </div>
        </div>
      ))}

      <button
        onClick={addJoin}
        disabled={associations.length === 0}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        İlişki Ekle
      </button>
    </div>
  );
};
