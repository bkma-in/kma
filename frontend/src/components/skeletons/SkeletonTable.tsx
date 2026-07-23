import React from 'react';

interface SkeletonTableProps {
  rowsCount?: number;
  colsCount?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rowsCount = 5, colsCount = 6 }) => {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
      {/* Table Header skeleton */}
      <div className="bg-zinc-50 border-b border-zinc-100 px-6 py-4 flex items-center justify-between gap-4">
        {Array.from({ length: colsCount }).map((_, idx) => (
          <div 
            key={idx} 
            className={`h-4 skeleton-box rounded ${
              idx === 0 ? 'w-8' : idx === 1 ? 'w-1/3' : 'w-20'
            }`} 
          />
        ))}
      </div>

      {/* Table Rows skeleton */}
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rowsCount }).map((_, rIdx) => (
          <div key={rIdx} className="px-6 py-5 flex items-center justify-between gap-4">
            {Array.from({ length: colsCount }).map((_, cIdx) => (
              <div 
                key={cIdx} 
                className={`rounded ${
                  cIdx === 0 
                    ? 'w-5 h-5 skeleton-box' // Checkbox
                    : cIdx === 1 
                      ? 'h-4 skeleton-box w-1/3' // Title
                      : cIdx === 2
                        ? 'h-4 skeleton-box w-24' // Author
                        : cIdx === 3
                          ? 'h-6 skeleton-box w-16 rounded-full' // Status badge
                          : cIdx === 4
                            ? 'h-4 skeleton-box w-20' // Date
                            : 'h-8 skeleton-box w-16' // Actions button
                }`} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
