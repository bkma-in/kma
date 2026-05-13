import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  Edit3, 
  Trash2, 
  Send, 
  Plus, 
  Inbox
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import { getArticles, deleteArticle } from '../../services/article.service';
import api from '../../services/api';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
            category: 'Mathematics',
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

  const deleteDraft = (id: string) => {
    confirm({
      title: 'Delete Draft',
      message: 'Are you sure you want to delete this draft?',
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

  const handleDraftSubmit = (draft: Draft) => {
    navigate('/author/submit', { state: { draft: draft } });
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
                          onClick={() => handleDraftSubmit(draft)}
                          disabled={isSubmitting}
                          className="p-2.5 bg-black text-white rounded-xl shadow-lg shadow-black/10 hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center disabled:bg-zinc-300 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default Drafts;
