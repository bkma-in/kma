import React from 'react';
import { SkeletonBox } from './SkeletonBase';
import { cn } from '../../utils/cn';

interface SkeletonCFPCardProps {
  count?: number;
  className?: string;
}

export const SkeletonCFPCard: React.FC<SkeletonCFPCardProps> = ({ count = 4, className = "" }) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6 w-full", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6"
        >
          <div className="space-y-4">
            {/* Header: Volume/Issue pill + Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SkeletonBox className="h-6 rounded-full w-36" />
              <SkeletonBox className="h-6 rounded-full w-20" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <SkeletonBox className="h-6 sm:h-7 rounded-lg w-5/6" />
              <SkeletonBox className="h-4 rounded w-2/3" />
            </div>

            {/* Theme Tag */}
            <SkeletonBox className="h-6 rounded-lg w-44" />

            {/* Description lines */}
            <div className="space-y-2 pt-1">
              <SkeletonBox className="h-3.5 rounded w-full" />
              <SkeletonBox className="h-3.5 rounded w-full" />
              <SkeletonBox className="h-3.5 rounded w-3/4" />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-100 space-y-3">
            <SkeletonBox className="h-8 rounded-xl w-full" />
            <div className="flex items-center justify-between gap-3 pt-1">
              <SkeletonBox className="h-9 rounded-xl w-28" />
              <SkeletonBox className="h-9 rounded-xl w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
