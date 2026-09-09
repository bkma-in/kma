import React from 'react';
import { SkeletonBox } from './SkeletonBase';
import { cn } from '../../utils/cn';

interface SkeletonReviewerArticleProps {
  count?: number;
  className?: string;
}

export const SkeletonReviewerArticle: React.FC<SkeletonReviewerArticleProps> = ({ count = 2, className = "" }) => {
  return (
    <div className={cn("space-y-8 w-full", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-xl p-6 sm:p-10 space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-100 pb-6">
            <div className="space-y-3 flex-1">
              <SkeletonBox className="h-6 rounded-full w-28" />
              <SkeletonBox className="h-7 sm:h-8 rounded-xl w-3/4 max-w-lg" />
              <SkeletonBox className="h-3.5 rounded w-48" />
            </div>
            <SkeletonBox className="h-10 rounded-xl w-32 shrink-0" />
          </div>

          {/* Abstract Description */}
          <div className="space-y-2.5">
            <SkeletonBox className="h-3 rounded w-20" />
            <SkeletonBox className="h-3.5 rounded w-full" />
            <SkeletonBox className="h-3.5 rounded w-full" />
            <SkeletonBox className="h-3.5 rounded w-4/5" />
          </div>

          {/* Metadata / Timeline Grid */}
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <SkeletonBox className="h-2.5 rounded w-20" />
              <SkeletonBox className="h-3.5 rounded w-28" />
            </div>
            <div className="space-y-1.5">
              <SkeletonBox className="h-2.5 rounded w-20" />
              <SkeletonBox className="h-3.5 rounded w-28" />
            </div>
            <div className="space-y-1.5">
              <SkeletonBox className="h-2.5 rounded w-20" />
              <SkeletonBox className="h-3.5 rounded w-28" />
            </div>
          </div>

          {/* Review Decision Area Skeleton */}
          <div className="pt-6 border-t border-zinc-100 space-y-4">
            <SkeletonBox className="h-3.5 rounded w-36" />
            {/* Pill selections */}
            <div className="flex flex-wrap gap-2.5">
              <SkeletonBox className="h-9 rounded-xl w-28" />
              <SkeletonBox className="h-9 rounded-xl w-32" />
              <SkeletonBox className="h-9 rounded-xl w-28" />
            </div>
            {/* Remarks textarea */}
            <SkeletonBox className="h-24 rounded-2xl w-full" />
            {/* Submit button */}
            <div className="flex justify-end">
              <SkeletonBox className="h-11 rounded-xl w-44" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
