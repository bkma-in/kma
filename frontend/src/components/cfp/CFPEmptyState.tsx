import React from 'react';
import { Megaphone, SearchX } from 'lucide-react';

interface CFPEmptyStateProps {
  title?: string;
  description?: string;
}

export const CFPEmptyState: React.FC<CFPEmptyStateProps> = ({
  title = 'No Calls for Papers Found',
  description = 'There are currently no active or matching calls for papers. Please check back soon or clear your filters.'
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center max-w-md mx-auto my-8 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-500">
        <SearchX size={32} />
      </div>
      <h3 className="text-xl font-bold text-black mb-2 font-['Outfit']">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
};
