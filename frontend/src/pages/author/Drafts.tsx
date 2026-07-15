import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  Edit3, 
  Trash2, 
  Send, 
  Plus, 
  Inbox,
  Calendar
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import { getArticles, deleteArticle } from '../../services/article.service';
import api from '../../services/api';

import { useProfile } from '../../hooks/useProfile';

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
  const { profile } = useProfile();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      const response = await getArticles();
      if (response.success && profile?.uid) {
        const backendDrafts = response.articles
          .filter((a: any) => 
            a.status === 'draft' && 
            a.authorId === profile.uid && 
            (!a.participantIds || a.participantIds.length <= 1)
          )
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
    if (profile?.uid) fetchDrafts();
  }, [profile?.uid]);

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
          <p className="text-zinc-500 mt-2 text-sm leading-relaxed max-w-xl">Review and complete your pending manuscripts before final submission to the BKMA Archive.</p>
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
        <div className="space-y-5">
          {drafts.map((draft) => {
            return (
              <div 
                key={draft.id} 
                className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5 sm:p-6 space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden text-left"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 
                      onClick={() => handleDraftSubmit(draft)}
                      className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 cursor-pointer hover:text-blue-600 transition-colors font-['Outfit']"
                    >
                      {draft.title}
                    </h2>
                    <p className="text-xs text-zinc-500 font-semibold font-sans mt-1">
                      Category: <span className="uppercase text-zinc-700">{draft.category}</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-500 border border-zinc-200 leading-none font-sans">
                      <Edit3 size={10} className="mr-1" />
                      Draft
                    </span>
                  </div>
                </div>

                {/* Information Panel */}
                <div className="bg-indigo-50/50 rounded-2xl py-2 px-4 sm:py-2.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-100/30">
                  <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                    {/* Calendar Icon */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-100/70 border border-indigo-200/20 flex items-center justify-center text-indigo-600 shrink-0">
                      <Calendar size={18} />
                    </div>
                    
                    {/* Last Modified */}
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Last Modified</span>
                      <span className="text-xs font-bold text-zinc-700 font-sans">
                        {new Date(draft.lastEdited).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button 
                    onClick={() => handleDraftSubmit(draft)}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all uppercase cursor-pointer shadow-md hover:shadow-lg font-sans h-11 flex items-center justify-center font-bold disabled:bg-zinc-300 disabled:cursor-not-allowed"
                  >
                    <Send size={14} className="mr-2" />
                    Submit Final
                  </button>

                  <button 
                    onClick={() => deleteDraft(draft.id)}
                    className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-rose-700 transition-all uppercase cursor-pointer shadow-md hover:shadow-lg font-sans h-11 flex items-center justify-center font-bold"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Discard Draft
                  </button>
                </div>
              </div>
            );
          })}
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
