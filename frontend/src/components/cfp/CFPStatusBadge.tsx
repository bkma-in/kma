import React from 'react';
import type { CFPStatus } from '../../types/cfp';
import { cn } from '../../utils/cn';

interface CFPStatusBadgeProps {
  status: CFPStatus;
  className?: string;
}

export const CFPStatusBadge: React.FC<CFPStatusBadgeProps> = ({ status, className }) => {
  const getBadgeStyle = (st: CFPStatus) => {
    switch (st) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'closed':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'archived':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'draft':
      default:
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  const formatStatus = (st: CFPStatus) => {
    switch (st) {
      case 'published': return 'Active Call';
      case 'scheduled': return 'Scheduled';
      case 'closed': return 'Submission Closed';
      case 'archived': return 'Archived';
      case 'draft': return 'Draft';
      default: return st;
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider",
      getBadgeStyle(status),
      className
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === 'published' ? 'bg-emerald-500 animate-pulse' :
        status === 'scheduled' ? 'bg-blue-500' :
        status === 'closed' ? 'bg-zinc-400' :
        status === 'archived' ? 'bg-amber-500' : 'bg-zinc-400'
      )} />
      {formatStatus(status)}
    </span>
  );
};
