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
  AlertCircle,
  Loader2,
  User,
  Shield,
  FileText
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDate } from '../../utils/dateHelpers';
import AddReviewerModal from '../../components/admin/AddReviewerModal';
import { useNotification } from '../../utils/NotificationContext';
import { getReviewers, updateReviewerStatus, resendReviewerCredentials } from '../../services/user.service';
import { SkeletonTable } from '../../components/skeletons/SkeletonTable';

// Types
type ReviewerStatus = 'Pending' | 'Approved' | 'Rejected' | 'Deactivated';

interface Reviewer {
  id: string;
  name: string;
  email: string;
  qualification: string;
  regDate: string;
  status: ReviewerStatus;
  experience?: string;
  rejectionReason?: string;
  profileImage?: string | null;
  mustChangePassword?: boolean;
  credentialsShared?: boolean;
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
  const [loading, setLoading] = useState(true);

  // Redesigned Reviewer Modal states
  const [detailedReviewer, setDetailedReviewer] = useState<any>(null);
  const [reviewedArticles, setReviewedArticles] = useState<any[]>([]);
  const [reviewerMetrics, setReviewerMetrics] = useState({ total: 0, completed: 0, pending: 0 });

  useEffect(() => {
    if (isModalOpen && selectedReviewer) {
      // 1. Fetch full details from Firestore 'users' collection
      const fetchUserDetails = async () => {
        try {
          const docRef = doc(db, 'users', selectedReviewer.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setDetailedReviewer(docSnap.data());
          }
        } catch (err) {
          console.error('Failed to load user details:', err);
        }
      };

      // 2. Fetch reviewed articles and metrics
      const fetchReviewedManuscripts = async () => {
        try {
          const q = query(
            collection(db, 'articles'),
            where('assignedReviewers', 'array-contains', selectedReviewer.id)
          );
          const snap = await getDocs(q);
          const total = snap.size;
          const docs = snap.docs.map(doc => {
            const data = doc.data();
            const rev = data.reviews?.[selectedReviewer.id];
            return {
              id: doc.id,
              title: data.title || 'Untitled Article',
              status: rev?.recommendation || 'Pending Review',
              date: rev?.updatedAt ? formatDate(rev.updatedAt) : 'Pending'
            };
          });
          
          const completedCount = docs.filter(d => d.status !== 'Pending Review').length;
          const pendingCount = total - completedCount;
          
          setReviewedArticles(docs);
          setReviewerMetrics({
            total,
            completed: completedCount,
            pending: pendingCount
          });
        } catch (err) {
          console.error('Failed to load reviewed articles:', err);
        }
      };

      fetchUserDetails();
      fetchReviewedManuscripts();
    } else {
      setDetailedReviewer(null);
      setReviewedArticles([]);
      setReviewerMetrics({ total: 0, completed: 0, pending: 0 });
    }
  }, [isModalOpen, selectedReviewer]);

