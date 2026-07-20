import React from 'react';

interface SkeletonArticleCardProps {
  count?: number;
}

export const SkeletonArticleCard: React.FC<SkeletonArticleCardProps> = ({ count = 6 }) => {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col">
          {/* Tag & issue metadata */}
          <div className="flex items-center gap-2 mb-5">
            <div className="h-4 skeleton-box rounded-full w-20" />
            <div className="h-3 skeleton-box rounded w-24" />
          </div>
          
          {/* Title */}
          <div className="space-y-2 mb-4 min-h-[3.5rem]">
            <div className="h-5 skeleton-box rounded w-full" />
            <div className="h-5 skeleton-box rounded w-5/6" />
          </div>

          {/* Abstract description */}
          <div className="space-y-2 mb-8 flex-1">
            <div className="h-3 skeleton-box rounded w-full" />
            <div className="h-3 skeleton-box rounded w-full" />
            <div className="h-3 skeleton-box rounded w-2/3" />
          </div>

          {/* Footer author metadata & action button */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-5 pt-5 border-t border-zinc-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full skeleton-box shrink-0" />
                <div className="h-3.5 skeleton-box rounded w-24" />
              </div>
              <div className="h-3 skeleton-box rounded w-12" />
            </div>
            
            <div className="w-full h-11 skeleton-box rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
