import React from 'react';
import { SkeletonBox } from './SkeletonBase';
import { cn } from '../../utils/cn';

export const SkeletonCFPDetails: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={cn("space-y-8 max-w-5xl mx-auto w-full animate-fade-in", className)}>
      {/* Banner & Title Header Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <SkeletonBox className="h-6 rounded-full w-40" />
          <SkeletonBox className="h-6 rounded-full w-24" />
        </div>

        <div className="space-y-3">
          <SkeletonBox className="h-8 sm:h-10 rounded-xl w-4/5" />
          <SkeletonBox className="h-4 sm:h-5 rounded-lg w-2/3" />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <SkeletonBox className="h-6 rounded-lg w-48" />
          <SkeletonBox className="h-6 rounded-lg w-36" />
        </div>

        <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SkeletonBox className="h-10 rounded-xl w-full sm:w-64" />
          <SkeletonBox className="h-12 rounded-xl w-full sm:w-48" />
        </div>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Scope, Description, Timeline */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <SkeletonBox className="h-5 rounded-md w-32" />
            <div className="space-y-2.5">
              <SkeletonBox className="h-3.5 rounded w-full" />
              <SkeletonBox className="h-3.5 rounded w-full" />
              <SkeletonBox className="h-3.5 rounded w-5/6" />
              <SkeletonBox className="h-3.5 rounded w-4/5" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <SkeletonBox className="h-5 rounded-md w-40" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <SkeletonBox className="w-8 h-8 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <SkeletonBox className="h-4 rounded w-1/3" />
                    <SkeletonBox className="h-3 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Important Dates Card & Contact Card */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
            <SkeletonBox className="h-5 rounded-md w-36" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                  <SkeletonBox className="h-3 rounded w-24" />
                  <SkeletonBox className="h-3.5 rounded w-20" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
            <SkeletonBox className="h-5 rounded-md w-28" />
            <div className="space-y-3">
              <SkeletonBox className="h-3.5 rounded w-48" />
              <SkeletonBox className="h-3.5 rounded w-36" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
