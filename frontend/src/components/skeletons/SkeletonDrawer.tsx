import React from 'react';
import { SkeletonBox } from './SkeletonBase';

export const SkeletonDrawer: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div className="space-y-2">
        <SkeletonBox className="h-6 rounded w-full" />
        <SkeletonBox className="h-6 rounded w-2/3" />
      </div>

      {/* Metadata layout */}
      <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
            <SkeletonBox className="h-3 rounded w-24" />
            <SkeletonBox className="h-3.5 rounded w-36" />
          </div>
        ))}
      </div>

      {/* Abstract */}
      <div className="space-y-2">
        <SkeletonBox className="h-4 rounded w-28 mb-3" />
        <SkeletonBox className="h-3 rounded w-full" />
        <SkeletonBox className="h-3 rounded w-full" />
        <SkeletonBox className="h-3 rounded w-5/6" />
      </div>

      {/* Action buttons footer */}
      <div className="pt-6 border-t border-zinc-100 flex gap-4">
        <SkeletonBox className="h-10 rounded-xl flex-1" />
        <SkeletonBox className="h-10 rounded-xl flex-1" />
      </div>
    </div>
  );
};
