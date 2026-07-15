import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Upload,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Calendar
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

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleImmediateUpload = async (id: string, file: File) => {
    const article = articles.find(a => a.articleId === id);
    if (!article) return;

    try {
      showToast('Uploading review document...', 'info');
      const response = await updateArticleStatus(id, 'under_review', {
        remarks: article.reviewerFeedback?.remarks || article.remarks || 'Reviewed via peer assessment portal.',
        recommendation: article.selectedStatus || article.reviewerFeedback?.recommendation || 'Needs Improvement',
        reviewedFile: file
      });
      if (response.success) {
        showToast('Review document uploaded successfully.', 'success');
        fetchArticles();
      } else {
        showToast('Failed to upload document.', 'error');
      }
    } catch (error: any) {
      showToast('Error uploading document: ' + (error.message || error), 'error');
    }
  };

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

    if (article.selectedStatus === 'Needs Improvement' && !article.uploadedFile) {
      showToast('Please upload a document explaining the needed improvements to proceed.', 'error');
      return;
    }

    setSubmittingId(id);
    try {
      const remarksText = article.remarks || 'Reviewed via peer assessment portal.';
      // Send the status update to the backend PATCH /:id/status route
      const response = await updateArticleStatus(id, 'under_review', {
        remarks: remarksText,
        recommendation: article.selectedStatus,
        reviewedFile: article.uploadedFile
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
        <div className="space-y-6 mx-4">
          {articles.map((article) => {
            const isReviewed = !!article.reviewerFeedback;
            const isHighlighted = highlightId === article.articleId;

            // Determine status text & recommendation style
            let statusText = 'PENDING REVIEW';
            let statusStyle = 'bg-indigo-50 text-indigo-600 border-indigo-100';

            if (isReviewed) {
              if (['Approved', 'Accepted'].includes(article.selectedStatus)) {
                statusText = 'APPROVED';
                statusStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100';
              } else if (['Rejected'].includes(article.selectedStatus)) {
                statusText = 'REJECTED';
                statusStyle = 'bg-rose-50 text-rose-600 border-rose-100';
              } else {
                statusText = 'REVISION';
                statusStyle = 'bg-amber-50 text-amber-600 border-amber-200';
              }
            }

            return (
              <div 
                key={article.articleId} 
                id={`reviewer-article-${article.articleId}`}
                className={cn(
                  "bg-white rounded-3xl border border-zinc-200 shadow-sm p-5 sm:p-6 space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden text-left",
                  isReviewed && "opacity-85",
                  isHighlighted && "bg-black/[0.01] border-l-4 border-black animate-pulse-slow"
                )}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 
                      className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 font-['Outfit'] leading-tight"
                    >
                      {article.title}
                    </h2>
                  </div>

                  <div className="flex items-start gap-2 shrink-0">
                    <span className={cn(
                      "inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border leading-none font-sans",
                      statusStyle
                    )}>
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Information Panel */}
                <div className="bg-indigo-50/50 rounded-2xl py-2 px-4 sm:py-2.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-100/30">
                  <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                    {/* Calendar Icon */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-100/70 border border-indigo-200/20 flex items-center justify-center text-indigo-600 shrink-0">
                      <Calendar size={18} />
                    </div>
                    
                    {/* Date / Deadline */}
                    {isReviewed ? (
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Reviewed On</span>
                        <span className="text-xs font-bold text-zinc-700 font-sans">
                          {formatDateTimeline(article.reviewerFeedback?.updatedAt || article.updatedAt)}
                        </span>
                      </div>
                    ) : article.reviewDeadline ? (
                      <>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Review Deadline</span>
                          <span className="text-xs font-bold text-zinc-700 font-sans">
                            {new Date(article.reviewDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                        {article.reviewerNote && (
                          <div className="space-y-0.5 border-l border-indigo-100/50 pl-6 sm:pl-8 max-w-sm">
                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Editor Note</span>
                            <span className="text-xs italic text-zinc-500 font-medium line-clamp-1 block">"{article.reviewerNote}"</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Review Status</span>
                        <span className="text-xs font-bold text-zinc-500 font-sans">No deadline set</span>
                      </div>
                    )}
                  </div>

                  {/* Countdown Badge on the right */}
                  {!isReviewed && article.reviewDeadline && (() => {
                    const diff = getRemainingDays(article.reviewDeadline);
                    if (diff === null) return null;
                    if (diff < 0) {
                      return (
                        <span className="px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 border-rose-200 font-sans">
                          Deadline Passed
                        </span>
                      );
                    }
                    return (
                      <span className={cn(
                        "px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border leading-none font-sans",
                        diff === 0 ? "bg-rose-100 text-rose-700 border-rose-200" :
                        diff <= 3 ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-emerald-100 text-emerald-700 border-emerald-200"
                      )}>
                        {diff === 0 ? 'Due Today' : `${diff} Days Left`}
                      </span>
                    );
                  })()}
                </div>

                {/* Form Assessment or Feedback Details */}
                <div className="pt-2 border-t border-zinc-100 space-y-4">
                  {!isReviewed ? (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-sans">Submit Peer Assessment</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Recommendation */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Recommendation Decision</label>
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
                        </div>

                        {/* Remarks */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Reviewer Remarks / Feedback</label>
                          <textarea
                            placeholder="Add remarks..."
                            value={article.remarks || ''}
                            onChange={(e) => handleRemarksChange(article.articleId, e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-black outline-none resize-none h-12 shadow-sm focus:bg-white transition-all font-sans"
                          />
                        </div>
                      </div>

                      {/* File upload + Actions — 2-column row */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-start gap-3 w-full">
                        {/* Column 1: Upload zone */}
                        <div className="flex items-center gap-3 p-3 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200 w-full lg:w-auto min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                            <Upload size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-700">Annotated Manuscript File</p>
                            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Supports PDF, DOC, DOCX</p>
                          </div>
                          <div className="flex items-center gap-2 ml-auto shrink-0">
                            {article.uploadedFile ? (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                {article.uploadedFile.name}
                              </span>
                            ) : article.selectedStatus === 'Needs Improvement' ? (
                              <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider animate-pulse">
                                ⚠️ Required
                              </span>
                            ) : (
                              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                                Optional
                              </span>
                            )}
                            <button
                              onClick={() => fileInputRefs.current[article.articleId]?.click()}
                              className={cn(
                                "px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border shadow-sm cursor-pointer",
                                article.uploadedFile
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-white text-zinc-700 hover:border-black border-zinc-200"
                              )}
                            >
                              {article.uploadedFile ? 'Change File' : 'Browse File'}
                            </button>
                            <input
                              type="file"
                              ref={el => { fileInputRefs.current[article.articleId] = el; }}
                              onChange={(e) => handleFileChange(article.articleId, e)}
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Column 2: Action buttons */}
                        <div className="flex items-center gap-3 shrink-0 lg:ml-auto w-full lg:w-auto justify-end">
                          <button 
                            onClick={() => handleDownload(article.articleId, article.title)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-blue-700 transition-all uppercase cursor-pointer shadow-sm font-sans flex items-center justify-center h-11"
                          >
                            <Download size={14} className="mr-2" />
                            Download Manuscript
                          </button>

                          <button
                            onClick={() => handleSubmit(article.articleId)}
                            disabled={submittingId === article.articleId}
                            className="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all uppercase cursor-pointer shadow-sm font-sans flex items-center justify-center h-11 disabled:bg-zinc-200 disabled:cursor-not-allowed"
                          >
                            {submittingId === article.articleId ? (
                              <>
                                <Loader2 size={14} className="animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              'Submit Assessment'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Already reviewed — show remarks + completed row */
                    <div className="space-y-3">
                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Remarks</span>
                        <p className="text-xs text-zinc-700 font-medium italic font-sans">
                          "{article.reviewerFeedback?.remarks || article.remarks || 'Reviewed via peer assessment portal.'}"
                        </p>
                      </div>

                      {/* Completed row — file status + download in one row */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-2 text-emerald-600 font-sans">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Assessment Completed</span>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap justify-end">
                          {article.reviewerFeedback?.recommendation === 'Needs Improvement' ? (
                            article.reviewerFeedback?.reviewedFile ? (
                              <>
                                <button
                                  onClick={() => handleDownload(article.articleId, article.title)}
                                  className="px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                  <Download size={12} /> View Upload
                                </button>
                                <button
                                  onClick={() => fileInputRefs.current[article.articleId]?.click()}
                                  className="px-4 py-2 bg-white text-zinc-500 hover:text-black border border-zinc-200 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                                >
                                  Change Document
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest animate-pulse">⚠️ Document Required</span>
                                <button
                                  onClick={() => fileInputRefs.current[article.articleId]?.click()}
                                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer animate-pulse"
                                >
                                  <Upload size={12} /> Upload
                                </button>
                              </>
                            )
                          ) : article.reviewerFeedback?.reviewedFile ? (
                            <button
                              onClick={() => handleDownload(article.articleId, article.title)}
                              className="px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Download size={12} /> View Upload
                            </button>
                          ) : null}

                          <button 
                            onClick={() => handleDownload(article.articleId, article.title)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-blue-700 transition-all uppercase cursor-pointer shadow-sm font-sans flex items-center justify-center"
                          >
                            <Download size={14} className="mr-2" />
                            Download Manuscript
                          </button>

                          <input
                            type="file"
                            ref={el => { fileInputRefs.current[article.articleId] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImmediateUpload(article.articleId, file);
                            }}
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
