import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Upload,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { useLocation } from 'react-router-dom';
import { getArticles, getPdfUrl, updateArticleStatus } from '../../services/article.service';

type ReviewStatus = 'Accepted' | 'Rejected' | 'Needs Improvement' | '';

const ReviewerArticles = () => {
  const { showToast } = useNotification();
  const location = useLocation();
  const highlightId: string | undefined = (location.state as any)?.highlightId;
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const getRemainingDays = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) return null;
    const deadlineStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffMs = deadlineStart.getTime() - todayStart.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const formatDateTimeline = (val: any) => {
    if (!val) return 'N/A';
    const ms = val.seconds ? val.seconds * 1000 : (val._seconds ? val._seconds * 1000 : new Date(val).getTime());
    if (isNaN(ms)) return String(val);
    return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await getArticles();
        if (response.success) {
          // Initialize selectedStatus from existing feedback if reviewer already completed it
          const mapped = response.articles.map((art: any) => ({
            ...art,
            selectedStatus: art.reviewerFeedback?.recommendation || ''
          }));
          setArticles(mapped);
        } else {
          showToast('Failed to fetch assigned articles.', 'error');
        }
      } catch (error: any) {
        console.error('Failed to fetch articles:', error);
        showToast('Error retrieving assignments: ' + (error.message || error), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Scroll to and highlight the article from notification
  useEffect(() => {
    if (!highlightId || loading) return;
    const el = document.getElementById(`reviewer-article-${highlightId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [highlightId, loading]);

  const handleDownload = async (articleId: string, title: string) => {
    try {
      showToast(`Generating secure download link for "${title.slice(0, 20)}..."`, 'info');
      const res = await getPdfUrl(articleId);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        showToast('Failed to retrieve PDF download link.', 'error');
      }
    } catch (err: any) {
      showToast('Error downloading PDF: ' + (err.message || err), 'error');
    }
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'doc', 'docx'].includes(ext || '')) {
        setArticles(prev => prev.map(art =>
          art.articleId === id ? { ...art, uploadedFile: file } : art
        ));
        showToast(`Selected review file: ${file.name}`, 'info');
      } else {
        showToast('Please upload PDF or DOC files only.', 'error');
      }
    }
  };

  const handleStatusChange = (id: string, status: ReviewStatus) => {
    setArticles(prev => prev.map(art =>
      art.articleId === id ? { ...art, selectedStatus: status } : art
    ));
  };

  const handleRemarksChange = (id: string, remarks: string) => {
    setArticles(prev => prev.map(art =>
      art.articleId === id ? { ...art, remarks } : art
    ));
  };

  const handleSubmit = async (id: string) => {
    const article = articles.find(a => a.articleId === id);
    if (!article || !article.selectedStatus) {
      showToast('Please select a decision status before submitting.', 'info');
      return;
    }

    if (['Rejected', 'Needs Improvement'].includes(article.selectedStatus) && (!article.remarks || !article.remarks.trim())) {
      showToast('Please provide reviewer comments explaining your decision for Rejection or Needs Revision.', 'error');
      return;
    }

    setSubmittingId(id);
    try {
      const remarksText = article.remarks || 'Reviewed via peer assessment portal.';
      // Send the status update to the backend PATCH /:id/status route
      const response = await updateArticleStatus(id, 'under_review', {
        remarks: remarksText,
        recommendation: article.selectedStatus
      });

      if (response.success) {
        setArticles(prev => prev.map(art =>
          art.articleId === id ? {
            ...art,
            reviewerFeedback: {
              recommendation: article.selectedStatus,
              remarks: remarksText
            }
          } : art
        ));
        setSuccessMessage('Review submitted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        showToast('Failed to submit review.', 'error');
      }
    } catch (error: any) {
      showToast('Error submitting review: ' + (error.message || error), 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loading Assignments</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-10 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-black/20">
                <FileText size={18} />
              </div>
              <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">Assessment Portal</h2>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Assigned Articles</h1>
            <p className="text-zinc-500 mt-2 text-sm max-w-md leading-relaxed">Download manuscripts, perform your assessment, and upload the reviewed version with your decision.</p>
          </div>
        </div>

        {/* Empty state message */}
        <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-xl p-20 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2 border border-amber-100">
            <AlertCircle size={32} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-black tracking-tight font-['Outfit']">No articles assigned yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm">When the administrator assigns manuscripts to you for peer review, they will appear here in your queue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-black/20">
              <FileText size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">Assessment Portal</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Assigned Articles</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-md leading-relaxed">Download manuscripts, perform your assessment, and upload the reviewed version with your decision.</p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-8 duration-500">
          <div className="bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-sm font-bold tracking-tight font-['Outfit']">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-xl overflow-hidden mx-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-[16.66%]">Manuscript Details</th>
                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-[16.66%] text-center">Reference</th>
                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-[16.66%] whitespace-nowrap">Time and Date</th>
                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-[16.66%] text-center">Decision</th>
                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-[16.66%] text-center">Upload Result</th>
                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-[16.66%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {articles.map((article) => {
                const isReviewed = !!article.reviewerFeedback;
                const isHighlighted = highlightId === article.articleId;
                return (

                  <tr
                    key={article.articleId}
                    id={`reviewer-article-${article.articleId}`}
                    className={cn(
                      "group transition-all duration-300",
                      isReviewed ? "opacity-60 bg-zinc-50/50" : "hover:bg-zinc-50/50",
                      isHighlighted && "bg-black/[0.03] border-l-4 border-black animate-pulse"
                    )}
                  >

                    <td className="px-8 py-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-400 tracking-[0.2em] uppercase">{article.articleId}</p>
                        <h3 className="text-sm font-bold text-black group-hover:text-zinc-700 transition-colors line-clamp-2 leading-tight font-['Outfit']">{article.title}</h3>
                      </div>
                    </td>

                    {/* Reference – Download Button */}
                    <td className="px-8 py-8 text-center">
                      <button
                        onClick={() => handleDownload(article.articleId, article.title)}
                        className="p-3 bg-white text-zinc-600 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm border border-zinc-100 group/btn"
                        title="Download Original Manuscript"
                      >
                        <Download size={18} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </td>

                    {/* Time and Date column */}
                    <td className="px-8 py-8">
                      {isReviewed ? (
                        <div className="space-y-1">
                          <span className="font-black uppercase tracking-widest text-[8px] text-zinc-400 block mb-0.5">Reviewed On</span>
                          <p className="text-xs font-bold text-emerald-600">
                            {formatDateTimeline(article.reviewerFeedback?.updatedAt || article.updatedAt)}
                          </p>
                        </div>
                      ) : article.reviewDeadline ? (
                        <div className="space-y-2 min-w-[160px]">
                          {/* Deadline date */}
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                            <span className="font-black uppercase tracking-widest text-[8px] text-zinc-400">Deadline</span>
                          </div>
                          <p className="text-xs font-bold text-black">
                            {new Date(article.reviewDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>

                          {/* Countdown badge */}
                          {(() => {
                            const diff = getRemainingDays(article.reviewDeadline);
                            if (diff === null) return null;
                            if (diff < 0) {
                              return (
                                <div className="space-y-1.5">
                                  <span className="inline-block px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded font-bold uppercase text-[8px] tracking-wide">
                                    🔴 Deadline Passed
                                  </span>
                                  <p className="text-[9px] text-rose-500 italic leading-snug">
                                    You can still submit your review.
                                  </p>
                                </div>
                              );
                            }
                            return (
                              <span className={cn(
                                "inline-block px-2 py-0.5 rounded border font-bold uppercase text-[8px] tracking-wide",
                                diff === 0
                                  ? "bg-rose-50 border-rose-100 text-rose-600"
                                  : diff <= 3
                                    ? "bg-amber-50 border-amber-100 text-amber-600"
                                    : "bg-emerald-50 border-emerald-100 text-emerald-600"
                              )}>
                                {diff === 0 ? '⏰ Due Today' : diff <= 3 ? `🟠 ${diff} Days Left` : `🟢 ${diff} Days Left`}
                              </span>
                            );
                          })()}

                          {/* Editor note */}
                          {article.reviewerNote && (
                            <div className="pt-1.5 border-t border-zinc-100 text-[9px] text-zinc-400 italic leading-relaxed">
                              <strong className="not-italic text-zinc-500">Note:</strong> "{article.reviewerNote}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest">—</span>
                      )}
                    </td>

                    {/* Decision */}
                    <td className="px-8 py-8 text-center">
                      {!isReviewed ? (
                        <div className="relative space-y-2 max-w-[180px] mx-auto text-left">
                          <select
                            value={article.selectedStatus}
                            onChange={(e) => handleStatusChange(article.articleId, e.target.value as ReviewStatus)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm"
                          >
                            <option value="" disabled>Status</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Needs Improvement">Need Revision</option>
                          </select>
                          <textarea
                            placeholder="Add remarks..."
                            value={article.remarks || ''}
                            onChange={(e) => handleRemarksChange(article.articleId, e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[10px] font-medium focus:ring-2 focus:ring-black outline-none resize-none h-12 shadow-sm focus:bg-white transition-all font-sans"
                          />
                        </div>
                      ) : (
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          (article.selectedStatus === 'Accepted' || article.selectedStatus === 'Approved') ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            article.selectedStatus === 'Rejected' ? "bg-rose-50 text-rose-700 border-rose-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {article.selectedStatus}
                        </div>
                      )}
                    </td>

                    {/* Upload Result */}
                    <td className="px-8 py-8">
                      {!isReviewed ? (
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => fileInputRefs.current[article.articleId]?.click()}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border shadow-sm",
                              article.uploadedFile
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-white text-zinc-500 hover:border-black border-zinc-200"
                            )}
                          >
                            <Upload size={14} />
                            {article.uploadedFile ? 'Change File' : 'Upload Review'}
                          </button>
                          {article.uploadedFile && (
                            <span className="text-[8px] text-zinc-400 font-bold truncate max-w-[120px] uppercase tracking-tighter">
                              {article.uploadedFile.name}
                            </span>
                          )}
                          <input
                            type="file"
                            ref={el => { fileInputRefs.current[article.articleId] = el; }}
                            onChange={(e) => handleFileChange(article.articleId, e)}
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-emerald-600">
                          <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={16} />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest">Logged</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-8 text-center">
                      {!isReviewed ? (
                        <button
                          onClick={() => handleSubmit(article.articleId)}
                          disabled={submittingId === article.articleId}
                          className="px-6 py-3 bg-black text-white rounded-xl font-bold text-[10px] tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95 inline-flex items-center justify-center gap-2 disabled:bg-zinc-200 disabled:cursor-not-allowed"
                        >
                          {submittingId === article.articleId ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              PROCESSING...
                            </>
                          ) : (
                            'SUBMIT ASSESSMENT'
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-zinc-300">
                          <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State Footer */}
      <div className="flex items-center justify-center py-20 opacity-20">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle size={48} className="text-zinc-400" />
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500">End of Assignment List</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewerArticles;
