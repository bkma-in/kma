import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Users,
  BookOpen,
  Tag,
  FileText,
  Loader2,
  ChevronRight,
  Calendar,
  Hash,
} from 'lucide-react';
import { getPdfUrl, getPublicPdfUrl } from '../services/article.service';

interface Author {
  name: string;
  email?: string;
  affiliation?: string;
  userId?: string;
}

interface ArticlePreviewModalProps {
  article: any | null;
  onClose: () => void;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
  onAuthorClick?: (author: Author) => void;
}

const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
  article,
  onClose,
  isLoggedIn = false,
  onLoginRequired,
  onAuthorClick,
}) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const getIssueDetails = () => {
    if (!article) return '';
    const parts = [];
    if (article.monthYear) {
      parts.push(article.monthYear);
    }
    const volVal = article.vol || article.volume;
    if (volVal) {
      const volText = `Vol. No. ${volVal}`;
      const issueText = article.issueNumber ? `, Issue No. ${article.issueNumber}` : '';
      const issnText = article.issn ? ` ISSN ${article.issn}` : '';
      parts.push(`${volText}${issueText}${issnText}`);
    } else if (article.issn) {
      parts.push(`ISSN ${article.issn}`);
    }
    return parts.join(' | ');
  };

  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [article]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!article) return null;

  // Detect tribute / obituary articles by title or tag
  const isTribute = /obituary|tribute|in memoriam/i.test(article.title || '') ||
    /obituary|tribute/i.test(article.tag || '');

  const authors: Author[] = Array.isArray(article.authors) && article.authors.length > 0
    ? article.authors
    : article.author
    ? [{ name: article.author }]
    : [{ name: 'Old BKMA Contributor' }];

  const keywords: string[] = article.keywords
    ? article.keywords.split(/[,;]/).map((k: string) => k.trim()).filter(Boolean)
    : [];

  const handleReadPdf = async () => {
    if (!isTribute && !isLoggedIn) {
      onLoginRequired?.();
      return;
    }
    setPdfLoading(true);
    setPdfError('');
    try {
      const res = isTribute 
        ? await getPublicPdfUrl(article.id || article.articleId)
        : await getPdfUrl(article.id || article.articleId);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        setPdfError('Could not load the PDF. Please try again.');
      }
    } catch (err: any) {
      setPdfError(err?.response?.data?.error || 'Failed to retrieve PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal Panel */}
      <div
        className="bg-white w-full sm:max-w-2xl lg:max-w-3xl max-h-[95vh] sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                Bulletin of Kerala Mathematical Association
              </p>
              <p className="text-[11px] font-bold text-zinc-600">
                {isTribute ? '' : getIssueDetails()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} className="text-zinc-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-7">

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {isTribute ? (
              <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                Tribute
              </span>
            ) : (
              article.isOld && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Legacy Edition
                </span>
              )
            )}
            {article.subjectClassification && (
              <span className="bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                {article.subjectClassification}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-black leading-tight tracking-tight font-['Playfair_Display',serif]">
            {article.title}
          </h2>

          {/* Authors — hidden for tributes */}
          {!isTribute && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Authors</span>
            </div>
            <div className="space-y-2.5">
              {authors.map((au, i) => (
                <div
                  key={i}
                  onClick={() => onAuthorClick && au.name !== 'Old BKMA Contributor' && onAuthorClick(au)}
                  className={`flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 ${onAuthorClick && au.name !== 'Old BKMA Contributor' ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors group' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs font-black shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    {au.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold text-black ${onAuthorClick && au.name !== 'Old BKMA Contributor' ? 'group-hover:text-blue-600 transition-colors' : ''}`}>
                      {au.name}
                    </p>
                    {au.affiliation && (
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{au.affiliation}</p>
                    )}
                    {au.email && (
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">{au.email}</p>
                    )}
                  </div>
                  {onAuthorClick && au.name !== 'Old BKMA Contributor' && (
                    <ChevronRight size={14} className="text-zinc-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Abstract — label changes for tributes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {isTribute ? 'About' : 'Abstract'}
              </span>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6">
              <p className="text-[15px] text-zinc-700 leading-relaxed font-serif italic">
                {article.abstract || 'No abstract available.'}
              </p>
            </div>
          </div>

          {/* Keywords — hidden for tributes */}
          {!isTribute && keywords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={14} className="text-zinc-400" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Keywords</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[11px] font-medium border border-zinc-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata row — hidden for tributes */}
          {!isTribute && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(article.vol || article.volume) && (
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 flex items-center gap-2">
                <Hash size={14} className="text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Volume</p>
                  <p className="text-xs font-bold text-black mt-0.5">Vol. {article.vol || article.volume}</p>
                </div>
              </div>
            )}
            {article.issn && (
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 flex items-center gap-2">
                <FileText size={14} className="text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">ISSN</p>
                  <p className="text-xs font-bold text-black font-mono mt-0.5">{article.issn}</p>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-zinc-100 shrink-0 bg-white">
          {pdfError && (
            <p className="text-xs text-red-500 font-bold mb-3 text-center">{pdfError}</p>
          )}
          <button
            onClick={handleReadPdf}
            disabled={pdfLoading}
            className="w-full py-4 bg-black text-white rounded-[1rem] font-black text-sm tracking-[0.2em] uppercase hover:bg-zinc-800 transition-all shadow-xl shadow-black/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {pdfLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                LOADING PDF…
              </>
            ) : (
              <>
                <Download size={18} />
                {isTribute ? 'KNOW MORE' : isLoggedIn ? 'READ FULL PDF' : 'READ'}
              </>
            )}
          </button>
          {!isTribute && (
            <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-3">
              Open Access · No Subscription Required
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlePreviewModal;
