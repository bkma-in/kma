import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRight, Send, Lock, Sparkles } from 'lucide-react';
import type { CallForPaper } from '../../types/cfp';
import { CFPStatusBadge } from './CFPStatusBadge';
import { DeadlineBadge } from './DeadlineBadge';
import { useAuth } from '../../context/AuthContext';

interface CallForPaperCardProps {
  cfp: CallForPaper;
  onReadMore?: () => void;
  onSubmitPaper?: () => void;
  compact?: boolean;
}

export const CallForPaperCard: React.FC<CallForPaperCardProps> = ({
  cfp,
  onReadMore,
  onSubmitPaper,
  compact = false
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isClosed = cfp.status === 'closed' || cfp.status === 'archived';

  const handleReadMore = () => {
    if (onReadMore) onReadMore();
    else navigate(`/call-for-papers/${cfp.id}`);
  };

  const handleSubmit = () => {
    if (isClosed) return;
    if (onSubmitPaper) {
      onSubmitPaper();
      return;
    }

    const state = {
      cfpId: cfp.id,
      volume: cfp.volume,
      issue: cfp.issue,
      theme: cfp.theme || ''
    };

    if (currentUser) {
      if (currentUser.role === 'author') {
        navigate('/author/submit', { state });
      } else {
        navigate('/author/submit', { state });
      }
    } else {
      navigate('/auth?mode=login', { state: { redirectTo: '/author/submit', cfpData: state } });
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-wider">
            <BookOpen size={13} />
            Volume {cfp.volume} • Issue {cfp.issue}
          </span>
          <CFPStatusBadge status={cfp.status} />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight font-['Outfit'] group-hover:text-zinc-700 transition-colors mb-2 line-clamp-2">
          {cfp.title}
        </h3>

        {cfp.subtitle && (
          <p className="text-sm font-medium text-zinc-500 mb-3 line-clamp-1">
            {cfp.subtitle}
          </p>
        )}

        {cfp.theme && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
              <Sparkles size={12} className="text-amber-600" />
              Special Issue: {cfp.theme}
            </span>
          </div>
        )}

        {!compact && cfp.description && (
          <div 
            className="text-sm text-zinc-600 leading-relaxed mb-6 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: cfp.description }}
          />
        )}
      </div>

      <div className="pt-4 border-t border-zinc-100 mt-4 space-y-4">
        <DeadlineBadge deadline={cfp.deadline} />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReadMore}
            className="inline-flex items-center gap-2 text-xs font-bold text-black hover:text-zinc-600 transition-colors cursor-pointer uppercase tracking-wider py-2"
          >
            <span>Read More</span>
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isClosed}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
              isClosed
                ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed shadow-none'
                : 'bg-black text-white hover:bg-zinc-800 active:scale-95 shadow-black/10'
            }`}
          >
            {isClosed ? (
              <>
                <Lock size={14} />
                <span>Submission Closed</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Submit Paper</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
