import React from 'react';
import PublicHeader from '../PublicHeader';
import PublicFooter from '../PublicFooter';
import { SkeletonBox } from './SkeletonBase';

export const SkeletonSimpleDoc: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-['Outfit'] animate-fade-in">
      <PublicHeader />

      <main className="flex-1 pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Page Title Header */}
        <div className="space-y-3 border-b border-zinc-200 pb-8">
          <SkeletonBox className="h-4 rounded-full w-28" />
          <SkeletonBox className="h-9 sm:h-11 rounded-xl w-3/4 max-w-lg" />
          <SkeletonBox className="h-4 rounded-lg w-1/2" />
        </div>

        {/* Document Card Container */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-12 shadow-sm space-y-8">
          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-4">
              <SkeletonBox className="h-6 rounded-lg w-1/3" />
              <div className="space-y-2.5">
                <SkeletonBox className="h-3.5 rounded w-full" />
                <SkeletonBox className="h-3.5 rounded w-full" />
                <SkeletonBox className="h-3.5 rounded w-5/6" />
                <SkeletonBox className="h-3.5 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
