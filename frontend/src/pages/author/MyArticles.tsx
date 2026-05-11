import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  History, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Upload,
  RefreshCw,
  X,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { getPdfUrl } from '../../services/article.service';

// Types
type Status = 'Submitted' | 'Under Review' | 'Needs Revision' | 'Approved' | 'Rejected';

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
  status: Status;
  abstract: string;
  versions: Version[];
}

import { useNotification } from '../../utils/NotificationContext';

const MyArticles = () => {
  const { showToast } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get('/articles');
        if (response.data.success) {
          const mappedArticles = response.data.articles
            .filter((a: any) => a.status !== 'draft')
            .map((a: any) => ({
              id: a.articleId,
              title: a.title,
              category: 'Mathematics', // Default for now
              dateSubmitted: new Date(a.createdAt._seconds * 1000).toISOString(),
              status: mapStatus(a.status),
              abstract: a.abstract,
              versions: [
                {
                  version: 1,
                  uploadedBy: 'Author',
                  timestamp: new Date(a.createdAt._seconds * 1000).toLocaleString(),
                  fileName: a.pdfUrl?.split('/').pop() || 'manuscript.pdf'
                }
              ]
            }));
          setArticles(mappedArticles);
        }
      } catch (error) {
        console.error('Failed to fetch articles', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const mapStatus = (backendStatus: string): Status => {
    switch(backendStatus) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'revision_requested': return 'Needs Revision';
      case 'accepted': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Submitted';
    }
  };

  const getStatusStyles = (status: Status) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Under Review': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Needs Revision': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Rejected': return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Submitted': return <Clock size={12} />;
      case 'Under Review': return <History size={12} />;
      case 'Needs Revision': return <AlertCircle size={12} />;
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
                  
                  {(['Submitted', 'Under Review', 'Needs Revision', 'Approved', 'Rejected'] as Status[]).map((status) => (
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
                        status === 'Needs Revision' && "bg-rose-500",
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
            <p className="text-zinc-500 font-medium text-sm">Synchronizing with KMA Archive...</p>
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
                  <tr key={article.id} className="group hover:bg-zinc-50/50 transition-colors">
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
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        getStatusStyles(article.status)
                      )}>
                        {getStatusIcon(article.status)}
                        {article.status}
                      </div>
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
                        {article.status === 'Needs Revision' && (
                          <button 
                            onClick={() => openDetails(article)}
                            className="p-2 hover:bg-rose-50 rounded-lg text-rose-400 hover:text-rose-600 transition-all animate-pulse"
                            title="Resubmit"
                          >
                            <RefreshCw size={18} />
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
      )}
    </div>
  );
};

export default MyArticles;
