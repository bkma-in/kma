import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  FileEdit, 
  Eye, 
  RotateCw, 
  Download, 
  ArrowRight,
  Loader2,
  X,
  FileText,
  Calendar,
  User,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { getPdfUrl } from '../../services/article.service';
import { db, auth } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNotification } from '../../utils/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { formatDate } from '../../utils/dateHelpers';

// Types
interface Version {
  version: number;
  uploadedBy: 'Author' | 'Reviewer';
  timestamp: string;
  fileName: string;
  pdfUrl?: string;
}

interface Article {
  id: string;
  title: string;
  author: string;
  authorId: string;
  abstract: string;
  status: string;
  lastUpdated: string;
  submittedDate: string;
  versions: Version[];
  adminNote?: string;
  rejectionReason?: string;
  pdfUrl?: string;
  pdfName?: string;
  revisionHistory?: any[];
  reviews?: any;
  reviewerFeedback?: any;
}

const AuthorRevisionRequired = () => {
  const { confirm, showToast } = useNotification();
  const { currentUser } = useAuth();
  const location = useLocation();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editAbstract, setEditAbstract] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getReviewerComments = (article: Article | any) => {
    if (!article) return [];
    const comments: string[] = [];
    if (article.reviews) {
      Object.values(article.reviews).forEach((r: any) => {
        if (r && r.remarks && r.remarks.trim()) {
          const clean = r.remarks.trim();
          if (clean !== 'Reviewed via peer assessment portal.' && clean !== 'Reviewed via peer assessment portal') {
            comments.push(clean);
          }
        }
      });
    }
    if (comments.length === 0 && article.reviewerFeedback?.remarks) {
      const clean = article.reviewerFeedback.remarks.trim();
      if (clean !== 'Reviewed via peer assessment portal.' && clean !== 'Reviewed via peer assessment portal') {
        comments.push(clean);
      }
    }
    return comments;
  };

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'articles'),
      where('participantIds', 'array-contains', currentUser.uid),
      where('status', '==', 'revision_requested')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedArticles = snapshot.docs.map(doc => {
        const data = doc.data();
        const firstVersionTime = data.createdAt || data.updatedAt;
        return {
          id: doc.id,
          title: data.title || 'Untitled Article',
          author: data.author || 'Author',
          authorId: data.authorId || '',
          abstract: data.abstract || '',
          status: 'Revision Required',
          lastUpdated: formatDate(data.updatedAt || data.createdAt),
          submittedDate: formatDate(firstVersionTime),
          versions: data.revisionHistory ? 
            data.revisionHistory.map((v: any, idx: number) => ({
              version: idx + 1,
              uploadedBy: 'Author',
              timestamp: formatDate(v.replacedAt || v.submittedAt),
              fileName: v.pdfName || 'manuscript.pdf',
              pdfUrl: v.pdfUrl
            })).concat([{
              version: data.revisionHistory.length + 1,
              uploadedBy: 'Author',
              timestamp: formatDate(data.updatedAt || data.createdAt),
              fileName: data.pdfName || 'manuscript.pdf',
              pdfUrl: data.pdfUrl
            }]) : [{ 
              version: 1, 
              uploadedBy: 'Author', 
              timestamp: formatDate(data.createdAt), 
              fileName: data.pdfName || 'manuscript.pdf',
              pdfUrl: data.pdfUrl 
            }],
          adminNote: data.adminNote || '',
          rejectionReason: data.rejectionReason || '',
          pdfUrl: data.pdfUrl || '',
          pdfName: data.pdfName || '',
          revisionHistory: data.revisionHistory || [],
          reviews: data.reviews || null,
          reviewerFeedback: data.reviewerFeedback || null
        } as Article;
      });

      setArticles(fetchedArticles);
      setLoading(false);

      // Honor the notification deep-link by checking location state highlightId
      const state = location.state as { highlightId?: string } | null;
      if (state?.highlightId) {
        const matchingArticle = fetchedArticles.find(a => a.id === state.highlightId);
        if (matchingArticle) {
          setSelectedArticle(matchingArticle);
        } else {
          setSelectedArticle(prev => {
            if (!prev) return null;
            const current = fetchedArticles.find(a => a.id === prev.id);
            return current || null;
          });
        }
      } else {
        // Keep selection in sync if it changes or gets deleted
        setSelectedArticle(prev => {
          if (!prev) return null;
          const current = fetchedArticles.find(a => a.id === prev.id);
          return current || null;
        });
      }
    }, (error) => {
      console.error('Failed to load revision required articles:', error);
      showToast('Failed to load articles.', 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, location]);

  // Handle Edit click
  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    setEditAbstract(article.abstract);
    setEditFile(null);
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setEditError('Only PDF files are allowed.');
      return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
      setEditError('File size must be under 25MB.');
      return;
    }
    
    setEditFile(file);
    setEditError('');
  };

  // Submit edit changes (keeping status as revision_requested)
  const handleSaveEdits = async () => {
    if (!editingArticle) return;
    if (!editAbstract.trim()) {
      setEditError('Abstract is required.');
      return;
    }

    setIsSaving(true);
    setEditError('');
    try {
      const payload = new FormData();
      payload.append('abstract', editAbstract);
      payload.append('title', editingArticle.title);
      payload.append('status', 'revision_requested'); // explicitly keep status
      
      if (editFile) {
        payload.append('pdf', editFile);
      }

      const response = await api.put(`/articles/${editingArticle.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        showToast('Changes saved successfully.', 'success');
        setIsEditModalOpen(false);
        setEditingArticle(null);
      }
    } catch (error: any) {
      console.error('Failed to save edits:', error);
      setEditError(error.response?.data?.error || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF file
  const handleDownload = async (pdfUrl: string, articleId: string) => {
    if (!pdfUrl) return;
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      window.open(pdfUrl, '_blank');
      return;
    }
    try {
      showToast('Generating secure download link...', 'info');
      const res = await getPdfUrl(articleId, pdfUrl);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        showToast('Failed to retrieve PDF download link.', 'error');
      }
    } catch (err: any) {
      showToast('Error downloading PDF: ' + (err.response?.data?.error || err.message || err), 'error');
    }
  };

  // Resubmit final revision to Admin queue
  const handleResubmit = (article: Article) => {
    confirm({
      title: 'Resubmit Article',
      message: 'You are about to resubmit this revised article for review.\n\nDo you want to continue?',
      confirmText: 'Resubmit',
      onConfirm: async () => {
        try {
          const payload = new FormData();
          payload.append('abstract', article.abstract);
          payload.append('title', article.title);
          payload.append('status', 'revised_submitted'); // updates status to revised_submitted on backend

          const response = await api.put(`/articles/${article.id}`, payload);
          if (response.data.success) {
            // Send email/notification updates
            showToast('Article resubmitted successfully for review!', 'success');
            setSelectedArticle(null);
          }
        } catch (error: any) {
          console.error('Resubmission failed:', error);
          showToast(error.response?.data?.error || 'Resubmission failed.', 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={48} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Revision Required</h1>
        <p className="text-zinc-500 mt-2 text-sm max-w-md font-['Outfit']">
          Review and submit corrections for articles returned by the editorial board.
        </p>
      </div>

      {/* Main Grid: Left is table list, right is selected article details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Table/Cards List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl overflow-hidden">
            {articles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest font-['Outfit']">Manuscript Details</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest font-['Outfit']">Returned</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest font-['Outfit'] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {articles.map((article) => {
                      const isSelected = selectedArticle?.id === article.id;
                      return (
                        <tr 
                          key={article.id} 
                          onClick={() => setSelectedArticle(article)}
                          className={cn(
                            "group cursor-pointer transition-colors",
                            isSelected ? "bg-zinc-50" : "hover:bg-zinc-50/30"
                          )}
                        >
                          <td className="px-6 py-5">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-bold uppercase tracking-wider font-['Outfit']">
                                  Revision Required
                                </span>
                                {article.versions && article.versions.length > 1 && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 font-['Outfit'] leading-none">
                                    Revised
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-black line-clamp-1 group-hover:text-amber-600 transition-colors">
                                {article.title}
                              </h3>
                              <p className="text-[10px] text-zinc-400 font-medium uppercase mt-1">Submitted {article.submittedDate}</p>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-xs text-zinc-500 font-medium font-sans">
                            {article.lastUpdated}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenEdit(article)}
                                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-all"
                                title="Edit Article"
                              >
                                <FileEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDownload(article.pdfUrl || '', article.id)}
                                disabled={!article.pdfUrl}
                                className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-lg transition-all disabled:opacity-50"
                                title="View Submitted Version"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6 text-zinc-400">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1 font-['Outfit']">All clear!</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  No articles are currently returned for revision.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Revision Details & Action Center */}
        <div className="lg:col-span-1">
          {selectedArticle ? (
            <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-xl p-6 space-y-6 animate-in slide-in-from-right duration-500">
              
              {/* Header */}
              <div>
                <span className="text-[9px] font-black text-zinc-400 mb-1 block tracking-wider uppercase">Manuscript Details</span>
                <h2 className="text-lg font-bold text-black leading-snug">{selectedArticle.title}</h2>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-black uppercase tracking-wider font-['Outfit']">
                    Revision Required
                  </span>
                  {selectedArticle.versions && selectedArticle.versions.length > 1 && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide bg-amber-500/10 text-amber-600 border border-amber-500/20 leading-none">
                      Revised
                    </span>
                  )}
                </div>
              </div>

              {/* Revision Metadata Details */}
              <div className="border-t border-b border-zinc-100 py-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5"><User size={14} /> Returned By</span>
                  <span className="font-bold text-zinc-800 uppercase">Admin / Editor</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Calendar size={14} /> Returned Date</span>
                  <span className="font-bold text-zinc-800 font-sans">{selectedArticle.lastUpdated}</span>
                </div>
              </div>

              {/* highlighted read-only cards with comments/reasons */}
              <div className="space-y-4">
                {getReviewerComments(selectedArticle).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1 font-['Outfit']">
                      Reviewer Comments
                    </h4>
                    <div className="space-y-2">
                      {getReviewerComments(selectedArticle).map((comment, index) => (
                        <div key={index} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-1">Reviewer #{index + 1}</p>
                          <p className="text-xs text-zinc-700 leading-relaxed font-medium italic">
                            "{comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedArticle.adminNote || (!selectedArticle.adminNote && getReviewerComments(selectedArticle).length === 0)) && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1 font-['Outfit']">
                      Editor Note
                    </h4>
                    <div className="p-4 bg-amber-50/30 border border-amber-100/50 rounded-2xl">
                      <p className="text-xs text-zinc-700 leading-relaxed font-medium italic">
                        "{selectedArticle.adminNote || 'No feedback left. Please edit to resubmit revised abstract/document.'}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Revision History Log */}
                {selectedArticle.versions && selectedArticle.versions.length > 1 && (
                  <div className="space-y-2 border-t border-zinc-100 pt-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 font-['Outfit']">
                      Revision History Log
                    </h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {selectedArticle.versions.map((v) => (
                        <div key={v.version} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl flex items-center justify-between text-xs font-sans">
                          <div>
                            <p className="font-bold text-zinc-800">Version {v.version}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase">{v.timestamp}</p>
                          </div>
                          <button
                            onClick={() => handleDownload(v.pdfUrl || selectedArticle.pdfUrl || '', selectedArticle.id)}
                            className="p-1.5 hover:bg-zinc-200 rounded text-zinc-500 hover:text-black transition-all cursor-pointer"
                            title={`Download Version ${v.version}`}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Area */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleOpenEdit(selectedArticle)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <FileEdit size={14} />
                  Edit Article
                </button>
                <button
                  onClick={() => handleDownload(selectedArticle.pdfUrl || '', selectedArticle.id)}
                  disabled={!selectedArticle.pdfUrl}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download size={14} />
                  View Submitted Version
                </button>
                <button
                  onClick={() => handleResubmit(selectedArticle)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <ArrowRight size={14} />
                  Resubmit Article
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
              <AlertCircle size={28} className="mx-auto mb-4 text-zinc-300" />
              <p className="text-xs font-bold uppercase tracking-wider">Select an article to view details</p>
            </div>
          )}
        </div>

      </div>

      {/* Edit/Revision Modal (Adapted dark themed layout) */}
      {isEditModalOpen && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 text-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-white/10 relative">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-zinc-950">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-['Outfit']">Edit Article</h3>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5 truncate max-w-xs">{editingArticle.title}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                aria-label="Close edit modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {editError && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-800/30 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Title Locked Notice */}
              <div className="p-3.5 bg-zinc-800/50 border border-zinc-700/30 rounded-xl text-zinc-400 text-[10px] font-medium leading-relaxed">
                <span className="font-bold text-white block uppercase mb-1">Title is locked</span>
                The title cannot be modified. You may update the abstract and upload a revised manuscript PDF file below.
              </div>

              {/* Abstract Field */}
              <div>
                <label htmlFor="modalAbstract" className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 px-1 font-['Outfit']">
                  Manuscript Abstract <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="modalAbstract"
                  rows={6}
                  placeholder="Paste your abstract here..."
                  value={editAbstract}
                  onChange={(e) => {
                    setEditAbstract(e.target.value);
                    if (editError) setEditError('');
                  }}
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-zinc-950 border border-white/5 rounded-xl text-xs font-semibold focus:border-white outline-none transition-all placeholder:text-zinc-600 resize-none text-white"
                />
              </div>

              {/* File Upload Field */}
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 px-1 font-['Outfit']">
                  Manuscript PDF File (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  disabled={isSaving}
                  className="hidden"
                />
                
                <div 
                  onClick={() => !isSaving && fileInputRef.current?.click()}
                  className={cn(
                    "border border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer",
                    editFile 
                      ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-400" 
                      : "border-white/10 bg-zinc-950 text-zinc-500 hover:border-white/20 hover:text-zinc-400"
                  )}
                >
                  <FileText className="mx-auto mb-3" size={24} />
                  {editFile ? (
                    <div>
                      <p className="text-xs font-bold text-white max-w-[250px] mx-auto truncate">{editFile.name}</p>
                      <p className="text-[10px] text-emerald-500/80 font-bold mt-1 uppercase">File Selected ({(editFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-zinc-300">Choose a new PDF file</p>
                      <p className="text-[10px] text-zinc-600 mt-1 uppercase">Leave blank to keep existing file: {editingArticle.pdfName}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-3 bg-zinc-950">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-all bg-zinc-900 border border-white/5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={isSaving || !editAbstract.trim()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-xs font-bold rounded-xl transition-all shadow-md disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AuthorRevisionRequired;
