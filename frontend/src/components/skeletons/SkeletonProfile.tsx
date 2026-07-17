import React from 'react';

export const SkeletonProfile: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      {/* Header section with profile avatar skeleton */}
      <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-zinc-200" />
        <div className="space-y-3 flex-1 text-center md:text-left">
          <div className="h-6 bg-zinc-200 rounded w-1/3 mx-auto md:mx-0" />
          <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto md:mx-0" />
        </div>
        <div className="h-10 bg-zinc-200 rounded-xl w-32 shrink-0" />
      </div>

      {/* Info grid & Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Info Card Skeletons */}
        <div className="md:col-span-2 bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="h-5 bg-zinc-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className="h-3 bg-zinc-200 rounded w-1/2" />
                <div className="h-4 bg-zinc-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        </div>

        {/* Stats card skeletons */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="h-5 bg-zinc-200 rounded w-1/2 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="h-4 bg-zinc-200 rounded w-1/3" />
                  <div className="h-4 bg-zinc-200 rounded w-8" />
                </div>
              ))}
            </div>
          </div>
          <div className="h-10 bg-zinc-200 rounded-xl w-full mt-6" />
        </div>
      </div>
    </div>
  );
};
