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
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';

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

const MyArticles = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get('/articles');
        if (response.data.success) {
          const mappedArticles = response.data.articles.map((a: any) => ({
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

  const openDetails = (article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
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

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-64 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option value="All">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Needs Revision">Needs Revision</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
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
                        <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-all" title="Download">
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
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  {/* Title & Abstract */}
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-black leading-tight font-['Outfit']">{selectedArticle.title}</h2>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-wider">{selectedArticle.category}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        <FileText size={14} />
                        Executive Abstract
                      </div>
                      <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 italic text-sm text-zinc-600 leading-relaxed">
                        "{selectedArticle.abstract}"
                      </div>
                    </div>
                  </div>

                  {/* Version History */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <History size={14} />
                      Submission History
                    </div>
                    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 font-bold text-zinc-500 border-b border-zinc-100">
                          <tr>
                            <th className="px-4 py-3">Ver</th>
                            <th className="px-4 py-3">Uploaded By</th>
                            <th className="px-4 py-3">Date & Time</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {selectedArticle.versions.map((v, i) => (
                            <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-black">v{v.version}</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  v.uploadedBy === 'Author' ? "bg-black text-white" : "bg-zinc-200 text-black"
                                )}>
                                  {v.uploadedBy.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-zinc-500">{v.timestamp}</td>
                              <td className="px-4 py-3 text-right">
                                <button className="text-black hover:underline font-bold transition-all">Download</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Status Info */}
                  <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 border-b border-zinc-200 pb-2">Tracking Intel</h4>
                    <div className="space-y-5">
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">Current Workflow State</p>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          getStatusStyles(selectedArticle.status)
                        )}>
                          {getStatusIcon(selectedArticle.status)}
                          {selectedArticle.status}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">Last Activity Detected</p>
                        <p className="text-sm font-bold text-black">{selectedArticle.versions[0].timestamp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resubmission Section */}
                  {selectedArticle.status === 'Needs Revision' && (
                    <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100 shadow-xl shadow-rose-500/5">
                      <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin-slow" />
                        Revision Required
                      </h4>
                      <p className="text-xs text-rose-700/80 mb-6 leading-relaxed">
                        Peer reviewers have provided feedback. Please upload your revised manuscript to proceed.
                      </p>
                      <div className="space-y-3">
                        <button className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-[10px] tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95">
                          <Upload size={14} />
                          UPLOAD REVISED VERSION
                        </button>
                        <p className="text-[8px] text-rose-400 text-center uppercase tracking-widest font-black italic">
                          Accepts PDF, DOCX (Max 15MB)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Latest File Card */}
                  <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Latest Manuscript</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black truncate">{selectedArticle.versions[0].fileName}</p>
                        <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">v{selectedArticle.versions[0].version} • ACTIVE</p>
                      </div>
                      <button className="p-2 hover:bg-zinc-100 rounded-lg text-black transition-all">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
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
