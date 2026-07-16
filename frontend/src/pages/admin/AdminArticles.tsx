import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Send, 
  RotateCcw, 
  UploadCloud, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  History, 
  X,
  MessageSquare,
  AlertCircle,
  UserCheck,
  Loader2,
  Calendar
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { getArticles, assignReviewers as assignReviewersService, updateArticleStatus, getPdfUrl } from '../../services/article.service';
import { getReviewers } from '../../services/user.service';
import { formatDate } from '../../utils/dateHelpers';

// Types
type ArticleStatus = 
  | 'Submitted' 
  | 'Revised Submitted'
  | 'Need Improvements' 
  | 'Revision Requested'
  | 'Approved' 
  | 'Ready to Publish'
  | 'Published' 
  | 'Rejected'
  | 'Sent to Reviewer'
  | 'Under Review'
  | 'Desk Rejected'
  | 'Awaiting Decision';

type ReviewerRecommendation = 'Approved' | 'Accepted' | 'Needs Improvement' | 'Need Improvements' | 'Rejected' | 'None';

interface Version {
  version: number;
  uploadedBy: 'Author' | 'Reviewer';
  timestamp: string;
  fileName: string;
}

interface Article {
  id: string;
  title: string;
  author: string;
  abstract: string;
  status: ArticleStatus;
  assignedReviewers: string[];
  lastUpdated: string;
  versions: Version[];
  reviewerFeedback?: {
    remarks: string;
    recommendation: ReviewerRecommendation;
    reviewedFile?: string;
    reviewedFileName?: string;
  };
  adminNote?: string;
  rejectionReason?: string;
  reviews?: Record<string, {
    remarks: string;
    recommendation: ReviewerRecommendation;
    reviewerName?: string;
    reviewedFile?: string;
    reviewedFileName?: string;
    updatedAt?: any;
  }>;
  reviewDeadline?: string;
  assignedAt?: any;
  assignedBy?: string;
  reviewerNote?: string;
  revisionHistory?: any[];
  pastReviews?: any[];
}

