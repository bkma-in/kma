import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DeadlineBadgeProps {
  deadline: string;
  className?: string;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({ deadline, className }) => {
  if (!deadline) return null;

  const targetDate = new Date(deadline);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = targetDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let remainingText = '';
  let badgeColor = 'bg-zinc-100 text-zinc-700 border-zinc-200';

  if (diffDays < 0) {
    remainingText = 'Expired';
    badgeColor = 'bg-zinc-100 text-zinc-500 border-zinc-200';
  } else if (diffDays === 0) {
    remainingText = 'Deadline Today';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
  } else if (diffDays <= 7) {
    remainingText = `${diffDays} days left`;
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
  } else {
    remainingText = `${diffDays} days left`;
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-semibold",
        badgeColor
      )}>
        <Clock size={14} />
        <span>{formattedDate}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-80 border-l border-current/20 pl-1.5 ml-1">
          {remainingText}
        </span>
      </span>
    </div>
  );
};
