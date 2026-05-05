import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  UserPlus, 
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
  UserCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Types
type ArticleStatus = 
  | 'Submitted' 
  | 'Needs Improvement' 
  | 'Approved' 
  | 'Published' 
  | 'Rejected';

type ReviewerRecommendation = 'Approved' | 'Needs Improvement' | 'Rejected' | 'None';

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
  assignedReviewer: string | null;
  lastUpdated: string;
  versions: Version[];
  reviewerFeedback?: {
    remarks: string;
    recommendation: ReviewerRecommendation;
    reviewedFile?: string;
  };
  adminNote?: string;
}

const AdminArticles = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'All'>('All');

  // Handle URL search params for filtering
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const validStatuses = ['Submitted', 'Needs Improvement', 'Approved', 'Published', 'Rejected'];
      if (validStatuses.includes(statusParam)) {
        setStatusFilter(statusParam as ArticleStatus);
      } else if (statusParam === 'All') {
        setStatusFilter('All');
      }
    }
  }, [searchParams]);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [articles, setArticles] = useState<Article[]>([
    {
      id: 'KMA-2024-001',
      title: 'Neural Networks in Modern Diagnostic Medicine',
      author: 'Dr. Sarah Jenkins',
      category: 'Biomathematics',
      abstract: 'A longitudinal study on the efficacy of CNNs in detecting early-stage retinal deterioration through automated scan analysis...',
      status: 'Submitted',
      assignedReviewer: 'Dr. John Doe',
      lastUpdated: '2024-03-20',
      versions: [{ version: 1, uploadedBy: 'Author', timestamp: '2024-03-20', fileName: 'manuscript_v1.docx' }],
      reviewerFeedback: {
        remarks: 'The model description needs more clarity in section 3.2. Please provide more details on the hyperparameter tuning.',
        recommendation: 'Needs Improvement'
      }
    },
    {
      id: 'KMA-2024-002',
      title: 'Advanced Cryptography Protocols in Quantum Systems',
      author: 'Michael Chang',
      category: 'Quantum Computing',
      abstract: 'This research explores how existing cryptographic protocols can be strengthened against Shor\'s algorithm...',
      status: 'Submitted',
      assignedReviewer: 'Prof. Alan Turing',
      lastUpdated: '2024-03-18',
      versions: [{ version: 1, uploadedBy: 'Author', timestamp: '2024-03-18', fileName: 'manuscript_v1.docx' }],
      reviewerFeedback: {
        remarks: 'Excellent work. The lattice-based approach is well-defended and highly relevant.',
        recommendation: 'Approved'
      }
    },
    {
      id: 'KMA-2024-003',
      title: 'Topological Data Analysis in Social Networks',
      author: 'Prof. Elena Sterling',
      category: 'Topology',
      abstract: 'Applying persistent homology to identify core influencer clusters...',
      status: 'Submitted',
      assignedReviewer: 'Prof. Gauss',
      lastUpdated: '2024-03-15',
      versions: [{ version: 1, uploadedBy: 'Author', timestamp: '2024-03-15', fileName: 'manuscript_v1.docx' }],
      reviewerFeedback: {
        remarks: 'The data sampling method is flawed. It does not account for temporal variations in the social graph.',
        recommendation: 'Rejected'
      }
    }
  ]);

  const [isAdminNoteModalOpen, setIsAdminNoteModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const availableReviewers = [
    'Prof. Alan Turing',
    'Dr. John Doe',
    'Dr. Jane Smith',
    'Prof. Gauss',
    'Dr. Emmy Noether'
  ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Needs Improvement': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Published': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Submitted': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 size={12} />;
      case 'Needs Improvement': return <AlertCircle size={12} />;
      case 'Rejected': return <XCircle size={12} />;
      case 'Published': return <UploadCloud size={12} />;
      case 'Submitted': return <FileText size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || art.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetails = (article: Article) => {
    setSelectedArticle(article);
    setIsDetailsOpen(true);
  };

  const updateStatus = (id: string, status: ArticleStatus) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selectedArticle?.id === id) {
      setSelectedArticle(prev => prev ? { ...prev, status } : null);
    }
  };

  const assignReviewer = (id: string, reviewer: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, assignedReviewer: reviewer, status: 'Sent to Reviewer' } : a));
    if (selectedArticle?.id === id) {
      setSelectedArticle(prev => prev ? { ...prev, assignedReviewer: reviewer, status: 'Sent to Reviewer' } : null);
    }
    setIsAssigning(false);
  };

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
              {['Submitted', 'Needs Improvement', 'Approved', 'Published', 'Rejected'].map(s => (
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
                      <h3 className="text-sm font-bold text-black group-hover:text-zinc-700 transition-colors line-clamp-1">{article.title}</h3>
                      <p className="text-[10px] text-zinc-400 font-medium uppercase mt-1">Updated {article.lastUpdated}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-zinc-600 font-bold uppercase tracking-wider">
                    {article.author}
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      getStatusStyles(article.reviewerFeedback?.recommendation || 'None')
                    )}>
                      {getStatusIcon(article.reviewerFeedback?.recommendation || 'None')}
                      {article.reviewerFeedback?.recommendation || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[10px] text-zinc-500 font-medium line-clamp-1 italic max-w-[200px]">
                      {article.reviewerFeedback?.remarks || 'No feedback yet'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openDetails(article)}
                        className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-all" title="Download">
                        <Download size={18} />
                      </button>
                      
                      {/* Contextual Action Button */}
                      {article.status === 'Submitted' && (
                        <button 
                          onClick={() => openDetails(article)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-blue-700 transition-all uppercase"
                        >
                          Review Submission
                        </button>
                      )}
                      {article.status === 'Approved' && (
                        <button 
                          onClick={() => openDetails(article)}
                          className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all uppercase"
                        >
                          Finalize
                        </button>
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
                    <button className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400 hover:text-black">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Reviewer Assessment Section */}
              {selectedArticle.reviewerFeedback && (
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
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Assigned To</p>
                        <p className="text-xs font-bold">{selectedArticle.assignedReviewer}</p>
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Reviewer Remarks</p>
                      <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 italic text-sm text-zinc-300 leading-relaxed">
                        "{selectedArticle.reviewerFeedback.remarks}"
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions - Fixed at bottom */}
            <div className="px-10 py-8 border-t border-white/10 bg-white/60 backdrop-blur-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                  <RotateCcw size={14} />
                  Admin Actions
                </div>

                {selectedArticle.reviewerFeedback?.recommendation === 'Needs Improvement' && (
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
                      if(window.confirm('Are you sure you want to REJECT this article? This action cannot be undone.')) {
                        updateStatus(selectedArticle.id, 'Rejected');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-rose-600 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95"
                  >
                    <XCircle size={18} />
                    REJECT ARTICLE
                  </button>
                )}

                {selectedArticle.reviewerFeedback?.recommendation === 'Approved' && (
                  <button 
                    onClick={() => {
                      if(window.confirm('Are you sure you want to PUBLISH this article? It will appear on the main website.')) {
                        updateStatus(selectedArticle.id, 'Published');
                      }
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
                    updateStatus(selectedArticle!.id, 'Needs Improvement');
                    setIsAdminNoteModalOpen(false);
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
    </div>
  );
};

export default AdminArticles;
