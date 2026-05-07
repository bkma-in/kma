import React, { useState, useRef } from 'react';
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

// Types
type ReviewStatus = 'Accepted' | 'Rejected' | 'Needs Improvement' | '';

interface Article {
  id: string;
  title: string;
  author: string;
  assignedDate: string;
  isReviewed: boolean;
  uploadedFile: File | null;
  selectedStatus: ReviewStatus;
}

const ReviewerArticles = () => {
  const { showToast } = useNotification();
  const [articles, setArticles] = useState<Article[]>([
    { 
      id: 'KMA-2024-002', 
      title: 'Advanced Cryptography Protocols in Quantum Systems', 
      author: 'Michael Chang', 
      assignedDate: '2024-03-15', 
      isReviewed: false,
      uploadedFile: null,
      selectedStatus: ''
    },
    { 
      id: 'KMA-2024-006', 
      title: 'Neural Networks in Modern Diagnostic Medicine', 
      author: 'Dr. Sarah Jenkins', 
      assignedDate: '2024-03-18', 
      isReviewed: false,
      uploadedFile: null,
      selectedStatus: ''
    },
    { 
      id: 'KMA-2024-010', 
      title: 'Topological Data Analysis in Social Networks', 
      author: 'Prof. Elena Sterling', 
      assignedDate: '2024-03-10', 
      isReviewed: true,
      uploadedFile: null,
      selectedStatus: 'Accepted'
    },
  ]);

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleDownload = (title: string) => {
    // Simulate download
    const dummyContent = `Manuscript Content for: ${title}`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'doc', 'docx'].includes(ext || '')) {
        setArticles(prev => prev.map(art => 
          art.id === id ? { ...art, uploadedFile: file } : art
        ));
      } else {
        showToast('Please upload PDF or DOC files only.', 'error');
      }
    }
  };

  const handleStatusChange = (id: string, status: ReviewStatus) => {
    setArticles(prev => prev.map(art => 
      art.id === id ? { ...art, selectedStatus: status } : art
    ));
  };

  const handleSubmit = async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!article || !article.uploadedFile || !article.selectedStatus) {
      showToast('Please upload a file and select a status before submitting.', 'info');
      return;
    }

    setSubmittingId(id);
    
    // Simulate API call
    console.log('Submitting Review:', {
      articleId: article.id,
      status: article.selectedStatus,
      fileName: article.uploadedFile.name,
      reviewer: 'Dr. John Doe'
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    setArticles(prev => prev.map(art => 
      art.id === id ? { ...art, isReviewed: true } : art
    ));
    
    setSubmittingId(null);
    setSuccessMessage('Review submitted successfully');
    
    setTimeout(() => setSuccessMessage(null), 3000);
  };

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

      {/* Success Notification (KEEPING YOUR CUSTOM BANNER) */}
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

      {/* Main Table Container (HIS POLISHED UI) */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-xl overflow-hidden mx-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-1/3">Manuscript Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Author</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Reference</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Upload Result</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Decision</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {articles.map((article) => (
                <tr key={article.id} className={cn(
                  "group transition-all duration-300",
                  article.isReviewed ? "opacity-60 bg-zinc-50/50" : "hover:bg-zinc-50/50"
                )}>
                  <td className="px-8 py-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-400 tracking-[0.2em] uppercase">{article.id}</p>
                      <h3 className="text-sm font-bold text-black group-hover:text-zinc-700 transition-colors line-clamp-2 leading-tight font-['Outfit']">{article.title}</h3>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{article.author}</p>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <button 
                      onClick={() => handleDownload(article.title)}
                      className="p-3 bg-white text-zinc-600 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm border border-zinc-100 group/btn"
                      title="Download Original Manuscript"
                    >
                      <Download size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </td>
                  <td className="px-8 py-8">
                    {!article.isReviewed ? (
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => fileInputRefs.current[article.id]?.click()}
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
                          ref={el => { fileInputRefs.current[article.id] = el; }}
                          onChange={(e) => handleFileChange(article.id, e)}
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
                  <td className="px-8 py-8">
                    {!article.isReviewed ? (
                      <div className="relative">
                        <select 
                          value={article.selectedStatus}
                          onChange={(e) => handleStatusChange(article.id, e.target.value as ReviewStatus)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm"
                        >
                          <option value="" disabled>Status</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Needs Improvement">Needs Revision</option>
                        </select>
                      </div>
                    ) : (
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        article.selectedStatus === 'Accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        article.selectedStatus === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {article.selectedStatus}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-8 text-right">
                    {!article.isReviewed ? (
                      <button 
                        onClick={() => handleSubmit(article.id)}
                        disabled={submittingId === article.id}
                        className="px-6 py-3 bg-black text-white rounded-xl font-bold text-[10px] tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center justify-center gap-2 ml-auto disabled:bg-zinc-200 disabled:cursor-not-allowed"
                      >
                        {submittingId === article.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            PROCESSING...
                          </>
                        ) : (
                          'SUBMIT ASSESSMENT'
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center justify-end gap-2 text-zinc-300">
                        <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
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
