import React from 'react';
import { Tags, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AttributeGroup {
  id: string;
  name: string;
  description?: string;
  attributeCount?: number;
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
  className
}) => {
  const handleGroupToggle = (groupId: string) => {
    if (multiple) {
      const newSelection = selectedGroups.includes(groupId)
        ? selectedGroups.filter(id => id !== groupId)
        : [...selectedGroups, groupId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedGroups.includes(groupId) ? [] : [groupId]);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => {
          const isSelected = selectedGroups.includes(group.id);
          
          return (
            <button
              key={group.id}
              onClick={() => handleGroupToggle(group.id)}
              className={cn(
                'p-4 border-2 rounded-xl transition-all duration-200 text-left relative',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border hover:border-border hover:bg-muted'
              )}
            >
              <div className="flex items-start space-x-3">
                <div className={cn(
                  'p-2 rounded-lg transition-colors',
                  isSelected ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <Tags className={cn(
                    'h-4 w-4',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {group.name}
                  </h4>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  {group.attributeCount !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {group.attributeCount} attributes
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedGroups.length > 0 && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Selected Groups ({selectedGroups.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map(groupId => {
              const group = groups.find(g => g.id === groupId);
              return group ? (
                <div
                  key={groupId}
                  className="inline-flex items-center space-x-1 bg-primary/20 text-primary px-2 py-1 rounded-full text-xs"
                >
                  <span>{group.name}</span>
                  <button
                    onClick={() => handleGroupToggle(groupId)}
                    className="hover:bg-primary/30 rounded-full p-0.5"
                  >
                    <Check className="h-3 w-3 rotate-45" />
                  </button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};