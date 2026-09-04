import React from 'react';
import type { CallForPaper } from '../../types/cfp';
import { CallForPaperCard } from './CallForPaperCard';
import { CFPEmptyState } from './CFPEmptyState';
import { SkeletonCFPCard } from '../skeletons/SkeletonCFPCard';

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
    return <SkeletonCFPCard count={4} />;
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
