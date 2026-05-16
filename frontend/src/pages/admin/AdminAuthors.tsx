import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Check, 
  X, 
  Eye, 
  Users, 
  Calendar, 
  GraduationCap, 
  UserCheck, 
  UserX, 
  Clock,
  MoreVertical,
  Mail,
  Award,
  Briefcase,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import AddReviewerModal from '../../components/admin/AddReviewerModal';
import { useNotification } from '../../utils/NotificationContext';

// Types
type ReviewerStatus = 'Pending' | 'Approved' | 'Rejected';

interface Reviewer {
  id: string;
  name: string;
  email: string;
  qualification: string;
  regDate: string;
  status: ReviewerStatus;
  experience?: string;
  rejectionReason?: string;
}

const AdminAuthors = () => {
  const { confirm, showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewerStatus | 'All'>('All');
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    const initialReviewers: Reviewer[] = [
      { 
        id: 'REV-102', 
        name: 'Dr. Aris Thorne', 
        email: 'aris.thorne@quantum.edu', 
        qualification: 'Ph.D. in Theoretical Physics', 
        regDate: '2024-03-20', 
        status: 'Pending',
        experience: '15+ years in quantum entanglement research. Editorial board member of JQP.'
      },
      { 
        id: 'REV-105', 
        name: 'Prof. Elena Sterling', 
        email: 'elena.s@topology.org', 
        qualification: 'D.Sc. in Mathematics', 
        regDate: '2024-03-18', 
        status: 'Approved',
        experience: 'Director of Topology Research Institute. 50+ published peer-reviewed articles.'
      },
      { 
        id: 'REV-108', 
        name: 'Michael Chang', 
        email: 'm.chang@cyber-sec.net', 
        qualification: 'M.S. in Cryptography', 
        regDate: '2024-03-15', 
        status: 'Pending',
        experience: 'Lead researcher at Global Security Labs. Focus on lattice-based cryptography.'
      },
      { 
        id: 'REV-110', 
        name: 'Sarah Jenkins', 
        email: 's.jenkins@bio-math.com', 
        qualification: 'Ph.D. in Biomathematics', 
        regDate: '2024-03-10', 
        status: 'Rejected',
        experience: 'Previous tenure at CDC modeling infectious diseases.'
      }
    ];

    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const storedReviewers = storedUsers
      .filter((u: any) => u.role === 'reviewer')
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        qualification: u.qualification,
        regDate: u.regDate,
        status: u.status,
        experience: u.experience
      }));

    setReviewers([...storedReviewers, ...initialReviewers]);
  }, []);

  const handleStatusUpdate = (id: string, newStatus: ReviewerStatus, reason?: string) => {
    setReviewers(prev => prev.map(rev => 
      rev.id === id ? { ...rev, status: newStatus, rejectionReason: reason } : rev
    ));
    if (selectedReviewer?.id === id) {
      setSelectedReviewer(prev => prev ? { ...prev, status: newStatus, rejectionReason: reason } : null);
    }
    showToast(`Reviewer ${newStatus.toLowerCase()} successfully`, newStatus === 'Approved' ? 'success' : 'error');
  };

  const initiateStatusUpdate = (id: string, newStatus: ReviewerStatus) => {
    setPendingActionId(id);
    if (newStatus === 'Approved') {
      setIsApproveModalOpen(true);
    } else if (newStatus === 'Rejected') {
      setRejectionReason('');
      setRejectionError('');
      setIsRejectModalOpen(true);
    }
  };

  const confirmApproval = () => {
    if (pendingActionId) {
      handleStatusUpdate(pendingActionId, 'Approved');
      setIsApproveModalOpen(false);
      setPendingActionId(null);
    }
  };

  const confirmRejection = () => {
    if (!rejectionReason.trim()) {
      setRejectionError('Please provide a rejection reason.');
      return;
    }
    if (pendingActionId) {
      handleStatusUpdate(pendingActionId, 'Rejected', rejectionReason);
      setIsRejectModalOpen(false);
      setPendingActionId(null);
    }
  };

  const filteredReviewers = reviewers.filter(rev => {
    const matchesSearch = rev.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         rev.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetails = (reviewer: Reviewer) => {
    setSelectedReviewer(reviewer);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <Users size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">System Governance</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Reviewer Management</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-xl leading-relaxed">Verify expert credentials, audit research backgrounds, and manage administrative portal access for peer reviewers.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-black text-white rounded-xl font-bold text-xs tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            ADD REVIEWER
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by identity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-full sm:w-64 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
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
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-black/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reviewer Profile</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Qualification</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Registered</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredReviewers.map((reviewer) => (
                <tr key={reviewer.id} className={cn(
                  "group transition-colors",
                  reviewer.status === 'Pending' ? "bg-amber-50/30" : "hover:bg-zinc-50/30"
                )}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-black font-['Outfit']">{reviewer.name}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{reviewer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-zinc-600 font-medium line-clamp-1 max-w-[200px]">
                      {reviewer.qualification}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs text-zinc-500 font-medium text-center">
                    {new Date(reviewer.regDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                      reviewer.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      reviewer.status === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                    )}>
                      {reviewer.status === 'Approved' ? <UserCheck size={12} /> : 
                       reviewer.status === 'Rejected' ? <UserX size={12} /> : 
                       <Clock size={12} />}
                      {reviewer.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openDetails(reviewer)}
                        className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-all"
                        title="View Detailed Profile"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {reviewer.status === 'Pending' ? (
                        <>
                          <button 
                            onClick={() => initiateStatusUpdate(reviewer.id, 'Approved')}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-100 shadow-sm"
                            title="Approve Reviewer"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => initiateStatusUpdate(reviewer.id, 'Rejected')}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-100 shadow-sm"
                            title="Reject Access"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <button className="p-2 text-zinc-200 cursor-not-allowed">
                          <MoreVertical size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviewer Details Modal */}
      {isModalOpen && selectedReviewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
            {/* Modal Header */}
            <div className="px-8 py-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/20">
                  <Award size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black tracking-tight font-['Outfit']">{selectedReviewer.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{selectedReviewer.id}</p>
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
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                    <Mail size={12} />
                    Verified Email
                  </div>
                  <p className="text-sm font-bold text-black">{selectedReviewer.email}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                    <Calendar size={12} />
                    Registration Timestamp
                  </div>
                  <p className="text-sm font-bold text-black">{new Date(selectedReviewer.regDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <GraduationCap size={14} />
                  Academic Credentials
                </div>
                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm font-medium text-zinc-700">
                  {selectedReviewer.qualification}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <Briefcase size={14} />
                  Research Domain & Experience
                </div>
                <div className="p-6 bg-zinc-50/50 rounded-2xl border border-zinc-100 border-dashed">
                  <p className="text-sm text-zinc-600 leading-relaxed italic">
                    "{selectedReviewer.experience || 'No detailed background provided.'}"
                  </p>
                </div>
              </div>
              
              {selectedReviewer.status === 'Rejected' && selectedReviewer.rejectionReason && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                    <AlertCircle size={14} />
                    Rejection Reason
                  </div>
                  <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 text-sm font-medium text-rose-700">
                    {selectedReviewer.rejectionReason}
                  </div>
                </div>
              )}

              {/* Status Specific Actions */}
              {selectedReviewer.status === 'Pending' ? (
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => initiateStatusUpdate(selectedReviewer.id, 'Approved')}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <UserCheck size={18} />
                    GRANT ACCESS
                  </button>
                  <button 
                    onClick={() => initiateStatusUpdate(selectedReviewer.id, 'Rejected')}
                    className="flex-1 py-4 bg-white text-rose-600 border border-rose-100 rounded-2xl font-bold text-xs tracking-widest hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <UserX size={18} />
                    DENY ENTRY
                  </button>
                </div>
              ) : (
                <div className={cn(
                  "p-5 rounded-2xl border flex items-center justify-center gap-3 font-bold text-[10px] uppercase tracking-[0.3em] shadow-sm",
                  selectedReviewer.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {selectedReviewer.status === 'Approved' ? <UserCheck size={18} /> : <UserX size={18} />}
                  Identity Token {selectedReviewer.status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AddReviewerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={(newReviewer) => {
          setReviewers(prev => [newReviewer, ...prev]);
        }}
      />

      {/* Approval Confirmation Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsApproveModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="px-8 py-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Approve Reviewer?</h3>
                <p className="text-sm text-zinc-400 font-medium">Are you sure you want to approve this user as a reviewer? They will gain access to the peer review portal.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsApproveModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl font-bold text-[10px] tracking-widest transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmApproval}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-600/20 uppercase"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsRejectModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="px-8 py-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500">
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Reject Reviewer</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Reviewer access denial</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Reason for Rejection</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      if (e.target.value.trim()) setRejectionError('');
                    }}
                    placeholder="Enter the specific reason for rejecting this application..."
                    className={cn(
                      "w-full h-32 bg-zinc-800/50 border rounded-2xl p-5 text-white text-sm focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none",
                      rejectionError ? "border-rose-500/50" : "border-white/10 focus:border-rose-500/50"
                    )}
                  />
                  {rejectionError && (
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-1">{rejectionError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl font-bold text-[10px] tracking-widest transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmRejection}
                  className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-[10px] tracking-widest transition-all shadow-lg shadow-rose-600/20 uppercase"
                >
                  Reject Reviewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuthors;
