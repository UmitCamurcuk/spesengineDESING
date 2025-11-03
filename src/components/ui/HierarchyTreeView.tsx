import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
import type { TreeNode } from './TreeSelect';

interface HierarchyTreeViewProps {
  nodes: TreeNode[];
  activeId?: string | null;
  highlightIds?: string[];
  className?: string;
  emptyState?: React.ReactNode;
}

export const HierarchyTreeView: React.FC<HierarchyTreeViewProps> = ({
  nodes,
  activeId,
  highlightIds,
  className,
  emptyState,
}) => {
  const highlightSet = useMemo(() => new Set(highlightIds ?? []), [highlightIds]);

  const renderNode = (node: TreeNode, depth = 0): React.ReactNode => {
    const isActive = activeId ? node.value === activeId : false;
    const isHighlighted = isActive || highlightSet.has(node.value) || highlightSet.has(node.id);
    const indent = depth * 20;

    return (
      <li key={node.id} className="space-y-1">
        <div
          className={cn(
            'relative rounded-lg border px-3 py-2 transition-colors',
            'bg-card text-card-foreground shadow-sm',
            isActive
              ? 'border-primary bg-primary text-primary-foreground shadow-md'
              : isHighlighted
              ? 'border-primary/40 bg-primary/5 text-primary'
              : 'border-border hover:border-primary/30 hover:bg-muted/60'
          )}
          style={{ marginLeft: indent }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-sm font-semibold leading-tight',
                  isActive ? 'text-primary-foreground' : 'text-foreground',
                )}
              >
                {node.label}
              </span>
              {isActive ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary-foreground/10 text-primary-foreground px-2 py-0.5 rounded-full">
                  Current
                </span>
              ) : null}
            </div>
            {node.description ? (
              <span
                className={cn(
                  'text-xs leading-relaxed',
                  isActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}
              >
                {node.description}
              </span>
            ) : null}
          </div>
        </div>

        {node.children && node.children.length > 0 ? (
          <ul className="space-y-1">{node.children.map((child) => renderNode(child, depth + 1))}</ul>
        ) : null}
      </li>
    );
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground', className)}>
        {emptyState || 'No hierarchy data available.'}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card px-4 py-4', className)}>
      <ul className="space-y-2">{nodes.map((node) => renderNode(node))}</ul>
    </div>
  );
};
