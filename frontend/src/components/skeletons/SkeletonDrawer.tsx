import React from 'react';

export const SkeletonDrawer: React.FC = () => {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 bg-zinc-200 rounded w-full" />
        <div className="h-6 bg-zinc-200 rounded w-2/3" />
      </div>

      {/* Metadata layout */}
      <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
            <div className="h-3 bg-zinc-200 rounded w-24" />
            <div className="h-3.5 bg-zinc-200 rounded w-36" />
          </div>
        ))}
      </div>

      {/* Abstract */}
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 rounded w-28 mb-3" />
        <div className="h-3 bg-zinc-200 rounded w-full" />
        <div className="h-3 bg-zinc-200 rounded w-full" />
        <div className="h-3 bg-zinc-200 rounded w-5/6" />
      </div>

      {/* Action buttons footer */}
      <div className="pt-6 border-t border-zinc-100 flex gap-4">
        <div className="h-10 bg-zinc-200 rounded-xl flex-1" />
        <div className="h-10 bg-zinc-200 rounded-xl flex-1" />
      </div>
    </div>
  );
};
