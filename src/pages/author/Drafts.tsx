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

interface Draft {
  id: string;
  title: string;
  lastEdited: string;
  category: string;
  abstract: string;
}

const Drafts = () => {
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
    if (confirm('Are you sure you want to delete this draft?')) {
      setDrafts(drafts.filter(d => d.id !== id));
    }
  };

  const handleEdit = (draft: Draft) => {
    setSelectedDraft(draft);
    setIsEditModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
              <Clock size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Personal Workspace</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Saved Drafts</h1>
          <p className="text-zinc-500 mt-2 text-sm">Review and complete your pending manuscripts before final submission.</p>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
          <Plus size={16} />
          START NEW ARTICLE
        </button>
      </div>

      {drafts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Draft Title</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Last Edited</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {drafts.map((draft) => (
                  <tr key={draft.id} className="group hover:bg-zinc-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 transition-all shrink-0">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-black group-hover:text-zinc-700 transition-colors line-clamp-1">{draft.title}</h3>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{draft.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-zinc-500 font-medium">
                      {new Date(draft.lastEdited).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200">
                        <Edit3 size={10} />
                        Draft
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(draft)}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-all"
                          title="Edit Draft"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          className="p-2 hover:bg-black hover:text-white rounded-lg text-zinc-400 transition-all"
                          title="Submit Now"
                        >
                          <Send size={18} />
                        </button>
                        <button 
                          onClick={() => deleteDraft(draft.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-all"
                          title="Delete Draft"
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
        <div className="bg-white rounded-3xl p-20 border border-zinc-100 shadow-sm text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-inner">
            <FileText size={40} className="text-zinc-200" />
          </div>
          <h3 className="text-2xl font-bold text-black mb-2 tracking-tight">No drafts available</h3>
          <p className="text-zinc-500 text-sm max-w-sm mb-10 leading-relaxed">
            You don't have any saved manuscripts. Start a new article to begin your research submission.
          </p>
          <button className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl text-xs font-bold tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95">
            <Plus size={18} />
            START A NEW ARTICLE
          </button>
        </div>
      )}

      {/* Edit Draft Modal (Reuse Submit Article Form Structure) */}
      {isEditModalOpen && selectedDraft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-zinc-50 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-zinc-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                  <FileEdit size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-black tracking-tight uppercase text-sm">Resume Drafting</h3>
                  <p className="text-[10px] text-zinc-500 font-bold tracking-widest">{selectedDraft.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Reusing Submit Form Structure */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Section 1: Details */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 space-y-6">
                    <div className="flex items-center gap-2 mb-2 border-b border-zinc-50 pb-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h3 className="font-bold text-black tracking-tight">ARTICLE DETAILS</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Title</label>
                        <input 
                          type="text" 
                          defaultValue={selectedDraft.title}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Category</label>
                          <select 
                            defaultValue={selectedDraft.category}
                            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                          >
                            <option value="Topology">Topology</option>
                            <option value="Pure Mathematics">Pure Mathematics</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Keywords</label>
                          <input 
                            type="text" 
                            placeholder="Add keywords..."
                            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Abstract</label>
                        <textarea 
                          defaultValue={selectedDraft.abstract}
                          rows={6}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Upload */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
                    <div className="flex items-center gap-2 mb-6 border-b border-zinc-50 pb-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h3 className="font-bold text-black tracking-tight uppercase">Upload Updated Manuscript</h3>
                    </div>
                    <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-zinc-50/50">
                      <Upload size={24} className="text-zinc-400 mb-2" />
                      <p className="text-xs font-bold text-black mb-1">Click to Replace File</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">.doc, .docx only</p>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Submission Actions */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Workflow</h4>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setIsEditModalOpen(false)}
                        className="w-full py-4 bg-black text-white rounded-xl font-bold text-xs tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Send size={16} />
                        SUBMIT FINAL
                      </button>
                      <button 
                        onClick={() => setIsEditModalOpen(false)}
                        className="w-full py-4 bg-white text-black border border-zinc-200 rounded-xl font-bold text-xs tracking-widest hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
                      >
                        SAVE CHANGES
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl flex gap-3 border border-amber-100">
                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      Saving changes will update the last edited timestamp. Final submission will lock the draft for review.
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
