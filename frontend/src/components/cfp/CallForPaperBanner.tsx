import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import type { CallForPaper } from '../../types/cfp';
import { CFPStatusBadge } from './CFPStatusBadge';

interface CallForPaperBannerProps {
  cfp: CallForPaper;
  className?: string;
}

export const CallForPaperBanner: React.FC<CallForPaperBannerProps> = ({ cfp, className }) => {
  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-zinc-900 text-white shadow-xl ${className || ''}`}>
      {cfp.banner ? (
        <img
          src={cfp.banner}
          alt={cfp.title}
          className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[1px]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-900 to-zinc-950 opacity-90" />
      )}

      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[220px]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-white border border-white/20">
            <BookOpen size={14} />
            <span>Volume {cfp.volume} • Issue {cfp.issue}</span>
          </div>

          <CFPStatusBadge status={cfp.status} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white font-['Outfit'] line-clamp-2">
            {cfp.title}
          </h2>
          {cfp.subtitle && (
            <p className="text-zinc-300 text-sm sm:text-base font-medium line-clamp-1 max-w-3xl">
              {cfp.subtitle}
            </p>
          )}
          {cfp.theme && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-semibold">
                <Sparkles size={12} />
                Special Issue: {cfp.theme}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
