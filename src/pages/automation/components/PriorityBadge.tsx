import React from 'react';
import {
  ChevronsDown,
  ChevronDown,
  Minus,
  ChevronUp,
  ChevronsUp,
} from 'lucide-react';
import type { TaskPriority } from '../../../types';

const config: Record<TaskPriority, { icon: React.ElementType; color: string; label: string }> = {
  lowest: { icon: ChevronsDown, color: 'text-blue-400', label: 'En Düşük' },
  low: { icon: ChevronDown, color: 'text-blue-500', label: 'Düşük' },
  medium: { icon: Minus, color: 'text-yellow-500', label: 'Orta' },
  high: { icon: ChevronUp, color: 'text-orange-500', label: 'Yüksek' },
  highest: { icon: ChevronsUp, color: 'text-red-500', label: 'En Yüksek' },
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  showLabel?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showLabel = false }) => {
  const cfg = config[priority] ?? config.medium;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 ${cfg.color}`}>
      <Icon className="h-4 w-4" />
      {showLabel && <span className="text-xs">{cfg.label}</span>}
    </span>
  );
};
