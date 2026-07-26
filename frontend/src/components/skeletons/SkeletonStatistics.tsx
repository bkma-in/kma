import React from 'react';

interface SkeletonStatisticsProps {
  count?: number;
}

export const SkeletonStatistics: React.FC<SkeletonStatisticsProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white border border-zinc-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl skeleton-box mb-4" />
          <div className="space-y-2">
            <div className="h-3 skeleton-box rounded w-2/3" />
            <div className="h-6 skeleton-box rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};
