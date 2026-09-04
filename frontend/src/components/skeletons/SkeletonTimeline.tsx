import React from 'react';
import { SkeletonBox } from './SkeletonBase';

export const SkeletonTimeline: React.FC = () => {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-6">
      <SkeletonBox className="h-5 rounded w-1/3 mb-4" />
      <div className="relative pl-6 border-l border-zinc-200 space-y-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="relative">
            {/* Timeline node dot */}
            <div className="absolute left-[-29px] top-1.5 w-4 h-4 rounded-full skeleton-box border-2 border-white" />
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5 flex-1">
                <SkeletonBox className="h-4 rounded w-1/3" />
                <SkeletonBox className="h-3 rounded w-2/3" />
              </div>
              <SkeletonBox className="h-3 rounded w-16 text-right shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
