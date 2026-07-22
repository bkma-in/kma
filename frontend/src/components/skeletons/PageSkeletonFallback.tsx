import React from 'react';
import { SkeletonStatistics } from './SkeletonStatistics';
import { SkeletonArticleCard } from './SkeletonArticleCard';
import { SkeletonTable } from './SkeletonTable';
import { SkeletonNotification } from './SkeletonNotification';

export const PageSkeletonFallback: React.FC = () => {
  const path = window.location.pathname;

  return (
    <div className="min-h-screen bg-zinc-50 font-['Outfit']">
      {/* Header Bar Skeleton Fixed in Position */}
      <header className="fixed top-0 left-0 right-0 h-16 px-6 bg-white/80 backdrop-blur-md border-b border-zinc-200 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg skeleton-box" />
          <div className="h-5 skeleton-box rounded-md w-64 hidden sm:block" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-9 skeleton-box rounded-xl w-32 hidden md:block" />
          <div className="w-9 h-9 rounded-full skeleton-box" />
        </div>
      </header>

      {/* Main Content Area Skeleton matching layout */}
      <main className="pt-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {path.includes('/dashboard') ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-8 skeleton-box rounded-xl w-64" />
              <div className="h-4 skeleton-box rounded-lg w-96" />
            </div>
            <SkeletonStatistics count={4} />
            <div className="space-y-4 pt-4">
              <div className="h-6 skeleton-box rounded-lg w-36" />
              <SkeletonArticleCard count={3} />
            </div>
          </div>
        ) : path.includes('/notifications') ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 skeleton-box rounded-xl w-48" />
              <div className="h-8 skeleton-box rounded-lg w-32" />
            </div>
            <SkeletonNotification count={5} />
          </div>
        ) : path.includes('/articles') || path.includes('/published') || path.includes('/ready-to-publish') || path.includes('/drafts') ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-2">
                <div className="h-8 skeleton-box rounded-xl w-64" />
                <div className="h-4 skeleton-box rounded-lg w-80" />
              </div>
              <div className="h-10 skeleton-box rounded-xl w-64" />
            </div>
            <SkeletonArticleCard count={6} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div className="space-y-2">
                <div className="h-8 skeleton-box rounded-xl w-48" />
                <div className="h-4 skeleton-box rounded-lg w-72" />
              </div>
              <div className="h-10 skeleton-box rounded-xl w-64" />
            </div>
            <SkeletonTable />
          </div>
        )}
      </main>
    </div>
  );
};

export default PageSkeletonFallback;
