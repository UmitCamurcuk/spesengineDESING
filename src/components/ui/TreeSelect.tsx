import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TreeNode {
  id: string;
  label: string;
  value: string;
  children?: TreeNode[];
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface TreeSelectProps {
  label?: string;
  placeholder?: string;
  options: TreeNode[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  searchable?: boolean;
  className?: string;
}

export const TreeSelect: React.FC<TreeSelectProps> = ({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  error,
  helperText,
  required,
  searchable = true,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find selected option
  const findNodeByValue = (nodes: TreeNode[], targetValue: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.value === targetValue) return node;
      if (node.children) {
        const found = findNodeByValue(node.children, targetValue);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedOption = value ? findNodeByValue(options, value) : null;

  // Filter nodes based on search
  const filterNodes = (nodes: TreeNode[], search: string): TreeNode[] => {
    if (!search) return nodes;
    
    return nodes.reduce((filtered: TreeNode[], node) => {
      const matchesSearch = node.label.toLowerCase().includes(search.toLowerCase());
      const filteredChildren = node.children ? filterNodes(node.children, search) : [];
      
      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        });
        
        // Auto-expand nodes that have matching children
        if (filteredChildren.length > 0) {
          setExpandedNodes(prev => new Set([...prev, node.id]));
        }
      }
      
      return filtered;
    }, []);
  };

  const filteredOptions = filterNodes(options, searchTerm);

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleSelect = (nodeValue: string) => {
    onChange?.(nodeValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = value === node.value;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center space-x-2 px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors duration-200 rounded-lg mx-1',
            isSelected && 'bg-blue-50 text-blue-700',
            node.disabled && 'opacity-50 cursor-not-allowed',
            level > 0 && 'ml-4'
          )}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => !node.disabled && handleSelect(node.value)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              className="p-0.5 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}
          
          {node.icon && (
            <div className="flex-shrink-0">
              {node.icon}
            </div>
          )}
          
          <span className={cn(
            'flex-1 text-sm',
            isSelected ? 'font-medium text-blue-700' : 'text-gray-900'
          )}>
            {node.label}
          </span>
          
          {isSelected && (
            <Check className="h-4 w-4 text-blue-600" />
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full px-3 py-2.5 text-left border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white',
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
            isOpen && 'ring-2 ring-blue-200 border-blue-500'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedOption?.icon && (
                <div className="flex-shrink-0">
                  {selectedOption.icon}
                </div>
              )}
              <span className={cn(
                'text-sm',
                selectedOption ? 'text-gray-900' : 'text-gray-400'
              )}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            <ChevronDown className={cn(
              'h-4 w-4 text-gray-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {searchable && (
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded"
                    >
                      <X className="h-3 w-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto py-2">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(node => renderNode(node))
              ) : (
                <div className="px-3 py-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <Search className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">No options found</p>
                  {searchTerm && (
                    <p className="text-xs text-gray-400 mt-1">
                      Try adjusting your search terms
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};