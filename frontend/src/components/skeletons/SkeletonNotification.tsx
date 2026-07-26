import React from 'react';

interface SkeletonNotificationProps {
  count?: number;
}

export const SkeletonNotification: React.FC<SkeletonNotificationProps> = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm flex gap-4">
          {/* Status icon skeleton */}
          <div className="w-10 h-10 rounded-full skeleton-box shrink-0" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton-box rounded w-1/3" />
            <div className="h-3 skeleton-box rounded w-full" />
            <div className="h-3 skeleton-box rounded w-3/4" />
          </div>

          {/* Action / Date skeleton */}
          <div className="flex flex-col justify-between items-end shrink-0">
            <div className="h-3 skeleton-box rounded w-12" />
            <div className="h-6 skeleton-box rounded-md w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};
