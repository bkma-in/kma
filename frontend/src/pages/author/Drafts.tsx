import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  Edit3, 
  Trash2, 
  Send, 
  Plus, 
  X, 
  FileEdit,
  Upload,
  Info,
  Inbox,
  Eye
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import { getArticles, deleteArticle } from '../../services/article.service';
import { cn } from '../../utils/cn';

interface Draft {
  id: string;
  title: string;
  lastEdited: string;
  category: string;
  abstract: string;
  pdfName?: string;
}

const Drafts = () => {
  const { confirm, showToast } = useNotification();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      const response = await getArticles();
      if (response.success) {
        const backendDrafts = response.articles
          .filter((a: any) => a.status === 'draft')
          .map((a: any) => ({
            id: a.articleId,
            title: a.title,
            category: 'Mathematics', // Could be dynamic if saved in backend
            lastEdited: new Date(a.updatedAt._seconds * 1000).toISOString(),
            abstract: a.abstract,
            pdfName: a.pdfName
          }));
        setDrafts(backendDrafts);
      }
    } catch (error) {
      console.error('Failed to fetch drafts', error);
      showToast('Failed to load drafts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const deleteDraft = (id: string) => {
    confirm({
      title: 'Delete Draft',
      message: 'Are you sure you want to permanently remove this manuscript draft from your workspace?',
      confirmText: 'Delete Draft',
      onConfirm: async () => {
        try {
          const response = await deleteArticle(id);
          if (response.success) {
            setDrafts(prev => prev.filter(d => d.id !== id));
            showToast('Draft successfully removed', 'success');
          }
        } catch (error) {
          console.error('Delete failed', error);
          showToast('Failed to delete draft', 'error');
        }
      }
    });
  };

  const handleEdit = (draft: Draft) => {
    setSelectedDraft(draft);
    setIsEditModalOpen(true);
  };

  const handleUpdateVersion = async () => {
    if (!selectedDraft) return;
    
    try {
      const payload = new FormData();
      payload.append('title', selectedDraft.title);
      payload.append('abstract', selectedDraft.abstract);
      payload.append('category', selectedDraft.category);
      payload.append('status', 'draft');
      if (selectedFile) {
        payload.append('pdf', selectedFile);
      }

      const response = await api.put(`/articles/${selectedDraft.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        showToast('Draft version updated successfully', 'success');
        setIsEditModalOpen(false);
        fetchDrafts(); // Refresh list
      }
    } catch (error) {
      console.error('Update failed', error);
      showToast('Failed to update draft', 'error');
    }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto px-4">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <Clock size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">Personal Workspace</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Saved Drafts</h1>
          <p className="text-zinc-500 mt-2 text-sm leading-relaxed max-w-xl">Review and complete your pending manuscripts before final submission to the KMA Archive.</p>
        </div>

        <NavLink 
          to="/author/submit"
          className="flex items-center gap-3 px-8 py-3.5 bg-black text-white rounded-xl text-[10px] font-black tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95 uppercase"
        >
          <Plus size={16} />
          START NEW ARTICLE
        </NavLink>
      </div>

      {isLoading ? (
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-zinc-100 border-t-black rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium text-sm">Syncing workspace...</p>
        </div>
      ) : drafts.length > 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-black/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Draft Title</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Last Modified</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {drafts.map((draft) => (
                  <tr key={draft.id} className="group hover:bg-zinc-50/30 transition-all duration-300">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-black group-hover:text-zinc-700 transition-colors line-clamp-1 font-['Outfit']">{draft.title}</h3>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{draft.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-xs text-zinc-500 font-bold text-center uppercase tracking-wider">
                      {new Date(draft.lastEdited).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-500 border border-zinc-200 shadow-sm">
                        <Edit3 size={10} />
                        Draft
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => handleEdit(draft)}
                          className="p-2.5 bg-white border border-zinc-100 hover:border-black rounded-xl text-zinc-400 hover:text-black transition-all shadow-sm"
                          title="Resume Drafting"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => navigate('/author/submit', { state: { draft: draft } })}
                          className="p-2.5 bg-black text-white rounded-xl shadow-lg shadow-black/10 hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center"
                          title="Submit Final"
                        >
                          <Send size={18} />
                        </button>
                        <button 
                          onClick={() => deleteDraft(draft.id)}
                          className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                          title="Discard Draft"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-32 border border-zinc-100 shadow-xl shadow-black/[0.02] text-center flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-10 border-4 border-white shadow-inner">
            <Inbox size={48} className="text-zinc-200" />
          </div>
          <h3 className="text-3xl font-bold text-black mb-3 tracking-tighter font-['Outfit']">No Active Drafts</h3>
          <p className="text-zinc-500 text-sm max-w-sm mb-12 leading-relaxed italic">
            "Your research workspace is currently empty. Start a new manuscript to begin your contribution to the archive."
          </p>
          <NavLink 
            to="/author/submit"
            className="flex items-center gap-3 px-10 py-4 bg-black text-white rounded-2xl text-[10px] font-black tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-2xl shadow-black/10 active:scale-95"
          >
            <Plus size={20} />
            INITIATE SUBMISSION
          </NavLink>
        </div>
      )}

      {/* Edit Draft Modal */}
      {isEditModalOpen && selectedDraft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-zinc-50 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500 border border-white/20">
            {/* Modal Header */}
            <div className="px-8 py-8 border-b border-zinc-200 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/20">
                  <FileEdit size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-black tracking-tight uppercase text-lg font-['Outfit']">Resume Drafting</h3>
                  <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em]">{selectedDraft.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-12 h-12 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  {/* Section 1: Details */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 space-y-8">
                    <div className="flex items-center gap-2 border-b border-zinc-50 pb-5">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h3 className="font-bold text-black tracking-tight uppercase text-sm">Manuscript Intelligence</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Manuscript Title</label>
                        <input 
                          type="text" 
                          value={selectedDraft.title}
                          onChange={(e) => setSelectedDraft({...selectedDraft, title: e.target.value})}
                          className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Domain</label>
                          <select 
                            value={selectedDraft.category}
                            onChange={(e) => setSelectedDraft({...selectedDraft, category: e.target.value})}
                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm"
                          >
                            <option value="Topology">Topology</option>
                            <option value="Pure Mathematics">Pure Mathematics</option>
                            <option value="Applied Mathematics">Applied Mathematics</option>
                            <option value="Statistics">Statistics</option>
                            <option value="Mathematical Physics">Mathematical Physics</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Keywords</label>
                          <input 
                            type="text" 
                            placeholder="Add research tags..."
                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Abstract Preview</label>
                        <textarea 
                          value={selectedDraft.abstract}
                          onChange={(e) => setSelectedDraft({...selectedDraft, abstract: e.target.value})}
                          rows={6}
                          className="w-full px-6 py-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all resize-none shadow-inner"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Upload */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
                    <div className="flex items-center gap-2 mb-8 border-b border-zinc-50 pb-5">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h3 className="font-bold text-black tracking-tight uppercase text-sm">Revised Manuscript</h3>
                    </div>
                    <div className="bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] p-8">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      
                      {(selectedFile || selectedDraft.pdfName) ? (
                        <div className="space-y-6">
                          {/* Document Card */}
                          <div className="w-full p-6 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-black/[0.02] flex items-center gap-6 animate-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 shrink-0">
                              <FileText size={28} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-lg font-bold text-black truncate font-['Outfit']">
                                {selectedFile ? selectedFile.name : selectedDraft.pdfName}
                              </h4>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • READY` : "CURRENT MANUSCRIPT • ENCRYPTED"}
                              </p>
                            </div>
                          </div>

                          {/* Preview Area */}
                          <div className="w-full aspect-[4/3] bg-zinc-100 rounded-[2rem] border border-dashed border-zinc-200 overflow-hidden relative group">
                            {previewUrl ? (
                              selectedFile?.type === 'application/pdf' ? (
                                <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Preview" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3 bg-zinc-50">
                                  <FileText size={48} className="opacity-20" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">Preview not available for this format</p>
                                </div>
                              )
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3 bg-zinc-50">
                                <Eye size={48} className="opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Loading secure preview...</p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons Below */}
                          <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 px-8 py-4 bg-zinc-900 text-white text-[10px] font-black rounded-2xl tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 uppercase"
                            >
                              REPLACE DOCUMENT
                            </button>
                            {previewUrl && (
                              <a 
                                href={previewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-zinc-200 text-black text-[10px] font-black rounded-2xl tracking-widest hover:bg-zinc-50 transition-all shadow-sm active:scale-95 uppercase"
                              >
                                <Eye size={16} />
                                OPEN FULL PREVIEW
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                          <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto border border-zinc-50">
                            <Upload size={32} className="text-zinc-200" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xl font-bold text-black font-['Outfit'] tracking-tight">No Manuscript Attached</h4>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em]">PDF, DOC, DOCX (MAX 20MB)</p>
                          </div>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-12 py-5 bg-black text-white text-[10px] font-black rounded-2xl tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-2xl shadow-black/10 active:scale-95 uppercase mt-4"
                          >
                            Select Document
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Submission Actions */}
                <div className="space-y-8">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 space-y-8">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] border-b border-zinc-50 pb-4">Lifecycle Management</h4>
                    <div className="space-y-4">
                      <button 
                        onClick={() => {
                          setIsEditModalOpen(false);
                          showToast('Manuscript transmitted to KMA Archive', 'success');
                        }}
                        className="w-full py-5 bg-black text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/10 active:scale-95"
                      >
                        <Send size={18} />
                        SUBMIT FINAL
                      </button>
                      <button 
                        onClick={handleUpdateVersion}
                        className="w-full py-5 bg-white text-black border border-zinc-200 rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                      >
                        UPDATE VERSION
                      </button>
                    </div>
                  </div>

                  <div className="p-8 bg-amber-50 rounded-3xl flex gap-4 border border-amber-100 shadow-xl shadow-amber-500/5">
                    <Info size={24} className="text-amber-500 shrink-0 mt-1" />
                    <p className="text-xs text-amber-800/80 font-medium leading-relaxed italic">
                      Saving this version will update your workspace timestamp. The final submission is irreversible and will initiate the peer-review cycle.
                    </p>
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

export default Drafts;
