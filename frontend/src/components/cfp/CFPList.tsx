import React from 'react';
import type { CallForPaper } from '../../types/cfp';
import { CallForPaperCard } from './CallForPaperCard';
import { CFPEmptyState } from './CFPEmptyState';

interface CFPListProps {
  cfps: CallForPaper[];
  loading?: boolean;
  onReadMore?: (cfp: CallForPaper) => void;
  onSubmitPaper?: (cfp: CallForPaper) => void;
}

export const CFPList: React.FC<CFPListProps> = ({
  cfps,
  loading = false,
  onReadMore,
  onSubmitPaper
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-zinc-100 rounded-lg w-1/3" />
            <div className="h-8 bg-zinc-100 rounded-lg w-3/4" />
            <div className="h-16 bg-zinc-100 rounded-lg w-full" />
            <div className="h-10 bg-zinc-100 rounded-lg w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!cfps || cfps.length === 0) {
    return <CFPEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cfps.map(cfp => (
        <CallForPaperCard
          key={cfp.id}
          cfp={cfp}
          onReadMore={() => onReadMore && onReadMore(cfp)}
          onSubmitPaper={() => onSubmitPaper && onSubmitPaper(cfp)}
        />
      ))}
    </div>
  );
};
