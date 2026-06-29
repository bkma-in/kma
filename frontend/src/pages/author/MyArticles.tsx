import { useState, useEffect, useRef } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  History, 
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Upload,
  RefreshCw,
  X,
  ChevronDown,
  Loader2,
  Edit2,
  Trash2,
  Lock,
  FileUp,
  Send,
  User
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { getPdfUrl } from '../../services/article.service';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../utils/NotificationContext';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Types
type Status = 'Submitted' | 'Under Review' | 'Revision Required' | 'Approved' | 'Rejected';

interface Version {
  version: number;
  uploadedBy: 'Author' | 'Reviewer';
  timestamp: string;
  fileName: string;
}

interface Article {
  id: string;
  title: string;
  category: string;
  dateSubmitted: string;
  status: Status | 'Draft';
  abstract: string;
  authors: any[];
  authorId: string;
  versions: Version[];
  reviewerFeedback?: {
    remarks: string;
    recommendation: string;
  };
  adminNote?: string;
  reviews?: Record<string, {
    remarks: string;
    recommendation: string;
    updatedAt?: any;
  }>;
}


const MyArticles = () => {
  const { showToast, confirm } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const highlightId = location.state?.highlightId;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Invitations & User state
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isInvitationsLoading, setIsInvitationsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Dynamically get current user for permission checks
    const unsubscribe = api.interceptors.request.use((config) => {
      // This is a hacky way since we don't have a user context here easily
      // but we can check auth state
      return config;
    });
    // Better way: use auth from config
    const unsubscribeAuth = auth.onAuthStateChanged(user => setCurrentUser(user));
    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Revision modal state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionArticle, setRevisionArticle] = useState<Article | null>(null);
  const [revisionAbstract, setRevisionAbstract] = useState('');
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [isRevisionSubmitting, setIsRevisionSubmitting] = useState(false);
  const [revisionError, setRevisionError] = useState('');
  const revisionFileRef = useRef<HTMLInputElement>(null);

  // Final Submission Checklist state
  const [isFinalSubmitModalOpen, setIsFinalSubmitModalOpen] = useState(false);
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);
  const [confirmNoRejectedAuthors, setConfirmNoRejectedAuthors] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState<any>(null);

  // Invitation Decision Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteArticle, setInviteArticle] = useState<Article | null>(null);
  const [isInviteProcessing, setIsInviteProcessing] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'articles'),
      where('participantIds', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let mappedArticles = snapshot.docs.map((doc: any) => {
        const a = doc.data();
        return {
          id: a.articleId,
          title: a.title,
          category: a.category || 'Mathematics',
          authorId: a.authorId,
          authors: a.authors || [],
          dateSubmitted: (() => {
            const val = a.createdAt;
            if (!val) return new Date().toISOString();
            if (typeof val.toDate === 'function') return val.toDate().toISOString();
            if (val._seconds) return new Date(val._seconds * 1000).toISOString();
            if (val.seconds) return new Date(val.seconds * 1000).toISOString();
            const d = new Date(val);
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
          })(),
          status: (a.status === 'draft' ? 'Draft' : mapStatus(a.status)) as Status | 'Draft',
          abstract: a.abstract,
          reviewerFeedback: a.reviewerFeedback,
          reviews: a.reviews,
          adminNote: a.adminNote,
          versions: a.revisionHistory ? 
            a.revisionHistory.map((v: any, i: number) => ({
              version: i + 1,
              uploadedBy: 'Author',
              timestamp: new Date(v.submittedAt?._seconds * 1000 || v.replacedAt?._seconds * 1000).toLocaleString(),
              fileName: v.pdfName || 'manuscript.pdf'
            })).concat([{
              version: a.revisionHistory.length + 1,
              uploadedBy: 'Author',
              timestamp: new Date(a.updatedAt?._seconds * 1000 || a.createdAt?._seconds * 1000).toLocaleString(),
              fileName: a.pdfUrl?.split('/').pop() || 'manuscript.pdf'
            }]) : 
            [
                {
                  version: 1,
                  uploadedBy: 'Author',
                  timestamp: (() => {
                  const val = a.createdAt;
                  if (!val) return new Date().toLocaleString();
                  if (typeof val.toDate === 'function') return val.toDate().toLocaleString();
                  if (val._seconds) return new Date(val._seconds * 1000).toLocaleString();
                  if (val.seconds) return new Date(val.seconds * 1000).toLocaleString();
                  return new Date(val).toLocaleString();
                })(),
                  fileName: a.pdfUrl?.split('/').pop() || 'manuscript.pdf'
                }
              ]
        };
      });
      
      // Filter articles based on visibility rules
      mappedArticles = mappedArticles.filter(a => {
        // 1. Submitter (C): Always sees the article
        if (a.authorId === currentUser?.uid) return true;
        
        // Find user in authors array
        const authorData = a.authors?.find((author: any) => author.userId === currentUser?.uid);
        if (!authorData) return false; // If not primary and not a co-author, hide it
        
        // 2. Rejected (B): Hide if rejected
        if (authorData.status === 'rejected') return false;
        
        // 5. Accepted: Always visible
        if (authorData.accepted === true) return true;
        
        // At this point, the user's invitation is pending (accepted === false and not rejected)
        
        // 3 & 4. Pending: Visible only if the article is still a Draft
        // If the article is no longer a draft (e.g. submitted), it is too late and should be hidden.
        if (a.status !== 'Draft') return false;
        
        return true;
      });
      
      // Sort in memory
      mappedArticles.sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());
      
      setArticles(mappedArticles);
      setIsLoading(false);

      // Handle direct open from location state
      if (highlightId) {
        const art = mappedArticles.find(a => a.id === highlightId);
        if (art) {
          if (location.state?.openInvite) {
            handleOpenInvite(art);
          }
          
          setTimeout(() => {
            const element = document.getElementById(`article-${highlightId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      }
    }, (error) => {
      console.error('Real-time articles error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, highlightId, location.state?.openInvite]);

  const mapStatus = (backendStatus: string): Status => {
    switch(backendStatus) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'revision_requested': return 'Revision Required';
      case 'accepted': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Submitted';
    }
  };

  const getStatusStyles = (status: Status | 'Draft') => {
    switch (status) {
      case 'Draft': return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      case 'Submitted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Under Review': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Revision Required': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Rejected': return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    }
  };

  const getStatusIcon = (status: Status | 'Draft') => {
    switch (status) {
      case 'Draft': return <Edit2 size={12} />;
      case 'Submitted': return <Clock size={12} />;
      case 'Under Review': return <History size={12} />;
      case 'Revision Required': return <AlertCircle size={12} />;
      case 'Approved': return <CheckCircle2 size={12} />;
      case 'Rejected': return <Ban size={12} />;
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetails = async (article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
    setIsPreviewLoading(true);
    setPreviewUrl(null);
    setInvitations([]);
    
    // Fetch Invitations if current user is submitter
    if (article.authorId === currentUser?.uid) {
      setIsInvitationsLoading(true);
      try {
        const response = await api.get(`/articles/${article.id}/invitations`);
        if (response.data.success) {
          setInvitations(response.data.invitations);
        }
      } catch (error) {
        console.error('Failed to fetch invitations', error);
      } finally {
        setIsInvitationsLoading(false);
      }
    }

    try {
      const response = await getPdfUrl(article.id);
      if (response.success) {
        setPreviewUrl(response.url);
      }
    } catch (error) {
      console.error('Failed to load preview', error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    if (!selectedArticle) return;
    try {
      const response = await api.post(`/articles/${selectedArticle.id}/invitations/${inviteId}/resend`);
      if (response.data.success) {
        showToast('Invitation resent successfully', 'success');
        // Refresh invitations
        const res = await api.get(`/articles/${selectedArticle.id}/invitations`);
        if (res.data.success) setInvitations(res.data.invitations);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to resend invitation', 'error');
    }
  };

  const handleSubmitNow = () => {
    if (!selectedArticle) return;
    setConfirmNoRejectedAuthors(false);
    setIsFinalSubmitModalOpen(true);
  };

  const handleFinalSubmit = async () => {
    if (!selectedArticle) return;
    
    const hasPending = invitations.some(i => i.status === 'pending');
    const hasRejected = invitations.some(i => i.status === 'rejected');
    
    if (hasRejected && !confirmNoRejectedAuthors) {
      showToast('Please confirm that you want to proceed without rejected authors', 'error');
      return;
    }

    setIsFinalSubmitting(true);
    try {
      const response = await api.put(`/articles/${selectedArticle.id}`, { 
        status: 'submitted',
        includeAcceptedOnly: hasPending,
        forceSubmitWithoutRejected: hasRejected,
        submissionNotes: hasRejected ? 'Proceeded without rejected co-authors' : ''
      });
      
      if (response.data.success) {
        showToast('Article submitted successfully!', 'success');
        setSubmissionSummary(response.data.submissionSummary);
        setIsFinalSubmitModalOpen(false);
        setIsModalOpen(false);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to submit article', 'error');
    } finally {
      setIsFinalSubmitting(false);
    }
  };

  const handleEdit = (article: Article) => {
    if (article.status !== 'Revision Required') return;
    setRevisionArticle(article);
    setRevisionAbstract(article.abstract);
    setRevisionFile(null);
    setRevisionError('');
    setIsRevisionModalOpen(true);
  };

  const handleRevisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      setRevisionError('Only PDF files are allowed.');
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      setRevisionError('File size must be under 25MB.');
      return;
    }
    setRevisionFile(selected);
    setRevisionError('');
  };

  const handleRevisionSubmit = async () => {
    if (!revisionArticle) return;
    if (!revisionAbstract.trim()) {
      setRevisionError('Abstract is required.');
      return;
    }
    setIsRevisionSubmitting(true);
    setRevisionError('');
    try {
      const payload = new FormData();
      payload.append('abstract', revisionAbstract);
      payload.append('title', revisionArticle.title); // send unchanged title
      if (revisionFile) payload.append('pdf', revisionFile);
      const response = await api.put(`/articles/${revisionArticle.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        showToast('Revision submitted successfully!', 'success');
        setIsRevisionModalOpen(false);
      }
    } catch (error: any) {
      setRevisionError(error.response?.data?.error || 'Failed to submit revision.');
    } finally {
      setIsRevisionSubmitting(false);
    }
  };

  const handleOpenInvite = async (article: Article) => {
    setInviteArticle(article);
    setIsInviteModalOpen(true);
    setInviteResult(null);
    setShowRejectInput(false);
    setRejectReason('');
    
    // We need the token.
    const token = location.state?.token;
    if (token) {
      setInviteToken(token);
    } else {
      // Fetch the token for this user/article
      try {
        const response = await api.get(`/articles/${article.id}/invitations`);
        if (response.data.success) {
          const myInvite = response.data.invitations.find((inv: any) => 
            inv.inviteeUserId === currentUser?.uid && inv.status === 'pending'
          );
          if (myInvite) setInviteToken(myInvite.token);
        }
      } catch (error) {
        console.error('Failed to fetch invite token:', error);
      }
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteToken) {
      showToast('Unable to process: Invitation token missing. Please refresh the page.', 'error');
      return;
    }
    setIsInviteProcessing(true);
    try {
      const response = await api.post(`/articles/invitations/${inviteToken}/accept?articleId=${inviteArticle?.id}`);
      if (response.data.success) {
        setInviteResult(response.data);
        showToast(response.data.message, 'success');
        
        // Auto-close after 2 seconds so user can see success message
        setTimeout(() => {
          setIsInviteModalOpen(false);
          setInviteResult(null);
        }, 2000);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to accept invitation', 'error');
    } finally {
      setIsInviteProcessing(false);
    }
  };

  const handleRejectInvite = async () => {
    if (!inviteToken) {
      showToast('Unable to process: Invitation token missing. Please refresh the page.', 'error');
      return;
    }
    if (!rejectReason || rejectReason.length < 10) {
      showToast('Please provide a reason (min 10 characters)', 'error');
      return;
    }
    setIsInviteProcessing(true);
    try {
      const response = await api.post(`/articles/invitations/${inviteToken}/reject?articleId=${inviteArticle?.id}`, {
        reason: rejectReason
      });
      if (response.data.success) {
        showToast('Invitation declined', 'info');
        setIsInviteModalOpen(false);
        // fetchArticles is now handled by real-time listener
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to decline invitation', 'error');
    } finally {
      setIsInviteProcessing(false);
    }
  };

  const handleDelete = async (article: Article) => {
    if (article.status !== 'Submitted' && article.status !== 'Draft') return;
    
    confirm({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this manuscript? This action is permanent and cannot be undone.',
      confirmText: 'Delete Manuscript',
      requiredConfirmationText: article.title,
      onConfirm: async () => {
        try {
          const response = await api.delete(`/articles/${article.id}`);
          if (response.data.success) {
            showToast('Article deleted successfully', 'success');
            setArticles(prev => prev.filter(a => a.id !== article.id));
            setIsModalOpen(false);
          }
        } catch (error) {
          console.error('Delete failed:', error);
          showToast('Failed to delete article', 'error');
        }
      }
    });
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <FileText size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">Archive Management</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">My Articles</h1>
          <p className="text-zinc-500 mt-2 text-sm leading-relaxed max-w-xl">Track your submissions, respond to revisions, and manage your published research with real-time workflow status.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-full sm:w-64 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative flex-1 sm:flex-initial">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-between px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-black outline-none cursor-pointer shadow-sm w-full sm:w-48 text-left transition-all hover:border-black"
            >
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-zinc-400" />
                <span>{statusFilter === 'All' ? 'All Status' : statusFilter}</span>
              </div>
              <ChevronDown size={14} className={cn("text-zinc-400 transition-transform duration-200", isFilterOpen && "rotate-180")} />
            </button>

            {isFilterOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsFilterOpen(false)}
                />
                
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl z-20 py-2 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <button
                    onClick={() => { setStatusFilter('All'); setIsFilterOpen(false); }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-bold transition-all flex items-center gap-2",
                      statusFilter === 'All' ? "bg-zinc-50 text-black" : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                    )}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    All Status
                  </button>
                  
                  {(['Submitted', 'Under Review', 'Revision Required', 'Approved', 'Rejected'] as Status[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-xs font-bold transition-all flex items-center gap-2",
                        statusFilter === status ? "bg-zinc-50 text-black" : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        status === 'Submitted' && "bg-blue-500",
                        status === 'Under Review' && "bg-amber-500",
                        status === 'Revision Required' && "bg-rose-500",
                        status === 'Approved' && "bg-emerald-500",
                        status === 'Rejected' && "bg-zinc-500"
                      )} />
                      {status}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-100 border-t-black rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium text-sm">Synchronizing with BKMA Archive...</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Manuscript Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date Submitted</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredArticles.map((article) => (
                  <tr 
                    key={article.id} 
                    id={`article-${article.id}`}
                    className={cn(
                      "group hover:bg-zinc-50/50 transition-colors relative",
                      highlightId === article.id && "bg-black/[0.03] animate-pulse border-l-4 border-black"
                    )}
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 mb-1 leading-none tracking-widest">{article.id}</p>
                        <h3 className="text-sm font-bold text-black group-hover:text-zinc-700 transition-colors line-clamp-1">{article.title}</h3>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-[10px] font-bold text-zinc-500 tracking-wider bg-zinc-100/50 px-2.5 py-1 rounded-lg uppercase">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs text-zinc-500 font-medium">
                      {new Date(article.dateSubmitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          getStatusStyles(article.status)
                        )}>
                          {getStatusIcon(article.status)}
                          {article.status}
                        </div>
                        {article.status === 'Draft' && article.authors.some((a: any) => !a.accepted) && (
                          <div className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-tighter animate-pulse">
                            <Clock size={8} />
                            Awaiting Co-authors
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Invitation Action for Co-authors */}
                        {article.status === 'Draft' && article.authors.find((a: any) => a.userId === currentUser?.uid && !a.accepted && a.status !== 'rejected') && (
                          <button 
                            onClick={() => handleOpenInvite(article)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 animate-pulse"
                          >
                            <User size={14} />
                            DECIDE ON INVITE
                          </button>
                        )}
                        {article.status !== 'Draft' && article.authors.find((a: any) => a.userId === currentUser?.uid && !a.accepted && a.status !== 'rejected') && (
                          <span className="text-[9px] font-bold text-rose-500 italic px-2">
                            Main author is no longer waiting for your response
                          </span>
                        )}

                        <button 
                          onClick={() => openDetails(article)}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              const res = await getPdfUrl(article.id);
                              if (res.success) window.open(res.url, '_blank');
                            } catch (err) {
                              showToast('Failed to download manuscript', 'error');
                            }
                          }}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-all" 
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(article)}
                          disabled={article.status !== 'Revision Required'}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            article.status === 'Revision Required' 
                              ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50 animate-pulse" 
                              : "text-zinc-200 cursor-not-allowed"
                          )}
                          title={article.status === 'Revision Required' ? 'Submit Revision' : `Editing locked (${article.status})`}
                        >
                          <Edit2 size={18} />
                        </button>
                        {/* Only primary author can delete */}
                        {article.authorId === currentUser?.uid && (
                          <button 
                            onClick={() => handleDelete(article)}
                            disabled={article.status !== 'Submitted' && article.status !== 'Draft'}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              (article.status === 'Submitted' || article.status === 'Draft')
                                ? "text-zinc-400 hover:text-rose-600 hover:bg-rose-50" 
                                : "text-zinc-200 cursor-not-allowed"
                            )}
                            title={(article.status === 'Submitted' || article.status === 'Draft') ? 'Delete Manuscript' : 'Cannot delete after review begins'}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
              <FileText size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black">No Articles Found</h3>
              <p className="text-zinc-500 text-sm">You haven't submitted any manuscripts yet.</p>
            </div>
          </div>
        )}
      </div>

      {/* Article Details Modal */}
      {isModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                  getStatusStyles(selectedArticle.status).split(' ')[1].replace('text-', 'bg-')
                )}>
                  {getStatusIcon(selectedArticle.status)}
                </div>
                <div>
                  <h3 className="font-bold text-black tracking-tight font-['Outfit'] text-lg">{selectedArticle.id}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Manuscript Details</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-10 bg-white">
              <div className="max-w-4xl mx-auto space-y-10">
                {/* Title & Category */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black text-white bg-black px-3 py-1 rounded-full uppercase tracking-widest">
                      {selectedArticle.category}
                    </span>
                    <div className="h-[1px] flex-1 bg-zinc-100" />
                  </div>
                  <h2 className="text-4xl font-bold text-black leading-[1.1] tracking-tighter font-['Outfit']">
                    {selectedArticle.title}
                  </h2>
                </div>

                {/* Draft Reason Panel */}
                {selectedArticle.status === 'Draft' && (invitations.some(i => i.status === 'pending' || i.status === 'rejected')) && (
                  <div className="p-6 bg-amber-50/50 border border-amber-200 rounded-[2rem] space-y-3">
                    <div className="flex items-center gap-3 text-amber-600">
                      <AlertTriangle size={20} />
                      <h3 className="text-sm font-bold uppercase tracking-tight font-['Outfit']">Draft Reason: Awaiting Co-Author Response</h3>
                    </div>
                    <div className="pl-8 space-y-2">
                      <p className="text-xs text-amber-900/70 font-medium leading-relaxed">
                        This article is currently in draft until all invited co-authors accept. 
                        There are <span className="font-bold">{invitations.filter(i => i.status === 'pending').length} pending</span> and <span className="font-bold text-rose-600">{invitations.filter(i => i.status === 'rejected').length} rejected</span> responses.
                      </p>
                      <p className="text-[10px] text-amber-800/60 font-bold uppercase tracking-widest">
                        You may re-invite rejected authors or proceed to submit now with the currently accepted authors.
                      </p>
                    </div>
                  </div>
                )}

                {/* Authors & Invitations Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Confirmed Authors */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <User size={14} />
                      Confirmed Authors
                    </div>
                    <div className="space-y-2">
                      {selectedArticle.authors.filter(a => a.accepted).map((author, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-[10px] font-bold">
                            {author.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-black truncate">{author.name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
                              {author.role} {author.userId === selectedArticle.authorId && "• Primary"}
                            </p>
                          </div>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invitations Management (For Submitter) */}
                  {selectedArticle.authorId === currentUser?.uid && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          <Send size={14} />
                          Collaboration Invitations
                        </div>
                        {isInvitationsLoading && <Loader2 size={12} className="animate-spin text-zinc-400" />}
                      </div>
                      
                      <div className="space-y-2">
                        {invitations.length > 0 ? (
                          invitations.map((invite, idx) => (
                            <div key={idx} className="p-3 bg-white border border-zinc-100 rounded-xl space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-black truncate">{invite.inviteeName || invite.inviteeEmail}</p>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                      invite.status === 'pending' && "bg-amber-50 text-amber-600",
                                      invite.status === 'rejected' && "bg-rose-50 text-rose-600",
                                      invite.status === 'accepted' && "bg-emerald-50 text-emerald-600",
                                      invite.status === 'expired' && "bg-zinc-100 text-zinc-400"
                                    )}>
                                      {invite.status}
                                    </span>
                                    {invite.status === 'rejected' && (
                                      <span className="text-[8px] text-zinc-400 font-bold truncate">"{invite.rejectedReason}"</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  {(invite.status === 'rejected' || invite.status === 'expired') && selectedArticle.status === 'Draft' && (
                                    <button 
                                      onClick={() => handleResendInvite(invite.inviteId)}
                                      className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-black transition-all"
                                      title="Resend Invitation"
                                    >
                                      <RefreshCw size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No invitations sent</p>
                          </div>
                        )}

                        {/* Submit Now Override for Drafts */}
                        {selectedArticle.status === 'Draft' && (
                          <button 
                            onClick={handleSubmitNow}
                            className="w-full mt-2 py-3 bg-zinc-900 text-white rounded-xl font-black text-[9px] tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 uppercase"
                          >
                            <Send size={12} />
                            Submit now with accepted authors
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-[1px] bg-zinc-100" />

                {/* Abstract Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <FileText size={14} />
                    Executive Abstract
                  </div>
                  <div className="bg-zinc-50/50 p-8 rounded-[2rem] border border-zinc-100 text-sm text-zinc-600 leading-relaxed font-medium italic shadow-inner">
                    "{selectedArticle.abstract}"
                  </div>
                </div>

                {/* Reviewer Feedback / Revision Request Details (For Authors) */}
                {selectedArticle.status === 'Revision Required' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                      <AlertCircle size={14} />
                      Revision Requirements
                    </div>
                    <div className="p-8 bg-rose-50/50 border border-rose-100 rounded-[2rem] space-y-6">
                      {/* Admin Note */}
                      {selectedArticle.adminNote && (
                        <div>
                          <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 font-['Outfit']">Rejected Reason / Reviewer Comments</h4>
                          <p className="text-xs text-zinc-700 leading-relaxed font-sans bg-white p-4 rounded-xl border border-rose-200/50">
                            "{selectedArticle.adminNote}"
                          </p>
                        </div>
                      )}

                      {/* Reviewer Feedback */}
                      {selectedArticle.reviews && Object.keys(selectedArticle.reviews).length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest font-['Outfit']">Reviewer Assessments</h4>
                          {Object.entries(selectedArticle.reviews).map(([key, review]: [string, any], idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl border border-zinc-150 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-['Outfit']">{key}</span>
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-bold uppercase tracking-wide border border-amber-100 font-['Outfit']">
                                  {review.recommendation || 'Revision Required'}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-600 italic leading-relaxed font-sans">
                                "{review.remarks}"
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        selectedArticle.reviewerFeedback && (
                          <div>
                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 font-['Outfit']">Reviewer Remarks</h4>
                            <div className="bg-white p-6 rounded-2xl border border-zinc-150 italic text-xs text-zinc-600 leading-relaxed font-sans">
                              "{selectedArticle.reviewerFeedback.remarks}"
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Manuscript Preview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <Eye size={14} />
                    Full Manuscript Preview
                  </div>
                  <div className="w-full aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] bg-zinc-100 rounded-[2.5rem] border border-dashed border-zinc-200 overflow-hidden relative group shadow-2xl shadow-black/[0.03]">
                    {previewUrl ? (
                      <iframe 
                        src={`${previewUrl}#toolbar=0`} 
                        className="w-full h-full border-none" 
                        title="PDF Preview" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-4 bg-zinc-50/50">
                        {isPreviewLoading ? (
                          <>
                            <div className="w-12 h-12 border-4 border-zinc-100 border-t-black rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Establishing Secure Connection...</p>
                          </>
                        ) : (
                          <>
                            <Ban size={48} className="opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Manuscript Link Expired</p>
                            <button 
                              onClick={() => openDetails(selectedArticle)}
                              className="px-6 py-3 bg-black text-white text-[9px] font-black rounded-xl tracking-widest uppercase mt-2"
                            >
                              REFRESH SESSION
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-6 border-t border-zinc-50 flex items-center justify-between">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    Access recorded on {new Date().toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleEdit(selectedArticle)}
                      disabled={selectedArticle.status !== 'Revision Required'}
                      className={cn(
                        "flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-[10px] tracking-[0.2em] transition-all uppercase shadow-xl shadow-black/5",
                        selectedArticle.status === 'Revision Required'
                          ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 animate-pulse"
                          : "bg-zinc-50 border border-zinc-100 text-zinc-300 cursor-not-allowed"
                      )}
                    >
                      <Edit2 size={16} />
                      {selectedArticle.status === 'Revision Required' ? 'Submit Revision' : 'Edit Locked'}
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedArticle)}
                      disabled={selectedArticle.status !== 'Submitted'}
                      className={cn(
                        "flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-[10px] tracking-[0.2em] transition-all uppercase shadow-xl shadow-black/5",
                        selectedArticle.status === 'Submitted'
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                          : "bg-zinc-50 text-zinc-300 cursor-not-allowed"
                      )}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await getPdfUrl(selectedArticle.id);
                          if (res.success) window.open(res.url, '_blank');
                        } catch (err) {
                          showToast('Failed to generate secure download', 'error');
                        }
                      }}
                      className="flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95 uppercase"
                    >
                      <Download size={16} />
                      Download Manuscript
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Submission Checklist Modal */}
      {isFinalSubmitModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isFinalSubmitting && setIsFinalSubmitModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="text-black" size={20} />
                <h3 className="font-bold text-black tracking-tight font-['Outfit'] text-lg">Submission Checklist</h3>
              </div>
              <button 
                onClick={() => setIsFinalSubmitModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} />
                  Co-Author Statuses
                </h4>
                
                <div className="space-y-3">
                  {/* Primary Author */}
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-[10px] font-bold">ME</div>
                      <div>
                        <p className="text-xs font-bold text-black">Primary Author (You)</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Submitter</p>
                      </div>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>

                  {/* Other Invitations */}
                  {invitations.map((invite, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center text-[10px] font-bold">
                          {(invite.inviteeName || invite.inviteeEmail).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-black truncate">{invite.inviteeName || invite.inviteeEmail}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                              invite.status === 'pending' && "bg-amber-50 text-amber-600",
                              invite.status === 'rejected' && "bg-rose-50 text-rose-600",
                              invite.status === 'accepted' && "bg-emerald-50 text-emerald-600"
                            )}>
                              {invite.status}
                            </span>
                            {invite.status === 'rejected' && (
                              <span className="text-[8px] text-rose-400 font-bold italic truncate">"{invite.rejectedReason}"</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {invite.status === 'rejected' && selectedArticle.status === 'Draft' && (
                        <button 
                          onClick={() => handleResendInvite(invite.inviteId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[8px] font-black tracking-widest hover:bg-black transition-all uppercase"
                        >
                          <RefreshCw size={10} />
                          Re-invite
                        </button>
                      )}
                      {invite.status === 'accepted' && <CheckCircle2 size={16} className="text-emerald-500" />}
                      {invite.status === 'pending' && <Clock size={16} className="text-amber-500" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings & Confirmations */}
              <div className="space-y-4">
                {invitations.some(i => i.status === 'pending') && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                    <AlertCircle size={18} className="text-blue-500 shrink-0" />
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      Submitting now will proceed only with accepted co-authors. <strong>{invitations.filter(i => i.status === 'pending').length} pending invitees</strong> will remain invited but won't be listed in the initial publication metadata.
                    </p>
                  </div>
                )}

                {invitations.some(i => i.status === 'rejected') && (
                  <div className="space-y-3">
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                      <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                      <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                        There are rejected invitations. You must explicitly acknowledge that you are proceeding without these co-authors.
                      </p>
                    </div>
                    <label className="flex items-center gap-3 p-4 bg-white border-2 border-zinc-100 rounded-2xl cursor-pointer hover:border-black transition-all group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                        checked={confirmNoRejectedAuthors}
                        onChange={(e) => setConfirmNoRejectedAuthors(e.target.checked)}
                      />
                      <span className="text-[10px] font-black text-black uppercase tracking-wider group-hover:text-black transition-all">
                        I understand and will proceed without rejected co-authors
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-4">
              <button 
                onClick={() => setIsFinalSubmitModalOpen(false)}
                className="px-6 py-3 text-zinc-400 font-black text-[10px] tracking-widest hover:text-black transition-all uppercase"
                disabled={isFinalSubmitting}
              >
                Cancel
              </button>
              
              <button 
                onClick={handleFinalSubmit}
                disabled={isFinalSubmitting || (invitations.some(i => i.status === 'rejected') && !confirmNoRejectedAuthors)}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 uppercase",
                  (isFinalSubmitting || (invitations.some(i => i.status === 'rejected') && !confirmNoRejectedAuthors)) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isFinalSubmitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    FINALIZING...
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    {invitations.length === 0 || invitations.every(i => i.status === 'accepted') ? 'SUBMIT MANUSCRIPT' : 'SUBMIT NOW WITH ACCEPTED AUTHORS'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Submission Summary Report Modal */}
      {submissionSummary && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSubmissionSummary(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-black font-['Outfit']">Submission Finalized</h3>
                <p className="text-zinc-500 text-sm mt-2 font-medium">Your manuscript has been formally submitted for review.</p>
              </div>

              <div className="bg-zinc-50 rounded-3xl p-6 text-left space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Included Authors</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg">YOU (Submitter)</span>
                    {submissionSummary.included.map((a: any, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-white border border-zinc-200 text-black text-[10px] font-bold rounded-lg">{a.name}</span>
                    ))}
                  </div>
                </div>

                {(submissionSummary.pending.length > 0 || submissionSummary.rejected.length > 0) && (
                  <div>
                    <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Excluded Invitees</h4>
                    <div className="space-y-2">
                      {submissionSummary.pending.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                          <span>{a.inviteeName || a.inviteeEmail}</span>
                          <span>PENDING</span>
                        </div>
                      ))}
                      {submissionSummary.rejected.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px] font-bold text-rose-400">
                          <span>{a.inviteeName || a.inviteeEmail}</span>
                          <span>REJECTED</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSubmissionSummary(null)}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-[11px] tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 uppercase"
              >
                RETURN TO DASHBOARD
              </button>
            </div>
          </div>
        </div>
      )}
      {isRevisionModalOpen && revisionArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isRevisionSubmitting && setIsRevisionModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
            {/* Header */}
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-amber-50/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-black tracking-tight font-['Outfit'] text-lg">Submit Revision</h3>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Only abstract & document can be updated</p>
                </div>
              </div>
              <button
                onClick={() => !isRevisionSubmitting && setIsRevisionModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Error Banner */}
              {revisionError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  <p className="text-xs font-bold text-rose-600">{revisionError}</p>
                </div>
              )}

              {/* Title — Read Only */}
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Article Title</label>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 rounded-md">
                    <Lock size={10} className="text-zinc-400" />
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Locked after submission</span>
                  </div>
                </div>
                <div className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-500 font-medium cursor-not-allowed select-none">
                  {revisionArticle.title}
                </div>
              </div>

              {/* Abstract — Editable */}
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Updated Abstract <span className="text-amber-500">*</span>
                  </label>
                  <span className="text-[8px] font-bold text-emerald-500 tracking-wider bg-emerald-50 px-2 py-1 rounded">EDITABLE</span>
                </div>
                <textarea
                  value={revisionAbstract}
                  onChange={(e) => setRevisionAbstract(e.target.value)}
                  rows={6}
                  className="w-full px-5 py-4 bg-white border border-amber-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all resize-none placeholder:text-zinc-400"
                  placeholder="Update your abstract based on reviewer feedback..."
                />
              </div>

              {/* PDF Upload */}
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Revised Document
                  </label>
                  <span className="text-[8px] font-bold text-emerald-500 tracking-wider bg-emerald-50 px-2 py-1 rounded">EDITABLE</span>
                </div>

                {revisionFile ? (
                  <div className="p-5 bg-white border border-amber-200 rounded-2xl flex items-center gap-4 animate-in zoom-in duration-300">
                    <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">{revisionFile.name}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        {(revisionFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setRevisionFile(null); if (revisionFileRef.current) revisionFileRef.current.value = ''; }}
                      className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => revisionFileRef.current?.click()}
                    className="w-full p-8 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center gap-3 hover:border-amber-400 hover:bg-amber-50/30 transition-all group cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-zinc-300 group-hover:text-amber-500 transition-all border border-zinc-100">
                      <FileUp size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-zinc-600">Click to select revised PDF</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">PDF only • Max 25MB</p>
                    </div>
                  </button>
                )}
                <input
                  type="file"
                  ref={revisionFileRef}
                  onChange={handleRevisionFileChange}
                  accept=".pdf"
                  className="hidden"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                Revision for {revisionArticle.id}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => !isRevisionSubmitting && setIsRevisionModalOpen(false)}
                  disabled={isRevisionSubmitting}
                  className="px-6 py-3 bg-white border border-zinc-200 rounded-xl text-[10px] font-black tracking-widest text-zinc-500 hover:bg-zinc-50 transition-all uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevisionSubmit}
                  disabled={isRevisionSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95 uppercase disabled:bg-zinc-200 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isRevisionSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Submit Revision
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Invitation Decision Modal */}
      {isInviteModalOpen && inviteArticle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsInviteModalOpen(false)}
          />
          
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            {/* Close Button inside card */}
            <button 
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-8 right-8 p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="p-8 border-b border-zinc-50 text-center bg-gradient-to-b from-zinc-50/50 to-white">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <User size={32} />
              </div>
              <h2 className="text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase mb-2">Collaboration Request</h2>
              <h1 className="text-2xl font-bold tracking-tight text-black font-['Outfit']">Join as Co-author?</h1>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {!inviteResult ? (
                <>
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Article Title</p>
                      <p className="text-lg font-bold text-black font-['Outfit']">{inviteArticle.title}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Executive Abstract</p>
                      <p className="text-sm text-zinc-500 leading-relaxed italic line-clamp-3">"{inviteArticle.abstract}"</p>
                    </div>
                  </div>

                  {!showRejectInput ? (
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={handleAcceptInvite}
                        disabled={isInviteProcessing}
                        className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 uppercase"
                      >
                        {isInviteProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Accept Invitation
                      </button>
                      <button 
                        onClick={() => setShowRejectInput(true)}
                        disabled={isInviteProcessing}
                        className="px-8 py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] tracking-[0.3em] hover:bg-rose-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 uppercase"
                      >
                        <Lock size={18} />
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                      <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">Reason for Declining</label>
                        <textarea 
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-rose-100 transition-all resize-none h-32"
                          placeholder="Please provide a brief reason (min 10 characters)..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setShowRejectInput(false)}
                          className="flex-1 py-3 bg-zinc-100 text-zinc-500 rounded-xl font-bold text-xs"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleRejectInvite}
                          disabled={isInviteProcessing || rejectReason.length < 10}
                          className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isInviteProcessing ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Rejection'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center space-y-6 py-4 animate-in zoom-in">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Success!</h3>
                    <p className="text-zinc-500 text-sm">{inviteResult.message}</p>
                  </div>

                  {inviteResult.autoSubmitted ? (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-xs font-bold animate-pulse">
                      The manuscript has been automatically submitted for review.
                    </div>
                  ) : inviteResult.remainingAuthors?.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Awaiting Others</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {inviteResult.remainingAuthors.map((name: string) => (
                          <span key={name} className="px-2 py-1 bg-white/50 rounded-lg text-[10px] font-bold text-amber-700 border border-amber-200/50">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => { setIsInviteModalOpen(false); setInviteResult(null); }}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-black transition-all"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MyArticles;