const AdminArticles = () => {
  const { confirm, showToast } = useNotification();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'All'>('All');

  // Handle URL search params for filtering
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const validStatuses = ['Submitted', 'Revised Submitted', 'Need Improvements', 'Revision Requested', 'Approved', 'Ready to Publish', 'Published', 'Rejected', 'Sent to Reviewer', 'Under Review', 'Desk Rejected', 'Awaiting Decision'];
      if (validStatuses.includes(statusParam)) {
        setStatusFilter(statusParam as ArticleStatus);
      } else if (statusParam === 'All') {
        setStatusFilter('All');
      }
    }
  }, [searchParams]);


  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Manuscript Preview System States
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isAssigningFromPreview, setIsAssigningFromPreview] = useState(false);
  const [isRejectingFromPreview, setIsRejectingFromPreview] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Multi-Reviewer Selection and Confirmation states
  const [selectedReviewersForAssigning, setSelectedReviewersForAssigning] = useState<string[]>([]);
  const [isConfirmingAssignment, setIsConfirmingAssignment] = useState(false);
  const [assignmentValidationError, setAssignmentValidationError] = useState<string | null>(null);
  const [reviewerSearchTerm, setReviewerSearchTerm] = useState('');

  const getDefaultDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const [reviewDeadline, setReviewDeadline] = useState(getDefaultDeadline());
  const [reviewerNote, setReviewerNote] = useState('');

  const getRemainingDays = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) return null;
    const deadlineStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffMs = deadlineStart.getTime() - todayStart.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([]);

  const getReviewerComments = (art: Article | any) => {
    if (!art) return [];
    const comments: string[] = [];
    if (art.reviews) {
      Object.values(art.reviews).forEach((r: any) => {
        if (r && r.remarks && r.remarks.trim()) {
          const clean = r.remarks.trim();
          if (clean !== 'Reviewed via peer assessment portal.' && clean !== 'Reviewed via peer assessment portal') {
            comments.push(clean);
          }
        }
      });
    }
    if (comments.length === 0 && art.reviewerFeedback?.remarks) {
      const clean = art.reviewerFeedback.remarks.trim();
      if (clean !== 'Reviewed via peer assessment portal.' && clean !== 'Reviewed via peer assessment portal') {
        comments.push(clean);
      }
    }
    return comments;
  };

  const [isAdminNoteModalOpen, setIsAdminNoteModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  interface Reviewer {
    uid: string;
    name: string;
    expertise: string;
    availability: 'Available' | 'Busy' | 'On Leave';
  }

  useEffect(() => {
    if (!previewArticle) {
      setPreviewUrl(null);
      return;
    }
    const loadPreview = async () => {
      setIsPreviewLoading(true);
      try {
        const response = await getPdfUrl(previewArticle.id);
        if (response.success) {
          setPreviewUrl(response.url);
        }
      } catch (error) {
        console.error('Failed to load preview url', error);
      } finally {
        setIsPreviewLoading(false);
      }
    };
    loadPreview();
  }, [previewArticle]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [articlesRes, reviewersRes] = await Promise.all([
          getArticles(),
          getReviewers()
        ]);
        
        if (articlesRes.success) {
          const backendToFrontendStatusMap: Record<string, ArticleStatus> = {
            'submitted': 'Submitted',
            'revised_submitted': 'Revised Submitted',
            'revision_requested': 'Revision Requested',
            'accepted': 'Ready to Publish',
            'published': 'Published',
            'rejected': 'Rejected',
            'under_review': 'Under Review',
            'desk_rejected': 'Desk Rejected'
          };
          
          const mappedArticles = articlesRes.articles.map((a: any) => {
            // Filter reviews to only count active ones for the current round
            const activeReviews: Record<string, any> = {};
            const assignedTime = a.assignedAt ? new Date(a.assignedAt._seconds ? a.assignedAt._seconds * 1000 : (a.assignedAt.seconds ? a.assignedAt.seconds * 1000 : a.assignedAt)).getTime() : 0;

            if (a.reviews) {
              Object.entries(a.reviews).forEach(([uid, r]: [string, any]) => {
                const reviewTime = r.updatedAt ? new Date(r.updatedAt._seconds ? r.updatedAt._seconds * 1000 : (r.updatedAt.seconds ? r.updatedAt.seconds * 1000 : r.updatedAt)).getTime() : 0;
                // Add a buffer of 5 seconds to handle execution timestamps
                if (reviewTime >= assignedTime - 5000) {
                  activeReviews[uid] = r;
                }
              });
            }

            const hasReviews = Object.keys(activeReviews).length > 0;
            const mappedStatus = backendToFrontendStatusMap[a.status] || 'Submitted';
            
            let status: ArticleStatus = mappedStatus;
            if (a.status === 'under_review' && hasReviews) {
              status = 'Awaiting Decision';
            } else if (a.status === 'accepted') {
              status = 'Ready to Publish';
            }

            return {
              id: a.articleId || a.id,
              title: a.title,
              author: a.authors?.find((au: any) => au.role === 'submitter')?.name || a.author || 'Author',
              abstract: a.abstract || '',
              status,
              assignedReviewers: a.assignedReviewers || [],
              lastUpdated: formatDate(a.updatedAt || a.createdAt),
              versions: a.revisionHistory ? 
                a.revisionHistory.map((v: any, idx: number) => ({
                  version: idx + 1,
                  uploadedBy: 'Author' as const,
                  timestamp: formatDate(v.replacedAt || v.submittedAt || a.createdAt),
                  fileName: v.pdfName || 'manuscript.pdf'
                })).concat([{
                  version: a.revisionHistory.length + 1,
                  uploadedBy: 'Author' as const,
                  timestamp: formatDate(a.updatedAt || a.createdAt),
                  fileName: a.pdfName || 'manuscript.pdf'
                }]) : [{ 
                  version: 1, 
                  uploadedBy: 'Author' as const, 
                  timestamp: formatDate(a.createdAt), 
                  fileName: a.pdfName || 'manuscript.pdf' 
                }],
              rejectionReason: a.rejectionReason,
              adminNote: a.adminNote,
              reviewerFeedback: a.reviewerFeedback,
              reviews: activeReviews,
              revisionHistory: a.revisionHistory || [],
              pastReviews: a.pastReviews || []
            };
          });
          setArticles(mappedArticles);
        }
        
        if (reviewersRes.success) {
          const approvedReviewers = reviewersRes.reviewers
            .filter((r: any) => r.status === 'Approved')
            .map((r: any) => ({
              uid: r.id,
              name: r.name,
              expertise: r.qualification || 'Expert Reviewer',
              availability: 'Available'
            }));
          setAvailableReviewers(approvedReviewers);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showToast('Failed to load manuscripts and reviewers data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status) {
      // Green — accepted / ready
      case 'Approved':        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Ready to Publish': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Published':       return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      // Yellow — revision
      case 'Revision Requested': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Needs Improvement':  return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Need Improvements':  return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Awaiting Decision':  return 'bg-amber-50 text-amber-700 border-amber-200';
      // Red — rejection
      case 'Rejected':      return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Desk Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      // Blue — under review
      case 'Under Review':      return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Sent to Reviewer':  return 'bg-blue-50 text-blue-700 border-blue-200';
      // Default — submitted / other
      case 'Submitted': return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      case 'Revised Submitted': return 'bg-blue-50 text-blue-700 border-blue-200';
      default:          return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 size={12} />;
      case 'Ready to Publish': return <CheckCircle2 size={12} />;
      case 'Needs Improvement': return <AlertCircle size={12} />;
      case 'Need Improvements': return <AlertCircle size={12} />;
      case 'Revision Requested': return <Clock size={12} />;
      case 'Rejected': return <XCircle size={12} />;
      case 'Desk Rejected': return <XCircle size={12} />;
      case 'Published': return <UploadCloud size={12} />;
      case 'Submitted': return <FileText size={12} />;
      case 'Revised Submitted': return <Clock size={12} />;
      case 'Sent to Reviewer': return <Send size={12} />;
      case 'Under Review': return <Send size={12} />;
      case 'Awaiting Decision': return <MessageSquare size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase());
    // If statusFilter is 'All', exclude 'Ready to Publish', 'Published', and 'Revision Requested'
    // so they disappear from the active review queue immediately.
    const matchesStatus = statusFilter === 'All'
      ? (art.status !== 'Ready to Publish' && art.status !== 'Published')
      : art.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetails = (article: Article) => {
    setSelectedArticle(article);
    setIsDetailsOpen(true);
  };

  const updateStatus = async (id: string, status: ArticleStatus, extraData?: any, successMsg?: string) => {
    try {
      const backendStatusMap: Record<string, string> = {
        'Submitted': 'submitted',
        'Revised Submitted': 'revised_submitted',
        'Need Improvements': 'revision_requested',
        'Needs Improvement': 'revision_requested',
        'Revision Requested': 'revision_requested',
        'Approved': 'accepted',
        'Ready to Publish': 'accepted',
        'Published': 'published',
        'Rejected': 'rejected',
        'Under Review': 'under_review',
        'Desk Rejected': 'desk_rejected'
      };
      
      const backendStatus = backendStatusMap[status] || status.toLowerCase();
      
      const response = await updateArticleStatus(id, backendStatus, extraData);
      if (response.success) {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, status, ...extraData } : a));
        if (selectedArticle?.id === id) {
          setSelectedArticle(prev => prev ? { ...prev, status, ...extraData } : null);
        }
        showToast(successMsg || `Status updated successfully.`, 'success');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast("Failed to update status.", 'error');
    }
  };

  const assignReviewers = async (id: string, reviewers: string[]) => {
    try {
      const reviewerIds = reviewers.map(name => {
        const rev = availableReviewers.find(r => r.name === name);
        return rev ? (rev as any).uid : null;
      }).filter(Boolean);

      if (reviewerIds.length === 0) {
        showToast("No valid reviewers selected.", 'error');
        return;
      }

      const response = await assignReviewersService(id, reviewerIds, reviewers, reviewDeadline, reviewerNote);
      if (response.success) {
        setArticles(prev => prev.map(a => a.id === id ? { 
          ...a, 
          assignedReviewers: reviewers, 
          status: 'Under Review',
          reviewDeadline: reviewDeadline || undefined,
          reviewerNote: reviewerNote || undefined,
          assignedAt: new Date(),
          reviews: {},
          reviewerFeedback: undefined
        } : a));
        if (selectedArticle?.id === id) {
          setSelectedArticle(prev => prev ? { 
            ...prev, 
            assignedReviewers: reviewers, 
            status: 'Under Review',
            reviewDeadline: reviewDeadline || undefined,
            reviewerNote: reviewerNote || undefined,
            assignedAt: new Date(),
            reviews: {},
            reviewerFeedback: undefined
          } : null);
        }
        showToast("Reviewers assigned successfully.", 'success');
        
        // Reset states
        setReviewDeadline(getDefaultDeadline());
        setReviewerNote('');
      }
    } catch (error) {
      console.error('Failed to assign reviewers:', error);
      showToast("Failed to assign reviewers.", 'error');
    }
  };

  const handleDownload = async (articleId: string, title: string, key?: string) => {
    try {
      showToast(`Generating secure download link...`, 'info');
      const res = await getPdfUrl(articleId, key);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        showToast('Failed to retrieve download link.', 'error');
      }
    } catch (err: any) {
      showToast('Error downloading file: ' + (err.response?.data?.error || err.message || err), 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={48} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
              <History size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Workflow Engine</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Article Management</h1>
          <p className="text-zinc-500 mt-2 text-sm">Orchestrate the peer-review process between authors and academic reviewers.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-64 focus:ring-2 focus:ring-black outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Workflow States</option>
              {['Submitted', 'Revised Submitted', 'Need Improvements', 'Revision Requested', 'Ready to Publish', 'Published', 'Rejected', 'Sent to Reviewer', 'Under Review', 'Desk Rejected', 'Awaiting Decision'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards Queue Section */}
      <div className="space-y-5">
        {filteredArticles.map((article) => {
          return (
            <div 
              key={article.id} 
              className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5 sm:p-6 space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 
                    className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900"
                  >
                    {article.title}
                  </h2>
                  <p className="text-xs text-zinc-500 font-semibold font-sans mt-1">
                    Author: <span className="uppercase text-zinc-700">{article.author}</span>
                  </p>
                </div>

                <div className="flex items-start gap-2 shrink-0">
                  {article.versions && article.versions.length > 1 && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20 leading-none font-sans">
                      Revised
                    </span>
                  )}
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border leading-none font-sans",
                    article.status === 'Submitted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    (article.status === 'Under Review' || article.status === 'Awaiting Decision') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    article.status === 'Revision Requested' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    ['Ready to Publish', 'Approved'].includes(article.status) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    article.status === 'Published' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    'bg-zinc-50 text-zinc-500 border-zinc-200'
                  )}>
                    {getStatusIcon(article.status)}
                    {article.status}
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
                  
                  {/* Last Updated */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Last Updated</span>
                    <span className="text-xs font-bold text-zinc-700 font-sans">{article.lastUpdated}</span>
                  </div>

                  {/* Review Deadline */}
                  {article.reviewDeadline && (
                    <div className="space-y-0.5 border-l border-indigo-100/50 pl-6 sm:pl-8">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Review Deadline</span>
                      <span className="text-xs font-bold text-zinc-700 font-sans">
                        {new Date(article.reviewDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Deadline badge (right side) */}
                {article.reviewDeadline && (() => {
                  const diff = getRemainingDays(article.reviewDeadline);
                  if (diff === null) return null;
                  let label = '';
                  let style = '';
                  if (diff < 0) {
                    label = 'Review Closed';
                    style = 'bg-rose-100 text-rose-700 border-rose-200';
                  } else if (diff === 0) {
                    label = 'Due Today';
                    style = 'bg-amber-100 text-amber-700 border-amber-200';
                  } else if (diff <= 3) {
                    label = 'Final Review';
                    style = 'bg-zinc-100 text-zinc-600 border-zinc-200';
                  } else {
                    label = `${diff} Days Left`;
                    style = 'bg-amber-100 text-amber-700 border-amber-200';
                  }
                  return (
                    <span className={cn("px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border leading-none font-sans", style)}>
                      {label}
                    </span>
                  );
                })()}
              </div>

              {/* Reviewer Table */}
              {article.assignedReviewers && article.assignedReviewers.length > 0 ? (
                <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-indigo-50/20 border-b border-zinc-100">
                          <th className="px-4 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest font-sans w-1/4 align-middle">Reviewer</th>
                          <th className="px-4 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest font-sans w-1/4 align-middle">Status</th>
                          <th className="px-4 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest font-sans w-2/4 align-middle">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {article.assignedReviewers.map(r => {
                          const review = article.reviews ? Object.values(article.reviews).find(
                            (rev: any) => rev.reviewerName?.toLowerCase() === r.toLowerCase()
                          ) : null;
                          
                          let statusText = 'ACTIVE';
                          let statusStyle = 'bg-indigo-50 text-indigo-600 border-indigo-100'; // ACTIVE in light purple

                          if (review && review.recommendation) {
                            if (['Approved', 'Accepted'].includes(review.recommendation)) {
                              statusText = 'COMPLETED';
                              statusStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                            } else if (['Rejected'].includes(review.recommendation)) {
                              statusText = 'REJECTED';
                              statusStyle = 'bg-rose-50 text-rose-600 border-rose-100';
                            } else if (['Needs Improvement', 'Need Improvements'].includes(review.recommendation)) {
                              statusText = 'REVISION';
                              statusStyle = 'bg-amber-50 text-amber-600 border-amber-200';
                            }
                          }

                          const displayRemarks = review?.remarks && 
                            review.remarks.trim() !== 'Reviewed via peer assessment portal.' && 
                            review.remarks.trim() !== 'Reviewed via peer assessment portal'
                              ? `"${review.remarks}"`
                              : null;

                          return (
                            <tr key={r} className="hover:bg-zinc-50/30 transition-colors align-middle">
                              <td className="px-4 py-2 text-xs font-bold text-zinc-800 font-sans align-middle">{r}</td>
                              <td className="px-4 py-2 align-middle">
                                <span className={cn(
                                  "inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border leading-none font-sans",
                                  statusStyle
                                )}>
                                  {statusText}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-xs text-zinc-700 font-medium font-sans align-middle">
                                {displayRemarks ? (
                                  displayRemarks
                                ) : (
                                  <span className="text-zinc-400 italic font-medium">— No comments submitted yet —</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50/50 border border-dashed border-zinc-200 rounded-2xl p-6 text-center text-zinc-400 text-xs font-medium italic">
                  — No reviewers assigned to this manuscript —
                </div>
              )}

              {/* Actions Section */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                {article.status === 'Revision Requested' ? (
                  <span className="px-6 py-3 bg-amber-50/50 border border-amber-100/50 text-amber-600 rounded-xl text-[10px] font-black tracking-widest uppercase font-sans h-11 flex items-center justify-center font-bold">
                    Under Author Update
                  </span>
                ) : ['Published', 'Ready to Publish', 'Rejected', 'Desk Rejected'].includes(article.status) ? (
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">No actions required</span>
                ) : (article.status === 'Revised Submitted' || (article.status === 'Submitted' && article.versions && article.versions.length > 1)) ? (
                  <button 
                    onClick={() => {
                      setPreviewArticle(article);
                      setIsPreviewOpen(true);
                      setIsAssigningFromPreview(true);
                      setIsRejectingFromPreview(false);
                      setRejectionReasonText('');
                      setRejectionError(null);
                      setReviewerSearchTerm('');
                      setSelectedReviewersForAssigning(article.assignedReviewers || []);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-blue-700 transition-all uppercase cursor-pointer shadow-md hover:shadow-lg font-sans h-11 flex items-center justify-center font-bold"
                  >
                    Send back to Reviewer(s)
                  </button>
                ) : (!article.assignedReviewers || article.assignedReviewers.length === 0) ? (
                  <button 
                    onClick={() => {
                      setPreviewArticle(article);
                      setIsPreviewOpen(true);
                      setIsAssigningFromPreview(false);
                      setIsRejectingFromPreview(false);
                      setRejectionReasonText('');
                      setRejectionError(null);
                      setSelectedReviewersForAssigning([]);
                    }}
                    className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all uppercase cursor-pointer shadow-md hover:shadow-lg font-sans h-11 flex items-center justify-center font-bold"
                  >
                    Review Submission
                  </button>
                ) : (() => {
                  const reviewsList = article.reviews ? Object.values(article.reviews) : (article.reviewerFeedback ? [article.reviewerFeedback] : []);
                  const diff = article.reviewDeadline ? getRemainingDays(article.reviewDeadline) : null;
                  const isOverdue = diff !== null && diff < 0;

                  const approvedReviews = reviewsList.filter((r: any) => ['Approved', 'Accepted'].includes(r.recommendation));
                  const rejectOrRevisionReviews = reviewsList.filter((r: any) => ['Rejected', 'Needs Improvement', 'Need Improvements'].includes(r.recommendation));

                  const hasFeedback = reviewsList.length > 0;
                  const showPublish = approvedReviews.length > 0 || isOverdue;
                  const showSendBack = rejectOrRevisionReviews.length > 0 || isOverdue;

                  if (!hasFeedback && !isOverdue) {
                    return (
                      <span className="px-6 py-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black tracking-widest uppercase font-sans h-11 flex items-center justify-center font-bold shadow-sm">
                        Waiting for Reviews
                      </span>
                    );
                  }

                  return (
                    <div className="flex flex-wrap items-center gap-3">
                      {showSendBack && (
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setAdminNote('');
                            setIsAdminNoteModalOpen(true);
                          }}
                          className="px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-amber-600 transition-all uppercase cursor-pointer shadow-md hover:shadow-lg font-sans h-11 flex items-center justify-center font-bold"
                        >
                          Send Back to Author
                        </button>
                      )}

                      {showPublish && (
                        <button
                          onClick={() => {
                            confirm({
                              title: 'Move to Publish List',
                              message: 'Move this article to the Ready to Publish list?',
                              confirmText: 'Move',
                              onConfirm: () => {
                                updateStatus(article.id, 'Ready to Publish', null, 'Article successfully moved to Ready to Publish list.');
                              }
                            });
                          }}
                          className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-emerald-700 transition-all uppercase cursor-pointer shadow-md hover:shadow-lg font-sans h-11 flex items-center justify-center font-bold"
                        >
                          Move to Publish List
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          );
        })}
      </div>



      {/* Admin Note Modal */}
      {isAdminNoteModalOpen && selectedArticle && (() => {
        const reviewerComments = getReviewerComments(selectedArticle);
        const isCompulsory = reviewerComments.length === 0;
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAdminNoteModalOpen(false)} />
            <div className="relative bg-white/80 backdrop-blur-2xl w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
              <div className="px-8 py-6 border-b border-white/10 bg-white/40 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-black">Send Back to Author</h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {isCompulsory ? 'Admin note is compulsory since there are no reviewer comments.' : 'Add an optional note for the author.'}
                  </p>
                </div>
                <button onClick={() => setIsAdminNoteModalOpen(false)} className="text-zinc-400 hover:text-black">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                {reviewerComments.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Reviewer Comments</label>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs space-y-3 text-zinc-600 max-h-40 overflow-y-auto font-sans">
                      {reviewerComments.map((comment, index) => (
                        <div key={index} className="border-b border-zinc-200/60 last:border-none pb-2 last:pb-0">
                          <span className="font-bold text-zinc-800 text-[10px] uppercase tracking-wider block mb-1">Reviewer #{index + 1}</span>
                          <p className="italic">"{comment}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                    Admin Note {isCompulsory ? '(Compulsory)' : '(Optional)'}
                  </label>
                  <textarea 
                    rows={4}
                    placeholder={isCompulsory ? "Explain the reason for sending back to the author..." : "e.g. Please address the reviewer's comments about section 3.2..."}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none resize-none transition-all"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsAdminNoteModalOpen(false)}
                    className="flex-1 py-4 bg-zinc-100/50 backdrop-blur-sm text-zinc-600 rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-200 transition-all border border-white/10"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={() => {
                      if (isCompulsory && !adminNote.trim()) {
                        showToast('Admin Note is compulsory when there are no reviewer comments.', 'error');
                        return;
                      }
                      updateStatus(selectedArticle!.id, 'Revision Requested', { adminNote }, 'Revision request sent to author.');
                      setIsAdminNoteModalOpen(false);
                      setIsDetailsOpen(false);
                      setAdminNote('');
                    }}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    CONFIRM
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manuscript Preview Modal */}
      {isPreviewOpen && previewArticle && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl h-[90vh] bg-zinc-950 text-white rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest pt-0.5">
                  Manuscript Preview • {previewArticle.id}
                </span>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 space-y-8 custom-scrollbar">
              
              {/* Article Info Section */}
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  {previewArticle.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400 border-b border-white/5 pb-4">
                  <div>
                    <span className="font-semibold text-zinc-500 uppercase tracking-widest text-[9px] block">Author</span>
                    <span className="text-zinc-200 font-medium text-sm">{previewArticle.author}</span>
                  </div>
                  <div className="h-8 w-[1px] bg-white/5 hidden sm:block" />
                  <div>
                    <span className="font-semibold text-zinc-500 uppercase tracking-widest text-[9px] block">Submission Date</span>
                    <span className="text-zinc-200 font-medium text-sm">{previewArticle.versions[0].timestamp}</span>
                  </div>
                  <div className="h-8 w-[1px] bg-white/5 hidden sm:block" />
                  <div>
                    <span className="font-semibold text-zinc-500 uppercase tracking-widest text-[9px] block">Initial Status</span>
                    <span className="text-zinc-200 font-medium text-sm flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {previewArticle.status}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Abstract</h4>
                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-serif italic">
                    "{previewArticle.abstract}"
                  </p>
                </div>
              </div>

              {/* Document Preview Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  Document Viewer
                </h4>
                
                {previewArticle.versions[previewArticle.versions.length - 1].fileName.endsWith('.pdf') ? (
                  /* Simulated Premium PDF Viewer */
                  <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                    {/* PDF Toolbar */}
                    <div className="bg-zinc-950 px-4 py-3 border-b border-white/5 flex items-center justify-between text-xs text-zinc-400 select-none">
                      <div className="flex items-center gap-2 font-medium truncate max-w-[50%]">
                        <FileText size={14} className="text-red-400 shrink-0" />
                        <span className="truncate">{previewArticle.versions[previewArticle.versions.length - 1].fileName}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-semibold tracking-wider">PAGE 1 OF 2</span>
                        <div className="h-4 w-[1px] bg-white/5" />
                        <div className="flex items-center gap-2">
                          <button className="px-2 py-0.5 hover:bg-white/5 rounded">-</button>
                          <span className="font-semibold">100%</span>
                          <button className="px-2 py-0.5 hover:bg-white/5 rounded">+</button>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-zinc-500">
                        <button 
                          onClick={() => handleDownload(previewArticle.id, previewArticle.title)}
                          className="p-1 hover:text-white transition-colors cursor-pointer" 
                          title="Download Original"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Real PDF Viewer inside the container */}
                    <div className="w-full aspect-[4/5] bg-zinc-800 flex flex-col relative">
                      {previewUrl ? (
                        <iframe 
                          src={`${previewUrl}#toolbar=0`} 
                          className="w-full h-full border-none animate-in fade-in duration-300" 
                          title="PDF Preview" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-4 py-24 bg-zinc-900/40">
                          {isPreviewLoading ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-zinc-400">Establishing Secure Connection...</p>
                            </>
                          ) : (
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Preview link unavailable</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Styled DOCX Preview Placeholder & Scrollable Content Area */
                  <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                    {/* Visual Placeholder Header */}
                    <div className="p-6 sm:p-8 bg-zinc-950/60 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-14 h-14 bg-blue-950/40 text-blue-400 border border-blue-800/30 rounded-xl flex items-center justify-center shadow-lg">
                          <FileText size={28} />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-zinc-200">Word Document Preview Placeholder</h5>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Live rendering of .docx files is restricted. You can read the extracted text below.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownload(previewArticle.id, previewArticle.title)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold transition-all uppercase shrink-0 cursor-pointer"
                      >
                        <Download size={14} /> Download DOCX
                      </button>
                    </div>

                    {/* Extracted Scrollable Content Area */}
                    <div className="p-6 sm:p-8 max-h-[350px] overflow-y-auto space-y-6 text-sm text-zinc-300 leading-relaxed font-serif custom-scrollbar">
                      <h4 className="font-bold font-sans uppercase text-[10px] tracking-wider text-zinc-400">Extracted Manuscript Text</h4>
                      <p className="font-bold text-base text-zinc-100 font-sans">{previewArticle.title}</p>
                      <p className="italic text-zinc-400 font-sans text-xs">Author: {previewArticle.author} | File: {previewArticle.versions[previewArticle.versions.length - 1].fileName}</p>
                      <p>
                        [EXTRACTED CONTENT] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                      </p>
                      <p>
                        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer - Sticky Action Buttons */}
            {previewArticle.status === 'Submitted' && (
              <div className="px-6 py-5 sm:px-8 sm:py-6 border-t border-white/5 bg-zinc-950 flex items-center justify-between gap-4 shrink-0">
                <button 
                  onClick={() => setIsRejectingFromPreview(true)}
                  className="px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black tracking-widest transition-all shadow-xl shadow-rose-600/10 active:scale-95 uppercase flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  Reject On Desk
                </button>
                
                <button 
                  onClick={() => {
                    setIsAssigningFromPreview(true);
                    setReviewerSearchTerm('');
                  }}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black tracking-widest transition-all shadow-xl shadow-emerald-600/10 active:scale-95 uppercase flex items-center justify-center gap-2"
                >
                  <UserCheck size={16} />
                  Assign Reviewer
                </button>
              </div>
            )}

            {/* REVIEWER ASSIGNMENT OVERLAY MODAL */}
            {isAssigningFromPreview && (
              <div className="absolute inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                  {/* Overlay Header */}
                  <div className="px-6 py-5 border-b border-white/5 bg-zinc-950 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                        {previewArticle?.versions && previewArticle.versions.length > 1 ? 'Reassign / Select Reviewers' : 'Select Reviewers'}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {previewArticle?.versions && previewArticle.versions.length > 1
                          ? 'Review previous recommendations and assign new or existing reviewers.'
                          : 'Select between 1 and 5 reviewers for this manuscript.'
                        }
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsAssigningFromPreview(false);
                        setAssignmentValidationError(null);
                        setReviewerSearchTerm('');
                      }}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="px-6 py-4 border-b border-white/5 bg-zinc-950/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search reviewers by name or expertise..."
                        value={reviewerSearchTerm}
                        onChange={(e) => setReviewerSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  {/* Scrollable list content */}
                  <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2.5">
                      {availableReviewers
                        .filter(r => r.name.toLowerCase().includes(reviewerSearchTerm.toLowerCase()) || r.expertise.toLowerCase().includes(reviewerSearchTerm.toLowerCase()))
                        .map(reviewer => {
                        const isSelected = selectedReviewersForAssigning.includes(reviewer.name);
                        return (
                          <div
                            key={reviewer.name}
                            onClick={() => {
                              setAssignmentValidationError(null);
                              setSelectedReviewersForAssigning(prev => 
                                prev.includes(reviewer.name)
                                  ? prev.filter(r => r !== reviewer.name)
                                  : [...prev, reviewer.name]
                              );
                            }}
                            className={cn(
                              "w-full p-4 rounded-2xl transition-all border flex items-center justify-between gap-4 cursor-pointer text-left",
                              isSelected
                                ? "bg-white/10 border-white/30 text-white"
                                : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                readOnly
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold truncate text-white">{reviewer.name}</p>
                                  {(() => {
                                    const prevReview = previewArticle?.reviews ? Object.values(previewArticle.reviews).find((rev: any) => rev.reviewerName === reviewer.name) : null;
                                    if (!prevReview) return null;
                                    const rec = prevReview.recommendation;
                                    return (
                                      <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider leading-none shrink-0 font-sans",
                                        ['Approved', 'Accepted'].includes(rec) ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                        ['Rejected'].includes(rec) ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      )}>
                                        {rec === 'Needs Improvement' || rec === 'Need Improvements' ? 'REVISION' : rec.toUpperCase()}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">{reviewer.expertise}</p>
                              </div>
                            </div>

                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shrink-0",
                              reviewer.availability === 'Available' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30' :
                              reviewer.availability === 'Busy' ? 'bg-amber-950/40 text-amber-400 border-amber-800/30' :
                              'bg-rose-950/40 text-rose-400 border-rose-800/30'
                            )}>
                              {reviewer.availability}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Review Timeline Section */}
                    <div className="border-t border-white/5 pt-6 mt-4 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} className="text-white" /> Review Timeline
                      </h4>
                      
                      {/* Review Deadline */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1" htmlFor="review-deadline">
                          Review Deadline <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="review-deadline"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={reviewDeadline}
                          onChange={(e) => setReviewDeadline(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                          required
                        />
                      </div>

                      {/* Optional Note to Reviewer */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1" htmlFor="reviewer-note">
                          Optional Note to Reviewer
                        </label>
                        <textarea
                          id="reviewer-note"
                          rows={3}
                          placeholder="Please complete your review before the selected date."
                          value={reviewerNote}
                          onChange={(e) => setReviewerNote(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-600 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inline validation and footer actions */}
                  <div className="p-6 border-t border-white/5 bg-zinc-950/60 shrink-0 space-y-4">
                    {assignmentValidationError && (
                      <p className="text-[10px] font-bold text-rose-500 px-1 text-center animate-pulse">
                        {assignmentValidationError}
                      </p>
                    )}

                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          setIsAssigningFromPreview(false);
                          setAssignmentValidationError(null);
                          setReviewerSearchTerm('');
                        }}
                        className="flex-1 py-4 bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl font-bold text-xs tracking-widest transition-all border border-white/5 uppercase"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedReviewersForAssigning.length === 0) {
                            setAssignmentValidationError("At least one reviewer is required.");
                            return;
                          }
                          if (selectedReviewersForAssigning.length > 5) {
                            setAssignmentValidationError("Maximum 5 reviewers allowed.");
                            return;
                          }
                          const selectedDate = new Date(reviewDeadline);
                          const today = new Date();
                          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          if (isNaN(selectedDate.getTime()) || selectedDate < todayStart) {
                            setAssignmentValidationError("Please select a valid future deadline.");
                            return;
                          }
                          setIsConfirmingAssignment(true);
                        }}
                        disabled={selectedReviewersForAssigning.length === 0 || !reviewDeadline}
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs tracking-widest transition-all shadow-lg shadow-emerald-600/20 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Assign Reviewers
                      </button>
                    </div>
                  </div>

                  {/* CONFIRMATION POPUP OVERLAY */}
                  {isConfirmingAssignment && (
                    <div className="absolute inset-0 z-[170] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
                      <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                          <UserCheck size={24} />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-bold text-white uppercase tracking-tight">Confirm Assignment</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {selectedReviewersForAssigning.length === 1
                              ? `Are you sure you want to assign ${selectedReviewersForAssigning[0]} as reviewer?`
                              : `Are you sure you want to assign ${selectedReviewersForAssigning.length} reviewers to this manuscript?`
                            }
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setIsConfirmingAssignment(false)}
                            className="flex-1 py-3 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black tracking-widest transition-all uppercase border border-white/5"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              assignReviewers(previewArticle.id, selectedReviewersForAssigning);
                              setIsConfirmingAssignment(false);
                              setIsAssigningFromPreview(false);
                              setIsPreviewOpen(false);
                              setSelectedReviewersForAssigning([]);
                            }}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black tracking-widest transition-all shadow-md shadow-emerald-600/10 uppercase"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* DESK REJECTION OVERLAY MODAL */}
            {isRejectingFromPreview && (
              <div className="absolute inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-8 py-6 border-b border-white/5 bg-zinc-950 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight font-sans">Confirm Desk Rejection</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Are you sure you want to reject this manuscript?</p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsRejectingFromPreview(false);
                        setRejectionError(null);
                      }}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                        Rejection Reason <span className="text-rose-500">*</span>
                      </label>
                      <textarea 
                        rows={4}
                        placeholder="Provide reason for desk rejection..."
                        value={rejectionReasonText}
                        onChange={(e) => {
                          setRejectionReasonText(e.target.value);
                          if (e.target.value.trim()) setRejectionError(null);
                        }}
                        className={cn(
                          "w-full bg-zinc-950 border rounded-2xl p-4 text-xs focus:ring-2 outline-none resize-none transition-all font-medium text-zinc-200",
                          rejectionError ? "border-rose-500 focus:ring-rose-500" : "border-white/10 focus:ring-white"
                        )}
                      />
                      {rejectionError && (
                        <p className="text-[10px] font-bold text-rose-500 px-1 animate-pulse">
                          {rejectionError}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          setIsRejectingFromPreview(false);
                          setRejectionError(null);
                        }}
                        className="flex-1 py-4 bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl font-bold text-xs tracking-widest transition-all border border-white/5"
                      >
                        CANCEL
                      </button>
                      <button 
                        onClick={() => {
                          if (!rejectionReasonText.trim()) {
                            setRejectionError('Rejection reason is required.');
                            return;
                          }
                          
                          updateStatus(previewArticle.id, 'Desk Rejected', { rejectionReason: rejectionReasonText });
                          setRejectionReasonText('');
                          setIsRejectingFromPreview(false);
                          setIsPreviewOpen(false);
                        }}
                        className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                      >
                        CONFIRM REJECT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArticles;