  useEffect(() => {
    const fetchReviewersList = async () => {
      try {
        const response = await getReviewers();
        if (response.success) {
          setReviewers(response.reviewers);
        }
      } catch (error) {
        console.error('Failed to load reviewers:', error);
        showToast('Failed to load reviewers list.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReviewersList();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: ReviewerStatus, reason?: string) => {
    try {
      const response = await updateReviewerStatus(id, newStatus, reason);
      if (response.success) {
        setReviewers(prev => prev.map(rev => 
          rev.id === id ? { ...rev, status: newStatus, rejectionReason: reason } : rev
        ));
        
        if (selectedReviewer?.id === id) {
          setSelectedReviewer(prev => prev ? { ...prev, status: newStatus, rejectionReason: reason } : null);
        }
        showToast(`Reviewer ${newStatus.toLowerCase()} successfully`, newStatus === 'Approved' ? 'success' : 'error');
      }
    } catch (error: any) {
      console.error('Failed to update reviewer status:', error);
      showToast(error.response?.data?.error || 'Failed to update status', 'error');
    }
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

  const handleResendCredentials = async (reviewer: Reviewer) => {
    confirm({
      title: 'Resend Credentials',
      message: `Are you sure you want to regenerate and resend login credentials to ${reviewer.name} (${reviewer.email})?\n\nThis will invalidate their previous temporary password.`,
      confirmText: 'Resend',
      onConfirm: async () => {
        try {
          const response = await resendReviewerCredentials(reviewer.id);
          if (response.success) {
            showToast('Credentials have been sent successfully.', 'success');
            setReviewers(prev => prev.map(r => r.id === reviewer.id ? { ...r, credentialsShared: true } : r));
          }
        } catch (error: any) {
          console.error('Failed to resend credentials:', error);
          showToast(error.response?.data?.error || 'Failed to resend credentials.', 'error');
        }
      }
    });
  };
  const handleToggleActive = async (reviewerId: string, newStatus: 'Approved' | 'Deactivated') => {
    const isDeactivating = newStatus === 'Deactivated';
    confirm({
      title: isDeactivating ? 'Deactivate Reviewer' : 'Reactivate Reviewer',
      message: isDeactivating 
        ? 'Are you sure you want to deactivate this reviewer? They will be signed out and blocked from logging in immediately.'
        : 'Are you sure you want to reactivate this reviewer? They will regain full access to their reviewer dashboard.',
      confirmText: isDeactivating ? 'Deactivate' : 'Reactivate',
      onConfirm: async () => {
        try {
          const response = await updateReviewerStatus(reviewerId, newStatus);
          if (response.success) {
            showToast(
              isDeactivating ? 'Reviewer deactivated successfully.' : 'Reviewer reactivated successfully.', 
              'success'
            );
            // Update local reviewers state list
            setReviewers(prev => prev.map(r => r.id === reviewerId ? { ...r, status: newStatus } : r));
          }
        } catch (error: any) {
          console.error(`Failed to ${isDeactivating ? 'deactivate' : 'reactivate'} reviewer:`, error);
          showToast(error.response?.data?.error || `Failed to update reviewer status.`, 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 animate-fade-in">
        <div className="flex justify-between items-end gap-6 mb-6">
          <div className="space-y-2">
            <div className="h-8 skeleton-box rounded w-48" />
            <div className="h-4 skeleton-box rounded w-64" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 skeleton-box rounded-xl w-36" />
            <div className="h-10 skeleton-box rounded-xl w-48" />
            <div className="h-10 skeleton-box rounded-xl w-36" />
          </div>
        </div>
        <SkeletonTable rowsCount={4} colsCount={5} />
      </div>
    );
  }

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
                <option value="Deactivated">Deactivated</option>
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
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm overflow-hidden">
                        {reviewer.profileImage ? (
                          <img src={reviewer.profileImage} alt={reviewer.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-black font-['Outfit']">{reviewer.name}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold lowercase tracking-wider">{reviewer.email}</p>
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
                      reviewer.status === 'Deactivated' ? "bg-zinc-100 text-zinc-600 border-zinc-200" :
                      "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                    )}>
                      {reviewer.status === 'Approved' ? <UserCheck size={12} /> : 
                       reviewer.status === 'Rejected' ? <UserX size={12} /> : 
                       reviewer.status === 'Deactivated' ? <UserX size={12} className="text-zinc-500" /> :
                       <Clock size={12} />}
                      {reviewer.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openDetails(reviewer)}
                        className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer"
                      >
                        View Profile
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
                      ) : reviewer.status === 'Approved' ? (
                        <div className="flex items-center gap-2">
                          {reviewer.mustChangePassword && !reviewer.credentialsShared && (
                            <button 
                              onClick={() => handleResendCredentials(reviewer)}
                              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-[10px] font-black tracking-widest text-zinc-700 rounded-lg transition-all border border-zinc-200 shadow-sm uppercase cursor-pointer"
                              title="Resend Credentials"
                            >
                              Resend
                            </button>
                          )}
                          <button 
                            onClick={() => handleToggleActive(reviewer.id, 'Deactivated')}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-[10px] font-black tracking-widest text-rose-600 rounded-lg transition-all border border-rose-100 shadow-sm uppercase cursor-pointer"
                            title="Deactivate Reviewer"
                          >
                            Deactivate
                          </button>
                        </div>
                      ) : reviewer.status === 'Deactivated' ? (
                        <button 
                          onClick={() => handleToggleActive(reviewer.id, 'Approved')}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-black tracking-widest text-emerald-600 rounded-lg transition-all border border-emerald-100 shadow-sm uppercase cursor-pointer"
                          title="Reactivate Reviewer"
                        >
                          Reactivate
                        </button>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title-reviewer"
            className="relative w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[95vh] sm:rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-white/10 overflow-hidden"
          >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/40 to-transparent z-0 h-48" />

            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-20 p-2 hover:bg-white/10 rounded-full transition-all"
              aria-label="Close Reviewer Details Modal"
            >
              <X size={20} />
            </button>

            {/* Modal Content */}
            <div className="relative z-10 flex flex-col overflow-y-auto flex-1 min-h-0 p-6 sm:p-10 space-y-8 custom-scrollbar">
              {/* Top Banner Section */}
              <div className="bg-zinc-900/50 backdrop-blur-md rounded-[2rem] border border-white/5 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-50" />
                
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center relative">
                    {detailedReviewer?.profileImage ? (
                      <img src={detailedReviewer.profileImage} alt={selectedReviewer.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-zinc-600" />
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left relative z-10">
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">{selectedReviewer.name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800/80 rounded-full border border-white/10">
                      <Shield size={14} className="text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">REVIEWER</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        JOINED {new Date(selectedReviewer.regDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs italic mb-2">Verified reviewer of the Kerala Mathematical Association</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">ID: {selectedReviewer.id}</p>
                </div>

                {/* About Reviewer Section */}
                <div className="w-full md:w-72 shrink-0">
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 h-full relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">About Reviewer</h3>
                    </div>
                    <div className="text-xs space-y-2 text-zinc-300">
                      <p><strong className="text-zinc-500 uppercase text-[9px] tracking-wider block mb-0.5">Research Domain:</strong> {detailedReviewer?.researchDomain || selectedReviewer.experience || 'Mathematics'}</p>
                      <p><strong className="text-zinc-500 uppercase text-[9px] tracking-wider block mb-0.5">Area of Expertise:</strong> {detailedReviewer?.areaOfExpertise || 'Pure & Applied Math'}</p>
                      <p><strong className="text-zinc-500 uppercase text-[9px] tracking-wider block mb-0.5">Biography:</strong> <span className="italic">"{detailedReviewer?.bio || 'Verified mathematical reviewer.'}"</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Cards Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5">
                  <div className="flex items-center gap-3 mb-8">
                    <Users size={18} className="text-zinc-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Account Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Full Name</label>
                      <p className="text-sm font-bold text-white">{selectedReviewer.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
                      <p className="text-sm font-bold text-white lowercase">{selectedReviewer.email}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Phone Number</label>
                      <p className={cn("text-sm font-bold", detailedReviewer?.phone ? "text-white" : "text-zinc-600 italic")}>
                        {detailedReviewer?.phone || "Not Provided"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Qualification</label>
                      <p className="text-sm font-bold text-white">{selectedReviewer.qualification || "Not Provided"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Designation</label>
                      <p className={cn("text-sm font-bold", detailedReviewer?.designation ? "text-white" : "text-zinc-600 italic")}>
                        {detailedReviewer?.designation || "Not Provided"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Institution</label>
                      <p className={cn("text-sm font-bold", detailedReviewer?.institution ? "text-white" : "text-zinc-600 italic")}>
                        {detailedReviewer?.institution || "Not Provided"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Research Domain</label>
                      <p className={cn("text-sm font-bold", (detailedReviewer?.researchDomain || selectedReviewer.experience) ? "text-white" : "text-zinc-600 italic")}>
                        {detailedReviewer?.researchDomain || selectedReviewer.experience || "Not Provided"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Years of Experience</label>
                      <p className={cn("text-sm font-bold", detailedReviewer?.yearsOfExperience ? "text-white" : "text-zinc-600 italic")}>
                        {detailedReviewer?.yearsOfExperience || "Not Provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reviewer Credibility Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Award size={18} className="text-zinc-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Reviewer Credibility</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Identity Verification</label>
                        <p className="text-xs font-bold text-emerald-400">Verified Reviewer</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Reviewer Status</label>
                        <div>
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border mt-1",
                            selectedReviewer.status === 'Approved' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30' :
                            selectedReviewer.status === 'Pending' ? 'bg-amber-950/40 text-amber-400 border-amber-800/30' :
                            'bg-rose-950/40 text-rose-400 border-rose-800/30'
                          )}>
                            {selectedReviewer.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Reviews Assigned</label>
                        <p className="text-sm font-bold text-white">{reviewerMetrics.total}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Reviews Completed</label>
                        <p className="text-sm font-bold text-white">{reviewerMetrics.completed}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Reviews Pending</label>
                        <p className="text-sm font-bold text-white">{reviewerMetrics.pending}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Average Review Time</label>
                        <p className="text-sm font-bold text-white">3-5 Days</p>
                      </div>
                    </div>
                  </div>

                  {/* Pending actions or status token */}
                  <div>
                    {selectedReviewer.status === 'Pending' ? (
                      <div className="flex gap-4 pt-4 border-t border-white/5">
                        <button 
                          onClick={() => initiateStatusUpdate(selectedReviewer.id, 'Approved')}
                          className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UserCheck size={18} />
                          GRANT ACCESS
                        </button>
                        <button 
                          onClick={() => initiateStatusUpdate(selectedReviewer.id, 'Rejected')}
                          className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-rose-400 border border-white/10 rounded-2xl font-bold text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UserX size={18} />
                          DENY ENTRY
                        </button>
                      </div>
                    ) : (
                      <div className={cn(
                        "p-4 rounded-2xl border flex items-center justify-center gap-3 font-bold text-[10px] uppercase tracking-[0.3em] shadow-sm",
                        selectedReviewer.status === 'Approved' ? "bg-emerald-955/20 text-emerald-400 border-emerald-800/30" : "bg-rose-955/20 text-rose-400 border-rose-800/30"
                      )}>
                        {selectedReviewer.status === 'Approved' ? <UserCheck size={18} /> : <UserX size={18} />}
                        Identity Token {selectedReviewer.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Reason inside details card if status is Rejected */}
              {selectedReviewer.status === 'Rejected' && selectedReviewer.rejectionReason && (
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                    <AlertCircle size={14} />
                    Rejection Reason
                  </div>
                  <div className="p-5 bg-rose-950/20 rounded-2xl border border-rose-800/30 text-sm font-medium text-rose-400">
                    {selectedReviewer.rejectionReason}
                  </div>
                </div>
              )}

              {/* Reviewed Articles Section */}
              <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-zinc-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Reviewed Articles ({reviewedArticles.length})</h3>
                </div>
                
                {reviewedArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviewedArticles.map((art) => (
                      <div 
                        key={art.id} 
                        className="p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                            {art.title}
                          </h4>
                          <span className={cn(
                            "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                            art.status === 'Approved' || art.status === 'Accepted' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30' :
                            art.status === 'Rejected' ? 'bg-rose-950/40 text-rose-400 border-rose-800/30' :
                            'bg-amber-950/40 text-amber-400 border-amber-800/30'
                          )}>
                            {art.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                          <span>ID: {art.id}</span>
                          <span>{art.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-8 text-center bg-white/5 border border-white/5 rounded-2xl">
                    No articles reviewed yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AddReviewerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={(newReviewer) => {
          setReviewers(prev => {
            const exists = prev.some(r => r.id === newReviewer.id);
            if (exists) {
              return prev.map(r => r.id === newReviewer.id ? { ...r, ...newReviewer } : r);
            }
            return [newReviewer, ...prev];
          });
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
