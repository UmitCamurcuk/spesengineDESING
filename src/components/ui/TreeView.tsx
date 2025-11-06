import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Checkbox } from './Checkbox';
import type { TreeNode } from './TreeSelect';

export interface TreeViewNode extends TreeNode {
  selectable?: boolean;
  meta?: string;
  tone?: 'default' | 'muted';
  children?: TreeViewNode[];
}

export type TreeViewMode = 'edit' | 'view';
export type TreeViewSelectionMode = 'multiple' | 'single' | 'none';

export interface TreeViewProps {
  nodes: TreeViewNode[];
  mode?: TreeViewMode;
  selectionMode?: TreeViewSelectionMode;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  highlightIds?: string[];
  className?: string;
  emptyState?: React.ReactNode;
  defaultExpandAll?: boolean;
}

const collectInitialExpanded = (
  nodes: TreeViewNode[],
  expandAll: boolean,
  depth = 0,
  acc = new Set<string>(),
): Set<string> => {
  nodes.forEach((node) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    if (hasChildren && (expandAll || depth === 0)) {
      acc.add(node.id);
    }
    if (hasChildren) {
      collectInitialExpanded(node.children as TreeViewNode[], expandAll, depth + 1, acc);
    }
  });
  return acc;
};

const flattenParentMap = (
  nodes: TreeViewNode[],
  parentId: string | null = null,
  acc = new Map<string, string | null>(),
): Map<string, string | null> => {
  nodes.forEach((node) => {
    acc.set(node.id, parentId);
    if (node.children && node.children.length > 0) {
      flattenParentMap(node.children, node.id, acc);
    }
  });
  return acc;
};

export const TreeView: React.FC<TreeViewProps> = ({
  nodes,
  mode = 'edit',
  selectionMode = 'multiple',
  selectedIds,
  onSelectionChange,
  highlightIds,
  className,
  emptyState,
  defaultExpandAll = false,
}) => {
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() =>
    collectInitialExpanded(nodes, defaultExpandAll),
  );
  const previousNodesRef = useRef<TreeViewNode[]>(nodes);

  const resolvedSelectedIds = selectedIds ?? internalSelected;
  const selectedSet = useMemo(() => new Set(resolvedSelectedIds), [resolvedSelectedIds]);
  const highlightSet = useMemo(() => new Set(highlightIds ?? []), [highlightIds]);

  const parentMap = useMemo(() => flattenParentMap(nodes), [nodes]);

  useEffect(() => {
    if (previousNodesRef.current !== nodes) {
      previousNodesRef.current = nodes;
      setExpandedNodes(collectInitialExpanded(nodes, defaultExpandAll));
    }
  }, [defaultExpandAll, nodes]);

  const updateSelection = useCallback(
    (next: string[]) => {
      if (!selectedIds) {
        setInternalSelected(next);
      }
      onSelectionChange?.(next);
    },
    [onSelectionChange, selectedIds],
  );

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const ensureAncestorsExpanded = useCallback(
    (nodeId: string) => {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        let current = parentMap.get(nodeId);
        let updated = false;
        while (current) {
          if (!next.has(current)) {
            next.add(current);
            updated = true;
          }
          current = parentMap.get(current) ?? null;
        }
        return updated ? next : prev;
      });
    },
    [parentMap],
  );

  const toggleSelection = useCallback(
    (nodeId: string) => {
      if (selectionMode === 'none') {
        return;
      }
      if (selectionMode === 'single') {
        if (selectedSet.has(nodeId)) {
          updateSelection([]);
        } else {
          updateSelection([nodeId]);
          ensureAncestorsExpanded(nodeId);
        }
        return;
      }

      const next = new Set(selectedSet);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
        ensureAncestorsExpanded(nodeId);
      }
      updateSelection(Array.from(next));
    },
    [ensureAncestorsExpanded, selectedSet, selectionMode, updateSelection],
  );

  useEffect(() => {
    resolvedSelectedIds.forEach((id) => ensureAncestorsExpanded(id));
  }, [ensureAncestorsExpanded, resolvedSelectedIds]);

  const renderNodes = useCallback(
    (treeNodes: TreeViewNode[], depth = 0): React.ReactNode =>
      treeNodes.map((node) => {
        const hasChildren = Boolean(node.children && node.children.length > 0);
        const isExpanded = expandedNodes.has(node.id);
        const isSelectable = node.selectable !== false && selectionMode !== 'none';
        const isSelected = selectedSet.has(node.id);
        const isHighlighted = highlightSet.has(node.id);
        const getDefaultIcon = () =>
          hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : (
            <File className="h-3.5 w-3.5 text-muted-foreground" />
          );
        const iconElement = node.icon ?? getDefaultIcon();

        return (
          <div key={node.id}>
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition',
                isHighlighted
                  ? 'bg-muted/60'
                  : 'hover:bg-muted/40 focus-within:bg-muted/40',
                node.disabled && 'opacity-60 cursor-not-allowed',
                node.tone === 'muted' && 'text-muted-foreground',
              )}
              style={{ paddingLeft: depth * 16 }}
            >
              <button
                type="button"
                onClick={() => (hasChildren ? toggleExpand(node.id) : toggleSelection(node.id))}
                disabled={node.disabled}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-primary/40',
                  !hasChildren && 'cursor-pointer',
                )}
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )
                ) : (
                  <span className="h-4 w-4" />
                )}
              </button>
              {mode === 'edit' && isSelectable ? (
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleSelection(node.id)}
                  disabled={node.disabled}
                  className="mt-0.5"
                />
              ) : (
                <span className="w-4" />
              )}
              {React.isValidElement(iconElement) ? iconElement : getDefaultIcon()}
              <button
                type="button"
                className={cn(
                  'flex-1 text-left text-sm',
                  node.disabled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer text-foreground',
                )}
                disabled={node.disabled}
                onClick={() => {
                  if (mode === 'edit' && isSelectable) {
                    toggleSelection(node.id);
                  } else if (hasChildren) {
                    toggleExpand(node.id);
                  }
                }}
              >
                {node.label}
                {node.meta ? (
                  <span className="ml-2 text-xs text-muted-foreground">{node.meta}</span>
                ) : null}
              </button>
            </div>
            {hasChildren && isExpanded ? (
              <div>{renderNodes(node.children as TreeViewNode[], depth + 1)}</div>
            ) : null}
          </div>
        );
      }),
    [expandedNodes, highlightSet, mode, selectedSet, selectionMode, toggleExpand, toggleSelection],
  );

  const content = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyState ?? 'Gösterilecek kayıt bulunamadı.'}
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-border bg-card/40 px-2 py-2">
        {renderNodes(nodes)}
      </div>
    );
  }, [emptyState, nodes, renderNodes]);

  return <div className={className}>{content}</div>;
};
