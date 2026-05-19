import { useState, useEffect } from 'react';
import { 
  Bug, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  Maximize2,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { getReportedIssues, updateIssueStatus as updateIssueStatusAPI } from '../../services/user.service';
import type { Issue, IssueStatus } from '../../types/issue';

const DeveloperIssues = () => {
  const { showToast } = useNotification();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'All'>('All');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await getReportedIssues();
      if (response.success) {
        setIssues(response.issues);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      showToast('Failed to load issues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (id: string, newStatus: IssueStatus) => {
    try {
      const response = await updateIssueStatusAPI(id, newStatus);
      if (response.success) {
        setIssues(prev => prev.map(issue => 
          issue.id === id ? { ...issue, status: newStatus } : issue
        ));

        setSelectedIssue(prev => prev && prev.id === id ? { ...prev, status: newStatus } : prev);

        if (newStatus === 'Resolved') {
          showToast('Issue marked as Resolved', 'success');
        } else {
          showToast(`Status updated to ${newStatus}`, 'info');
        }
      }
    } catch (error) {
      console.error('Failed to update issue status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-zinc-400">
            <Bug size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Incident Management</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Reported Issues</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-md">Track and resolve frontend bugs, UI glitches, and user-submitted feedback.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Filter incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-black w-64 focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative group">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-black focus:ring-1 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Incident</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Screenshot</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Submission</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-6 max-w-md">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-400 tracking-widest">{issue.id}</p>
                      <h4 className="text-sm font-bold text-black group-hover:text-zinc-700 transition-colors">{issue.type}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-1 italic">"{issue.description}"</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {issue.screenshot ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 group-hover:border-black/20 transition-all cursor-pointer relative group/img shadow-sm">
                        <img src={issue.screenshot} alt="Issue" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 size={12} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300">
                        <AlertCircle size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">{issue.metadata.user.split('@')[0]}</p>
                      <p className="text-[9px] text-zinc-400 font-medium">{new Date(issue.createdAt).toLocaleString()}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      issue.status === 'Open' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      issue.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    )}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedIssue(issue)}
                      className="p-3 bg-zinc-50 hover:bg-black text-zinc-400 hover:text-white rounded-xl transition-all active:scale-95 border border-zinc-100 group/btn"
                    >
                      <Eye size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20 text-zinc-400">
                      <Bug size={48} />
                      <p className="text-xs font-bold uppercase tracking-[0.3em]">No incidents found matching filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Detail Sidebar / Drawer */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedIssue(null)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Drawer Header */}
            <div className="px-8 py-8 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <button 
                onClick={() => setSelectedIssue(null)}
                className="flex items-center gap-2 text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-widest transition-colors group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to List
              </button>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  selectedIssue.status === 'Open' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                  selectedIssue.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                )}>
                  {selectedIssue.status}
                </span>
                <button 
                  onClick={() => setSelectedIssue(null)}
                  className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              {/* Incident Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  <AlertCircle size={14} />
                  Incident Payload
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-black tracking-tighter mb-2">{selectedIssue.type}</h2>
                  <p className="text-zinc-500 text-sm font-medium tracking-tight">Reported on {new Date(selectedIssue.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Detailed Description</p>
                <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
                  <p className="text-zinc-600 text-sm leading-relaxed italic">
                    "{selectedIssue.description}"
                  </p>
                </div>
              </div>

              {/* Screenshot */}
              {selectedIssue.screenshot && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Visual Evidence</p>
                  <div className="rounded-2xl overflow-hidden border border-zinc-200 group relative shadow-sm">
                    <img src={selectedIssue.screenshot} alt="Issue" className="w-full object-contain max-h-[400px] bg-zinc-50" />
                    <a 
                      href={selectedIssue.screenshot} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-md text-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl border border-zinc-100"
                    >
                      <ExternalLink size={14} /> Full View
                    </a>
                  </div>
                </div>
              )}

              {/* System Metadata */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">System Telemetry</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Origin URL</p>
                    <p className="text-[10px] text-zinc-700 font-bold truncate">{selectedIssue.metadata.url}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">User Role</p>
                    <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">{selectedIssue.metadata.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="px-10 py-8 border-t border-zinc-100 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Update Lifecycle</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateIssueStatus(selectedIssue.id, 'In Progress')}
                      disabled={selectedIssue.status === 'In Progress'}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                        selectedIssue.status === 'In Progress' 
                          ? "bg-zinc-100 text-zinc-400 border border-zinc-200" 
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                      )}
                    >
                      <Clock size={14} />
                      Start Work
                    </button>
                    <button 
                      onClick={() => updateIssueStatus(selectedIssue.id, 'Resolved')}
                      disabled={selectedIssue.status === 'Resolved'}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                        selectedIssue.status === 'Resolved' 
                          ? "bg-emerald-50 text-emerald-500 border border-emerald-100" 
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                      )}
                    >
                      <CheckCircle2 size={14} />
                      Resolve
                    </button>
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

export default DeveloperIssues;
