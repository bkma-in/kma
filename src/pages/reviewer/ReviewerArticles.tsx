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
        alert('Please upload PDF or DOC files only.');
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
      alert('Please upload a file and select a status before submitting.');
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Assessment Portal</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Assigned Articles</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-md">Download manuscripts, perform your assessment, and upload the reviewed version with your decision.</p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-8 duration-500">
          <div className="bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-sm font-bold tracking-tight">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/40 border-b border-white/10">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-1/3">Manuscript</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Author</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Download</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Upload Review</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status Decision</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {articles.map((article) => (
                <tr key={article.id} className={cn(
                  "group transition-colors",
                  article.isReviewed ? "opacity-60 bg-white/20" : "hover:bg-white/40"
                )}>
                  <td className="px-8 py-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-400 tracking-[0.2em]">{article.id}</p>
                      <h3 className="text-sm font-bold text-black line-clamp-2 leading-tight">{article.title}</h3>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{article.author}</p>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <button 
                      onClick={() => handleDownload(article.title)}
                      className="p-3 bg-white/50 backdrop-blur-sm text-zinc-600 rounded-xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm border border-white/20"
                      title="Download Manuscript"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                  <td className="px-8 py-8">
                    {!article.isReviewed ? (
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => fileInputRefs.current[article.id]?.click()}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 backdrop-blur-sm shadow-sm",
                            article.uploadedFile 
                              ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30" 
                              : "bg-white/40 text-zinc-500 hover:bg-white/60 border border-white/20"
                          )}
                        >
                          <Upload size={14} />
                          {article.uploadedFile ? 'Change File' : 'Choose File'}
                        </button>
                        {article.uploadedFile && (
                          <span className="text-[9px] text-zinc-400 font-bold truncate max-w-[120px]">
                            {article.uploadedFile.name}
                          </span>
                        )}
                        <input 
                          type="file"
                          ref={el => fileInputRefs.current[article.id] = el}
                          onChange={(e) => handleFileChange(article.id, e)}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={18} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Uploaded</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-8">
                    {!article.isReviewed ? (
                      <select 
                        value={article.selectedStatus}
                        onChange={(e) => handleStatusChange(article.id, e.target.value as ReviewStatus)}
                        className="w-full bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>Select Status</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Needs Improvement">Needs Improvement</option>
                      </select>
                    ) : (
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-sm shadow-sm",
                        article.selectedStatus === 'Accepted' ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/20" :
                        article.selectedStatus === 'Rejected' ? "bg-rose-500/20 text-rose-600 border-rose-500/20" :
                        "bg-amber-500/20 text-amber-600 border-amber-500/20"
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
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 ml-auto"
                      >
                        {submittingId === article.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            SUBMITTING...
                          </>
                        ) : (
                          'SUBMIT REVIEW'
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center justify-end gap-2 text-zinc-400">
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
      <div className="flex items-center justify-center py-10 opacity-30">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle size={32} />
          <p className="text-xs font-bold uppercase tracking-[0.4em]">End of Assignment List</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewerArticles;
