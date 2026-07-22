import React from 'react';
import { SkeletonStatistics } from './SkeletonStatistics';
import { SkeletonArticleCard } from './SkeletonArticleCard';
import { SkeletonTable } from './SkeletonTable';
import { SkeletonNotification } from './SkeletonNotification';

export const PageSkeletonFallback: React.FC = () => {
  const path = window.location.pathname;

  if (path.includes('/dashboard')) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="space-y-2">
          <div className="h-8 bg-zinc-200 rounded-lg w-48" />
          <div className="h-4 bg-zinc-200 rounded-lg w-72" />
        </div>
        <SkeletonStatistics count={4} />
        <div className="space-y-4 pt-4">
          <div className="h-6 bg-zinc-200 rounded-lg w-36" />
          <SkeletonArticleCard count={3} />
        </div>
      </div>
    );
  }

  if (path.includes('/notifications')) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="h-8 bg-zinc-200 rounded-lg w-48 mb-6" />
        <SkeletonNotification count={5} />
      </div>
    );
  }

  if (
    path.includes('/articles') ||
    path.includes('/published') ||
    path.includes('/ready-to-publish') ||
    path.includes('/drafts')
  ) {
    return (
      <div className="space-y-8 animate-pulse p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-zinc-200 rounded-lg w-48" />
            <div className="h-4 bg-zinc-200 rounded-lg w-64" />
          </div>
          <div className="h-10 bg-zinc-200 rounded-xl w-64" />
        </div>
        <SkeletonArticleCard count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="h-8 bg-zinc-200 rounded-lg w-48 mb-6" />
      <SkeletonTable />
    </div>
  );
};

export default PageSkeletonFallback;
