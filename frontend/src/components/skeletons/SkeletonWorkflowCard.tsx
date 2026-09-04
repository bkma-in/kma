import React from 'react';
import { SkeletonBox } from './SkeletonBase';
import { cn } from '../../utils/cn';

interface SkeletonWorkflowCardProps {
  count?: number;
  className?: string;
}

export const SkeletonWorkflowCard: React.FC<SkeletonWorkflowCardProps> = ({ count = 3, className = "" }) => {
  return (
    <div className={cn("space-y-5 w-full", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5 sm:p-6 space-y-4"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <SkeletonBox className="h-6 sm:h-7 rounded-lg w-3/4 max-w-md" />
              <SkeletonBox className="h-3.5 rounded w-40" />
            </div>

            <div className="flex items-start gap-2 shrink-0">
              <SkeletonBox className="h-6 rounded-full w-16" />
              <SkeletonBox className="h-6 rounded-full w-24" />
            </div>
          </div>

          {/* Information Panel */}
          <div className="bg-indigo-50/40 rounded-2xl py-2.5 px-4 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-100/30">
            <div className="flex flex-wrap items-center gap-6 sm:gap-8">
              {/* Calendar Icon placeholder */}
              <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
              
              {/* Timestamp item */}
              <div className="space-y-1.5">
                <SkeletonBox className="h-2.5 rounded w-16" />
                <SkeletonBox className="h-3.5 rounded w-24" />
              </div>

              {/* Deadline item */}
              <div className="space-y-1.5 border-l border-indigo-100/50 pl-6 sm:pl-8">
                <SkeletonBox className="h-2.5 rounded w-20" />
                <SkeletonBox className="h-3.5 rounded w-20" />
              </div>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <SkeletonBox className="h-11 rounded-xl w-full sm:w-36" />
            <SkeletonBox className="h-11 rounded-xl w-full sm:w-40" />
          </div>
        </div>
      ))}
    </div>
  );
};
