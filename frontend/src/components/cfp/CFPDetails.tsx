import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Download, 
  Send, 
  Mail, 
  Phone, 
  FileCheck, 
  HelpCircle, 
  Lock, 
  Sparkles, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import type { CallForPaper } from '../../types/cfp';
import { CFPStatusBadge } from './CFPStatusBadge';
import { DeadlineBadge } from './DeadlineBadge';
import { TopicTag } from './TopicTag';
import { CallForPaperTimeline } from './CallForPaperTimeline';
import { ImportantDatesCard } from './ImportantDatesCard';
import { useAuth } from '../../context/AuthContext';

interface CFPDetailsProps {
  cfp: CallForPaper;
}

export const CFPDetails: React.FC<CFPDetailsProps> = ({ cfp }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isClosed = cfp.status === 'closed' || cfp.status === 'archived';

  const handleSubmit = () => {
    if (isClosed) return;

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
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Banner & Title Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <BookOpen size={14} />
            <span>Volume {cfp.volume} • Issue {cfp.issue}</span>
          </div>

          <CFPStatusBadge status={cfp.status} />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tight font-['Outfit']">
            {cfp.title}
          </h1>
          {cfp.subtitle && (
            <p className="text-lg text-zinc-600 font-medium">
              {cfp.subtitle}
            </p>
          )}
          {cfp.theme && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold">
                <Sparkles size={14} className="text-amber-600" />
                Special Issue: {cfp.theme}
              </span>
            </div>
          )}
        </div>

        <CallForPaperTimeline
          openingDate={cfp.openingDate}
          deadline={cfp.deadline}
          publicationDate={cfp.publicationDate}
        />

        {/* Primary Action Button Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100">
          <DeadlineBadge deadline={cfp.deadline} />

          <div className="flex flex-wrap items-center gap-3">
            {cfp.attachment?.url && (
              <a
                href={cfp.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200 transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Download Guidelines PDF</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isClosed}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                isClosed
                  ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed shadow-none'
                  : 'bg-black text-white hover:bg-zinc-800 active:scale-95 shadow-black/10'
              }`}
            >
              {isClosed ? (
                <>
                  <Lock size={16} />
                  <span>Submission Closed</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Paper Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          {cfp.description && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-black font-['Outfit'] border-b border-zinc-100 pb-3">
                Call Description & Scope
              </h2>
              <div 
                className="text-zinc-700 leading-relaxed text-sm sm:text-base prose max-w-none"
                dangerouslySetInnerHTML={{ __html: cfp.description }}
              />
            </div>
          )}

          {/* Topics Covered */}
          {cfp.topics && cfp.topics.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-black font-['Outfit'] border-b border-zinc-100 pb-3">
                Topics Covered
              </h2>
              <div className="flex flex-wrap gap-2">
                {cfp.topics.map(topic => (
                  <TopicTag key={topic} topic={topic} />
                ))}
              </div>
            </div>
          )}

          {/* Author Guidelines & Requirements */}
          {(cfp.authorGuidelines || cfp.paperFormatRequirements || cfp.eligibility || cfp.reviewProcess) && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-black font-['Outfit'] border-b border-zinc-100 pb-3">
                Submission Guidelines & Review Process
              </h2>

              {cfp.eligibility && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider">Eligibility</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                    {cfp.eligibility}
                  </p>
                </div>
              )}

              {cfp.authorGuidelines && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider">Author Guidelines</h3>
                  <div className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 whitespace-pre-line">
                    {cfp.authorGuidelines}
                  </div>
                </div>
              )}

              {cfp.paperFormatRequirements && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider">Paper Format Requirements</h3>
                  <div className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 whitespace-pre-line">
                    {cfp.paperFormatRequirements}
                  </div>
                </div>
              )}

              {cfp.reviewProcess && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider">Peer Review Process</h3>
                  <div className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 whitespace-pre-line">
                    {cfp.reviewProcess}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Dates & Contact Sidebar */}
        <div className="space-y-6">
          <ImportantDatesCard
            dates={cfp.importantDates}
            openingDate={cfp.openingDate}
            deadline={cfp.deadline}
            publicationDate={cfp.publicationDate}
          />

          {/* Contact Info Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-black border-b border-zinc-100 pb-3 flex items-center gap-2">
              <Mail size={18} className="text-zinc-600" />
              Contact Editorial Office
            </h3>

            <div className="space-y-3 text-sm">
              {cfp.contactEmail && (
                <div className="flex items-center gap-2.5 text-zinc-700">
                  <Mail size={16} className="text-zinc-400 shrink-0" />
                  <a href={`mailto:${cfp.contactEmail}`} className="hover:underline font-semibold">
                    {cfp.contactEmail}
                  </a>
                </div>
              )}

              {cfp.contactPhone && (
                <div className="flex items-center gap-2.5 text-zinc-700">
                  <Phone size={16} className="text-zinc-400 shrink-0" />
                  <span>{cfp.contactPhone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
