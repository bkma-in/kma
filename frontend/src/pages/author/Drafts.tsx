import { useState } from 'react';
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
  Info
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';

interface Draft {
  id: string;
  title: string;
  lastEdited: string;
  category: string;
  abstract: string;
}

const Drafts = () => {
  const { confirm, showToast } = useNotification();
  const [drafts, setDrafts] = useState<Draft[]>([
    {
      id: 'D-102',
      title: 'Topological Data Analysis in Machine Learning',
      lastEdited: '2024-03-20',
      category: 'Topology',
      abstract: 'An investigation into how TDA can be used to improve feature extraction...'
    },
    {
      id: 'D-105',
      title: 'A New Approach to Prime Number Distribution',
      lastEdited: '2024-03-18',
      category: 'Pure Mathematics',
      abstract: 'Proposed methods for approximating the density of primes in large intervals...'
    }
  ]);

  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const deleteDraft = (id: string) => {
    confirm({
      title: 'Delete Draft',
      message: 'Are you sure you want to permanently remove this manuscript draft from your workspace?',
      confirmText: 'Delete Draft',
      onConfirm: () => {
        setDrafts(drafts.filter(d => d.id !== id));
        showToast('Draft successfully removed from workspace', 'success');
      }
    });
  };

  const handleEdit = (draft: Draft) => {
    setSelectedDraft(draft);
    setIsEditModalOpen(true);
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

        <button className="flex items-center gap-3 px-8 py-3.5 bg-black text-white rounded-xl text-[10px] font-black tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95 uppercase">
          <Plus size={16} />
          START NEW ARTICLE
        </button>
      </div>

      {drafts.length > 0 ? (
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
                          className="p-2.5 bg-black text-white rounded-xl shadow-lg shadow-black/10 hover:bg-zinc-800 transition-all active:scale-95"
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
          <button className="flex items-center gap-3 px-10 py-4 bg-black text-white rounded-2xl text-[10px] font-black tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-2xl shadow-black/10 active:scale-95">
            <Plus size={20} />
            INITIATE SUBMISSION
          </button>
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
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Research Title</label>
                        <input 
                          type="text" 
                          defaultValue={selectedDraft.title}
                          className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Domain</label>
                          <select 
                            defaultValue={selectedDraft.category}
                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm"
                          >
                            <option value="Topology">Topology</option>
                            <option value="Pure Mathematics">Pure Mathematics</option>
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
                          defaultValue={selectedDraft.abstract}
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
                    <div className="border-2 border-dashed border-zinc-100 hover:border-black rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center bg-zinc-50/50 hover:bg-zinc-50 transition-all cursor-pointer group">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <Upload size={28} className="text-zinc-300 group-hover:text-black" />
                      </div>
                      <h4 className="text-lg font-bold text-black mb-1 font-['Outfit']">Replace Current Draft</h4>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">PDF, DOC, DOCX (Max 20MB)</p>
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
                        onClick={() => {
                          setIsEditModalOpen(false);
                          showToast('Draft version synchronized', 'info');
                        }}
                        className="w-full py-5 bg-white text-black border border-zinc-200 rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                      >
                        SAVE VERSION
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
