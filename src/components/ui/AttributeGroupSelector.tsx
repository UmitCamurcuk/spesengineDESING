import React, { useMemo, useState } from 'react';
import { Tags, Check, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input } from './Input';
import { Badge } from './Badge';
import { useLanguage } from '../../contexts/LanguageContext';

interface AttributeGroup {
  id: string;
  name: string;
  description?: string;
  attributeCount?: number;
  logoUrl?: string | null;
}

interface AttributeGroupSelectorProps {
  groups: AttributeGroup[];
  selectedGroups: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  multiple?: boolean;
  className?: string;
}

export const AttributeGroupSelector: React.FC<AttributeGroupSelectorProps> = ({
  groups,
  selectedGroups,
  onSelectionChange,
  multiple = true,
  className,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const searchPlaceholder =
    t('attributeGroups.selector.search_placeholder') ?? 'Search attribute groups';
  const emptyStateLabel =
    t('attributeGroups.selector.empty_state') ?? 'No attribute groups match your search.';
  const selectionEmpty =
    t('attributeGroups.selector.selection_empty') ?? 'No groups selected';

  const handleGroupToggle = (groupId: string) => {
    if (multiple) {
      const newSelection = selectedGroups.includes(groupId)
        ? selectedGroups.filter((id) => id !== groupId)
        : [...selectedGroups, groupId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedGroups.includes(groupId) ? [] : [groupId]);
    }
  };

  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return groups;
    }
    return groups.filter((group) => {
      const haystack = [group.name, group.description, group.attributeCount?.toString()]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [groups, query]);

  const selectionSummary =
    selectedGroups.length === 0
      ? selectionEmpty
      : t('attributeGroups.selector.selection_count', { count: selectedGroups.length }) ??
        `${selectedGroups.length} selected`;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
        />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {selectionSummary}
        </p>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-2xl border border-border divide-y divide-border/70">
        {filteredGroups.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">{emptyStateLabel}</div>
        ) : (
          filteredGroups.map((group) => {
            const isSelected = selectedGroups.includes(group.id);
            return (
              <button
                type="button"
                key={group.id}
                onClick={() => handleGroupToggle(group.id)}
                className={cn(
                  'flex w-full items-center gap-4 px-4 py-3 text-left transition-colors',
                  isSelected ? 'bg-primary/5' : 'bg-background hover:bg-muted/40',
                )}
                aria-pressed={isSelected}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden',
                    isSelected && 'bg-primary/10 text-primary',
                    group.logoUrl && 'p-1 border border-border bg-card',
                  )}
                >
                  {group.logoUrl ? (
                    <img
                      src={group.logoUrl}
                      alt={group.name}
                      className="w-full h-full object-contain rounded-lg"
                      loading="lazy"
                    />
                  ) : (
                    <Tags className="h-4 w-4" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{group.name}</p>
                    {group.attributeCount !== undefined && (
                      <Badge variant="outline" size="sm">
                        {group.attributeCount} fields
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {group.description || 'No description provided.'}
                  </p>
                </div>
                {isSelected && (
                  <span className="rounded-full bg-primary text-white p-1">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {selectedGroups.length > 0 && (
        <div className="rounded-xl border border-dashed border-border px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('attributeGroups.selector.selected_label') ?? 'Selected'}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((groupId) => {
              const group = groups.find((g) => g.id === groupId);
              if (!group) {
                return null;
              }
              return (
                <span
                  key={group.id}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {group.name}
                  <button
                    type="button"
                    className="rounded-full bg-primary/20 p-0.5 text-primary hover:bg-primary/30"
                    onClick={() => handleGroupToggle(group.id)}
                  >
                    <Check className="h-3 w-3 rotate-45" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
