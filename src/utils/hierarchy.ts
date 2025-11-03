import type { TreeNode } from '../components/ui';

interface BuildHierarchyTreeOptions<T> {
  getId: (item: T) => string;
  getParentId: (item: T) => string | null | undefined;
  getLabel: (item: T) => string;
  getDescription?: (item: T) => string | null | undefined;
  getDisabled?: (item: T) => boolean;
  sortComparator?: (a: TreeNode, b: TreeNode) => number;
}

export function buildHierarchyTree<T>(
  items: T[],
  options: BuildHierarchyTreeOptions<T>,
): TreeNode[] {
  const nodes = new Map<string, TreeNode>();
  const parentMap = new Map<string, string | null>();

  items.forEach((item) => {
    const id = options.getId(item);
    const parentId = options.getParentId(item) ?? null;
    parentMap.set(id, parentId);
    nodes.set(id, {
      id,
      value: id,
      label: options.getLabel(item),
      description: options.getDescription?.(item) ?? undefined,
      disabled: options.getDisabled?.(item) ?? false,
      children: [],
    });
  });

  const roots: TreeNode[] = [];

  nodes.forEach((node, id) => {
    const parentId = parentMap.get(id);
    if (parentId && nodes.has(parentId) && parentId !== id) {
      const parent = nodes.get(parentId)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortFn =
    options.sortComparator ??
    ((a: TreeNode, b: TreeNode) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const sortNodes = (list: TreeNode[]) => {
    list.sort(sortFn);
    list.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(roots);

  return roots;
}
