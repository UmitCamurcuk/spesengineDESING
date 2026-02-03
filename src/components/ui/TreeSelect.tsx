import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TreeNode {
  id: string;
  label: string;
  value: string;
  description?: string;
  children?: TreeNode[];
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface TreeSelectProps {
  label?: string;
  placeholder?: string;
  options: TreeNode[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  multiple?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (values: string[]) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  searchable?: boolean;
  className?: string;
  emptyState?: React.ReactNode;
  maxTagCount?: number;
}

const findPathToNode = (nodes: TreeNode[], target: string, trail: string[] = []): string[] | null => {
  for (const node of nodes) {
    const nextTrail = [...trail, node.id];
    if (node.value === target) {
      return nextTrail;
    }
    if (node.children && node.children.length > 0) {
      const match = findPathToNode(node.children, target, nextTrail);
      if (match) {
        return match;
      }
    }
  }
  return null;
};

const collectSelectedNodes = (nodes: TreeNode[], selectedIds: string[]): Map<string, TreeNode> => {
  const map = new Map<string, TreeNode>();

  const traverse = (list: TreeNode[]) => {
    list.forEach((node) => {
      if (!map.has(node.value) && selectedIds.includes(node.value)) {
        map.set(node.value, node);
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return map;
};

const buildNodeMap = (nodes: TreeNode[]): Map<string, TreeNode> => {
  const map = new Map<string, TreeNode>();
  const traverse = (list: TreeNode[]) => {
    list.forEach((node) => {
      map.set(node.value, node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return map;
};

const collectDescendantValues = (node: TreeNode | undefined): string[] => {
  if (!node?.children || node.children.length === 0) {
    return [];
  }
  const values: string[] = [];
  const traverse = (list: TreeNode[]) => {
    list.forEach((child) => {
      values.push(child.value);
      if (child.children && child.children.length > 0) {
        traverse(child.children);
      }
    });
  };
  traverse(node.children);
  return values;
};

interface FilterResult {
  nodes: TreeNode[];
  autoExpandIds: string[];
}

const filterTree = (nodes: TreeNode[], term: string): FilterResult => {
  if (!term.trim()) {
    return { nodes, autoExpandIds: [] };
  }

  const search = term.trim().toLowerCase();
  const autoExpand = new Set<string>();

  const filterNode = (node: TreeNode): TreeNode | null => {
    const matchesSelf =
      node.label.toLowerCase().includes(search) ||
      (node.description ? node.description.toLowerCase().includes(search) : false);

    const filteredChildren =
      node.children?.map(filterNode).filter((child): child is TreeNode => Boolean(child)) ?? [];

    if (filteredChildren.length > 0) {
      autoExpand.add(node.id);
    }

    if (matchesSelf || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  };

  const filtered = nodes
    .map(filterNode)
    .filter((node): node is TreeNode => Boolean(node));

  return { nodes: filtered, autoExpandIds: Array.from(autoExpand) };
};

export const TreeSelect: React.FC<TreeSelectProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  multiple = false,
  selectedIds,
  onSelectionChange,
  error,
  helperText,
  required,
  searchable = true,
  className,
  emptyState,
  maxTagCount = 3,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [internalValue, setInternalValue] = useState<string | null>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const resolvedValue = value ?? internalValue;
  const resolvedSelectedIds = multiple
    ? selectedIds ?? internalSelectedIds
    : resolvedValue
    ? [resolvedValue]
    : [];

  const selectedSet = useMemo(() => new Set(resolvedSelectedIds), [resolvedSelectedIds]);
  const nodeMap = useMemo(() => buildNodeMap(options), [options]);

  const { nodes: filteredOptions, autoExpandIds } = useMemo(
    () => filterTree(options, searchTerm),
    [options, searchTerm],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (searchTerm.trim() && autoExpandIds.length > 0) {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        autoExpandIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [autoExpandIds, searchTerm, isOpen]);

  const selectedAncestorIds = useMemo(() => {
    const ancestors = new Set<string>();
    resolvedSelectedIds.forEach((selectedId) => {
      const path = findPathToNode(options, selectedId);
      if (path) {
        path.forEach((id) => ancestors.add(id));
      }
    });
    return ancestors;
  }, [options, resolvedSelectedIds]);

  useEffect(() => {
    if (selectedAncestorIds.size === 0) {
      return;
    }
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      selectedAncestorIds.forEach((id) => next.add(id));
      return next;
    });
  }, [selectedAncestorIds]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (dropdownRef.current?.contains(target)) return;
    if (portalRef.current?.contains(target)) return;
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClickOutside]);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const top = Math.min(rect.bottom + 8, window.innerHeight - 16);
    const left = Math.max(8, rect.left);
    const width = rect.width;
    setDropdownStyle({
      position: 'fixed',
      top,
      left,
      width,
      maxHeight: '70vh',
      zIndex: 1000,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    const handler = () => updateDropdownPosition();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isOpen, updateDropdownPosition]);

  const selectedNodesMap = useMemo(
    () => collectSelectedNodes(options, resolvedSelectedIds),
    [options, resolvedSelectedIds],
  );

  const selectedNodes = useMemo(
    () => resolvedSelectedIds.map((id) => selectedNodesMap.get(id)).filter((node): node is TreeNode => Boolean(node)),
    [resolvedSelectedIds, selectedNodesMap],
  );

  const selectedOption = !multiple && resolvedValue ? selectedNodes[0] : null;

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const toggleSelection = (node: TreeNode) => {
    const nodeValue = node.value;
    const descendants = collectDescendantValues(node);
    const current = new Set(resolvedSelectedIds);

    if (current.has(nodeValue)) {
      current.delete(nodeValue);
      descendants.forEach((value) => current.delete(value));
    } else {
      current.add(nodeValue);
      descendants.forEach((value) => current.add(value));
    }

    const next = Array.from(current);
    if (selectedIds === undefined) {
      setInternalSelectedIds(next);
    }
    onSelectionChange?.(next);
  };

  const handleNodeSelect = (node: TreeNode) => {
    if (node.disabled) {
      return;
    }

    if (multiple) {
      toggleSelection(node);
      return;
    }

    if (value === undefined) {
      setInternalValue(node.value);
    }
    onChange?.(node.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (multiple) {
      if (selectedIds === undefined) {
        setInternalSelectedIds([]);
      }
      onSelectionChange?.([]);
    } else {
      if (value === undefined) {
        setInternalValue(null);
      }
      onChange?.(null);
    }
    setSearchTerm('');
  };

  const hasSelection = resolvedSelectedIds.length > 0;
  const placeholderContent = (
    <span className="text-sm text-muted-foreground truncate">{placeholder}</span>
  );

  const summaryContent = multiple ? (
    hasSelection ? (
      <div className="flex flex-wrap gap-1">
        {selectedNodes.slice(0, maxTagCount).map((node) => (
          <span
            key={node.value}
            className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
          >
            {node.label}
          </span>
        ))}
        {selectedNodes.length > maxTagCount ? (
          <span className="text-xs text-muted-foreground">
            +{selectedNodes.length - maxTagCount}
          </span>
        ) : null}
      </div>
    ) : (
      placeholderContent
    )
  ) : selectedOption ? (
    <span className="text-sm text-foreground truncate">{selectedOption.label}</span>
  ) : (
    placeholderContent
  );

  const renderNode = (node: TreeNode, level = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isSelected = selectedSet.has(node.value);
    const isActive = !multiple && resolvedValue === node.value;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150',
            (isSelected || isActive) && 'bg-primary/10 text-primary',
            node.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted'
          )}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => handleNodeSelect(node)}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(node.id);
              }}
              className="p-0.5 hover:bg-muted-foreground/10 rounded transition-colors mt-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}

          {multiple ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(event) => {
                event.stopPropagation();
                toggleSelection(node);
              }}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              disabled={node.disabled}
            />
          ) : node.icon ? (
            <div className="flex-shrink-0 mt-1">{node.icon}</div>
          ) : (
            <div className="w-1" />
          )}

          <div className="flex-1">
            <div className={cn('text-sm font-medium', node.disabled && 'text-muted-foreground')}>
              {node.label}
            </div>
            {node.description ? (
              <div className="text-xs text-muted-foreground mt-0.5">{node.description}</div>
            ) : null}
          </div>

          {!multiple && isSelected ? <Check className="h-4 w-4 text-primary mt-1" /> : null}
        </div>

        {hasChildren && isExpanded ? (
          <div className="ml-4 border-l border-border/50 pl-3 space-y-1">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
      <div className={cn('space-y-2', className)} ref={dropdownRef}>
        {label ? (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required ? <span className="text-error ml-1">*</span> : null}
          </label>
        ) : null}

        <div className="relative">
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setIsOpen((prev) => !prev)}
            className={cn(
            'w-full px-3 py-2.5 flex items-center justify-between rounded-lg border text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-error focus:ring-error/30 focus:border-error'
              : 'border-border focus:ring-primary/30 focus:border-primary',
            isOpen && 'ring-2 ring-primary/30 border-primary bg-primary/5'
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {summaryContent}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {hasSelection ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : null}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>

          {isOpen && mounted
            ? createPortal(
                <div
                  ref={portalRef}
                  className="rounded-lg border border-border bg-popover shadow-lg"
                  style={dropdownStyle}
                >
                  {searchable ? (
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                          ref={inputRef}
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Search..."
                          className="flex-1 text-sm bg-transparent outline-none"
                        />
                        {searchTerm ? (
                          <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="p-0.5 rounded hover:bg-muted transition-colors"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="max-h-72 overflow-y-auto py-2 space-y-1">
                    {filteredOptions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        {emptyState || 'No results found.'}
                      </div>
                    ) : (
                      filteredOptions.map((node) => renderNode(node))
                    )}
                  </div>
                </div>,
                document.body,
              )
            : null}
        </div>

      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
};
