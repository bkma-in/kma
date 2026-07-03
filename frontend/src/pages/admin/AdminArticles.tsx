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
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { getArticles, assignReviewers as assignReviewersService, updateArticleStatus, getPdfUrl } from '../../services/article.service';
import { getReviewers } from '../../services/user.service';
import { formatDate } from '../../utils/dateHelpers';

// Types
type ArticleStatus = 
  | 'Submitted' 
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
  category: string;
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
      const validStatuses = ['Submitted', 'Need Improvements', 'Revision Requested', 'Approved', 'Ready to Publish', 'Published', 'Rejected', 'Sent to Reviewer', 'Under Review', 'Desk Rejected', 'Awaiting Decision'];
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
  const [isAssigningFromPreview, setIsAssigningFromPreview] = useState(false);
  const [isRejectingFromPreview, setIsRejectingFromPreview] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Multi-Reviewer Selection and Confirmation states
  const [selectedReviewersForAssigning, setSelectedReviewersForAssigning] = useState<string[]>([]);
  const [isConfirmingAssignment, setIsConfirmingAssignment] = useState(false);
  const [assignmentValidationError, setAssignmentValidationError] = useState<string | null>(null);
  const [reviewerSearchTerm, setReviewerSearchTerm] = useState('');

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([]);

  const [isAdminNoteModalOpen, setIsAdminNoteModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  interface Reviewer {
    uid: string;
    name: string;
    expertise: string;
    availability: 'Available' | 'Busy' | 'On Leave';
  }

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
            'revision_requested': 'Revision Requested',
            'accepted': 'Ready to Publish',
            'published': 'Published',
            'rejected': 'Rejected',
            'under_review': 'Under Review',
            'desk_rejected': 'Desk Rejected'
          };
          
          const mappedArticles = articlesRes.articles.map((a: any) => {
            const hasReviews = a.reviews && Object.keys(a.reviews).length > 0;
            const mappedStatus = backendToFrontendStatusMap[a.status] || 'Submitted';
            
            let status: ArticleStatus = mappedStatus;
            if (a.status === 'under_review' && hasReviews) {
              const latestReview = a.reviewerFeedback;
              if (latestReview) {
                if (latestReview.recommendation === 'Approved' || latestReview.recommendation === 'Accepted') {
                  status = 'Ready to Publish';
                } else if (latestReview.recommendation === 'Needs Improvement' || latestReview.recommendation === 'Need Improvements') {
                  status = 'Need Improvements';
                } else if (latestReview.recommendation === 'Rejected') {
                  status = 'Rejected';
                } else {
                  status = 'Awaiting Decision';
                }
              } else {
                status = 'Awaiting Decision';
              }
            } else if (a.status === 'accepted') {
              status = 'Ready to Publish';
            }

            return {
              id: a.articleId || a.id,
              title: a.title,
              author: a.authors?.find((au: any) => au.role === 'submitter')?.name || a.author || 'Author',
              category: a.category || 'Mathematics',
              abstract: a.abstract || '',
              status,
              assignedReviewers: a.assignedReviewers || [],
              lastUpdated: formatDate(a.updatedAt || a.createdAt),
              versions: (a.versions || [{ version: 1, uploadedBy: 'Author', timestamp: a.createdAt, fileName: a.pdfName || 'manuscript.pdf' }]).map((v: any) => ({
                ...v,
                timestamp: formatDate(v.timestamp || a.createdAt)
              })),
              rejectionReason: a.rejectionReason,
              adminNote: a.adminNote,
              reviewerFeedback: a.reviewerFeedback,
              reviews: a.reviews
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
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Ready to Publish': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Needs Improvement': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Need Improvements': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Revision Requested': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Desk Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Published': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Submitted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Sent to Reviewer': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Under Review': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Awaiting Decision': return 'bg-violet-50 text-violet-600 border-violet-100';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
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
      ? (art.status !== 'Ready to Publish' && art.status !== 'Published' && art.status !== 'Revision Requested')
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

      const response = await assignReviewersService(id, reviewerIds, reviewers);
      if (response.success) {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, assignedReviewers: reviewers, status: 'Under Review' } : a));
        if (selectedArticle?.id === id) {
          setSelectedArticle(prev => prev ? { ...prev, assignedReviewers: reviewers, status: 'Under Review' } : null);
        }
        showToast("Reviewers assigned successfully.", 'success');
      }
    } catch (error) {
      console.error('Failed to assign reviewers:', error);
      showToast("Failed to assign reviewers.", 'error');
    }
  };

  const handleDownload = async (articleId: string, title: string, key?: string) => {
    try {
      showToast(`Generating secure download link...`, 'info');
      const urlParam = key ? `${articleId}?key=${encodeURIComponent(key)}` : articleId;
      const res = await getPdfUrl(urlParam);
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
              {['Submitted', 'Need Improvements', 'Revision Requested', 'Ready to Publish', 'Published', 'Rejected', 'Sent to Reviewer', 'Under Review', 'Desk Rejected', 'Awaiting Decision'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Manuscript Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Author</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reviewer Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reviewer Comments</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredArticles.map((article) => (
                <tr key={article.id} className={cn(
                  "group hover:bg-zinc-50/50 transition-colors",
                  ['Submitted', 'Approved'].includes(article.status) && "bg-zinc-50/30"
                )}>
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 mb-1 tracking-widest">{article.id}</p>
                      <h3 
                        onClick={() => openDetails(article)}
                        className="text-sm font-bold text-black hover:text-blue-600 cursor-pointer transition-colors line-clamp-1"
                      >
                        {article.title}
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-medium uppercase mt-1">Updated {article.lastUpdated}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-zinc-600 font-bold uppercase tracking-wider">
                    {article.author}
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        getStatusStyles(article.status)
                      )}>
                        {getStatusIcon(article.status)}
                        {article.status}
                      </span>
                      {article.assignedReviewers && article.assignedReviewers.length > 0 ? (
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider space-y-0.5 pl-1">
                          <span className="text-[8px] text-zinc-400 font-black tracking-widest block uppercase">Assigned:</span>
                          {article.assignedReviewers.map(r => (
                            <div key={r} className="truncate max-w-[150px]">{r}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[8px] text-zinc-400 italic pl-1">No reviewers assigned</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[10px] text-zinc-500 font-medium line-clamp-1 italic max-w-[200px]">
                      {article.reviewerFeedback?.remarks || 'No feedback yet'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {/* Contextual Action Buttons */}
                      {['Published', 'Ready to Publish', 'Rejected', 'Desk Rejected'].includes(article.status) ? (
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">No actions required</span>
                      ) : (!article.assignedReviewers || article.assignedReviewers.length === 0) ? (
                        // Stage 1: Before Reviewer Assignment
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
                          className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all uppercase cursor-pointer"
                        >
                          Review Submission
                        </button>
                      ) : (
                        // Stage 2: After Reviewer Assignment
                        <>
                          <button
                            onClick={() => {
                              // Verify eligibility: Must have an Approved or Accepted recommendation
                              const hasApprovedReview = 
                                (article.reviewerFeedback && (article.reviewerFeedback.recommendation === 'Approved' || article.reviewerFeedback.recommendation === 'Accepted')) ||
                                (article.reviews && Object.values(article.reviews).some((r: any) => r.recommendation === 'Approved' || r.recommendation === 'Accepted'));

                              if (!hasApprovedReview) {
                                showToast('This article is not eligible for publication. It must have an Approved or Accepted recommendation from a reviewer.', 'error');
                                return;
                              }

                              confirm({
                                title: 'Move to Publish List',
                                message: 'Move this article to the Ready to Publish list?',
                                confirmText: 'Move',
                                onConfirm: () => {
                                  updateStatus(article.id, 'Ready to Publish', null, 'Article successfully moved to Ready to Publish list.');
                                }
                              });
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-emerald-700 transition-all uppercase cursor-pointer"
                          >
                            Move to Publish List
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedArticle(article);
                              setAdminNote('');
                              setIsAdminNoteModalOpen(true);
                            }}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-amber-600 transition-all uppercase cursor-pointer"
                          >
                            Send Back to Author
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Article Details Side Panel / Drawer */}
      {isDetailsOpen && selectedArticle && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDetailsOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-8 py-8 border-b border-white/10 flex items-center justify-between bg-white/40 backdrop-blur-lg">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl",
                  getStatusStyles(selectedArticle.status).split(' ')[1].replace('text-', 'bg-')
                )}>
                  {getStatusIcon(selectedArticle.status)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black tracking-tight">{selectedArticle.id}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{selectedArticle.status}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              {/* 1. Article Content Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  <FileText size={14} />
                  Article Content
                </div>
                <div className="p-8 bg-white/40 backdrop-blur-md rounded-3xl border border-white/20">
                  <h2 className="text-2xl font-bold text-black mb-6 leading-tight">{selectedArticle.title}</h2>
                  <p className="text-sm text-zinc-600 leading-relaxed italic border-l-4 border-zinc-200/50 pl-6 mb-8">
                    "{selectedArticle.abstract}"
                  </p>
                  <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black">{selectedArticle.versions[0].fileName}</p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase">Original Manuscript</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownload(selectedArticle.id, selectedArticle.title)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400 hover:text-black cursor-pointer"
                      title="Download Original Manuscript"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desk Rejection Reason Section */}
              {selectedArticle.status === 'Desk Rejected' && selectedArticle.rejectionReason && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                    <XCircle size={14} />
                    Desk Rejection Details
                  </div>
                  <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 text-rose-800">
                    <p className="text-[9px] text-rose-400 font-black uppercase tracking-widest mb-2">Rejection Reason</p>
                    <div className="italic text-sm leading-relaxed">
                      "{selectedArticle.rejectionReason}"
                    </div>
                  </div>
                </div>
              )}

              {/* Peer Review Details Card */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  <UserCheck size={14} />
                  Peer Review Details
                </div>
                <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-200/50 space-y-6">
                  {/* Assigned Reviewer(s) */}
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 font-['Outfit']">Assigned Reviewer(s)</h4>
                    {selectedArticle.assignedReviewers && selectedArticle.assignedReviewers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedArticle.assignedReviewers.map(r => (
                          <span key={r} className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 uppercase font-['Outfit']">
                            {r}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">No reviewers assigned to this manuscript.</p>
                    )}
                  </div>

                  {/* Review Status & Decision */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 font-['Outfit']">Review Status</h4>
                      <p className="text-sm font-bold text-zinc-900">
                        {selectedArticle.reviews && Object.keys(selectedArticle.reviews).length > 0
                          ? 'Review Process Completed'
                          : selectedArticle.assignedReviewers && selectedArticle.assignedReviewers.length > 0
                            ? 'Awaiting Reviewer Assessment'
                            : 'Not Started'
                        }
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 font-['Outfit']">Review Decision</h4>
                      <p className={cn(
                        "text-sm font-bold",
                        selectedArticle.reviewerFeedback?.recommendation === 'Approved' || selectedArticle.reviewerFeedback?.recommendation === 'Accepted' ? 'text-emerald-600' :
                        selectedArticle.reviewerFeedback?.recommendation === 'Rejected' ? 'text-rose-600' :
                        selectedArticle.reviewerFeedback?.recommendation === 'Needs Improvement' || selectedArticle.reviewerFeedback?.recommendation === 'Need Improvements' ? 'text-amber-600' :
                        'text-zinc-500'
                      )}>
                        {selectedArticle.reviewerFeedback?.recommendation || 'None'}
                      </p>
                    </div>
                  </div>

                  {/* Review Completion Date */}
                  {selectedArticle.reviews && Object.keys(selectedArticle.reviews).length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 font-['Outfit']">Review Completion Date</h4>
                      <p className="text-xs text-zinc-600">
                        {Object.values(selectedArticle.reviews).map((r: any) => r.updatedAt ? formatDate(r.updatedAt) : 'N/A').join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Reviewer Feedback / Remarks */}
                  {selectedArticle.reviewerFeedback && (
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 font-['Outfit']">Reviewer Feedback</h4>
                      <div className="bg-white p-6 rounded-2xl border border-zinc-200/50 italic text-sm text-zinc-700 leading-relaxed font-sans">
                        "{selectedArticle.reviewerFeedback.remarks}"
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Reviewer Assessment Section */}
              {selectedArticle.reviews && Object.keys(selectedArticle.reviews).length > 0 ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                    <MessageSquare size={14} />
                    Reviewer Assessments ({Object.keys(selectedArticle.reviews).length})
                  </div>
                  
                  {Object.entries(selectedArticle.reviews).map(([uid, review]) => {
                    const reviewDate = review.updatedAt ? formatDate(review.updatedAt) : 'N/A';
                    return (
                      <div key={uid} className="bg-zinc-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                        
                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                              review.recommendation === 'Approved' ? 'bg-emerald-500' :
                              review.recommendation === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                            )}>
                              {getStatusIcon(review.recommendation)}
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Decision</p>
                              <p className="text-lg font-bold">{review.recommendation}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Reviewer</p>
                            <p className="text-xs font-bold text-white">{review.reviewerName || 'Anonymous Reviewer'}</p>
                            <p className="text-[8px] text-zinc-400 font-medium">{reviewDate}</p>
                          </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Reviewer Remarks</p>
                          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 italic text-sm text-zinc-300 leading-relaxed font-sans">
                            "{review.remarks}"
                          </div>
                          {review.reviewedFile && (
                            <div className="mt-4 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                              <div className="flex items-center gap-3">
                                <FileText size={16} className="text-zinc-400" />
                                <span className="text-xs font-bold text-zinc-300 truncate max-w-[200px]">
                                  {review.reviewedFileName || 'Review Document'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDownload(selectedArticle.id, selectedArticle.title, review.reviewedFile)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
                              >
                                <Download size={12} />
                                Download
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                selectedArticle.reviewerFeedback && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      <MessageSquare size={14} />
                      Reviewer Assessment
                    </div>
                    <div className="bg-zinc-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                      
                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                            selectedArticle.reviewerFeedback.recommendation === 'Approved' ? 'bg-emerald-500' :
                            selectedArticle.reviewerFeedback.recommendation === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                          )}>
                            {getStatusIcon(selectedArticle.reviewerFeedback.recommendation)}
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Expert Decision</p>
                            <p className="text-lg font-bold">{selectedArticle.reviewerFeedback.recommendation}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Assigned Reviewers</p>
                          {selectedArticle.assignedReviewers && selectedArticle.assignedReviewers.length > 0 ? (
                            <div className="space-y-0.5">
                              {selectedArticle.assignedReviewers.map(r => (
                                <p key={r} className="text-xs font-bold">{r}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-zinc-400 italic">None</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 relative z-10">
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Reviewer Remarks</p>
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 italic text-sm text-zinc-300 leading-relaxed font-sans">
                          "{selectedArticle.reviewerFeedback?.remarks}"
                        </div>
                        {selectedArticle.reviewerFeedback?.reviewedFile && (
                          <div className="mt-4 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                            <div className="flex items-center gap-3">
                              <FileText size={16} className="text-zinc-400 animate-pulse" />
                              <span className="text-xs font-bold text-zinc-300 truncate max-w-[200px]">
                                {selectedArticle.reviewerFeedback?.reviewedFileName || 'Review Document'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDownload(selectedArticle.id, selectedArticle.title, selectedArticle.reviewerFeedback?.reviewedFile)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
                            >
                              <Download size={12} />
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Drawer Actions - Fixed at bottom */}
            <div className="px-10 py-8 border-t border-white/10 bg-white/60 backdrop-blur-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                  <RotateCcw size={14} />
                  Admin Actions
                </div>

                {/* Assignment UI (Restored) */}
                {selectedArticle.status === 'Submitted' && (
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        setIsDetailsOpen(false);
                        setPreviewArticle(selectedArticle);
                        setIsPreviewOpen(true);
                        setIsAssigningFromPreview(true);
                        setIsRejectingFromPreview(false);
                        setRejectionReasonText('');
                        setRejectionError(null);
                        setReviewerSearchTerm('');
                        setSelectedReviewersForAssigning([]);
                      }}
                      className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                      <UserCheck size={18} />
                      ASSIGN REVIEWER
                    </button>
                  </div>
                )}

                {selectedArticle.status === 'Need Improvements' && (
                  <button 
                    onClick={() => setIsAdminNoteModalOpen(true)}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-amber-500 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                  >
                    <RotateCcw size={18} />
                    SEND BACK TO AUTHOR
                  </button>
                )}

                {selectedArticle.reviewerFeedback?.recommendation === 'Rejected' && (
                  <button 
                    onClick={() => {
                      confirm({
                        title: 'Reject Article',
                        message: 'Are you sure you want to REJECT this article? This action cannot be undone.',
                        confirmText: 'Reject',
                        onConfirm: () => {
                          updateStatus(selectedArticle.id, 'Rejected');
                          showToast('Article rejected successfully', 'error');
                        }
                      });
                    }}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-rose-600 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95"
                  >
                    <XCircle size={18} />
                    REJECT ARTICLE
                  </button>
                )}

                {selectedArticle.status === 'Ready to Publish' && (
                  <button 
                    onClick={() => {
                      confirm({
                        title: 'Publish Article',
                        message: 'Are you sure you want to publish this article on the BKMA website?',
                        confirmText: 'Publish',
                        onConfirm: () => {
                          updateStatus(selectedArticle.id, 'Published', null, 'Article published successfully.');
                          setIsDetailsOpen(false);
                        }
                      });
                    }}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-emerald-600 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                  >
                    <UploadCloud size={18} />
                    PUBLISH ARTICLE
                  </button>
                )}

                {selectedArticle.status === 'Published' && (
                  <div className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black tracking-widest border border-emerald-100 flex items-center justify-center gap-3">
                    <CheckCircle2 size={18} />
                    ARTICLE IS PUBLISHED
                  </div>
                )}
                
                {selectedArticle.status === 'Rejected' && (
                  <div className="w-full py-5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black tracking-widest border border-rose-100 flex items-center justify-center gap-3">
                    <XCircle size={18} />
                    ARTICLE HAS BEEN REJECTED
                  </div>
                )}

                {(selectedArticle.status === 'Sent to Reviewer' || (selectedArticle.status === 'Under Review' && !selectedArticle.reviewerFeedback)) && (
                  <div className="w-full py-5 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black tracking-widest border border-indigo-100 flex items-center justify-center gap-3">
                    <Send size={18} />
                    WAITING FOR REVIEWER FEEDBACK
                  </div>
                )}

                {selectedArticle.status === 'Awaiting Decision' && (
                  <div className="w-full py-5 bg-violet-50 text-violet-600 rounded-2xl text-xs font-black tracking-widest border border-violet-100 flex items-center justify-center gap-3">
                    <AlertCircle size={18} />
                    DECISION REQUIRED: REVIEW SUBMITTED
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Note Modal */}
      {isAdminNoteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAdminNoteModalOpen(false)} />
          <div className="relative bg-white/80 backdrop-blur-2xl w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
            <div className="px-8 py-6 border-b border-white/10 bg-white/40 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-black">Send Back to Author</h3>
                <p className="text-xs text-zinc-500 font-medium">Add an optional note for the author.</p>
              </div>
              <button onClick={() => setIsAdminNoteModalOpen(false)} className="text-zinc-400 hover:text-black">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Admin Note (Optional)</label>
                <textarea 
                  rows={4}
                  placeholder="e.g. Please address the reviewer's comments about section 3.2..."
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
      )}

      {/* Manuscript Preview Modal */}
      {isPreviewOpen && previewArticle && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl h-[90vh] bg-zinc-950 text-white rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="bg-blue-900/30 text-blue-400 border border-blue-800/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {previewArticle.category}
                </span>
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
                
                {previewArticle.versions[0].fileName.endsWith('.pdf') ? (
                  /* Simulated Premium PDF Viewer */
                  <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                    {/* PDF Toolbar */}
                    <div className="bg-zinc-950 px-4 py-3 border-b border-white/5 flex items-center justify-between text-xs text-zinc-400 select-none">
                      <div className="flex items-center gap-2 font-medium truncate max-w-[50%]">
                        <FileText size={14} className="text-red-400 shrink-0" />
                        <span className="truncate">{previewArticle.versions[0].fileName}</span>
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

                    {/* PDF Pages Container - Scrollable */}
                    <div className="p-4 sm:p-8 bg-zinc-800/50 max-h-[450px] overflow-y-auto space-y-6 flex flex-col items-center custom-scrollbar">
                      {/* Page 1 */}
                      <div className="w-full max-w-2xl bg-white text-zinc-800 p-8 sm:p-12 shadow-xl border border-zinc-700/30 rounded-sm relative aspect-[1/1.4] flex flex-col font-serif">
                        <div className="border-b border-zinc-200 pb-3 mb-6 text-[10px] font-sans font-bold text-zinc-400 tracking-wider flex justify-between">
                          <span>KERALA MATHEMATICAL ASSOCIATION JOURNAL</span>
                          <span>VOL. 42, 2024</span>
                        </div>
                        
                        <h2 className="text-xl sm:text-2xl font-bold text-black text-center mb-4 leading-tight font-sans tracking-tight">
                          {previewArticle.title}
                        </h2>
                        
                        <p className="text-xs text-zinc-500 text-center mb-8 font-sans font-bold uppercase tracking-wider">
                          {previewArticle.author}
                        </p>

                        <div className="text-xs space-y-4 leading-relaxed text-zinc-700 flex-1">
                          <p className="font-bold font-sans uppercase text-[10px] tracking-wider text-black">1. INTRODUCTION</p>
                          <p>
                            In recent years, the intersection of advanced mathematics and computational modeling has catalyzed significant breakthroughs. This paper presents our initial findings on the subject. We outline a systematic framework that models relationships across multi-layered networks.
                          </p>
                          <p>
                            The primary contribution of this research lies in establishing an invariant threshold that predicts state changes. We validate our model through empirical simulation data gathered over six months.
                          </p>
                          <p>
                            Let $G = (V, E)$ be a directed graph modeling the communication channels. We define the boundary index using high-dimensional operators.
                          </p>
                        </div>
                        
                        <div className="mt-8 border-t border-zinc-100 pt-4 text-center text-[9px] font-sans font-medium text-zinc-400">
                          Page 1 of 2
                        </div>
                      </div>

                      {/* Page 2 */}
                      <div className="w-full max-w-2xl bg-white text-zinc-800 p-8 sm:p-12 shadow-xl border border-zinc-700/30 rounded-sm relative aspect-[1/1.4] flex flex-col font-serif">
                        <div className="border-b border-zinc-200 pb-3 mb-6 text-[10px] font-sans font-bold text-zinc-400 tracking-wider flex justify-between">
                          <span>KERALA MATHEMATICAL ASSOCIATION JOURNAL</span>
                          <span>VOL. 42, 2024</span>
                        </div>

                        <div className="text-xs space-y-4 leading-relaxed text-zinc-700 flex-1">
                          <p className="font-bold font-sans uppercase text-[10px] tracking-wider text-black">2. METHODOLOGY & ANALYSIS</p>
                          <p>
                            We deploy a persistent homology solver that filters local perturbations to isolate macro-level invariants. The mathematical justification for this topological filter relies on the Stability Theorem for Persistence Diagrams.
                          </p>
                          <p>
                            Specifically, we partition the dataset into discrete filtration steps. At each level, simplicial complexes are constructed. The generators of the homology groups $H_k(X)$ are tracked through the diagram.
                          </p>
                        </div>

                        <div className="mt-8 border-t border-zinc-100 pt-4 text-center text-[9px] font-sans font-medium text-zinc-400">
                          Page 2 of 2
                        </div>
                      </div>
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
                      <p className="italic text-zinc-400 font-sans text-xs">Author: {previewArticle.author} | File: {previewArticle.versions[0].fileName}</p>
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
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">Select Reviewers</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Select between 1 and 5 reviewers for this manuscript.</p>
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
                                <p className="text-xs font-bold truncate text-white">{reviewer.name}</p>
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
                          setIsConfirmingAssignment(true);
                        }}
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs tracking-widest transition-all shadow-lg shadow-emerald-600/20 uppercase"
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
